import { pdfTextColorMatcher } from "@/services/pdfTextPaint.service";
jest.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
    OPS: {
        save: 10,
        restore: 11,
        setFillRGBColor: 59,
        setFillColorN: 55,
        showText: 44,
        showSpacedText: 45,
    },
}));
const glyphs = (text: string) => [...text].map((unicode) => ({ unicode }));
it("associates mixed text colors while respecting saved graphics states", () => {
    const matcher = pdfTextColorMatcher({
        fnArray: [59, 44, 10, 59, 44, 11, 44],
        argsArray: [
            ["#215e99"],
            [glyphs("Blue")],
            [],
            ["#ee0000"],
            [glyphs("Red")],
            [],
            [glyphs("Blue again")],
        ],
    });
    expect(matcher.match("Blue Red")).toEqual([
        { text: "Blue ", color: "#215e99" },
        { text: "Red", color: "#ee0000" },
    ]);
    expect(matcher.match("Blue again")).toEqual([
        { text: "Blue again", color: "#215e99" },
    ]);
    expect(matcher.reviewRequired()).toBe(false);
});
it("supports normalized ligatures and numeric RGB and flags unmapped text", () => {
    const matcher = pdfTextColorMatcher({
        fnArray: [59, 44],
        argsArray: [[1, 0, 0], [glyphs("ﬁle")]],
    });
    expect(matcher.match("file")[0].color).toBe("#ff0000");
    expect(matcher.match("unknown")[0].color).toBe("#000000");
    expect(matcher.reviewRequired()).toBe(true);
});
