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
import { spellCounts, findSpellByName, spellToRow, slotView, spellNameKey } from '../js/rules/spells.js';
import { grantedSpellKeys, givenSpellKeys, highestSlotLevel, wholeListSource } from '../js/rules/spell-preparation.js';
import { hitDiceState } from '../js/rules/rest.js';
import { hitPointState } from '../js/rules/hit-points.js';
import { toolsInText } from '../js/rules/tools.js';
import { companionCards } from '../js/rules/subclass-companions.js';
import { featChoiceGrants } from '../js/rules/feat-choices.js';
import { toolSources, toolSourceProgress } from '../js/rules/tool-sources.js';
import { subclassChoiceFields, subclassChoice } from '../js/rules/subclass-choices.js';
import { spellChoiceView } from '../js/rules/spell-choices.js';
import { FEATS_DATA } from '../js/data/feats.js';

// Règles du PHB 2024 que la fiche ne calcule pas : compétences de classe, Expertise par niveau,
// compétence en plus de l'espèce (Humain : Doué ; Elfe : Sens aiguisés), bottes d'armes par niveau
const CLASS_SKILLS = { barbarian: 2, bard: 3, cleric: 2, druid: 2, fighter: 2, monk: 2, paladin: 2, ranger: 3, rogue: 4, sorcerer: 2, warlock: 2, wizard: 2 };
const EXPERTISE = { rogue: [[1, 2], [6, 2]], bard: [[2, 2], [9, 2]], ranger: [[1, 1], [9, 2]], wizard: [[2, 1]] };
const SPECIES_SKILLS = { human: 1, elf: 1 };
const MASTERIES = { barbarian: [[1, 2], [4, 3], [10, 4]], fighter: [[1, 3], [4, 4], [10, 5], [16, 6]], paladin: [[1, 2]], ranger: [[1, 2]], rogue: [[1, 2]] };
const expertiseAt = (cls, level) => (EXPERTISE[cls] ?? []).filter(([at]) => at <= level).reduce((n, [, add]) => n + add, 0);
const masteriesAt = (cls, level) => (MASTERIES[cls] ?? []).filter(([at]) => at <= level).reduce((n, [, count]) => count, 0);
// Maîtrises en plus d'une capacité : Savoir primal (Barbare 3), Collège du Savoir (3), et celles
// que la fiche demande de cocher (SUBCLASS_PROFICIENCIES, js/rules/subclass-calcs.js)
const SUBCLASS_SKILLS = { path_of_the_heretic: 1, warrior_of_mercy: 2, prophecy_domain: 1 };
const featureSkills = (d) => (d.classSlug === 'barbarian' && d.level >= 3 ? 1 : 0)
    + (d.subclass === 'college_of_lore' && d.level >= 3 ? 3 : 0) + (d.level >= 3 ? SUBCLASS_SKILLS[d.subclass] ?? 0 : 0);
const extraSaves = (d) => [...(d.subclass === 'demigod_bloodline' && d.level >= 3 ? ['str'] : []),
    ...(d.subclass === 'gloom_stalker' && d.level >= 7 ? [d.subclassChoices?.save || 'wis'] : [])];
// Formations d'armure en plus de la classe : sous-classes (SUBCLASS_ARMOR_TRAINING,
// js/rules/class-features.js), Ordre divin Protecteur (Clerc), Ordre primitif Gardien (Druide)
const extraArmor = (d) => {
    const extra = new Set();
    for (const [subclass, at, kinds] of [['college_of_valor', 3, ['medium', 'shield']], ['college_of_epic_muse', 6, ['medium']],
        ['the_odyssean', 3, ['shield']], ['way_of_the_shield_dancer', 3, ['shield']]]) {
        if (d.subclass === subclass && d.level >= at) kinds.forEach((kind) => extra.add(kind));
    }
    if (d.classSlug === 'cleric') extra.add('heavy');
    if (d.classSlug === 'druid') extra.add('medium');
    return extra;
};
// Sorts mineurs en plus d'une option de classe : Thaumaturge (Clerc), Mage (Druide), Pacte du grimoire (Occultiste)
const extraCantrips = (d) => ({ cleric: 1, druid: 1, warlock: 3 })[d.classSlug] ?? 0;
const ALL_EXAMPLES = ['barbare-6', 'barde-9', 'clerc-7', 'druide-5', 'ensorceleur-12', 'guerrier-3', 'magicienne-5', 'moine-11',
    'occultiste-15', 'paladin-10', 'rodeur-8', 'roublard-13'];

const SPELLS = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
const byId = (id) => exampleCharacter(id);
const FIGHTER = 'guerrier-3';
const WIZARD = 'magicienne-5';
const PALADIN = 'paladin-10';

describe('Personnages d\'exemple : liste et lecture', () => {
    test('Un exemple par classe, rangés par classe, du niveau 3 au niveau 15 (demande de Franck)', () => {
        assert.deepEqual(listExamples().map((e) => e.id), ALL_EXAMPLES);
        const classes = ALL_EXAMPLES.map((id) => deriveCharacter(byId(id)).classSlug);
        assert.deepEqual([...classes].sort(), Object.keys(DD_RULES.classes).sort(), 'toutes les classes, une fois chacune');
        for (const id of ALL_EXAMPLES) {
            const level = Number(byId(id).char_level);
            assert.ok(level >= 3 && level <= 15, `${id} : niveau ${level}`);
        }
        assert.equal(byId(FIGHTER).char_class, 'Guerrier');
        assert.equal(byId(FIGHTER).char_level, '3');
        assert.equal(byId(WIZARD).char_class, 'Magicien');
        assert.equal(byId(WIZARD).char_level, '5');
        assert.equal(byId(PALADIN).char_class, 'Paladin');
        assert.equal(byId(PALADIN).char_level, '10');
    });

    test('Chaque exemple a un identifiant unique, un nom et une phrase pour le joueur', () => {
        const ids = new Set();
        for (const example of listExamples()) {
            assert.ok(!ids.has(example.id), `identifiant en double : ${example.id}`);
            ids.add(example.id);
            assert.ok(example.title && example.subtitle && example.pitch, example.id);
            assert.equal(example.title, characterName(byId(example.id)), 'le titre est le nom du personnage');
            assert.ok(example.pitch.length <= 110, `phrase courte : ${example.pitch}`);
            // Sous-titre : classe et espèce écrites comme dans les listes de la fiche
            const sheet = byId(example.id);
            assert.ok(example.subtitle.startsWith(`${sheet.char_class} (${sheet.char_subclass}) de niveau ${sheet.char_level} · ${sheet.char_species} · ${sheet.char_background}`), example.subtitle);
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
            // Robustesse naine et Résilience draconique : +1 PV par niveau
            const perLevel = (speciesView(character, d)?.slug === 'dwarf' ? d.level : 0) + (d.subclass === 'draconic_sorcery' ? d.level : 0);
            const expected = faces + d.mods.con + (d.level - 1) * (faces / 2 + 1 + d.mods.con) + tough + perLevel;
            const hp = hitPointState(character);
            assert.equal(hp.max, expected);
            assert.equal(hp.current, hp.max, 'prêt à jouer : PV au maximum');
            assert.equal(character.hd_type, cls.hitDice);
            const dice = hitDiceState(character);
            assert.equal(dice.used, 0, 'prêt à jouer : aucun dé de vie dépensé');
        });

        test(`${id} : XP du niveau, sans montée de niveau en attente`, () => {
            const progress = experienceProgress(character);
            assert.equal(progress.ready, false);
            assert.equal(progress.nextLevel, d.level + 1);
        });

        test(`${id} : sauvegardes et formations aux armures de la classe`, () => {
            const proficient = Object.keys(d.saves).filter((ability) => d.saves[ability].proficient).sort();
            assert.deepEqual(proficient, [...new Set([...cls.savingThrows, ...extraSaves(d)])].sort());
            const training = armorTraining(character);
            const extra = extraArmor(d);
            for (const kind of ['light', 'medium', 'heavy', 'shield']) {
                if (cls.armorProf.includes(kind)) assert.equal(training[kind], true, `formation de la classe : ${kind}`);
                else if (training[kind]) assert.ok(extra.has(kind), `formation en plus justifiée : ${kind}`);
            }
            assert.deepEqual(armorWarnings(character.dynamic_armors, training, d.scores.str).flat(), []);
        });

        test(`${id} : historique complet (rien « À vérifier »), compétences de la classe, de l'historique, de l'espèce et des dons, Expertise`, () => {
            const summary = backgroundSummary(character);
            assert.deepEqual(summary.lines.filter((line) => line.check).map((line) => line.id), []);
            assert.equal(summary.canApply, false);
            const skills = Object.keys(d.skills).filter((skill) => d.skills[skill].proficient);
            const fromFeats = featChoiceGrants(character).reduce((n, grant) => n + grant.skills.length, 0);
            const species = speciesView(character, d).slug;
            assert.equal(skills.length, CLASS_SKILLS[d.classSlug] + featureSkills(d) + 2 + (SPECIES_SKILLS[species] ?? 0) + fromFeats);
            for (const skill of backgroundOf(character).skillProfs) assert.ok(skills.includes(skill), skill);
            const expert = Object.keys(d.skills).filter((skill) => d.skills[skill].expertise);
            assert.equal(expert.length, expertiseAt(d.classSlug, d.level), 'Expertise de la classe');
            for (const skill of expert) assert.ok(skills.includes(skill), `Expertise dans une compétence maîtrisée : ${skill}`);
            // Outils de l'historique et des dons : reconnus dans la liste du manuel et notés
            assert.ok(toolsInText(character.profs_tools).length >= 1);
            for (const progress of toolSourceProgress(toolSources(character), character)) assert.ok(progress.done, `outils : ${progress.id} ${progress.status}`);
        });

        test(`${id} : dons existants, atteints, avec leurs choix faits`, () => {
            const slots = featSlots(character).filter((slot) => slot.featId);
            assert.ok(slots.length >= 1, 'don de l\'historique');
            for (const slot of slots) {
                assert.ok(Object.hasOwn(FEATS_DATA, slot.featId), `don connu : ${slot.featId}`);
                assert.equal(slot.reached, true, `don atteint : ${slot.featId}`);
            }
            assert.equal(character.feat_1, backgroundOf(character).featId, 'don d\'origine de l\'historique');
            if (speciesView(character, d).slug === 'human') assert.equal(FEATS_DATA[character.feat_0].type, 'Origine', 'second don d\'origine (Humain)');
            else assert.ok(!character.feat_0, 'second don d\'origine réservé à l\'Humain');
            for (const grant of featChoiceGrants(character)) assert.deepEqual(grant.missing, [], `${grant.featName} : choix faits`);
            // Un emplacement de don à chaque niveau prévu (4, 8, 12 ; 10 du Roublard)
            for (const at of [4, 8, 12, ...(d.classSlug === 'rogue' ? [10] : [])].filter((at) => at <= d.level)) {
                assert.ok(character[`feat_${at}`], `don du niveau ${at}`);
            }
            for (const group of featSpellGroups(character, d)) {
                assert.deepEqual(group.missing, [], `${group.featName} : choix faits`);
                assert.deepEqual(group.warnings, [], `${group.featName} : aucun avertissement`);
            }
            // Un même don peut revenir (Amélioration de caractéristique aux niveaux 4 et 8)
            assert.deepEqual(reachedFeatIds(character).sort(), [...new Set(slots.map((slot) => slot.featId))].sort());
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
                if (weapon.prof) assert.equal(weapon.prof, ref.prof, `botte de l'arme : ${weapon.name}`);
            }
            const masteries = new Set(character.dynamic_weapons.map((weapon) => weapon.prof).filter(Boolean));
            assert.ok(masteries.size <= masteriesAt(d.classSlug, d.level), 'pas plus de bottes d\'armes que la classe');
        });

        test(`${id} : sorts de la base, de la liste de la classe ou donnés ; mineurs et préparés de la table ; emplacements pleins`, () => {
            const rows = character.dynamic_spells;
            if (!d.spellcasting) {
                assert.deepEqual(rows.filter((row) => !grantedSpellKeys(character, d, SPELLS).has(spellNameKey(row.name))), [], 'pas de sorts de classe');
                return;
            }
            assert.equal(character.spell_ability, d.spellcasting.ability);
            const granted = grantedSpellKeys(character, d, SPELLS);
            const maxLevel = highestSlotLevel(d.spellSlots);
            const names = new Set();
            for (const row of rows) {
                const spell = findSpellByName(SPELLS, row.name);
                assert.ok(spell, `sort de la base : ${row.name}`);
                const given = granted.has(spellNameKey(row.name));
                assert.ok([d.classSlug, ...(wholeListSource(d)?.lists ?? [])].some((list) => spell.classes.includes(list)) || given, `sort de la liste ou donné : ${row.name}`);
                assert.deepEqual({ ...row, prep: false }, { ...spellToRow(spell, { note: '' }), prep: false }, row.name);
                assert.ok(Number(row.lvl) <= maxLevel || given, `niveau du sort atteint : ${row.name}`);
                assert.ok(!(row.lvl === '0' && row.prep), `un sort mineur ne se prépare pas : ${row.name}`);
                assert.ok(!names.has(row.name), `pas de doublon : ${row.name}`);
                names.add(row.name);
            }
            const counts = spellCounts(rows, '', granted, false);
            const limits = classSpellCounts(d.classSlug, d.level);
            if (limits.cantrips !== null) {
                assert.ok(counts.cantrips >= limits.cantrips && counts.cantrips <= limits.cantrips + extraCantrips(d), `sorts mineurs de la table : ${counts.cantrips} pour ${limits.cantrips}`);
            }
            if (limits.prepared !== null) assert.equal(counts.prepared, limits.prepared, 'sorts préparés de la table');
            for (const [level, max] of Object.entries(d.spellSlots)) {
                assert.deepEqual(slotView(character.spell_slots_state, level, max), { max, used: 0 });
            }
            for (const feature of spellChoiceView(character, d, { db: SPELLS, maxLevel, given: givenSpellKeys(character, d) })) {
                for (const field of feature.fields) {
                    assert.ok(field.value, `${feature.name} : ${field.label} choisi`);
                    assert.equal(field.warning, '', `${feature.name} : ${field.label}`);
                }
            }
        });

        test(`${id} : choix de sous-classe faits, compagnons aux PV pleins, Points de Foi pleins`, () => {
            const chosen = subclassChoice(character, d);
            for (const field of subclassChoiceFields(d)) {
                if (!field.inPlay && field.kind !== 'number') assert.ok(chosen[field.key], `${field.label} choisi`);
            }
            for (const card of companionCards(d, character)) if (card.hp) assert.equal(card.hp.current, card.hp.max, card.name);
            if (character.heroic_inspiration) {
                const faith = Math.max(1, d.pb + d.mods.wis);
                assert.equal(character.heroic_inspiration, `${faith}/${faith}`, 'Points de Foi : bonus de maîtrise + Sagesse');
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

    test('Magicienne : DD 15, attaque +7, emplacements 4 / 3 / 2, aucun dépensé', () => {
        const character = byId(WIZARD);
        const d = deriveCharacter(character);
        assert.deepEqual(d.spellcasting, { ability: 'int', dc: 15, attack: 7 });
        assert.deepEqual(d.spellSlots, { 1: 4, 2: 3, 3: 2 });
        for (const [level, max] of Object.entries(d.spellSlots)) {
            assert.deepEqual(slotView(character.spell_slots_state, level, max), { max, used: 0 });
        }
        assert.equal(d.armorClass.value, 12, 'sans armure ; la ligne « Armure du mage » n\'est pas cochée');
        const cast = structuredClone(character);
        cast.dynamic_armors[0].equipped = true;
        assert.equal(deriveCharacter(cast).armorClass.value, 15, 'Armure du mage lancée : 13 + Dex');
    });

    test('Paladin : CA 21 (harnois, bouclier, style Défense), 104 PV (Robuste), DD 15, emplacements 4 / 3 / 2', () => {
        const character = byId(PALADIN);
        const d = deriveCharacter(character);
        assert.equal(d.armorClass.value, 21);
        assert.equal(character.feat_0, 'robuste');
        assert.equal(hitPointState(character).max, 104);
        assert.deepEqual(d.spellcasting, { ability: 'cha', dc: 15, attack: 7 });
        assert.deepEqual(d.spellSlots, { 1: 4, 2: 3, 3: 2 });
        for (const [level, max] of Object.entries(d.spellSlots)) {
            assert.deepEqual(slotView(character.spell_slots_state, level, max), { max, used: 0 });
        }
        // Mode Odyssée (sous-classe de l'Odyssée) : Points de Foi pleins, bonus de maîtrise + Sagesse
        assert.notEqual(character.odyssey_mode, 'off');
        assert.equal(character.heroic_inspiration, `${d.pb + d.mods.wis}/${d.pb + d.mods.wis}`);
        // Bottes d'arme : deux armes, deux bottes différentes (Paladin)
        assert.equal(new Set(character.dynamic_weapons.map((weapon) => weapon.prof)).size, 2);
    });

    test('Paladin : pseudodragon familier et dragonnet d\'airain lié (œuf choisi), PV pleins', () => {
        const character = byId(PALADIN);
        const d = deriveCharacter(character);
        const cards = companionCards(d, character);
        assert.equal(cards.length, 2);
        const [familiar, dragon] = cards;
        assert.match(familiar.name, /^Pseudodragon/);
        assert.match(dragon.name, /airain/);
        assert.equal(dragon.hp.max, 40 + 2 * d.level);
        for (const card of cards) assert.equal(card.hp.current, card.hp.max, `${card.name} : PV pleins`);
    });

    test('Paladin : chaque sort vient de la base, de la liste du Paladin ou donné ; 9 sorts préparés', () => {
        const character = byId(PALADIN);
        const d = deriveCharacter(character);
        const granted = grantedSpellKeys(character, d, SPELLS);
        const names = new Set();
        for (const row of character.dynamic_spells) {
            const spell = findSpellByName(SPELLS, row.name);
            assert.ok(spell, `sort de la base : ${row.name}`);
            assert.ok(spell.classes.includes('paladin') || granted.has(spellNameKey(row.name)), `sort de Paladin ou donné : ${row.name}`);
            assert.deepEqual({ ...row, prep: false }, { ...spellToRow(spell, { note: '' }), prep: false }, row.name);
            assert.ok(Number(row.lvl) >= 1 && Number(row.lvl) <= 3, 'niveau 1 à 3 au niveau 10');
            assert.ok(!names.has(row.name), `pas de doublon : ${row.name}`);
            names.add(row.name);
        }
        // Sorts donnés (Châtiment divin, Appel de destrier, sorts du serment) : tous notés
        for (const name of ['Châtiment divin', 'Appel de destrier', 'Appel de familier', 'Marque du chasseur', 'Bourrasque', 'Lévitation', 'Hâte', 'Vol']) {
            assert.ok(names.has(name), name);
            assert.ok(granted.has(spellNameKey(name)), `donné : ${name}`);
        }
        const counts = spellCounts(character.dynamic_spells, '', granted, false);
        assert.equal(counts.prepared, classSpellCounts(d.classSlug, d.level).prepared);
    });

    test('Équipement : noms du manuel français de 2024 (paquetage, grimoire, armure du mage)', () => {
        const fighter = byId(FIGHTER);
        const wizard = byId(WIZARD);
        assert.match(fighter.equipment, /^Paquetage d'exploration souterraine/);
        assert.match(wizard.equipment, /^Grimoire, bâton de combat/);
        assert.match(wizard.equipment, /paquetage d'érudit/);
        assert.equal(wizard.dynamic_armors[0].name, 'Armure du mage (sort)');
        for (const text of [fighter.equipment, wizard.equipment]) {
            assert.doesNotMatch(text, /sac d'|livre de sorts/i, 'anciens noms');
        }
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
