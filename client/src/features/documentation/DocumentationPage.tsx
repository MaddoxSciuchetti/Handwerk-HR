import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { useLocation } from '@tanstack/react-router';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import { i18nProvider } from 'fumadocs-ui/i18n';
import { translations } from './translations';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { DocsBody, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Callout } from 'fumadocs-ui/components/callout';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogInput,
  SearchDialogList,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import type * as PageTree from 'fumadocs-core/page-tree';
import type { TOCItemType } from 'fumadocs-core/toc';
import type { MDXProps } from 'mdx/types';

type DocumentModule = {
  default: ComponentType<MDXProps>;
  frontmatter: { title: string; description?: string };
  toc: TOCItemType[];
};
type Meta = { title?: string; pages: string[]; defaultOpen?: boolean };
const modules = import.meta.glob<DocumentModule>('./content/**/*.mdx', {
  eager: true,
});
const markdown = import.meta.glob<string>('./content/**/*.mdx', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const metadata = import.meta.glob<Meta>('./content/**/meta.json', {
  eager: true,
  import: 'default',
});
const pages = Object.entries(modules).map(([path, module]) => {
  const slug = path
    .replace('./content/', '')
    .replace(/\.mdx$/, '')
    .replace(/(^|\/)index$/, '');
  return {
    ...module,
    path,
    url: `/docs${slug ? `/${slug}` : ''}`,
    markdown: markdown[path],
  };
});

function pageItem(path: string): PageTree.Item {
  const page = pages.find((item) => item.path === `./content/${path}.mdx`);
  if (!page) throw new Error(`Documentation page missing: ${path}`);
  return { type: 'page', name: page.frontmatter.title, url: page.url };
}

function folderItems(directory = ''): PageTree.Node[] {
  const meta = metadata[`./content/${directory}meta.json`];
  return meta.pages.map((name) => {
    const path = `${directory}${name}`;
    const folder = metadata[`./content/${path}/meta.json`];
    if (!folder) return pageItem(path);
    return {
      type: 'folder',
      name: folder.title ?? name,
      defaultOpen: folder.defaultOpen,
      index: folder.pages.includes('index')
        ? pageItem(`${path}/index`)
        : undefined,
      children: folderItems(`${path}/`).filter(
        (item) => item.type !== 'page' || item.url !== `/docs/${path}`
      ),
    };
  });
}
const tree: PageTree.Root = { name: 'Dokumentation', children: folderItems() };

function Hint({
  title = 'Hinweis',
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <Callout type="idea" title={title}>
      {children}
    </Callout>
  );
}
const components = { ...defaultMdxComponents, Hint };

function LocalSearch(props: SharedProps) {
  const [search, setSearch] = useState('');
  const terms = search
    .toLocaleLowerCase('de')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const results = pages
    .filter((page) =>
      terms.every((term) =>
        `${page.frontmatter.title} ${page.markdown}`
          .toLocaleLowerCase('de')
          .includes(term)
      )
    )
    .map((page) => ({
      id: page.url,
      type: 'page' as const,
      url: page.url,
      content: page.frontmatter.title,
    }));
  return (
    <SearchDialog {...props} search={search} onSearchChange={setSearch}>
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogInput
            placeholder="Dokumentation durchsuchen…"
            aria-label="Dokumentation durchsuchen"
          />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList
          items={results}
          Empty={() => (
            <p className="p-4 text-sm">Keine Ergebnisse gefunden.</p>
          )}
        />
      </SearchDialogContent>
    </SearchDialog>
  );
}

function markdownDataUrl(markdown: string) {
  return `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`;
}

export default function DocumentationPage() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const page = pages.find((item) => item.url === pathname.replace(/\/+$/, ''));
  const markdownUrl = page ? markdownDataUrl(page.markdown) : '';
  useEffect(() => {
    const previous = document.title;
    const previousLanguage = document.documentElement.lang;
    document.title = `${page?.frontmatter.title ?? 'Seite nicht gefunden'} · Hadox Dokumentation`;
    document.documentElement.lang = 'de';
    return () => {
      document.title = previous;
      document.documentElement.lang = previousLanguage;
    };
  }, [page]);
  const Content = page?.default;
  return (
    <RootProvider
      i18n={i18nProvider(translations)}
      search={{ SearchDialog: LocalSearch }}
    >
      <DocsLayout
        tree={tree}
        nav={{ title: 'Zur Anwendung', url: '/cockpit' }}
        themeSwitch={{ enabled: false }}
        sidebar={{
          defaultOpenLevel: 1,
          footer: (
            <div className="flex justify-end">
              <ThemeSwitch mode="light-dark" />
            </div>
          ),
        }}
      >
        {page && Content && markdownUrl ? (
          <DocsPage key={page.url} toc={page.toc}>
            <DocsTitle>{page.frontmatter.title}</DocsTitle>
            <DocsBody>
              <Content components={components} />
            </DocsBody>
          </DocsPage>
        ) : (
          <DocsPage toc={[]}>
            <DocsTitle>Seite nicht gefunden</DocsTitle>
            <DocsBody>
              <p>Diese Dokumentationsseite existiert nicht.</p>
              <a href="/docs">Zur Dokumentation</a>
            </DocsBody>
          </DocsPage>
        )}
      </DocsLayout>
    </RootProvider>
  );
}
