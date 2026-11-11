// =============================================================================
// Sorcellerie draconique, Affinité élémentaire (niveau 6, PHB 2024 p. 148) : repère « +Cha » des
// sorts du type choisi dans le grimoire — js/rules/subclass-combat.js (elementalAffinity),
// js/rules/spells.js (spellDamageTypes, poison compris).
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deriveCharacter } from '../js/rules/character.js';
import { elementalAffinity } from '../js/rules/subclass-combat.js';
import { spellDamageTypes, findSpellByName } from '../js/rules/spells.js';
import { featChoiceGrants } from '../js/rules/feat-choices.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const SPELLS = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
const types = (name) => spellDamageTypes(findSpellByName(SPELLS, name));

const sorcerer = (level, element, extra = {}) => ({
    ...createDefaultCharacter(), char_class: 'Ensorceleur', char_subclass: 'Sorcellerie draconique', char_level: String(level),
    cha_score: '18', ...(element ? { subclass_choices: { draconic_sorcery: { element } } } : {}), ...extra
});
const affinity = (...args) => elementalAffinity(deriveCharacter(sorcerer(...args)));
/** Le repère s'affiche sur ce sort (même test que le grimoire, affinityApplies) */
const marked = (name, a) => types(name).includes(a.type);

describe('Affinité élémentaire', () => {
    test('à partir du niveau 6, avec un type choisi : bonus = modificateur de Charisme', () => {
        assert.equal(affinity(5, 'fire'), null);
        assert.equal(affinity(6), null);
        const fire = affinity(6, 'fire');
        assert.deepEqual([fire.type, fire.word, fire.bonus], ['fire', 'feu', 4]);
        assert.equal(fire.mention, '+Cha (+4, feu)');
        assert.match(fire.rule, /dégâts de feu, ajoutez votre modificateur de Charisme \(\+4\) à un de ses jets de dégâts/);
        assert.match(affinity(6, 'acid').rule, /dégâts d'acide/);
        assert.equal(affinity(6, 'poison', { cha_score: '8' }).mention, '+Cha (-1, poison)');
        // Autre sous-classe ou type impossible (sauvegarde retouchée) : rien
        assert.equal(elementalAffinity(deriveCharacter({ ...sorcerer(6, 'fire'), char_subclass: 'Sorcellerie aberrante' })), null);
        assert.equal(affinity(6, 'thunder'), null);
    });

    test('sorts du type choisi : lus dans la description, ou type au choix du lanceur', () => {
        const fire = affinity(6, 'fire');
        assert.ok(marked('Boule de feu', fire));
        assert.ok(marked('Trait de feu', fire));
        assert.ok(!marked('Rayon de givre', fire));
        assert.ok(!marked('Bouclier', fire));
        // Sorts de la sous-classe à type choisi
        assert.ok(marked('Orbe chromatique', fire));
        assert.ok(marked('Souffle du dragon', fire));
        // Poison : lu dans la description, et parmi les types au choix
        const poison = affinity(6, 'poison');
        assert.deepEqual(types('Bouffée de poison'), ['poison']);
        assert.ok(marked('Brume mortelle', poison));
        assert.ok(marked('Orbe chromatique', poison));
        assert.ok(!marked('Boule de feu', poison));
        // Une Résistance au poison ne compte pas comme des dégâts
        assert.ok(!types('Protection contre le poison').includes('poison'));
    });

    test('Adepte élémentaire ne propose jamais le poison', () => {
        const adept = (element) => ({ ...createDefaultCharacter(), char_level: '4', feat_4: 'adepte_elementaire', feat_choices: { 4: { adepte_elementaire: { element } } } });
        const elements = (element) => featChoiceGrants(adept(element)).map(grant => grant.element).filter(Boolean);
        assert.deepEqual(elements('fire'), ['fire']);
        assert.deepEqual(elements('poison'), []);
    });
});
