import { OPS } from "pdfjs-dist/legacy/build/pdf.mjs";

type OperatorList = { fnArray: number[]; argsArray: unknown[][] };
type Matrix = number[];

export type PdfTextRun = {
    text: string;
    x: number;
    y: number;
    width: number;
    size: number;
    font: string;
    color?: string;
    startsWithLigature?: boolean;
    endsWithLigature?: boolean;
};

export type PdfRule = {
    x: number;
    y: number;
    width: number;
    thickness: number;
    color: string;
};

const asMatrix = (value: unknown): Matrix | null => {
    if (!value) return null;
    const raw = Array.from(value as ArrayLike<number>);
    return raw.length >= 6 && raw.every((n) => typeof n === "number")
        ? raw.slice(0, 6)
        : null;
};

const apply = (ctm: Matrix, x: number, y: number) => ({
    x: ctm[0] * x + ctm[2] * y + ctm[4],
    y: ctm[1] * x + ctm[3] * y + ctm[5],
});

const multiply = (ctm: Matrix, a: number, b: number, c: number, d: number, e: number, f: number): Matrix => [
    ctm[0] * a + ctm[2] * b,
    ctm[1] * a + ctm[3] * b,
    ctm[0] * c + ctm[2] * d,
    ctm[1] * c + ctm[3] * d,
    ctm[0] * e + ctm[2] * f + ctm[4],
    ctm[1] * e + ctm[3] * f + ctm[5],
];

const colorOf = (args: unknown[]) => {
    const raw = args[0];
    if (typeof raw === "string" && /^#[0-9a-f]{6}$/i.test(raw))
        return raw.toLowerCase();
    if (args.length === 3 && args.every((value) => typeof value === "number")) {
        const values = args as number[];
        const scale = Math.max(...values) <= 1 ? 255 : 1;
        return (
            "#" +
            values
                .map((value) =>
                    Math.round(Math.max(0, Math.min(255, value * scale)))
                        .toString(16)
                        .padStart(2, "0"),
                )
                .join("")
        );
    }
    return "#000000";
};

// Path ops packed by pdf.js: 0 x y move, 1 x y line, 2 six curve coords, 4 close.
function pathPoints(data: ArrayLike<number>, ctm: Matrix) {
    const points: { x: number; y: number }[][] = [];
    let current: { x: number; y: number }[] = [];
    let i = 0;
    const read = () => {
        const point = apply(ctm, data[i], data[i + 1]);
        i += 2;
        return point;
    };
    while (i < data.length) {
        const op = data[i++];
        if (op === 0) {
            if (current.length) points.push(current);
            current = [read()];
        } else if (op === 1) current.push(read());
        else if (op === 2) {
            i += 4;
            current.push(read());
        } else if (op === 3 || op === 4) {
            if (current.length) points.push(current);
            current = [];
        } else break;
    }
    if (current.length) points.push(current);
    return points;
}

export function pdfHorizontalRules(
    operators: OperatorList,
    pageWidth: number,
    pageHeight: number,
): PdfRule[] {
    let ctm: Matrix = [1, 0, 0, 1, 0, 0];
    const stack: Matrix[] = [];
    let lineWidth = 1;
    let stroke = "#000000";
    let fill = "#000000";
    const rules: PdfRule[] = [];
    const add = (rule: PdfRule) => {
        if (
            rule.width < 18 ||
            rule.width > pageWidth * 0.98 ||
            rule.x < -20 ||
            rule.x > pageWidth + 20 ||
            rule.y < 4 ||
            rule.y > pageHeight - 4
        )
            return;
        rules.push(rule);
    };
    for (let index = 0; index < operators.fnArray.length; index++) {
        const op = operators.fnArray[index];
        const args = operators.argsArray[index] ?? [];
        if (op === OPS.save) stack.push([...ctm]);
        else if (op === OPS.restore) ctm = stack.pop() ?? [1, 0, 0, 1, 0, 0];
        else if (op === OPS.transform && args.length >= 6)
            ctm = multiply(
                ctm,
                Number(args[0]),
                Number(args[1]),
                Number(args[2]),
                Number(args[3]),
                Number(args[4]),
                Number(args[5]),
            );
        else if (op === OPS.setLineWidth) lineWidth = Number(args[0]) || 1;
        else if (op === OPS.setStrokeRGBColor) stroke = colorOf(args);
        else if (op === OPS.setFillRGBColor) fill = colorOf(args);
        else if (op === OPS.constructPath) {
            const paint = Number(args[0]);
            const packed = args[1];
            const data =
                Array.isArray(packed) && packed[0] ? (packed[0] as ArrayLike<number>) : null;
            if (!data || (paint !== OPS.stroke && paint !== OPS.fill && paint !== OPS.fillStroke))
                continue;
            for (const subpath of pathPoints(data, ctm)) {
                if (subpath.length < 2) continue;
                const xs = subpath.map((point) => point.x);
                const ys = subpath.map((point) => point.y);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);
                const width = maxX - minX;
                const height = maxY - minY;
                if (paint === OPS.stroke && subpath.length === 2 && height <= 1.5 && width >= 18)
                    add({
                        x: minX,
                        y: (minY + maxY) / 2,
                        width,
                        thickness: Math.max(0.4, Math.min(2.5, lineWidth)),
                        color: stroke,
                    });
                else if (paint !== OPS.stroke && height <= 2.4 && width >= 18)
                    add({
                        x: minX,
                        y: (minY + maxY) / 2,
                        width,
                        thickness: Math.max(0.4, Math.min(2.5, height || 0.6)),
                        color: fill,
                    });
            }
        }
    }
    return rules;
}

type Glyph = { unicode?: string; fontChar?: string; width?: number };

export function pdfTextRuns(
    operators: OperatorList,
    options: {
        fontName: (id: string) => string;
        repair: (unicode: string, fontChar: string | undefined, fontId: string) => string;
        color: (original: string) => string;
    },
): PdfTextRun[] {
    let ctm: Matrix = [1, 0, 0, 1, 0, 0];
    // Text state parameters belong to the graphics state, so q/Q restores them.
    const textStates: {
        ctm: Matrix;
        fontId: string;
        fontSize: number;
        charSpacing: number;
        wordSpacing: number;
        hScale: number;
        leading: number;
    }[] = [];
    let tm: Matrix = [1, 0, 0, 1, 0, 0];
    let fontId = "";
    let fontSize = 1;
    let charSpacing = 0;
    let wordSpacing = 0;
    let hScale = 100;
    let leading = 0;
    const runs: PdfTextRun[] = [];

    const move = (tx: number, ty: number) => {
        tm = [
            tm[0],
            tm[1],
            tm[2],
            tm[3],
            tm[4] + tx * tm[0] + ty * tm[2],
            tm[5] + tx * tm[1] + ty * tm[3],
        ];
    };

    const show = (glyphs: unknown[]) => {
        const scale = Math.hypot(tm[0], tm[1]) || 1;
        const size = Math.min(72, Math.max(4, scale * (fontSize || 1)));
        let run: PdfTextRun | null = null;
        const flush = () => {
            if (run?.text) runs.push(run);
            run = null;
        };
        for (const glyph of glyphs) {
            if (typeof glyph === "number") {
                // pdf.js keeps TJ adjustments in thousandths of an em. They
                // change the next glyph's origin, so the run's advance must
                // include them or the following word is split by a false gap.
                const adjust = (-glyph / 1000) * size * (hScale / 100);
                if (run) run.width += adjust;
                move(adjust / scale, 0);
                continue;
            }
            const item = glyph as Glyph;
            const chars = item?.unicode ?? "";
            const position = apply(ctm, tm[4], tm[5]);
            const advance =
                (((item?.width || 0) / 1000) * size +
                    charSpacing +
                    (chars === " " ? wordSpacing : 0)) *
                (hScale / 100);
            if (!chars) {
                if (run) run.width += advance;
                move(advance / scale, 0);
                continue;
            }
            const text = options.repair(chars, item.fontChar, fontId);
            const ligature = text.length > 1 && [...chars].length === 1;
            const color = options.color(chars);
            const font = options.fontName(fontId);
            if (run && run.color === color && run.font === font) {
                run.text += text;
                run.width += advance;
                run.endsWithLigature = ligature;
            } else {
                flush();
                run = {
                    text,
                    x: position.x,
                    y: position.y,
                    width: Math.max(advance, 0.1),
                    size,
                    font,
                    color,
                    startsWithLigature: ligature,
                    endsWithLigature: ligature,
                };
            }
            move(advance / scale, 0);
        }
        flush();
    };

    for (let index = 0; index < operators.fnArray.length; index++) {
        const op = operators.fnArray[index];
        const args = operators.argsArray[index] ?? [];
        if (op === OPS.save)
            textStates.push({
                ctm: [...ctm],
                fontId,
                fontSize,
                charSpacing,
                wordSpacing,
                hScale,
                leading,
            });
        else if (op === OPS.restore) {
            const saved = textStates.pop();
            ctm = saved?.ctm ?? [1, 0, 0, 1, 0, 0];
            if (saved)
                ({ fontId, fontSize, charSpacing, wordSpacing, hScale, leading } =
                    saved);
        } else if (op === OPS.transform && args.length >= 6)
            ctm = multiply(
                ctm,
                Number(args[0]),
                Number(args[1]),
                Number(args[2]),
                Number(args[3]),
                Number(args[4]),
                Number(args[5]),
            );
        else if (op === OPS.beginText) tm = [1, 0, 0, 1, 0, 0];
        else if (op === OPS.setFont) {
            fontId = String(args[0] ?? "");
            fontSize = Number(args[1]) || 1;
        } else if (op === OPS.setCharSpacing) charSpacing = Number(args[0]) || 0;
        else if (op === OPS.setWordSpacing) wordSpacing = Number(args[0]) || 0;
        else if (op === OPS.setHScale) hScale = Number(args[0]) || 100;
        else if (op === OPS.setLeading) leading = Number(args[0]) || 0;
        else if (op === OPS.setTextMatrix) {
            const next = asMatrix(args[0]) ?? asMatrix(args);
            if (next) tm = next;
        } else if (op === OPS.moveText) move(Number(args[0]) || 0, Number(args[1]) || 0);
        else if (op === OPS.setLeadingMoveText) {
            leading = -(Number(args[1]) || 0);
            move(Number(args[0]) || 0, Number(args[1]) || 0);
        } else if (op === OPS.nextLine) move(0, -leading);
        else if (op === OPS.showText || op === OPS.showSpacedText) {
            const glyphs = args[0];
            if (Array.isArray(glyphs)) show(glyphs);
        }
    }
    return runs;
}
