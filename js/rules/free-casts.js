// =============================================================================
// FREE-CASTS.JS (règles) - Lancers gratuits (sans emplacement) proposés par le bouton « Lancer »
//
// Certaines capacités donnent un lancer de sort sans emplacement, déjà suivi par des cases de la
// fiche. Ce module relie le sort à ces cases EXISTANTES : aucune clé n'est ajoutée à la fiche.
//  - Dons (js/rules/feat-spells.js, clé « feat_uses ») : Initié à la magie, Affinité féerique,
//    Affinité ombreuse, Télépathe : une fois par sort, de nouveau après un repos long ;
//  - Espèce (js/rules/species.js, clé « subclass_uses », « species.sort_… ») : une fois ou bonus de
//    maîtrise fois, repos long ou repos court selon l'espèce ;
//  - Rôdeur, Ennemi juré (cases de la ressource de classe, « class_res_N ») : Marque du chasseur,
//    2 fois (3 au niveau 5, 4 au niveau 9, 5 au niveau 13, 6 au niveau 17), repos long
//    (PHB 2024, « Favored Enemy ») ;
//  - Sous-classes (js/rules/subclass-uses.js, clé « subclass_uses ») : seulement les cases qui ne
//    servent qu'à lancer UN sort nommé (table SUBCLASS_FREE_CASTS). Les cases partagées entre
//    plusieurs sorts « chacun une fois » (Ancêtre divin, Créatures fantasmagoriques) ou entre deux
//    usages (Ressourcement) ne sont pas reliées : on ne saurait pas quel sort a été lancé. Mante de
//    majesté et Troisième œil non plus (une case, mais le sort se relance tant que dure l'effet).
// Capacités sans case dans la fiche (Châtiment de paladin, Fidèle destrier, Arcanum mystique,
// Communication avec le protecteur) : rien n'est proposé ici.
// Fonctions pures : le personnage reçu n'est jamais modifié, elles renvoient un patch.
// =============================================================================

import { spellNameKey } from './spells.js';
import { featSpellGroups, setFeatSpellUsePatch } from './feat-spells.js';
import { subclassCounters, setSubclassUsesPatch } from './subclass-uses.js';

/** Sort d'Ennemi juré (Rôdeur) : nom anglais, nom français */
const FAVORED_ENEMY_SPELL = Object.freeze(["Hunter's Mark", 'Marque du chasseur']);
const FAVORED_ENEMY_LABEL = 'Ennemi juré';

/**
 * Cases de sous-classe qui servent à lancer un sort nommé sans emplacement :
 * « <sous-classe>.<capacité> » (clé de subclass_uses) → noms du sort (anglais, français).
 * Empirisme : une seule case pour l'un des deux sorts, au choix.
 */
export const SUBCLASS_FREE_CASTS = Object.freeze({
    'circle_of_the_stars.carte_stellaire': { spells: [['Guiding Bolt', 'Rayon traçant']] },
    'psi_warrior.maitre_telekinesiste': { spells: [['Telekinesis', 'Télékinésie']] },
    'fey_wanderer.renforts_feeriques': { spells: [['Summon Fey', 'Convocation de fée']] },
    'fey_wanderer.errant_des_brumes': { spells: [['Misty Step', 'Foulée brumeuse']] },
    'draconic_sorcery.compagnon_draconique': { spells: [['Summon Dragon', 'Convocation de dragon']] },
    'archfey_patron.foulees_feeriques': { spells: [['Misty Step', 'Foulée brumeuse']] },
    'academy_philosopher.empirisme': { spells: [['Identify', 'Identification'], ['Detect Magic', 'Détection de la magie']] }
});

/** Quand la case revient, dit dans la fenêtre « Lancer » */
export const FREE_CAST_RESET_TEXT = Object.freeze({
    long: 'revient après un repos long',
    short: 'revient après un repos court ou long'
});

const keysOf = (names) => names.filter(Boolean).map(spellNameKey).filter(Boolean);

/**
 * Tous les lancers gratuits suivis par la fiche, capacité par capacité.
 * @param {Object} character
 * @param {Object} derived - deriveCharacter(character)
 * @returns {Array<{ id: string, kind: 'feat'|'uses'|'class', label: string, names: string[],
 *   max: number, used: number, left: number, reset: 'long'|'short' }>}
 *   id : identifiant du lancer (clé de la case) ; label : nom de la capacité, du don ou de l'espèce ;
 *   names : noms du sort (comparables : spellNameKey) ; left : lancers gratuits restants
 */
export function allFreeCasts(character, derived) {
    const casts = [];
    const add = (id, kind, label, names, max, used, reset) => {
        const spent = Math.max(0, Math.min(max, used));
        casts.push({ id, kind, label, names: keysOf(names), max, used: spent, left: max - spent, reset: reset === 'short' ? 'short' : 'long' });
    };

    // Rôdeur : Marque du chasseur, cases « Ennemi juré » de la ressource de classe
    const resource = derived?.classResource;
    if (derived?.classSlug === 'ranger' && resource?.label === FAVORED_ENEMY_LABEL && resource.count > 0) {
        let used = 0;
        for (let i = 0; i < resource.count; i++) if (character?.[`class_res_${i}`] === true) used++;
        add('class.ennemi_jure', 'class', FAVORED_ENEMY_LABEL, FAVORED_ENEMY_SPELL, resource.count, used, 'long');
    }

    // Dons : une case par sort
    for (const group of featSpellGroups(character, derived)) {
        for (const spell of group.spells) {
            if (!spell.free) continue;
            add(spell.free.key, 'feat', group.featName, [spell.vo, spell.name], 1, spell.free.used ? 1 : 0, 'long');
        }
    }

    // Espèce (sorts d'espèce) et sous-classe (cases d'un sort nommé)
    for (const counter of subclassCounters(character, derived)) {
        if (counter.reset !== 'long' && counter.reset !== 'short') continue;
        if (counter.source === 'species') {
            if (!counter.key.startsWith('species.sort_')) continue;
            add(counter.key, 'uses', counter.featName, [counter.feature, counter.label], counter.max, counter.used, counter.reset);
        } else if (counter.source === 'subclass' && Object.hasOwn(SUBCLASS_FREE_CASTS, counter.key)) {
            const rule = SUBCLASS_FREE_CASTS[counter.key];
            add(counter.key, 'uses', counter.label, rule.spells.flat(), counter.max, counter.used, counter.reset);
        }
    }
    return casts;
}

/**
 * Lancers gratuits d'un sort : ceux dont un des noms est celui du sort.
 * @param {Object} character
 * @param {Object} derived
 * @param {string[]} names - noms du sort (nom noté, noms français de la base, nom anglais)
 * @returns {ReturnType<typeof allFreeCasts>} [] : ce sort n'a pas de lancer gratuit
 */
export function freeCastsFor(character, derived, names) {
    const wanted = new Set(keysOf(Array.isArray(names) ? names : [names]));
    if (!wanted.size) return [];
    return allFreeCasts(character, derived).filter(cast => cast.names.some(name => wanted.has(name)));
}

/**
 * Utiliser un lancer gratuit : coche la case existante de la capacité (la décocher annule).
 * @param {Object} character
 * @param {Object} derived
 * @param {string} id - allFreeCasts : id
 * @returns {Object|null} patch, ou null s'il ne reste aucun lancer gratuit (ou capacité inconnue)
 */
export function useFreeCastPatch(character, derived, id) {
    const cast = allFreeCasts(character, derived).find(entry => entry.id === id);
    if (!cast || cast.left <= 0) return null;
    if (cast.kind === 'feat') return setFeatSpellUsePatch(character, cast.id, true);
    if (cast.kind === 'uses') return setSubclassUsesPatch(character, cast.id, cast.used + 1, cast.max);
    // Ressource de classe : première case encore libre
    for (let i = 0; i < cast.max; i++) {
        if (character?.[`class_res_${i}`] !== true) return { [`class_res_${i}`]: true };
    }
    return null;
}
