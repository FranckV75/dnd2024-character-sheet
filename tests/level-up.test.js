/**
 * TESTS — ASSISTANT DE MONTÉE DE NIVEAU (js/rules/level-up.js)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { planLevelUp, hitPointGain, levelUpPatch, MAX_LEVEL } from '../js/rules/level-up.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const sheet = (extra) => ({ ...createDefaultCharacter(), ...extra });
const lines = (plan, title) => plan.sections.find((s) => s.title === title)?.lines ?? [];
const all = (plan) => plan.sections.flatMap((s) => s.lines).join('\n');

describe('Montée de niveau : niveau', () => {
    test('Niveau suivant ; niveau illisible (HTML v3) lu comme la fiche', () => {
        assert.equal(planLevelUp(sheet({ char_level: '3' })).to, 4);
        assert.equal(planLevelUp(sheet({ char_level: '<b>4</b>' })).to, 5);
    });

    test(`Niveau ${MAX_LEVEL} : pas de niveau suivant, rien à appliquer`, () => {
        const plan = planLevelUp(sheet({ char_level: '20' }));
        assert.equal(plan.canLevel, false);
        assert.match(plan.reason, /maximum/);
        assert.deepEqual(levelUpPatch(plan, { mode: 'fixed' }), {});
    });

    test('Fiche absente ou abîmée : traitée comme une fiche vierge de niveau 1', () => {
        assert.equal(planLevelUp(null).to, 2);
    });
});

describe('Montée de niveau : points de vie', () => {
    const fighter = sheet({ char_class: 'Guerrier', char_level: '3', hp_max: '28', hp_current: '20', con_score: '14' });

    test('Valeur fixe du manuel : moitié du dé + 1, plus la Constitution', () => {
        const { hp } = planLevelUp(fighter);
        assert.equal(hp.faces, 10);
        assert.equal(hp.fixed, 6);
        assert.equal(hitPointGain(hp, { mode: 'fixed' }), 8);
    });

    test('Jet du joueur : entre 1 et le dé ; total au moins 1 avant les bonus', () => {
        const { hp } = planLevelUp(fighter);
        assert.equal(hitPointGain(hp, { mode: 'roll', roll: '7' }), 9);
        assert.equal(hitPointGain(hp, { mode: 'roll', roll: '11' }), null);
        assert.equal(hitPointGain(hp, { mode: 'roll', roll: '0' }), null);
        assert.equal(hitPointGain(hp, { mode: 'roll', roll: '' }), null);
        assert.equal(hitPointGain(hp, { mode: 'roll', roll: '2.5' }), null);
        const weak = planLevelUp(sheet({ char_class: 'Magicien', char_level: '1', hp_max: '4', con_score: '6' })).hp;
        assert.equal(hitPointGain(weak, { mode: 'roll', roll: '1' }), 1);
    });

    test('Bonus par niveau déjà connus de la fiche : Robuste, Résistance draconique, Nain', () => {
        const sorcerer = planLevelUp(sheet({
            char_class: 'Ensorceleur', char_subclass: 'Sorcellerie draconique', char_level: '5', feat_4: 'robuste', hp_max: '40', con_score: '14'
        }));
        assert.deepEqual(sorcerer.hp.bonuses, [{ name: 'Robuste', value: 2 }, { name: 'Résistance draconique', value: 1 }]);
        assert.equal(hitPointGain(sorcerer.hp, { mode: 'fixed' }), 4 + 2 + 3);
        const dwarf = planLevelUp(sheet({ char_class: 'Magicien', char_level: '2', hp_max: '12', con_score: '12', char_species: 'Nain' }));
        assert.deepEqual(dwarf.hp.bonuses, [{ name: 'Ténacité naine', value: 1 }]);
    });

    test('Patch : niveau et PV max en texte ; PV actuels seulement sur demande', () => {
        const plan = planLevelUp(fighter);
        assert.deepEqual(levelUpPatch(plan, { mode: 'fixed' }), { char_level: '4', hp_max: '36' });
        assert.deepEqual(levelUpPatch(plan, { mode: 'fixed', addToCurrent: true }), { char_level: '4', hp_max: '36', hp_current: '28' });
    });

    test('PV max avec du texte (« 80 (Robuste) ») ou vide : jamais réécrits, seul le niveau change', () => {
        assert.deepEqual(levelUpPatch(planLevelUp(sheet({ char_class: 'Barbare', char_level: '8', hp_max: '80 (Robuste)' })), { mode: 'fixed' }), { char_level: '9' });
        assert.deepEqual(levelUpPatch(planLevelUp(sheet({ char_class: 'Barbare', char_level: '8', hp_max: '' })), { mode: 'fixed' }), { char_level: '9' });
    });

    test('Jet incomplet : seul le niveau change (la fenêtre l\'empêche avant)', () => {
        assert.deepEqual(levelUpPatch(planLevelUp(fighter), { mode: 'roll', roll: '' }), { char_level: '4' });
    });

    test('Dé de vie inconnu (pas de classe) : pas de valeur fixe, jet libre', () => {
        const { hp } = planLevelUp(sheet({ char_level: '2', hp_max: '10' }));
        assert.equal(hp.fixed, null);
        assert.equal(hitPointGain(hp, { mode: 'fixed' }), null);
        assert.equal(hitPointGain(hp, { mode: 'roll', roll: '5' }), 5);
    });
});

describe('Montée de niveau : ce qui change', () => {
    test('Bonus de maîtrise aux niveaux 5, 9, 13, 17', () => {
        assert.match(all(planLevelUp(sheet({ char_class: 'Barbare', char_level: '8' }))), /Bonus de maîtrise : \+3 → \+4/);
        assert.doesNotMatch(all(planLevelUp(sheet({ char_class: 'Barbare', char_level: '7' }))), /Bonus de maîtrise/);
    });

    test('Dons : emplacement du niveau 4 ; style de combat du Paladin au niveau 2 ; don déjà prévu', () => {
        assert.match(lines(planLevelUp(sheet({ char_class: 'Guerrier', char_level: '3' })), 'Dons')[0], /Don du niveau 4 : choisissez un don/);
        assert.match(lines(planLevelUp(sheet({ char_class: 'Paladin', char_level: '1' })), 'Dons')[0], /Style de combat/);
        assert.match(lines(planLevelUp(sheet({ char_class: 'Guerrier', char_level: '3', feat_4: 'robuste' })), 'Dons')[0], /Robuste, déjà noté, devient actif/);
        assert.match(lines(planLevelUp(sheet({ char_class: 'Guerrier', char_level: '5' })), 'Dons')[0], /Guerrier/);
        assert.match(lines(planLevelUp(sheet({ char_class: 'Barbare', char_level: '18' })), 'Dons')[0], /faveur épique/);
    });

    test('Ressource et dés de classe', () => {
        assert.match(all(planLevelUp(sheet({ char_class: 'Guerrier', char_level: '3' }))), /Second souffle : 2 → 3/);
        assert.match(all(planLevelUp(sheet({ char_class: 'Barbare', char_level: '8' }))), /Rage : \+2 → \+3/);
        assert.match(all(planLevelUp(sheet({ char_class: 'Roublard', char_level: '2' }))), /Attaque sournoise : 1d6 → 2d6/);
    });

    test('Emplacements de sorts, et Magie de pacte qui monte de niveau', () => {
        const wizard = lines(planLevelUp(sheet({ char_class: 'Magicien', char_level: '2' })), 'Sorts');
        assert.ok(wizard.includes('Emplacements de sorts de niveau 1 : 3 → 4.'));
        assert.ok(wizard.includes('Nouveaux emplacements de sorts de niveau 2 : 2.'));
        assert.ok(lines(planLevelUp(sheet({ char_class: 'Sorcier', char_level: '2' })), 'Sorts').includes('Magie de pacte : vos emplacements passent au niveau 2.'));
    });

    test('Sous-classe : choix au niveau 3, puis nouvelles capacités et nouveaux choix', () => {
        assert.match(all(planLevelUp(sheet({ char_class: 'Magicien', char_level: '2' }))), /Choisissez votre sous-classe .*Évocateur/);
        const sorcerer = all(planLevelUp(sheet({ char_class: 'Ensorceleur', char_subclass: 'Sorcellerie draconique', char_level: '5' })));
        assert.match(sorcerer, /Nouvelle capacité \(Sorcellerie draconique\) : Affinité élémentaire/);
        assert.match(sorcerer, /À choisir dans le bloc Sous-classe : Type de dégâts/);
    });

    test('Sorts de sous-classe gagnés au niveau', () => {
        assert.match(all(planLevelUp(sheet({ char_class: 'Paladin', char_subclass: 'Serment de dévotion', char_level: '4' }))), /Sorts de sous-classe toujours préparés : .*Aide/);
    });

    test('Classe non reconnue (multiclasse) : seuls le niveau et les PV', () => {
        const plan = planLevelUp(sheet({ char_class: 'Guerrier 3 / Magicien 2', char_level: '5' }));
        assert.equal(plan.classKnown, false);
        assert.match(all(plan), /Classe non reconnue/);
        assert.equal(lines(plan, 'Sorts').length, 0);
    });
});

describe('Montée de niveau : corrections de la relecture', () => {
    test('Bonus de maîtrise : +3, +4, +5, +6 aux niveaux 5, 9, 13, 17', () => {
        const expected = { 4: '+2 → +3', 8: '+3 → +4', 12: '+4 → +5', 16: '+5 → +6' };
        for (const [level, change] of Object.entries(expected)) {
            assert.ok(all(planLevelUp(sheet({ char_class: 'Barbare', char_level: level }))).includes(`Bonus de maîtrise : ${change}`), level);
        }
    });

    test('Robuste qui devient actif : 2 PV par niveau, d\'un coup', () => {
        const { hp } = planLevelUp(sheet({ char_class: 'Guerrier', char_level: '3', feat_4: 'robuste', hp_max: '28', con_score: '10' }));
        assert.deepEqual(hp.bonuses, [{ name: 'Robuste', value: 8 }]);
    });

    test('Résistance draconique gagnée au niveau 3 : 1 PV par niveau, d\'un coup', () => {
        const { hp } = planLevelUp(sheet({ char_class: 'Ensorceleur', char_subclass: 'Sorcellerie draconique', char_level: '2', hp_max: '14', con_score: '10' }));
        assert.deepEqual(hp.bonuses, [{ name: 'Résistance draconique', value: 3 }]);
    });

    test('Constitution faible : au moins 1 PV avant le bonus du Nain', () => {
        const { hp } = planLevelUp(sheet({ char_class: 'Magicien', char_level: '1', hp_max: '4', con_score: '6', char_species: 'Nain' }));
        assert.equal(hitPointGain(hp, { mode: 'roll', roll: '1' }), 2);
    });

    test('Cercle de la Terre sans terre choisie : pas les sorts des 4 terres', () => {
        const land = (extra) => lines(planLevelUp(sheet({ char_class: 'Druide', char_subclass: 'Cercle de la Terre', char_level: '4', ...extra })), 'Sorts').join('\n');
        assert.match(land({}), /choisissez d'abord votre Type de terre/);
        assert.doesNotMatch(land({}), /Boule de feu/);
        assert.match(land({ subclass_choices: { circle_of_the_land: { land: 'arid' } } }), /toujours préparés : Boule de feu \(niv\. 3\)/);
    });

    test('Faveur épique notée avant le niveau 19 : signalée, aucun PV', () => {
        const early = planLevelUp(sheet({ char_class: 'Guerrier', char_level: '3', feat_4: 'faveur_de_vigueur', hp_max: '30' }));
        assert.deepEqual(early.hp.bonuses, []);
        assert.match(lines(early, 'Dons')[0], /faveur épique, qui se prend au niveau 19/);
        const right = planLevelUp(sheet({ char_class: 'Guerrier', char_level: '18', feat_19: 'faveur_de_vigueur', hp_max: '150' }));
        assert.deepEqual(right.hp.bonuses, [{ name: 'Faveur de vigueur', value: 40 }]);
        assert.match(lines(right, 'Dons')[0], /Faveur de vigueur, déjà noté, devient actif/);
        assert.match(lines(planLevelUp(sheet({ char_class: 'Guerrier', char_level: '18' })), 'Dons')[0], /faveur épique ou un autre don/);
    });
});
