import { describe, expect, it } from 'vitest';

const sources = import.meta.glob<string>(
  '../src/features/documentation/content/**/*.mdx',
  { eager: true, query: '?raw', import: 'default' }
);
const pages = import.meta.glob<{
  default: unknown;
  frontmatter: { title: string; description: string };
  toc: { url: string; depth: number }[];
}>('../src/features/documentation/content/**/*.mdx', { eager: true });

describe('bundled documentation', () => {
  it('preserves Markdown text for search and export alongside compiled MDX', () => {
    expect(Object.keys(pages)).toHaveLength(9);
    for (const [path, page] of Object.entries(pages)) {
      expect(typeof page.default).toBe('function');
      expect(page.frontmatter.title).toBeTruthy();
      expect(page.frontmatter.description).toBeTruthy();
      expect(page.toc.length).toBeGreaterThan(0);
      expect(typeof sources[path]).toBe('string');
      expect(sources[path]).toMatch(/^---\r?\n/);
      expect(sources[path]).toContain(page.frontmatter.title);
      expect(sources[path]).not.toContain('function MDXContent');
    }
  });

  it('keeps every documentation link on a bundled page', () => {
    for (const source of Object.values(sources)) {
      for (const [, url] of source.matchAll(
        /\]\((\/docs[^)#\s]*)(?:#[^)]*)?\)/g
      )) {
        const slug = url.replace(/^\/docs\/?/, '');
        const prefix = '../src/features/documentation/content/';
        expect(
          `${prefix}${slug}.mdx` in pages ||
            `${prefix}${slug ? `${slug}/` : ''}index.mdx` in pages,
          `Missing documentation target: ${url}`
        ).toBe(true);
      }
    }
  });
});
