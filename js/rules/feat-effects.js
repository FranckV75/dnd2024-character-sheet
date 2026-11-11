// =============================================================================
// FEAT-EFFECTS.JS (règles) - Effets des dons sur la fiche : notes à afficher par zone
//
// Règle validée par Franck : la fiche ne modifie JAMAIS une valeur saisie à la main
// (caractéristiques, PV max, vitesse). Pour un bonus de don sur une telle valeur, elle
// affiche seulement « dont +X grâce à <don> ». Une valeur déjà calculée par la fiche
// (Initiative, CA, dégâts d'arme, DD) peut intégrer le bonus (voir deriveCharacter et
// computeWeapon dans character.js) : la note le signale alors avec `applied: true`.
//
// Un don ne compte que s'il est choisi dans un emplacement atteint (reachedFeatIds, feats.js).
// Textes vérifiés dans le Player's Handbook 2024 anglais (pages citées pour chaque don) ;
// noms français de js/data/feats.js (traduction AideDD).
//
// Fichier séparé de feats.js pour éviter une dépendance circulaire :
// feats.js ← weapons.js ← character.js ← feat-effects.js ← rest.js
//
// Les effets de chaque don sont rangés par lot dans js/rules/feat-effects/ (general, epic, lot7,
// fighting-styles), avec les repères des dons à choix (choice-notes), les rappels sur les armes
// (weapon-notes) et les outils communs (helpers). Ces fichiers ne doivent jamais être importés
// par character.js (boucle d'imports).
// =============================================================================

import { featSlots, featName, featSlotName, hasFightingStyle, featSlotLevelFor } from './feats.js';
import { FEATS_DATA } from '../data/feats.js';
import { deriveCharacter } from './character.js';
import { ABILITY_IDS, SKILLS } from '../data/constants.js';
import { FEAT_CHOICE_RULES, featChoiceGrants, REPEATABLE_CHOICE_FEATS } from './feat-choices.js';
import { classFeatureNotes } from './class-features.js';
import { GENERAL_FEAT_RULES } from './feat-effects/general.js';
import { EPIC_FEAT_RULES } from './feat-effects/epic.js';
import { LOT7_FEAT_RULES } from './feat-effects/lot7.js';
import { FIGHTING_STYLE_RULES } from './feat-effects/fighting-styles.js';
import { choiceNotes } from './feat-effects/choice-notes.js';
import { weaponFeatNotes } from './feat-effects/weapon-notes.js';
import { note } from './feat-effects/helpers.js';

// Réexportés pour les autres modules et les tests (mêmes noms qu'avant le découpage)
export { shieldBashDC, toughHitPoints, isPolearm, poisonerDC, irresistibleBoost, actorDC, grappleDC } from './feat-effects/helpers.js';
export { weaponFeatNotes } from './feat-effects/weapon-notes.js';


/**
 * Note de don affichée dans une zone de la fiche.
 * @typedef {Object} FeatNote
 * @property {string} featId - identifiant du don (clé de js/data/feats.js)
 * @property {string} featName - nom français du don (« Vigilant »)
 * @property {string} text - phrase courte en français, chiffres calculés inclus ; elle ne commence
 *   pas par le nom du don (sauf « dont +X PV grâce à Robuste ») : l'interface peut afficher featName à côté
 * @property {number|string} [value] - chiffre principal de la note (bonus, DD, réduction, nombre
 *   d'alliés, dé « 1d8 ») ; absent pour un simple rappel
 * @property {boolean} [applied] - la valeur est déjà comptée dans le nombre calculé par la fiche
 *   (ex. Vigilant dans l'Initiative) : ne pas l'ajouter une seconde fois
 * @property {boolean} [manual] - la valeur porte sur un nombre saisi à la main (ex. Robuste et les
 *   PV max) : la fiche ne l'ajoute pas, le joueur la reporte lui-même s'il ne l'a pas déjà fait
 * @property {boolean} [inactive] - condition non remplie (ex. aucune armure lourde équipée) :
 *   à afficher discrètement
 * @property {boolean} [check] - à vérifier par le joueur : case du don pas cochée, valeur au-delà
 *   de 20, choix contraire à la règle (lot 3) ; la fiche ne corrige rien elle-même
 * @property {boolean} [ticked] - la case due au don est cochée sur la fiche (lot 3)
 * @property {number} [slot] - niveau de l'emplacement du don (dons à choix : un même don peut être
 *   pris dans deux emplacements, chacun avec son choix)
 * @property {'short'|'long'} [restKind] - rappel de fin de repos court seulement, ou long seulement (zone 'rest')
 * @property {boolean} [classFeature] - note d'une capacité de classe, pas d'un don (Aura de protection,
 *   Touche-à-tout, arme non maîtrisée : js/rules/class-features.js) ; featId est alors un identifiant
 *   propre à la capacité (absent de js/data/feats.js)
 */

/**
 * Notes de dons rangées par zone de la fiche.
 * Les zones fixes (FEAT_ZONES) sont toujours présentes (tableau vide s'il n'y a rien) ;
 * deux familles de zones n'apparaissent que si elles ont au moins une note :
 *  - 'weapon:<i>'  : ligne n° i (index dans dynamic_weapons) du tableau des armes ;
 *  - 'featSlot:<N>' : emplacement de don du niveau N (ce que la fiche fait de ce don).
 * @typedef {Object<string, FeatNote[]>} FeatEffects
 */

/**
 * Zones fixes de la fiche, toujours présentes dans le résultat de featEffects :
 *  - 'initiative'   : Initiative (Vigilant) ;
 *  - 'hpMax'        : PV max saisis à la main (Robuste : « dont +X ») ;
 *  - 'armorClass'   : CA (Maître des armures lourdes, Maître des boucliers sans bouclier) ;
 *  - 'saves.<id>'   : jet de sauvegarde (str, dex, con, int, wis, cha) ;
 *  - 'scores.<id>'  : valeur de caractéristique saisie (augmentations des dons à choix) ;
 *  - 'skills.<id>'  : compétence (maîtrise ou Expertise due à un don à choix) ;
 *  - 'spells'       : zone des sorts (Mage de guerre) ;
 *  - 'weapons'      : tableau des armes, rappels généraux (Charge, Abattage, Sentinelle…) ;
 *  - 'rest'         : fin d'un repos court ou long (Musicien) ;
 *  - 'healing'      : soins donnés aux autres (Guérisseur) ;
 *  - 'speed'        : Vitesse saisie (Mobile : « dont +3 m », jamais ajoutés) ;
 *  - 'deathSaves'   : jets contre la mort (Gaillard : Avantage).
 */
export const FEAT_ZONES = Object.freeze([
    'initiative', 'hpMax', 'armorClass',
    ...ABILITY_IDS.map(id => `saves.${id}`),
    ...ABILITY_IDS.map(id => `scores.${id}`),
    ...SKILLS.map(skill => `skills.${skill.id}`),
    'spells', 'weapons', 'rest', 'healing', 'speed', 'deathSaves'
]);

/** Dons dont la fiche tient compte (lot 1) */
export const AUTOMATED_FEATS = Object.freeze([
    'vigilant', 'robuste', 'mage_de_guerre', 'maitre_des_armures_lourdes', 'maitre_des_armures_intermediaires',
    'maitre_des_boucliers',
    'expert_de_la_charge', 'maitre_des_armes_lourdes_cogneur_lourd', 'sauvagerie_martiale',
    'sentinelle', 'trancheur', 'broyeur', 'empaleur_perforateur', 'musicien', 'guerisseur',
    // Lot 2 : dons à usages limités (cases vidées au repos, js/rules/feat-uses.js)
    'chanceux', 'tueur_de_mages',
    // Lot 3 : choix mémorisés (js/rules/feat-choices.js)
    'amelioration_de_caracteristique', 'resilient', 'observateur', 'expert', 'esprit_affute', 'doue',
    'adepte_elementaire',
    // Lot 6 : dons à sorts (js/rules/feat-spells.js)
    'initie_a_la_magie', 'affinite_feerique', 'affinite_ombreuse', 'magie_rituelle', 'telepathe', 'telekinesiste',
    // Lot 5 : vitesse, PV temporaires, armures, armes d'hast, poison
    'mobile', 'figure_de_proue', 'incantateur_d_elite', 'protection_legere', 'protection_intermediaire',
    'protection_lourde', 'duelliste_defensif', 'gaillard', 'chef_cuisinier', 'empoisonneur', 'maitre_d_hast',
    // Lot 4 : styles de combat (et ce qui peut les remplacer au niveau 2)
    'defense', 'archerie', 'duel', 'arme_a_deux_mains', 'arme_de_lancer', 'combat_a_deux_armes',
    'combat_a_mains_nues', 'combat_en_aveugle', 'interception', 'protection', 'guerrier_beni', 'guerrier_druidique',
    // Sous-classes, lot 0 : style de combat de l'Odyssée
    'hoplite',
    // Lot 7 : Attaque à mains nues, armes et rappels
    'athlete', 'bagarreur_de_tavernes', 'combattant_a_deux_armes', 'combattant_monte', 'comedien', 'discret',
    'empoigneur', 'faconneur', 'formation_aux_armes_de_guerre', 'maitre_d_armes', 'maitre_arbaletrier', 'tireur_d_elite',
    // Lot 8 : faveurs épiques (niveau 19)
    'faveur_d_attaque_irresistible', 'faveur_de_competence', 'faveur_de_deplacement_dimensionnel', 'faveur_de_l_esprit_nocturne',
    'faveur_de_memoire_magique', 'faveur_de_prouesse_martiale', 'faveur_de_recuperation', 'faveur_de_resistance_aux_energies',
    'faveur_de_vigueur', 'faveur_de_vision_veritable_vision_lucide', 'faveur_de_vitesse', 'faveur_du_destin'
]);

/** Effets par don (js/rules/feat-effects/) : chaque fonction reçoit { derived, record, add } et range ses notes */
const FEAT_RULES = { ...GENERAL_FEAT_RULES, ...EPIC_FEAT_RULES, ...LOT7_FEAT_RULES, ...FIGHTING_STYLE_RULES };


/**
 * Notes des dons à montrer à la fin d'un repos court ou long (Musicien).
 * @param {Object} character
 * @param {Object} [derived] - deriveCharacter(character)
 * @returns {FeatNote[]}
 */
export function restFeatNotes(character, derived = deriveCharacter(character || {})) {
    return featEffects(character, derived).rest;
}

/**
 * Effets des dons atteints, rangés par zone de la fiche (voir FEAT_ZONES et le type FeatEffects).
 * Fonction pure : le personnage n'est pas modifié et aucune valeur saisie n'est changée.
 *
 * Exemple (Guerrier niveau 4, Dex 14, feat_1 = 'vigilant', feat_4 = 'robuste') :
 *   featEffects(c, deriveCharacter(c)).initiative
 *   → [{ featId: 'vigilant', featName: 'Vigilant', value: 2, applied: true,
 *        text: "Bonus de maîtrise +2 déjà compté dans l'Initiative (Dex +2, Vigilant +2)." },
 *      { featId: 'vigilant', featName: 'Vigilant', text: "Échange d'Initiative : …" }]
 *   featEffects(c).hpMax
 *   → [{ featId: 'robuste', featName: 'Robuste', value: 8, text: 'dont +8 PV grâce à Robuste (2 × niveau 4)' }]
 *   featEffects(c)['featSlot:4'] → [{ featId: 'robuste', …, text: '+8 PV max (2 × niveau 4) : …' }]
 *
 * @param {Object} character - personnage au format de sauvegarde (v3)
 * @param {Object} [derived] - deriveCharacter(character) déjà calculé (sinon recalculé)
 * @returns {FeatEffects}
 */
export function featEffects(character, derived = deriveCharacter(character || {})) {
    const effects = Object.fromEntries(FEAT_ZONES.map(zone => [zone, []]));
    const record = character && typeof character === 'object' ? character : {};

    // Effets généraux, dans l'ordre des emplacements ; 'featSlot' est rangé sous le niveau de l'emplacement.
    // Un don choisi deux fois (Humain qui reprend le don de son historique, ancienne sauvegarde) : un don
    // se prend une fois (PHB 2024, sauf « Répétable ») ; le second emplacement n'a qu'une alerte. Les dons
    // à choix ont la leur plus bas (répétables compris : Doué, Initié à la magie…).
    const firstSlot = new Map();
    for (const slot of featSlots(record)) {
        if (!slot.reached) continue;
        const first = !firstSlot.has(slot.featId);
        if (first) firstSlot.set(slot.featId, slot.level);
        else if (Object.hasOwn(FEATS_DATA, slot.featId) && !REPEATABLE_CHOICE_FEATS.includes(slot.featId)) {
            // Dons à choix (le +1 de Sentinelle, Mobile…) : l'alerte vient de la boucle des choix
            if (!Object.hasOwn(FEAT_CHOICE_RULES, slot.featId)) {
                (effects[`featSlot:${slot.level}`] ??= []).push(note(slot.featId,
                    `${featName(slot.featId)} est déjà pris au ${featSlotName(firstSlot.get(slot.featId))} : ce don ne se prend qu'une fois. Choisissez un autre don ici.`,
                    { check: true, slot: slot.level }));
            }
            continue;
        }
        // Faveur épique (PHB 2024) : prérequis niveau 19. Le don se choisit au niveau où l'emplacement
        // s'acquiert : une faveur notée dans un emplacement plus bas (16, 4, origine) ne remplit pas le
        // prérequis, même une fois le personnage au niveau 19.
        if (Object.hasOwn(FEATS_DATA, slot.featId) && FEATS_DATA[slot.featId].type === 'Épique' && featSlotLevelFor(slot.level, record) < 19) {
            (effects[`featSlot:${slot.level}`] ??= []).push(note(slot.featId,
                'Prérequis : niveau 19 (les faveurs épiques se prennent au niveau 19).', { check: true }));
        }
        // Style de combat (PHB 2024) : prérequis « capacité Style de combat » (Guerrier ; Paladin et Rôdeur au niveau 2)
        if (Object.hasOwn(FEATS_DATA, slot.featId) && FEATS_DATA[slot.featId].type === 'Style de combat' && !hasFightingStyle(record)) {
            (effects[`featSlot:${slot.level}`] ??= []).push(note(slot.featId,
                'Prérequis : la capacité Style de combat (Guerrier dès le niveau 1, Paladin ou Rôdeur dès le niveau 2).',
                { check: true }));
        }
        if (!Object.hasOwn(FEAT_RULES, slot.featId)) continue;
        const rule = FEAT_RULES[slot.featId];
        const slotZone = `featSlot:${slot.level}`;
        rule({
            derived,
            record,
            add: (zone, text, extra) => {
                if (zone !== 'featSlot' && !first) return;
                const key = zone === 'featSlot' ? slotZone : zone;
                (effects[key] ??= []).push(note(slot.featId, text, extra));
            }
        });
    }

    // Dons à choix : un don répétable (Amélioration de caractéristique, Doué, Adepte élémentaire)
    // donne des notes pour chaque emplacement ; les autres, une seule fois (ancienne sauvegarde)
    const grants = featChoiceGrants(record);
    const firstLevel = new Map();
    for (const grant of grants) {
        // Don non répétable déjà pris plus bas (ancienne sauvegarde) : ce second choix ne compte pas
        if (firstLevel.has(grant.featId) && !REPEATABLE_CHOICE_FEATS.includes(grant.featId)) {
            (effects[`featSlot:${grant.level}`] ??= []).push(note(grant.featId,
                `${grant.featName} est déjà pris au ${featSlotName(firstLevel.get(grant.featId))} : ce don ne se prend qu'une fois. Choisissez un autre don ici.`,
                { check: true, slot: grant.level }));
            continue;
        }
        if (!firstLevel.has(grant.featId)) firstLevel.set(grant.featId, grant.level);
        choiceNotes(grant, {
            derived,
            grants,
            record,
            add: (zone, text, extra = {}) => {
                const key = zone === 'featSlot' ? `featSlot:${grant.level}` : zone;
                const list = (effects[key] ??= []);
                // Même alerte (valeur au-delà de 20) venue de deux dons : affichée une fois
                if (extra.check && zone !== 'featSlot' && list.some(n => n.check && n.text === text)) return;
                list.push(note(grant.featId, text, { ...extra, slot: grant.level }));
            }
        });
    }

    // Capacités de classe et de sous-classe (Aura de protection, Touche-à-tout, Résistance draconique…)
    for (const [zone, notes] of Object.entries(classFeatureNotes(derived, record))) {
        (effects[zone] ??= []).push(...notes);
    }

    // Rappels sur chaque ligne d'arme
    const weapons = Array.isArray(record.dynamic_weapons) ? record.dynamic_weapons : [];
    weapons.forEach((weapon, index) => {
        const notes = weaponFeatNotes(weapon, record, derived);
        if (notes.length) effects[`weapon:${index}`] = notes;
    });

    return effects;
}
