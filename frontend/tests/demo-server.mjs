// Sert le build sous un sous-dossier, comme sur GitHub Pages.
import { createServer } from 'node:http';
import { createReadStream, stat } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';

const root = fileURLToPath(new URL('../dist-demo/', import.meta.url));
const prefix = '/portfolio/civilium/';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

createServer((req, res) => {
  const path = new URL(req.url, 'http://127.0.0.1:4174').pathname;
  if (path === '/portfolio/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<!doctype html><html lang="fr"><title>Portfolio — test</title><iframe title="Civilium" src="/portfolio/civilium/" width="100%" height="900"></iframe></html>');
    return;
  }
  const file = resolve(root, path.slice(prefix.length) || 'index.html');
  if (!path.startsWith(prefix) || !file.startsWith(root.replace(/\/$/, '') + sep)) {
    res.writeHead(404); res.end(); return;
  }
  stat(file, (error, info) => {
    if (error || !info.isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    createReadStream(file).pipe(res);
  });
}).listen(4174, '127.0.0.1');
