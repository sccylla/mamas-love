'use strict';
// Local equivalent of the Vercel static site + Node API functions.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const env = path.join(root, '.env');
if (fs.existsSync(env) && process.loadEnvFile) process.loadEnvFile(env);
const handlers = Object.fromEntries(['admin', 'posts', 'media', 'comments', 'studio', 'studio-video'].map(name => [`/api/${name}`, require(`../api/${name}`)]));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.zip': 'application/zip', '.webmanifest': 'application/manifest+json' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (handlers[url.pathname]) return await handlers[url.pathname](req, res);
    let pathname = decodeURIComponent(url.pathname);
    if (/^\/video-studio\/?$/.test(pathname)) pathname = '/video-studio/index.html';
    if (pathname === '/') pathname = '/index.html';
    if (/^\/[a-z-]+$/.test(pathname)) pathname += '.html';
    const file = path.resolve(root, `.${pathname}`);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || relative.split(path.sep).some(part => part.startsWith('.')) || /^(lib|data|scripts|tests|api)(\/|$)/.test(relative) || (!relative.startsWith('assets/') && !relative.startsWith('downloads/') && relative !== 'video-studio/index.html' && !/^[a-z-]+\.(html|ico|svg|webmanifest)$/.test(relative))) {
      res.writeHead(404); return res.end('Not found.');
    }
    const stat = await fs.promises.stat(file).catch(() => null);
    if (!stat?.isFile()) { res.writeHead(404); return res.end('Not found.'); }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Match Vercel's static-video byte ranges so browser previews can seek.
    if (path.extname(file) === '.mp4') {
      res.setHeader('Accept-Ranges', 'bytes');
      let start = 0, end = stat.size - 1;
      if (req.headers.range) {
        const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (range && (range[1] || range[2])) {
          start = range[1] ? Number(range[1]) : Math.max(0, stat.size - Number(range[2]));
          end = range[1] && range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
        } else start = -1;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= stat.size) {
          res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); return res.end();
        }
        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      }
      res.setHeader('Content-Length', end - start + 1);
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    if (path.basename(file) === 'admin.html') { res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Frame-Options', 'DENY'); }
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(500); res.end('The request could not be completed.'); }
});
if (require.main === module) server.listen(Number(process.env.PORT) || 8081, '127.0.0.1', () => console.log(`Mama’s Love: http://127.0.0.1:${server.address().port}`));
module.exports = server;
