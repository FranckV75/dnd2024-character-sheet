// =============================================================================
// SUBCLASS-FEATURES.JS (règles) - Capacités de sous-classe atteintes ou à venir
// (fonctions pures, sans DOM)
//
// Les textes sont dans js/data/subclass-features.js (inventaire : docs/SOUS_CLASSES.md).
// Une capacité est « atteinte » quand le niveau de classe est au moins celui de la capacité.
// SUBCLASS_AUTOMATION dit ce que la fiche fait déjà de chaque capacité (sinon : simple rappel).
// Règle validée par Franck : la fiche ne modifie jamais une valeur saisie à la main.
// =============================================================================

import { SUBCLASS_FEATURES } from '../data/subclass-features.js';
import { DD_RULES } from '../data/dd-rules.js';

/**
 * Ce que la fiche fait de chaque capacité qu'elle gère, par sous-classe puis identifiant :
 * { text, partial } — partial : seule une partie de la capacité est calculée, le reste est un rappel.
 */
export const SUBCLASS_AUTOMATION = Object.freeze({
    draconic_sorcery: {
        resilience_draconique: { text: 'CA sans armure calculée (10 + Dex + Cha) ; « dont +X PV » sous les PV maximum, à reporter vous-même.' }
    },
    college_of_dance: {
        jeu_de_jambes_eblouissant_defense_sans_armure: { text: 'CA sans armure calculée (10 + Dex + Cha, sans bouclier).' }
    },
    college_of_valor: {
        formation_martiale_armes: { text: 'Les armes de guerre comptent comme maîtrisées.' },
        formation_martiale_armures_et_focaliseur: { text: 'Rappel « À vérifier » près de la CA tant que les cases Intermédiaires et Boucliers ne sont pas cochées.', partial: true }
    },
    college_of_epic_muse: {
        egide_du_poete: { text: 'Rappel « À vérifier » près de la CA tant que la case Intermédiaires n\'est pas cochée.', partial: true }
    },
    the_odyssean: {
        soldat_vagabond: { text: 'Lance et Trident : maîtrise, attaque à la Dextérité et Attaque sournoise calculées.', partial: true }
    },
    way_of_the_shield_dancer: {
        technique_aresienne_bouclier_compatible: { text: 'Avec un bouclier : CA sans armure, Arts martiaux et DD de Lutte calculés.' }
    },
    champion: {
        style_de_combat_supplementaire: { text: 'Second emplacement « Style de combat » dans les dons (onglet Aptitudes & Traits).' }
    }
});

/** Niveau où la sous-classe s'obtient (D&D 2024 : niveau 3 pour toutes les classes) */
export const SUBCLASS_LEVEL = 3;

/**
 * Capacité de sous-classe enrichie pour l'affichage.
 * @typedef {Object} SubclassFeature
 * @property {string} id
 * @property {number} level
 * @property {number} [bookLevel] - niveau du livre de l'Odyssée, s'il diffère
 * @property {string} name
 * @property {string} [en]
 * @property {'calcul'|'bouton'|'rappel'} family
 * @property {string} text
 * @property {{ text: string, partial?: boolean } | null} automation - ce que la fiche en fait
 * @property {SubclassFeature[]} options - options de cette capacité (écoles du Philosophe)
 */

/**
 * Capacités de la sous-classe, réparties entre atteintes et à venir.
 * Les options d'une capacité (optionOf) sont rangées sous elle, pas dans les listes.
 * @param {{ subclass: string, level: number }} derived - deriveCharacter() (subclass : clé de DD_RULES.subclasses)
 * @returns {{ subclass: { key: string, name: string, source: string } | null,
 *             reached: SubclassFeature[], upcoming: SubclassFeature[] }}
 */
export function subclassFeatures({ subclass = '', level = 1 } = {}) {
    const info = DD_RULES.subclasses[subclass];
    const list = Object.hasOwn(SUBCLASS_FEATURES, subclass) ? SUBCLASS_FEATURES[subclass] : null;
    if (!info || !list) return { subclass: null, reached: [], upcoming: [] };
    const automation = SUBCLASS_AUTOMATION[subclass] ?? {};
    const shape = (feature) => ({
        ...feature,
        automation: automation[feature.id] ?? null,
        options: list.filter(option => option.optionOf === feature.id).map(option => ({ ...option, automation: null, options: [] }))
    });
    const main = list.filter(feature => !feature.optionOf).map(shape);
    return {
        subclass: { key: subclass, name: info.nameFr, source: info.source },
        reached: main.filter(feature => feature.level <= level),
        upcoming: main.filter(feature => feature.level > level)
    };
}

/**
 * Libellé court de ce que la fiche fait d'une capacité : 'calc' (calculée), 'partial' (en partie),
 * 'reminder' (rappel seulement).
 * @param {SubclassFeature} feature
 * @returns {'calc'|'partial'|'reminder'}
 */
export function automationKind(feature) {
    if (!feature?.automation) return 'reminder';
    return feature.automation.partial ? 'partial' : 'calc';
}
