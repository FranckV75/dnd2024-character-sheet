/**
 * TESTS — MISES À JOUR (js/state/update-check.js, js/version.js)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseVersion, isNewerVersion, appFilesToRefresh } from '../js/state/update-check.js';
import { APP_VERSION } from '../js/version.js';

describe('Mises à jour', () => {
    test('La version de la page est celle de package.json', () => {
        const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
        assert.equal(APP_VERSION, pkg.version);
    });

    test('Lecture d\'une version', () => {
        assert.deepEqual(parseVersion('4.32.0'), [4, 32, 0]);
        assert.deepEqual(parseVersion(' 4.32.0 '), [4, 32, 0]);
        for (const bad of ['', '4.32', 'v4.32.0', '<!DOCTYPE html>', null, undefined, 4]) {
            assert.equal(parseVersion(bad), null, String(bad));
        }
    });

    test('Version en ligne plus récente : comparaison nombre par nombre', () => {
        assert.equal(isNewerVersion('4.33.0', '4.32.0'), true);
        assert.equal(isNewerVersion('4.32.1', '4.32.0'), true);
        assert.equal(isNewerVersion('5.0.0', '4.99.9'), true);
        assert.equal(isNewerVersion('4.10.0', '4.9.0'), true);
        assert.equal(isNewerVersion('4.32.0', '4.32.0'), false);
        assert.equal(isNewerVersion('4.31.0', '4.32.0'), false);
    });

    test('Version illisible : jamais de rechargement', () => {
        assert.equal(isNewerVersion(null, '4.32.0'), false);
        assert.equal(isNewerVersion('<!DOCTYPE html>', '4.32.0'), false);
        assert.equal(isNewerVersion('4.33.0', ''), false);
    });

    test('Fichiers à redemander : code et styles du site, sans doublon ni paramètre', () => {
        const origin = 'https://example.github.io';
        assert.deepEqual(appFilesToRefresh([
            'https://example.github.io/app/js/main.js',
            'https://example.github.io/app/js/main.js?0.5',
            'https://example.github.io/app/css/sheet.css',
            'https://example.github.io/app/assets/backgrounds/Fond.webp',
            'https://cdn.jsdelivr.net/npm/dompurify@3.1.5/dist/purify.min.js',
            'pas une adresse'
        ], origin), [
            'https://example.github.io/app/js/main.js',
            'https://example.github.io/app/css/sheet.css'
        ]);
    });
});
