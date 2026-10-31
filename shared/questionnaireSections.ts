/** Canonical VWL section title from the DATEV Personalbogen. */
export const VWL_QUESTIONNAIRE_SECTION =
  "VWL - nur notwendig, wenn Vertrag vorliegt";

/** Sections BSB can switch off before the form is sent to the worker. */
export const OPTIONAL_QUESTIONNAIRE_SECTIONS = [
  VWL_QUESTIONNAIRE_SECTION,
] as const;

export function isOptionalQuestionnaireSection(section: string) {
  const trimmed = section.trim();
  if (OPTIONAL_QUESTIONNAIRE_SECTIONS.includes(
    trimmed as (typeof OPTIONAL_QUESTIONNAIRE_SECTIONS)[number],
  ))
    return true;
  // Renamed templates still count as VWL when the title starts with it.
  return /^vwl\b/i.test(trimmed);
}

/** Short heading for the card; optional sections keep a one-line hint. */
export function questionnaireSectionHeading(section: string): {
  title: string;
  hint?: string;
} {
  const trimmed = section.trim();
  if (isOptionalQuestionnaireSection(trimmed) && /^vwl\b/i.test(trimmed)) {
    return {
      title: "VWL",
      hint: "Nur notwendig, wenn ein Vertrag vorliegt",
    };
  }
  return { title: trimmed };
}

export function sectionItemTitle(item: {
  kind?: string;
  title?: string;
  section?: string;
}) {
  if (item.kind === "section") return (item.title ?? "").trim();
  return (item.section ?? "").trim();
}

type Omitable = {
  kind?: string;
  title?: string;
  section?: string;
  omitFromWorker?: boolean;
};

export function setSectionOmitted<T extends Omitable>(
  items: T[],
  section: string,
  omitted: boolean,
): T[] {
  return items.map((item) => {
    if (sectionItemTitle(item) !== section) return item;
    if (!omitted) {
      const { omitFromWorker: _drop, ...rest } = item;
      return rest as T;
    }
    return { ...item, omitFromWorker: true };
  });
}

export function sectionIsOmitted(items: Omitable[], section: string) {
  const inSection = items.filter((item) => sectionItemTitle(item) === section);
  return inSection.length > 0 && inSection.every((item) => item.omitFromWorker);
}

export function withoutOmittedSections<T extends { omitFromWorker?: boolean }>(
  items: T[],
) {
  return items.filter((item) => !item.omitFromWorker);
}

/** Stable key for a seeded section headline. */
export function questionnaireSectionKey(title: string) {
  const slug = title
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `section.${slug || "abschnitt"}`;
}

/** Insert explicit headline markers before each new section group. */
export function withSectionHeadlines<
  T extends { kind: string; section?: string; title?: string; key: string },
>(items: T[]): (T | {
  kind: "section";
  key: string;
  title: string;
  optional?: boolean;
})[] {
  const out: (T | {
    kind: "section";
    key: string;
    title: string;
    optional?: boolean;
  })[] = [];
  let last = "";
  const seen = new Set<string>();
  for (const item of items) {
    if (item.kind === "section") {
      out.push(item);
      last = sectionItemTitle(item);
      seen.add(item.key);
      continue;
    }
    const section = (item.section ?? "").trim();
    if (section && section !== last) {
      let key = questionnaireSectionKey(section);
      if (seen.has(key)) key = `${key}-${seen.size}`;
      seen.add(key);
      out.push({
        kind: "section",
        key,
        title: section,
        optional: isOptionalQuestionnaireSection(section) || undefined,
      });
      last = section;
    }
    out.push(item);
  }
  return out;
}

/**
 * Move selected members under a new headline.
 * `insertAt` is the index in the current item list (gap position).
 */
export function placeSectionHeadline<
  T extends { kind: string; key: string; section?: string },
>(
  items: T[],
  insertAt: number,
  headline: { key: string; title: string; optional?: boolean },
  memberKeys: string[],
): (T | {
  kind: "section";
  key: string;
  title: string;
  optional?: boolean;
})[] {
  const selected = new Set(memberKeys);
  const members = items
    .filter((item) => selected.has(item.key) && item.kind !== "section")
    .map((item) => ({ ...item, section: headline.title }));
  const rest = items.filter((item) => !selected.has(item.key));
  const at = Math.max(
    0,
    Math.min(
      items.slice(0, insertAt).filter((item) => !selected.has(item.key)).length,
      rest.length,
    ),
  );
  return [
    ...rest.slice(0, at),
    {
      kind: "section" as const,
      key: headline.key,
      title: headline.title,
      optional: headline.optional || undefined,
    },
    ...members,
    ...rest.slice(at),
  ];
}

/** After a drag, assign each field/repeater the preceding headline title. */
export function syncItemsToHeadlines<
  T extends { kind: string; section?: string; title?: string },
>(items: T[]): T[] {
  let current = "";
  return items.map((item) => {
    if (item.kind === "section") {
      current = (item.title ?? "").trim();
      return item;
    }
    if (!current) return item;
    return { ...item, section: current };
  });
}
