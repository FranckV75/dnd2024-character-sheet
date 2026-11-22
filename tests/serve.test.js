/**
 * TESTS — SERVEUR DE DÉVELOPPEMENT (scripts/serve.js)
 * Le serveur n'écoute que cet ordinateur et ne sert jamais le dossier .git.
 * Port choisi par le système (0) : aucun conflit avec `npm run dev`, serveurs fermés à la fin.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { isForbiddenPath, startDevServer } from '../scripts/serve.js';

/** Requête brute (sans normalisation du chemin par fetch) → code HTTP */
function statusOf(host, port, path) {
    return new Promise((ok, ko) => {
        const req = request({ host, port, path, method: 'GET' }, (res) => {
            res.resume();
            ok(res.statusCode);
        });
        req.on('error', ko);
        req.end();
    });
}

describe('Serveur de développement', () => {
    let servers = [];
    let port = 0;

    before(async () => {
        servers = await startDevServer(0);
        port = servers[0].address().port;
    });
    after(async () => {
        await Promise.all(servers.map((s) => new Promise((ok) => s.close(ok))));
    });

    test("n'écoute que des adresses de cet ordinateur", () => {
        for (const server of servers) {
            assert.ok(['127.0.0.1', '::1'].includes(server.address().address), server.address().address);
        }
        assert.equal(servers[0].address().address, '127.0.0.1');
    });

    test('sert la page par 127.0.0.1 et par localhost', async () => {
        assert.equal(await statusOf('127.0.0.1', port, '/index.html'), 200);
        const res = await fetch(`http://localhost:${port}/index.html`);
        assert.equal(res.status, 200);
        await res.arrayBuffer();
    });

    test('ne sert jamais le dossier .git, même déguisé', async () => {
        for (const path of ['/.git/config', '/.git/HEAD', '/.GIT/config', '/.git./config', '/%2egit/config', '/js/..%5c.git/config']) {
            assert.equal(await statusOf('127.0.0.1', port, path), 404, path);
        }
    });

    test('refuse de sortir du dépôt', async () => {
        assert.equal(await statusOf('127.0.0.1', port, '/..%5c..%5cpackage.json'), 403);
    });
});

describe('isForbiddenPath', () => {
    test('repère .git sous toutes ses formes', () => {
        assert.equal(isForbiddenPath('/.git/config'), true);
        assert.equal(isForbiddenPath('/.Git'), true);
        assert.equal(isForbiddenPath('/a\\.git\\HEAD'), true);
        assert.equal(isForbiddenPath('/.git.'), true);
    });
    test('laisse passer les fichiers ordinaires et les sauvegardes locales', () => {
        assert.equal(isForbiddenPath('/index.html'), false);
        assert.equal(isForbiddenPath('/tests/fixtures/local/korgul.json'), false);
        assert.equal(isForbiddenPath('/js/github.js'), false);
    });
});
