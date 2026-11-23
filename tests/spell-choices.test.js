/**
 * TESTS — SORTS CHOISIS D'UNE CAPACITÉ (js/rules/spell-choices.js, js/data/spell-choices.js)
 * Maîtrise des sorts et Sorts de prédilection du Magicien (niveaux 18 et 20), Découvertes magiques
 * du Barde du Collège du Savoir (niveau 6) : menus, sorts toujours préparés hors du compte, lancers
 * sans emplacement, rappels de fin de repos.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SPELL_CHOICE_FEATURES } from '../js/data/spell-choices.js';
import {
    spellChoiceFeatures, chosenSpells, chosenSpellKeys, setSpellChoicePatch, isActionCastTime,
    spellChoiceOptions, spellChoiceView
} from '../js/rules/spell-choices.js';
import { grantedSpellKeys, givenSpellKeys, spellPrepState, highestSlotLevel, wholeListSource, fitsWholeList } from '../js/rules/spell-preparation.js';
import { spellbookCount } from '../js/rules/spellbook.js';
import { spellCounts, spellNameKey, findSpellByName } from '../js/rules/spells.js';
import { allFreeCasts, freeCastsFor, useFreeCastPatch } from '../js/rules/free-casts.js';
import { CLASS_COUNTERS, subclassCounters, restSubclassUses } from '../js/rules/subclass-uses.js';
import { classProgression } from '../js/rules/class-progression.js';
import { subclassFeatures } from '../js/rules/subclass-features.js';
import { planShortRest, planLongRest } from '../js/rules/rest.js';
import { V4_ONLY_KEYS, fingerprint } from '../js/cloud/sync.js';
import { createStore } from '../js/state/store.js';
import { deriveCharacter } from '../js/rules/character.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const base = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
const db = Array.isArray(base) ? base : Object.values(base);

function deepFreeze(value) {
    if (value && typeof value === 'object') {
        Object.freeze(value);
        for (const inner of Object.values(value)) deepFreeze(inner);
    }
    return value;
}

const mk = (extra) => deepFreeze({ ...createDefaultCharacter(), ...extra });
const derive = (c) => deriveCharacter(c);
const row = (name, lvl, time = 'Action', extra = {}) => ({ name, lvl: String(lvl), time, ...extra });

/** Grimoire d'un Magicien : sorts de niveaux 1 à 3, en une action ou non */
const BOOK = [
    row('Bouclier', 1, 'Réaction'), row('Projectile magique', 1), row('Armure du mage', 1), row('Détection de la magie', 1, 'Action ou Rituel'),
    row('Foulée brumeuse', 2, 'Action bonus'), row('Invisibilité', 2),
    row('Boule de feu', 3), row('Contresort', 3, 'Réaction'), row('Éclair', 3),
    row('Illusion mineure', 0)
];
const wizard = (level, extra = {}) => mk({ char_class: 'Magicien', char_level: String(level), int_score: '18', dynamic_spells: BOOK, ...extra });
const lore = (level, extra = {}) => mk({ char_class: 'Barde', char_subclass: 'Collège du Savoir', char_level: String(level), cha_score: '16', ...extra });

const feature = (id) => SPELL_CHOICE_FEATURES.find(entry => entry.id === id);
const field = (id, key) => feature(id).fields.find(entry => entry.key === key);
const values = (options) => options.map(option => option.value);

describe('Sorts choisis : capacités et données', () => {
    test('Magicien : Maîtrise des sorts au niveau 18, Sorts de prédilection au niveau 20', () => {
        const ids = (c) => spellChoiceFeatures(derive(c)).map(entry => entry.id);
        assert.deepEqual(ids(wizard(17)), []);
        assert.deepEqual(ids(wizard(18)), ['maitrise_des_sorts']);
        assert.deepEqual(ids(wizard(19)), ['maitrise_des_sorts']);
        assert.deepEqual(ids(wizard(20)), ['maitrise_des_sorts', 'sorts_de_predilection']);
    });

    test('Barde : Découvertes magiques au niveau 6, seulement au Collège du Savoir', () => {
        const ids = (c) => spellChoiceFeatures(derive(c)).map(entry => entry.id);
        assert.deepEqual(ids(lore(5)), []);
        assert.deepEqual(ids(lore(6)), ['decouvertes_magiques']);
        assert.deepEqual(ids(lore(20)), ['decouvertes_magiques']);
        assert.deepEqual(ids(mk({ char_class: 'Barde', char_subclass: 'Collège de la Vaillance', char_level: '10' })), []);
        assert.deepEqual(ids(mk({ char_class: 'Barde', char_level: '10' })), []);
    });

    test('Autres classes, fiche vide, valeurs absentes : aucune capacité', () => {
        assert.deepEqual(spellChoiceFeatures(derive(mk({ char_class: 'Guerrier', char_level: '20' }))), []);
        assert.deepEqual(spellChoiceFeatures(derive(mk({}))), []);
        assert.deepEqual(spellChoiceFeatures(), []);
        assert.deepEqual(spellChoiceFeatures(null), []);
    });

    test('Noms et niveaux : ceux de la table de la classe et des capacités de la sous-classe', () => {
        const reached = classProgression('wizard', 20).reached;
        for (const id of ['maitrise_des_sorts', 'sorts_de_predilection']) {
            const known = reached.find(entry => entry.name === feature(id).name);
            assert.ok(known, feature(id).name);
            assert.equal(known.level, feature(id).level);
        }
        const discoveries = subclassFeatures(derive(lore(6))).reached.find(entry => entry.id === 'decouvertes_magiques');
        assert.equal(discoveries.name, feature('decouvertes_magiques').name);
        assert.equal(discoveries.level, feature('decouvertes_magiques').level);
        // La fiche dit ce qu'elle fait de la capacité, sous son texte (onglet Aptitudes & Traits)
        assert.match(discoveries.automation.text, /grimoire/);
    });

    test('Chaque capacité : une phrase qui dit à quoi elle sert, des menus aux clés uniques', () => {
        const keys = SPELL_CHOICE_FEATURES.flatMap(entry => entry.fields.map(menu => menu.key));
        assert.equal(new Set(keys).size, keys.length);
        for (const entry of SPELL_CHOICE_FEATURES) {
            assert.ok(entry.intro.length > 60 && /[.]$/.test(entry.intro), entry.id);
            assert.equal(entry.fields.length, 2, entry.id);
            assert.ok(['book', 'lists'].includes(entry.from), entry.id);
            if (entry.from === 'book') for (const menu of entry.fields) assert.ok(menu.spellLevel >= 1, menu.key);
        }
    });

    test('Cases des Sorts de prédilection : celles de la classe (CLASS_COUNTERS), repos court', () => {
        for (const menu of feature('sorts_de_predilection').fields) {
            const [slug, id] = menu.uses.split('.');
            const counter = CLASS_COUNTERS[slug].find(entry => entry.feature === id);
            assert.ok(counter, menu.uses);
            assert.equal(counter.reset, 'short');
            assert.equal(counter.level, 20);
        }
    });

    test('Le choix est rangé dans une clé facultative existante, ignorée par l\'ancien site', () => {
        assert.ok(V4_ONLY_KEYS.includes('subclass_choices'));
        assert.equal(Object.hasOwn(createDefaultCharacter(), 'subclass_choices'), false);
    });
});

describe('Sorts choisis : enregistrer un choix (setSpellChoicePatch)', () => {
    test('Premier choix : la clé est écrite, sous « wizard » pour le Magicien', () => {
        const c = wizard(18);
        assert.equal(Object.hasOwn(c, 'subclass_choices'), false);
        assert.deepEqual(setSpellChoicePatch(c, derive(c), 'mastery1', 'Magic Missile'),
            { subclass_choices: { wizard: { mastery1: 'Magic Missile' } } });
    });

    test('Les autres choix (autre menu, sous-classe) sont gardés', () => {
        const c = wizard(20, { subclass_choices: { wizard: { mastery1: 'Magic Missile' }, evoker: { autre: 'x' } } });
        assert.deepEqual(setSpellChoicePatch(c, derive(c), 'signature2', 'Fireball'),
            { subclass_choices: { wizard: { mastery1: 'Magic Missile', signature2: 'Fireball' }, evoker: { autre: 'x' } } });
    });

    test('Collège du Savoir : sous la clé de la sous-classe, à côté de ses autres choix', () => {
        const c = lore(6, { subclass_choices: { college_of_lore: { autre: 'x' } } });
        assert.deepEqual(setSpellChoicePatch(c, derive(c), 'discovery1', 'Guidance'),
            { subclass_choices: { college_of_lore: { autre: 'x', discovery1: 'Guidance' } } });
    });

    test('Choix effacé : la valeur est retirée, le groupe vide aussi, et la clé s\'il ne reste plus rien', () => {
        const two = wizard(18, { subclass_choices: { wizard: { mastery1: 'Magic Missile', mastery2: 'Invisibility' } } });
        assert.deepEqual(setSpellChoicePatch(two, derive(two), 'mastery1', ''), { subclass_choices: { wizard: { mastery2: 'Invisibility' } } });
        // Dernier choix de la fiche : la clé est retirée (undefined), jamais laissée en objet vide
        const one = wizard(18, { subclass_choices: { wizard: { mastery1: 'Magic Missile' } } });
        const last = setSpellChoicePatch(one, derive(one), 'mastery1', '');
        assert.deepEqual(Object.keys(last), ['subclass_choices']);
        assert.equal(last.subclass_choices, undefined);
        // Un autre groupe a encore des choix (sous-classe) : seul le groupe vide part
        const other = wizard(18, { subclass_choices: { wizard: { mastery1: 'Magic Missile' }, evoker: { autre: 'x' } } });
        assert.deepEqual(setSpellChoicePatch(other, derive(other), 'mastery1', ''), { subclass_choices: { evoker: { autre: 'x' } } });
        // Le groupe garde un autre choix que les sorts (Collège du Savoir) : il reste
        const bard = lore(6, { subclass_choices: { college_of_lore: { autre: 'x', discovery1: 'Guidance' } } });
        assert.deepEqual(setSpellChoicePatch(bard, derive(bard), 'discovery1', ''), { subclass_choices: { college_of_lore: { autre: 'x' } } });
    });

    test('Choisir un sort puis revenir sur « Choisir » : la fiche redevient exactement celle d\'avant', () => {
        for (const [start, key, value] of [[lore(6), 'discovery1', 'Guidance'], [wizard(18), 'mastery1', 'Magic Missile'], [wizard(20), 'signature2', 'Fireball']]) {
            const store = createStore(start);
            const before = JSON.stringify(store.get());
            const print = fingerprint(store.get());
            store.update(setSpellChoicePatch(store.get(), derive(store.get()), key, value));
            assert.notEqual(JSON.stringify(store.get()), before);
            assert.notEqual(fingerprint(store.get()), print);
            store.update(setSpellChoicePatch(store.get(), derive(store.get()), key, ''));
            // Ce qui est enregistré (JSON) et l'empreinte de la synchronisation : comme avant le choix
            assert.equal(JSON.stringify(store.get()), before);
            assert.equal(fingerprint(store.get()), print);
            assert.equal(JSON.parse(JSON.stringify(store.get())).subclass_choices, undefined);
            // La clé retirée se lit comme une clé absente : aucun sort choisi, mêmes sorts donnés
            assert.deepEqual(chosenSpells(store.get(), derive(store.get()), db), []);
            assert.deepEqual(grantedSpellKeys(store.get(), derive(store.get()), db), grantedSpellKeys(start, derive(start), db));
            // Effacer de nouveau : rien à faire
            assert.deepEqual(setSpellChoicePatch(store.get(), derive(store.get()), key, ''), {});
        }
    });

    test('Rien ne change : patch vide (même valeur, effacer un choix absent)', () => {
        const c = wizard(18, { subclass_choices: { wizard: { mastery1: 'Magic Missile' } } });
        assert.deepEqual(setSpellChoicePatch(c, derive(c), 'mastery1', 'Magic Missile'), {});
        assert.deepEqual(setSpellChoicePatch(c, derive(c), 'mastery2', ''), {});
        assert.deepEqual(setSpellChoicePatch(wizard(18), derive(wizard(18)), 'mastery2', '   '), {});
    });

    test('Menu inconnu ou capacité pas encore atteinte : patch vide', () => {
        const c = wizard(18);
        assert.deepEqual(setSpellChoicePatch(c, derive(c), 'signature1', 'Fireball'), {});
        assert.deepEqual(setSpellChoicePatch(c, derive(c), 'discovery1', 'Guidance'), {});
        assert.deepEqual(setSpellChoicePatch(c, derive(c), 'toString', 'x'), {});
        assert.deepEqual(setSpellChoicePatch(wizard(17), derive(wizard(17)), 'mastery1', 'Magic Missile'), {});
        assert.deepEqual(setSpellChoicePatch(lore(5), derive(lore(5)), 'discovery1', 'Guidance'), {});
    });

    test('Nom nettoyé : texte simple, espaces réduits, 80 caractères au plus', () => {
        const c = wizard(18);
        assert.deepEqual(setSpellChoicePatch(c, derive(c), 'mastery1', '  <b>Sort   maison</b> '), { subclass_choices: { wizard: { mastery1: 'Sort maison' } } });
        const long = setSpellChoicePatch(c, derive(c), 'mastery1', 'x'.repeat(200)).subclass_choices.wizard.mastery1;
        assert.equal(long.length, 80);
        assert.deepEqual(setSpellChoicePatch(c, derive(c), 'mastery1', { name: 'x' }), {});
    });

    test('Clé abîmée (tableau, texte) : traitée comme absente', () => {
        for (const broken of [[], 'x', 3, null, { wizard: 'x' }, { wizard: ['a'] }]) {
            const c = wizard(18, { subclass_choices: broken });
            assert.deepEqual(chosenSpells(c, derive(c), db), []);
            assert.equal(setSpellChoicePatch(c, derive(c), 'mastery1', 'Shield').subclass_choices.wizard.mastery1, 'Shield');
        }
    });
});

describe('Sorts choisis : temps d\'incantation d\'une action (Maîtrise des sorts)', () => {
    test('Action, « Action ou Rituel », « 1 action » : oui', () => {
        for (const time of ['Action', 'action', 'Action ou Rituel', '1 action', 'Une action', 'Action (embroussaillement) ou 8 heures (fertilisation)']) {
            assert.equal(isActionCastTime(time), true, time);
        }
    });

    test('Action bonus, Réaction, minutes, heures : non', () => {
        for (const time of ['Action bonus', '1 action bonus', 'Réaction', '1 minute', '10 minutes ou Rituel', '1 heure', 'Bonus']) {
            assert.equal(isActionCastTime(time), false, time);
        }
    });

    test('Temps vide (sort noté à la main) : on fait confiance au joueur', () => {
        assert.equal(isActionCastTime(''), true);
        assert.equal(isActionCastTime(undefined), true);
    });

    test('Tous les temps d\'incantation de la base de sorts sont reconnus', () => {
        for (const time of new Set(db.map(spell => spell.castTime))) {
            assert.equal(isActionCastTime(time), /^Action(?! bonus)/.test(time), time);
        }
    });
});

describe('Sorts choisis : menus du Magicien (sorts de son grimoire)', () => {
    const mastery = feature('maitrise_des_sorts');
    const signature = feature('sorts_de_predilection');
    const options = (entry, key, context = {}) => spellChoiceOptions(entry, field(entry.id, key), { db, rows: BOOK, ...context });

    test('Maîtrise des sorts : sorts du grimoire du bon niveau, lancés en une action', () => {
        assert.deepEqual(options(mastery, 'mastery1').map(option => [option.value, option.label]), [
            ['Mage Armor', 'Armure du mage'], ['Detect Magic', 'Détection de la magie'], ['Magic Missile', 'Projectile magique']
        ]);
        // Bouclier (Réaction) et Foulée brumeuse (Action bonus) ne sont pas proposés
        assert.deepEqual(values(options(mastery, 'mastery2')), ['Invisibility']);
    });

    test('Sorts de prédilection : tout sort de niveau 3 du grimoire, quel que soit son temps', () => {
        assert.deepEqual(values(options(signature, 'signature1')), ['Fireball', 'Counterspell', 'Lightning Bolt']);
        assert.deepEqual(options(signature, 'signature1').map(option => option.group), ['Niveau 3', 'Niveau 3', 'Niveau 3']);
    });

    test('La valeur est le nom anglais, même si la ligne porte un ancien nom ou le nom anglais', () => {
        const rows = [row('Armure de mage', 1), row('magic missile', 1), row('  PROJECTILE MAGIQUE ', 1)];
        assert.deepEqual(options(mastery, 'mastery1', { rows }).map(option => [option.value, option.label]),
            [['Mage Armor', 'Armure du mage'], ['Magic Missile', 'Projectile magique']]);
    });

    test('Sort noté à la main, inconnu de la base : proposé sous le nom noté, selon sa colonne « Temps »', () => {
        const rows = [row('Sort maison', 1, 'Action'), row('Parade maison', 1, 'Réaction'), row('Sans temps', 1, ''), row('<i>Sort en italique</i>', 1, 'Action')];
        assert.deepEqual(values(options(mastery, 'mastery1', { rows })), ['Sans temps', 'Sort en italique', 'Sort maison']);
    });

    test('Sort connu de la base : son temps d\'incantation est celui de la base, pas celui de la ligne', () => {
        const rows = [row('Bouclier', 1, 'Action'), row('Projectile magique', 1, 'Réaction')];
        assert.deepEqual(values(options(mastery, 'mastery1', { rows })), ['Magic Missile']);
    });

    test('Sort noté à un autre niveau que celui du manuel : pas proposé', () => {
        const rows = [row('Boule de feu', 1), row('Projectile magique', 3), row('Projectile magique', 1)];
        assert.deepEqual(values(options(mastery, 'mastery1', { rows })), ['Magic Missile']);
        assert.deepEqual(values(options(signature, 'signature1', { rows })), []);
    });

    test('Sort que la base connaît hors de la liste du Magicien : pas dans le livre, pas proposé', () => {
        // Lueurs féeriques (Barde, Druide), Soins, Bénédiction, Lumière du jour : notés au tableau quand même
        const rows = [row('Lueurs féeriques', 1), row('Soins', 1), row('Bénédiction', 1), row('Projectile magique', 1),
            row('Lumière du jour', 3), row('Boule de feu', 3), row('Faerie Fire', 1)];
        assert.deepEqual(values(options(mastery, 'mastery1', { rows })), ['Magic Missile']);
        assert.deepEqual(values(options(signature, 'signature1', { rows })), ['Fireball']);
        // Sort inconnu de la base : on fait confiance au joueur
        assert.deepEqual(values(options(mastery, 'mastery1', { rows: [row('Sort maison', 1)] })), ['Sort maison']);
        // Tous les sorts de Magicien de la base restent proposables
        const wizardSpells = db.filter(spell => spell.level === 3 && spell.classes.includes('wizard'));
        assert.equal(options(signature, 'signature1', { rows: wizardSpells.map(spell => row(spell.name, 3)) }).length, wizardSpells.length);
    });

    test('Sort donné par la sous-classe, un don ou l\'espèce (given) : pas dans le livre, pas proposé', () => {
        // Ténèbres (sort de Magicien de niveau 2, une action) donné par l'espèce ; Sommeil par un don
        const rows = [row('Ténèbres', 2), row('Invisibilité', 2), row('Sommeil', 1), row('Projectile magique', 1), row('Sort maison', 1)];
        const given = new Set(['Ténèbres', 'Sleep', 'Sort maison'].map(spellNameKey));
        assert.deepEqual(values(options(mastery, 'mastery2', { rows })), ['Invisibility', 'Darkness']);
        assert.deepEqual(values(options(mastery, 'mastery2', { rows, given })), ['Invisibility']);
        // Reconnu par le nom français comme par le nom anglais, et par le nom noté d'un sort inconnu de la base
        assert.deepEqual(values(options(mastery, 'mastery1', { rows, given })), ['Magic Missile']);
        assert.deepEqual(values(options(mastery, 'mastery2', { rows: [row('Darkness', 2)], given })), []);
        // Liste vide ou valeur abîmée : rien n'est écarté
        for (const none of [null, undefined, new Set(), [], 'x']) {
            assert.deepEqual(values(options(mastery, 'mastery2', { rows, given: none })), ['Invisibility', 'Darkness']);
        }
        // Déjà choisi avant (ancienne sauvegarde) : gardé en tête du menu, pour rester lisible et modifiable
        const [stale, ...rest] = options(mastery, 'mastery2', { rows, given, current: 'Darkness' });
        assert.deepEqual([stale.value, stale.label, stale.stale, stale.selected], ['Darkness', 'Ténèbres', true, true]);
        assert.deepEqual(values(rest), ['Invisibility']);
    });

    test('Découvertes magiques : la liste des sorts donnés ne retire rien (ces sorts ne viennent pas du livre)', () => {
        const discoveries = feature('decouvertes_magiques');
        const menu = (context) => spellChoiceOptions(discoveries, field(discoveries.id, 'discovery1'), { db, maxLevel: 3, ...context });
        assert.deepEqual(menu({ given: new Set(['Bless', 'Fireball'].map(spellNameKey)) }), menu({}));
    });

    test('Lignes vides, abîmées, sorts mineurs : ignorés', () => {
        const rows = [null, 'x', {}, row('', 1), row('Illusion mineure', 0), row('Projectile magique', 1)];
        assert.deepEqual(values(options(mastery, 'mastery1', { rows })), ['Magic Missile']);
        assert.deepEqual(options(mastery, 'mastery1', { rows: null }), []);
        assert.deepEqual(options(mastery, 'mastery1', { rows: 'x' }), []);
    });

    test('Sort choisi : option marquée ; sort pris par l\'autre menu : grisé', () => {
        const first = options(signature, 'signature1', { current: 'Fireball', taken: ['Counterspell'] });
        assert.deepEqual(first.map(option => [option.value, option.selected, option.disabled]),
            [['Fireball', true, false], ['Counterspell', false, true], ['Lightning Bolt', false, false]]);
        // Valeur enregistrée sous le nom français : la même option est marquée
        assert.equal(options(signature, 'signature1', { current: 'Boule de feu' }).find(option => option.selected).value, 'Fireball');
    });

    test('Sort choisi qui n\'est plus au grimoire : gardé en tête du menu, pour rester lisible', () => {
        const [stale, ...rest] = options(mastery, 'mastery1', { current: 'Sleep' });
        assert.deepEqual(stale, { value: 'Sleep', label: 'Sommeil', group: '', disabled: false, selected: true, stale: true });
        assert.equal(rest.length, 3);
        assert.equal(rest.some(option => option.selected), false);
        // Sort choisi qui n'est plus lancé en une action (ligne corrigée) : même chose
        assert.equal(options(mastery, 'mastery1', { current: 'Shield' })[0].stale, true);
    });

    test('Base de sorts pas encore chargée : les noms notés au grimoire, et le choix enregistré en tête', () => {
        const without = spellChoiceOptions(mastery, field(mastery.id, 'mastery1'), { db: null, rows: BOOK, current: 'Magic Missile' });
        // Bouclier : sa colonne « Temps » dit Réaction
        assert.deepEqual(values(without), ['Magic Missile', 'Armure du mage', 'Détection de la magie', 'Projectile magique']);
        assert.equal(without[0].stale, true);
        assert.deepEqual(values(spellChoiceOptions(mastery, field(mastery.id, 'mastery1'), { db: [], rows: BOOK })),
            ['Armure du mage', 'Détection de la magie', 'Projectile magique']);
    });
});

describe('Sorts choisis : menus des Découvertes magiques (listes du Clerc, du Druide et du Magicien)', () => {
    const discoveries = feature('decouvertes_magiques');
    const options = (context = {}) => spellChoiceOptions(discoveries, field(discoveries.id, 'discovery1'), { db, ...context });
    const onLists = (spell) => ['cleric', 'druid', 'wizard'].some(slug => spell.classes.includes(slug));

    test('Sorts mineurs et sorts d\'un niveau pour lequel le Barde a des emplacements', () => {
        const list = options({ maxLevel: 3 });
        const expected = db.filter(spell => onLists(spell) && spell.level <= 3);
        assert.equal(list.length, expected.length);
        assert.deepEqual(new Set(values(list)), new Set(expected.map(spell => spell.vo)));
        assert.deepEqual([...new Set(list.map(option => option.group))], ['Sorts mineurs', 'Niveau 1', 'Niveau 2', 'Niveau 3']);
        assert.ok(values(list).includes('Guidance'));
        assert.ok(values(list).includes('Fireball'));
        assert.equal(values(list).includes('Wish'), false);
    });

    test('Sorts des autres listes seulement (Barde, Occultiste, Rôdeur) : pas proposés', () => {
        const list = values(options({ maxLevel: 9 }));
        for (const vo of ['Vicious Mockery', 'Eldritch Blast', "Hunter's Mark"]) assert.equal(list.includes(vo), false, vo);
        assert.ok(list.includes('Wish'));
        assert.equal(list.length, db.filter(onLists).length);
    });

    test('Rangés par niveau, puis par nom français (accents compris)', () => {
        const list = options({ maxLevel: 2 });
        const levels = list.map(option => findSpellByName(db, option.value).level);
        assert.deepEqual(levels, [...levels].sort((a, b) => a - b));
        const cantrips = list.filter(option => option.group === 'Sorts mineurs').map(option => option.label);
        assert.deepEqual(cantrips, [...cantrips].sort(new Intl.Collator('fr').compare));
    });

    test('Niveau du Barde : les emplacements de sa table (niveau 3 au niveau 6, niveau 4 au niveau 7)', () => {
        assert.equal(highestSlotLevel(derive(lore(6)).spellSlots), 3);
        assert.equal(highestSlotLevel(derive(lore(7)).spellSlots), 4);
        // Aucun emplacement connu : seulement les sorts mineurs
        assert.deepEqual([...new Set(options({ maxLevel: 0 }).map(option => option.group))], ['Sorts mineurs']);
        assert.deepEqual([...new Set(options({ maxLevel: 'x' }).map(option => option.group))], ['Sorts mineurs']);
    });

    test('Sort pris par l\'autre menu : grisé ; sort choisi : marqué', () => {
        const list = options({ maxLevel: 3, current: 'Bless', taken: ['Guidance'] });
        assert.equal(list.find(option => option.value === 'Guidance').disabled, true);
        assert.deepEqual(list.filter(option => option.selected).map(option => option.value), ['Bless']);
        assert.equal(list.filter(option => option.disabled).length, 1);
    });

    test('Sort choisi au-dessus des emplacements, ou d\'une autre liste : gardé en tête du menu', () => {
        assert.deepEqual(options({ maxLevel: 3, current: 'Wish' })[0],
            { value: 'Wish', label: 'Souhait', group: '', disabled: false, selected: true, stale: true });
        assert.equal(options({ maxLevel: 3, current: 'Vicious Mockery' })[0].stale, true);
    });

    test('Base de sorts pas encore chargée : aucun sort à proposer, le choix enregistré reste', () => {
        assert.deepEqual(spellChoiceOptions(discoveries, field(discoveries.id, 'discovery1'), { db: null, maxLevel: 3 }), []);
        assert.deepEqual(values(spellChoiceOptions(discoveries, field(discoveries.id, 'discovery1'), { db: [], maxLevel: 3, current: 'Bless' })), ['Bless']);
    });

    test('La liste d\'un même niveau est calculée une seule fois par base de sorts', () => {
        const a = options({ maxLevel: 3 });
        const b = options({ maxLevel: 3 });
        assert.deepEqual(a, b);
        assert.notEqual(a, b);
        // Les options sont des copies : les modifier ne touche pas la liste gardée
        a[0].label = 'x';
        assert.notEqual(options({ maxLevel: 3 })[0].label, 'x');
    });
});

describe('Sorts choisis : lecture de la fiche (chosenSpells, chosenSpellKeys)', () => {
    test('Avec la base : nom français, nom anglais, niveau, tous les noms comparables', () => {
        const c = wizard(20, { subclass_choices: { wizard: { mastery1: 'Mage Armor', signature2: 'Fireball' } } });
        const list = chosenSpells(c, derive(c), db);
        assert.deepEqual(list.map(spell => [spell.featureId, spell.key, spell.name, spell.vo, spell.level, spell.cast, spell.atLevel, spell.uses]), [
            ['maitrise_des_sorts', 'mastery1', 'Armure du mage', 'Mage Armor', 1, 'atwill', 1, null],
            ['sorts_de_predilection', 'signature2', 'Boule de feu', 'Fireball', 3, 'uses', 3, 'wizard.sort_de_predilection_2']
        ]);
        assert.deepEqual(list[0].keys, ['Mage Armor', 'Armure du mage', 'Armure de mage'].map(spellNameKey));
        assert.equal(list[0].spell.vo, 'Mage Armor');
    });

    test('Sans la base : le nom enregistré tel quel ; niveau du menu (Magicien) ou inconnu (Barde)', () => {
        const w = wizard(18, { subclass_choices: { wizard: { mastery2: 'Invisibility' } } });
        const [mastery] = chosenSpells(w, derive(w));
        assert.deepEqual([mastery.name, mastery.vo, mastery.level, mastery.spell, mastery.keys], ['Invisibility', 'Invisibility', 2, null, [spellNameKey('Invisibility')]]);
        const b = lore(6, { subclass_choices: { college_of_lore: { discovery1: 'Guidance' } } });
        const [discovery] = chosenSpells(b, derive(b));
        assert.deepEqual([discovery.name, discovery.level, discovery.cast, discovery.atLevel, discovery.uses], ['Guidance', null, null, null, null]);
        assert.equal(chosenSpells(b, derive(b), db)[0].level, 0);
        assert.equal(chosenSpells(b, derive(b), db)[0].name, 'Assistance');
    });

    test('Le même sort choisi dans deux menus ne compte qu\'une fois (nom français ou anglais)', () => {
        const c = wizard(20, { subclass_choices: { wizard: { signature1: 'Fireball', signature2: 'Boule de feu' } } });
        assert.deepEqual(chosenSpells(c, derive(c), db).map(spell => spell.key), ['signature1']);
        const same = wizard(20, { subclass_choices: { wizard: { signature1: 'Fireball', signature2: ' FIREBALL ' } } });
        assert.deepEqual(chosenSpells(same, derive(same)).map(spell => spell.key), ['signature1']);
    });

    test('Capacité pas encore atteinte, autre classe, autre sous-classe : le choix enregistré est ignoré, pas effacé', () => {
        const choices = { wizard: { mastery1: 'Mage Armor', signature1: 'Fireball' }, college_of_lore: { discovery1: 'Guidance' } };
        const low = wizard(17, { subclass_choices: choices });
        assert.deepEqual(chosenSpells(low, derive(low), db), []);
        const mid = wizard(18, { subclass_choices: choices });
        assert.deepEqual(chosenSpells(mid, derive(mid), db).map(spell => spell.key), ['mastery1']);
        const valor = mk({ char_class: 'Barde', char_subclass: 'Collège de la Vaillance', char_level: '10', subclass_choices: choices });
        assert.deepEqual(chosenSpells(valor, derive(valor), db), []);
        assert.equal([...chosenSpellKeys(valor, derive(valor), db)].length, 0);
    });

    test('Valeurs illisibles (nombre, objet, texte vide) : ignorées', () => {
        const c = wizard(20, { subclass_choices: { wizard: { mastery1: '', mastery2: { a: 1 }, signature1: null, signature2: '   ' } } });
        assert.deepEqual(chosenSpells(c, derive(c), db), []);
    });

    test('chosenSpellKeys : tous les noms, ou seulement ceux d\'une origine (grimoire, listes)', () => {
        const c = wizard(20, { subclass_choices: { wizard: { mastery1: 'Mage Armor', signature1: 'Fireball' } } });
        const keys = chosenSpellKeys(c, derive(c), db);
        for (const name of ['Armure du mage', 'Armure de mage', 'Mage Armor', 'Boule de feu', 'Fireball']) assert.ok(keys.has(spellNameKey(name)), name);
        assert.deepEqual(chosenSpellKeys(c, derive(c), db, { from: 'book' }), keys);
        assert.equal(chosenSpellKeys(c, derive(c), db, { from: 'lists' }).size, 0);
        const b = lore(6, { subclass_choices: { college_of_lore: { discovery1: 'Guidance' } } });
        assert.equal(chosenSpellKeys(b, derive(b), db, { from: 'book' }).size, 0);
        assert.deepEqual([...chosenSpellKeys(b, derive(b), db, { from: 'lists' })], ['Guidance', 'Assistance'].map(spellNameKey));
        assert.equal(chosenSpellKeys(wizard(20), derive(wizard(20)), db).size, 0);
    });
});

describe('Sorts choisis : ce que le grimoire affiche (spellChoiceView)', () => {
    const view = (c, context = { db }) => spellChoiceView(c, derive(c), { maxLevel: highestSlotLevel(derive(c).spellSlots), ...context });

    test('Magicien 20 : deux capacités de classe, la Maîtrise des sorts modifiable en jeu', () => {
        const features = view(wizard(20, { subclass_choices: { wizard: { mastery1: 'Magic Missile' } } }));
        assert.deepEqual(features.map(entry => [entry.id, entry.name, entry.level, entry.owner, entry.from, entry.inPlay]), [
            ['maitrise_des_sorts', 'Maîtrise des sorts', 18, 'class', 'book', true],
            ['sorts_de_predilection', 'Sorts de prédilection', 20, 'class', 'book', false]
        ]);
        const [mastery, signature] = features;
        assert.deepEqual(mastery.fields.map(menu => [menu.key, menu.label, menu.value, menu.warning, menu.hint]),
            [['mastery1', 'Sort de niveau 1', 'Magic Missile', '', ''], ['mastery2', 'Sort de niveau 2', '', '', '']]);
        assert.deepEqual(mastery.spells.map(spell => spell.name), ['Projectile magique']);
        assert.deepEqual(signature.spells, []);
        assert.equal(mastery.intro, feature('maitrise_des_sorts').intro);
    });

    test('Collège du Savoir : capacité de sous-classe, menu de construction', () => {
        const [discoveries] = view(lore(6, { subclass_choices: { college_of_lore: { discovery2: 'Fireball' } } }));
        assert.deepEqual([discoveries.id, discoveries.owner, discoveries.from, discoveries.inPlay], ['decouvertes_magiques', 'subclass', 'lists', false]);
        assert.deepEqual(discoveries.fields.map(menu => [menu.key, menu.value]), [['discovery1', ''], ['discovery2', 'Fireball']]);
        // Le sort pris par le second menu est grisé dans le premier
        assert.equal(discoveries.fields[0].options.find(option => option.value === 'Fireball').disabled, true);
        assert.equal(discoveries.fields[1].options.find(option => option.value === 'Fireball').disabled, false);
        assert.deepEqual(discoveries.spells.map(spell => [spell.name, spell.level]), [['Boule de feu', 3]]);
    });

    test('Valeur enregistrée sous un autre nom du sort : le menu montre l\'option du sort', () => {
        const [mastery] = view(wizard(18, { subclass_choices: { wizard: { mastery1: 'Projectile magique' } } }));
        assert.equal(mastery.fields[0].value, 'Magic Missile');
        assert.equal(mastery.fields[0].warning, '');
    });

    test('Sort de Maîtrise retiré du grimoire : avertissement, rien n\'est effacé', () => {
        const c = wizard(18, { dynamic_spells: [row('Bouclier', 1, 'Réaction')], subclass_choices: { wizard: { mastery1: 'Magic Missile' } } });
        const [mastery] = view(c);
        assert.match(mastery.fields[0].warning, /« Projectile magique » n'est plus noté dans votre grimoire comme sort de niveau 1 lancé en une action/);
        assert.equal(mastery.fields[0].value, 'Magic Missile');
        assert.deepEqual(mastery.spells.map(spell => spell.name), ['Projectile magique']);
        // Aucun autre sort à proposer : le menu dit pourquoi
        assert.match(mastery.fields[0].hint, /Aucun sort de niveau 1 lancé en une action dans votre grimoire/);
        assert.match(mastery.fields[1].hint, /Aucun sort de niveau 2 lancé en une action dans votre grimoire/);
    });

    test('Magicien Elfe drow : le sort d\'espèce noté au tableau n\'est pas proposé (il n\'est pas dans le livre)', () => {
        const rows = [row('Lueurs féeriques', 1), row('Ténèbres', 2), row('Invisibilité', 2), row('Projectile magique', 1)];
        const drow = wizard(18, { char_species: 'Elfe', species_choices: { option: 'drow', ability: 'int' }, dynamic_spells: rows });
        const given = givenSpellKeys(drow, derive(drow));
        assert.ok(given.has(spellNameKey('Lueurs féeriques')) && given.has(spellNameKey('Ténèbres')));
        const [mastery] = view(drow, { db, given });
        assert.deepEqual(mastery.fields.map(menu => menu.options.map(option => option.value)), [['Magic Missile'], ['Invisibility']]);
        // Sans l'espèce : Ténèbres est un sort de Magicien comme un autre ; Lueurs féeriques n'en est jamais un
        const human = wizard(18, { dynamic_spells: rows });
        const [plain] = view(human, { db, given: givenSpellKeys(human, derive(human)) });
        assert.deepEqual(plain.fields.map(menu => menu.options.map(option => option.value)), [['Magic Missile'], ['Invisibility', 'Darkness']]);
        // La ligne « Livre » ne compte pas ces sorts non plus : le menu et le compte disent la même chose
        assert.equal(spellbookCount(rows, grantedSpellKeys(drow, derive(drow), db)), 2);
    });

    test('Sort d\'un don noté au tableau (Initié à la magie) : pas proposé non plus', () => {
        const rows = [row('Sommeil', 1), row('Projectile magique', 1)];
        const c = wizard(18, {
            dynamic_spells: rows, feat_1: 'initie_a_la_magie',
            feat_choices: { 1: { initie_a_la_magie: { list: 'wizard', castAbility: 'int', cantrip1: 'Light', cantrip2: 'Mage Hand', spell: 'Sleep' } } }
        });
        const given = givenSpellKeys(c, derive(c));
        assert.ok(given.has(spellNameKey('Sommeil')));
        const [mastery] = view(c, { db, given });
        assert.deepEqual(mastery.fields[0].options.map(option => option.value), ['Magic Missile']);
    });

    test('Sort choisi qui n\'est pas un sort du livre : l\'avertissement dit pourquoi, rien n\'est effacé', () => {
        const rows = [row('Ténèbres', 2), row('Lueurs féeriques', 1), row('Projectile magique', 1)];
        const drow = wizard(18, {
            char_species: 'Elfe', species_choices: { option: 'drow', ability: 'int' }, dynamic_spells: rows,
            subclass_choices: { wizard: { mastery1: 'Faerie Fire', mastery2: 'Darkness' } }
        });
        const [mastery] = view(drow, { db, given: givenSpellKeys(drow, derive(drow)) });
        assert.deepEqual(mastery.fields.map(menu => menu.value), ['Faerie Fire', 'Darkness']);
        assert.equal(mastery.fields[0].warning, "« Lueurs féeriques » vous est donné par votre sous-classe, un don ou votre espèce : ce n'est pas un sort de votre livre. Choisissez-en un autre.");
        assert.equal(mastery.fields[1].warning, "« Ténèbres » vous est donné par votre sous-classe, un don ou votre espèce : ce n'est pas un sort de votre livre. Choisissez-en un autre.");
        // Sort hors de la liste du Magicien, sans don ni espèce
        const human = wizard(18, { dynamic_spells: rows, subclass_choices: { wizard: { mastery1: 'Faerie Fire' } } });
        const [plain] = view(human, { db, given: givenSpellKeys(human, derive(human)) });
        assert.equal(plain.fields[0].warning, "« Lueurs féeriques » n'est pas un sort de Magicien : il ne peut pas être dans votre livre. Choisissez-en un autre.");
        // Base pas encore chargée : aucun avertissement
        assert.deepEqual(view(drow, { db: null, given: givenSpellKeys(drow, derive(drow)) })[0].fields.map(menu => menu.warning), ['', '']);
    });

    test('Sorts de prédilection sans sort de niveau 3 au grimoire : le menu dit quoi noter', () => {
        const [, signature] = view(wizard(20, { dynamic_spells: [row('Projectile magique', 1)] }));
        assert.equal(signature.fields[0].hint, "Aucun sort de niveau 3 dans votre grimoire : notez-le d'abord dans le tableau des sorts.");
        assert.equal(signature.fields[0].warning, '');
    });

    test('Découverte magique au-dessus des emplacements : avertissement', () => {
        const [discoveries] = view(lore(6, { subclass_choices: { college_of_lore: { discovery1: 'Wish' } } }));
        assert.match(discoveries.fields[0].warning, /« Souhait » n'est pas un sort du Clerc, du Druide ou du Magicien d'un niveau pour lequel vous avez des emplacements/);
        assert.equal(discoveries.fields[1].warning, '');
    });

    test('Base de sorts pas encore chargée : pas d\'avertissement, le menu des Découvertes le dit', () => {
        const w = wizard(18, { subclass_choices: { wizard: { mastery1: 'Magic Missile' } } });
        const [mastery] = view(w, { db: null });
        assert.equal(mastery.fields[0].warning, '');
        assert.equal(mastery.fields[0].value, 'Magic Missile');
        const [discoveries] = view(lore(6, { subclass_choices: { college_of_lore: { discovery1: 'Bless' } } }), { db: [] });
        assert.equal(discoveries.fields[0].warning, '');
        assert.deepEqual(discoveries.fields.map(menu => menu.hint), Array(2).fill('La liste des sorts est en cours de chargement.'));
        assert.deepEqual(discoveries.fields.map(menu => menu.value), ['Bless', '']);
    });

    test('Aucune capacité : vue vide ; la fiche n\'est jamais modifiée', () => {
        assert.deepEqual(view(wizard(17)), []);
        assert.deepEqual(view(mk({ char_class: 'Clerc', char_level: '20' })), []);
        assert.deepEqual(spellChoiceView(wizard(20), derive(wizard(20))).map(entry => entry.id), ['maitrise_des_sorts', 'sorts_de_predilection']);
    });
});

describe('Sorts choisis : toujours préparés, hors du nombre de sorts préparés', () => {
    const prepState = (c, name, withDb = db) => {
        const d = derive(c);
        const source = wholeListSource(d);
        return spellPrepState(c.dynamic_spells.find(entry => entry.name === name), {
            wholeList: source !== null, granted: grantedSpellKeys(c, d, withDb),
            fits: (entry) => fitsWholeList(entry, source, findSpellByName(db, entry.name))
        });
    };

    test('Magicien : le sort de Maîtrise noté au grimoire est préparé d\'office et ne compte pas', () => {
        const rows = BOOK.map(entry => ({ ...entry, prep: entry.name === 'Projectile magique' || entry.name === 'Boule de feu' }));
        const c = wizard(18, { dynamic_spells: rows, subclass_choices: { wizard: { mastery1: 'Magic Missile' } } });
        assert.equal(prepState(c, 'Projectile magique'), 'granted');
        assert.equal(prepState(c, 'Boule de feu'), 'prepared');
        assert.equal(prepState(c, 'Armure du mage'), 'unprepared');
        const granted = grantedSpellKeys(c, derive(c), db);
        assert.equal(spellCounts(rows, '', granted).prepared, 1);
        // Sans le choix : compté comme tout sort préparé
        const plain = wizard(18, { dynamic_spells: rows });
        assert.equal(prepState(plain, 'Projectile magique'), 'prepared');
        assert.equal(spellCounts(rows, '', grantedSpellKeys(plain, derive(plain), db)).prepared, 2);
    });

    test('Magicien : le sort toujours préparé reste un sort du livre (compte « Livre »)', () => {
        const c = wizard(20, { subclass_choices: { wizard: { mastery1: 'Magic Missile', signature1: 'Fireball' } } });
        const d = derive(c);
        const granted = grantedSpellKeys(c, d, db);
        const inBook = chosenSpellKeys(c, d, db, { from: 'book' });
        // 9 sorts de niveau 1+ au grimoire ; sans inBook, les deux sorts choisis sortiraient du compte
        assert.equal(spellbookCount(c.dynamic_spells, granted), 7);
        assert.equal(spellbookCount(c.dynamic_spells, granted, inBook), 9);
        assert.equal(spellbookCount(c.dynamic_spells, granted, new Set()), 7);
        assert.equal(spellbookCount(c.dynamic_spells, null, inBook), 9);
    });

    test('Base de sorts pas encore chargée : seul le nom enregistré est reconnu (la ligne en français attend la base)', () => {
        const c = wizard(18, { subclass_choices: { wizard: { mastery1: 'Magic Missile' } } });
        assert.equal(prepState(c, 'Projectile magique', null), 'unprepared');
        const english = wizard(18, { dynamic_spells: [row('Magic Missile', 1)], subclass_choices: { wizard: { mastery1: 'Magic Missile' } } });
        assert.equal(prepState(english, 'Magic Missile', null), 'granted');
    });

    test('Collège du Savoir : la Découverte notée au grimoire ne compte ni en préparés ni en sorts mineurs', () => {
        const rows = [row('Assistance', 0), row('Moquerie cruelle', 0), row('Bénédiction', 1), row('Soins', 1)];
        const c = lore(6, { dynamic_spells: rows, subclass_choices: { college_of_lore: { discovery1: 'Guidance', discovery2: 'Bless' } } });
        const d = derive(c);
        const granted = grantedSpellKeys(c, d, db);
        const source = wholeListSource(d);
        const fits = (entry) => fitsWholeList(entry, source, findSpellByName(db, entry.name));
        assert.equal(prepState(c, 'Bénédiction'), 'granted');
        assert.equal(prepState(c, 'Soins'), 'list');
        assert.deepEqual([spellCounts(rows, '', granted, fits).prepared, spellCounts(rows, '', granted, fits).cantrips], [1, 1]);
        // Sans les choix : Bénédiction (hors de la liste du Barde) garde son losange, Assistance compte
        const plain = lore(6, { dynamic_spells: rows });
        assert.equal(prepState(plain, 'Bénédiction'), 'unprepared');
        assert.equal(spellCounts(rows, '', grantedSpellKeys(plain, derive(plain), db), fits).cantrips, 2);
    });

    test('Fiche sans sort choisi : les sorts donnés sont exactement ceux d\'avant', () => {
        for (const c of [wizard(20), lore(10), mk({ char_class: 'Paladin', char_level: '9', char_subclass: 'Serment de dévotion' })]) {
            const d = derive(c);
            assert.deepEqual(grantedSpellKeys(c, d, db), grantedSpellKeys(c, d));
            assert.equal(Object.hasOwn(c, 'subclass_choices'), false);
        }
    });
});

describe('Sorts choisis : lancers sans emplacement du Magicien', () => {
    const cast = (c, ...names) => freeCastsFor(c, derive(c), names);
    const use = (c, id) => useFreeCastPatch(c, derive(c), id);

    test('Maîtrise des sorts : à volonté au niveau le plus bas, aucune case à cocher', () => {
        const c = wizard(18, { subclass_choices: { wizard: { mastery1: 'Magic Missile', mastery2: 'Invisibility' } } });
        const [missile] = cast(c, 'Projectile magique', 'Magic Missile');
        assert.deepEqual([missile.id, missile.kind, missile.label, missile.atLevel, missile.left], ['choice.mastery1', 'atwill', 'Maîtrise des sorts', 1, 1]);
        assert.equal(cast(c, 'Invisibilité', 'Invisibility')[0].atLevel, 2);
        // Rien n'est écrit dans la fiche, autant de fois que l'on veut
        assert.deepEqual(use(c, 'choice.mastery1'), {});
        assert.deepEqual(use(c, 'choice.mastery2'), {});
        assert.deepEqual(cast(c, 'Boule de feu', 'Fireball'), []);
    });

    test('Sorts de prédilection : une case par sort choisi, au niveau 3, de nouveau après un repos court', () => {
        const c = wizard(20, { subclass_choices: { wizard: { signature1: 'Fireball', signature2: 'Counterspell' } } });
        const [fireball] = cast(c, 'Boule de feu', 'Fireball');
        assert.deepEqual([fireball.id, fireball.kind, fireball.label, fireball.atLevel, fireball.max, fireball.left, fireball.reset],
            ['wizard.sort_de_predilection_1', 'uses', 'Sorts de prédilection', 3, 1, 1, 'short']);
        assert.equal(cast(c, 'Contresort', 'Counterspell')[0].id, 'wizard.sort_de_predilection_2');
        assert.equal(Object.hasOwn(c, 'subclass_uses'), false);
        const patch = use(c, 'wizard.sort_de_predilection_1');
        assert.deepEqual(patch, { subclass_uses: { 'wizard.sort_de_predilection_1': 1 } });
        const used = mk({ ...c, ...patch });
        assert.equal(cast(used, 'Boule de feu', 'Fireball')[0].left, 0);
        assert.equal(use(used, 'wizard.sort_de_predilection_1'), null);
        // L'autre sort garde son lancer
        assert.equal(cast(used, 'Contresort', 'Counterspell')[0].left, 1);
        const rest = restSubclassUses(used, derive(used), 'short');
        assert.equal(rest.patch.subclass_uses['wizard.sort_de_predilection_1'] ?? 0, 0);
    });

    test('Aucun sort choisi : les cases existent (onglet Combat), mais aucun lancer n\'est proposé', () => {
        const c = wizard(20);
        assert.deepEqual(subclassCounters(c, derive(c)).filter(counter => counter.source === 'class').map(counter => counter.key),
            ['wizard.sort_de_predilection_1', 'wizard.sort_de_predilection_2']);
        assert.deepEqual(allFreeCasts(c, derive(c)), []);
        assert.equal(use(c, 'choice.mastery1'), null);
    });

    test('Découvertes magiques : sorts préparés ordinaires, sans lancer gratuit', () => {
        const c = lore(6, { subclass_choices: { college_of_lore: { discovery1: 'Bless', discovery2: 'Guidance' } } });
        assert.deepEqual(allFreeCasts(c, derive(c)), []);
    });
});

describe('Sorts choisis : repères de fin de repos du Magicien', () => {
    const notes = (plan) => plan.summary.featNotes.map(note => note.featName);

    test('Mémorisation de sort (niveau 5) : rappelée à la fin d\'un repos court seulement', () => {
        assert.equal(notes(planShortRest(wizard(4))).includes('Mémorisation de sort'), false);
        const short = planShortRest(wizard(5)).summary.featNotes.find(note => note.featName === 'Mémorisation de sort');
        assert.match(short.text, /remplacer un de vos sorts préparés/);
        assert.equal(notes(planLongRest(wizard(5))).includes('Mémorisation de sort'), false);
        assert.ok(notes(planShortRest(wizard(20))).includes('Mémorisation de sort'));
    });

    test('Maîtrise des sorts (niveau 18) : rappelée à la fin d\'un repos long seulement', () => {
        assert.equal(notes(planLongRest(wizard(17))).includes('Maîtrise des sorts'), false);
        const long = planLongRest(wizard(18)).summary.featNotes.find(note => note.featName === 'Maîtrise des sorts');
        assert.match(long.text, /remplacer un de vos deux sorts de Maîtrise des sorts/);
        assert.equal(notes(planShortRest(wizard(18))).includes('Maîtrise des sorts'), false);
    });

    test('Autres classes : aucun de ces rappels', () => {
        for (const c of [lore(20), mk({ char_class: 'Ensorceleur', char_level: '20' }), mk({ char_class: 'Guerrier', char_level: '20' })]) {
            for (const plan of [planShortRest(c), planLongRest(c)]) {
                assert.equal(notes(plan).some(name => name === 'Mémorisation de sort' || name === 'Maîtrise des sorts'), false);
            }
        }
    });
});

describe('Sorts choisis : interface (js/ui/spells/choices.js, granted.js, spells.css)', () => {
    const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    const choices = read('js/ui/spells/choices.js');
    const granted = read('js/ui/spells/granted.js');
    const grimoire = read('js/ui/spells.js');
    const css = read('css/spells.css');

    test('Menus : réglage de construction verrouillé avec la fiche, sauf Maîtrise des sorts (changée après un repos long)', () => {
        assert.match(choices, /feature\.inPlay \? \{ 'data-play': 'true' \} : \{ 'data-build-control': 'true', disabled: isLocked\(\) \}/);
        assert.match(choices, /setSpellChoicePatch\(now, derivedOf\(now\), field\.key, event\.target\.value\)/);
        // Chaque capacité dit à quoi elle sert, en clair (pas d'infobulle : tablette)
        assert.match(choices, /el\('p', \{ class: 'feat-spells-extra', text: feature\.intro \}\)/);
        assert.doesNotMatch(choices, /innerHTML|onclick=/);
    });

    test('Blocs « Sorts de classe » (Magicien) et « Sorts de sous-classe » (Collège du Savoir)', () => {
        // given : les sorts donnés SANS les sorts choisis (grantedSpellKeys écarterait du menu le sort choisi lui-même)
        assert.match(granted, /spellChoiceView\(character, d, \{\s*db: getSpellsDb\(\), maxLevel: highestSlotLevel\(d\.spellSlots\), given: givenSpellKeys\(character, d\)\s*\}\)/);
        assert.doesNotMatch(granted, /given: grantedSpellKeys/);
        assert.match(granted, /choiceFeatures\(choices, 'class', character\.dynamic_spells\)/);
        assert.match(granted, /choiceFeatures\(choices, 'subclass', character\.dynamic_spells\)/);
        assert.match(granted, /classBox\.hidden = spells\.length === 0 && arcana\.length === 0 && features\.length === 0/);
        assert.match(granted, /subclassBox\.hidden = spells\.length === 0 && features\.length === 0/);
        // Choisir un sort reconstruit le bloc : le menu garde le focus
        assert.equal(granted.match(/keepChoiceFocus\((classBox|subclassBox), /g).length, 2);
    });

    test('Le grimoire relie le nom enregistré (anglais) à la ligne du tableau par la base de sorts', () => {
        assert.match(grimoire, /grantedSpellKeys\(character, derivedNow, g\.spellsDb\)/);
        assert.match(grimoire, /book\.renderNote\(rows, derivedNow, granted, chosenSpellKeys\(character, derivedNow, g\.spellsDb, \{ from: 'book' \}\)\)/);
        assert.match(read('js/ui/spells/book.js'), /spellbookCount\(rows, granted, inBook\)/);
    });

    test('Menus retirés de la vue au combat et de l\'impression ; les sorts choisis restent', () => {
        assert.match(css, /@media screen \{\s*\.spells-body\.is-combat \.spell-choices,/);
        assert.match(css, /@media print \{\s*\.spell-choices,\s*\.spell-choice-group \.feat-spells-warning \{\s*display: none;/);
        assert.doesNotMatch(css.slice(css.indexOf('.spell-choice-group + .spell-choice-group')), /!important|#[0-9a-fA-F]{3,8}\b/);
    });
});
