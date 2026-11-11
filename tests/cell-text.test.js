import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitCellTexts } from '../js/ui/cell-text.js';

/** Fausse case : note l'ordre des lectures et des écritures */
function fakeCell(log, name, { width = 100, contentHeight = 40, connected = true } = {}) {
    let height = '';
    return {
        isConnected: connected,
        get offsetWidth() { log.push(`width ${name}`); return width; },
        get scrollHeight() { log.push(`read ${name}`); return contentHeight; },
        style: {
            get height() { return height; },
            set height(value) { log.push(`write ${name} ${value}`); height = value; }
        }
    };
}

test('fitCellTexts : toutes les lectures avant les écritures finales (une seule mise en page)', () => {
    const log = [];
    const a = fakeCell(log, 'a', { contentHeight: 30 });
    const b = fakeCell(log, 'b', { contentHeight: 55 });
    const hidden = fakeCell(log, 'h', { width: 0 });
    const root = { querySelectorAll: () => [a, b, hidden] };
    fitCellTexts(root);
    assert.equal(a.style.height, '30px');
    assert.equal(b.style.height, '55px');
    assert.equal(hidden.style.height, '', 'une case cachée (onglet masqué) n\'est pas touchée');
    const firstRead = log.findIndex((l) => l.startsWith('read'));
    const lastAuto = log.findLastIndex((l) => l.endsWith(' auto'));
    const firstPx = log.findIndex((l) => l.endsWith('px'));
    const lastRead = log.findLastIndex((l) => l.startsWith('read'));
    assert.ok(lastAuto < firstRead, 'toutes les hauteurs remises à « auto » avant la première lecture');
    assert.ok(lastRead < firstPx, 'toutes les lectures avant la première hauteur écrite');
});

test('fitCellTexts : seule une case changée est réajustée, y compris quand seules ses marges changent', (t) => {
    // Ligne de saisie des sorts sur tablette : marges de 12,5 px, perdues quand elle devient un sort
    const padding = new Map();
    const original = globalThis.getComputedStyle;
    globalThis.getComputedStyle = (cell) => ({
        paddingTop: padding.get(cell), paddingBottom: padding.get(cell), fontSize: '16px', lineHeight: 'normal'
    });
    t.after(() => { globalThis.getComputedStyle = original; });
    const log = [];
    const entry = fakeCell(log, 'entry', { contentHeight: 44 });
    const other = fakeCell(log, 'other', { contentHeight: 23 });
    entry.value = 'Boule de feu';
    other.value = 'Lumière';
    padding.set(entry, '12.5px');
    padding.set(other, '2px');
    const root = { querySelectorAll: () => [entry, other] };
    fitCellTexts(root);
    assert.equal(entry.style.height, '44px');

    log.length = 0;
    fitCellTexts(root);
    assert.ok(!log.some((l) => l.startsWith('write')), 'rien n\'a changé : aucune hauteur réécrite');

    padding.set(entry, '2px');
    Object.defineProperty(entry, 'scrollHeight', { get() { log.push('read entry'); return 23; } });
    fitCellTexts(root);
    assert.equal(entry.style.height, '23px', 'marges perdues : la case reprend la hauteur de son texte');
    assert.ok(!log.some((l) => l.startsWith('write other')), 'la case voisine, inchangée, n\'est pas touchée');
});
