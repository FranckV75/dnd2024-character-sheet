// =============================================================================
// SERVE.JS - Petit serveur statique de développement (aucune dépendance)
// Usage : npm run dev  →  http://localhost:8080
//
// Réservé à cet ordinateur : le serveur n'écoute que l'adresse « locale » (127.0.0.1, et ::1
// quand l'ordinateur la connaît, car « localhost » peut désigner l'une ou l'autre). Un appareil
// du même Wi-Fi ne peut donc rien lire : ni les vraies sauvegardes de tests/fixtures/local/
// (utiles aux vérifications à l'écran, ici seulement), ni l'historique Git.
// Le dossier .git n'est jamais servi, même ici. `npm run check` vérifie ces deux règles.
// =============================================================================

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
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

/**
 * Chemin jamais servi : tout ce qui touche au dossier Git (.git, mais aussi les variantes
 * que Windows confond avec lui, comme « .git. » ou « .GIT »).
 * @param {string} urlPath chemin demandé, déjà décodé
 */
export function isForbiddenPath(urlPath) {
    return urlPath.split(/[\\/]/).some((segment) => segment.toLowerCase().startsWith('.git'));
}

/** Répond à une requête : fichier du dépôt, 403 hors du dépôt, 404 sinon (et pour .git) */
export async function handleRequest(req, res) {
    try {
        const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        if (isForbiddenPath(urlPath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Introuvable');
            return;
        }
        let filePath = normalize(join(ROOT, urlPath));
        // « .. » refusé avec / comme avec \ : Windows lit \ comme un séparateur, Linux (la
        // vérification de GitHub) comme une lettre ; la réponse est la même partout
        const climbs = urlPath.split(/[\\/]/).includes('..');
        if (climbs || (filePath !== ROOT && !filePath.startsWith(ROOT + sep))) {
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
}

/**
 * Lance le serveur sur cet ordinateur seulement. L'adresse IPv6 locale (::1) est facultative :
 * si l'ordinateur ne la connaît pas, seul 127.0.0.1 répond, et c'est suffisant.
 * @param {number} port
 * @returns {Promise<import('node:http').Server[]>} les serveurs ouverts (à fermer par l'appelant)
 */
export async function startDevServer(port = PORT) {
    const ipv4 = createServer(handleRequest);
    await new Promise((ok, ko) => ipv4.once('error', ko).listen(port, '127.0.0.1', ok));
    const servers = [ipv4];
    const actualPort = ipv4.address().port;

    const ipv6 = createServer(handleRequest);
    try {
        await new Promise((ok, ko) => ipv6.once('error', ko).listen(actualPort, '::1', ok));
        servers.push(ipv6);
    } catch {
        // Pas d'IPv6 locale (ou adresse prise) : 127.0.0.1 suffit
    }
    return servers;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
    startDevServer().then((servers) => {
        const port = servers[0].address().port;
        console.log(`Serveur de développement (cet ordinateur seulement) : http://localhost:${port}`);
    }, (error) => {
        console.error(`Le serveur n'a pas pu démarrer : ${error.message}`);
        process.exit(1);
    });
}
