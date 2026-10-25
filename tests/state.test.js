/**
 * TESTS — ÉTAT ET SAUVEGARDE (schema, migrate, store, persistence)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createDefaultCharacter, BOOLEAN_FIELDS, PLAIN_TEXT_FIELDS } from '../js/state/schema.js';
import { migrateCharacter, findRulebookWeapon, stripHTML } from '../js/state/migrate.js';
import { createStore } from '../js/state/store.js';
import {
    loadLocal, saveLocal, serializeCharacter, parseCharacterFile, exportFileName,
    characterName, STORAGE_KEYS
} from '../js/state/persistence.js';
import { deriveCharacter, computeWeapon } from '../js/rules/character.js';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

/** Faux localStorage pour tester sans navigateur */
function memoryStorage() {
    const data = new Map();
    return {
        getItem: (k) => (data.has(k) ? data.get(k) : null),
        setItem: (k, v) => data.set(k, String(v)),
        removeItem: (k) => data.delete(k),
        data
    };
}

describe('Schéma : personnage vierge', () => {
    const c = createDefaultCharacter();

    test('Toutes les caractéristiques à 10, niveau 1, tableaux vides', () => {
        for (const id of ['str', 'dex', 'con', 'int', 'wis', 'cha']) assert.equal(c[`${id}_score`], '10');
        assert.equal(c.char_level, '1');
        assert.deepEqual(c.dynamic_weapons, []);
        assert.equal(c.fatigue_level, 0);
    });

    test('Toutes les cases à cocher sont décochées', () => {
        for (const f of BOOLEAN_FIELDS) assert.equal(c[f], false, f);
        assert.equal(BOOLEAN_FIELDS.length, 6 + 18 + 18 + 6 + 4);
    });

    test('Deux appels renvoient deux objets indépendants', () => {
        const a = createDefaultCharacter();
        a.dynamic_weapons.push({});
        assert.equal(createDefaultCharacter().dynamic_weapons.length, 0);
    });
});

describe('Migration d\'une ancienne sauvegarde (format v1)', () => {
    const raw = fixture('legacy-v1.json');
    const { character: c, report } = migrateCharacter(raw);

    test('Les champs texte simples perdent leur HTML', () => {
        assert.equal(c.char_class, 'Guerrier');
        assert.equal(c.gp, '42');
    });

    test('Les champs riches gardent leur mise en forme', () => {
        assert.equal(c.char_name, raw.char_name);
        assert.equal(c.traits_feats, raw.traits_feats);
    });

    test('Cases null → false, caractéristique vide → 10', () => {
        assert.equal(c.dex_save_prof, false);
        assert.equal(c.skill_prof_stealth, false);
        assert.equal(c.skill_prof_athletics, true);
        assert.equal(c.dex_score, '10');
        assert.equal(c.str_score, '<div>16</div>');
    });

    test('Ancien format des dés de vie converti', () => {
        assert.equal(c.hd_type, 'd10');
        assert.equal(c.hd_current, '1');
        assert.equal(c.hd_total, 'D10', 'ancien champ conservé');
    });

    test('Ancien champ des maîtrises d\'armes repris', () => {
        assert.equal(c.profs_weapons, 'Armes courantes et de guerre');
    });

    test('Armes anciennes rattachées au manuel quand le nom correspond', () => {
        const [sword, axes, unknown] = c.dynamic_weapons;
        assert.equal(sword.atkKey, 'FOR');
        assert.equal(sword.baseDmg, '1d8 tran.');
        assert.equal(sword.category, 'Guerre');
        assert.equal(sword.atk, '+5', 'valeur d\'origine conservée');
        assert.equal(axes.baseDmg, '1d6 tran.');
        assert.equal(unknown.atkKey, '', 'arme inconnue laissée telle quelle');
    });

    test('Type des armures déduit du nom', () => {
        assert.equal(c.dynamic_armors[0].type, 'Lourde');
        assert.equal(c.dynamic_armors[1].type, 'Bouclier');
    });

    test('Sorts complétés (préparé, école)', () => {
        assert.equal(c.dynamic_spells[0].prep, false);
        assert.equal(c.dynamic_spells[0].school, '');
        assert.equal(c.dynamic_spells[0].name, 'Bouclier');
    });

    test('Clé inconnue conservée', () => {
        assert.equal(c.champ_inconnu_v1, 'à conserver');
    });

    test('Le rapport décrit les conversions', () => {
        assert.ok(report.some(line => line.includes('Dé de vie')));
        assert.ok(report.some(line => line.includes('Épée longue')));
    });

    test('Migration idempotente : migrer deux fois ne change plus rien', () => {
        const again = migrateCharacter(c);
        assert.deepEqual(again.character, c);
        assert.deepEqual(again.report, []);
    });

    test('La fiche migrée se calcule correctement', () => {
        const d = deriveCharacter(c);
        assert.equal(d.level, 3);
        assert.equal(d.mods.str, 3);
        assert.equal(d.armorClass.value, 18); // Cotte de mailles 16 + bouclier 2
        const sword = computeWeapon(c.dynamic_weapons[0], d);
        assert.equal(sword.attack.text, 'FOR : +5');
        assert.equal(sword.damage.text, '1d8 +3 TRAN');
        assert.equal(computeWeapon(c.dynamic_weapons[2], d), null);
    });
});

describe('Migration : cas limites', () => {
    test('Entrée invalide → fiche vierge avec message', () => {
        for (const bad of [null, undefined, 42, 'texte', []]) {
            const { character, report } = migrateCharacter(bad);
            assert.equal(character.char_level, '1');
            assert.equal(report.length, 1);
        }
    });

    test('Fiche vierge inchangée par la migration', () => {
        const blank = createDefaultCharacter();
        assert.deepEqual(migrateCharacter(blank), { character: blank, report: [] });
    });

    test('Épuisement borné entre 0 et 6', () => {
        assert.equal(migrateCharacter({ fatigue_level: '9' }).character.fatigue_level, 6);
        assert.equal(migrateCharacter({ fatigue_level: 'x' }).character.fatigue_level, 0);
    });

    test('Recherche d\'armes du manuel', () => {
        assert.equal(findRulebookWeapon('Hache à 2 mains (1)').name, 'Hache à deux mains');
        assert.equal(findRulebookWeapon('<b>dague</b>').name, 'Dague');
        assert.equal(findRulebookWeapon('Hachettes (4)').name, 'Hachette');
        assert.equal(findRulebookWeapon("Maillet d'Arme (0)").name, "Maillet d'armes");
        assert.equal(findRulebookWeapon('Arcs longs').name, 'Arc long');
        assert.equal(findRulebookWeapon('Perception Bestiale'), null);
        assert.equal(findRulebookWeapon('Arc'), null);
        assert.equal(findRulebookWeapon(''), null);
    });

    test('stripHTML décode les entités', () => {
        assert.equal(stripHTML('<b>A&amp;B</b>&nbsp;'), 'A&B');
    });
});

describe('Store', () => {
    test('update : notifie avec la liste des champs modifiés', () => {
        const store = createStore();
        const calls = [];
        store.subscribe((state, keys) => calls.push(keys));
        store.update({ str_score: '18', dex_score: '10' });
        assert.deepEqual(calls, [['str_score']]);
        assert.equal(store.get().str_score, '18');
    });

    test('update sans changement réel : aucune notification', () => {
        const store = createStore();
        let count = 0;
        store.subscribe(() => count++);
        store.update({ str_score: '10' });
        assert.equal(count, 0);
    });

    test('replace : notifie avec null', () => {
        const store = createStore();
        let received;
        store.subscribe((state, keys) => { received = keys; });
        store.replace({ ...createDefaultCharacter(), char_name: 'Iria' });
        assert.equal(received, null);
        assert.equal(store.get().char_name, 'Iria');
    });

    test('Désabonnement', () => {
        const store = createStore();
        let count = 0;
        const off = store.subscribe(() => count++);
        off();
        store.update({ char_name: 'X' });
        assert.equal(count, 0);
    });

    test('Le store copie les données reçues (pas d\'effet de bord)', () => {
        const weapons = [{ name: 'Dague' }];
        const store = createStore();
        store.update({ dynamic_weapons: weapons });
        weapons[0].name = 'Modifiée';
        assert.equal(store.get().dynamic_weapons[0].name, 'Dague');
    });

    test('Un abonné en erreur ne bloque pas les autres', () => {
        const store = createStore();
        let ok = false;
        const originalError = console.error;
        console.error = () => {};
        store.subscribe(() => { throw new Error('boom'); });
        store.subscribe(() => { ok = true; });
        store.update({ char_name: 'Y' });
        console.error = originalError;
        assert.equal(ok, true);
    });
});

describe('Sauvegarde locale et fichiers', () => {
    test('Rien d\'enregistré → null', () => {
        assert.equal(loadLocal(memoryStorage()), null);
    });

    test('Aller-retour localStorage sans perte (mêmes clés que la v3)', () => {
        const storage = memoryStorage();
        const { character } = migrateCharacter(fixture('legacy-v1.json'));
        assert.equal(saveLocal(character, storage, new Date('2026-10-25T12:00:00Z')), true);
        assert.ok(storage.data.has('dd2024_char'));
        assert.equal(storage.getItem(STORAGE_KEYS.lastSaved), '2026-10-25T12:00:00.000Z');
        assert.equal(storage.getItem(STORAGE_KEYS.activeName), "Testeur l'Ancien");
        assert.deepEqual(loadLocal(storage).character, character);
    });

    test('Sauvegarde locale corrompue → fiche vierge et message', () => {
        const storage = memoryStorage();
        storage.setItem('dd2024_char', '{pas du json');
        const result = loadLocal(storage);
        assert.equal(result.character.char_level, '1');
        assert.equal(result.report.length, 1);
    });

    test('Stockage indisponible → saveLocal renvoie false', () => {
        const broken = { setItem() { throw new Error('QuotaExceeded'); } };
        assert.equal(saveLocal(createDefaultCharacter(), broken), false);
    });

    test('Aller-retour fichier JSON sans perte', () => {
        const { character } = migrateCharacter(fixture('legacy-v1.json'));
        assert.deepEqual(parseCharacterFile(serializeCharacter(character)).character, character);
    });

    test('Fichier invalide → message clair', () => {
        assert.throws(() => parseCharacterFile('pas du json'), /JSON illisible/);
        assert.throws(() => parseCharacterFile('[1,2]'), /ne contient pas une fiche/);
    });

    test('Nom de fichier d\'export', () => {
        const date = new Date(2026, 3, 16);
        assert.equal(exportFileName({ char_name: 'Korgul <b>Brise-Crâne</b>' }, date), 'DD2024_Korgul_16-04-2026.json');
        assert.equal(exportFileName({ char_name: '' }, date), 'DD2024_perso_16-04-2026.json');
        assert.equal(characterName({ char_name: ' Iria   la  Sage ' }), 'Iria la Sage');
    });
});

// -----------------------------------------------------------------------------
// Vraies sauvegardes (dossier tests/fixtures/local/, non publié sur GitHub).
// Ignoré automatiquement si le dossier est absent (CI).
// -----------------------------------------------------------------------------
const localDir = new URL('./fixtures/local/', import.meta.url);
const localFiles = existsSync(localDir) ? readdirSync(localDir).filter(f => f.endsWith('.json')) : [];

describe('Vraies sauvegardes locales', { skip: localFiles.length === 0 && 'aucune sauvegarde locale' }, () => {
    for (const file of localFiles) {
        test(file, () => {
            const raw = JSON.parse(readFileSync(new URL(file, localDir), 'utf8'));
            const { character } = migrateCharacter(raw);

            // Aucune clé perdue
            for (const key of Object.keys(raw)) assert.ok(key in character, `clé perdue : ${key}`);

            // Les valeurs non normalisées sont strictement identiques
            const normalized = new Set([...PLAIN_TEXT_FIELDS, ...BOOLEAN_FIELDS, 'fatigue_level',
                'hd_type', 'hd_current', 'profs_weapons', 'dynamic_weapons', 'dynamic_armors', 'dynamic_spells',
                'str_score', 'dex_score', 'con_score', 'int_score', 'wis_score', 'cha_score', 'char_level']);
            for (const [key, value] of Object.entries(raw)) {
                if (!normalized.has(key)) assert.deepEqual(character[key], value, key);
            }

            // Chaque ligne des tableaux garde ses champs d'origine (les champs vides peuvent
            // être complétés depuis le manuel ; cases et niveaux de sorts sont normalisés à part)
            const normalizedItemKeys = new Set(['lvl', 'prep', 'c', 'r', 'm', 'stealth', 'equipped']);
            for (const list of ['dynamic_weapons', 'dynamic_armors', 'dynamic_spells']) {
                assert.equal(character[list].length, (raw[list] || []).length, `${list} : nombre de lignes`);
                (raw[list] || []).forEach((item, i) => {
                    for (const [k, v] of Object.entries(item)) {
                        if (normalizedItemKeys.has(k) || v === '' || v === null) continue;
                        assert.deepEqual(character[list][i][k], v, `${list}[${i}].${k}`);
                    }
                });
            }

            // Sorts : même lecture que la v3 (niveau vide = 0, « préparé » si non vide)
            (raw.dynamic_spells || []).forEach((s, i) => {
                const spell = character.dynamic_spells[i];
                assert.equal(spell.lvl, String(s.lvl || '0').replace(/<[^>]*>/g, '').trim() || '0');
                assert.equal(spell.prep, ![undefined, null, '', false, '0'].includes(s.prep));
            });

            // La fiche se calcule et l'aller-retour fichier est stable
            const d = deriveCharacter(character);
            assert.ok(d.level >= 1 && d.level <= 20);
            assert.ok(d.armorClass.value >= 10);
            assert.deepEqual(parseCharacterFile(serializeCharacter(character)).character, character);
            assert.deepEqual(migrateCharacter(character).character, character);
        });
    }
});
