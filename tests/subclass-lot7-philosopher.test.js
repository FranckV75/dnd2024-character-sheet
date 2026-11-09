// =============================================================================
// Sous-classes, lot 7 : Philosophe de l'Académie (Odyssée, p. 44 et 46). École choisie (et seconde
// école de l'Éclectisme au niveau 5), cases des écoles, repères, Amis du Sophisme, textes du bloc.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCharacter } from '../js/rules/character.js';
import {
    subclassChoiceFields, subclassChoice, setSubclassChoicePatch, subclassChoiceNotes, philosopherSchools
} from '../js/rules/subclass-choices.js';
import { subclassFeatures, subclassSpells, SUBCLASS_AUTOMATION } from '../js/rules/subclass-features.js';
import { subclassCounters, restSubclassUses } from '../js/rules/subclass-uses.js';
import { SUBCLASS_CHOICE_FIELDS, PHILOSOPHER_SCHOOLS } from '../js/data/subclass-choices.js';
import { SUBCLASS_FEATURES } from '../js/data/subclass-features.js';
import { V4_ONLY_KEYS } from '../js/cloud/sync.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const philo = (level, choices, extra = {}) => ({
    ...createDefaultCharacter(), char_class: 'Magicien', char_subclass: 'Philosophe de l\'Académie', char_level: String(level),
    int_score: '16', ...(choices !== undefined ? { subclass_choices: { academy_philosopher: choices } } : {}), ...extra
});
const schools = (c) => philosopherSchools(deriveCharacter(c));
const counters = (c) => subclassCounters(c, deriveCharacter(c));
const features = (c) => counters(c).map(x => x.feature);
const notes = (c) => subclassChoiceNotes(deriveCharacter(c), c);
const school = (c) => subclassFeatures(deriveCharacter(c)).reached.find(f => f.id === 'ecole_philosophique');
const SCHOOL_IDS = ['cynisme', 'eclectisme', 'empirisme', 'epicurisme', 'stoicisme', 'sophisme', 'hedonisme', 'scepticisme'];

function deepFreeze(value) {
    if (value && typeof value === 'object') {
        Object.freeze(value);
        for (const inner of Object.values(value)) deepFreeze(inner);
    }
    return value;
}

describe('Philosophe : données', () => {
    test('les 8 écoles, dans l\'ordre du livre, sont les options de « École philosophique »', () => {
        assert.deepEqual(PHILOSOPHER_SCHOOLS.map(([id]) => id), SCHOOL_IDS);
        const options = SUBCLASS_FEATURES.academy_philosopher.filter(f => f.optionOf === 'ecole_philosophique').map(f => f.id);
        assert.deepEqual(options, SCHOOL_IDS);
        const [main, second] = SUBCLASS_CHOICE_FIELDS.academy_philosopher;
        assert.deepEqual(main.options.map(([id]) => id), SCHOOL_IDS);
        assert.deepEqual(second.options.map(([id]) => id), SCHOOL_IDS.filter(id => id !== 'eclectisme'));
    });

    test('la clé subclass_choices est propre à la v4', () => {
        assert.ok(V4_ONLY_KEYS.includes('subclass_choices'));
    });

    test('Empirisme : un seul lancer gratuit, de l\'un ou de l\'autre sort', () => {
        assert.match(SUBCLASS_FEATURES.academy_philosopher.find(f => f.id === 'empirisme').text, /un seul lancer/);
    });
});

describe('Philosophe : choix de l\'école', () => {
    test('menus : école au niveau 3 ; second menu seulement pour un Éclectique de niveau 5', () => {
        const keys = (c) => subclassChoiceFields(deriveCharacter(c)).map(f => f.key);
        assert.deepEqual(keys(philo(3)), ['school']);
        assert.deepEqual(keys(philo(5, { school: 'stoicisme' })), ['school']);
        assert.deepEqual(keys(philo(4, { school: 'eclectisme' })), ['school']);
        assert.deepEqual(keys(philo(5, { school: 'eclectisme' })), ['school', 'second_school']);
        // Choix de construction : verrouillés avec la fiche
        assert.ok(subclassChoiceFields(deriveCharacter(philo(5, { school: 'eclectisme' }))).every(f => f.inPlay === false));
        // Avant le niveau 3 : aucun menu
        assert.deepEqual(keys(philo(2)), []);
    });

    test('sans choix, ou choix illisible : aucune école, sans erreur', () => {
        assert.deepEqual(schools(philo(3)), []);
        assert.deepEqual(schools(philo(3, { school: 'platonisme' })), []);
        assert.deepEqual(schools(philo(3, { school: 3 })), []);
        assert.deepEqual(schools(philo(3, ['stoicisme'])), []);
        assert.deepEqual(schools(philo(3, null)), []);
        assert.deepEqual(schools({ ...philo(3), subclass_choices: ['x'] }), []);
        assert.deepEqual(schools({ ...philo(3), subclass_choices: null }), []);
    });

    test('école simple ; seconde école seulement avec l\'Éclectisme et au niveau 5', () => {
        assert.deepEqual(schools(philo(3, { school: 'stoicisme' })), ['stoicisme']);
        assert.deepEqual(schools(philo(4, { school: 'eclectisme', second_school: 'stoicisme' })), ['eclectisme']);
        assert.deepEqual(schools(philo(5, { school: 'eclectisme', second_school: 'stoicisme' })), ['eclectisme', 'stoicisme']);
        // Seconde école enregistrée avec une autre école principale : ignorée (mais gardée dans la fiche)
        const other = philo(5, { school: 'sophisme', second_school: 'stoicisme' });
        assert.deepEqual(schools(other), ['sophisme']);
        assert.deepEqual(subclassChoice(other, { subclass: 'academy_philosopher', level: 5 }), { school: 'sophisme' });
        assert.equal(other.subclass_choices.academy_philosopher.second_school, 'stoicisme');
        // « Éclectisme » comme seconde école : ignoré
        assert.deepEqual(schools(philo(5, { school: 'eclectisme', second_school: 'eclectisme' })), ['eclectisme']);
    });

    test('une autre sous-classe n\'est pas touchée par ces choix', () => {
        const abjurer = { ...philo(5, { school: 'scepticisme' }), char_subclass: 'Abjurateur' };
        const d = deriveCharacter(abjurer);
        assert.deepEqual(philosopherSchools(d), []);
        assert.deepEqual(d.subclassChoices, {});
        assert.equal(subclassChoiceNotes(d, abjurer).armorClass, undefined);
        assert.ok(!counters(abjurer).some(c => SCHOOL_IDS.includes(c.feature)));
    });

    test('setSubclassChoicePatch : enregistre, efface, garde le reste, sans modifier la fiche', () => {
        const c = deepFreeze(philo(5, { school: 'eclectisme', second_school: 'stoicisme' }, {
            subclass_choices: { academy_philosopher: { school: 'eclectisme', second_school: 'stoicisme' }, hunter: { prey: 'horde' } }
        }));
        const cleared = setSubclassChoicePatch(c, 'academy_philosopher', 'second_school', '');
        assert.deepEqual(cleared.subclass_choices, { academy_philosopher: { school: 'eclectisme' }, hunter: { prey: 'horde' } });
        const set = setSubclassChoicePatch(c, 'academy_philosopher', 'school', 'hedonisme');
        assert.deepEqual(set.subclass_choices.academy_philosopher, { school: 'hedonisme', second_school: 'stoicisme' });
        // Valeur ou menu inconnu : rien
        assert.deepEqual(setSubclassChoicePatch(c, 'academy_philosopher', 'school', 'platonisme'), {});
        assert.deepEqual(setSubclassChoicePatch(c, 'academy_philosopher', 'second_school', 'eclectisme'), {});
        assert.deepEqual(setSubclassChoicePatch(c, 'academy_philosopher', 'ecole', 'cynisme'), {});
    });
});

describe('Philosophe : cases des écoles', () => {
    test('sans école : aucune case d\'école ; Principes métaphysiques et Paradoxe magique inchangés', () => {
        const c = philo(14);
        assert.deepEqual(features(c), ['principes_metaphysiques', 'paradoxe_magique']);
        const paradox = counters(c).find(x => x.feature === 'paradoxe_magique');
        assert.deepEqual([paradox.max, paradox.reset], [3, 'long']);
    });

    test('Empirisme, Stoïcisme, Hédonisme : 1 case au repos court ; Cynisme, Sophisme, Scepticisme, Éclectisme : aucune', () => {
        for (const id of ['empirisme', 'stoicisme', 'hedonisme']) {
            const box = counters(philo(3, { school: id })).find(x => x.feature === id);
            assert.deepEqual([box.key, box.max, box.reset], [`academy_philosopher.${id}`, 1, 'short'], id);
        }
        for (const id of ['cynisme', 'sophisme', 'scepticisme', 'eclectisme']) {
            assert.deepEqual(features(philo(3, { school: id })), [], id);
        }
        // Seule l'école choisie : pas les cases des autres
        assert.deepEqual(features(philo(3, { school: 'stoicisme' })), ['stoicisme']);
    });

    test('Épicurisme : modificateur d\'Intelligence ; aucune case s\'il n\'est pas positif', () => {
        const at = (int) => counters(philo(3, { school: 'epicurisme' }, { int_score: int })).find(x => x.feature === 'epicurisme');
        assert.deepEqual([at('16').max, at('16').reset], [3, 'short']);
        assert.equal(at('10'), undefined);
        assert.equal(at('8'), undefined);
        const option = school(philo(3, { school: 'epicurisme' }, { int_score: '10' })).options.find(o => o.id === 'epicurisme');
        assert.match(option.automation.text, /aucune case tant que le modificateur n'est pas positif/);
        const three = school(philo(3, { school: 'epicurisme' })).options.find(o => o.id === 'epicurisme');
        assert.match(three.automation.text, /3 cases dans l'onglet Combat, rendues au repos court ou long/);
    });

    test('Hédonisme : +2 × niveau de Magicien dans le texte d\'usage', () => {
        const use = (level) => counters(philo(level, { school: 'hedonisme' })).find(x => x.feature === 'hedonisme').use;
        assert.match(use(3), /\+6 PV/);
        assert.match(use(4), /\+8 PV/);
        assert.match(use(20), /\+40 PV/);
    });

    test('Éclectisme + Stoïcisme : la case n\'apparaît qu\'au niveau 5', () => {
        const choices = { school: 'eclectisme', second_school: 'stoicisme' };
        assert.ok(!features(philo(4, choices)).includes('stoicisme'));
        assert.ok(features(philo(5, choices)).includes('stoicisme'));
        // École principale autre que l'Éclectisme : la seconde est ignorée
        assert.deepEqual(features(philo(5, { school: 'cynisme', second_school: 'stoicisme' })), []);
    });

    test('changer d\'école : l\'ancienne valeur reste sans être montrée, et le repos suivant la vide', () => {
        const c = philo(3, { school: 'hedonisme' }, { subclass_uses: { 'academy_philosopher.stoicisme': 1 } });
        assert.ok(!features(c).includes('stoicisme'));
        assert.equal(c.subclass_uses['academy_philosopher.stoicisme'], 1);
        const { patch, restored } = restSubclassUses(c, deriveCharacter(c), 'short');
        assert.equal(patch.subclass_uses['academy_philosopher.stoicisme'], 0);
        // Pas annoncée : l'école n'est plus choisie
        assert.ok(!restored.some(r => r.featId === 'stoicisme'));
    });

    test('le repos court vide les 4 cases d\'école ; la fin de la Rage aucune', () => {
        const used = {
            'academy_philosopher.empirisme': 1, 'academy_philosopher.epicurisme': 2,
            'academy_philosopher.stoicisme': 1, 'academy_philosopher.hedonisme': 1
        };
        for (const id of ['empirisme', 'epicurisme', 'stoicisme', 'hedonisme']) {
            const c = philo(3, { school: id }, { subclass_uses: used });
            const d = deriveCharacter(c);
            const short = restSubclassUses(c, d, 'short');
            assert.equal(short.patch.subclass_uses[`academy_philosopher.${id}`], 0, id);
            assert.ok(short.restored.some(r => r.featId === id), id);
            assert.deepEqual(restSubclassUses(c, d, 'rage').patch, {}, id);
        }
    });
});

describe('Philosophe : repères et sorts', () => {
    test('sans école : aucun repère, pas d\'Amis', () => {
        const zones = notes(philo(5));
        assert.equal(zones['skills.perception'], undefined);
        assert.equal(zones['skills.persuasion'], undefined);
        assert.equal(zones.armorClass, undefined);
        assert.deepEqual(subclassSpells(deriveCharacter(philo(5))).reached, []);
    });

    test('Empirisme : repère « à cocher » sur Perception tant que la maîtrise n\'est pas cochée', () => {
        const note = (extra) => notes(philo(3, { school: 'empirisme' }, extra))['skills.perception'];
        assert.equal(note()?.[0].check, true);
        assert.equal(note()?.[0].classFeature, true);
        assert.equal(note({ skill_prof_perception: true }), undefined);
        assert.equal(note({ skill_exp_perception: true }), undefined);
    });

    test('Sophisme : repère d\'Expertise en Persuasion (+2 × maîtrise) tant que la case Expertise n\'est pas cochée', () => {
        const note = (extra) => notes(philo(3, { school: 'sophisme' }, extra))['skills.persuasion'];
        assert.equal(note()?.[0].check, true);
        assert.match(note()[0].text, /\+4 au lieu de \+2/);
        assert.match(note({ skill_prof_persuasion: true })[0].text, /case Expertise à cocher/);
        assert.equal(note({ skill_prof_persuasion: true, skill_exp_persuasion: true }), undefined);
        // Le calcul de Persuasion ne change pas
        const plain = deriveCharacter(philo(3)).skills.persuasion;
        assert.deepEqual(deriveCharacter(philo(3, { school: 'sophisme' })).skills.persuasion, plain);
    });

    test('Sophisme : Amis dans les sorts de sous-classe au niveau 3, pas pour une autre école', () => {
        const reached = subclassSpells(deriveCharacter(philo(3, { school: 'sophisme' }))).reached;
        assert.deepEqual(reached.map(s => [s.vo, s.name, s.level, s.group]), [['Friends', 'Amis', 0, 'Sophisme']]);
        assert.deepEqual(subclassSpells(deriveCharacter(philo(3, { school: 'stoicisme' }))).reached, []);
        // Seconde école de l'Éclectisme
        assert.equal(subclassSpells(deriveCharacter(philo(5, { school: 'eclectisme', second_school: 'sophisme' }))).reached.length, 1);
        assert.equal(subclassSpells(deriveCharacter(philo(4, { school: 'eclectisme', second_school: 'sophisme' }))).reached.length, 0);
    });

    test('Scepticisme : repère permanent près de la CA', () => {
        const ac = notes(philo(3, { school: 'scepticisme' })).armorClass;
        assert.equal(ac.length, 1);
        assert.equal(ac[0].mention, 'Avantage contre sorts');
        assert.equal(ac[0].inactive, undefined);
    });
});

describe('Philosophe : bloc « Sous-classe »', () => {
    test('sans école : les 8 écoles lisibles, aucune marquée, aucun « Dans la fiche »', () => {
        const feature = school(philo(3));
        assert.equal(feature.options.length, 8);
        assert.ok(feature.options.every(o => !o.chosen && o.automation === null));
        assert.match(feature.automation.text, /École à choisir/);
    });

    test('école choisie : marquée, avec son « Dans la fiche » ; les autres sans', () => {
        const feature = school(philo(3, { school: 'stoicisme' }));
        const chosen = feature.options.filter(o => o.chosen);
        assert.deepEqual(chosen.map(o => o.id), ['stoicisme']);
        assert.match(chosen[0].automation.text, /1 case dans l'onglet Combat/);
        assert.ok(feature.options.filter(o => !o.chosen).every(o => o.automation === null));
        assert.match(feature.automation.text, /École choisie : Stoïcisme/);
    });

    test('Éclectisme : seconde école marquée au niveau 5, rappel du niveau 5 avant', () => {
        const before = school(philo(4, { school: 'eclectisme', second_school: 'hedonisme' }));
        assert.deepEqual(before.options.filter(o => o.chosen).map(o => o.id), ['eclectisme']);
        assert.match(before.automation.text, /au niveau 5/);
        assert.match(before.options.find(o => o.id === 'eclectisme').automation.text, /Seconde école au niveau 5/);
        const after = school(philo(5, { school: 'eclectisme', second_school: 'hedonisme' }));
        assert.deepEqual(after.options.filter(o => o.chosen).map(o => [o.id, o.second === true]), [['eclectisme', false], ['hedonisme', true]]);
        assert.match(after.automation.text, /Hédonisme comme seconde école/);
        assert.match(after.options.find(o => o.id === 'hedonisme').automation.text, /\+10 PV/);
        const waiting = school(philo(5, { school: 'eclectisme' }));
        assert.match(waiting.automation.text, /second menu/);
    });

    test('textes chiffrés : Cynisme, Sophisme', () => {
        assert.match(school(philo(3, { school: 'cynisme' })).options.find(o => o.id === 'cynisme').automation.text, /1 h et 25 po par niveau/);
        assert.match(school(philo(5, { school: 'sophisme' })).options.find(o => o.id === 'sophisme').automation.text, /\+6/);
    });

    test('« Dans la fiche » défini pour chaque école et pour la capacité', () => {
        for (const id of ['ecole_philosophique', ...SCHOOL_IDS]) assert.ok(SUBCLASS_AUTOMATION.academy_philosopher[id], id);
    });
});
