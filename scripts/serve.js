// =============================================================================
// SERVE.JS - Petit serveur statique de développement (aucune dépendance)
// Usage : npm run dev  →  http://localhost:8080
// =============================================================================

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT) || 8080;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2'
};

createServer(async (req, res) => {
    try {
        const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        let filePath = normalize(join(ROOT, urlPath));
        if (!filePath.startsWith(ROOT)) {
            res.writeHead(403).end('Interdit');
            return;
        }
        if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html');

        const body = await readFile(filePath);
        res.writeHead(200, {
            'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        res.end(body);
    } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Introuvable');
    }
}).listen(PORT, () => {
    console.log(`Serveur de développement : http://localhost:${PORT}`);
});
