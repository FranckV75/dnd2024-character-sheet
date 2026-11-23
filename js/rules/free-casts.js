// =============================================================================
// FREE-CASTS.JS (règles) - Lancers gratuits (sans emplacement) proposés par le bouton « Lancer »
//
// Certaines capacités donnent un lancer de sort sans emplacement, suivi par des cases de la fiche.
// Ce module relie le sort à ces cases : aucune clé n'est ajoutée à la fiche.
//  - Dons (js/rules/feat-spells.js, clé « feat_uses ») : Initié à la magie, Affinité féerique,
//    Affinité ombreuse, Télépathe : une fois par sort, de nouveau après un repos long ;
//  - Espèce (js/rules/species.js, clé « subclass_uses », « species.sort_… ») : une fois ou bonus de
//    maîtrise fois, repos long ou repos court selon l'espèce ;
//  - Rôdeur, Ennemi juré (cases de la ressource de classe, « class_res_N ») : Marque du chasseur,
//    2 fois (3 au niveau 5, 4 au niveau 9, 5 au niveau 13, 6 au niveau 17), repos long
//    (PHB 2024, « Favored Enemy ») ;
//  - Classe (CLASS_COUNTERS de js/rules/subclass-uses.js, clé « subclass_uses ») : Châtiment de
//    paladin (Châtiment divin), Fidèle destrier (Appel de destrier), Communication avec le
//    protecteur (Contact avec les plans) : table CLASS_FREE_CASTS ; Arcanum mystique : une case par
//    niveau de sort (6 à 9), reliée au sort par son NIVEAU (arcanumFreeCast : la fiche ne sait pas
//    quel sort d'Arcanum le joueur a choisi) ;
//  - Magicien, sorts choisis (js/rules/spell-choices.js) : Sorts de prédilection (niveau 20), une
//    case par sort choisi, lancé au niveau 3, repos court ou long ; Maîtrise des sorts (niveau 18),
//    lancer à volonté au niveau le plus bas, sans case (kind 'atwill') ;
//  - Sous-classes (js/rules/subclass-uses.js, clé « subclass_uses ») : seulement les cases qui ne
//    servent qu'à lancer UN sort nommé (table SUBCLASS_FREE_CASTS). Les cases partagées entre
//    plusieurs sorts « chacun une fois » (Ancêtre divin, Créatures fantasmagoriques) ou entre deux
//    usages (Ressourcement) ne sont pas reliées : on ne saurait pas quel sort a été lancé. Mante de
//    majesté et Troisième œil non plus (une case, mais le sort se relance tant que dure l'effet).
// Fonctions pures : le personnage reçu n'est jamais modifié, elles renvoient un patch.
// =============================================================================

import { spellNameKey } from './spells.js';
import { featSpellGroups, setFeatSpellUsePatch } from './feat-spells.js';
import { subclassCounters, setSubclassUsesPatch, subclassUseKey } from './subclass-uses.js';
import { mysticArcanumLevel, isArcanumSpellLevel } from './spell-preparation.js';
import { chosenSpells } from './spell-choices.js';

/** Sort d'Ennemi juré (Rôdeur) : nom anglais, nom français */
const FAVORED_ENEMY_SPELL = Object.freeze(["Hunter's Mark", 'Marque du chasseur']);
const FAVORED_ENEMY_LABEL = 'Ennemi juré';

/**
 * Cases de classe qui servent à lancer un sort nommé sans emplacement :
 * « <classe>.<capacité> » (clé de subclass_uses) → noms du sort (anglais, français).
 */
export const CLASS_FREE_CASTS = Object.freeze({
    'paladin.chatiment_de_paladin': { spells: [['Divine Smite', 'Châtiment divin']] },
    'paladin.fidele_destrier': { spells: [['Find Steed', 'Appel de destrier']] },
    'warlock.communication_avec_le_protecteur': { spells: [['Contact Other Plane', 'Contact avec les plans']] }
});

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

/** Un lancer gratuit, au format de allFreeCasts */
function freeCast(id, kind, label, names, max, used, reset, extra = {}) {
    const spent = Math.max(0, Math.min(max, used));
    return { id, kind, label, names: keysOf(names), max, used: spent, left: max - spent, reset: reset === 'short' ? 'short' : 'long', ...extra };
}

/**
 * Tous les lancers gratuits d'un sort NOMMÉ suivis par la fiche, capacité par capacité (l'Arcanum
 * mystique, relié au niveau du sort, est à part : arcanumFreeCast).
 * @param {Object} character
 * @param {Object} derived - deriveCharacter(character)
 * @returns {Array<{ id: string, kind: 'feat'|'uses'|'class'|'atwill', label: string, names: string[],
 *   max: number, used: number, left: number, reset: 'long'|'short', atLevel?: number }>}
 *   id : identifiant du lancer (clé de la case) ; label : nom de la capacité, du don ou de l'espèce ;
 *   names : noms du sort (comparables : spellNameKey) ; left : lancers gratuits restants ;
 *   kind 'atwill' : à volonté, aucune case (Maîtrise des sorts) ; atLevel : niveau imposé du lancer
 */
export function allFreeCasts(character, derived) {
    const casts = [];
    const add = (...args) => casts.push(freeCast(...args));

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

    // Classe, espèce (sorts d'espèce) et sous-classe : cases d'un sort nommé
    const counters = subclassCounters(character, derived);
    for (const counter of counters) {
        if (counter.reset !== 'long' && counter.reset !== 'short') continue;
        if (counter.source === 'species') {
            if (!counter.key.startsWith('species.sort_')) continue;
            add(counter.key, 'uses', counter.featName, [counter.feature, counter.label], counter.max, counter.used, counter.reset);
            continue;
        }
        const table = counter.source === 'class' ? CLASS_FREE_CASTS : SUBCLASS_FREE_CASTS;
        if (!Object.hasOwn(table, counter.key)) continue;
        add(counter.key, 'uses', counter.label, table[counter.key].spells.flat(), counter.max, counter.used, counter.reset);
    }

    // Magicien : sorts choisis. Sans la base de sorts ici : le nom enregistré (nom anglais) suffit,
    // la fenêtre « Lancer » donne tous les noms du sort
    for (const spell of chosenSpells(character, derived)) {
        if (spell.cast === 'atwill') {
            add(`choice.${spell.key}`, 'atwill', spell.featureName, [spell.value], 1, 0, 'long', { atLevel: spell.atLevel });
        } else if (spell.cast === 'uses' && spell.uses) {
            const counter = counters.find(entry => entry.key === spell.uses);
            if (counter) add(counter.key, 'uses', spell.featureName, [spell.value], counter.max, counter.used, counter.reset, { atLevel: spell.atLevel });
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
 * Arcanum mystique (Occultiste, niveau 11+) : lancer gratuit d'un sort de ce NIVEAU (6 à 9), suivi
 * par la case « Arcanum mystique (niveau N) ». La fiche ne sait pas quel sort d'Arcanum le joueur a
 * choisi : tout sort de ce niveau partage la case de son niveau.
 * @param {Object} character
 * @param {Object} derived
 * @param {number|string} spellLevel
 * @returns {ReturnType<typeof allFreeCasts>[number]|null} null : pas un niveau d'Arcanum de ce personnage
 */
export function arcanumFreeCast(character, derived, spellLevel) {
    const level = Math.trunc(Number(spellLevel));
    if (!isArcanumSpellLevel(level, mysticArcanumLevel(derived?.classSlug, derived?.level))) return null;
    const key = subclassUseKey('warlock', `arcanum_${level}`);
    const counter = subclassCounters(character, derived).find(entry => entry.key === key);
    if (!counter) return null;
    return freeCast(key, 'uses', 'Arcanum mystique', [], counter.max, counter.used, counter.reset);
}

/**
 * Utiliser un lancer gratuit : coche la case de la capacité (la décocher annule). Lancer à volonté
 * (Maîtrise des sorts) : rien à cocher, patch vide.
 * @param {Object} character
 * @param {Object} derived
 * @param {string} id - allFreeCasts : id (ou arcanumFreeCast : id)
 * @returns {Object|null} patch, ou null s'il ne reste aucun lancer gratuit (ou capacité inconnue)
 */
export function useFreeCastPatch(character, derived, id) {
    const cast = allFreeCasts(character, derived).find(entry => entry.id === id)
        ?? [6, 7, 8, 9].map(level => arcanumFreeCast(character, derived, level)).find(entry => entry?.id === id);
    if (!cast || cast.left <= 0) return null;
    if (cast.kind === 'atwill') return {};
    if (cast.kind === 'feat') return setFeatSpellUsePatch(character, cast.id, true);
    if (cast.kind === 'uses') return setSubclassUsesPatch(character, cast.id, cast.used + 1, cast.max);
    // Ressource de classe : première case encore libre
    for (let i = 0; i < cast.max; i++) {
        if (character?.[`class_res_${i}`] !== true) return { [`class_res_${i}`]: true };
    }
    return null;
}
