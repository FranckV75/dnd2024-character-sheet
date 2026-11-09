// =============================================================================
// SUBCLASS-USES.JS (règles) - Capacités de sous-classe à usages limités : cases cochées, vidées
// au repos ou à la fin de la Rage (lot 2, docs/SOUS_CLASSES.md)
//
// Sauvegarde : clé facultative « subclass_uses » = { « <sous-classe>.<capacité> »: usages dépensés },
// par exemple { "path_of_the_zealot.guerrier_des_dieux": 2 }. Absente des anciennes fiches (= rien de
// dépensé) ; l'ancien site (v3) l'ignore (V4_ONLY_KEYS, js/cloud/sync.js). La valeur d'une capacité
// qui n'est plus atteinte (niveau baissé, autre sous-classe) reste enregistrée telle quelle.
//
// Règles du Player's Handbook 2024 anglais (vérifiées dans le manuel, chapitre des classes) :
//  - Voie du Zélote (« Path of the Zealot ») : Guerrier des dieux (« Warrior of the Gods »), réserve
//    de d12 : 4, 5 au niveau 6, 6 au niveau 12, 7 au niveau 17, toute rendue au Repos long ;
//    Focalisation fanatique (« Fanatical Focus »), une fois par Rage active ; Présence zélée
//    (« Zealous Presence »), une fois par Repos long, ou rendue en dépensant une Rage (le joueur
//    décoche alors la case lui-même) ; Rage des dieux (« Rage of the Gods »), une fois par Repos long ;
//  - Serments du Paladin : Défense glorieuse (Gloire, niveau 15), Charisme fois (minimum 1) par Repos
//    long ; Sentinelle immortelle (Anciens, niveau 15) ; capacités du niveau 20 (Nimbe sacré, Légende
//    vivante, Champion antique, Ange vengeur), une fois par Repos long ;
//  - Serment des Seigneurs Dragons (Odyssée) : Lien indestructible, une fois par Repos long.
// Fonctions pures : le personnage reçu n'est jamais modifié, elles renvoient un patch.
// =============================================================================

import { SUBCLASS_FEATURES } from '../data/subclass-features.js';
import { DD_RULES } from '../data/dd-rules.js';
import { RESET_TEXT } from './feat-uses.js';

export const SUBCLASS_USES_KEY = 'subclass_uses';

/** Une fois par Repos long */
const once = () => 1;

/**
 * Capacités à cases, par sous-classe (clé de DD_RULES.subclasses).
 *  - feature : id de la capacité (js/data/subclass-features.js) ; elle doit être atteinte ;
 *  - label : nom des cases ; inText : le même au milieu d'une phrase ; max(derived) : nombre de cases ;
 *  - reset : 'long' (repos long), 'short' (repos court ou long), 'rage' (fin de la Rage ou tout repos) ;
 *  - use : à quoi sert une case (phrase courte).
 */
export const SUBCLASS_COUNTERS = Object.freeze({
    path_of_the_zealot: [
        {
            feature: 'guerrier_des_dieux',
            label: 'Guerrier des dieux (d12)',
            inText: 'dés de Guerrier des dieux',
            max: ({ level }) => (level >= 17 ? 7 : level >= 12 ? 6 : level >= 6 ? 5 : 4),
            reset: 'long',
            use: 'Action Bonus : lancez autant de ces d12 que vous voulez et regagnez le total en PV.'
        },
        {
            feature: 'focalisation_fanatique',
            label: 'Focalisation fanatique',
            inText: 'Focalisation fanatique',
            max: once,
            reset: 'rage',
            use: 'Sauvegarde ratée pendant la Rage : relancez-la avec votre bonus de dégâts de Rage en plus.'
        },
        {
            feature: 'presence_zelee',
            label: 'Présence zélée',
            inText: 'Présence zélée',
            max: once,
            reset: 'long',
            use: 'Action Bonus : jusqu\'à 10 alliés à 18 m ont l\'Avantage aux attaques et sauvegardes. Dépenser une Rage la rend (décochez).'
        },
        {
            feature: 'rage_des_dieux',
            label: 'Rage des dieux',
            inText: 'Rage des dieux',
            max: once,
            reset: 'long',
            use: 'En entrant en Rage : forme divine 1 minute (vol, résistances, Revivification).'
        }
    ],
    oath_of_devotion: [
        { feature: 'nimbe_sacre', label: 'Nimbe sacré', inText: 'Nimbe sacré', max: once, reset: 'long',
            use: 'Action Bonus, 10 minutes. Un emplacement de niveau 5 la rend (décochez).' }
    ],
    oath_of_glory: [
        { feature: 'defense_glorieuse', label: 'Défense glorieuse', inText: 'Défense glorieuse',
            max: ({ mods }) => Math.max(1, Number(mods?.cha) || 0), reset: 'long',
            use: 'Réaction : la cible touchée à 3 m gagne votre Charisme en CA contre cette attaque.' },
        { feature: 'legende_vivante', label: 'Légende vivante', inText: 'Légende vivante', max: once, reset: 'long',
            use: 'Action Bonus, 10 minutes. Un emplacement de niveau 5 la rend (décochez).' }
    ],
    oath_of_the_ancients: [
        { feature: 'sentinelle_immortelle', label: 'Sentinelle immortelle', inText: 'Sentinelle immortelle', max: once, reset: 'long',
            use: 'Tombé à 0 PV sans mourir : restez à 1 PV et regagnez 3 fois votre niveau de Paladin en PV.' },
        { feature: 'champion_antique', label: 'Champion antique', inText: 'Champion antique', max: once, reset: 'long',
            use: 'Action Bonus, 1 minute. Un emplacement de niveau 5 la rend (décochez).' }
    ],
    oath_of_vengeance: [
        { feature: 'ange_vengeur', label: 'Ange vengeur', inText: 'Ange vengeur', max: once, reset: 'long',
            use: 'Action Bonus, 10 minutes. Un emplacement de niveau 5 la rend (décochez).' }
    ],
    oath_of_the_dragonlords: [
        { feature: 'lien_indestructible', label: 'Lien indestructible', inText: 'Lien indestructible', max: once, reset: 'long',
            use: 'Votre dragon rate une sauvegarde : il la réussit à la place.' }
    ]
});

/** Texte du rechargement, Rage comprise */
export const SUBCLASS_RESET_TEXT = Object.freeze({ ...RESET_TEXT, rage: 'fin de la Rage' });

/** Clé d'enregistrement d'une capacité : « path_of_the_zealot.guerrier_des_dieux » */
export const subclassUseKey = (subclass, feature) => `${subclass}.${feature}`;

/** État enregistré, toujours un objet (valeur absente ou illisible = rien de dépensé) */
export function subclassUsesState(character) {
    const value = character?.[SUBCLASS_USES_KEY];
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

/** Nombre entier entre 0 et max (une valeur illisible vaut 0) */
function clampUses(value, max) {
    const n = Math.trunc(Number(value));
    return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0;
}

/** Toutes les définitions, avec leur clé d'enregistrement */
const ALL_COUNTERS = Object.entries(SUBCLASS_COUNTERS)
    .flatMap(([subclass, list]) => list.map(def => ({ ...def, subclass, key: subclassUseKey(subclass, def.feature) })));

/**
 * Cases des capacités atteintes de la sous-classe, dans l'ordre de SUBCLASS_COUNTERS.
 * Même forme que featCounters (js/rules/feat-uses.js), avec source 'subclass' ; featName est le nom
 * de la sous-classe (« Voie du Zélote »), affiché sous les cases et dans le résumé des repos.
 * @param {Object} character
 * @param {{ subclass: string, level: number, pb: number, mods: Object }} derived - deriveCharacter(character)
 * @returns {Array<{ key: string, source: 'subclass', feature: string, featName: string, level: number, label: string,
 *   max: number, used: number, reset: 'long'|'short'|'rage', resetText: string, use: string }>}
 */
export function subclassCounters(character, derived) {
    const subclass = derived?.subclass ?? '';
    if (!Object.hasOwn(SUBCLASS_COUNTERS, subclass)) return [];
    const features = SUBCLASS_FEATURES[subclass] ?? [];
    const state = subclassUsesState(character);
    return ALL_COUNTERS.filter(def => def.subclass === subclass).flatMap(def => {
        const feature = features.find(f => f.id === def.feature);
        if (!feature || feature.level > (derived.level ?? 1)) return [];
        const max = Math.max(0, Math.trunc(def.max(derived)) || 0);
        return [{
            key: def.key,
            source: 'subclass',
            feature: def.feature,
            featName: DD_RULES.subclasses[subclass]?.nameFr ?? feature.name,
            level: feature.level,
            label: def.label,
            max,
            used: clampUses(state[def.key], max),
            reset: def.reset,
            resetText: SUBCLASS_RESET_TEXT[def.reset],
            use: def.use
        }];
    });
}

/**
 * Patch qui enregistre le nombre de cases cochées d'une capacité (les autres ne changent pas).
 * @param {Object} character
 * @param {string} key - subclassCounters : key
 * @param {number} used - ramené entre 0 et max
 * @param {number} max
 * @returns {Object} { subclass_uses: {...} }
 */
export function setSubclassUsesPatch(character, key, used, max) {
    return { [SUBCLASS_USES_KEY]: { ...subclassUsesState(character), [key]: clampUses(used, max) } };
}

/**
 * Cases vidées : 'rage' (fin de la Rage) = celles d'une fois par Rage ; repos court = aussi celles
 * qui reviennent au repos court (la Rage est finie aussi) ; repos long = toutes. Les capacités qui ne
 * sont plus atteintes sont vidées elles aussi, mais seules les atteintes sont annoncées (restored).
 * @param {Object} character
 * @param {Object} derived - deriveCharacter(character)
 * @param {'rage'|'short'|'long'} kind
 * @returns {{ patch: Object, restored: Array<{ featId: string, featName: string, label: string, inText: string, count: number }> }}
 *   patch vide si rien n'est à vider
 */
export function restSubclassUses(character, derived, kind) {
    const recharges = (reset) => kind === 'long' || reset === 'rage' || (kind === 'short' && reset === 'short');
    const restored = subclassCounters(character, derived)
        .filter(counter => counter.used > 0 && recharges(counter.reset))
        .map(({ feature, featName, label, used, key }) => ({
            featId: feature, featName, label, inText: ALL_COUNTERS.find(def => def.key === key).inText, count: used
        }));
    const state = subclassUsesState(character);
    const stale = ALL_COUNTERS.filter(def => recharges(def.reset) && clampUses(state[def.key], Infinity) > 0);
    if (!stale.length) return { patch: {}, restored };
    const next = { ...state };
    for (const def of stale) next[def.key] = 0;
    return { patch: { [SUBCLASS_USES_KEY]: next }, restored };
}

/**
 * Le bouton Rage s'éteint (onglet Combat) : les cases « une fois par Rage » se vident
 * (Focalisation fanatique du Zélote). Rien si la Rage n'était pas allumée ou le reste.
 * @param {Object} character - fiche avant le changement (combat_buffs actuel)
 * @param {Object} derived - deriveCharacter(character)
 * @param {Object} nextBuffs - combat_buffs après le changement
 * @returns {Object} patch (vide si rien ne change)
 */
export function rageEndPatch(character, derived, nextBuffs) {
    if (character?.combat_buffs?.rage !== true || nextBuffs?.rage === true) return {};
    return restSubclassUses(character, derived, 'rage').patch;
}
