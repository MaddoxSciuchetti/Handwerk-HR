// Pages/Quartz embeds Calibri ligatures (tt, ti, ft, …) but writes a
// one-character ToUnicode entry. The drawn glyph is still the ligature.
// Recover the letters from that glyph instead of the wrong code point.

type Seg = [number, number, number, number];
type Outline = { segs: Seg[]; adv: number };

const W = 32;
const H = 20;

function raster(segs: Seg[], box: { minX: number; maxX: number; minY: number; maxY: number }) {
    const cells = new Uint8Array(W * H);
    const scale = Math.min(
        (W - 2) / (box.maxX - box.minX || 1),
        (H - 2) / (box.maxY - box.minY || 1),
    );
    for (const [x1, y1, x2, y2] of segs) {
        const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * scale));
        for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            const cx = Math.floor((x - box.minX) * scale) + 1;
            const cy = Math.floor((box.maxY - y) * scale) + 1;
            if (cx >= 0 && cy >= 0 && cx < W && cy < H) cells[cy * W + cx] = 1;
        }
    }
    return cells;
}

function difference(a: Uint8Array, b: Uint8Array) {
    let delta = 0;
    let union = 0;
    for (let i = 0; i < a.length; i++) {
        if (a[i] || b[i]) union++;
        if (a[i] !== b[i]) delta++;
    }
    return union ? delta / union : 1;
}

export function createLigatureRepair(fontBytes: Uint8Array | undefined) {
    const identity = (unicode: string) => unicode.normalize("NFKC");
    if (!fontBytes || fontBytes.length < 12) return identity;
    const font = readFont(fontBytes);
    if (!font) return identity;
    const cache = new Map<number, string | null>();
    return (unicode: string, fontChar?: string) => {
        const expanded = unicode.normalize("NFKC");
        if (expanded !== unicode || [...unicode].length !== 1) return expanded;
        const drawn = font.glyphFor(fontChar?.codePointAt(0));
        const claimed = font.glyphFor(unicode.codePointAt(0));
        if (drawn == null || drawn === claimed) return unicode;
        if (cache.has(drawn)) return cache.get(drawn) ?? unicode;
        const letters = font.identifyLigature(drawn);
        cache.set(drawn, letters);
        return letters ?? unicode;
    };
}

function readFont(bytes: Uint8Array) {
    const buf = Buffer.from(bytes);
    const u16 = (o: number) => buf.readUInt16BE(o);
    const u32 = (o: number) => buf.readUInt32BE(o);
    const i16 = (o: number) => buf.readInt16BE(o);
    if (buf.length < 12 || buf.toString("latin1", 0, 4) !== "\x00\x01\x00\x00")
        return null;
    const tables: Record<string, number> = {};
    const count = u16(4);
    for (let i = 0; i < count; i++) {
        const o = 12 + i * 16;
        tables[buf.toString("latin1", o, o + 4)] = u32(o + 8);
    }
    if (
        tables.cmap == null ||
        tables.glyf == null ||
        tables.loca == null ||
        tables.head == null ||
        tables.hmtx == null ||
        tables.maxp == null
    )
        return null;
    const numGlyphs = u16(tables.maxp + 4);
    const locaFmt = i16(tables.head + 50);
    const loca = (g: number) =>
        locaFmt === 0
            ? u16(tables.loca + g * 2) * 2
            : u32(tables.loca + g * 4);
    const advance = (g: number) => u16(tables.hmtx + g * 4);

    const segsOf = (glyph: number, dx: number, dy: number, seen: Set<number>): Seg[] => {
        if (seen.has(glyph) || glyph < 0 || glyph >= numGlyphs) return [];
        seen.add(glyph);
        const start = tables.glyf + loca(glyph);
        const end = tables.glyf + loca(glyph + 1);
        if (end <= start) return [];
        const contours = i16(start);
        if (contours < 0) {
            let p = start + 10;
            const out: Seg[] = [];
            while (p + 4 <= end) {
                const flags = u16(p);
                p += 2;
                const component = u16(p);
                p += 2;
                let ax: number;
                let ay: number;
                if (flags & 1) {
                    ax = i16(p);
                    ay = i16(p + 2);
                    p += 4;
                } else {
                    ax = buf.readInt8(p);
                    ay = buf.readInt8(p + 1);
                    p += 2;
                }
                if (flags & 8) p += 2;
                else if (flags & 64) p += 4;
                else if (flags & 128) p += 8;
                const ox = flags & 2 ? ax : 0;
                const oy = flags & 2 ? ay : 0;
                out.push(...segsOf(component, dx + ox, dy + oy, seen));
                if (!(flags & 32)) break;
            }
            return out;
        }
        if (!contours) return [];
        let p = start + 10;
        const ends: number[] = [];
        for (let i = 0; i < contours; i++) {
            ends.push(u16(p));
            p += 2;
        }
        const pointCount = ends.at(-1)! + 1;
        const instruction = u16(p);
        p += 2 + instruction;
        const flags: number[] = [];
        while (flags.length < pointCount && p < end) {
            const flag = buf[p++];
            flags.push(flag);
            if (flag & 8) {
                const repeat = buf[p++];
                for (let i = 0; i < repeat; i++) flags.push(flag);
            }
        }
        if (flags.length < pointCount) return [];
        let x = 0;
        const xs: number[] = [];
        for (const flag of flags) {
            if (flag & 2) {
                const delta = buf[p++];
                x += flag & 16 ? delta : -delta;
            } else if (!(flag & 16)) {
                x += i16(p);
                p += 2;
            }
            xs.push(x + dx);
        }
        let y = 0;
        const ys: number[] = [];
        for (const flag of flags) {
            if (flag & 4) {
                const delta = buf[p++];
                y += flag & 32 ? delta : -delta;
            } else if (!(flag & 32)) {
                y += i16(p);
                p += 2;
            }
            ys.push(y + dy);
        }
        let contourStart = 0;
        const segs: Seg[] = [];
        for (const contourEnd of ends) {
            for (let i = contourStart; i <= contourEnd; i++) {
                const j = i === contourEnd ? contourStart : i + 1;
                segs.push([xs[i], ys[i], xs[j], ys[j]]);
            }
            contourStart = contourEnd + 1;
        }
        return segs;
    };

    const outlines = new Map<number, Outline | null>();
    const outline = (glyph: number) => {
        if (outlines.has(glyph)) return outlines.get(glyph) ?? null;
        const segs = segsOf(glyph, 0, 0, new Set());
        const value = segs.length ? { segs, adv: advance(glyph) } : null;
        outlines.set(glyph, value);
        return value;
    };

    const cmapStart = tables.cmap;
    const encodingCount = u16(cmapStart + 2);
    let format4 = 0;
    for (let i = 0; i < encodingCount; i++) {
        const record = cmapStart + 4 + i * 8;
        const offset = cmapStart + u32(record + 4);
        if (u16(offset) === 4 && (u16(record) === 3 || !format4)) format4 = offset;
    }
    const glyphForCode = new Map<number, number>();
    if (format4) {
        const segCount = u16(format4 + 6) / 2;
        const end = format4 + 14;
        const start = end + segCount * 2 + 2;
        const delta = start + segCount * 2;
        const range = delta + segCount * 2;
        for (let s = 0; s < segCount; s++) {
            const last = u16(end + s * 2);
            const first = u16(start + s * 2);
            const idDelta = i16(delta + s * 2);
            const idRange = u16(range + s * 2);
            for (let code = first; code <= last && code < 0xffff; code++) {
                let glyph = 0;
                if (idRange === 0) glyph = (code + idDelta) & 0xffff;
                else {
                    glyph = u16(range + s * 2 + idRange + (code - first) * 2);
                    if (glyph) glyph = (glyph + idDelta) & 0xffff;
                }
                if (glyph) glyphForCode.set(code, glyph);
            }
        }
    }

    const letters: { ch: string; outline: Outline }[] = [];
    for (const [code, glyph] of glyphForCode) {
        if (code >= 0xe000) continue;
        const ch = String.fromCodePoint(code);
        if (!/^[\p{L}]$/u.test(ch)) continue;
        const drawn = outline(glyph);
        if (drawn) letters.push({ ch, outline: drawn });
    }

    const boxFor = (drawn: Outline) => {
        const xs = drawn.segs.flatMap((seg) => [seg[0], seg[2]]);
        const ys = drawn.segs.flatMap((seg) => [seg[1], seg[3]]);
        return {
            minX: Math.min(0, ...xs),
            maxX: Math.max(drawn.adv, ...xs),
            minY: -400,
            maxY: 1150,
        };
    };

    return {
        glyphFor: (code: number | undefined) =>
            code == null ? undefined : glyphForCode.get(code),
        identifyLigature(glyph: number) {
            const drawn = outline(glyph);
            if (!drawn || letters.length < 2) return null;
            const box = boxFor(drawn);
            const image = raster(drawn.segs, box);
            let single = 2;
            let pair = { text: "", score: 2 };
            let lower = { text: "", score: 2 };
            for (const first of letters) {
                single = Math.min(
                    single,
                    difference(image, raster(first.outline.segs, box)),
                );
                if (first.outline.adv > drawn.adv * 1.05) continue;
                for (const second of letters) {
                    if (second.outline.adv > drawn.adv) continue;
                    const text = first.ch + second.ch;
                    const from = Math.max(40, drawn.adv - second.outline.adv - 180);
                    const to = Math.max(from, Math.min(drawn.adv, first.outline.adv + 40));
                    for (let shift = from; shift <= to; shift += 40) {
                        const moved = second.outline.segs.map(
                            ([x1, y1, x2, y2]) =>
                                [x1 + shift, y1, x2 + shift, y2] as Seg,
                        );
                        const score = difference(
                            image,
                            raster(first.outline.segs.concat(moved), box),
                        );
                        if (score < pair.score) pair = { text, score };
                        if (
                            score < lower.score &&
                            /^[\p{Ll}ß]+$/u.test(text)
                        )
                            lower = { text, score };
                        if (pair.score < 0.04) break;
                    }
                    if (pair.score < 0.04) break;
                }
                if (pair.score < 0.04) break;
            }
            const chosen =
                lower.score <= pair.score + 0.05 ? lower : pair;
            if (chosen.score < 0.16 && chosen.score + 0.04 < single)
                return chosen.text;
            return null;
        },
    };
}
