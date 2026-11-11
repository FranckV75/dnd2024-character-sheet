/**
 * TESTS — ESPÈCES (4.36.0) : option de l'espèce (lignage, ascendance…), Vision dans le noir,
 * Résistances, Souffle, sorts d'espèce, cases des traits à usages limités et repos.
 * Espèces de L'Odyssée des Seigneurs Dragons : Centaure, Méduse, Minotaure, Satyre, Sirène, Nymphe.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deriveCharacter } from '../js/rules/character.js';
import {
    speciesView, speciesNotes, speciesCounterDefs, speciesSpellNames, setSpeciesChoicePatch, breathDice, petrifyingGazeDc,
    SPECIES_CHOICES_KEY
} from '../js/rules/species.js';
import { SPECIES_TRAITS } from '../js/data/species-traits.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { subclassCounters, restSubclassUses } from '../js/rules/subclass-uses.js';
import { classFeatureNotes } from '../js/rules/class-features.js';
import { V4_ONLY_KEYS } from '../js/cloud/sync.js';

const view = (record) => speciesView(record, deriveCharacter(record));

describe('Données des espèces', () => {
    test('Chaque espèce du Manuel des joueurs a ses traits ; les clés existent dans DD_RULES', () => {
        for (const slug of Object.keys(SPECIES_TRAITS)) assert.ok(DD_RULES.species[slug], slug);
        for (const slug of ['aasimar', 'dragonborn', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'human', 'orc', 'tiefling']) {
            assert.ok(SPECIES_TRAITS[slug]?.traits.length > 0, slug);
        }
    });

    test('Chaque sort d\'espèce existe dans la base des sorts (nom anglais) et a le bon niveau', () => {
        const base = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
        const list = Array.isArray(base) ? base : Object.values(base).flat();
        const byVo = new Map(list.map((spell) => [spell.vo, spell]));
        const spells = Object.values(SPECIES_TRAITS).flatMap((data) => [
            ...(data.spells ?? []), ...(data.option?.choices ?? []).flatMap((choice) => choice.spells ?? [])]);
        assert.ok(spells.length >= 20);
        for (const spell of spells) {
            assert.ok(byVo.has(spell.vo), `${spell.vo} absent de data/spells.json`);
            assert.equal(byVo.get(spell.vo).level, spell.spellLevel, `niveau de ${spell.vo}`);
            assert.ok(String(byVo.get(spell.vo).name).split('|').includes(spell.name), `nom français de ${spell.vo}`);
            if (spell.reset !== undefined) assert.ok(['short', 'long'].includes(spell.reset), spell.vo);
        }
    });

    test('Chaque option a un nom, un texte et un identifiant unique', () => {
        for (const [slug, data] of Object.entries(SPECIES_TRAITS)) {
            if (!data.option) continue;
            const ids = data.option.choices.map((choice) => choice.id);
            assert.equal(new Set(ids).size, ids.length, slug);
            for (const choice of data.option.choices) assert.ok(choice.name && choice.text, `${slug}.${choice.id}`);
        }
    });
});

describe('Vue de l\'espèce', () => {
    test('Sans espèce reconnue : null', () => {
        assert.equal(view({ char_species: '' }), null);
        assert.equal(view({ char_species: 'Inconnue' }), null);
    });

    test('Drow : Vision dans le noir de 36 m ; sorts selon le niveau ; DD avec la caractéristique choisie', () => {
        const record = { char_species: 'Elfe', char_level: '3', int_score: '16', species_choices: { option: 'drow', ability: 'int' } };
        const drow = view(record);
        assert.equal(drow.darkvision, 36);
        assert.equal(drow.option.selected.id, 'drow');
        const [lights, faerie, darkness] = drow.spells;
        assert.equal(lights.reached, true);
        assert.equal(faerie.reached, true);
        assert.equal(darkness.reached, false);
        // 8 + bonus de maîtrise (2) + Intelligence (+3)
        assert.equal(faerie.dc, 13);
        assert.equal(faerie.attack, 5);
        assert.deepEqual(speciesSpellNames(record, deriveCharacter(record)),
            ['Lumières dansantes', 'Dancing Lights', 'Lueurs féeriques', 'Faerie Fire']);
    });

    test('Option d\'une autre espèce ou inconnue : ignorée, jamais effacée', () => {
        const record = { char_species: 'Nain', char_level: '1', species_choices: { option: 'drow', ability: 'int' } };
        assert.equal(view(record).option, null);
        assert.equal(view(record).darkvision, 36);
        assert.deepEqual(record.species_choices, { option: 'drow', ability: 'int' });
        assert.equal(view({ char_species: 'Elfe', species_choices: { option: 'zzz' } }).option.selected, null);
    });

    test('Sans caractéristique choisie : pas de DD (à choisir)', () => {
        const elf = view({ char_species: 'Elfe', char_level: '1', species_choices: { option: 'haut_elfe' } });
        assert.ok(elf.spells.length > 0);
        assert.equal(elf.spells[0].dc, null);
    });

    test('Lumière de l\'Aasimar : toujours au Charisme', () => {
        const aasimar = view({ char_species: 'Aasimar', char_level: '1', cha_score: '14' });
        assert.equal(aasimar.spells[0].ability, 'cha');
        assert.equal(aasimar.spells[0].dc, 12);
    });

    test('Souffle du Drakéide : dés selon le niveau, DD de Constitution, type de l\'ascendance', () => {
        assert.deepEqual([1, 5, 11, 17].map(breathDice), ['1d10', '2d10', '3d10', '4d10']);
        const red = view({ char_species: 'Drakéide', char_level: '11', con_score: '14', species_choices: { option: 'rouge' } });
        assert.deepEqual(red.breath, { dice: '3d10', dc: 8 + 2 + 4, type: 'feu' });
        assert.ok(red.resistances.includes('feu'));
    });
});

describe('Choix enregistrés', () => {
    test('Option et caractéristique permises seulement ; valeur vide = retirée', () => {
        const record = { char_species: 'Elfe', species_choices: { ability: 'wis' } };
        assert.deepEqual(setSpeciesChoicePatch(record, 'option', 'drow'), { [SPECIES_CHOICES_KEY]: { ability: 'wis', option: 'drow' } });
        assert.deepEqual(setSpeciesChoicePatch(record, 'option', 'rouge'), {});
        assert.deepEqual(setSpeciesChoicePatch(record, 'ability', 'str'), {});
        assert.deepEqual(setSpeciesChoicePatch(record, 'ability', ''), { [SPECIES_CHOICES_KEY]: {} });
        assert.deepEqual(setSpeciesChoicePatch({ char_species: 'Nain' }, 'option', 'drow'), {});
    });

    test('Clé propre à la v4 : l\'ancien site ne l\'efface pas en enregistrant', () => {
        assert.ok(V4_ONLY_KEYS.includes('species_choices'));
    });
});

describe('Repères près des valeurs', () => {
    test('Nain : Résistance au poison près de la CA', () => {
        const record = { char_species: 'Nain', char_level: '1' };
        const notes = classFeatureNotes(deriveCharacter(record), record).armorClass;
        assert.ok(notes.some((note) => note.mention === 'Résistance (poison)'));
    });

    test('Elfe sylvestre : « dont +1,5 m », Vitesse saisie inchangée', () => {
        const record = { char_species: 'Elfe', char_level: '1', speed: '10,5', species_choices: { option: 'elfe_sylvestre' } };
        const [note] = speciesNotes(deriveCharacter(record), record).speed;
        assert.equal(note.mention, 'dont +1,5 m (Elfe sylvestre)');
        assert.equal(note.manual, true);
        assert.equal(record.speed, '10,5');
    });
});

describe('Cases des traits et des sorts d\'espèce', () => {
    test('Orc : Acharnement (repos long) et Poussée d\'adrénaline (bonus de maîtrise, repos court)', () => {
        const record = { char_species: 'Orc', char_class: 'Guerrier', char_level: '5' };
        const list = subclassCounters(record, deriveCharacter(record)).filter((c) => c.source === 'species');
        assert.deepEqual(list.map((c) => [c.key, c.max, c.reset]),
            [['species.acharnement', 1, 'long'], ['species.poussee_d_adrenaline', 3, 'short']]);
    });

    test('Repos court : Poussée revient, Acharnement non ; repos long : tout revient', () => {
        const record = { char_species: 'Orc', char_level: '3', subclass_uses: { 'species.acharnement': 1, 'species.poussee_d_adrenaline': 2 } };
        const derived = deriveCharacter(record);
        const short = restSubclassUses(record, derived, 'short');
        assert.deepEqual(short.patch.subclass_uses, { 'species.acharnement': 1, 'species.poussee_d_adrenaline': 0 });
        assert.equal(short.restored[0].inText, 'Poussée d\'adrénaline');
        assert.deepEqual(restSubclassUses(record, derived, 'long').patch.subclass_uses,
            { 'species.acharnement': 0, 'species.poussee_d_adrenaline': 0 });
    });

    test('Souffle : nombre d\'utilisations = bonus de maîtrise, phrase avec dés et DD', () => {
        const record = { char_species: 'Drakéide', char_level: '5', con_score: '12', species_choices: { option: 'bleu' } };
        const breath = speciesCounterDefs(record, deriveCharacter(record)).find((def) => def.key === 'species.souffle');
        assert.equal(breath.max, 3);
        assert.match(breath.use, /2d10 foudre/);
        assert.match(breath.use, /DD 12/);
    });

    test('Sorts de niveau 1 ou plus : une case de lancer gratuit par repos long, une fois le niveau atteint', () => {
        const record = { char_species: 'Elfe', char_level: '5', species_choices: { option: 'drow', ability: 'cha' } };
        const keys = speciesCounterDefs(record, deriveCharacter(record)).map((def) => def.key);
        assert.deepEqual(keys, ['species.sort_faerie_fire', 'species.sort_darkness']);
        const low = { ...record, char_level: '2' };
        assert.deepEqual(speciesCounterDefs(low, deriveCharacter(low)), []);
    });

    test('Changement d\'espèce : les anciennes cases sont vidées au repos long', () => {
        const record = { char_species: 'Nain', char_level: '5', subclass_uses: { 'species.poussee_d_adrenaline': 2 } };
        const derived = deriveCharacter(record);
        // L'ancienne case (Orc) n'est plus une définition connue : elle reste telle quelle, sans erreur
        assert.doesNotThrow(() => restSubclassUses(record, derived, 'long'));
    });
});

describe('Relecture 4.36.0', () => {
    test('Repos long : une case d\'espèce qui ne s\'applique plus est vidée (niveau baissé, autre espèce)', () => {
        const low = { char_species: 'Elfe', char_level: '4', species_choices: { option: 'drow' }, subclass_uses: { 'species.sort_darkness': 1 } };
        assert.equal(restSubclassUses(low, deriveCharacter(low), 'long').patch.subclass_uses['species.sort_darkness'], 0);
        const dwarf = { char_species: 'Nain', char_level: '5', subclass_uses: { 'species.souffle': 2 } };
        assert.equal(restSubclassUses(dwarf, deriveCharacter(dwarf), 'long').patch.subclass_uses['species.souffle'], 0);
        assert.deepEqual(restSubclassUses(dwarf, deriveCharacter(dwarf), 'short').patch, {});
    });

    test('Résistance d\'espèce : simple rappel (pas « Déjà compté »), marquée trait d\'espèce', () => {
        const record = { char_species: 'Nain', char_level: '1' };
        const [note] = speciesNotes(deriveCharacter(record), record).armorClass;
        assert.equal(note.applied, undefined);
        assert.equal(note.species, true);
    });
});

describe('Espèces de L\'Odyssée des Seigneurs Dragons', () => {
    test('Toutes les espèces de la liste ont leurs traits (plus de renvoi au livre)', () => {
        for (const slug of Object.keys(DD_RULES.species)) assert.ok(SPECIES_TRAITS[slug]?.traits.length > 0, slug);
        for (const name of ['Centaure', 'Méduse', 'Minotaure', 'Satyre', 'Sirène', 'Nymphe']) {
            assert.equal(view({ char_species: name, char_level: '1' }).known, true, name);
        }
    });

    test('Vitesses du guide : Centaure et Minotaure 12 m, les autres 9 m', () => {
        const meters = (slug) => DD_RULES.species[slug].speed / 10 * 3;
        assert.deepEqual(['centaur', 'minotaur', 'medusa', 'satyr', 'siren', 'thylean_nymph'].map(meters), [12, 12, 9, 9, 9, 9]);
    });

    test('Centaure : trois traits, sans Vision dans le noir ni case à cocher', () => {
        const record = { char_species: 'Centaure', char_level: '3' };
        const centaur = view(record);
        assert.deepEqual(centaur.traits.map((t) => t.name), ['Charge', 'Monture', 'Quadrupède']);
        assert.equal(centaur.darkvision, null);
        assert.deepEqual(speciesCounterDefs(record, deriveCharacter(record)), []);
    });

    test('Méduse : Regard pétrifiant DD 8, 10, 12 puis 14 selon le niveau', () => {
        assert.deepEqual([1, 5, 9, 10, 14, 15, 19, 20].map(petrifyingGazeDc), [8, 8, 8, 10, 10, 12, 12, 14]);
    });

    test('Méduse : Vision dans le noir 18 m ; Chevelure serpentine avec maîtrise + Dextérité ; Regard au niveau 5', () => {
        const low = view({ char_species: 'Méduse', char_level: '4', dex_score: '16' });
        assert.equal(low.darkvision, 18);
        assert.deepEqual(low.stats, ['Chevelure serpentine +5, 1d6 perforants, JS Con DD 12']);
        assert.deepEqual(low.upcoming.map((t) => t.id), ['regard_petrifiant']);
        const high = view({ char_species: 'Méduse', char_level: '10', dex_score: '14' });
        assert.deepEqual(high.stats, ['Chevelure serpentine +6, 1d6 perforants, JS Con DD 12', 'Regard pétrifiant : JS Con DD 10']);
    });

    test('Minotaure : Vision dans le noir 18 m ; Rage maudite une fois par repos long dès le niveau 5', () => {
        const record = { char_species: 'Minotaure', char_level: '5' };
        assert.equal(view(record).darkvision, 18);
        assert.deepEqual(speciesCounterDefs(record, deriveCharacter(record)).map((d) => [d.key, d.max, d.reset]),
            [['species.rage_maudite', 1, 'long']]);
        assert.deepEqual(view(record).upcoming.map((t) => t.id), ['taureau_enrage']);
        const low = { char_species: 'Minotaure', char_level: '4' };
        assert.deepEqual(speciesCounterDefs(low, deriveCharacter(low)), []);
    });

    test('Satyre : sorts au Charisme ; Sommeil (niv. 3) et Suggestion (niv. 5) une fois par repos long', () => {
        const record = { char_species: 'Satyre', char_level: '3', cha_score: '16' };
        const satyr = view(record);
        assert.deepEqual(satyr.spells.map((s) => [s.name, s.reached, s.dc]),
            [['Illusion mineure', true, 13], ['Sommeil', true, 13], ['Suggestion', false, 13]]);
        assert.deepEqual(speciesCounterDefs(record, deriveCharacter(record)).map((d) => [d.key, d.reset]),
            [['species.sort_sleep', 'long']]);
    });

    test('Sirène : vol 9 m sous condition ; humeur choisie à chaque repos (non mémorisée)', () => {
        const siren = view({ char_species: 'Sirène', char_level: '1' });
        assert.equal(siren.fly.speed, 9);
        assert.equal(siren.option.perUse, true);
        assert.deepEqual(siren.option.choices.map((c) => c.id), ['joyeuse', 'triste']);
        assert.equal(siren.option.selected, null);
    });

    test('Sirène : Chants de désespoir rendus au repos court ; le repos court vide leurs cases', () => {
        const record = {
            char_species: 'Sirène', char_level: '5', cha_score: '14',
            subclass_uses: { 'species.sort_charm_person': 1, 'species.sort_hold_person': 1 }
        };
        const derived = deriveCharacter(record);
        const defs = speciesCounterDefs(record, derived);
        assert.deepEqual(defs.map((d) => [d.key, d.reset]),
            [['species.sort_charm_person', 'short'], ['species.sort_enthrall', 'short'], ['species.sort_hold_person', 'short']]);
        assert.deepEqual(restSubclassUses(record, derived, 'short').patch.subclass_uses,
            { 'species.sort_charm_person': 0, 'species.sort_hold_person': 0 });
        assert.match(defs[0].use, /Chants de désespoir/);
        assert.match(defs[0].use, /DD 13/);
    });

    test('Nymphe : Héritage à choisir ; Charme-personne au Charisme dès le niveau 1', () => {
        const nymph = view({ char_species: 'Nymphe', char_level: '1', cha_score: '16' });
        assert.equal(nymph.option.label, 'Héritage');
        assert.equal(nymph.option.abilities, null);
        assert.equal(nymph.option.selected, null);
        assert.deepEqual(nymph.spells.map((s) => [s.name, s.ability, s.dc, s.reset]), [['Charme-personne', 'cha', 13, 'short']]);
    });

    test('Nymphe : nage des naïades, vision des oréades, sorts de l\'héritage aux niveaux 3 et 7', () => {
        const naiad = view({ char_species: 'Nymphe', char_level: '3', species_choices: { option: 'naiade' } });
        assert.equal(naiad.swim, 9);
        assert.equal(naiad.darkvision, null);
        assert.deepEqual(naiad.spells.map((s) => [s.name, s.reached, s.ability]),
            [['Charme-personne', true, 'cha'], ['Création ou destruction d\'eau', true, 'cha'], ['Contrôle de l\'eau', false, 'cha']]);
        const record = { char_species: 'Nymphe', char_level: '7', species_choices: { option: 'oreade' } };
        assert.equal(view(record).darkvision, 18);
        assert.deepEqual(speciesCounterDefs(record, deriveCharacter(record)).map((d) => [d.key, d.reset]),
            [['species.sort_charm_person', 'short'], ['species.sort_hunter_s_mark', 'short'], ['species.sort_misty_step', 'short']]);
        assert.deepEqual(setSpeciesChoicePatch(record, 'option', 'ouranie'), { [SPECIES_CHOICES_KEY]: { option: 'ouranie' } });
        assert.deepEqual(setSpeciesChoicePatch(record, 'ability', 'int'), {});
    });

    test('Sorts d\'espèce du Manuel : toujours rendus au repos long', () => {
        const record = { char_species: 'Elfe', char_level: '3', species_choices: { option: 'drow', ability: 'cha' } };
        assert.deepEqual(speciesCounterDefs(record, deriveCharacter(record)).map((d) => d.reset), ['long']);
    });
});
