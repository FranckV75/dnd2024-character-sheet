// =============================================================================
// SPECIES.JS (règles) - Traits de l'espèce, option choisie et ce qu'elle donne
//
// Données : js/data/species-traits.js (Manuel des joueurs français). Sauvegarde : clé facultative
// « species_choices » = { option: 'drow', ability: 'wis' } : option de l'espèce (lignage,
// ascendance, héritage…) et caractéristique d'incantation de ses sorts. Absente des anciennes
// fiches ; l'ancien site (v3) l'ignore (V4_ONLY_KEYS, js/cloud/sync.js). Une option qui
// n'appartient pas à l'espèce actuelle est ignorée (changement d'espèce), jamais effacée.
//
//  - speciesView : traits atteints et à venir, option, Vision dans le noir, Résistances, Souffle,
//    sorts de l'espèce (avec DD et attaque) ;
//  - speciesNotes : repères près des valeurs (Résistances près de la CA, Vitesse de l'Elfe sylvestre) ;
//  - speciesCounterDefs : cases des traits à usages limités et des lancers gratuits de sorts,
//    enregistrées dans subclass_uses (« species.souffle ») avec les capacités de classe ;
//  - speciesSpellNames : noms des sorts donnés (hors du compte « Préparés / Sorts mineurs »).
// Fonctions pures.
// =============================================================================

import { DD_RULES } from '../data/dd-rules.js';
import { SPECIES_TRAITS } from '../data/species-traits.js';
import { signed } from './numbers.js';

export const SPECIES_CHOICES_KEY = 'species_choices';

const ABILITY_NAMES = Object.freeze({ int: 'Intelligence', wis: 'Sagesse', cha: 'Charisme' });
const plain = (value) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const meters = (n) => `${String(n).replace('.', ',')} m`;

/** Clé de DD_RULES.species du personnage, ou '' */
export function speciesSlug(record) {
    const found = DD_RULES.findSpecies(plain(record?.char_species));
    return found ? Object.keys(DD_RULES.species).find((key) => DD_RULES.species[key] === found) ?? '' : '';
}

/** État enregistré, toujours un objet */
export function speciesChoicesState(record) {
    const value = record?.[SPECIES_CHOICES_KEY];
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

/** Option et caractéristique valides pour l'espèce actuelle */
function choices(record, data) {
    const state = speciesChoicesState(record);
    const option = data?.option && !data.option.perUse
        ? data.option.choices.find((choice) => choice.id === state.option) ?? null
        : null;
    const ability = data?.option?.abilities?.includes(state.ability) ? state.ability : null;
    return { option, ability };
}

/** Dégâts du Souffle du Drakéide selon le niveau */
export function breathDice(level) {
    const lvl = Number(level) || 1;
    return lvl >= 17 ? '4d10' : lvl >= 11 ? '3d10' : lvl >= 5 ? '2d10' : '1d10';
}

/**
 * @param {Object} record
 * @param {{ level: number, pb: number, mods: Object }} derived - deriveCharacter(record)
 * @returns {null | {
 *   slug: string, name: string, known: boolean,
 *   traits: Object[], upcoming: Object[],
 *   option: null | { key, label, perUse, abilities, choices, selected, ability, abilityName },
 *   darkvision: number|null, speed: number|null, resistances: string[],
 *   breath: null | { dice: string, dc: number, type: string|null },
 *   spells: { name, vo, level, spellLevel, free, ability, dc, attack, reached, source }[]
 * }} known : false pour une espèce sans données (Odyssée) ; null sans espèce reconnue
 */
export function speciesView(record, derived) {
    const slug = speciesSlug(record);
    if (!slug) return null;
    const name = DD_RULES.species[slug].nameFr;
    const data = SPECIES_TRAITS[slug];
    if (!data) {
        return { slug, name, known: false, traits: [], upcoming: [], option: null, darkvision: null, speed: null, resistances: [], breath: null, spells: [] };
    }
    const level = Math.min(20, Math.max(1, Number(derived?.level) || 1));
    const pb = Number(derived?.pb) || 2;
    const mods = derived?.mods ?? {};
    const { option: selected, ability } = choices(record, data);

    const resistances = new Set(data.traits.filter((t) => t.level <= level).flatMap((t) => t.resistance ?? []));
    // Drakéide et Tieffelin : la Résistance suit l'option choisie
    if (selected?.damageType && ['dragonborn', 'tiefling'].includes(slug)) resistances.add(selected.damageType);

    const breath = slug === 'dragonborn'
        ? { dice: breathDice(level), dc: 8 + (Number(mods.con) || 0) + pb, type: selected?.damageType ?? null }
        : null;

    // Sorts : ceux de l'espèce (Lumière, Thaumaturgie) puis ceux de l'option choisie
    const castWith = (spell) => (spell.ability === 'cha' ? 'cha' : ability);
    const spells = [...(data.spells ?? []).map((s) => ({ ...s, source: s.trait })), ...(selected?.spells ?? []).map((s) => ({ ...s, source: selected.name }))]
        .map((spell) => {
            const ab = castWith(spell);
            const mod = ab ? Number(mods[ab]) || 0 : null;
            return {
                name: spell.name, vo: spell.vo, level: spell.level, spellLevel: spell.spellLevel,
                free: spell.free ?? null, source: spell.source,
                ability: ab, dc: ab ? 8 + pb + mod : null, attack: ab ? pb + mod : null,
                reached: spell.level <= level
            };
        });

    return {
        slug, name, known: true,
        traits: data.traits.filter((t) => t.level <= level),
        upcoming: data.traits.filter((t) => t.level > level),
        option: data.option ? {
            key: data.option.key, label: data.option.label, perUse: Boolean(data.option.perUse),
            abilities: data.option.abilities ?? null, choices: data.option.choices,
            selected, ability, abilityName: ability ? ABILITY_NAMES[ability] : null
        } : null,
        darkvision: selected?.darkvision ?? data.darkvision ?? null,
        speed: selected?.speed ?? null,
        resistances: [...resistances],
        breath,
        spells
    };
}

/**
 * Patch d'un choix (option ou caractéristique ; valeur vide : retiré). Les autres champs restent.
 * @param {Object} record
 * @param {'option'|'ability'} key
 * @param {string} value
 * @returns {Object} { species_choices } ou {} si la valeur n'est pas permise
 */
export function setSpeciesChoicePatch(record, key, value) {
    const data = SPECIES_TRAITS[speciesSlug(record)];
    const text = String(value ?? '');
    if (!data?.option || !['option', 'ability'].includes(key)) return {};
    if (text) {
        const allowed = key === 'option' ? data.option.choices.map((c) => c.id) : data.option.abilities ?? [];
        if (!allowed.includes(text)) return {};
    }
    const next = { ...speciesChoicesState(record) };
    if (text) next[key] = text;
    else delete next[key];
    return { [SPECIES_CHOICES_KEY]: next };
}

/**
 * Noms des sorts donnés par l'espèce et atteints (pour le compte du grimoire).
 * @returns {string[]}
 */
export function speciesSpellNames(record, derived) {
    return (speciesView(record, derived)?.spells ?? []).filter((s) => s.reached).flatMap((s) => [s.name, s.vo]);
}

/**
 * Repères près des valeurs, au format FeatNote (feat-effects.js) avec classFeature: true.
 * @returns {Object<string, Object[]>}
 */
export function speciesNotes(derived, record) {
    const view = speciesView(record, derived);
    const zones = {};
    if (!view?.known) return zones;
    const add = (zone, featId, featName, text, extra = {}) => {
        (zones[zone] ??= []).push({ featId, featName, text, ...extra, classFeature: true, species: true });
    };
    if (view.resistances.length) {
        add('armorClass', `species_resistance`, view.name,
            `${view.name} : Résistance aux dégâts : ${view.resistances.join(', ')} (dégâts de ce type divisés par deux).`,
            { mention: `Résistance (${view.resistances.join(', ')})` });
    }
    const base = DD_RULES.species[view.slug].speed / 10 * 3;
    if (view.speed && view.speed > base) {
        const bonus = Math.round((view.speed - base) * 10) / 10;
        add('speed', 'species_speed', view.option.selected.name,
            `+${meters(bonus)} grâce à ${view.option.selected.name} (Vitesse de ${meters(view.speed)}). La Vitesse saisie n'est pas modifiée : ajoutez-les vous-même s'ils n'y sont pas déjà.`,
            { manual: true, value: bonus, applied: false, mention: `dont +${meters(bonus)} (${view.option.selected.name})` });
    }
    return zones;
}

/**
 * Cases des traits à usages limités et des lancers gratuits de sorts de l'espèce.
 * @returns {{ key: string, feature: string, name: string, level: number, label: string, inText: string,
 *   max: number, reset: 'long'|'short', use: string }[]}
 */
export function speciesCounterDefs(record, derived) {
    const view = speciesView(record, derived);
    if (!view?.known) return [];
    const pb = Number(derived?.pb) || 2;
    const defs = view.traits.filter((t) => t.uses).map((trait) => ({
        key: `species.${trait.id}`, feature: trait.id, name: view.name, level: trait.level,
        label: trait.name, inText: trait.name,
        max: trait.uses.count === 'pb' ? pb : Number(trait.uses.count) || 1,
        reset: trait.uses.reset,
        use: trait.id === 'souffle' && view.breath
            ? `À la place d'une attaque : ${view.breath.dice}${view.breath.type ? ` ${view.breath.type}` : ''}, Cône de 4,50 m ou Ligne de 9 m, sauvegarde de Dextérité DD ${view.breath.dc} (moitié si réussie).`
            : shortUse(trait)
    }));
    for (const spell of view.spells) {
        if (!spell.reached || !spell.free) continue;
        defs.push({
            key: `species.sort_${spell.vo.toLowerCase().replace(/[^a-z]+/g, '_')}`, feature: spell.vo, name: view.name, level: spell.level,
            label: spell.name, inText: spell.name,
            max: spell.free === 'pb' ? pb : 1, reset: 'long',
            use: `Lancer sans emplacement (${spell.source}).${spell.dc ? ` DD ${spell.dc}, attaque ${signed(spell.attack)}.` : ''}`
        });
    }
    return defs;
}

/** Première phrase du résumé, pour la ligne sous les cases (sans « Dès le niveau 5, ») */
function shortUse(trait) {
    const first = trait.text.split(/(?<=\.)\s/)[0].replace(/^Dès le niveau \d+, (\w)/, (_, c) => c.toUpperCase())
        .replace(/\s*\([^)]*\)/g, '');
    return first.length > 140 ? `${first.slice(0, 137)}…` : first;
}
