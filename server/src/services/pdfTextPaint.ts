import { OPS } from "pdfjs-dist/legacy/build/pdf.mjs";

type OperatorList = { fnArray: number[]; argsArray: unknown[][] };
type ColoredText = { text: string; color: string };
const normalized = (text: string) => text.normalize("NFKC").replace(/\s/gu, "");

// getTextContent exposes glyph geometry but not text paint colors. Follow the
// actual graphics-state stack, then associate painted Unicode with text items
// in content-stream order (before any geometric sorting).
export function pdfTextColorMatcher(operators: OperatorList) {
    let color = "#000000";
    const stack: string[] = [];
    let painted = "";
    const colors: string[] = [];
    let cursor = 0;
    let unmatched = 0;
    let unsupportedColors = 0;
    for (let index = 0; index < operators.fnArray.length; index++) {
        const op = operators.fnArray[index];
        const args = operators.argsArray[index];
        if (op === OPS.save) stack.push(color);
        else if (op === OPS.restore) color = stack.pop() ?? "#000000";
        else if (op === OPS.setFillRGBColor) {
            const raw = args[0];
            if (typeof raw === "string" && /^#[0-9a-f]{6}$/i.test(raw))
                color = raw.toLowerCase();
            else if (
                args.length === 3 &&
                args.every((value) => typeof value === "number")
            ) {
                const values = args as number[];
                const scale = Math.max(...values) <= 1 ? 255 : 1;
                color =
                    "#" +
                    values
                        .map((value) =>
                            Math.round(
                                Math.max(0, Math.min(255, value * scale)),
                            )
                                .toString(16)
                                .padStart(2, "0"),
                        )
                        .join("");
            } else unsupportedColors++;
        } else if (op === OPS.setFillColorN) unsupportedColors++;
        else if (op === OPS.showText || op === OPS.showSpacedText) {
            const glyphs = args[0];
            if (!Array.isArray(glyphs)) continue;
            const text = normalized(
                glyphs
                    .map((glyph: { unicode?: string } | number) =>
                        typeof glyph === "object" ? (glyph.unicode ?? "") : "",
                    )
                    .join(""),
            );
            painted += text;
            for (let i = 0; i < text.length; i++) colors.push(color);
        }
    }
    return {
        match(text: string): ColoredText[] {
            const needle = normalized(text);
            const at = painted.indexOf(needle, cursor);
            if (!needle || at < 0 || at - cursor > 500) {
                unmatched++;
                return [{ text, color: "#000000" }];
            }
            cursor = at + needle.length;
            let offset = 0;
            const result: ColoredText[] = [];
            for (const character of text) {
                const length = normalized(character).length;
                const previous = result.at(-1);
                const nextColor =
                    (!length ? previous?.color : undefined) ??
                    colors[at + Math.min(offset, needle.length - 1)] ??
                    "#000000";
                offset += length;
                if (previous?.color === nextColor) previous.text += character;
                else result.push({ text: character, color: nextColor });
            }
            return result;
        },
        reviewRequired: () => unmatched > 0 || unsupportedColors > 0,
    };
}
