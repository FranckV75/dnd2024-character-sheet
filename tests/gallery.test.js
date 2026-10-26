/**
 * TESTS UNITAIRES — GALLERY.JS (réglages d'apparence : fond d'écran, opacité)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    GALLERY_LIMITS,
    clampNumber,
    isDataImage,
    isDefaultName,
    resolveBackground,
    displayName,
    parseSavedBackgrounds,
    backgroundSize,
    fitWithin,
    portableBackground,
    toVisualPrefs,
    fromVisualPrefs,
    legacySiteImage,
    needsObjectUrl,
    dataImageBytes,
    CSS_VARIABLE_SAFE_CHARS
} from '../js/rules/gallery.js';
import { DEFAULT_BGS } from '../js/data/constants.js';

const assetBase = 'https://example.test/app/assets/backgrounds/';
const opts = { assetBase, defaults: DEFAULT_BGS };
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('clampNumber', () => {
    test('ramène dans les bornes', () => {
        assert.equal(clampNumber(500, GALLERY_LIMITS.zoom), 200);
        assert.equal(clampNumber(5, GALLERY_LIMITS.zoom), 20);
        assert.equal(clampNumber(-3, GALLERY_LIMITS.posY), 0);
        assert.equal(clampNumber(0.05, GALLERY_LIMITS.opacity), 0.2);
        assert.equal(clampNumber(2, GALLERY_LIMITS.opacity), 1);
    });
    test('lit les textes v3 et la virgule décimale', () => {
        assert.equal(clampNumber('0.6', GALLERY_LIMITS.opacity), 0.6);
        assert.equal(clampNumber('0,6', GALLERY_LIMITS.opacity), 0.6);
        assert.equal(clampNumber('150', GALLERY_LIMITS.zoom), 150);
    });
    test('texte libre ou absent → valeur par défaut', () => {
        assert.equal(clampNumber('abc', GALLERY_LIMITS.zoom), 100);
        assert.equal(clampNumber('', GALLERY_LIMITS.posY), 50);
        assert.equal(clampNumber(null, GALLERY_LIMITS.opacity), 1);
        assert.equal(clampNumber(undefined, GALLERY_LIMITS.opacity), 1);
        assert.equal(clampNumber(NaN, GALLERY_LIMITS.zoom), 100);
        assert.equal(clampNumber('Infinity', GALLERY_LIMITS.zoom), 100);
    });
});

describe('isDataImage / isDefaultName', () => {
    test('image de l\'appareil', () => {
        assert.equal(isDataImage(PNG), true);
        assert.equal(isDataImage('data:text/html;base64,PHNjcmlwdD4='), false);
        assert.equal(isDataImage('data:image/png;base64,abc")'), false);
        assert.equal(isDataImage(null), false);
    });
    test('noms des images fournies, accents compris', () => {
        for (const name of DEFAULT_BGS) assert.equal(isDefaultName(name, DEFAULT_BGS), true, name);
        assert.equal(isDefaultName('Fond_Odyssée.webp'), true);
        assert.equal(isDefaultName('Fond_X.png'), true);
    });
    test('refuse chemins et caractères spéciaux', () => {
        assert.equal(isDefaultName('../Fond_X.webp'), false);
        assert.equal(isDefaultName('Fond_X".webp'), false);
        assert.equal(isDefaultName('Fond_X).webp'), false);
        assert.equal(isDefaultName('Fond X.webp'), false);
        assert.equal(isDefaultName('img/x'), false);
        assert.equal(isDefaultName('Fond_X.svg'), false);
    });
});

describe('resolveBackground', () => {
    test('image fournie → adresse dans le dossier des fonds, encodée', () => {
        assert.equal(resolveBackground('Fond_Equipe.webp', opts), `${assetBase}Fond_Equipe.webp`);
        assert.equal(resolveBackground('Fond_Odyssée.webp', opts), `${assetBase}Fond_Odyss%C3%A9e.webp`);
    });
    test('adresse https : guillemets et espaces encodés', () => {
        const out = resolveBackground('https://exemple.fr/mon image".jpg', opts);
        assert.equal(out, 'https://exemple.fr/mon%20image%22.jpg');
        assert.ok(!out.includes('"'));
        assert.equal(resolveBackground('  http://exemple.fr/a.png  ', opts), 'http://exemple.fr/a.png');
        assert.equal(resolveBackground('https://fr.wikipedia.org/wiki/File:A_(b).jpg', opts),
            'https://fr.wikipedia.org/wiki/File:A_(b).jpg');
    });
    test('image de l\'appareil gardée telle quelle', () => {
        assert.equal(resolveBackground(PNG, opts), PNG);
    });
    test("ancienne adresse d'une image fournie (racine du site v3) → image fournie", () => {
        const site = 'https://franckv75.github.io/dnd2024-character-sheet/';
        assert.equal(resolveBackground(`${site}Fond_Fafnir.webp`, opts), `${assetBase}Fond_Fafnir.webp`);
        assert.equal(resolveBackground(`${site}Fond_Odyss%C3%A9e.webp`, opts), `${assetBase}Fond_Odyss%C3%A9e.webp`);
        assert.equal(legacySiteImage(`${site}Fond_Iria.webp`, DEFAULT_BGS), 'Fond_Iria.webp');
        assert.equal(legacySiteImage(`${site}img/bg_hydra.png`, DEFAULT_BGS), '', 'pas une image fournie');
        assert.equal(legacySiteImage(`${site}Autre.webp`, DEFAULT_BGS), '');
        assert.equal(legacySiteImage('https://exemple.fr/dnd2024-character-sheet/Fond_Iria.webp', DEFAULT_BGS), '');
        // Une autre adresse reste une adresse ordinaire
        assert.equal(resolveBackground(`${site}assets/backgrounds/Fond_Iria.webp`, opts), `${site}assets/backgrounds/Fond_Iria.webp`);
    });
    test('valeurs refusées', () => {
        for (const bad of ['', '   ', 'none', 'javascript:alert(1)', 'data:text/html;base64,PHA+',
            'img/x', '/etc/x.png', 'ftp://exemple.fr/a.png', 'url(x)', 'https://', null, undefined, 42, {}]) {
            assert.equal(resolveBackground(bad, opts), null, String(bad));
        }
    });
});

describe('displayName', () => {
    test('noms lisibles', () => {
        assert.equal(displayName('Fond_La_Team.webp'), 'La Team');
        assert.equal(displayName('Fond_Odyssée.webp'), 'Odyssée');
        assert.equal(displayName('https://exemple.fr/images/mon%20dragon.jpg?w=200#x'), 'mon dragon');
        assert.equal(displayName('https://exemple.fr/'), 'exemple.fr');
        assert.equal(displayName('https://exemple.fr/%E0%A4%A.png'), '%E0%A4%A');
        assert.equal(displayName(PNG), "Image de l'appareil");
        assert.equal(displayName(''), '');
    });
});

describe('parseSavedBackgrounds (format v3 : JSON, tableau de textes)', () => {
    test('lit la liste et ignore le reste', () => {
        assert.deepEqual(parseSavedBackgrounds('["https://a.fr/1.jpg","",3,"https://b.fr/2.png"]'),
            ['https://a.fr/1.jpg', 'https://b.fr/2.png']);
        assert.deepEqual(parseSavedBackgrounds(null), []);
        assert.deepEqual(parseSavedBackgrounds('pas du json'), []);
        assert.deepEqual(parseSavedBackgrounds('{"a":1}'), []);
    });
});

describe('backgroundSize / fitWithin', () => {
    test('100 % = cover (comme la v3)', () => {
        assert.equal(backgroundSize(100), 'cover');
        assert.equal(backgroundSize(150), '150% auto');
        assert.equal(backgroundSize(20), '20% auto');
    });
    test('réduction sans agrandissement', () => {
        assert.deepEqual(fitWithin(4032, 3024, 1920), { width: 1920, height: 1440, scaled: true });
        assert.deepEqual(fitWithin(2048, 2732, 1920), { width: 1439, height: 1920, scaled: true });
        assert.deepEqual(fitWithin(800, 600, 1920), { width: 800, height: 600, scaled: false });
        assert.deepEqual(fitWithin(0, 600), { width: 0, height: 0, scaled: false });
    });
});

describe('_visual_prefs (format v3)', () => {
    test('toVisualPrefs : textes v3, image de l\'appareil jamais recopiée, clés inconnues gardées', () => {
        const prefs = { bg: 'Fond_Iria.webp', zoom: 120, posY: 30, opacity: 0.8 };
        assert.deepEqual(toVisualPrefs(prefs, 'dark', { legacy: 'x', opacity: '1' }), {
            legacy: 'x', opacity: '0.8', theme: 'dark', galleryBg: 'Fond_Iria.webp', bgZoom: '120', bgPosY: '30'
        });
        assert.equal(toVisualPrefs({ ...prefs, bg: PNG }, 'light').galleryBg, null);
        assert.equal(toVisualPrefs({ ...prefs, bg: '' }, 'light').galleryBg, null);
        assert.equal(portableBackground('https://a.fr/x.jpg'), 'https://a.fr/x.jpg');
    });
    test('fromVisualPrefs : lit les textes v3, borne et valide', () => {
        const isValid = (bg) => resolveBackground(bg, opts) !== null;
        assert.deepEqual(fromVisualPrefs({
            opacity: '0.7', theme: 'dark', galleryBg: 'Fond_Fafnir.webp', bgZoom: '100', bgPosY: '50'
        }, isValid), { bg: 'Fond_Fafnir.webp', zoom: 100, posY: 50, opacity: 0.7, theme: 'dark' });
        assert.deepEqual(fromVisualPrefs({
            opacity: '9', theme: 'rose', galleryBg: 'javascript:alert(1)', bgZoom: 'abc', bgPosY: ''
        }, isValid), { zoom: 100, opacity: 1 });
        assert.deepEqual(fromVisualPrefs({ galleryBg: null }, isValid), {});
        assert.equal(fromVisualPrefs(null, isValid), null);
        assert.equal(fromVisualPrefs('x', isValid), null);
    });
});

describe("Très grande image de l'appareil (enregistrée par la v3)", () => {
    test('au-delà de 2 000 000 caractères : affichée par une adresse blob:', () => {
        const big = `data:image/png;base64,${'A'.repeat(CSS_VARIABLE_SAFE_CHARS)}`;
        assert.equal(needsObjectUrl(big), true);
        assert.equal(needsObjectUrl(PNG), false);
        assert.equal(needsObjectUrl(`https://exemple.fr/${'a'.repeat(CSS_VARIABLE_SAFE_CHARS)}`), false);
        assert.equal(needsObjectUrl(null), false);
        assert.ok(CSS_VARIABLE_SAFE_CHARS < 2_097_152, 'sous la limite de Chrome (2 Mio)');
    });
    test("contenu binaire de l'image", () => {
        const out = dataImageBytes(PNG);
        assert.equal(out.type, 'image/png');
        assert.deepEqual([...out.bytes.slice(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
        assert.equal(dataImageBytes('https://exemple.fr/a.png'), null);
        assert.equal(dataImageBytes('data:image/png;base64,A'), null, 'base64 invalide');
    });
});
