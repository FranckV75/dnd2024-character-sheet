// Comparaison avec une version réenregistrée par l'ancienne version (v3) : comparableWithV3
// (js/cloud/sync.js) ne doit pas poser la question « Modifié par l'ancienne version » pour
// les seules différences que la v3 crée toujours (réglages d'affichage, champs d'arme
// qu'elle ne garde pas), mais une vraie différence reste détectée. Fiches fictives uniquement.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    comparableWithV3, fingerprint, V3_WEAPON_FIELDS, V4_ONLY_KEYS, V3_MISSING_KEYS, LEGACY_ERASED, legacyErasedText
} from '../js/cloud/sync.js';
import { normalizeCharacter, isV3Save } from '../js/state/migrate.js';
import { createDefaultCharacter, EMPTY_WEAPON } from '../js/state/schema.js';

const VISUAL_PREFS = { opacity: '1', theme: 'light', galleryBg: null, bgZoom: '100', bgPosY: '50' };

/** Fiche fictive enregistrée par la v4, avec un peu d'état de jeu propre à la v4 */
const v4Sheet = (extra = {}) => ({
    ...createDefaultCharacter(), char_name: 'Testeur', char_class: 'Guerrier', hd_type: 'd10',
    odyssey_mode: 'off', conditions: ['poisoned'], ...extra
});

/** Ce que la v3 réécrit : sans les clés propres à la v4, avec ses réglages d'affichage */
const v3Rewrite = (sheet, extra = {}) => ({
    ...Object.fromEntries(Object.entries(sheet).filter(([key]) => !V4_ONLY_KEYS.includes(key))),
    _visual_prefs: VISUAL_PREFS, ...extra
});

const same = (a, b) => fingerprint(comparableWithV3(normalizeCharacter(a))) === fingerprint(comparableWithV3(normalizeCharacter(b)));

const oldWeapon = { ...EMPTY_WEAPON, name: 'Hache à deux mains', atk: '+5', dmg: '1d12+3' };
const v3Weapon = { ...EMPTY_WEAPON, name: 'Hache à deux mains' };

describe('Comparaison avec une version écrite par la v3', () => {
    test("Champs d'arme gardés par la v3 : les 9 champs d'une arme vide", () => {
        assert.deepEqual([...V3_WEAPON_FIELDS], ['name', 'prop', 'prof', 'ammo', 'note', 'category', 'atkKey', 'baseDmg', 'weaponConfig']);
    });

    test("Réglages d'affichage (_visual_prefs) ignorés : absents d'un côté, présents de l'autre", () => {
        const v4 = v4Sheet();
        const v3 = v3Rewrite(v4);
        assert.ok(isV3Save(v3));
        assert.ok(same(v3, v4), 'la v3 ajoute _visual_prefs');
        assert.ok(same(v3Rewrite(v4, { _visual_prefs: { ...VISUAL_PREFS, theme: 'dark' } }), v4Sheet({ _visual_prefs: VISUAL_PREFS })),
            "thème différent : pas une donnée du personnage");
        assert.equal('_visual_prefs' in comparableWithV3(v3), false);
    });

    test("Arme d'avant 2026 (atk et dmg) : la perte de ces deux champs n'est pas une différence", () => {
        const v4 = v4Sheet({ dynamic_weapons: [oldWeapon] });
        const v3 = v3Rewrite(v4, { dynamic_weapons: [v3Weapon] });
        assert.ok(same(v3, v4));
        assert.deepEqual(comparableWithV3(v4).dynamic_weapons, [v3Weapon]);
        assert.equal(oldWeapon.atk, '+5', "objet d'origine intact");
        assert.equal(v4.dynamic_weapons[0].dmg, '1d12+3', "fiche d'origine intacte");
    });

    test('Une vraie différence reste détectée', () => {
        const v4 = v4Sheet({ dynamic_weapons: [oldWeapon], hp_current: '12' });
        assert.ok(!same(v3Rewrite(v4, { hp_current: '7' }), v4), 'points de vie');
        assert.ok(!same(v3Rewrite(v4, { dynamic_weapons: [{ ...v3Weapon, name: 'Épée longue' }] }), v4), "nom d'arme");
        assert.ok(!same(v3Rewrite(v4, { dynamic_weapons: [{ ...v3Weapon, note: 'Runes' }] }), v4), "note d'arme");
        assert.ok(!same(v3Rewrite(v4, { dynamic_weapons: [] }), v4), 'arme supprimée');
        assert.ok(!same(v3Rewrite(v4, { dynamic_weapons: [v3Weapon, v3Weapon] }), v4), 'arme ajoutée');
    });

    test('Fiche sans arme ni réglages : comparaison inchangée', () => {
        const base = { char_name: 'Korgul', hp_current: '7' };
        assert.deepEqual(comparableWithV3(base), base, 'pas de clé dynamic_weapons ajoutée');
        assert.deepEqual(comparableWithV3({ ...base, dynamic_weapons: [null, 'texte'] }).dynamic_weapons, [null, 'texte'],
            "valeur illisible gardée telle quelle");
    });
});

describe("Fenêtre « Modifié par l'ancienne version » : ce qui serait effacé", () => {
    test('Chaque clé que la v3 efface a son libellé (hors clés des toutes premières versions)', () => {
        const named = LEGACY_ERASED.flatMap(([, keys]) => keys);
        const oldest = ['hd_total', 'hd_spent', 'profs_other'];
        const missing = [...V4_ONLY_KEYS, ...V3_MISSING_KEYS].filter((key) => !oldest.includes(key) && !named.includes(key));
        assert.deepEqual(missing, []);
        assert.ok(named.every((key) => V4_ONLY_KEYS.includes(key) || V3_MISSING_KEYS.includes(key)), 'pas de clé inventée');
    });

    test("La phrase cite chaque libellé, dont l'Inspiration héroïque de l'Odyssée", () => {
        const text = legacyErasedText();
        for (const [label] of LEGACY_ERASED) assert.ok(text.includes(label), label);
        assert.match(text, /Inspiration héroïque/);
        assert.match(text, /^« Garder la version en ligne » effacerait aussi .+, par exemple : états \(Empoisonné…\), concentration, .+\.$/);
    });
});
