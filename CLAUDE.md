# CLAUDE.md

## Project Overview

A personal preset for `marked` to generate GitHub-flavored Markdown with syntax highlighting, and extended features. Published on GitHub Package Registry.

## Core Dependencies

- **Parser:** `marked`
- **Syntax Highlighting:** `shiki`
- **Extensions:** `marked-alert`, `marked-footnote`, `marked-shiki`

## Project Structure

```plain
.
├── src/
│   ├── index.ts
│   └── utils/ (Optional)
├── tests/
└── package.json
```

## Build & Fmt Commands

```bash
yarn add [-D] <package> # Install dependencies
yarn build # Build the project
yarn fmt # Format code with Oxfmt
yarn dev # Start simple development server
yarn test # Run tests with Vitest
```

## Code Style & Patterns

- **Wrapper Pattern:** Always expose a primary wrapper function (e.g., parseMarkdown(md, options)) that orchestrates the extensions and sanitization.
- **Shiki Integration:** Use marked-shiki to bridge marked and shiki.
  - The wrapper function must accept a theme or highlightConfig option to allow dynamic switching of Shiki themes/classes.
- **TypeScript:** Use strict typing for options interfaces.

## Implementation Logic

The wrapper function should follow this sequence:

1. Initialize `marked` with `marked-alert`, `marked-cjk-breaks`, `marked-footnote`.
2. Configure `marked-shiki` to use `shiki` for syntax highlighting.
3. Execute `marked.parse(markdown)`.
4. Sanitize the resulting HTML string using `dompurify` before returning.

## Tips

### CSS

- Always use HEX color codes in CSS for consistent theming, e.g., `#RRGGBB` instead of color names or RGB values.
  - Except for `transparent` and `currentColor`, which are allowed.
  - Using alpha value is allowed in pseudo-elements, e.g. `::before { background-color: rgba(255, 0, 0, 0.5); }`.
