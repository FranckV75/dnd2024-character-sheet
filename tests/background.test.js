/**
 * TESTS — HISTORIQUES (4.37.0) : ce que donne l'historique, repères « À vérifier » et bouton
 * « Appliquer » (compétences cochées, don de niveau 1 rempli s'il est vide, rien d'autre).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DD_RULES } from '../js/data/dd-rules.js';
import { FEATS_DATA } from '../js/data/feats.js';
import { SKILLS } from '../js/data/constants.js';
import { backgroundOf, backgroundSummary, backgroundApplyPatch } from '../js/rules/background.js';

const line = (summary, id) => summary.lines.find((entry) => entry.id === id);

describe('Données des historiques', () => {
    test('Les 16 historiques : don existant, deux compétences connues, outil et or du lot', () => {
        const backgrounds = Object.values(DD_RULES.backgrounds);
        assert.equal(backgrounds.length, 16);
        for (const background of backgrounds) {
            assert.ok(FEATS_DATA[background.featId], `${background.nameFr} : don ${background.featId}`);
            assert.equal(background.skillProfs.length, 2);
            for (const id of background.skillProfs) assert.ok(SKILLS.some((skill) => skill.id === id), `${background.nameFr} : ${id}`);
            assert.ok(background.toolFr, background.nameFr);
            assert.ok(background.kitGold > 0 && background.kitGold < 50, background.nameFr);
            assert.equal(background.abilityScores.length, 3);
        }
    });

    test('Initié à la magie : liste du Clerc, du Druide ou du Magicien selon l\'historique', () => {
        const lists = Object.fromEntries(Object.entries(DD_RULES.backgrounds)
            .filter(([, b]) => b.featId === 'initie_a_la_magie').map(([id, b]) => [id, b.featList]));
        assert.deepEqual(lists, { acolyte: 'cleric', guide: 'druid', sage: 'wizard' });
    });
});

describe('Historique reconnu', () => {
    test('Nom français ou anglais, casse et HTML ignorés ; inconnu ou vide : null', () => {
        assert.equal(backgroundOf({ char_background: 'Sage' }).id, 'sage');
        assert.equal(backgroundOf({ char_background: '<b>acolyte</b>' }).id, 'acolyte');
        assert.equal(backgroundOf({ char_background: 'Soldier' }).id, 'soldier');
        assert.equal(backgroundOf({ char_background: '' }), null);
        assert.equal(backgroundSummary({ char_background: 'Pirate de l\'espace' }), null);
    });
});

describe('Ce qui manque sur la fiche', () => {
    test('Sage vide : don, compétences et outil à vérifier ; bouton proposé', () => {
        const summary = backgroundSummary({ char_background: 'Sage' });
        assert.equal(line(summary, 'feat').text, 'Initié à la magie (Magicien), au niveau 1.');
        assert.equal(line(summary, 'feat').check, 'Don de niveau 1 vide.');
        assert.match(line(summary, 'skills').check, /Arcanes, Histoire/);
        assert.ok(line(summary, 'tool').check);
        assert.equal(summary.canApply, true);
    });

    test('Fiche complète : aucun repère, pas de bouton', () => {
        const summary = backgroundSummary({
            char_background: 'Criminel', feat_1: 'vigilant', skill_prof_sleight_of_hand: true, skill_prof_stealth: true,
            profs_tools: 'Outils de voleur'
        });
        assert.ok(summary.lines.every((entry) => !entry.check));
        assert.equal(summary.canApply, false);
    });

    test('Autre don au niveau 1 : signalé (permis par le MJ ?), jamais remplacé', () => {
        const record = { char_background: 'Soldat', feat_1: 'chanceux' };
        assert.match(line(backgroundSummary(record), 'feat').check, /Chanceux/);
        assert.equal(backgroundApplyPatch(record).feat_1, undefined);
    });

    test('Outils au choix : un outil de la famille suffit (instrument, jeu, outils d\'artisan)', () => {
        assert.equal(line(backgroundSummary({ char_background: 'Artiste', profs_tools: 'Luth' }), 'tool').check, undefined);
        assert.equal(line(backgroundSummary({ char_background: 'Soldat', profs_tools: 'Jeu de dés' }), 'tool').check, undefined);
        assert.equal(line(backgroundSummary({ char_background: 'Artisan', profs_tools: 'Outils de forgeron' }), 'tool').check, undefined);
        assert.ok(line(backgroundSummary({ char_background: 'Sage', profs_tools: 'Luth' }), 'tool').check);
    });

    test('Mauvaise liste de sorts pour Initié à la magie : signalée', () => {
        const record = { char_background: 'Acolyte', feat_1: 'initie_a_la_magie', feat_choices: { 1: { initie_a_la_magie: { list: 'wizard' } } } };
        assert.match(line(backgroundSummary(record), 'feat').check, /Magicien.*Clerc/);
    });
});

describe('Bouton « Appliquer »', () => {
    test('Coche les compétences manquantes, remplit le don et sa liste de sorts', () => {
        const record = { char_background: 'Sage', skill_prof_arcana: true, str_score: '10', int_score: '15' };
        assert.deepEqual(backgroundApplyPatch(record), {
            skill_prof_history: true,
            feat_1: 'initie_a_la_magie',
            feat_choices: { 1: { initie_a_la_magie: { list: 'wizard' } } }
        });
    });

    test('Garde les autres choix de dons et une liste déjà choisie ; ne touche jamais aux caractéristiques', () => {
        const record = { char_background: 'Acolyte', feat_choices: { 4: { x: { a: 1 } }, 1: { initie_a_la_magie: { list: 'druid' } } } };
        const patch = backgroundApplyPatch(record);
        assert.equal(patch.feat_1, 'initie_a_la_magie');
        assert.equal(patch.feat_choices, undefined);
        assert.ok(Object.keys(patch).every((key) => !/_score$/.test(key)));
        const empty = { char_background: 'Acolyte', feat_choices: { 4: { x: { a: 1 } } } };
        assert.deepEqual(backgroundApplyPatch(empty).feat_choices, { 4: { x: { a: 1 } }, 1: { initie_a_la_magie: { list: 'cleric' } } });
    });

    test('Rien à faire : patch vide ; historique inconnu : patch vide', () => {
        assert.deepEqual(backgroundApplyPatch({ char_background: 'Soldat', feat_1: 'sauvagerie_martiale', skill_prof_athletics: true, skill_prof_intimidation: true }), {});
        assert.deepEqual(backgroundApplyPatch({ char_background: 'Inconnu' }), {});
    });
});

describe('Relecture 4.37.0 : détection des outils', () => {
    const toolCheck = (background, tools) => line(backgroundSummary({ char_background: background, profs_tools: tools }), 'tool').check;
    test('« cor » en mot entier ; « instruments de navigateur » n\'est pas un instrument de musique', () => {
        assert.ok(toolCheck('Artiste', 'Outils de cordonnier'));
        assert.ok(toolCheck('Artiste', 'Instruments de navigateur'));
        assert.equal(toolCheck('Artiste', 'Cor'), undefined);
        assert.equal(toolCheck('Artiste', 'Instrument de musique (luth)'), undefined);
    });
    test('Jeux : dés, cartes, jeux ; « des » seul ne suffit pas', () => {
        assert.equal(toolCheck('Soldat', 'Dés'), undefined);
        assert.equal(toolCheck('Soldat', 'Cartes à jouer'), undefined);
        assert.equal(toolCheck('Soldat', 'Jeux de hasard'), undefined);
        assert.ok(toolCheck('Soldat', 'Outils des voleurs'));
    });
});
