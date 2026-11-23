// =============================================================================
// SPELL-CHOICES.JS (règles) - Sorts choisis d'une capacité, toujours préparés
//
// Maîtrise des sorts et Sorts de prédilection du Magicien (niveaux 18 et 20), Découvertes magiques
// du Barde du Collège du Savoir (niveau 6) : la capacité fait choisir des sorts, qui sont ensuite
// toujours préparés et ne comptent pas dans les sorts préparés (données et règles du manuel :
// js/data/spell-choices.js).
//
// Sauvegarde : aucun nom de clé nouveau. Le choix est rangé dans la clé facultative existante
// « subclass_choices » (choix de capacité), sous « wizard » pour le Magicien et sous la clé de la
// sous-classe pour le Barde : { wizard: { mastery1: 'Shield', signature1: 'Fireball' } },
// { college_of_lore: { discovery1: 'Guidance' } }. La valeur est le nom anglais du sort quand la
// base de sorts le connaît (il ne change pas quand un nom français est corrigé), sinon le nom noté
// au grimoire. Rien n'est écrit tant que le joueur ne choisit rien ; un choix effacé retire sa
// valeur. L'ancien site ignore cette clé (V4_ONLY_KEYS, js/cloud/sync.js).
// Les cases des Sorts de prédilection sont celles de CLASS_COUNTERS (js/rules/subclass-uses.js).
//
// La base de sorts (data/spells.json) est chargée après la fiche : toutes les fonctions acceptent
// db = null (ou vide) et font alors au mieux avec le nom enregistré.
// Fonctions pures : le personnage reçu n'est jamais modifié.
// =============================================================================

import { SPELL_CHOICE_FEATURES } from '../data/spell-choices.js';
import { SUBCLASS_CHOICES_KEY, subclassChoicesState } from './subclass-choices.js';
import {
    spellNameKey, spellNames, spellDisplayName, rowLevel, isSpellRowEmpty, plainText, normalizeText
} from './spells.js';

/** Longueur maximale d'un nom de sort enregistré */
const MAX_NAME = 80;

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Nom de sort enregistrable : texte simple, espaces réduits, 80 caractères au plus */
const cleanName = (value) => (typeof value === 'string' || typeof value === 'number'
    ? plainText(String(value)).replace(/\s+/g, ' ').trim().slice(0, MAX_NAME) : '');

const byLabel = new Intl.Collator('fr');

// La base de sorts ne change pas une fois chargée : ce qui en est tiré (index des noms, sorts
// proposés par une capacité) est gardé par base, pour ne pas le recalculer à chaque affichage
const NAME_INDEXES = new WeakMap();
const LIST_SPELLS = new WeakMap();

/**
 * Recherche d'un sort de la base par son nom, comme findSpellByName (nom français ou variante
 * d'abord, nom anglais ensuite), mais avec un index : le grimoire est réaffiché à chaque frappe.
 * @param {Array<Object>|null} db
 * @returns {(name: string) => Object|null}
 */
function spellFinder(db) {
    if (!Array.isArray(db) || db.length === 0) return () => null;
    let index = NAME_INDEXES.get(db);
    if (!index) {
        index = new Map();
        const add = (name, spell) => {
            const key = normalizeText(name);
            if (key && !index.has(key)) index.set(key, spell);
        };
        for (const spell of db) for (const name of spellNames(spell)) add(name, spell);
        for (const spell of db) add(spell?.vo, spell);
        NAME_INDEXES.set(db, index);
    }
    return (name) => index.get(normalizeText(name)) ?? null;
}

/**
 * Capacités à sorts choisis atteintes par le personnage (classe, sous-classe, niveau).
 * @param {{ classSlug?: string, subclass?: string, level?: number }} [derived] - deriveCharacter()
 * @returns {typeof SPELL_CHOICE_FEATURES[number][]}
 */
export function spellChoiceFeatures(derived = {}) {
    const level = Math.trunc(Number(derived?.level)) || 1;
    return SPELL_CHOICE_FEATURES.filter(feature => feature.classSlug === derived?.classSlug
        && (!feature.subclass || feature.subclass === derived?.subclass) && level >= feature.level);
}

/**
 * Valeurs enregistrées d'une capacité : { champ: nom du sort }. Une valeur illisible est ignorée ;
 * le même sort choisi dans deux menus ne compte qu'une fois (le premier).
 */
function savedValues(character, feature, find) {
    const bucket = subclassChoicesState(character)[feature.bucket];
    const saved = isPlainObject(bucket) ? bucket : {};
    const values = {};
    const seen = new Set();
    for (const field of feature.fields) {
        const value = cleanName(saved[field.key]);
        const id = value ? find(value) ?? spellNameKey(value) : '';
        if (!id || seen.has(id)) continue;
        seen.add(id);
        values[field.key] = value;
    }
    return values;
}

/**
 * Sorts choisis des capacités atteintes, dans l'ordre des menus.
 * @param {Object} character
 * @param {Object} derived - deriveCharacter(character)
 * @param {Array<Object>|null} [db] - base de sorts ; absente : nom enregistré tel quel
 * @returns {Array<{ featureId: string, featureName: string, key: string, label: string, value: string,
 *   spell: Object|null, name: string, vo: string, level: number|null, keys: string[],
 *   from: 'book'|'lists', cast: 'atwill'|'uses'|null, atLevel: number|null, uses: string|null }>}
 *   value : valeur enregistrée ; spell : sort de la base (null : inconnu) ; name : nom affiché ;
 *   level : niveau du sort (imposé par le menu, sinon celui de la base ; null : inconnu) ;
 *   keys : tous ses noms comparables (spellNameKey) ; atLevel : niveau du lancer sans emplacement ;
 *   uses : clé de la case du lancer (subclass_uses)
 */
export function chosenSpells(character, derived, db = null) {
    const find = spellFinder(db);
    const list = [];
    for (const feature of spellChoiceFeatures(derived)) {
        const values = savedValues(character, feature, find);
        for (const field of feature.fields) {
            const value = values[field.key];
            if (!value) continue;
            const spell = find(value);
            const known = Number(spell?.level);
            list.push({
                featureId: feature.id, featureName: feature.name, key: field.key, label: field.label, value,
                spell, name: spell ? spellDisplayName(spell) : value, vo: spell?.vo ?? value,
                level: field.spellLevel ?? (spell && Number.isFinite(known) ? known : null),
                keys: [...new Set([value, ...spellNames(spell), spell?.vo].filter(Boolean).map(spellNameKey).filter(Boolean))],
                from: feature.from, cast: feature.cast ?? null, atLevel: feature.cast ? field.spellLevel ?? null : null,
                uses: field.uses ?? null
            });
        }
    }
    return list;
}

/**
 * Noms comparables des sorts choisis : notés aussi au grimoire, ils sont toujours préparés et hors
 * du compte (grantedSpellKeys de js/rules/spell-preparation.js).
 * @param {Object} character
 * @param {Object} derived
 * @param {Array<Object>|null} [db]
 * @param {{ from?: 'book'|'lists'|null }} [filter] - seulement les sorts pris au grimoire, ou dans les listes
 * @returns {Set<string>}
 */
export function chosenSpellKeys(character, derived, db = null, { from = null } = {}) {
    return new Set(chosenSpells(character, derived, db)
        .filter(spell => !from || spell.from === from).flatMap(spell => spell.keys));
}

/**
 * Patch qui enregistre un sort choisi (valeur vide : le choix est effacé ; plus aucun choix dans le
 * groupe : le groupe est retiré). Seulement pour un menu d'une capacité atteinte.
 * @param {Object} character
 * @param {Object} derived - deriveCharacter(character)
 * @param {string} key - champ (« mastery1 », « discovery2 »…)
 * @param {string} value - nom anglais du sort (ou nom noté au grimoire)
 * @returns {Object} { subclass_choices: {...} }, ou {} si le menu est inconnu ou si rien ne change
 */
export function setSpellChoicePatch(character, derived, key, value) {
    const feature = spellChoiceFeatures(derived).find(entry => entry.fields.some(field => field.key === key));
    if (!feature) return {};
    const text = cleanName(value);
    const state = subclassChoicesState(character);
    const current = isPlainObject(state[feature.bucket]) ? { ...state[feature.bucket] } : {};
    if (text ? current[key] === text : !Object.hasOwn(current, key)) return {};
    if (text) current[key] = text;
    else delete current[key];
    const next = { ...state };
    if (Object.keys(current).length) next[feature.bucket] = current;
    else delete next[feature.bucket];
    return { [SUBCLASS_CHOICES_KEY]: next };
}

/**
 * Le temps d'incantation est-il d'une action (Maîtrise des sorts) ? « Action », « Action ou
 * Rituel », « 1 action » : oui ; « Action bonus », « Réaction », « 1 minute » : non. Temps vide
 * (sort noté à la main sans cette colonne) : on fait confiance au joueur.
 * @param {string} text - castTime de la base, ou colonne « Temps » de la ligne
 * @returns {boolean}
 */
export function isActionCastTime(text) {
    const time = normalizeText(text).replace(/\s+/g, ' ').trim();
    if (!time) return true;
    return /^(1 |une )?action\b/.test(time) && !/^(1 |une )?action bonus\b/.test(time);
}

const levelGroup = (level) => (level === 0 ? 'Sorts mineurs' : `Niveau ${level}`);

/** Sorts de la base proposés par une capacité 'lists' jusqu'à ce niveau, rangés par niveau puis par nom */
function listSpells(db, feature, maxLevel) {
    let cache = LIST_SPELLS.get(db);
    if (!cache) LIST_SPELLS.set(db, cache = new Map());
    const key = `${feature.id}:${maxLevel}`;
    if (!cache.has(key)) {
        cache.set(key, db
            .filter(spell => Number.isInteger(Number(spell?.level)) && Number(spell.level) >= 0 && Number(spell.level) <= maxLevel
                && feature.lists.some(slug => (spell.classes || []).includes(slug)))
            .map(spell => ({ spell, level: Number(spell.level), label: spellDisplayName(spell) }))
            .sort((a, b) => a.level - b.level || byLabel.compare(a.label, b.label)));
    }
    return cache.get(key);
}

/**
 * Sorts proposés par un menu.
 *  - 'book' (Magicien) : sorts notés au grimoire de la fiche au niveau demandé, lancés en une
 *    action si la capacité le demande (temps d'incantation de la base quand elle connaît le sort,
 *    sinon colonne « Temps » de la ligne). Un sort que la base connaît à un autre niveau que celui
 *    de sa ligne n'est pas proposé ;
 *  - 'lists' (Découvertes magiques) : sorts de la base pris dans les listes de la capacité, sorts
 *    mineurs et sorts d'un niveau pour lequel le personnage a des emplacements (maxLevel).
 * Le sort déjà choisi reste toujours dans le menu, même s'il n'est plus proposable (stale) ; un
 * sort pris par un autre menu de la même capacité est grisé (disabled). L'option du sort choisi
 * porte selected (même si la valeur enregistrée est un autre nom du même sort).
 * @param {Object} feature - SPELL_CHOICE_FEATURES
 * @param {Object} field - un de ses menus
 * @param {{ db?: Array<Object>|null, rows?: Array<Object>, maxLevel?: number, current?: string, taken?: string[] }} [context]
 *        rows : dynamic_spells ; maxLevel : highestSlotLevel ; current : valeur enregistrée du menu ;
 *        taken : valeurs des autres menus de la capacité
 * @returns {Array<{ value: string, label: string, group: string, disabled: boolean, selected: boolean, stale?: boolean }>}
 */
export function spellChoiceOptions(feature, field, { db = null, rows = [], maxLevel = 0, current = '', taken = [] } = {}) {
    const spells = Array.isArray(db) ? db : [];
    const find = spellFinder(spells);
    const options = [];
    const seen = new Set();
    // Identité d'un sort : celui de la base s'il est connu, sinon son nom comparable
    const identity = (value) => find(value) ?? spellNameKey(value);
    const takenIds = new Set(taken.filter(Boolean).map(identity));
    const value = cleanName(current);
    const currentId = value ? identity(value) : null;
    const add = (id, optionValue, label, level) => {
        if (!optionValue || seen.has(id)) return;
        seen.add(id);
        options.push({ value: optionValue, label, group: levelGroup(level), disabled: takenIds.has(id) && id !== currentId, selected: id === currentId });
    };

    if (feature.from === 'book') {
        for (const row of Array.isArray(rows) ? rows : []) {
            if (!row || typeof row !== 'object' || isSpellRowEmpty(row) || Number(rowLevel(row)) !== field.spellLevel) continue;
            const name = cleanName(row.name);
            if (!name) continue;
            const spell = find(name);
            if (spell && Number(spell.level) !== field.spellLevel) continue;
            if (feature.castTime === 'action' && !isActionCastTime(spell ? spell.castTime : row.time)) continue;
            add(spell ?? spellNameKey(name), spell ? cleanName(spell.vo) || name : name, spell ? spellDisplayName(spell) : name, field.spellLevel);
        }
        options.sort((a, b) => byLabel.compare(a.label, b.label));
    } else if (spells.length) {
        const top = Math.max(0, Math.min(9, Math.trunc(Number(maxLevel)) || 0));
        for (const { spell, level, label } of listSpells(spells, feature, top)) add(spell, cleanName(spell.vo) || label, label, level);
    }

    // Choix actuel qui n'est plus proposable (sort retiré du grimoire, niveau sans emplacement,
    // base de sorts pas encore chargée) : gardé en tête du menu, pour rester lisible et modifiable
    if (value && !seen.has(currentId)) {
        const spell = find(value);
        options.unshift({ value, label: spell ? spellDisplayName(spell) : value, group: '', disabled: false, selected: true, stale: true });
    }
    return options;
}

/** Ce que demande un menu, en quelques mots (« de niveau 1 lancé en une action ») */
function fieldNeed(feature, field) {
    return `de niveau ${field.spellLevel}${feature.castTime === 'action' ? ' lancé en une action' : ''}`;
}

/**
 * Tout ce qu'il faut pour afficher les capacités à sorts choisis du personnage : phrase
 * d'explication, menus (options, valeur, avertissement) et sorts choisis.
 * Avertissements (simples rappels, rien n'est effacé), une fois la base de sorts chargée : sort
 * choisi qui n'est plus au grimoire (Magicien), sort qui n'est plus proposable (Découvertes
 * magiques : niveau sans emplacement, autre liste).
 * @param {Object} character
 * @param {Object} derived - deriveCharacter(character)
 * @param {{ db?: Array<Object>|null, maxLevel?: number }} [context] - maxLevel : highestSlotLevel
 * @returns {Array<{ id: string, name: string, level: number, owner: 'class'|'subclass', intro: string,
 *   from: 'book'|'lists', inPlay: boolean,
 *   fields: Array<{ key: string, label: string, value: string, options: ReturnType<typeof spellChoiceOptions>,
 *     warning: string, hint: string }>,
 *   spells: ReturnType<typeof chosenSpells> }>}
 *   owner : capacité de classe ou de sous-classe (bloc du grimoire où elle s'affiche) ;
 *   value : valeur de l'option choisie ('' : rien), celle du menu même si la fiche a enregistré un
 *   autre nom du même sort ; hint : pourquoi le menu est vide
 */
export function spellChoiceView(character, derived, { db = null, maxLevel = 0 } = {}) {
    const rows = Array.isArray(character?.dynamic_spells) ? character.dynamic_spells : [];
    const loaded = Array.isArray(db) && db.length > 0;
    const find = spellFinder(db);
    const chosen = chosenSpells(character, derived, db);
    return spellChoiceFeatures(derived).map(feature => {
        const values = savedValues(character, feature, find);
        const fields = feature.fields.map(field => {
            const saved = values[field.key] ?? '';
            const taken = feature.fields.filter(other => other.key !== field.key).map(other => values[other.key]).filter(Boolean);
            const options = spellChoiceOptions(feature, field, { db, rows, maxLevel, current: saved, taken });
            const value = options.find(option => option.selected)?.value ?? '';
            const stale = options.find(option => option.stale);
            let warning = '';
            // Base pas encore chargée : le nom anglais enregistré ne se compare pas aux lignes, pas d'alerte
            if (stale && loaded && feature.from === 'book') {
                warning = `« ${stale.label} » n'est plus noté dans votre grimoire comme sort ${fieldNeed(feature, field)} : notez-le dans le tableau des sorts, ou choisissez-en un autre.`;
            } else if (stale && loaded) {
                warning = `« ${stale.label} » n'est pas un sort du Clerc, du Druide ou du Magicien d'un niveau pour lequel vous avez des emplacements : choisissez-en un autre.`;
            }
            let hint = '';
            if (!options.some(option => !option.stale)) {
                hint = feature.from === 'book'
                    ? `Aucun sort ${fieldNeed(feature, field)} dans votre grimoire : notez-le d'abord dans le tableau des sorts.`
                    : loaded ? '' : 'La liste des sorts est en cours de chargement.';
            }
            return { key: field.key, label: field.label, value, options, warning, hint };
        });
        return {
            id: feature.id, name: feature.name, level: feature.level, owner: feature.subclass ? 'subclass' : 'class',
            intro: feature.intro, from: feature.from, inPlay: feature.inPlay === true, fields,
            spells: chosen.filter(spell => spell.featureId === feature.id)
        };
    });
}
