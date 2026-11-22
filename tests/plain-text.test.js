/**
 * TESTS — TEXTE BRUT DES SAISIES (js/rules/plain-text.js)
 * Une seule fonction lit le HTML des anciennes sauvegardes v3 ; ses deux manières de traiter une
 * balise (rien, ou une espace) et le décodage des entités sont les mêmes partout.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plainText, decodeEntities } from '../js/rules/plain-text.js';
import { plainText as spellPlainText, descToPlainText } from '../js/rules/spells.js';
import { stripHTML } from '../js/state/migrate.js';

describe('plainText : réglage par défaut (noms, nombres, choix)', () => {
    test('Balises retirées sans espace, entités décodées, bords nettoyés', () => {
        assert.equal(plainText('<div>Korgul</div>'), 'Korgul');
        assert.equal(plainText('<b>4</b>0'), '40');
        assert.equal(plainText('<div>A</div><div>B</div>'), 'AB');
        assert.equal(plainText(' Arc&nbsp;long<br> '), 'Arc long');
        assert.equal(plainText('Tom &amp; Jerry'), 'Tom & Jerry');
        assert.equal(plainText('&lt;b&gt; reste du texte'), '<b> reste du texte');
        assert.equal(plainText('d&#39;argent'), "d'argent");
    });

    test('Valeurs absentes ou non textuelles', () => {
        assert.equal(plainText(null), '');
        assert.equal(plainText(undefined), '');
        assert.equal(plainText(12), '12');
        assert.equal(plainText(0), '0');
        assert.equal(plainText(true), 'true');
    });

    test('Espaces intérieures gardées telles quelles (pas de squash)', () => {
        assert.equal(plainText('a  b'), 'a  b');
        assert.equal(plainText('3 m'), '3 m');
    });
});

describe('plainText : options', () => {
    test('spaced : une balise compte comme une espace, suites d\'espaces réduites', () => {
        assert.equal(plainText('<div>A</div><div>B</div>', { spaced: true }), 'A B');
        assert.equal(plainText('Arc<br>long&nbsp;&nbsp;composite', { spaced: true }), 'Arc long composite');
        assert.equal(plainText('<p> </p>', { spaced: true }), '');
    });

    test('squash seul : balises sans espace, suites d\'espaces réduites (grimoire)', () => {
        assert.equal(plainText('<b>Boule</b>&nbsp;de   feu', { squash: true }), 'Boule de feu');
        assert.equal(plainText('<b>4</b>0', { squash: true }), '40');
        assert.equal(plainText('a\n\tb', { squash: true }), 'a b');
    });
});

describe('decodeEntities', () => {
    test('Entités nommées, numériques et hexadécimales ; inconnues gardées', () => {
        assert.equal(decodeEntities('&eacute;&#233;&#xE9;&hellip;&rsquo;'), '&eacute;éé…’');
        assert.equal(decodeEntities('&AMP;'), '&');
        assert.equal(decodeEntities('&#0;&#x110000;'), '&#0;&#x110000;');
        // Un seul passage : « &amp;lt; » donne « &lt; », pas « < »
        assert.equal(decodeEntities('&amp;lt;'), '&lt;');
    });
});

describe('Les anciens noms passent par la même fonction', () => {
    test('Grimoire (spells.js) : texte sur une ligne, espaces réduites', () => {
        assert.equal(spellPlainText('<b>Boule</b>&nbsp;de feu &amp; co'), 'Boule de feu & co');
        assert.equal(spellPlainText(null), '');
    });

    test('Description d\'un sort : retours à la ligne gardés', () => {
        assert.equal(descToPlainText('<p>A &amp; B</p><p>C</p>'), 'A & B\nC');
    });

    test('Migration (stripHTML) : textes nettoyés, autres valeurs rendues telles quelles', () => {
        assert.equal(stripHTML('<div>Glaive&nbsp;</div>'), 'Glaive');
        assert.equal(stripHTML('&lt;1d6&gt; &quot;x&quot; &#39;y&#39; &amp;'), '<1d6> "x" \'y\' &');
        assert.equal(stripHTML(3), 3);
        assert.equal(stripHTML(null), null);
    });
});

test('Aucune autre copie du retrait des balises dans js/rules, js/state et js/data', () => {
    const root = fileURLToPath(new URL('../js/', import.meta.url));
    const copies = [];
    for (const dir of ['rules', 'state', 'data']) {
        for (const file of readdirSync(join(root, dir), { recursive: true }).filter(name => name.endsWith('.js'))) {
            const path = `${dir}/${file.replace(/\\/g, '/')}`;
            if (path === 'rules/plain-text.js') continue;
            if (readFileSync(join(root, dir, file), 'utf8').includes('<[^>]*>/g')) copies.push(path);
        }
    }
    assert.deepEqual(copies, []);
});
