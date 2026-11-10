// =============================================================================
// Sous-classes, lot 7 : compagnons et familiers (Maître des bêtes, Conclave des Amazones, Serment du
// Seigneur Dragon) : cartes calculées, choix mémorisés, PV actuels (clé subclass_companions), repos,
// case « Souffle du dragon ». Exemples chiffrés de la spécification du lot.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCharacter } from '../js/rules/character.js';
import {
    SUBCLASS_COMPANIONS_KEY, COMPANION_KEYS, companionCards, companionHp, companionsState, setCompanionHpPatch,
    companionChoicePatch, restCompanions
} from '../js/rules/subclass-companions.js';
import { subclassChoiceFields, subclassChoice, setSubclassChoicePatch, subclassChoiceNotes } from '../js/rules/subclass-choices.js';
import { subclassFeatures } from '../js/rules/subclass-features.js';
import { subclassCounters, restSubclassUses } from '../js/rules/subclass-uses.js';
import { planShortRest, planLongRest } from '../js/rules/rest.js';
import { DRAGONLINGS, PRIMAL_BEASTS } from '../js/data/subclass-companions.js';
import { V4_ONLY_KEYS, withoutV4State } from '../js/cloud/sync.js';
import { migrateCharacter } from '../js/state/migrate.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const record = (cls, subclass, level, key, choices, extra = {}) => ({
    ...createDefaultCharacter(), char_class: cls, char_subclass: subclass, char_level: String(level),
    ...(choices ? { subclass_choices: { [key]: choices } } : {}), ...extra
});
const beastMaster = (level, choices, extra) => record('Rôdeur', 'Maître des Bêtes', level, 'beast_master', choices, extra);
const amazon = (level, choices, extra) => record('Rôdeur', 'Conclave des Amazones', level, 'amazon_warrior', choices, extra);
const dragonlord = (level, choices, extra) => record('Paladin', 'Serment du Seigneur Dragon', level, 'oath_of_the_dragonlords', choices, extra);

const cards = (c) => companionCards(deriveCharacter(c), c);
const card = (c, key) => cards(c).find(x => x.key === key);
const saves = (x) => x.abilities.map(a => a.save);
const action = (x, name) => x.actions.find(a => a.name.startsWith(name));
const trait = (x, name) => x.traits.find(t => t.name.startsWith(name));
const auto = (c, id) => subclassFeatures(deriveCharacter(c)).reached.find(f => f.id === id)?.automation;

describe('Choix des compagnons', () => {
    test('Maître des bêtes : bête (en jeu, rappel au repos long), type de Frappe seulement pour Terre et Mer', () => {
        const fields = (choices) => subclassChoiceFields(deriveCharacter(beastMaster(3, choices))).map(f => [f.key, f.inPlay]);
        assert.deepEqual(fields({}), [['beast', true]]);
        assert.deepEqual(fields({ beast: 'land' }), [['beast', true], ['strike', true]]);
        assert.deepEqual(fields({ beast: 'sea' }), [['beast', true], ['strike', true]]);
        assert.deepEqual(fields({ beast: 'sky' }), [['beast', true]]);
        assert.equal(subclassChoiceFields({ subclass: 'beast_master', level: 3 })[0].restReminder, 'long');
        // Ciel : le type enregistré est ignoré
        assert.deepEqual(deriveCharacter(beastMaster(3, { beast: 'sky', strike: 'piercing' })).subclassChoices, { beast: 'sky' });
        assert.deepEqual(subclassChoice(beastMaster(3, { strike: 'piercing' }), { subclass: 'beast_master', level: 3 }), {});
        assert.deepEqual(setSubclassChoicePatch(beastMaster(3), 'beast_master', 'beast', 'cave'), {});
    });

    test('rappel de fin de repos long : bête actuelle', () => {
        const c = beastMaster(3, { beast: 'land' });
        const rest = subclassChoiceNotes(deriveCharacter(c), c).rest ?? [];
        assert.equal(rest.length, 1);
        assert.match(rest[0].text, /Bête des terres/);
        assert.equal(rest[0].restKind, 'long');
    });

    test('Amazone : apparence de la stimfée, choix de construction ; Seigneur Dragon : œuf (inchangé)', () => {
        const amazonFields = subclassChoiceFields({ subclass: 'amazon_warrior', level: 3 });
        assert.equal(amazonFields.find(f => f.key === 'stimfee').inPlay, false);
        assert.equal(amazonFields.find(f => f.key === 'stimfee').options.length, 7);
        assert.deepEqual(subclassChoiceFields({ subclass: 'oath_of_the_dragonlords', level: 7 }).map(f => f.key), ['egg']);
        assert.deepEqual(Object.keys(DRAGONLINGS), ['brass', 'bronze', 'copper', 'silver']);
        assert.ok(Object.values(DRAGONLINGS).every(d => d.verify === true), 'blocs du Manuel des monstres 2014 à vérifier');
    });
});

describe('Maître des bêtes : compagnon primitif', () => {
    test('pas de carte avant la sous-classe ; sans bête choisie : carte réduite, sans PV ni Frappe', () => {
        assert.deepEqual(cards(record('Rôdeur', 'Maître des Bêtes', 2, 'beast_master')), []);
        const c = card(beastMaster(3, undefined, { wis_score: '16' }), COMPANION_KEYS.primal);
        assert.match(c.missing, /Choisissez la bête/);
        assert.equal(c.hp, null);
        assert.deepEqual(c.actions, []);
        assert.deepEqual(c.abilities, []);
        assert.equal(c.ac.value, 16);
    });

    test('Terre, niveau 3, Sagesse 16 : CA 16, PV 20 (3d8), Frappe +5, 1d8 + 5, charge', () => {
        const c = card(beastMaster(3, { beast: 'land', strike: 'piercing' }, { wis_score: '16' }), COMPANION_KEYS.primal);
        assert.equal(c.ac.value, 16);
        assert.deepEqual([c.hp.max, c.hp.current, c.hp.dice], [20, 20, '3d8']);
        assert.deepEqual(saves(c), [4, 4, 4, 1, 4, 2]);
        const strike = action(c, 'Frappe de bête');
        assert.equal(strike.name, 'Frappe de bête');
        assert.match(strike.text, /^Corps à corps \+5, allonge 1,5 m\. Touché : 1d8 \+ 5 perforants\./);
        assert.match(strike.text, /\+1d6 dégâts du même type/);
        assert.doesNotMatch(strike.text, /Force/);
        assert.match(c.lines.find(([label]) => label === 'Sens')[1], /Perception passive 14 \(12 du bloc \+ 2/);
    });

    test('Terre sans type choisi : les trois types proposés', () => {
        const c = card(beastMaster(3, { beast: 'land' }), COMPANION_KEYS.primal);
        assert.match(action(c, 'Frappe').text, /contondants, perforants ou tranchants \(type à choisir/);
    });

    test('niveau 7 : PV 40, +6, dégâts de Force possibles, action bonus de la bête', () => {
        const c = card(beastMaster(7, { beast: 'land', strike: 'slashing' }, { wis_score: '16' }), COMPANION_KEYS.primal);
        assert.equal(c.hp.max, 40);
        assert.match(action(c, 'Frappe').text, /\+6, .*1d8 \+ 5 tranchants \(ou Force/);
        assert.match(action(c, 'Ordres').text, /action Désengagement, Esquive, Pointe ou Soutien/);
        assert.deepEqual(saves(c), [5, 5, 5, 2, 5, 3]);
    });

    test('niveau 11, Sagesse 18 : CA 17, PV 60, deux Frappes, Furie grisée sans Marque du chasseur', () => {
        const c11 = (extra = {}) => card(beastMaster(11, { beast: 'land', strike: 'piercing' }, { wis_score: '18', ...extra }), COMPANION_KEYS.primal);
        const c = c11();
        assert.equal(c.ac.value, 17);
        assert.equal(c.hp.max, 60);
        assert.equal(action(c, 'Frappe').name, 'Frappe de bête (×2 par ordre)');
        assert.match(action(c, 'Frappe').text, /\+8, .*1d8 \+ 6 perforants/);
        assert.deepEqual(saves(c), [6, 6, 6, 3, 6, 4]);
        assert.equal(trait(c, 'Fureur bestiale').inactive, true);
        const marked = c11({ combat_buffs: { hunterMark: true } });
        assert.equal(trait(marked, 'Fureur bestiale').inactive, undefined);
        assert.match(trait(marked, 'Fureur bestiale').text, /\+1d6 dégâts de Force/);
        assert.equal(trait(c, 'Partage des sorts'), undefined);
    });

    test('niveau 20 : dé de la Marque du chasseur 1d10 ; niveau 15 : Partage des sorts', () => {
        const c = card(beastMaster(20, { beast: 'sea' }, { combat_buffs: { hunterMark: true } }), COMPANION_KEYS.primal);
        assert.match(trait(c, 'Fureur bestiale').text, /\+1d10/);
        assert.ok(trait(card(beastMaster(15, { beast: 'sea' }), COMPANION_KEYS.primal), 'Partage des sorts'));
    });

    test('Mer : 1d6 + 2 + Sag, agrippe (DD d\'évasion = DD des sorts) ; un type tranchant est ignoré', () => {
        const c = card(beastMaster(3, { beast: 'sea', strike: 'slashing' }, { wis_score: '16' }), COMPANION_KEYS.primal);
        assert.equal(c.hp.max, 20);
        assert.equal(c.speed, '1,5 m, nage 18 m');
        const strike = action(c, 'Frappe').text;
        assert.match(strike, /1d6 \+ 5 contondants ou perforants \(type à choisir/);
        assert.match(strike, /Agrippée \(DD d'évasion 13\)/);
        assert.match(c.notes[0], /Tranchants.*ignoré/);
        assert.ok(trait(c, 'Amphibie'));
        assert.match(action(card(beastMaster(3, { beast: 'sea', strike: 'bludgeoning' }), COMPANION_KEYS.primal), 'Frappe').text, / contondants\./);
    });

    test('Ciel : Petite, PV 4 + 4 × niveau (d6), 1d4 + 3 + Sag tranchants, Repli aérien', () => {
        const c = card(beastMaster(3, { beast: 'sky' }, { wis_score: '16' }), COMPANION_KEYS.primal);
        assert.deepEqual([c.hp.max, c.hp.dice], [16, '3d6']);
        assert.match(action(c, 'Frappe').text, /\+5, .*1d4 \+ 6 tranchants\./);
        assert.deepEqual(saves(c), [0, 5, 3, 1, 4, 2]);
        assert.ok(trait(c, 'Repli aérien'));
        assert.equal(card(beastMaster(7, { beast: 'sky' }), COMPANION_KEYS.primal).hp.max, 32);
        assert.equal(card(beastMaster(11, { beast: 'sky' }), COMPANION_KEYS.primal).hp.max, 48);
    });

    test('Sagesse négative (8) : CA 12, Ciel 1d4 + 2, attaque PB - 1', () => {
        const c = card(beastMaster(3, { beast: 'sky' }, { wis_score: '8' }), COMPANION_KEYS.primal);
        assert.equal(c.ac.value, 12);
        assert.match(action(c, 'Frappe').text, /^Corps à corps \+1, .*1d4 \+ 2 tranchants/);
        const sea = card(beastMaster(3, { beast: 'sea' }, { wis_score: '6' }), COMPANION_KEYS.primal);
        assert.match(action(sea, 'Frappe').text, /^Corps à corps \+0, .*Touché : 1d6 /);
    });

    test('données : trois bêtes', () => {
        assert.deepEqual(Object.keys(PRIMAL_BEASTS), ['land', 'sea', 'sky']);
    });
});

describe('Conclave des Amazones : stimfée', () => {
    test('niveau 3 : PV 18, CA 13, Serres +6 (1d6 + 2), Cri DD 12, sauvegardes mod + PB', () => {
        const c = card(amazon(3, { stimfee: 'owl' }), COMPANION_KEYS.stimfee);
        assert.equal(c.name, 'Stimfée (Chouette)');
        assert.deepEqual([c.hp.max, c.ac.value], [18, 13]);
        assert.match(action(c, 'Serres').text, /^Corps à corps \+6, allonge 1,5 m\. Touché : 1d6 \+ 2 tranchants\./);
        assert.match(action(c, 'Attaque en piqué').text, /^Distance \+6, portée 18 m\. Touché : 1d6 \+ 2 perforants\./);
        assert.match(action(c, 'Cri perçant').text, /DD 12 ; échec : 1d6 \+ 2 psychiques/);
        assert.deepEqual(saves(c), [2, 2, 2, 0, 1, 0]);
        assert.equal(trait(c, 'Interception'), undefined);
        assert.match(c.notes[0], /À confirmer par Franck/);
    });

    test('niveau 7 : PV 22, +7 ; niveau 11 : PV 41, CA 17, 2d6 + 4, attaques magiques, interception', () => {
        const c7 = card(amazon(7), COMPANION_KEYS.stimfee);
        assert.equal(c7.name, 'Stimfée');
        assert.equal(c7.hp.max, 22);
        assert.match(action(c7, 'Serres').text, /\+7, .*1d6 \+ 3/);
        const c11 = card(amazon(11), COMPANION_KEYS.stimfee);
        assert.deepEqual([c11.hp.max, c11.ac.value], [41, 17]);
        assert.match(action(c11, 'Serres').text, /\+8, .*2d6 \+ 4 tranchants, attaque magique/);
        assert.match(action(c11, 'Cri perçant').text, /DD 14 ; échec : 2d6 \+ 4/);
        assert.deepEqual(saves(c11), [4, 4, 4, 2, 3, 2]);
        assert.ok(trait(c11, 'Interception'));
        // Passage du niveau 10 au niveau 11
        assert.equal(card(amazon(10), COMPANION_KEYS.stimfee).hp.max, 25);
    });
});

describe('Serment du Seigneur Dragon : pseudodragon et dragon lié', () => {
    test('niveau 3 : pseudodragon (bloc constant, attaques grisées), pas de dragon', () => {
        const list = cards(dragonlord(3));
        assert.deepEqual(list.map(x => x.key), [COMPANION_KEYS.pseudodragon]);
        const p = list[0];
        assert.deepEqual([p.ac.value, p.hp.max, p.hp.dice], [14, 10, '3d4 + 3']);
        assert.deepEqual(saves(p), [-2, 2, 1, 0, 1, 0]);
        assert.ok(p.actions.length === 3 && p.actions.every(a => a.inactive === true));
        assert.match(trait(p, 'Œuf').text, /cherche un œuf/);
        assert.match(trait(card(dragonlord(3, { egg: 'brass' }), COMPANION_KEYS.pseudodragon), 'Œuf').text, /Œuf d'airain trouvé/);
        assert.match(trait(card(dragonlord(6), COMPANION_KEYS.pseudodragon), 'Œuf').text, /3d6 jours/);
        assert.equal(cards(dragonlord(6, { egg: 'bronze' })).length, 1);
    });

    test('niveau 7, œuf d\'airain : PV 54, CA 16, sauvegardes du bloc + 3, Morsure +4, souffles DD 11', () => {
        const d = card(dragonlord(7, { egg: 'brass' }), COMPANION_KEYS.dragon);
        assert.equal(d.name, 'Dragon lié : Dragonnet d\'airain');
        assert.deepEqual([d.hp.max, d.ac.value], [54, 16]);
        assert.deepEqual(saves(d), [5, 5, 6, 3, 5, 6]);
        assert.match(action(d, 'Morsure').text, /\+4, allonge 1,5 m\. Touché : 1d10 \+ 2 perforants/);
        assert.match(action(d, 'Souffle de feu').text, /^Ligne de 6 m sur 1,5 m ; sauvegarde de Dextérité DD 11/);
        assert.ok(d.notes.some(n => /Manuel des monstres 2014 : à vérifier par Franck/.test(n)));
        assert.match(trait(d, 'Pacte').text, /case « Souffle du dragon »/);
        assert.match(trait(card(dragonlord(7, { egg: 'brass' }), COMPANION_KEYS.pseudodragon), 'Œuf').text, /L'œuf d'airain a éclos/);
    });

    test('niveau 11 : PV 62 ; argent : CA 17, sauvegardes +8/+6/+9/+5/+6/+8, Morsure +6, DD 13', () => {
        assert.equal(card(dragonlord(11, { egg: 'brass' }), COMPANION_KEYS.dragon).hp.max, 62);
        assert.deepEqual(saves(card(dragonlord(11, { egg: 'brass' }), COMPANION_KEYS.dragon)), [6, 6, 7, 4, 6, 7]);
        const silver = card(dragonlord(11, { egg: 'silver' }), COMPANION_KEYS.dragon);
        assert.deepEqual([silver.hp.max, silver.ac.value], [62, 17]);
        assert.deepEqual(saves(silver), [8, 6, 9, 5, 6, 8]);
        assert.match(action(silver, 'Morsure').text, /\+6, .*1d10 \+ 4/);
        assert.match(action(silver, 'Souffle de froid').text, /Constitution DD 13/);
        assert.ok(trait(card(dragonlord(7, { egg: 'bronze' }), COMPANION_KEYS.dragon), 'Amphibie'));
    });

    test('niveau 7 sans couleur : PV 54 affichés, bloc à choisir', () => {
        const d = card(dragonlord(7), COMPANION_KEYS.dragon);
        assert.equal(d.hp.max, 54);
        assert.match(d.missing, /couleur de l'œuf/);
        assert.deepEqual([d.abilities, d.actions, d.ac], [[], [], null]);
    });

    test('niveau 15 : jeune dragon, monture (immunité et sens) ; bloc non recopié ; niveau 20 : recharge 5-6', () => {
        const d = card(dragonlord(15, { egg: 'copper' }), COMPANION_KEYS.dragon);
        assert.equal(d.name, 'Dragon lié : Jeune dragon de cuivre');
        assert.equal(d.hp.max, 70);
        assert.deepEqual([d.abilities, d.actions], [[], []]);
        assert.match(trait(d, 'Monture').text, /immunité à l'acide.*Perception passive 17/);
        assert.match(d.lines.find(([label]) => label === 'Sauvegardes')[1], /\+ 5/);
        assert.match(trait(card(dragonlord(20, { egg: 'copper' }), COMPANION_KEYS.dragon), 'Pacte').text, /recharge sur 5-6/);
    });

    test('case « Souffle du dragon » : niveau 7 à 19, rendue au repos court ; aucune au niveau 20', () => {
        const breath = (c) => subclassCounters(c, deriveCharacter(c)).find(x => x.feature === 'lien_du_seigneur_dragon');
        assert.equal(breath(dragonlord(6)), undefined);
        assert.deepEqual([breath(dragonlord(7)).max, breath(dragonlord(7)).reset, breath(dragonlord(7)).label], [1, 'short', 'Souffle du dragon']);
        assert.equal(breath(dragonlord(19)).max, 1);
        assert.equal(breath(dragonlord(20)), undefined);
        const used = dragonlord(7, { egg: 'brass' }, { subclass_uses: { 'oath_of_the_dragonlords.lien_du_seigneur_dragon': 1 } });
        assert.equal(restSubclassUses(used, deriveCharacter(used), 'short').patch.subclass_uses['oath_of_the_dragonlords.lien_du_seigneur_dragon'], 0);
    });
});

describe('PV actuels des compagnons (clé subclass_companions)', () => {
    const key = COMPANION_KEYS.stimfee;
    const withHp = (hp) => amazon(3, {}, { subclass_companions: { [key]: { hp } } });

    test('clé propre à la v4, absente des anciennes fiches, gardée par la migration', () => {
        assert.equal(SUBCLASS_COMPANIONS_KEY, 'subclass_companions');
        assert.ok(V4_ONLY_KEYS.includes('subclass_companions'));
        assert.equal('subclass_companions' in createDefaultCharacter(), false);
        const c = withHp(7);
        assert.deepEqual(migrateCharacter(JSON.parse(JSON.stringify(c))).character.subclass_companions, c.subclass_companions);
        assert.equal(migrateCharacter(JSON.parse(JSON.stringify(amazon(3)))).character.subclass_companions, undefined);
        assert.equal('subclass_companions' in withoutV4State(c), false);
    });

    test('absente ou abîmée : PV pleins ; valeur bornée entre 0 et le maximum, jamais réécrite', () => {
        assert.deepEqual(companionsState({ subclass_companions: null }), {});
        assert.deepEqual(companionsState({ subclass_companions: [1, 2] }), {});
        assert.equal(companionHp({}, key, 18), 18);
        assert.equal(companionHp({ subclass_companions: { [key]: 5 } }, key, 18), 18);
        for (const [hp, expected] of [['abc', 18], [null, 18], ['', 18], [true, 18], [-3, 0], [999, 18], ['7', 7], [7.9, 7], [0, 0]]) {
            assert.equal(card(withHp(hp), key).hp.current, expected, String(hp));
        }
        // PV maximum qui baisse (niveau réduit) : affichage borné, sauvegarde inchangée
        const c = amazon(3, {}, { subclass_companions: { [key]: { hp: 30 } } });
        assert.equal(card(c, key).hp.current, 18);
        assert.equal(c.subclass_companions[key].hp, 30);
    });

    test('patch : enregistre (borné), efface avec une case vide, refuse un texte illisible ou une clé inconnue', () => {
        const c = amazon(3, {}, { subclass_companions: { other: { hp: 2 } } });
        assert.deepEqual(setCompanionHpPatch(c, key, '12', 18), { subclass_companions: { other: { hp: 2 }, [key]: { hp: 12 } } });
        assert.equal(setCompanionHpPatch(c, key, '40', 18).subclass_companions[key].hp, 18);
        assert.equal(setCompanionHpPatch(c, key, '-4', 18).subclass_companions[key].hp, 0);
        assert.deepEqual(setCompanionHpPatch(c, key, 'abc', 18), {});
        assert.deepEqual(setCompanionHpPatch(c, 'nope', '3', 18), {});
        assert.deepEqual(setCompanionHpPatch(c, key, '', 18), {});
        assert.deepEqual(setCompanionHpPatch(withHp(4), key, '', 18), { subclass_companions: {} });
        assert.deepEqual(c.subclass_companions, { other: { hp: 2 } });
    });

    test('nouvelle bête : ses PV enregistrés sont effacés ; autre choix : rien', () => {
        const c = beastMaster(3, { beast: 'land' }, { subclass_companions: { [COMPANION_KEYS.primal]: { hp: 3 }, [key]: { hp: 1 } } });
        assert.deepEqual(companionChoicePatch(c, 'beast_master', 'beast'), { subclass_companions: { [key]: { hp: 1 } } });
        assert.deepEqual(companionChoicePatch(c, 'beast_master', 'strike'), {});
        assert.deepEqual(companionChoicePatch(beastMaster(3), 'beast_master', 'beast'), {});
    });

    test('repos long : PV pleins (sous-classe actuelle seulement) ; repos court : inchangés', () => {
        const c = amazon(3, {}, { subclass_companions: { [key]: { hp: 4 }, [COMPANION_KEYS.primal]: { hp: 2 } } });
        const long = planLongRest(c);
        assert.deepEqual(long.patch.subclass_companions, { [COMPANION_KEYS.primal]: { hp: 2 } });
        assert.deepEqual(long.summary.companionsHealed, ['stimfée']);
        assert.equal('subclass_companions' in planShortRest(c).patch, false);
        assert.deepEqual(restCompanions(c, deriveCharacter(c), 'short'), { patch: {}, healed: [] });
        assert.equal('subclass_companions' in planLongRest(amazon(3)).patch, false);
        assert.deepEqual(planLongRest(amazon(3)).summary.companionsHealed, []);
    });

    test('autre sous-classe : cartes disparues, choix et PV conservés sous l\'ancienne clé', () => {
        const c = record('Rôdeur', 'Chasseur', 7, 'beast_master', { beast: 'sky' },
            { subclass_companions: { [COMPANION_KEYS.primal]: { hp: 3 } } });
        assert.deepEqual(cards(c), []);
        assert.equal('subclass_companions' in planLongRest(c).patch, false);
        assert.equal(c.subclass_choices.beast_master.beast, 'sky');
    });
});

describe('Textes « Dans la fiche »', () => {
    test('chaque capacité de compagnon renvoie à sa carte', () => {
        assert.match(auto(beastMaster(3), 'compagnon_primordial').text, /Bête à choisir/);
        assert.match(auto(beastMaster(3, { beast: 'land' }), 'compagnon_primordial').text, /Carte « Bête des terres » dans « Compagnons & familiers »/);
        assert.match(auto(beastMaster(11), 'furie_bestiale').text, /\+1d6 de Force/);
        assert.match(auto(amazon(3), 'compagnon_stimfee').text, /PV 18, attaques \+6 et DD 12/);
        assert.match(auto(dragonlord(3, { egg: 'bronze' }), 'familier_pseudodragon').text, /Œuf de dragon : bronze.*Carte du pseudodragon/);
        assert.match(auto(dragonlord(7), 'lien_du_seigneur_dragon').text, /PV 54 .*Souffle du dragon/);
        assert.match(auto(dragonlord(20), 'lien_du_seigneur_dragon').text, /recharge sur 5-6/);
        for (const [c, id] of [[beastMaster(15), 'partage_des_sorts'], [beastMaster(7), 'entrainement_exceptionnel'],
            [amazon(11), 'fauconniere_chevronnee'], [dragonlord(15), 'jeune_dragon']]) {
            assert.equal(auto(c, id).partial, true, id);
        }
    });
});

describe('Relecture du lot 7 : compagnon à 0 PV', () => {
    test('repos long : dragon lié à 0 PV reste à 0, la bête primordiale blessée revient à PV pleins', async () => {
        const { restCompanions, COMPANION_KEYS } = await import('../js/rules/subclass-companions.js');
        const { deriveCharacter } = await import('../js/rules/character.js');
        const { createDefaultCharacter } = await import('../js/state/schema.js');
        const paladin = { ...createDefaultCharacter(), char_class: 'Paladin', char_subclass: 'Serment du Seigneur Dragon', char_level: '9',
            subclass_companions: { [COMPANION_KEYS.dragon]: { hp: 0 } } };
        const kept = restCompanions(paladin, deriveCharacter(paladin), 'long');
        assert.deepEqual(kept, { patch: {}, healed: [] });
        const hurt = { ...paladin, subclass_companions: { [COMPANION_KEYS.dragon]: { hp: 12 } } };
        const healed = restCompanions(hurt, deriveCharacter(hurt), 'long');
        assert.deepEqual(healed.patch.subclass_companions, {});
        assert.deepEqual(healed.healed, ['dragon lié']);
    });
});
