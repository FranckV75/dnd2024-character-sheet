/**
 * TESTS — PERSONNAGES D'EXEMPLE (js/data/examples.js, js/state/examples.js)
 * Chaque exemple est une fiche lisible sans conversion et cohérente avec les règles de 2024 :
 * PV, classe d'armure, maîtrises, dons, armes, emplacements et sorts (data/spells.json).
 * La protection des personnages en ligne est testée dans tests/cloud-controller.test.js.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EXAMPLE_CHARACTERS } from '../js/data/examples.js';
import { listExamples, exampleCharacter, EXAMPLE_SOURCE } from '../js/state/examples.js';
import { migrateCharacter, normalizeCharacter, isCharacterData } from '../js/state/migrate.js';
import { createDefaultCharacter } from '../js/state/schema.js';
import { parseCharacterFile, serializeCharacter, characterName } from '../js/state/persistence.js';
import { takeSnapshot, readSnapshots, reasonForReplace, SNAPSHOT_REASONS } from '../js/state/snapshots.js';
import { V4_ONLY_KEYS } from '../js/cloud/sync.js';
import { isBlankCharacter } from '../js/cloud/controller.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { deriveCharacter, computeWeapon } from '../js/rules/character.js';
import { backgroundSummary, backgroundOf } from '../js/rules/background.js';
import { speciesView } from '../js/rules/species.js';
import { featSlots, reachedFeatIds } from '../js/rules/feats.js';
import { featSpellGroups } from '../js/rules/feat-spells.js';
import { toughHitPoints } from '../js/rules/feat-effects.js';
import { armorWarnings, armorTraining } from '../js/rules/armors.js';
import { experienceProgress } from '../js/rules/experience.js';
import { classSpellCounts } from '../js/rules/class-progression.js';
import { freeSpellbookSpells, spellbookCount, hasSpellbook } from '../js/rules/spellbook.js';
import { spellCounts, findSpellByName, spellToRow, slotView } from '../js/rules/spells.js';
import { grantedSpellKeys } from '../js/rules/spell-preparation.js';
import { hitDiceState } from '../js/rules/rest.js';
import { hitPointState } from '../js/rules/hit-points.js';
import { toolsInText } from '../js/rules/tools.js';
import { FEATS_DATA } from '../js/data/feats.js';

const SPELLS = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
const byId = (id) => exampleCharacter(id);
const FIGHTER = 'guerrier-3';
const WIZARD = 'magicienne-5';

describe('Personnages d\'exemple : liste et lecture', () => {
    test('Deux exemples : un Guerrier de niveau 3 et une Magicienne de niveau 5', () => {
        assert.deepEqual(listExamples().map((e) => e.id), [FIGHTER, WIZARD]);
        assert.equal(byId(FIGHTER).char_class, 'Guerrier');
        assert.equal(byId(FIGHTER).char_level, '3');
        assert.equal(byId(WIZARD).char_class, 'Magicien');
        assert.equal(byId(WIZARD).char_level, '5');
    });

    test('Chaque exemple a un identifiant unique, un nom et une phrase pour le joueur', () => {
        const ids = new Set();
        for (const example of listExamples()) {
            assert.ok(!ids.has(example.id), `identifiant en double : ${example.id}`);
            ids.add(example.id);
            assert.ok(example.title && example.subtitle && example.pitch, example.id);
            assert.equal(example.title, characterName(byId(example.id)), 'le titre est le nom du personnage');
            assert.ok(example.pitch.length <= 110, `phrase courte : ${example.pitch}`);
        }
    });

    test('Identifiant inconnu : aucune fiche', () => {
        assert.equal(exampleCharacter('inconnu'), null);
        assert.equal(exampleCharacter('__proto__'), null);
        assert.equal(exampleCharacter(undefined), null);
    });

    test('Chaque appel rend une copie neuve : modifier la fiche ouverte ne touche pas l\'exemple', () => {
        const first = byId(WIZARD);
        first.char_name = 'Modifiée';
        first.dynamic_spells.length = 0;
        first.feat_choices[1].initie_a_la_magie.list = 'cleric';
        const second = byId(WIZARD);
        assert.equal(second.char_name, 'Ysolde Clairvent');
        assert.ok(second.dynamic_spells.length > 10);
        assert.equal(second.feat_choices[1].initie_a_la_magie.list, 'wizard');
    });

    for (const { id, character: raw } of EXAMPLE_CHARACTERS) {
        test(`${id} : fiche au format courant, lue sans conversion et sans rien changer`, () => {
            assert.ok(isCharacterData(raw));
            const { character, report } = migrateCharacter(structuredClone(raw));
            assert.deepEqual(report, [], 'aucune conversion d\'ancien format');
            assert.deepEqual(normalizeCharacter(character), character, 'forme déjà normalisée');
            for (const [key, value] of Object.entries(raw)) {
                assert.deepEqual(character[key], value, `valeur écrite gardée telle quelle : ${key}`);
            }
            // Export puis import : la même fiche
            assert.deepEqual(parseCharacterFile(serializeCharacter(character)).character, character);
        });

        test(`${id} : aucune clé nouvelle dans la sauvegarde`, () => {
            const known = new Set([...Object.keys(createDefaultCharacter()), ...V4_ONLY_KEYS]);
            const unknown = Object.keys(byId(id)).filter((key) => !known.has(key));
            assert.deepEqual(unknown, []);
            assert.ok(!('_visual_prefs' in byId(id)), 'l\'exemple garde le fond et le thème de l\'appareil');
        });
    }
});

describe('Personnages d\'exemple : cohérence avec les règles de 2024', () => {
    for (const { id } of EXAMPLE_CHARACTERS) {
        const character = byId(id);
        const d = deriveCharacter(character);
        const cls = DD_RULES.classes[d.classSlug];

        test(`${id} : classe, sous-classe, espèce et historique reconnus`, () => {
            assert.ok(cls, 'classe reconnue');
            assert.ok(d.subclass, 'sous-classe reconnue');
            assert.equal(DD_RULES.subclasses[d.subclass].class, d.classSlug);
            assert.ok(speciesView(character, d)?.known, 'espèce reconnue');
            assert.ok(backgroundOf(character), 'historique reconnu');
        });

        test(`${id} : PV maximum du manuel (valeur fixe par niveau), dé de vie de la classe`, () => {
            const faces = Number(cls.hitDice.slice(1));
            const tough = d.feats.includes('robuste') ? toughHitPoints(d.level) : 0;
            const expected = faces + d.mods.con + (d.level - 1) * (faces / 2 + 1 + d.mods.con) + tough;
            const hp = hitPointState(character);
            assert.equal(hp.max, expected);
            assert.ok(hp.current >= 1 && hp.current <= hp.max);
            assert.equal(character.hd_type, cls.hitDice);
            const dice = hitDiceState(character);
            assert.ok(dice.used >= 0 && dice.used < d.level, 'au moins un dé de vie disponible');
        });

        test(`${id} : PX du niveau, sans montée de niveau en attente`, () => {
            const progress = experienceProgress(character);
            assert.equal(progress.ready, false);
            assert.equal(progress.nextLevel, d.level + 1);
        });

        test(`${id} : sauvegardes et formations aux armures de la classe`, () => {
            const proficient = Object.keys(d.saves).filter((ability) => d.saves[ability].proficient).sort();
            assert.deepEqual(proficient, [...cls.savingThrows].sort());
            const training = armorTraining(character);
            assert.deepEqual(training, {
                light: cls.armorProf.includes('light'), medium: cls.armorProf.includes('medium'),
                heavy: cls.armorProf.includes('heavy'), shield: cls.armorProf.includes('shield')
            });
            assert.deepEqual(armorWarnings(character.dynamic_armors, training, d.scores.str).flat(), []);
        });

        test(`${id} : historique complet (rien « À vérifier »), 5 compétences (2 de classe, 2 d'historique, 1 d'Humain)`, () => {
            const summary = backgroundSummary(character);
            assert.deepEqual(summary.lines.filter((line) => line.check).map((line) => line.id), []);
            assert.equal(summary.canApply, false);
            const skills = Object.keys(d.skills).filter((skill) => d.skills[skill].proficient);
            assert.equal(skills.length, 5);
            for (const skill of backgroundOf(character).skillProfs) assert.ok(skills.includes(skill), skill);
            assert.equal(toolsInText(character.profs_tools).length, 1, 'l\'outil de l\'historique, reconnu dans la liste du manuel');
        });

        test(`${id} : dons existants, atteints, avec leurs choix faits`, () => {
            const slots = featSlots(character).filter((slot) => slot.featId);
            assert.ok(slots.length >= 2, 'don de l\'historique et don de l\'Humain');
            for (const slot of slots) {
                assert.ok(Object.hasOwn(FEATS_DATA, slot.featId), `don connu : ${slot.featId}`);
                assert.equal(slot.reached, true, `don atteint : ${slot.featId}`);
            }
            assert.equal(character.feat_1, backgroundOf(character).featId, 'don d\'origine de l\'historique');
            assert.equal(FEATS_DATA[character.feat_0].type, 'Origine', 'second don d\'origine (Humain)');
            for (const group of featSpellGroups(character, d)) {
                assert.deepEqual(group.missing, [], `${group.featName} : choix faits`);
                assert.deepEqual(group.warnings, [], `${group.featName} : aucun avertissement`);
            }
            assert.deepEqual(reachedFeatIds(character).sort(), slots.map((slot) => slot.featId).sort());
        });

        test(`${id} : armes du manuel, maîtrisées, calculées`, () => {
            assert.ok(character.dynamic_weapons.length >= 2);
            for (const weapon of character.dynamic_weapons) {
                const ref = DD_RULES.weapons.find((entry) => entry.name === weapon.name);
                assert.ok(ref, `arme du manuel : ${weapon.name}`);
                assert.equal(weapon.atkKey, ref.atk);
                assert.equal(weapon.baseDmg, ref.dmg);
                const computed = computeWeapon(weapon, d, {});
                assert.equal(computed.proficiency.proficient, true, `${weapon.name} maîtrisée`);
                assert.match(computed.attack.text, /[+-]\d+$/);
            }
        });
    }

    test('Guerrier : CA 19 (cotte de mailles, bouclier, style Défense), Initiative +3 (Vigilant), 28 PV', () => {
        const character = byId(FIGHTER);
        const d = deriveCharacter(character);
        assert.equal(d.armorClass.value, 19);
        assert.equal(d.initiative, 3);
        assert.equal(character.hp_max, '28');
        assert.equal(character.feat_2, 'defense');
        assert.equal(FEATS_DATA[character.feat_2].type, 'Style de combat');
        assert.equal(d.classResource.label, 'Second souffle');
        assert.equal(d.spellcasting, null, 'pas de magie');
        assert.deepEqual(character.dynamic_spells, []);
        // Bottes d'arme : trois armes, trois bottes différentes (Guerrier de niveau 3)
        const masteries = character.dynamic_weapons.map((weapon) => weapon.prof);
        assert.equal(new Set(masteries).size, 3);
    });

    test('Magicienne : DD 15, attaque +7, emplacements 4 / 3 / 2, un emplacement de niveau 1 déjà dépensé', () => {
        const character = byId(WIZARD);
        const d = deriveCharacter(character);
        assert.deepEqual(d.spellcasting, { ability: 'int', dc: 15, attack: 7 });
        assert.deepEqual(d.spellSlots, { 1: 4, 2: 3, 3: 2 });
        assert.deepEqual(slotView(character.spell_slots_state, '1', 4), { max: 4, used: 1 });
        assert.equal(d.armorClass.value, 12, 'sans armure ; la ligne « Armure de mage » n\'est pas cochée');
        const cast = structuredClone(character);
        cast.dynamic_armors[0].equipped = true;
        assert.equal(deriveCharacter(cast).armorClass.value, 15, 'Armure de mage lancée : 13 + Dex');
    });

    test('Magicienne : Érudition (niveau 2), l\'Expertise dans une compétence maîtrisée de la liste du Magicien', () => {
        const d = deriveCharacter(byId(WIZARD));
        const expert = Object.keys(d.skills).filter((skill) => d.skills[skill].expertise);
        assert.deepEqual(expert, ['arcana']);
        assert.ok(['arcana', 'history', 'insight', 'investigation', 'medicine', 'nature', 'religion'].includes(expert[0]));
        assert.equal(byId(WIZARD).skill_prof_arcana, true, 'compétence déjà maîtrisée');
        // Arcanes : Intelligence +4, bonus de maîtrise +3 compté deux fois
        assert.equal(d.skills.arcana.bonus, 10);
        // Le Guerrier de niveau 3 n'a aucune Expertise
        const fighter = deriveCharacter(byId(FIGHTER));
        assert.deepEqual(Object.keys(fighter.skills).filter((skill) => fighter.skills[skill].expertise), []);
    });

    test('Magicienne : chaque sort vient de la base, rempli comme par l\'auto-complétion, liste du Magicien', () => {
        const character = byId(WIZARD);
        const names = new Set();
        for (const row of character.dynamic_spells) {
            const spell = findSpellByName(SPELLS, row.name);
            assert.ok(spell, `sort de la base : ${row.name}`);
            assert.ok(spell.classes.includes('wizard'), `sort de Magicien : ${row.name}`);
            assert.deepEqual({ ...row, prep: false }, { ...spellToRow(spell, { note: '' }), prep: false }, row.name);
            assert.ok(Number(row.lvl) <= 3, 'niveau 3 au plus au niveau 5');
            assert.ok(!names.has(row.name), `pas de doublon : ${row.name}`);
            names.add(row.name);
        }
    });

    test('Magicienne : 4 sorts mineurs, 9 sorts préparés, livre de 17 sorts (Évocateur de niveau 5)', () => {
        const character = byId(WIZARD);
        const d = deriveCharacter(character);
        const granted = grantedSpellKeys(character, d);
        const counts = spellCounts(character.dynamic_spells, '', granted, false);
        const limits = classSpellCounts(d.classSlug, d.level);
        assert.deepEqual({ cantrips: counts.cantrips, prepared: counts.prepared }, limits);
        assert.ok(hasSpellbook(d.classSlug));
        assert.equal(spellbookCount(character.dynamic_spells, granted), freeSpellbookSpells(d.level, d.subclass).total);
        // Évocateur érudit : au moins trois sorts d'Évocation de niveau 1 ou plus dans le livre
        const evocations = character.dynamic_spells.filter((row) => row.school === 'Évocation' && row.lvl !== '0');
        assert.ok(evocations.length >= 3);
        // Les sorts mineurs ne se préparent pas
        assert.ok(character.dynamic_spells.filter((row) => row.lvl === '0').every((row) => row.prep === false));
    });
});

describe('Personnages d\'exemple : protections à l\'ouverture', () => {
    test('La fiche remplacée est gardée dans « Revenir à… », avec son motif', () => {
        assert.equal(EXAMPLE_SOURCE, 'example');
        assert.equal(reasonForReplace(EXAMPLE_SOURCE), 'example');
        assert.ok(SNAPSHOT_REASONS.example);
        const map = new Map();
        const storage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
        const mine = { ...createDefaultCharacter(), char_name: 'Korgul', hp_current: '31' };
        assert.deepEqual(takeSnapshot(mine, reasonForReplace(EXAMPLE_SOURCE), { storage }), { saved: true });
        const [kept] = readSnapshots(storage);
        assert.equal(kept.reason, 'example');
        assert.equal(kept.name, 'Korgul');
        assert.equal(JSON.parse(kept.text).hp_current, '31');
    });

    test('Un exemple n\'est jamais pris pour une fiche vierge (il est gardé à son tour s\'il est remplacé)', () => {
        for (const { id } of EXAMPLE_CHARACTERS) assert.equal(isBlankCharacter(byId(id)), false);
    });
});
