import type { ShikiTransformer } from 'shiki';

// Matches a line whose entire content is a single [!code ...] annotation
// comment — covering JS/TS (//), Python/Shell (#), SQL/Haskell (--),
// C-style block (/* … */), and HTML (<!-- … -->).
const ANNOTATION_ONLY =
  /^\s*(?:\/\/|#|--|\/\*|<!--)\s*\[!code\s[^\]]*\](?:\s*(?:\*\/|-->))?\s*$/;

export function transformerLineNumbers(): ShikiTransformer {
  const annotationLineNums = new Set<number>();

  return {
    name: 'transformer-line-numbers',
    preprocess(code) {
      // Reset per-block state.
      annotationLineNums.clear();
      code.split('\n').forEach((rawLine, i) => {
        if (ANNOTATION_ONLY.test(rawLine)) annotationLineNums.add(i);
      });
    },
    line(node, lineNum) {
      if (annotationLineNums.has(lineNum)) {
        // Annotation-only line — mark for removal in the code hook.
        node.properties['data-annotation'] = true;
      } else if (node.children.length === 0) {
        // Genuine blank source line.
        node.properties['data-blank-line'] = true;
      }
    },
    pre(node) {
      node.properties['data-line-numbers'] = true;
    },
    code(node) {
      // remove annotation lines
      node.children = node.children.filter((child) => {
        if (child.type !== 'element') return true;
        if (child.properties['data-annotation']) return false;
        return true;
      });

      // assign sequential line numbers to surviving lines.
      let num = 0;
      for (const child of node.children) {
        if (child.type !== 'element') continue;
        child.children.unshift({
          type: 'element',
          tagName: 'span',
          properties: { class: 'line-number' },
          children: [{ type: 'text', value: String(++num) }],
        });
      }
    },
  };
}
