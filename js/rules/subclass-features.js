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
import { SUBCLASS_SPELLS } from '../data/subclass-spells.js';
import { getRageBonus } from './logic.js';
import { normalizeText } from './spells.js';

/** Signe devant un nombre : « +3 », « -1 » */
const signed = (n) => `${n >= 0 ? '+' : ''}${n}`;
/** Modificateur de Charisme (0 s'il manque) */
const chaMod = (derived) => Number(derived?.mods?.cha) || 0;
/**
 * DD des sorts de Paladin = DD du Conduit divin (PHB 2024, Paladin, « Channel Divinity » : le DD
 * d'un effet du Conduit divin est celui des sorts de la classe) : 8 + maîtrise + Charisme.
 */
const paladinDC = (derived) => 8 + (Number(derived?.pb) || 2) + chaMod(derived);
const SPELLS_TEXT = 'Bloc « Sorts de sous-classe » de l\'onglet Magie : toujours préparés, hors du nombre de sorts préparés.';
const COMBAT_BOXES = 'Case dans l\'onglet Combat, vidée au repos long.';

/**
 * Ce que la fiche fait de chaque capacité qu'elle gère, par sous-classe puis identifiant :
 * { text, partial } — partial : seule une partie de la capacité est calculée, le reste est un rappel.
 * text peut être une fonction de deriveCharacter() quand il contient un nombre calculé (DD, bonus).
 * Les capacités qui donnent des sorts (SPELL_FEATURES) sont ajoutées à la suite.
 */
const MANUAL_AUTOMATION = {
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
    },
    // Lot 2 : Voie du Zélote (Korgul)
    path_of_the_zealot: {
        fureur_divine: { text: (d) => `Bouton Rage allumé (onglet Combat) : +${divineFuryDie(d) || '1d6'} (Fureur divine) sur chaque arme et la Frappe à mains nues ; une seule fois par tour, sur la première créature touchée.` },
        guerrier_des_dieux: { text: 'Réserve de d12 en cases dans l\'onglet Combat, rendue au repos long.' },
        focalisation_fanatique: { text: (d) => `Case dans l'onglet Combat, vidée quand le bouton Rage s'éteint ou au repos ; bonus à la relance : +${getRageBonus(d.level)}.` },
        presence_zelee: { text: 'Case dans l\'onglet Combat, vidée au repos long (décochez-la si vous dépensez une Rage pour la récupérer).' },
        rage_des_dieux: { text: COMBAT_BOXES, partial: true }
    },
    // Lot 2 : serments du Paladin (Iria)
    oath_of_devotion: {
        arme_sacree: { text: (d) => `Bonus à l'attaque avec l'arme imprégnée : ${signed(Math.max(1, chaMod(d)))} (Charisme, minimum +1), à ajouter vous-même pendant les 10 minutes.`, partial: true },
        nimbe_sacre: { text: (d) => `Dégâts radiants de l'aura : ${chaMod(d) + (Number(d.pb) || 2)} (Charisme + maîtrise). ${COMBAT_BOXES}`, partial: true }
    },
    oath_of_glory: {
        chatiment_inspirant: { text: (d) => `PV temporaires à répartir : 2d8 + ${d.level}.`, partial: true },
        defense_glorieuse: { text: (d) => `Bonus à la CA : ${signed(Math.max(1, chaMod(d)))} ; ${Math.max(1, chaMod(d))} case${Math.max(1, chaMod(d)) > 1 ? 's' : ''} dans l'onglet Combat, vidée${Math.max(1, chaMod(d)) > 1 ? 's' : ''} au repos long.`, partial: true },
        legende_vivante: { text: COMBAT_BOXES, partial: true }
    },
    oath_of_the_ancients: {
        courroux_de_la_nature: { text: (d) => `Sauvegarde de Force DD ${paladinDC(d)} (DD de vos sorts de Paladin).`, partial: true },
        sentinelle_immortelle: { text: (d) => `PV regagnés : ${3 * d.level}. ${COMBAT_BOXES}`, partial: true },
        champion_antique: { text: COMBAT_BOXES, partial: true }
    },
    oath_of_vengeance: {
        ange_vengeur: { text: COMBAT_BOXES, partial: true }
    },
    // Odyssée : DD 14 dans le livre (règles de 2014) ; décision de Franck : règle 2024, DD des sorts
    oath_of_the_dragonlords: {
        fureur_du_dragon: { text: (d) => `Sauvegarde de Sagesse DD ${paladinDC(d)} (DD de vos sorts de Paladin, règle 2024 ; le livre de l'Odyssée dit 14).`, partial: true },
        mepris_des_laches: { text: (d) => `Sauvegarde de Charisme DD ${paladinDC(d)} (DD de vos sorts de Paladin, règle 2024 ; le livre de l'Odyssée dit 14).`, partial: true },
        lien_indestructible: { text: COMBAT_BOXES, partial: true }
    }
};

/**
 * Capacités qui donnent des sorts du bloc « Sorts de sous-classe » (js/data/subclass-spells.js) :
 * true = la capacité se résume à ces sorts (« Calculé ») ; un texte = le reste de la capacité, qui
 * reste un rappel (« En partie »).
 */
const SPELL_FEATURES = {
    path_of_the_wild_heart: { langage_des_betes: true, langage_de_la_nature: true },
    college_of_glamour: { magie_enjoleuse_sorts_toujours_prepares: true, manteau_de_majeste: 'Injonction sans emplacement : rappel.' },
    life_domain: { sorts_du_domaine_de_la_vie: true },
    light_domain: { sorts_du_domaine_de_la_lumiere: true },
    trickery_domain: { sorts_du_domaine_de_la_supercherie: true },
    war_domain: { sorts_du_domaine_de_la_guerre: true },
    prophecy_domain: { sorts_du_domaine_de_la_prophetie: true, conscience_etendue: 'Maîtrise de Perception : à cocher vous-même.' },
    circle_of_the_moon: { sorts_du_cercle_de_la_lune: true },
    circle_of_the_sea: { sorts_du_cercle_de_la_mer: true },
    circle_of_the_stars: { carte_stellaire: 'Lancers gratuits de Rayon traçant : rappel.' },
    circle_of_the_land: { sorts_du_cercle_de_la_terre: true },
    circle_of_sacrifice: { rituel_de_sacrifice: 'Immolation et bonus aux dégâts : rappel.', sagesse_des_astres: 'Rameaux et Cercle de pierres : rappel.' },
    psi_warrior: { maitre_telekinesiste: 'Lancer gratuit et attaque en action bonus : rappel.' },
    warrior_of_shadow: { arts_de_l_ombre_tenebres: 'Vision dans les Ténèbres et déplacement de la zone : rappel.', arts_de_l_ombre_chimeres_d_ombre: true },
    warrior_of_the_elements: { manipulation_des_elements: true },
    fey_wanderer: { sorts_de_l_errant_feerique: true },
    gloom_stalker: { sorts_du_traqueur_d_ombre: true },
    aberrant_sorcery: { sorts_psioniques: true },
    clockwork_sorcery: { sorts_mecaniques: true },
    draconic_sorcery: { sorts_draconiques: true },
    archfey_patron: { sorts_de_l_archifee: true },
    celestial_patron: { sorts_celestes: true },
    fiend_patron: { sorts_du_fielon: true },
    great_old_one_patron: { sorts_du_grand_ancien: true, malefice_occulte: 'Désavantage aux sauvegardes de la cible : rappel.' },
    abjurer: { briseur_de_sorts: 'Action bonus, maîtrise au test et emplacement gardé : rappel.' },
    illusionist: { illusions_ameliorees: 'Composantes et portée des illusions : rappel.', creatures_fantasmagoriques: 'Lancers gratuits en illusion : rappel.' },
    oath_of_devotion: { sorts_du_serment_de_devotion: true },
    oath_of_glory: { sorts_du_serment_de_gloire: true },
    oath_of_the_ancients: { sorts_du_serment_des_anciens: true },
    oath_of_vengeance: { sorts_du_serment_de_vengeance: true },
    oath_of_the_dragonlords: { sorts_du_serment: true }
};

export const SUBCLASS_AUTOMATION = Object.freeze(Object.fromEntries(
    [...new Set([...Object.keys(MANUAL_AUTOMATION), ...Object.keys(SPELL_FEATURES)])].map(subclass => [subclass, {
        ...Object.fromEntries(Object.entries(SPELL_FEATURES[subclass] ?? {}).map(([id, rest]) => [id, rest === true
            ? { text: SPELLS_TEXT }
            : { text: `${SPELLS_TEXT} ${rest}`, partial: true }])),
        ...MANUAL_AUTOMATION[subclass]
    }])));

/**
 * Fureur divine (Voie du Zélote, PHB 2024, niveau 3) : 1d6 + la moitié du niveau de Barbare, une fois
 * par tour pendant la Rage, avec une arme ou une Frappe à mains nues.
 * @param {{ classSlug: string, subclass?: string, level: number }} stats - deriveCharacter()
 * @returns {string} « 1d6+2 », ou '' si le personnage n'a pas la capacité
 */
export function divineFuryDie({ classSlug, subclass = '', level = 1 } = {}) {
    if (classSlug !== 'barbarian' || subclass !== 'path_of_the_zealot' || level < 3) return '';
    return `1d6+${Math.floor(level / 2)}`;
}

/**
 * Sorts toujours préparés (ou connus) donnés par la sous-classe (js/data/subclass-spells.js).
 * @param {{ subclass: string, level: number }} derived - deriveCharacter()
 * @returns {{ reached: SubclassSpell[], upcoming: SubclassSpell[] }}
 *   reached : sorts déjà donnés ; upcoming : ceux des niveaux suivants. SubclassSpell :
 *   { classLevel, vo, name, level (niveau du sort, 0 = sort mineur), ritual, note?, group? } ;
 *   group : terrain du Cercle de la Terre (un seul à la fois, choisi à chaque repos long)
 */
export function subclassSpells({ subclass = '', level = 1 } = {}) {
    const rows = Object.hasOwn(SUBCLASS_SPELLS, subclass) ? SUBCLASS_SPELLS[subclass] : [];
    const spells = rows.map(([classLevel, vo, name, spellLevel, flag, options]) => ({
        classLevel, vo, name, level: spellLevel, ritual: flag === 'R',
        ...(options?.note ? { note: options.note } : {}),
        ...(options?.group ? { group: options.group } : {})
    }));
    return {
        reached: spells.filter(spell => spell.classLevel <= level),
        upcoming: spells.filter(spell => spell.classLevel > level)
    };
}

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
 * @param {{ subclass: string, level: number, pb?: number, mods?: Object }} derived - deriveCharacter() (subclass : clé de DD_RULES.subclasses)
 * @returns {{ subclass: { key: string, name: string, source: string } | null,
 *             reached: SubclassFeature[], upcoming: SubclassFeature[] }}
 */
export function subclassFeatures(derived = {}) {
    const { subclass = '', level = 1 } = derived;
    const info = DD_RULES.subclasses[subclass];
    const list = Object.hasOwn(SUBCLASS_FEATURES, subclass) ? SUBCLASS_FEATURES[subclass] : null;
    if (!info || !list) return { subclass: null, reached: [], upcoming: [] };
    const automation = SUBCLASS_AUTOMATION[subclass] ?? {};
    const resolve = (entry) => (entry && typeof entry.text === 'function' ? { ...entry, text: entry.text(derived) } : (entry ?? null));
    const shape = (feature) => ({
        ...feature,
        automation: resolve(automation[feature.id]),
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

/** Nom de sort comparable : comme le grimoire (normalizeText), espaces regroupés en plus */
const spellKey = (text) => normalizeText(text).replace(/\s+/g, ' ').trim();

/**
 * Repère « Aussi dans votre liste » : marque chaque sort de sous-classe que le joueur a aussi noté
 * dans son grimoire (nom français ou anglais, sans tenir compte de la mise en forme, de la casse, des
 * accents, de l'apostrophe courbe ni des espaces en trop).
 * @param {Array<{ name: string, vo: string }>} spells - subclassSpells().reached
 * @param {Array<{ name?: string }>} rows - dynamic_spells
 * @returns {Array<Object>} copies des sorts, avec listed: boolean
 */
export function markListedSpells(spells, rows) {
    const listed = new Set((Array.isArray(rows) ? rows : []).map(row => spellKey(row?.name)).filter(Boolean));
    return spells.map(spell => ({ ...spell, listed: listed.has(spellKey(spell.name)) || listed.has(spellKey(spell.vo)) }));
}
