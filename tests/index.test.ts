import { describe, expect, it } from 'vitest';
import parseMarkdown from '../src/index';

describe('parseMarkdown', () => {
  describe('basic rendering', () => {
    it('renders headings', async () => {
      const result = await parseMarkdown('# Hello');
      expect(result).toContain('<h1>Hello</h1>');
    });

    it('renders bold and italic inline', async () => {
      const result = await parseMarkdown('**bold** and _italic_');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });

    it('renders links', async () => {
      const result = await parseMarkdown('[GitHub](https://github.com)');
      expect(result).toContain('<a href="https://github.com">GitHub</a>');
    });

    it('renders unordered lists', async () => {
      const result = await parseMarkdown('- foo\n- bar');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>foo</li>');
      expect(result).toContain('<li>bar</li>');
    });

    it('renders ordered lists', async () => {
      const result = await parseMarkdown('1. first\n2. second');
      expect(result).toContain('<ol>');
      expect(result).toContain('<li>first</li>');
      expect(result).toContain('<li>second</li>');
    });

    it('renders blockquotes', async () => {
      const result = await parseMarkdown('> quote');
      expect(result).toContain('<blockquote>');
    });

    it('renders horizontal rules', async () => {
      const result = await parseMarkdown('---');
      expect(result).toContain('<hr');
    });

    it('returns empty string for empty input', async () => {
      const result = await parseMarkdown('');
      expect(result).toBe('');
    });
  });

  describe('line breaks (breaks: true)', () => {
    it('converts single newline to <br>', async () => {
      const result = await parseMarkdown('line one\nline two');
      expect(result).toContain('<p>line one<br>line two</p>');
    });
  });

  describe('syntax highlighting (marked-shiki + shiki)', () => {
    it('wraps fenced code block in shiki <pre><code>', async () => {
      const result = await parseMarkdown('```js\nconst x = 1;\n```');
      expect(result).toContain('<pre');
      expect(result).toContain('<code>');
    });

    it('applies shiki nord theme class for preloaded language', async () => {
      const result = await parseMarkdown('```ts\nconst x: number = 1;\n```');
      expect(result).toContain('shiki');
      expect(result).toContain('nord');
    });

    it('emits per-token color spans for preloaded language', async () => {
      // Shiki outputs inline style="color:..." on individual token spans
      const result = await parseMarkdown('```js\nconst x = 1;\n```');
      expect(result).toMatch(/style="[^"]*color:/);
    });

    it('wraps each line in <span class="line">', async () => {
      const result = await parseMarkdown('```ts\nconst a = 1;\nconst b = 2;\n```');
      const lineMatches = result.match(/<span class="line"/g);
      expect(lineMatches).not.toBeNull();
      expect(lineMatches!.length).toBeGreaterThanOrEqual(2);
    });

    it('preserves code content in output', async () => {
      const result = await parseMarkdown('```py\nprint("hello")\n```');
      expect(result).toContain('print');
      expect(result).toContain('hello');
    });
  });

  describe('not-preloaded or unknown language fallback', () => {
    it('does not throw for an unknown language', async () => {
      await expect(parseMarkdown('```unknownlang\nfoo\n```')).resolves.toBeDefined();
    });

    it('still renders <pre><code> for an unknown language', async () => {
      const result = await parseMarkdown('```unknownlang\nfoo bar\n```');
      expect(result).toContain('<pre');
      expect(result).toContain('<code>');
    });

    it('preserves code content for an unknown language', async () => {
      const result = await parseMarkdown('```unknownlang\nfoo bar\n```');
      expect(result).toContain('foo bar');
    });

    it('does not throw for a not-preloaded language (ruby)', async () => {
      // 'ruby' is valid in Shiki but absent from preloadLangs → falls back to text
      await expect(parseMarkdown('```ruby\nputs "hello"\n```')).resolves.toBeDefined();
    });

    it('still renders <pre><code> for a not-preloaded language', async () => {
      const result = await parseMarkdown('```ruby\nputs "hello"\n```');
      expect(result).toContain('<pre');
      expect(result).toContain('<code>');
    });

    it('preserves code content for a not-preloaded language', async () => {
      const result = await parseMarkdown('```ruby\nputs "hello"\n```');
      expect(result).toContain('puts');
    });

    it('emits no per-token color spans when falling back to text', async () => {
      // With the 'text' lang, Shiki renders lines but no individual token styling
      const result = await parseMarkdown('```unknownlang\nfoo bar baz\n```');
      // Extract only the <pre> block to avoid false positives from surrounding HTML
      const pre = result.match(/<pre[\s\S]*?<\/pre>/)?.[0] ?? '';
      // A 'text' block has exactly one span per line with no nested color spans
      expect(pre).not.toMatch(/<span[^>]*style="[^"]*color:[^"]*"[^>]*>[^<]{1,}/);
    });
  });

  describe('marked-alert extension', () => {
    it('renders GitHub-style note alert', async () => {
      const result = await parseMarkdown('> [!NOTE]\n> This is a note.');
      expect(result).toContain('markdown-alert');
    });

    it('renders GitHub-style warning alert', async () => {
      const result = await parseMarkdown('> [!WARNING]\n> This is a warning.');
      expect(result).toContain('markdown-alert');
    });
  });

  describe('marked-footnote extension', () => {
    it('renders footnote reference link', async () => {
      const result = await parseMarkdown('Text[^1]\n\n[^1]: Footnote body.');
      expect(result).toContain('footnote');
    });

    it('renders footnote definition body', async () => {
      const result = await parseMarkdown('Text[^1]\n\n[^1]: Footnote body.');
      expect(result).toContain('Footnote body.');
    });
  });

  describe('return type', () => {
    it('resolves to a string', async () => {
      const result = await parseMarkdown('hello');
      expect(typeof result).toBe('string');
    });
  });
});
