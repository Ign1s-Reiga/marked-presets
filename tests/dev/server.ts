import { createServer } from 'http';
import { readdir, readFile } from 'fs/promises';
import { basename, dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';
import parseMarkdown from '../../src/index.js';

const ROOT = dirname(fileURLToPath(import.meta.url));

const SAMPLES_DIR = join(ROOT, 'samples');
const PORT = 3001;

async function getSampleFiles(): Promise<string[]> {
  const entries = await readdir(SAMPLES_DIR);
  return entries.filter((f) => extname(f) === '.md').sort();
}

function shell(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>marked-presets dev</title>
  <link rel="stylesheet" href="/styles/code.css">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { display: flex; height: 100dvh; font-family: system-ui, sans-serif; background: #1a1a2e; color: #e0e0e0; }

    #sidebar {
      width: 220px;
      flex-shrink: 0;
      background: #16213e;
      border-right: 1px solid #0f3460;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    #sidebar h2 {
      padding: 16px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .1em;
      color: #888;
      border-bottom: 1px solid #0f3460;
    }
    #file-list { list-style: none; overflow-y: auto; flex: 1; padding: 8px 0; }
    #file-list li button {
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      padding: 8px 16px;
      font-size: 13px;
      color: #aaa;
      cursor: pointer;
      border-radius: 0;
      transition: background .15s, color .15s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #file-list li button:hover { background: #0f3460; color: #e0e0e0; }
    #file-list li button.active { background: #0f3460; color: #e94560; font-weight: 600; }

    #main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    #toolbar {
      padding: 10px 20px;
      background: #16213e;
      border-bottom: 1px solid #0f3460;
      font-size: 12px;
      color: #888;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #toolbar span { color: #e94560; font-weight: 600; }

    #preview {
      flex: 1;
      overflow-y: auto;
      padding: 32px 48px;
      transition: background-color .2s;
    }
    #preview.loading { opacity: .4; pointer-events: none; }

    /* Dev-server layout constraint — not part of the distributed package */
    .md-body { max-width: 780px; transition: background-color .2s; }

    /* Theme toggle button in toolbar */
    #theme-btn {
      margin-left: auto;
      background: none;
      border: 1px solid #0f3460;
      border-radius: 5px;The background colors of the blockquote and th elements in the light theme appear a bit too light; please fix this.
      color: #888;
      font-size: 11px;
      padding: 3px 10px;
      cursor: pointer;
      transition: background .15s, color .15s, border-color .15s;
      user-select: none;
    }
    #theme-btn:hover { background: #0f3460; color: #e0e0e0; border-color: #1a5276; }

    /* ── Light theme ─────────────────────────────────────────────────────────── */
    :root[data-color-scheme="light"] { color-scheme: light; }
    :root[data-color-scheme="light"] #preview { background: #fff; }
    :root[data-color-scheme="light"] .md-body  { background: #fff; color: var(--mp-text-primary); }

    /* ── Dark theme ──────────────────────────────────────────────────────────── */
    :root[data-color-scheme="dark"] { color-scheme: dark; }
    :root[data-color-scheme="dark"] #preview { background: #161616; }
    :root[data-color-scheme="dark"] .md-body  { background: #161616; }
  </style>
</head>
<body>
  <nav id="sidebar">
    <h2>Samples</h2>
    <ul id="file-list"></ul>
  </nav>
  <div id="main">
    <div id="toolbar">Viewing: <span id="current-file">—</span><button id="theme-btn" onclick="toggleTheme()"></button></div>
    <div id="preview"><p id="empty">Select a file from the sidebar.</p></div>
  </div>
  <script>
    const fileList = document.getElementById('file-list');
    const preview = document.getElementById('preview');
    const currentFile = document.getElementById('current-file');
    const themeBtn = document.getElementById('theme-btn');
    let activeBtn = null;

    function setTheme(theme) {
      document.documentElement.dataset.colorScheme = theme;
      themeBtn.textContent = theme === 'dark' ? '☀ Light' : '● Dark';
      localStorage.setItem('mp-dev-theme', theme);
    }

    function toggleTheme() {
      setTheme(document.documentElement.dataset.colorScheme === 'dark' ? 'light' : 'dark');
    }

    // Initialise from localStorage, falling back to the OS preference.
    const saved = localStorage.getItem('mp-dev-theme');
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(saved ?? preferred);

    async function loadFiles() {
      const res = await fetch('/api/files');
      const files = await res.json();
      fileList.innerHTML = '';
      files.forEach(name => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.textContent = name;
        btn.title = name;
        btn.onclick = () => renderFile(name, btn);
        li.appendChild(btn);
        fileList.appendChild(li);
      });
      if (files.length > 0) renderFile(files[0], fileList.querySelector('button'));
    }

    async function renderFile(name, btn) {
      if (activeBtn) activeBtn.classList.remove('active');
      activeBtn = btn;
      btn.classList.add('active');
      currentFile.textContent = name;
      preview.classList.add('loading');
      const res = await fetch('/api/render?file=' + encodeURIComponent(name));
      const html = await res.text();
      preview.innerHTML = '<div class="md-body">' + html + '</div>';
      preview.classList.remove('loading');
      preview.scrollTop = 0;
    }

    loadFiles();
  </script>
</body>
</html>`;
}

function log(method: string, path: string, status: number, ms: number, extra?: string) {
  const color = status < 300 ? '\x1b[32m' : status < 400 ? '\x1b[33m' : '\x1b[31m';
  const reset = '\x1b[0m';
  const dim = '\x1b[2m';
  const suffix = extra ? ` ${dim}(${extra})${reset}` : '';
  console.log(`${color}${status}${reset} ${dim}${method}${reset} ${path} ${dim}+${ms}ms${reset}${suffix}`);
}

const server = createServer(async (req, res) => {
  const start = Date.now();
  const method = req.method ?? 'GET';
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(shell());
    log(method, url.pathname, 200, Date.now() - start);
    return;
  }

  if (url.pathname === '/styles/code.css') {
    try {
      const css = await readFile(join(ROOT, '../../src/styles/code.css'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
      res.end(css);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
    log(method, url.pathname, 200, Date.now() - start);
    return;
  }

  if (url.pathname === '/api/files') {
    const files = await getSampleFiles().catch(() => [] as string[]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(files));
    log(method, url.pathname, 200, Date.now() - start, `${files.length} file(s)`);
    return;
  }

  if (url.pathname === '/api/render') {
    const file = url.searchParams.get('file');
    if (!file || extname(file) !== '.md' || file.includes('..')) {
      res.writeHead(400);
      res.end('Invalid file');
      log(method, url.pathname, 400, Date.now() - start, `rejected: ${file ?? '(empty)'}`);
      return;
    }
    try {
      const md = await readFile(join(SAMPLES_DIR, basename(file)), 'utf8');
      const html = await parseMarkdown(md);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      log(method, url.pathname, 200, Date.now() - start, file);
    } catch (err) {
      res.writeHead(404);
      res.end('File not found');
      log(method, url.pathname, 404, Date.now() - start, `${file}: ${(err as Error).message}`);
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
  log(method, url.pathname, 404, Date.now() - start);
});

server.listen(PORT, () => {
  console.log(`\x1b[1mmarked-presets dev server\x1b[0m → \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`\x1b[2msamples dir: ${SAMPLES_DIR}\x1b[0m`);
});
