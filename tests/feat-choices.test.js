/**
 * TESTS UNITAIRES — FEAT-CHOICES.JS (dons à choix mémorisés, lot 3)
 * Règle validée par Franck : la fiche retient le choix, affiche des repères, mais ne modifie
 * jamais une valeur saisie ni une case cochée.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    FEAT_CHOICE_RULES, ASI_OPTIONS, slotChoice, setFeatChoicePatch, featChoiceGrants, featChoicesState,
    adeptElements, REPEATABLE_CHOICE_FEATS
} from '../js/rules/feat-choices.js';
import { featEffects, AUTOMATED_FEATS, FEAT_ZONES } from '../js/rules/feat-effects.js';
import { deriveCharacter } from '../js/rules/character.js';
import { spellDamageTypes, findSpellByName } from '../js/rules/spells.js';
import { migrateCharacter } from '../js/state/migrate.js';
import { V4_ONLY_KEYS } from '../js/cloud/sync.js';

const SPELLS = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));

/** Guerrier niveau 8 : Doué (1), Résilient (4), Amélioration de caractéristique (8) */
const hero = (extra = {}) => ({
    char_class: 'Guerrier', char_level: '8', str_score: '17', con_score: '15', wis_score: '12',
    feat_1: 'doue', feat_4: 'resilient', feat_8: 'amelioration_de_caracteristique', ...extra
});
const withChoices = (choices, extra = {}) => hero({ feat_choices: choices, ...extra });
const texts = (notes = []) => notes.map(n => n.text);

describe('Choix enregistrés', () => {
    test('Lus seulement pour le don de l’emplacement, valeurs inconnues ignorées', () => {
        const c = withChoices({ 4: { resilient: { ability: 'wis', other: 'x' }, observateur: { skill: 'perception' } } });
        assert.deepEqual(slotChoice(c, 4, 'resilient'), { ability: 'wis' });
        assert.deepEqual(slotChoice(c, '4', 'observateur'), { skill: 'perception' });
        assert.deepEqual(slotChoice(c, 8, 'resilient'), {});
        assert.deepEqual(slotChoice(withChoices({ 4: { resilient: { ability: 'xyz' } } }), 4, 'resilient'), {});
        assert.deepEqual(slotChoice(withChoices({ 4: { resilient: { ability: 3 } } }), 4, 'resilient'), {});
        assert.deepEqual(slotChoice(withChoices({ 4: ['wis'] }), 4, 'resilient'), {});
        assert.deepEqual(slotChoice(withChoices('abc'), 4, 'resilient'), {});
        assert.deepEqual(slotChoice(hero(), 4, 'vigilant'), {});
        assert.deepEqual(featChoicesState({ feat_choices: null }), {});
    });

    test('Patch : un seul champ change, le reste est gardé ; vide = retiré ; personnage intact', () => {
        const c = withChoices({ 1: { doue: { pick1: 'perception' } }, 4: { observateur: { skill: 'insight' } } });
        const before = JSON.stringify(c);
        const patch = setFeatChoicePatch(c, 4, 'resilient', 'ability', 'wis');
        assert.deepEqual(patch.feat_choices, {
            1: { doue: { pick1: 'perception' } },
            4: { observateur: { skill: 'insight' }, resilient: { ability: 'wis' } }
        });
        assert.deepEqual(setFeatChoicePatch(c, 1, 'doue', 'pick1', '').feat_choices[1], { doue: {} });
        assert.deepEqual(setFeatChoicePatch(c, 1, 'doue', 'pick9', 'perception'), {});
        assert.deepEqual(setFeatChoicePatch(c, 1, 'doue', 'pick1', 'vol'), {});
        assert.deepEqual(setFeatChoicePatch(c, 1, 'vigilant', 'ability', 'str'), {});
        assert.deepEqual(setFeatChoicePatch(c, 1, 'constructor', 'x', 'y'), {});
        assert.deepEqual(setFeatChoicePatch(c, 1, '__proto__', 'x', 'y'), {});
        assert.equal(JSON.stringify(c), before);
    });

    test('Amélioration de caractéristique : 6 × « +2 » puis 15 × « +1 / +1 »', () => {
        assert.equal(ASI_OPTIONS.length, 21);
        assert.deepEqual(ASI_OPTIONS[0], ['str,str', 'Force +2']);
        assert.deepEqual(ASI_OPTIONS[7], ['str,con', 'Force +1, Constitution +1']);
        assert.equal(new Set(ASI_OPTIONS.map(([v]) => v)).size, 21);
    });

    test('Chaque don à choix a des champs et des options', () => {
        for (const [id, rule] of Object.entries(FEAT_CHOICE_RULES)) {
            assert.ok(rule.fields.length > 0, id);
            for (const field of rule.fields) assert.ok(field.label && field.options.length > 1, `${id}.${field.key}`);
            assert.ok(AUTOMATED_FEATS.includes(id), id);
        }
        assert.deepEqual(REPEATABLE_CHOICE_FEATS, ['amelioration_de_caracteristique', 'doue', 'adepte_elementaire']);
    });
});

describe('Ce que donnent les choix', () => {
    test('Augmentations : +2, +1 / +1, Intelligence fixe d’Esprit affûté', () => {
        const grants = featChoiceGrants(withChoices({ 8: { amelioration_de_caracteristique: { asi: 'str,str' } } }));
        assert.deepEqual(grants.find(g => g.level === 8).abilities, [{ ability: 'str', amount: 2 }]);
        const split = featChoiceGrants(withChoices({ 8: { amelioration_de_caracteristique: { asi: 'str,con' } } }));
        assert.deepEqual(split.find(g => g.level === 8).abilities, [{ ability: 'str', amount: 1 }, { ability: 'con', amount: 1 }]);
        const keen = featChoiceGrants(hero({ feat_4: 'esprit_affute' }));
        assert.deepEqual(keen.find(g => g.level === 4).abilities, [{ ability: 'int', amount: 1 }]);
    });

    test('Choix manquants listés ; emplacement pas atteint ignoré', () => {
        const grants = featChoiceGrants(hero());
        assert.deepEqual(grants.map(g => [g.level, g.missing]), [
            [1, ['Maîtrise 1', 'Maîtrise 2', 'Maîtrise 3']], [4, ['Caractéristique']], [8, ['Augmentation']]
        ]);
        assert.deepEqual(featChoiceGrants(hero({ char_level: '4' })).map(g => g.level), [1, 4]);
    });

    test('Doué : compétences et outils', () => {
        const [doue] = featChoiceGrants(withChoices({ 1: { doue: { pick1: 'perception', pick2: 'tool', pick3: 'tool' } } }));
        assert.deepEqual(doue.skills, [{ skill: 'perception', field: 'pick1', kind: 'proficiency' }]);
        assert.equal(doue.tools, 2);
    });

    test('Adepte élémentaire : types choisis, sans doublon', () => {
        const c = { char_class: 'Magicien', char_level: '8', feat_4: 'adepte_elementaire', feat_8: 'adepte_elementaire',
            feat_choices: { 4: { adepte_elementaire: { element: 'fire' } }, 8: { adepte_elementaire: { element: 'fire' } } } };
        assert.deepEqual(adeptElements(c), ['fire']);
        assert.deepEqual(adeptElements(hero()), []);
    });
});

describe('Notes sur la fiche (rien n’est modifié)', () => {
    test('Augmentation : repère « À reporter » près de la valeur ; alerte au-delà de 20', () => {
        const c = withChoices({ 8: { amelioration_de_caracteristique: { asi: 'str,con' } } }, { str_score: '21' });
        const before = JSON.stringify(c);
        const effects = featEffects(c);
        assert.equal(effects['scores.str'][0].value, 1);
        assert.equal(effects['scores.str'][0].manual, true);
        assert.equal(effects['scores.str'][0].slot, 8);
        assert.match(effects['scores.str'][1].text, /^Force 21 : un don ne fait pas dépasser 20/);
        assert.equal(effects['scores.str'][1].check, true);
        assert.equal(effects['scores.con'].length, 1);
        assert.match(texts(effects['featSlot:8'])[0], /^Force \+1 et Constitution \+1 : repère/);
        // La valeur saisie et le calcul du modificateur ne changent pas
        assert.equal(deriveCharacter(c).scores.str, 21);
        assert.equal(JSON.stringify(c), before);
    });

    test('Amélioration prise deux fois : une note par emplacement', () => {
        const c = withChoices({
            4: { amelioration_de_caracteristique: { asi: 'str,str' } }, 8: { amelioration_de_caracteristique: { asi: 'str,con' } }
        }, { feat_4: 'amelioration_de_caracteristique' });
        assert.deepEqual(featEffects(c)['scores.str'].map(n => [n.slot, n.value]), [[4, 2], [8, 1]]);
    });

    test('Résilient : case cochée, à cocher, ou déjà donnée par la classe', () => {
        const wis = { 4: { resilient: { ability: 'wis' } } };
        assert.equal(featEffects(withChoices(wis))['saves.wis'][0].check, true);
        const ticked = featEffects(withChoices(wis, { wis_save_prof: true }));
        assert.equal(ticked['saves.wis'][0].ticked, true);
        assert.match(ticked['featSlot:4'][1].text, /^Maîtrise du jet de sauvegarde de Sagesse : case cochée/);
        // Guerrier : Force et Constitution déjà maîtrisées par la classe
        const owned = featEffects(withChoices({ 4: { resilient: { ability: 'con' } } }, { con_save_prof: true }));
        assert.match(owned['saves.con'][0].text, /^Votre classe \(Guerrier\) maîtrise déjà le jet de sauvegarde de Constitution/);
        assert.equal(owned['saves.con'][0].check, true);
        assert.equal(featEffects(withChoices(wis)).saves?.wis, undefined);
    });

    test('Observateur et Esprit affûté : maîtrise, ou Expertise si déjà maîtrisée', () => {
        const obs = (extra) => featEffects(hero({ feat_4: 'observateur', feat_choices: { 4: { observateur: { skill: 'insight' } } }, ...extra }))['skills.insight'][0];
        assert.equal(obs({}).check, true);
        assert.equal(obs({}).text, "Maîtrise d'Intuition à cocher (ou l'Expertise, losange, si vous la maîtrisiez déjà).");
        const proficient = obs({ skill_prof_insight: true });
        assert.equal(proficient.check, undefined);
        assert.match(proficient.text, /cochez aussi le losange/);
        assert.equal(obs({ skill_exp_insight: true }).ticked, true);
        const keen = featEffects(hero({ feat_4: 'esprit_affute' }));
        assert.ok(texts(keen['featSlot:4']).includes("Étude rapide : l'action Étude en action Bonus."));
        assert.match(texts(keen['featSlot:4'])[0], /^Choix à faire ci-dessus : Compétence\./);
    });

    test('Expert : maîtrise et Expertise à cocher ; Expertise sur une compétence maîtrisée seulement', () => {
        const expert = (choice, extra = {}) => featEffects(hero({ feat_4: 'expert', feat_choices: { 4: { expert: { ability: 'dex', ...choice } } }, ...extra }));
        const ok = expert({ skill: 'stealth', expertise: 'perception' }, { skill_prof_stealth: true, skill_prof_perception: true });
        assert.equal(ok['skills.stealth'][0].ticked, true);
        assert.equal(ok['skills.perception'][0].text, 'Expertise de Perception à cocher (losange).');
        assert.equal(ok['scores.dex'][0].value, 1);
        // Perception pas maîtrisée : signalé (PHB p. 207), jamais « case cochée »
        const wrong = expert({ skill: 'stealth', expertise: 'perception' }, { skill_prof_stealth: true });
        assert.equal(wrong['skills.perception'][0].check, true);
        assert.match(wrong['skills.perception'][0].text, /^L'Expertise d'Expert porte sur une compétence que vous maîtrisez déjà/);
        // Même compétence en Maîtrise et en Expertise : valable
        const same = expert({ skill: 'stealth', expertise: 'stealth' });
        assert.ok(!same['skills.stealth'].some(n => /porte sur une compétence/.test(n.text)));
    });

    test('Doué : même compétence deux fois signalée ; outils rappelés', () => {
        const effects = featEffects(withChoices({ 1: { doue: { pick1: 'athletics', pick2: 'athletics', pick3: 'tool' } } }));
        const notes = texts(effects['featSlot:1']);
        assert.ok(notes.includes('La compétence Athlétisme est choisie deux fois : choisissez trois maîtrises différentes.'));
        assert.ok(notes.some(t => t.startsWith("1 maîtrise d'outil")));
        assert.equal(effects['skills.athletics'].length, 1);
    });

    test('Adepte élémentaire : rappel des sorts, même type deux fois signalé', () => {
        const c = { char_class: 'Magicien', char_level: '8', feat_4: 'adepte_elementaire', feat_8: 'adepte_elementaire',
            feat_choices: { 4: { adepte_elementaire: { ability: 'int', element: 'acid' } }, 8: { adepte_elementaire: { element: 'acid' } } } };
        const effects = featEffects(c);
        assert.match(effects['featSlot:4'].find(n => /Résistance/.test(n.text)).text,
            /^Vos sorts ignorent la Résistance aux dégâts d'acide ; pour un sort qui inflige des dégâts d'acide, un 1/);
        assert.deepEqual(effects.spells, []);
        assert.ok(effects['featSlot:8'].some(n => n.check && /Même type de dégâts qu'au niveau 4/.test(n.text)));
    });

    test('Don non répétable pris deux fois : le second ne compte pas et le dit', () => {
        const c = hero({ feat_8: 'resilient', feat_choices: { 4: { resilient: { ability: 'wis' } }, 8: { resilient: { ability: 'con' } } } });
        const effects = featEffects(c);
        assert.deepEqual(texts(effects['featSlot:8']), ["Résilient est déjà pris au niveau 4 : ce don ne se prend qu'une fois. Choisissez un autre don ici."]);
        assert.equal(effects['featSlot:8'][0].check, true);
        assert.deepEqual(effects['scores.con'], []);
        assert.equal(effects['scores.wis'].length, 1);
    });

    test('Deux augmentations : texte au pluriel ; Faveur épique : pas d’alerte au-delà de 20', () => {
        const split = featEffects(withChoices({ 8: { amelioration_de_caracteristique: { asi: 'dex,int' } } }));
        assert.match(texts(split['featSlot:8'])[0], /repères près des valeurs\. La fiche ne les ajoute pas/);
        const single = featEffects(withChoices({ 8: { amelioration_de_caracteristique: { asi: 'str,str' } } }));
        assert.match(texts(single['featSlot:8'])[0], /^Force \+2 : repère près de la valeur\. La fiche ne l'ajoute pas/);
        const epic = withChoices({ 8: { amelioration_de_caracteristique: { asi: 'str,str' } } },
            { char_level: '20', str_score: '22', feat_19: 'faveur_d_attaque_irresistible' });
        assert.ok(!featEffects(epic)['scores.str'].some(n => n.check));
        assert.ok(featEffects({ ...epic, feat_19: '' })['scores.str'].some(n => n.check && /seuls une Faveur épique/.test(n.text)));
    });

    test('Zones fixes : caractéristiques et compétences toujours présentes', () => {
        const effects = featEffects({});
        for (const zone of ['scores.str', 'scores.cha', 'skills.perception', 'skills.deception']) {
            assert.ok(FEAT_ZONES.includes(zone), zone);
            assert.deepEqual(effects[zone], []);
        }
    });
});

describe('Sorts : types de dégâts lus dans la description', () => {
    const types = (name) => spellDamageTypes(findSpellByName(SPELLS, name));
    test('Dégâts infligés reconnus', () => {
        assert.deepEqual(types('Boule de feu'), ['fire']);
        assert.deepEqual(types('Trait de feu'), ['fire']);
        assert.deepEqual(types('Éclair'), ['lightning']);
        assert.deepEqual(types("Armure d'Agathys"), ['cold']);
        assert.deepEqual(types('Lame de feu'), ['fire']);
    });
    test('Sorts à type de dégâts choisi : tous les types possibles', () => {
        assert.deepEqual(types('Orbe chromatique'), ['acid', 'cold', 'fire', 'lightning', 'thunder']);
        assert.deepEqual(types('Éruption ensorcelée'), ['acid', 'cold', 'fire', 'lightning', 'thunder']);
        assert.deepEqual(types('Glyphe de garde'), ['acid', 'cold', 'fire', 'lightning', 'thunder']);
        assert.deepEqual(types('Souffle du dragon'), ['acid', 'cold', 'fire', 'lightning']);
        assert.deepEqual(types("Protection contre l'énergie"), []);
        assert.deepEqual(types("Convocation d'élémentaire"), []);
    });
    test('Résistance, Immunité ou Vulnérabilité ne comptent pas', () => {
        assert.deepEqual(types('Silence'), []);
        assert.deepEqual(types('Mur de glace'), ['cold']);
        assert.deepEqual(types('Bouclier'), []);
        assert.deepEqual(spellDamageTypes(null), []);
    });
});

describe('Sauvegarde', () => {
    test('La migration garde feat_choices tel quel ; clé propre à la v4 pour le cloud', () => {
        const choices = { 4: { resilient: { ability: 'wis' } } };
        assert.deepEqual(migrateCharacter(withChoices(choices)).character.feat_choices, choices);
        assert.equal('feat_choices' in migrateCharacter(hero()).character, false);
        assert.ok(V4_ONLY_KEYS.includes('feat_choices'));
    });
});
