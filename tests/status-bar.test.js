import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isClipped } from '../js/ui/status-bar.js';

const box = (scrollWidth, clientWidth, scrollHeight = 16, clientHeight = 16) =>
    ({ scrollWidth, clientWidth, scrollHeight, clientHeight });

test('isClipped : un message qui tient n\'est pas coupé', () => {
    assert.equal(isClipped(box(300, 620)), false);
    assert.equal(isClipped(box(620, 620)), false);
});

test('isClipped : un pixel d\'arrondi ne compte pas comme un message coupé', () => {
    assert.equal(isClipped(box(621, 620)), false);
    assert.equal(isClipped(box(300, 620, 17, 16)), false);
});

test('isClipped : trop large (une ligne, « … ») ou trop haut (deux lignes, « … ») = coupé', () => {
    assert.equal(isClipped(box(900, 620)), true);
    assert.equal(isClipped(box(200, 200, 49, 33)), true);
});

test('Barre du haut : le dépliage est branché et #save-status reste la zone annoncée', () => {
    const toolbar = readFileSync(new URL('../js/ui/toolbar.js', import.meta.url), 'utf8');
    assert.match(toolbar, /initStatusBar\(\)/);
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /id="save-status"[^>]*role="status"/);
    const css = readFileSync(new URL('../css/toolbar.css', import.meta.url), 'utf8');
    assert.match(css, /\.app-bar-status-line\.is-expanded #save-status/);
});
