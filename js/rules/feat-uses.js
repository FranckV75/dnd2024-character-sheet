// =============================================================================
// FEAT-USES.JS (règles) - Dons à usages limités : cases cochées, vidées au repos
//
// Sauvegarde : clé facultative « feat_uses » = { <clé du compteur>: nombre d'usages dépensés }, par
// exemple { chanceux: 1 }. La clé du compteur est l'id du don, ou une clé à part quand un don a
// plusieurs groupes de cases (« faveur_de_recuperation_rempart », champ « feat » du compteur). Absente des anciennes fiches (= rien de dépensé). Seuls les dons atteints
// (reachedFeatIds) ont des cases ; la valeur d'un don retiré reste enregistrée telle quelle.
//
// Règles du Player's Handbook 2024 anglais :
//  - Chanceux (« Lucky », p. 201) : points de Chance = bonus de maîtrise, tous récupérés à la fin
//    d'un Repos long ;
//  - Tueur de mages (« Mage Slayer », p. 205) : Esprit préservé (« Guarded Mind »), une fois, de
//    nouveau disponible à la fin d'un Repos court ou long ;
//  - Magie rituelle (« Ritual Caster », p. 206) : Rituel rapide (« Quick Ritual »), une fois par
//    Repos long ;
//  - Faveur de récupération (« Boon of Recovery », p. 211) : réserve de dix d10 (« Recover
//    Vitality »), toute rendue à la fin d'un Repos long ; Dernier rempart (« Last Stand »), une fois
//    par Repos long ;
//  - Faveur du destin (« Boon of Fate », p. 210) : une fois, de nouveau disponible quand vous lancez
//    l'Initiative ou à la fin d'un Repos court ou long.
// Les lancers gratuits des sorts de dons (lot 6) sont rangés dans la même clé, sous des clés
// « <don>@<niveau>:<partie> » : voir js/rules/feat-spells.js (ils n'ont pas de compteur ici).
// Fonctions pures : le personnage reçu n'est jamais modifié, elles renvoient un patch.
// =============================================================================

import { featSlots, featName } from './feats.js';

export const FEAT_USES_KEY = 'feat_uses';

/**
 * Dons à usages limités, rangés par clé de sauvegarde.
 *  - feat : id du don quand la clé n'est pas l'id du don (second groupe de cases du même don) ;
 *  - label : nom des cases ; inText : le même au milieu d'une phrase ; max(derived) : nombre de cases ; reset : 'long' (repos long seulement)
 *    ou 'short' (repos court ou long) ; use : à quoi sert une case (phrase courte).
 */
export const FEAT_COUNTERS = Object.freeze({
    chanceux: {
        label: 'Points de Chance',
        inText: 'points de Chance',
        max: ({ pb }) => pb,
        reset: 'long',
        use: "1 point : Avantage à un de vos jets de d20, ou Désavantage à un jet d'attaque contre vous."
    },
    tueur_de_mages: {
        label: 'Esprit préservé',
        inText: 'Esprit préservé',
        max: () => 1,
        reset: 'short',
        use: "Une sauvegarde d'Intelligence, de Sagesse ou de Charisme ratée devient un succès."
    },
    // Chef cuisinier — PHB 2024 « Chef », p. 202 : friandises = bonus de maîtrise, faites au repos long
    chef_cuisinier: {
        label: 'Friandises',
        inText: 'friandises',
        max: ({ pb }) => pb,
        reset: 'long',
        use: "Action Bonus (toute créature) : une friandise donne autant de PV temporaires que votre bonus de maîtrise ; elles se gâtent après 8 heures."
    },
    magie_rituelle: {
        label: 'Rituel rapide',
        inText: 'Rituel rapide',
        max: () => 1,
        reset: 'long',
        use: 'Lancer un sort rituel préparé en temps normal, sans emplacement de sort.'
    },
    faveur_de_recuperation: {
        label: 'Dés de vitalité (d10)',
        inText: 'dés de vitalité',
        max: () => 10,
        reset: 'long',
        use: 'Action Bonus : lancez autant de ces d10 que vous voulez et regagnez le total en PV.'
    },
    faveur_de_recuperation_rempart: {
        feat: 'faveur_de_recuperation',
        label: 'Dernier rempart',
        inText: 'Dernier rempart',
        max: () => 1,
        reset: 'long',
        use: 'Réduit à 0 PV : vous tombez à 1 PV à la place et regagnez la moitié de vos PV max.'
    },
    faveur_du_destin: {
        label: 'Destin amélioré',
        inText: 'Destin amélioré',
        max: () => 1,
        reset: 'short',
        use: "2d4 en bonus ou en malus au test d20 réussi ou raté d'une créature à 18 m (vous compris) ; aussi rendu quand vous lancez l'Initiative."
    }
});

/** Texte du rechargement (« repos long », « repos court ou long ») */
export const RESET_TEXT = Object.freeze({ long: 'repos long', short: 'repos court ou long' });

/** État enregistré, toujours un objet (valeur absente ou illisible = rien de dépensé) */
export function featUsesState(character) {
    const value = character?.[FEAT_USES_KEY];
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

/** Id du don d'un compteur */
const counterFeat = (key) => FEAT_COUNTERS[key].feat ?? key;

/** Nombre entier entre 0 et max (une valeur illisible vaut 0) */
function clampUses(value, max) {
    const n = Math.trunc(Number(value));
    return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0;
}

/**
 * Compteurs des dons atteints, dans l'ordre des emplacements (un don pris deux fois n'a ses cases
 * qu'une fois ; un don peut avoir plusieurs compteurs, dans l'ordre de FEAT_COUNTERS).
 * @param {Object} character
 * @param {{ pb: number }} derived - deriveCharacter(character)
 * @returns {Array<{ key: string, featId: string, featName: string, level: number, label: string, max: number,
 *   used: number, reset: 'long'|'short', resetText: string, use: string }>}
 *   key : clé dans feat_uses ; level : niveau de l'emplacement du don ; used : cases cochées (ramené entre 0 et max)
 */
export function featCounters(character, derived) {
    const state = featUsesState(character);
    const seen = new Set();
    const counters = [];
    for (const slot of featSlots(character)) {
        if (!slot.reached || seen.has(slot.featId)) continue;
        seen.add(slot.featId);
        for (const key of Object.keys(FEAT_COUNTERS).filter(k => counterFeat(k) === slot.featId)) {
            const def = FEAT_COUNTERS[key];
            const max = Math.max(0, Math.trunc(def.max(derived)) || 0);
            counters.push({
                key,
                featId: slot.featId,
                featName: featName(slot.featId),
                level: slot.level,
                label: def.label,
                max,
                used: clampUses(state[key], max),
                reset: def.reset,
                resetText: RESET_TEXT[def.reset],
                use: def.use
            });
        }
    }
    return counters;
}

/**
 * Patch qui enregistre le nombre de cases cochées d'un compteur (les autres ne changent pas).
 * @param {Object} character
 * @param {string} key - clé du compteur (featCounters : key)
 * @param {number} used - ramené entre 0 et max
 * @param {number} max
 * @returns {Object} { feat_uses: {...} }
 */
export function setFeatUsesPatch(character, key, used, max) {
    return { [FEAT_USES_KEY]: { ...featUsesState(character), [key]: clampUses(used, max) } };
}

/**
 * Cases vidées par un repos : repos long = tous les dons ; repos court = ceux qui se rechargent
 * aussi au repos court (reset 'short'). Les dons retirés ou pas encore atteints sont vidés aussi,
 * mais seuls les dons atteints sont annoncés (restored).
 * @param {Object} character
 * @param {{ pb: number }} derived
 * @param {'short'|'long'} kind
 * @returns {{ patch: Object, restored: Array<{ featId: string, featName: string, label: string, inText: string, count: number }> }}
 *   patch vide si rien n'est coché
 */
export function restFeatUses(character, derived, kind) {
    const recharges = (key) => kind === 'long' || FEAT_COUNTERS[key].reset === 'short';
    const restored = featCounters(character, derived)
        .filter(counter => counter.used > 0 && recharges(counter.key))
        .map(({ key, featId, featName: name, label, used }) => ({ featId, featName: name, label, inText: FEAT_COUNTERS[key].inText, count: used }));
    // Un don retiré ou pas encore atteint (niveau baissé) est vidé lui aussi : remis plus tard, il ne
    // doit pas revenir avec des cases dépensées avant ce repos. La clé reste (valeur 0).
    const state = featUsesState(character);
    const stale = Object.keys(state).filter(key => Object.hasOwn(FEAT_COUNTERS, key)
        && recharges(key) && clampUses(state[key], Infinity) > 0);
    if (!stale.length) return { patch: {}, restored };
    const next = { ...state };
    for (const key of stale) next[key] = 0;
    return { patch: { [FEAT_USES_KEY]: next }, restored };
}
