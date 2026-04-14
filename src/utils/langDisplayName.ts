export const LANG_NAMES: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  tsx: 'TSX',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  toml: 'TOML',
  yaml: 'YAML',
  dotenv: '.env',
  rs: 'Rust',
  cs: 'C#',
  csharp: 'C#',
  cpp: 'C++',
  java: 'Java',
  kt: 'Kotlin',
  py: 'Python',
  shell: 'Shell',
  powershell: 'PowerShell',
  sql: 'SQL',
  md: 'Markdown',
  mdx: 'MDX',
  diff: 'Diff',
  nix: 'Nix',
  dockerfile: 'Dockerfile',
  text: 'Text',
};

/**
 * Returns a human-readable display name for a fenced code block language
 * identifier. Falls back to `"Text"` for any unrecognised value.
 */
export function langDisplayName(lang: string): string {
  return LANG_NAMES[lang.toLowerCase()] ?? 'Text';
}
