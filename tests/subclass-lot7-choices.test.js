// =============================================================================
// Sous-classes, lot 7 : petits choix mémorisés (terre du Cercle de la Terre, Présage cosmique,
// Affinité élémentaire, Résilience fiélonne, Esprit d'acier, Ancêtre divin, Troisième œil,
// Révélation dans la chair, œuf du pseudodragon, Cri de guerre, Prédictions des Moires, Don de la
// Féerie, Manifestations de l'ordre) et leurs effets ; effacement au repos (clearOn), rappels de fin
// de repos (restReminder), cases à cocher (toggle).
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCharacter } from '../js/rules/character.js';
import {
    subclassChoiceFields, subclassChoice, setSubclassChoicePatch, subclassChoiceNotes, restSubclassChoices, speedMeters
} from '../js/rules/subclass-choices.js';
import { subclassDefenseNotes, choiceDefense } from '../js/rules/subclass-combat.js';
import { subclassFeatures, subclassSpells } from '../js/rules/subclass-features.js';
import { subclassCounters } from '../js/rules/subclass-uses.js';
import { subclassNotes } from '../js/rules/subclass-calcs.js';
import { planShortRest, planLongRest } from '../js/rules/rest.js';
import { SUBCLASS_CHOICE_FIELDS, LAND_TYPES, DIVINE_DOMAINS, DAMAGE_TYPES, CREATURE_TYPES } from '../js/data/subclass-choices.js';
import { SUBCLASS_SPELLS } from '../js/data/subclass-spells.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const record = (cls, subclass, level, key, choices, extra = {}) => ({
    ...createDefaultCharacter(), char_class: cls, char_subclass: subclass, char_level: String(level),
    ...(choices ? { subclass_choices: { [key]: choices } } : {}), ...extra
});
const land = (level, choices, extra) => record('Druide', 'Cercle de la Terre', level, 'circle_of_the_land', choices, extra);
const stars = (level, choices, extra) => record('Druide', 'Cercle des Étoiles', level, 'circle_of_the_stars', choices, extra);
const draconic = (level, choices, extra) => record('Ensorceleur', 'Sorcellerie Draconique', level, 'draconic_sorcery', choices, extra);
const fiend = (level, choices, extra) => record('Sorcier', 'Patron Fiélon', level, 'fiend_patron', choices, extra);
const fates = (level, choices, extra) => record('Sorcier', 'Serviteur des Moires', level, 'the_fates_patron', choices, extra);
const diviner = (level, choices, extra) => record('Magicien', 'Devin', level, 'diviner', choices, extra);
const aberrant = (level, choices, extra) => record('Ensorceleur', 'Sorcellerie Aberrante', level, 'aberrant_sorcery', choices, extra);
const gloom = (level, choices, extra) => record('Rôdeur', "Traqueur d'Ombre", level, 'gloom_stalker', choices, extra);
const demigod = (level, choices, extra) => record('Ensorceleur', 'Ascendance divine', level, 'demigod_bloodline', choices, extra);
const amazon = (level, choices, extra) => record('Rôdeur', 'Conclave des Amazones', level, 'amazon_warrior', choices, extra);
const dragonlord = (level, choices, extra) => record('Paladin', 'Serment du Seigneur Dragon', level, 'oath_of_the_dragonlords', choices, extra);

const defenses = (c) => subclassDefenseNotes(deriveCharacter(c), c).armorClass ?? [];
const auto = (c, id) => subclassFeatures(deriveCharacter(c)).reached.find(f => f.id === id)?.automation?.text;
const counter = (c, feature) => subclassCounters(c, deriveCharacter(c)).find(x => x.feature === feature);
const notes = (c) => subclassChoiceNotes(deriveCharacter(c), c);

describe('Données des petits choix', () => {
    test('terres et domaines : mêmes libellés que les groupes de sorts', () => {
        const landGroups = [...new Set(SUBCLASS_SPELLS.circle_of_the_land.map(row => row[5].group))];
        assert.deepEqual(LAND_TYPES.map(([, label]) => label), landGroups);
        const domainGroups = [...new Set(SUBCLASS_SPELLS.demigod_bloodline.map(row => row[5].group))];
        assert.deepEqual(DIVINE_DOMAINS.map(([, label]) => label), domainGroups);
        for (const [, label] of DIVINE_DOMAINS) {
            assert.equal(SUBCLASS_SPELLS.demigod_bloodline.filter(row => row[5].group === label).length, 2, label);
        }
    });

    test('12 types de dégâts sans force, 14 types de créatures, 20 résultats de d20', () => {
        assert.equal(DAMAGE_TYPES.length, 12);
        assert.ok(!DAMAGE_TYPES.some(([id]) => id === 'force'));
        assert.equal(CREATURE_TYPES.length, 14);
        const prediction = SUBCLASS_CHOICE_FIELDS.the_fates_patron.find(f => f.key === 'prediction');
        assert.deepEqual(prediction.options.map(([id]) => id), Array.from({ length: 20 }, (_, i) => String(i + 1)));
        assert.equal(SUBCLASS_CHOICE_FIELDS.fiend_patron[0].options.length, 12);
        assert.deepEqual(SUBCLASS_CHOICE_FIELDS.draconic_sorcery[0].options.map(([id]) => id).sort(), ['acid', 'cold', 'fire', 'lightning', 'poison']);
    });

    test('propriétés : clearOn, restReminder et toggle connus ; un toggle n\'a qu\'une option', () => {
        for (const fields of Object.values(SUBCLASS_CHOICE_FIELDS)) {
            for (const field of fields) {
                if (field.clearOn) assert.ok(['rest', 'longRest'].includes(field.clearOn), field.key);
                if (field.restReminder) assert.ok(['short', 'long'].includes(field.restReminder), field.key);
                if (field.toggle) assert.equal(field.options.length, 1, field.key);
            }
        }
    });

    test('choix de jeu modifiables fiche verrouillée ; choix de construction verrouillés', () => {
        const inPlay = (derived) => Object.fromEntries(subclassChoiceFields(derived).map(f => [f.key, f.inPlay]));
        assert.deepEqual(inPlay({ subclass: 'circle_of_the_land', level: 3 }), { land: true });
        assert.deepEqual(inPlay({ subclass: 'circle_of_the_stars', level: 6 }), { starry_form: true, constellation: true, omen: true });
        assert.deepEqual(inPlay({ subclass: 'fiend_patron', level: 10 }), { resistance: true });
        assert.deepEqual(inPlay({ subclass: 'the_fates_patron', level: 6 }), { prediction: true });
        assert.deepEqual(inPlay({ subclass: 'diviner', level: 10 }), { eye: true });
        // Apparence de la stimfée (morceau Compagnons) : choix de construction
        assert.deepEqual(inPlay({ subclass: 'amazon_warrior', level: 3 }), { stimfee: false, foe: true });
        assert.deepEqual(inPlay({ subclass: 'aberrant_sorcery', level: 14 }), { rev_aquatic: true, rev_flight: true, rev_see: true, rev_worm: true });
        for (const [subclass, level, key] of [['oath_of_the_dragonlords', 3, 'egg'], ['draconic_sorcery', 6, 'element'],
            ['demigod_bloodline', 3, 'domain'], ['gloom_stalker', 7, 'save'], ['fey_wanderer', 3, 'gift'], ['clockwork_sorcery', 3, 'manifestation']]) {
            assert.deepEqual(inPlay({ subclass, level }), { [key]: false }, subclass);
        }
        assert.ok(subclassChoiceFields({ subclass: 'aberrant_sorcery', level: 14 }).every(f => f.toggle && f.clearOn === 'rest'));
    });
});

describe('Fiche sans choix enregistré : comme avant le lot 7', () => {
    test('Cercle de la Terre : tous les terrains ; Résistance générique au niveau 10', () => {
        assert.equal(subclassSpells(deriveCharacter(land(3))).reached.length, 12);
        assert.deepEqual(subclassSpells(deriveCharacter(land(3))).others, []);
        assert.equal(defenses(land(10)).find(n => n.featId === 'protection_de_la_nature').mention, 'Résistance (terre)');
    });

    test('Fiélon et draconique : lignes génériques ; Esprit d\'acier sur la Sagesse', () => {
        assert.equal(defenses(fiend(10)).find(n => n.featId === 'resilience_fielonne').mention, 'Résistance au choix');
        assert.equal(defenses(draconic(6)).find(n => n.featId === 'affinite_elementaire').mention, 'Résistance (affinité)');
        assert.doesNotMatch(defenses(draconic(6))[0].text, /ascendance/);
        const zones = subclassNotes(deriveCharacter(gloom(7)), gloom(7));
        assert.ok(zones['saves.wis']);
        assert.equal(choiceDefense('fiend_patron', {}), null);
    });

    test('textes et cases : rien de choisi, texte d\'origine', () => {
        assert.equal(counter(stars(6), 'presage_cosmique').use, 'Réaction : +1d6 (Bienfait) ou −1d6 (Malheur) à un test d20 à 9 m.');
        assert.match(counter(amazon(3), 'cri_de_guerre').use, /un type de monstre/);
        assert.match(counter(diviner(10), 'troisieme_il').use, /vision dans le noir 36 m, lire les langues/);
        assert.deepEqual(subclassSpells(deriveCharacter(demigod(3))).reached, []);
        assert.match(auto(demigod(3), 'ancetre_divin'), /Domaine à choisir/);
    });
});

describe('Valeurs inconnues et capacités pas encore atteintes', () => {
    test('valeur inconnue ou pas une chaîne : ignorée, et refusée par le patch', () => {
        assert.deepEqual(deriveCharacter(land(3, { land: 'desert' })).subclassChoices, {});
        assert.deepEqual(deriveCharacter(fates(6, { prediction: '21' })).subclassChoices, {});
        assert.deepEqual(deriveCharacter(fates(6, { prediction: 7 })).subclassChoices, {});
        assert.deepEqual(setSubclassChoicePatch(fates(6), 'the_fates_patron', 'prediction', '21'), {});
        assert.deepEqual(setSubclassChoicePatch(fates(6), 'the_fates_patron', 'prediction', '7').subclass_choices, { the_fates_patron: { prediction: '7' } });
    });

    test('Affinité au niveau 5, Résilience au niveau 9 : ignorées, retrouvées au niveau atteint', () => {
        assert.deepEqual(deriveCharacter(draconic(5, { element: 'fire' })).subclassChoices, {});
        assert.deepEqual(defenses(draconic(5, { element: 'fire' })), []);
        assert.equal(defenses(draconic(6, { element: 'fire' }))[0].mention, 'Résistance au feu');
        assert.deepEqual(deriveCharacter(fiend(9, { resistance: 'fire' })).subclassChoices, {});
        assert.equal(defenses(fiend(10, { resistance: 'thunder' })).find(n => n.featId === 'resilience_fielonne').mention, 'Résistance : tonnerre');
    });

    test('les choix d\'une autre sous-classe n\'ont aucun effet', () => {
        const c = record('Druide', 'Cercle des Étoiles', 10, 'circle_of_the_land', { land: 'arid' });
        assert.deepEqual(deriveCharacter(c).subclassChoices, {});
        assert.equal(subclassSpells(deriveCharacter(c)).others.length, 0);
    });
});

describe('Cercle de la Terre', () => {
    test('terre choisie : seuls ses sorts sont donnés, les autres terrains à part', () => {
        const spells = subclassSpells(deriveCharacter(land(5, { land: 'arid' })));
        assert.deepEqual(spells.reached.map(s => s.vo), ['Blur', 'Burning Hands', 'Fire Bolt', 'Fireball']);
        assert.ok(spells.upcoming.every(s => s.group === 'Aride'));
        assert.equal(spells.others.length, 12);
        assert.ok(spells.others.every(s => s.group !== 'Aride' && s.classLevel <= 5));
    });

    test('Protection de la nature : rien au niveau 9, Résistance nommée au niveau 10', () => {
        assert.equal(defenses(land(9, { land: 'arid' })).length, 0);
        const ward = defenses(land(10, { land: 'arid' })).find(n => n.featId === 'protection_de_la_nature');
        assert.equal(ward.mention, 'Résistance au feu (terre aride)');
        assert.match(ward.text, /^Immunité à l'état Empoisonné ; Résistance au feu tant que la terre aride est choisie\.$/);
        assert.equal(defenses(land(10, { land: 'temperate' }))[0].mention, 'Résistance à la foudre (terre tempérée)');
        assert.equal(defenses(land(10, { land: 'tropical' }))[0].mention, 'Résistance au poison (terre tropicale)');
    });

    test('textes « Dans la fiche » : sorts, Protection et Sanctuaire naturel selon la terre', () => {
        assert.match(auto(land(3, { land: 'polar' }), 'sorts_du_cercle_de_la_terre'), /Sorts de sous-classe.*Terre polaire choisie/);
        assert.match(auto(land(3), 'sorts_du_cercle_de_la_terre'), /Choisissez la terre/);
        assert.match(auto(land(10, { land: 'polar' }), 'protection_de_la_nature'), /Résistance au froid \(terre polaire\)/);
        assert.match(auto(land(14, { land: 'arid' }), 'sanctuaire_naturel'), /gagnent votre Résistance au feu \(terre aride\)/);
    });
});

describe('Présage cosmique, Cri de guerre, Prédictions des Moires, Troisième œil : texte des cases', () => {
    test('Présage : Bienfait ou Malheur sous les cases', () => {
        assert.match(counter(stars(6, { omen: 'weal' }), 'presage_cosmique').use, /^Réaction : \+1d6 \(Bienfait\)/);
        assert.match(counter(stars(6, { omen: 'woe' }), 'presage_cosmique').use, /^Réaction : −1d6 \(Malheur\)/);
        assert.match(auto(stars(6, { omen: 'woe' }), 'presage_cosmique'), /Malheur.*1 case dans l'onglet Combat/);
    });

    test('Cri de guerre : type de monstre nommé', () => {
        assert.match(counter(amazon(3, { foe: 'fiend' }), 'cri_de_guerre').use, /Avantage aux attaques contre : Fiélons/);
    });

    test('Prédictions des Moires : une case au niveau 6, rendue au repos court, résultat noté', () => {
        assert.equal(counter(fates(5, { prediction: '14' }), 'predictions_des_moires'), undefined);
        const box = counter(fates(6, { prediction: '14' }), 'predictions_des_moires');
        assert.deepEqual([box.max, box.reset], [1, 'short']);
        assert.match(box.use, /par 14\.$/);
        assert.match(counter(fates(6), 'predictions_des_moires').use, /^Notez le d20/);
    });

    test('Troisième œil : choix sous la case, vision dans le noir près de la Vitesse', () => {
        assert.match(counter(diviner(10, { eye: 'see' }), 'troisieme_il').use, /Détection de l'invisibilité/);
        assert.match(notes(diviner(10, { eye: 'darkvision' })).speed[0].text, /36 m/);
        assert.equal(notes(diviner(10, { eye: 'comprehension' })).speed, undefined);
    });
});

describe('Ancêtre divin', () => {
    test('domaine choisi : ses deux sorts, sans emplacement, rappelés sous les cases', () => {
        const spells = subclassSpells(deriveCharacter(demigod(3, { domain: 'war' })));
        assert.deepEqual(spells.reached.map(s => s.name), ['Bouclier de la foi', 'Châtiment de tonnerre']);
        assert.ok(spells.reached.every(s => /^Une fois sans emplacement/.test(s.note)));
        assert.equal(counter(demigod(3, { domain: 'war' }), 'ancetre_divin').use, 'Sans emplacement : Bouclier de la foi, Châtiment de tonnerre (une case par sort).');
    });

    test('texte : maîtrise doublée chiffrée, et les cases', () => {
        const text = auto(demigod(5, { domain: 'life' }), 'ancetre_divin');
        assert.match(text, /Domaine : Vie ; Bénédiction et Soins/);
        assert.match(text, /\+6 au lieu de \+3/);
        assert.match(text, /2 cases dans l'onglet Combat/);
    });
});

describe('Esprit d\'acier', () => {
    test('Intelligence choisie : rappel sur la sauvegarde d\'Intelligence, plus sur la Sagesse', () => {
        const c = gloom(7, { save: 'int' });
        const zones = subclassNotes(deriveCharacter(c), c);
        assert.ok(zones['saves.int']?.[0].check);
        assert.equal(zones['saves.wis'], undefined);
        const ticked = { ...c, int_save_prof: true };
        assert.equal(subclassNotes(deriveCharacter(ticked), ticked)['saves.int'], undefined);
        assert.match(auto(c, 'esprit_d_acier'), /sauvegarde d'Intelligence/);
    });

    test('Sagesse choisie ou niveau 6 : comme avant', () => {
        assert.ok(subclassNotes(deriveCharacter(gloom(7, { save: 'wis' })), gloom(7, { save: 'wis' }))['saves.wis']);
        assert.equal(subclassNotes(deriveCharacter(gloom(6, { save: 'cha' })), gloom(6, { save: 'cha' }))['saves.cha'], undefined);
    });
});

describe('Révélation dans la chair', () => {
    test('speedMeters : un nombre seul en mètres, sinon null', () => {
        assert.equal(speedMeters('9'), 9);
        assert.equal(speedMeters('9 m'), 9);
        assert.equal(speedMeters('10,5 m'), 10.5);
        assert.equal(speedMeters('<p>12 m</p>'), 12);
        for (const text of ['30 ft', '', 'rapide', '9 m (vol 18 m)', null, undefined, '0']) assert.equal(speedMeters(text), null, String(text));
    });

    test('nage et vol près de la Vitesse, chiffrés quand la Vitesse se lit ; coût rappelé', () => {
        const c = aberrant(14, { rev_aquatic: 'on', rev_flight: 'on' }, { speed: '9 m' });
        const speed = notes(c).speed.map(n => n.text);
        assert.match(speed[0], /2 × votre Vitesse \(18 m\)/);
        assert.match(speed[1], /égale à votre Vitesse \(9 m\)/);
        const feet = notes(aberrant(14, { rev_flight: 'on' }, { speed: '30 ft' })).speed[0].text;
        assert.doesNotMatch(feet, /\(/);
        assert.match(auto(c, 'revelation_dans_la_chair'), /coût : 2 points de sorcellerie/);
        assert.equal(notes(aberrant(13, { rev_flight: 'on' })).speed, undefined);
    });
});

describe('Repos : choix effacés (clearOn) et rappels (restReminder)', () => {
    test('repos court : Troisième œil, Prédiction et Révélation effacés ; pas le reste', () => {
        const eye = diviner(10, { eye: 'darkvision' });
        assert.deepEqual(restSubclassChoices(eye, deriveCharacter(eye), 'short').patch, { subclass_choices: { diviner: {} } });
        assert.deepEqual(restSubclassChoices(eye, deriveCharacter(eye), 'short').cleared,
            [{ featId: 'troisieme_il', featName: 'Troisième œil', label: 'Troisième œil', value: 'Vision dans le noir (36 m)' }]);
        const rev = aberrant(14, { rev_flight: 'on', rev_see: 'on' });
        assert.deepEqual(planShortRest(rev).patch.subclass_choices, { aberrant_sorcery: {} });
        assert.deepEqual(planShortRest(fates(6, { prediction: '3' })).patch.subclass_choices, { the_fates_patron: {} });
        for (const c of [stars(6, { omen: 'weal' }), land(3, { land: 'arid' }), fiend(10, { resistance: 'fire' })]) {
            assert.equal(planShortRest(c).patch.subclass_choices, undefined);
        }
        // La fiche reçue n'est pas modifiée
        assert.equal(eye.subclass_choices.diviner.eye, 'darkvision');
    });

    test('repos long : le Présage cosmique aussi ; la terre et la Résistance restent', () => {
        assert.deepEqual(planLongRest(stars(6, { omen: 'woe' })).patch.subclass_choices, { circle_of_the_stars: {} });
        assert.equal(planLongRest(land(3, { land: 'arid' })).patch.subclass_choices, undefined);
        assert.equal(planLongRest(fiend(10, { resistance: 'fire' })).patch.subclass_choices, undefined);
    });

    test('capacité pas atteinte : effacée sans être annoncée ; rien à effacer : patch vide', () => {
        const low = diviner(9, { eye: 'see' });
        const result = restSubclassChoices(low, deriveCharacter(low), 'short');
        assert.deepEqual(result.cleared, []);
        assert.deepEqual(result.patch.subclass_choices.diviner, {});
        assert.deepEqual(restSubclassChoices(diviner(10), deriveCharacter(diviner(10)), 'long'), { patch: {}, cleared: [] });
        assert.deepEqual(restSubclassChoices(diviner(10, {}), deriveCharacter(diviner(10, {})), 'long'), { patch: {}, cleared: [] });
    });

    test('rappels de fin de repos : court et long, ou long seulement', () => {
        const rest = (c) => notes(c).rest ?? [];
        const fiendNote = rest(fiend(10, { resistance: 'fire' }))[0];
        assert.equal(fiendNote.restKind, undefined);
        assert.match(fiendNote.text, /actuellement Feu/);
        assert.equal(rest(land(3, { land: 'arid' }))[0].restKind, 'long');
        const omen = rest(stars(6, { omen: 'weal' }))[0];
        assert.equal(omen.restKind, 'long');
        assert.match(omen.text, /Présage \(Bienfait\) : prend fin avec ce repos/);
        assert.match(rest(diviner(10, { eye: 'see' }))[0].text, /prend fin avec ce repos/);
        assert.deepEqual(rest(diviner(10)), []);
        // Dans le résumé des repos : court sans la terre, long avec
        assert.ok(!planShortRest(land(3, { land: 'arid' })).summary.featNotes.some(n => n.featId === 'sorts_du_cercle_de_la_terre'));
        assert.ok(planLongRest(land(3, { land: 'arid' })).summary.featNotes.some(n => n.featId === 'sorts_du_cercle_de_la_terre'));
        assert.ok(planShortRest(fiend(10, { resistance: 'fire' })).summary.featNotes.some(n => n.featId === 'resilience_fielonne'));
    });
});

describe('Œuf du pseudodragon, Affinité élémentaire, choix descriptifs', () => {
    test('œuf : couleur mémorisée dès le niveau 3, verrouillée avec la fiche', () => {
        assert.match(auto(dragonlord(3, { egg: 'bronze' }), 'familier_pseudodragon'), /Œuf de dragon : bronze/);
        assert.match(auto(dragonlord(3), 'familier_pseudodragon'), /à choisir/);
    });

    test('Affinité élémentaire : type et bonus de Charisme', () => {
        const c = draconic(6, { element: 'poison' }, { cha_score: '16' });
        assert.match(auto(c, 'affinite_elementaire'), /Type choisi : poison\. Bonus à un jet de dégâts d'un sort de ce type : \+3/);
        assert.equal(defenses(c)[0].mention, 'Résistance au poison');
    });

    test('Don de la Féerie et Manifestations de l\'ordre : simples menus mémorisés', () => {
        const fey = record('Rôdeur', 'Errant Féerique', 3, 'fey_wanderer', { gift: 'horns' });
        assert.deepEqual(subclassChoice(fey, deriveCharacter(fey)), { gift: 'horns' });
        const clock = record('Ensorceleur', 'Sorcellerie Mécanique', 3, 'clockwork_sorcery', { manifestation: 'ticking' });
        assert.deepEqual(deriveCharacter(clock).subclassChoices, { manifestation: 'ticking' });
    });
});
