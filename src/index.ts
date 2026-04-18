import { transformerColorizedBrackets } from '@shikijs/colorized-brackets';
import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from '@shikijs/transformers';
import { LANG_NAMES, langDisplayName } from '@utils/langDisplayName.js';
import { Marked } from 'marked';
import markedAlert from 'marked-alert';
import markedFootnote from 'marked-footnote';
import markedShiki from 'marked-shiki';
import { gfmHeadingId as markedGfmHeadingId } from 'marked-gfm-heading-id';
import { createHighlighter } from 'shiki';

const preloadLangs = Object.keys(LANG_NAMES).filter((lang) => lang !== 'text');
const highlighter = await createHighlighter({
  themes: ['github-dark'],
  langs: preloadLangs,
});

export async function renderMarkdown(md: string): Promise<string> {
  const marked = new Marked({
    async: true,
    breaks: true,
  })
  .use(markedAlert())
  .use(markedFootnote())
  .use(markedGfmHeadingId())
  .use({
    hooks: {
      postprocess: (html) => {
        return html.replace(/<h([2-6]) id="([^"]+)">([\s\S]+?)<\/h\2>/g, (_, level, id, content) => {
          return `
            <h${level} id="${id}">
              <a class="heading-anchor" href="#${id}" aria-label="Link to this section"></a>
              ${content}
            </h${level}>`;
        });
      }
    }
  })
  .use(markedShiki({
    highlight(code, lang, props) {
      const resolvedLang = preloadLangs.includes(lang) ? lang : 'text';
      const displayLang = langDisplayName(lang);
      const inner = highlighter.codeToHtml(code, {
        lang: resolvedLang,
        theme: 'github-dark',
        meta: { __raw: props.join(' ') },
        transformers: [
          transformerNotationDiff({ matchAlgorithm: 'v3' }),
          transformerNotationHighlight({ matchAlgorithm: 'v3' }),
          transformerNotationWordHighlight({ matchAlgorithm: 'v3' }),
          transformerNotationErrorLevel({ matchAlgorithm: 'v3' }),
          transformerColorizedBrackets(),
        ],
      });
      // Encode the raw source for the data attribute so the copy button can
      // write the original text without parsing Shiki's token HTML.
      const safeCode = code.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
      return [
        `<div class="code-block" data-code="${safeCode}">`,
        `<button class="copy-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block').dataset.code).then(()=>{this.textContent='Copied!';this.classList.add('copied');setTimeout(()=>{this.textContent='Copy';this.classList.remove('copied')},2000)})">Copy</button>`,
        `<span class="code-lang">${displayLang}</span>`,
        inner,
        `</div>`,
      ].join('');
    },
  }));

  return await marked.parse(md);
}
