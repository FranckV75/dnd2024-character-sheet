// =============================================================================
// SUBCLASS-FEATURES.JS (règles) - Capacités de sous-classe atteintes ou à venir
// (fonctions pures, sans DOM)
//
// Les textes sont dans js/data/subclass-features.js (inventaire : docs/etudes/SOUS_CLASSES.md).
// Une capacité est « atteinte » quand le niveau de classe est au moins celui de la capacité.
// SUBCLASS_AUTOMATION dit ce que la fiche fait déjà de chaque capacité (sinon : simple rappel).
// Règle validée par Franck : la fiche ne modifie jamais une valeur saisie à la main.
// =============================================================================

import { SUBCLASS_FEATURES } from '../data/subclass-features.js';
import { DD_RULES } from '../data/dd-rules.js';
import { SUBCLASS_SPELLS } from '../data/subclass-spells.js';
import { getRageBonus } from './logic.js';
import { normalizeText } from './spells.js';
import { bardicInspirationDie, monkFocusDC, martialArtsDieText, abilityDC } from './subclass-calcs.js';
import {
    SUBCLASS_DEFENSES, frenzyDice, dreadfulStrikeDice, feyStrikesDie, superiorityDie, maneuverDC, psionicDice,
    maneuversKnown, knownManeuvers, maneuverNumbers
} from './subclass-combat.js';
import { ARTISAN_TOOLS } from '../data/maneuvers.js';
import { SKILLS } from '../data/constants.js';
import { LAND_TYPES, DAMAGE_TYPES, DIVINE_DOMAINS } from '../data/subclass-choices.js';
import { choiceDefense } from './subclass-combat.js';
import { choiceLabel, philosopherSchools, schoolLabel } from './subclass-choices.js';
import { moonFormLines, starryFormLines, moonFormNumbers, inWildShape, inStarryForm, chosenConstellation } from './subclass-forms.js';
import { epicPoemTexts } from './epic-poem.js';

const SKILL_NAMES = Object.fromEntries(SKILLS.map(skill => [skill.id, skill.name]));
import { SUBCLASS_COUNTERS, SUBCLASS_RESET_TEXT } from './subclass-uses.js';
import { hunterMarkDie } from './character.js';
import { signed } from './numbers.js';

/** Signe devant un nombre : « +3 », « -1 » */
/** Modificateur de Charisme (0 s'il manque) */
const chaMod = (derived) => Number(derived?.mods?.cha) || 0;
/**
 * DD des sorts de Paladin = DD du Conduit divin (PHB 2024, Paladin, « Channel Divinity » : le DD
 * d'un effet du Conduit divin est celui des sorts de la classe) : 8 + maîtrise + Charisme.
 */
const paladinDC = (derived) => 8 + (Number(derived?.pb) || 2) + chaMod(derived);
/** Avantages de Révélation incarnée (cases du menu, js/data/subclass-choices.js) */
const REVELATIONS = [['rev_aquatic', 'Adaptation aquatique'], ['rev_flight', 'Vol scintillant'], ['rev_see', 'Voir l\'invisible'], ['rev_worm', 'Mouvement vermiforme']];
const SPELLS_TEXT = 'Bloc « Sorts de sous-classe » de l\'onglet Magie : toujours préparés, hors du nombre de sorts préparés.';

/**
 * Sorts préparés de niveau 1+ du Chevalier occulte et de l'Arnaqueur arcanique (PHB 2024, même table) :
 * 3 au niveau 3, 4 au 4, 5 au 7, 6 au 8, 7 au 10, 8 au 11, 9 au 13, 10 au 14, 11 au 16, 12 au 19, 13 au 20.
 * @param {number} level - niveau de Guerrier ou de Roublard
 * @returns {number} 0 avant le niveau 3
 */
export function thirdCasterPrepared(level) {
    const steps = [[20, 13], [19, 12], [16, 11], [14, 10], [13, 9], [11, 8], [10, 7], [8, 6], [7, 5], [4, 4], [3, 3]];
    return steps.find(([min]) => level >= min)?.[1] ?? 0;
}

/** Caractéristique d'incantation (Intelligence) : choisie ou non dans l'onglet Magie */
function spellAbilityText(derived) {
    const sc = derived?.spellcasting;
    return sc?.ability === 'int'
        ? `Intelligence choisie dans l'onglet Magie : DD des sorts ${sc.dc}, attaque ${signed(sc.attack)}.`
        : 'Caractéristique d\'incantation : choisissez Intelligence dans l\'onglet Magie.';
}
const COMBAT_BOXES = 'Case dans l\'onglet Combat, vidée au repos long.';
/** « Carte du pseudodragon dans « Compagnons & familiers » … » (lot 7, js/rules/subclass-companions.js) */
const cardOf = (whose) => `Carte ${whose} dans « Compagnons & familiers » (plus bas dans cet onglet)`;
const mod = (derived, id) => Number(derived?.mods?.[id]) || 0;
// `where` contient la préposition (« de la sauvegarde de Force », « d'Athlétisme ») ; plural : deux cases
const CHECK_TEXT = (where, plural = false) =>
    `Rappel « À vérifier » près ${where} tant que ${plural ? 'les cases ne sont pas cochées' : 'la case n\'est pas cochée'}.`;
/** Modificateur compté dans l'Initiative calculée seulement s'il est positif (subclass-calcs.js) */
const initiativeText = (d, id, name) => mod(d, id) > 0
    ? `${name} ${signed(mod(d, id))} compté dans l'Initiative calculée`
    : `${name} ${signed(mod(d, id))} : rien d'ajouté à l'Initiative tant qu'il n'est pas positif`;

/**
 * Ce que la fiche fait de chaque capacité qu'elle gère, par sous-classe puis identifiant :
 * { text, partial } — partial : seule une partie de la capacité est calculée, le reste est un rappel.
 * text peut être une fonction de deriveCharacter() quand il contient un nombre calculé (DD, bonus).
 * Les capacités qui donnent des sorts (SPELL_FEATURES) sont ajoutées à la suite.
 */
const MANUAL_AUTOMATION = {
    // Lot 7 : strophes, rang du poème et minimum du dé d'Inspiration (js/rules/epic-poem.js)
    college_of_epic_muse: {
        composition_des_strophes: { text: (d) => epicPoemTexts(d).composition, partial: true },
        inspirations_poetiques: { text: (d) => epicPoemTexts(d).inspirations, list: (d) => epicPoemTexts(d).inspirationList, partial: true },
        egide_du_poete: { text: (d) => epicPoemTexts(d).aegis, partial: true },
        epithetes_protectrices: { text: (d) => epicPoemTexts(d).epithets, partial: true }
    },
    // Lot 7 : tirages de la Bouffée (js/rules/wild-magic.js, js/ui/wild-magic.js) ; les cases de
    // Marée du chaos et de Bouffée domptée gardent leur texte de cases (ajouté par withCounter)
    wild_magic_sorcery: {
        deferlante_de_magie_sauvage: { text: 'Boutons « Bouffée ? (d20) » et « Table (d100) » dans l\'onglet Combat : le résultat et sa ligne dans la table du manuel (les effets se lisent dans le manuel).', partial: true },
        marees_du_chaos: { text: 'Quand sa case est cochée, rappel de la Bouffée automatique sous les boutons de tirage.' },
        influence_sur_la_chance: { text: 'Repère « Hasard ±1d4 » près des cases de points de sorcellerie (onglet Combat).', partial: true },
        chaos_maitrise: { text: 'Le bouton d100 (et la Bouffée après un 20) tire deux résultats ; vous gardez celui de votre choix.' },
        deferlante_domptee: { text: 'Rappel sous les boutons de tirage tant que sa case n\'est pas cochée.' }
    },
    // Lot 2 : Voie du Zélote (Korgul)
    path_of_the_zealot: {
        fureur_divine: { text: (d) => `Bouton Rage allumé (onglet Combat) : +${divineFuryDie(d) || '1d6'} (Fureur divine) sur chaque arme et l'attaque à mains nues ; une seule fois par tour, sur la première créature touchée.` },
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
        legende_vivante: { text: COMBAT_BOXES, partial: true },
        aura_d_alacrite: { text: 'Rappel « dont +3 m » près de la Vitesse (onglet Combat) : la Vitesse saisie n\'est pas modifiée, à reporter vous-même.', partial: true }
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
        lien_indestructible: { text: COMBAT_BOXES, partial: true },
        // Lot 7 : couleur de l'œuf mémorisée ; cartes du pseudodragon et du dragon (subclass-companions.js)
        familier_pseudodragon: {
            text: (d) => {
                const egg = choiceLabel('oath_of_the_dragonlords', 'egg', d.subclassChoices?.egg);
                return `${egg
                    ? `Œuf de dragon : ${egg.toLowerCase()} (couleur mémorisée par la fiche).`
                    : 'Couleur de l\'œuf à choisir dans le menu ci-dessous quand il est trouvé ou rapporté.'} ${cardOf('du pseudodragon')}.`;
            },
            partial: true
        },
        // Lot 7 : carte du dragon lié et case du souffle (js/rules/subclass-companions.js)
        lien_du_seigneur_dragon: {
            text: (d) => `${cardOf('du dragon lié')} : PV ${40 + 2 * d.level} (40 + 2 × niveau), sauvegardes du bloc ${signed(Number(d.pb) || 2)}. ${d.level >= 20
                ? 'Souffle : recharge sur 5-6 (Lien indestructible), plus de case dans l\'onglet Combat.'
                : 'Case « Souffle du dragon » dans l\'onglet Combat, rendue au repos court ou long.'}`,
            partial: true
        },
        // Bouton « Monté sur le dragon » (combat_buffs.dragonMount, js/rules/subclass-combat.js)
        jeune_dragon: { text: `Bouton « Monté sur le dragon » dans l'onglet Combat (tableau des armes) : allumé, l'immunité du dragon est rappelée près de la CA et ses sens près de la Perception. ${cardOf('du dragon')} ; le bloc du jeune dragon n'est pas recopié.`, partial: true }
    },
    // Lot 7 : compagnons (cartes calculées, js/rules/subclass-companions.js)
    beast_master: {
        compagnon_primordial: {
            text: (d) => {
                const beast = choiceLabel('beast_master', 'beast', d.subclassChoices?.beast);
                return beast
                    ? `${cardOf(`« ${beast} »`)} : CA, PV, sauvegardes et Frappe calculées ; PV actuels à suivre sur la carte.`
                    : 'Bête à choisir dans le menu ci-dessous ; sa carte (CA, PV, Frappe) s\'affiche ensuite dans « Compagnons & familiers », plus bas dans cet onglet.';
            },
            partial: true
        },
        entrainement_exceptionnel: { text: `${cardOf('du compagnon')} : action bonus et dégâts de Force rappelés.`, partial: true },
        furie_bestiale: {
            text: (d) => `${cardOf('du compagnon')} : Frappe ×2 ; +${hunterMarkDie({ level: d.level, classSlug: d.classSlug })} de Force sur une cible marquée, actif quand le bouton Marque du chasseur est allumé.`,
            partial: true
        },
        partage_des_sorts: { text: `${cardOf('du compagnon')} : rappel.`, partial: true }
    },
    amazon_warrior: {
        // Trouver une monture (niveau 5) : carte de la monture d'Outremonde (subclass-companions.js)
        magie_des_amazones: {
            text: (d) => (d.level >= 5
                ? `Trouver une monture : ${cardOf("de la monture d'Outremonde")}, selon le type et le niveau du sort choisis ci-dessous ; PV actuels à suivre sur la carte. Les sorts eux-mêmes sont à noter au grimoire.`
                : "Trouver une monture au niveau 5 : la carte de la monture s'affichera alors dans « Compagnons & familiers ». Les sorts eux-mêmes sont à noter au grimoire."),
            partial: true
        },
        compagnon_stimfee: {
            text: (d) => `${cardOf('de la stimfée')} : PV ${(d.level >= 11 ? 30 : 15) + d.level}, attaques ${signed(4 + (Number(d.pb) || 2))} et DD ${10 + (Number(d.pb) || 2)} avec votre bonus de maîtrise ; PV actuels à suivre sur la carte.`,
            partial: true
        },
        fauconniere_chevronnee: { text: `${cardOf('de la stimfée')}, mise à jour : CA + maîtrise, PV 30 + niveau, dés 2d6, attaques magiques, réaction d'interception rappelée.`, partial: true }
    },
    // Lot 4 : petits calculs (js/rules/subclass-calcs.js)
    champion: {
        style_de_combat_supplementaire: { text: 'Second emplacement « Style de combat » dans les dons (onglet Aptitudes & Traits).' },
        critique_ameliore: { text: (d) => (d.level >= 15
            ? 'Remplacé par Critique supérieur (niveau 15) : « Coup critique sur 18 à 20 » sous chaque arme.'
            : 'Sous chaque arme (onglet Combat) : « Coup critique sur 19 ou 20 ».') },
        critique_superieur: { text: 'Sous chaque arme (onglet Combat) : « Coup critique sur 18 à 20 ».' },
        athlete_remarquable: { text: 'Avantage rappelé près de l\'Initiative.', partial: true },
        survivant: { text: (d) => `Avantage rappelé près des jets contre la mort ; PV regagnés par tour : ${5 + mod(d, 'con')} (5 + Constitution).`, partial: true }
    },
    odyssean_champion: {
        briseur_de_bouclier: { text: 'Sous chaque arme (onglet Combat) : « Coup critique sur 19 ou 20 », avec la perte du bouclier.' },
        maitre_de_la_lance: { text: 'Rappel sous les lances, tridents et javelines : dé et allonge à régler dans la configuration de l\'arme.', partial: true }
    },
    gloom_stalker: {
        embusqueur_redoutable_bonus_d_initiative: { text: (d) => `${initiativeText(d, 'wis', 'Modificateur de Sagesse')}.` },
        // Lot 7 : sauvegarde choisie dans le menu (Sagesse par défaut)
        esprit_d_acier: { text: (d) => CHECK_TEXT(`de la sauvegarde ${({ int: 'd\'Intelligence', cha: 'de Charisme' })[d.subclassChoices?.save] ?? 'de Sagesse'}`) },
        embusqueur_redoutable_frappe_effroyable: { text: (d) => `Bouton « Frappe effroyable » du tableau des armes (+${dreadfulStrikeDice(d.level)} psychiques) et ${countText(d, 'gloom_stalker', 'embusqueur_redoutable_frappe_effroyable')}.` },
        deluge_du_traqueur: { text: 'Dé de la Frappe effroyable passé à 2d8 (bouton du tableau des armes) ; attaque en plus ou effroi à jouer vous-même.', partial: true }
    },
    fey_wanderer: {
        charme_surnaturel: { text: (d) => `${signed(Math.max(1, mod(d, 'wis')))} compté dans Intimidation, Persuasion, Représentation et Tromperie ; la compétence au choix est à cocher vous-même.`, partial: true },
        frappes_redoutables: { text: (d) => `Bouton « Frappes effroyables » du tableau des armes : +${feyStrikesDie(d.level)} psychiques.` }
    },
    the_odyssean: {
        soldat_vagabond: { text: `Lance et Trident : maîtrise, attaque à la Dextérité et Attaque sournoise calculées. ${CHECK_TEXT('de la CA (case Boucliers)')}`, partial: true },
        a_toute_epreuve: { text: (d) => `${initiativeText(d, 'cha', 'Modificateur de Charisme')} ; PV regagnés au premier tour : ${d.level}.`, partial: true }
    },
    assassin: {
        assassinat: { text: 'Avantage rappelé près de l\'Initiative.', partial: true },
        frappe_mortelle: { text: (d) => `Sauvegarde de Constitution DD ${abilityDC(d, 'dex')} (8 + Dextérité + maîtrise).`, partial: true }
    },
    thief: {
        monte_en_l_air: { text: 'Rappel « Escalade = Vitesse » près de la Vitesse (onglet Combat).' }
    },
    abjurer: {
        protection_arcanique: { text: (d) => `PV maximum de la protection : ${2 * d.level + mod(d, 'int')} (2 × niveau + Intelligence).`, partial: true }
    },
    warrior_of_the_open_hand: {
        technique_de_la_main_ouverte: { text: (d) => `DD des sauvegardes : ${monkFocusDC(d)} (8 + Sagesse + maîtrise).`, partial: true },
        plenitude_physique: { text: (d) => `PV regagnés : 1${martialArtsDieText(d.level)} ${signed(mod(d, 'wis'))} (minimum 1), ${Math.max(1, mod(d, 'wis'))} fois par repos long.`, partial: true }
    },
    warrior_of_the_elements: {
        explosion_elementaire: { text: (d) => `Dégâts : 3${martialArtsDieText(d.level)}, sauvegarde de Dextérité DD ${monkFocusDC(d)}.`, partial: true }
    },
    warrior_of_mercy: {
        main_qui_blesse: { text: (d) => `Dégâts nécrotiques : 1${martialArtsDieText(d.level)} ${signed(mod(d, 'wis'))}.`, partial: true },
        main_qui_soigne: { text: (d) => `PV rendus : 1${martialArtsDieText(d.level)} ${signed(mod(d, 'wis'))}.`, partial: true },
        instruments_de_la_misericorde: { text: `${CHECK_TEXT('d\'Intuition et de Médecine', true)} Matériel d'herboriste : à noter vous-même.`, partial: true }
    },
    psi_warrior: {
        adepte_telekinesique_poussee_telekinesique: { text: (d) => `Sauvegarde de Force DD ${abilityDC(d, 'int')} (8 + Intelligence + maîtrise).`, partial: true },
        pouvoir_psionique_des_d_energie_psionique: { text: (d) => `${countText(d, 'psi_warrior', 'pouvoir_psionique_des_d_energie_psionique')} (dés de ${psionicDice(d.level).die}).` },
        frappe_psionique: { text: (d) => `Bouton « Frappe psionique » du tableau des armes : +1${psionicDice(d.level).die} ${signed(mod(d, 'int'))} de force.` },
        champ_protecteur: { text: (d) => `Dégâts réduits de 1${psionicDice(d.level).die} ${signed(mod(d, 'int'))} (un dé psionique, cases de l'onglet Combat).`, partial: true }
    },
    soulknife: {
        dechirure_mentale: { text: (d) => `Sauvegarde de Sagesse DD ${abilityDC(d, 'dex')} (8 + Dextérité + maîtrise).`, partial: true },
        pouvoir_psionique: { text: (d) => `${countText(d, 'soulknife', 'pouvoir_psionique')} (dés de ${psionicDice(d.level).die}).`, partial: true }
    },
    college_of_dance: {
        jeu_de_jambes_eblouissant_defense_sans_armure: { text: 'CA sans armure calculée (10 + Dex + Cha, sans bouclier).' },
        jeu_de_jambes_eblouissant_degats_bardiques: { text: (d) => `Attaque à mains nues calculée (onglet Combat) : Dextérité et 1${bardicInspirationDie(d.level)} contondants, sans armure ni bouclier, quand la Dextérité est au moins égale à la Force.` },
        jeu_de_jambes_en_tandem: { text: (d) => `Dé d'Inspiration bardique : ${bardicInspirationDie(d.level)}.`, partial: true }
    },
    college_of_valor: {
        formation_martiale_armes: { text: 'Les armes de guerre comptent comme maîtrisées.' },
        formation_martiale_armures_et_focaliseur: { text: 'Rappel « À vérifier » près de la CA tant que les cases Intermédiaires et Boucliers ne sont pas cochées.', partial: true },
        inspiration_martiale: { text: (d) => `Dé d'Inspiration bardique : ${bardicInspirationDie(d.level)}.`, partial: true }
    },
    college_of_lore: {
        mots_cinglants: { text: (d) => `Dé d'Inspiration bardique : ${bardicInspirationDie(d.level)}.`, partial: true }
    },
    life_domain: {
        preservation_de_la_vie: { text: (d) => `PV à répartir : ${5 * d.level} (5 × niveau de Clerc).`, partial: true }
    },
    light_domain: {
        radiance_de_l_aube: { text: (d) => `Dégâts : 2d10 + ${d.level} radiants, sauvegarde de Constitution DD ${abilityDC(d, 'wis')}.`, partial: true },
        flash_protecteur_ameliore: { text: (d) => `PV temporaires : 2d6 ${signed(mod(d, 'wis'))}.`, partial: true }
    },
    prophecy_domain: {
        benediction_de_clairvoyance: { text: (d) => `PV temporaires : ${mod(d, 'wis') + d.level} (Sagesse + niveau de Clerc).`, partial: true },
        vapeurs_regeneratrices: { text: (d) => `PV en plus par sort de soins : ${signed(mod(d, 'wis'))}.`, partial: true }
    },
    celestial_patron: {
        ame_radieuse: { text: (d) => `Bonus aux dégâts radiants ou de feu : ${signed(mod(d, 'cha'))} ; Résistance rappelée près de la CA.`, partial: true },
        resilience_celeste: { text: (d) => `PV temporaires : ${d.level + mod(d, 'cha')} pour vous, ${Math.floor(d.level / 2) + mod(d, 'cha')} pour chaque allié choisi.`, partial: true },
        lumiere_guerisseuse: { text: (d) => `Réserve de ${1 + d.level} d6 en cases dans l'onglet Combat, rendue au repos long ; au plus ${Math.max(1, mod(d, 'cha'))} dé${Math.max(1, mod(d, 'cha')) > 1 ? 's' : ''} à la fois.`, partial: true }
    },
    evoker: {
        evocation_renforcee: { text: (d) => `Bonus à un jet de dégâts : ${signed(mod(d, 'int'))}.`, partial: true }
    },
    draconic_sorcery: {
        resilience_draconique: { text: 'CA sans armure calculée (10 + Dex + Cha) ; « dont +X PV » sous les PV maximum, à reporter vous-même.' },
        // Lot 7 : type choisi dans le menu
        affinite_elementaire: {
            text: (d) => {
                const chosen = choiceDefense('draconic_sorcery', d.subclassChoices);
                const type = DAMAGE_TYPES.find(([id]) => id === d.subclassChoices?.element)?.[1] ?? '';
                return chosen
                    ? `Type choisi : ${type.toLowerCase()}. Bonus à un jet de dégâts d'un sort de ce type : ${signed(mod(d, 'cha'))} (Charisme) ; repère « ${chosen.mention} » près de la CA.`
                    : `Type à choisir dans le menu ci-dessous. Bonus à un jet de dégâts du type choisi : ${signed(mod(d, 'cha'))} ; Résistance rappelée près de la CA.`;
            },
            partial: true
        }
    },
    demigod_bloodline: {
        // Lot 7 : domaine choisi dans le menu ; ses deux sorts dans le bloc de l'onglet Magie
        ancetre_divin: {
            text: (d) => {
                const domain = choiceLabel('demigod_bloodline', 'domain', d.subclassChoices?.domain);
                const pb = Number(d.pb) || 2;
                const spells = subclassSpells(d).reached.map(spell => spell.name);
                return domain
                    ? `Domaine : ${domain} ; ${spells.join(' et ')} dans le bloc « Sorts de sous-classe » de l'onglet Magie (lancés sans emplacement, pas des sorts préparés). Maîtrise doublée aux jets de Charisme avec les dieux et les célestes, si elle s'applique : +${2 * pb} au lieu de +${pb}.`
                    : 'Domaine à choisir dans le menu ci-dessous : ses deux sorts s\'afficheront dans le bloc « Sorts de sous-classe » de l\'onglet Magie.';
            },
            partial: true
        },
        la_force_en_heritage: { text: `Armes de corps à corps : Charisme utilisé quand il est meilleur (onglet Combat). ${CHECK_TEXT('de la sauvegarde de Force')}`, partial: true }
    },
    path_of_the_heretic: {
        lutteur_precoce: { text: CHECK_TEXT('d\'Athlétisme'), partial: true },
        archer_aux_muscles_d_acier: { text: 'Arc long : Force utilisée quand elle dépasse la Dextérité (onglet Combat).', partial: true },
        foulee_du_titan: { text: (d) => `Sauvegarde de Constitution DD ${abilityDC(d, 'str')} (8 + Force + maîtrise).`, partial: true }
    },
    // Lot 7 : terre choisie dans le menu (js/data/subclass-choices.js)
    circle_of_the_land: {
        sorts_du_cercle_de_la_terre: {
            text: (d) => {
                const land = choiceLabel('circle_of_the_land', 'land', d.subclassChoices?.land);
                return land
                    ? `${SPELLS_TEXT} Terre ${land.toLowerCase()} choisie : seuls ses sorts y sont préparés, les autres terrains sont rappelés dessous.`
                    : `${SPELLS_TEXT} Choisissez la terre dans le menu ci-dessous : seuls ses sorts seront affichés comme préparés.`;
            }
        },
        protection_de_la_nature: {
            text: (d) => {
                const chosen = choiceDefense('circle_of_the_land', d.subclassChoices);
                return chosen
                    ? `Repère « ${chosen.mention} » près de la CA (onglet Combat), selon la terre choisie sous « Sorts du Cercle de la Terre ».`
                    : 'Repère « Résistance (terre) » près de la CA (onglet Combat) ; choisissez la terre sous « Sorts du Cercle de la Terre » pour que la fiche nomme le type.';
            },
            partial: true
        },
        sanctuaire_naturel: {
            text: (d) => {
                const chosen = choiceDefense('circle_of_the_land', d.subclassChoices);
                return chosen
                    ? `Vos alliés dans le cube gagnent votre ${chosen.mention}.`
                    : 'Vos alliés dans le cube gagnent la Résistance de Protégé de dame Nature (type selon la terre choisie).';
            },
            partial: true
        }
    },
    // Lot 7 : carte de la Forme sauvage (js/rules/subclass-forms.js), forme cochée dans le bloc
    circle_of_the_moon: {
        formes_du_cercle: {
            text: (d) => (inWildShape(d)
                ? `En Forme sauvage (case cochée) : repère « Forme : CA ${moonFormNumbers(d.level, d.mods?.wis).ac} » près de la CA (onglet Combat)${d.level >= 6 ? ', Sagesse rappelée sous la sauvegarde de Constitution' : ''}. Chiffres de la forme ci-dessous ; la bête et ses statistiques restent à jouer.`
                : 'Chiffres de la forme ci-dessous. Cochez « En Forme sauvage » pendant la forme : la CA de forme est alors rappelée près de la CA (onglet Combat). La fiche ne coche pas la case de Forme sauvage et n\'écrit pas les PV temporaires.'),
            list: (d) => moonFormLines(d),
            partial: true
        },
        formes_du_cercle_ameliorees: {
            text: 'Rappel dans le détail de Formes du cercle ; avec « En Forme sauvage » cochée, Sagesse à ajouter rappelée sous la sauvegarde de Constitution.',
            partial: true
        },
        forme_lunaire: { text: 'Rappel dans le détail de Formes du cercle : +2d10 radiants une fois par tour, Foulée sélène partagée.', partial: true }
    },
    circle_of_the_stars: {
        // Lot 7 : carte de la Forme stellaire (js/rules/subclass-forms.js), forme et constellation dans le bloc
        forme_etoilee: {
            text: (d) => {
                const label = choiceLabel('circle_of_the_stars', 'constellation', chosenConstellation(d));
                const state = inStarryForm(d) ? 'Forme stellaire en cours (case cochée)' : 'Cochez « En Forme stellaire » pendant la forme';
                return `${state} ; ${label ? `constellation : ${label}` : 'constellation à choisir dans le menu'}. Chiffres des constellations ci-dessous ; la fiche ne coche pas la case de Forme sauvage.`;
            },
            list: (d) => starryFormLines(d),
            partial: true
        },
        constellations_scintillantes: {
            text: 'Dés 2d8 et vol du Dragon comptés dans le détail de Forme stellaire ; avec le Dragon et « En Forme stellaire » cochée, vol de 6 m rappelé près de la Vitesse.',
            partial: true
        },
        plein_d_etoiles: {
            text: 'Repère « Résistance C/P/T (forme) » près de la CA (onglet Combat), allumé quand « En Forme stellaire » est cochée (bloc Sous-classe).',
            partial: true
        },
        presage_cosmique: {
            text: (d) => ({
                weal: 'Fortune tirée au dernier repos long : +1d6, rappelé sous les cases.',
                woe: 'Péril tiré au dernier repos long : −1d6, rappelé sous les cases.'
            })[d.subclassChoices?.omen] ?? 'Présage à noter dans le menu ci-dessous après chaque repos long (dé pair : Fortune, impair : Péril) ; effacé au repos long suivant.',
            partial: true
        }
    },
    aberrant_sorcery: {
        revelation_dans_la_chair: {
            text: (d) => {
                const on = REVELATIONS.filter(([key]) => d.subclassChoices?.[key] === 'on').map(([, name]) => name);
                return on.length
                    ? `Actif : ${on.join(', ')} ; coût : ${on.length} point${on.length > 1 ? 's' : ''} de sorcellerie, à cocher vous-même. Nage et vol rappelés près de la Vitesse ; décochés au repos.`
                    : 'Cochez ci-dessous les avantages pris (un point de sorcellerie chacun) : la fiche rappelle le coût, et la nage ou le vol près de la Vitesse.';
            },
            partial: true
        }
    },
    fiend_patron: {
        resilience_fielonne: {
            text: (d) => {
                const chosen = choiceDefense('fiend_patron', d.subclassChoices);
                return chosen
                    ? `Repère « ${chosen.mention} » près de la CA (onglet Combat) ; rappel du choix à la fin de chaque repos court ou long.`
                    : 'Type à choisir dans le menu ci-dessous (repère « Résistance au choix » près de la CA en attendant) ; rappel à la fin de chaque repos court ou long.';
            },
            partial: true
        }
    },
    the_fates_patron: {
        predictions_des_moires: {
            text: (d) => (d.subclassChoices?.prediction
                ? `Résultat noté : ${d.subclassChoices.prediction}, rappelé sous la case ; effacé au repos suivant.`
                : 'Notez le d20 lancé à la fin de chaque repos dans le menu ci-dessous ; effacé au repos suivant.'),
            partial: true
        }
    },
    diviner: {
        troisieme_il: {
            text: (d) => ({
                darkvision: 'Vision dans le noir à 36 m choisie : repère près de la Vitesse jusqu\'au prochain repos.',
                comprehension: 'Lire toutes les langues choisi, jusqu\'au prochain repos.',
                see: 'Voir l\'invisible choisi : Détection de l\'invisibilité sans emplacement.'
            })[d.subclassChoices?.eye] ?? 'Avantage à choisir dans le menu ci-dessous à chaque utilisation ; effacé au repos.',
            partial: true
        }
    },
    circle_of_the_sea: {
        affinite_aquatique: { text: 'Rappel « Nage = Vitesse » près de la Vitesse (onglet Combat).', partial: true }
    },
    // Voie du Cœur sauvage : sorts lancés seulement en rituel, jamais préparés
    path_of_the_wild_heart: {
        langage_des_betes: { text: 'Bloc « Sorts de sous-classe » de l\'onglet Magie : lancés seulement en rituel, hors du nombre de sorts préparés.' },
        langage_de_la_nature: { text: 'Bloc « Sorts de sous-classe » de l\'onglet Magie : lancé seulement en rituel, hors du nombre de sorts préparés.' },
        // Lot 7 : options choisies dans les menus du bloc (js/data/subclass-choices.js)
        rage_sauvage: {
            text: (d) => {
                const option = d.subclassChoices?.rage;
                if (option === 'bear' || !option) {
                    return `${option ? 'Ours choisi' : 'Option à choisir dans le menu ci-dessous'} : repère « Ours (Rage) » près de la CA (onglet Combat), allumé avec le bouton Rage${option ? '' : ' (retiré si vous choisissez l\'Aigle ou le Loup)'}.`;
                }
                return `${option === 'eagle' ? 'Aigle' : 'Loup'} choisi pour cette Rage : le repère de l'Ours est retiré.`;
            },
            partial: true
        },
        aspect_sauvage: {
            text: (d) => ({
                owl: 'Hibou : vision dans le noir à 18 m (ou +18 m si vous l\'avez déjà), à noter vous-même avec vos sens.',
                panther: 'Panthère : repère « escalade = Vitesse » près de la Vitesse (onglet Combat).',
                salmon: 'Saumon : repère « nage = Vitesse » près de la Vitesse (onglet Combat).'
            })[d.subclassChoices?.aspect] ?? 'Aspect à choisir dans le menu ci-dessous : Panthère et Saumon ajoutent un repère près de la Vitesse.',
            partial: true
        },
        puissance_sauvage: {
            text: (d) => ({
                falcon: 'Faucon : repère « vol = Vitesse » près de la Vitesse, allumé avec le bouton Rage si aucune armure n\'est équipée.',
                lion: 'Lion choisi pour cette Rage (pas de vol).',
                ram: 'Bélier choisi pour cette Rage (pas de vol).'
            })[d.subclassChoices?.power] ?? 'Option à choisir dans le menu ci-dessous : le Faucon ajoute un repère de vol près de la Vitesse.',
            partial: true
        }
    },
    // Lot 5 : boutons du tableau des armes et dés des ressources (js/rules/subclass-combat.js)
    path_of_the_berserker: {
        frenesie: { text: (d) => `Bouton « Frénésie » du tableau des armes : +${frenzyDice(d.level)} au premier coup de Force du tour, compté quand la Rage est allumée aussi.` }
    },
    hunter: {
        proie_du_chasseur: {
            text: (d) => (d.subclassChoices?.prey === 'horde'
                ? 'Briseur de hordes choisi : attaque supplémentaire à jouer vous-même (le bouton « Goût du sang » est retiré du tableau des armes).'
                : `${d.subclassChoices?.prey ? 'Goût du sang choisi' : 'Option à choisir dans le menu ci-dessous'} : bouton « Goût du sang » du tableau des armes (+1d8, une fois par tour).`),
            partial: true
        },
        tactiques_defensives: {
            text: (d) => ({
                escape: "Cauchemar de la horde choisi : les attaques d'opportunité contre vous ont le Désavantage.",
                multiattack: 'Défense contre les attaques multiples choisie : après un coup reçu, Désavantage aux autres attaques de cette créature contre vous ce tour-ci.'
            })[d.subclassChoices?.tactics] ?? 'Option à choisir dans le menu ci-dessous, mémorisée par la fiche.',
            partial: true
        }
    },
    battle_master: {
        superiorite_martiale_des_de_superiorite: { text: (d) => `${countText(d, 'battle_master', 'superiorite_martiale_des_de_superiorite')} (dés de ${superiorityDie(d.level)}) ; bouton « Manœuvre » du tableau des armes pour ajouter le dé aux dégâts.` },
        // Lot 7 : manœuvres choisies dans les menus (js/data/maneuvers.js), détaillées en liste
        superiorite_martiale_man_uvres: {
            text: (d) => {
                const known = maneuversKnown(d.level);
                const chosen = knownManeuvers(d).length;
                return `${chosen} manœuvre${chosen > 1 ? 's' : ''} choisie${chosen > 1 ? 's' : ''} sur ${known} dans les menus ci-dessous (une seule remplaçable aux niveaux 7, 10 et 15). `
                    + 'Celles jouées avec une attaque sont rappelées sous chaque arme, celles de test ou de défense près de l\'Initiative, des compétences ou de la CA.';
            },
            list: (d) => knownManeuvers(d).map(m => `${m.name} (${maneuverNumbers(m, d)}) : ${m.text}`),
            partial: true
        },
        disciple_de_la_guerre: {
            text: (d) => {
                const skill = SKILL_NAMES[d.subclassChoices?.student_skill];
                const tool = ARTISAN_TOOLS.find(([id]) => id === d.subclassChoices?.student_tool)?.[1];
                return `${skill ? `Compétence : ${skill} (repère « à cocher » tant que sa case ne l'est pas)` : 'Compétence à choisir dans le menu ci-dessous'} ; `
                    + `${tool ? `outils : ${tool}, à noter dans le champ Outils` : 'outils d\'artisan à choisir'}.`;
            },
            partial: true
        },
        implacable: { text: 'Une fois par tour, en utilisant une manœuvre : lancez 1d8 au lieu de dépenser un dé de supériorité (les cases ne changent pas).', partial: true },
        dd_des_man_uvres: { text: (d) => `DD des manœuvres : ${maneuverDC(d)} (8 + Force ou Dextérité + maîtrise), rappelé sous chaque arme.` },
        superiorite_martiale_amelioree: { text: (d) => (d.level >= 18
            ? 'Remplacé par le d12 de Supériorité martiale ultime (niveau 18).'
            : 'Dé de supériorité d10 compté (bouton et rappels).') },
        superiorite_martiale_ultime: { text: 'Dé de supériorité d12 compté (bouton et rappels).' }
    },
    path_of_the_world_tree: {
        racines_percutantes: { text: 'Rappel sous les armes de corps à corps Lourdes ou Polyvalentes (onglet Combat).', partial: true }
    },
    // Lot 6 : tiers de lanceur (emplacements calculés par DD_RULES.getSpellSlots, table « third »)
    eldritch_knight: {
        incantation_emplacements_de_sorts: { text: 'Emplacements de sorts calculés (onglet Magie), rendus au repos long.' },
        incantation_sorts_mineurs_et_sorts_prepares: { text: (d) => `À respecter vous-même : ${thirdCasterPrepared(d.level)} sorts préparés de niveau 1+, ${d.level >= 10 ? 3 : 2} sorts mineurs (liste du Magicien, proposée par défaut dans l'onglet Magie).`, partial: true },
        incantation_caracteristique: { text: (d) => spellAbilityText(d), partial: true }
    },
    arcane_trickster: {
        incantation: { text: (d) => `Emplacements de sorts calculés (onglet Magie). À respecter vous-même : ${thirdCasterPrepared(d.level)} sorts préparés de niveau 1+, Main de mage + ${d.level >= 10 ? 3 : 2} sorts mineurs (liste du Magicien). ${spellAbilityText(d)}`, partial: true }
    },
    // Lot 7 : école choisie dans le menu (js/data/subclass-choices.js) ; les textes des écoles
    // s'affichent seulement sous l'école active (subclassFeatures)
    academy_philosopher: {
        ecole_philosophique: {
            text: (d) => {
                const [first, second] = philosopherSchools(d);
                if (!first) return 'École à choisir dans le menu ci-dessous : ses cases, ses repères et ses sorts s\'afficheront, avec son détail sous son nom.';
                if (first !== 'eclectisme') return `École choisie : ${schoolLabel(first)} (détail sous son nom ; les autres écoles sont repliées).`;
                if (second) return `École choisie : Éclectisme, avec ${schoolLabel(second)} comme seconde école (détail sous leurs noms ; les autres écoles sont repliées).`;
                return (Number(d.level) || 1) >= 5
                    ? 'École choisie : Éclectisme ; seconde école à choisir dans le second menu ci-dessous.'
                    : 'École choisie : Éclectisme ; second menu (seconde école) au niveau 5.';
            },
            partial: true
        },
        cynisme: {
            text: 'Rappel chiffré : copier un nouveau sort dans le grimoire coûte 1 h et 25 po par niveau du sort (au lieu de 2 h et 50 po). Composantes matérielles d\'une valeur totale de 50 po au plus : 10 minutes de recherche sur place.',
            partial: true
        },
        eclectisme: {
            text: (d) => {
                const second = philosopherSchools(d)[1];
                const lang = 'Langue en plus : à noter vous-même dans Langues.';
                if (second) return `Seconde école : ${schoolLabel(second)}, ses cases et ses repères s'ajoutent. ${lang}`;
                return (Number(d.level) || 1) >= 5
                    ? `Seconde école à choisir dans le menu sous « École philosophique ». ${lang}`
                    : `Seconde école au niveau 5 (menu sous « École philosophique »). ${lang}`;
            },
            partial: true
        },
        empirisme: {
            text: (d) => `${CHECK_TEXT('de Perception')} Lancer gratuit d'Identification ou de Détection de la magie (un seul des deux) : ${countText(d, 'academy_philosopher', 'empirisme')}.`,
            partial: true
        },
        epicurisme: {
            text: (d) => `Réaction qui impose le Désavantage, autant de fois que votre modificateur d'Intelligence : ${countText(d, 'academy_philosopher', 'epicurisme')}.`,
            partial: true
        },
        stoicisme: {
            text: (d) => `${countText(d, 'academy_philosopher', 'stoicisme')} ; l'emplacement de niveau 1+ dépensé est à cocher vous-même (emplacements de l'onglet Magie).`,
            partial: true
        },
        sophisme: {
            text: (d) => `Expertise en Persuasion (+${2 * (Number(d.pb) || 2)}) : rappel « À vérifier » près de la compétence tant que la case Expertise n'est pas cochée. Amis dans le bloc « Sorts de sous-classe » de l'onglet Magie, en plus de vos sorts mineurs.`,
            partial: true
        },
        hedonisme: {
            text: (d) => `Soin reçu d'un sort ou d'une capacité : +${2 * (Number(d.level) || 1)} PV (2 × niveau de Magicien) ; ${countText(d, 'academy_philosopher', 'hedonisme')}.`,
            partial: true
        },
        scepticisme: {
            text: 'Repère « Avantage contre sorts » près de la CA (onglet Combat) ; l\'Avantage est à jouer vous-même.',
            partial: true
        }
    },
    way_of_the_shield_dancer: {
        technique_aresienne_bouclier_compatible: { text: 'Avec un bouclier : CA sans armure, Arts martiaux et DD de Lutte calculés.' },
        technique_aresienne_maitrise_des_boucliers: { text: 'Rappel « À vérifier » près de la CA tant que la case Boucliers n\'est pas cochée.' }
    }
};

/**
 * Capacités qui donnent des sorts du bloc « Sorts de sous-classe » (js/data/subclass-spells.js) :
 * true = la capacité se résume à ces sorts (« Calculé ») ; un texte = le reste de la capacité, qui
 * reste un rappel (« En partie »).
 */
const SPELL_FEATURES = {
    path_of_the_wild_heart: { langage_des_betes: true, langage_de_la_nature: true },
    college_of_glamour: { magie_enjoleuse_sorts_toujours_prepares: true, manteau_de_majeste: 'Injonction sans emplacement :' },
    life_domain: { sorts_du_domaine_de_la_vie: true },
    light_domain: { sorts_du_domaine_de_la_lumiere: true },
    trickery_domain: { sorts_du_domaine_de_la_supercherie: true },
    war_domain: { sorts_du_domaine_de_la_guerre: true },
    prophecy_domain: { sorts_du_domaine_de_la_prophetie: true, conscience_etendue: 'Maîtrise de Perception : rappel « À vérifier » près de la compétence tant qu\'elle n\'est pas cochée.' },
    circle_of_the_moon: { sorts_du_cercle_de_la_lune: true },
    circle_of_the_sea: { sorts_du_cercle_de_la_mer: true },
    circle_of_the_stars: { carte_stellaire: 'Rayon traçant sans emplacement :' },
    circle_of_the_land: { sorts_du_cercle_de_la_terre: true },
    circle_of_sacrifice: { rituel_de_sacrifice: 'Immolation et bonus aux dégâts : rappel.', sagesse_des_astres: 'Rameaux et Cercle de pierres : rappel.' },
    psi_warrior: { maitre_telekinesiste: 'Attaque en action bonus : rappel. Télékinésie sans emplacement :' },
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
    illusionist: { illusions_ameliorees: 'Composantes et portée des illusions : rappel.', creatures_fantasmagoriques: 'Lancers gratuits en illusion :' },
    oath_of_devotion: { sorts_du_serment_de_devotion: true },
    oath_of_glory: { sorts_du_serment_de_gloire: true },
    oath_of_the_ancients: { sorts_du_serment_des_anciens: true },
    oath_of_vengeance: { sorts_du_serment_de_vengeance: true },
    oath_of_the_dragonlords: { sorts_du_serment: true }
};

/** « 4 cases dans l'onglet Combat, rendues au repos court ou long » (SUBCLASS_COUNTERS) */
function countText(derived, subclass, feature) {
    const def = SUBCLASS_COUNTERS[subclass]?.find(c => c.feature === feature);
    if (!def) return '';
    const n = Math.max(0, Math.trunc(def.max(derived)) || 0);
    const kind = typeof def.reset === 'function' ? def.reset(derived) : def.reset;
    const reset = SUBCLASS_RESET_TEXT[kind];
    if (n === 0) return 'aucune case tant que le modificateur n\'est pas positif';
    return kind === 'shortOne'
        ? `${n} cases dans l'onglet Combat (${reset})`
        : `${n} case${n > 1 ? 's' : ''} dans l'onglet Combat, rendue${n > 1 ? 's' : ''} au ${reset}`;
}

/**
 * Textes générés (lot 5) : capacités à cases (SUBCLASS_COUNTERS) et Résistances rappelées près de la
 * CA (SUBCLASS_DEFENSES). L'effet lui-même reste à jouer : « En partie », sauf Résistance permanente.
 */
const PERMANENT_DEFENSES = ['war_domain', 'aberrant_sorcery', 'great_old_one_patron', 'abjurer', 'celestial_patron'];
const GENERATED_AUTOMATION = {};
for (const [subclass, list] of Object.entries(SUBCLASS_COUNTERS)) {
    for (const def of list) {
        (GENERATED_AUTOMATION[subclass] ??= {})[def.feature] = { text: (d) => `${countText(d, subclass, def.feature)}.`, partial: true };
    }
}
for (const [subclass, , featId, , mention, , buff] of SUBCLASS_DEFENSES) {
    const marker = `Repère « ${mention} » près de la CA (onglet Combat)${buff === 'rage' ? ', allumé avec le bouton Rage' : ''}`;
    const counter = GENERATED_AUTOMATION[subclass]?.[featId];
    (GENERATED_AUTOMATION[subclass] ??= {})[featId] = counter
        // Capacité à cases et à Résistance (Cri de guerre) : les deux
        ? { text: (d) => `${countText(d, subclass, featId)} ; ${marker.charAt(0).toLowerCase()}${marker.slice(1)}.`, partial: true }
        : { text: `${marker}.`, ...(PERMANENT_DEFENSES.includes(subclass) ? {} : { partial: true }) };
}

/**
 * Une capacité à cases qui a déjà un texte (sorts, texte écrit à la main) : le nombre de cases est
 * ajouté à la fin, sauf si le texte parle déjà des cases de l'onglet Combat.
 */
function withCounter(entry, subclass, feature) {
    // Texte (ou source de la fonction) qui parle déjà des cases : inchangé
    if (/onglet Combat|[Cc]ases? dans|countText|COMBAT_BOXES/.test(String(entry.text))) return entry;
    const own = (d) => (typeof entry.text === 'function' ? entry.text(d) : entry.text);
    return { ...entry, partial: true, text: (d) => `${own(d)} ${countText(d, subclass, feature)}.` };
}

export const SUBCLASS_AUTOMATION = Object.freeze(Object.fromEntries(
    [...new Set([...Object.keys(MANUAL_AUTOMATION), ...Object.keys(SPELL_FEATURES), ...Object.keys(GENERATED_AUTOMATION)])]
        .map(subclass => {
            const written = {
                ...Object.fromEntries(Object.entries(SPELL_FEATURES[subclass] ?? {}).map(([id, rest]) => [id, rest === true
                    ? { text: SPELLS_TEXT }
                    : { text: `${SPELLS_TEXT} ${rest}`, partial: true }])),
                ...MANUAL_AUTOMATION[subclass]
            };
            const entries = { ...GENERATED_AUTOMATION[subclass], ...written };
            for (const def of SUBCLASS_COUNTERS[subclass] ?? []) {
                if (written[def.feature]) entries[def.feature] = withCounter(written[def.feature], subclass, def.feature);
            }
            return [subclass, entries];
        })));

/**
 * Fureur divine (Voie du Zélote, PHB 2024, niveau 3) : 1d6 + la moitié du niveau de Barbare, une fois
 * par tour pendant la Rage, avec une arme ou une attaque à mains nues.
 * @param {{ classSlug: string, subclass?: string, level: number }} stats - deriveCharacter()
 * @returns {string} « 1d6+2 », ou '' si le personnage n'a pas la capacité
 */
export function divineFuryDie({ classSlug, subclass = '', level = 1 } = {}) {
    if (classSlug !== 'barbarian' || subclass !== 'path_of_the_zealot' || level < 3) return '';
    return `1d6+${Math.floor(level / 2)}`;
}

/**
 * Groupe de sorts retenu par un choix de sous-classe (lot 7) : terre du Cercle de la Terre, domaine
 * de l'Ancêtre divin. undefined : pas de groupe choisi.
 * @param {string} subclass
 * @param {Object<string, string>} [choice] - derived.subclassChoices
 * @returns {string|undefined} libellé du groupe (« Aride », « Guerre »)
 */
function chosenSpellGroup(subclass, choice = {}) {
    if (subclass === 'circle_of_the_land') return LAND_TYPES.find(([id]) => id === choice?.land)?.[1];
    if (subclass === 'demigod_bloodline') return DIVINE_DOMAINS.find(([id]) => id === choice?.domain)?.[1];
    return undefined;
}

/**
 * Sorts toujours préparés (ou connus) donnés par la sous-classe (js/data/subclass-spells.js).
 * Cercle de la Terre : avec une terre choisie, seuls ses sorts sont donnés, ceux des autres terrains
 * (déjà atteints) vont dans `others` ; sans choix, tous les terrains (affichage d'avant le lot 7).
 * Ascendance divine : seuls les sorts du domaine choisi ; aucun sans choix.
 * Philosophe de l'Académie : seulement ceux des écoles actives (Amis avec le Sophisme) ; aucun sans choix.
 * @param {{ subclass: string, level: number, subclassChoices?: Object }} derived - deriveCharacter()
 * @returns {{ reached: SubclassSpell[], upcoming: SubclassSpell[], others: SubclassSpell[] }}
 *   reached : sorts déjà donnés ; upcoming : ceux des niveaux suivants ; others : terrains non
 *   choisis (Cercle de la Terre). SubclassSpell :
 *   { classLevel, vo, name, level (niveau du sort, 0 = sort mineur), ritual, note?, group?, aka? } ;
 *   aka : autre(s) nom(s) du sort (celui de data/spells.json quand le livre en diffère)
 *   group : terrain du Cercle de la Terre ou domaine de l'Ancêtre divin
 */
export function subclassSpells({ subclass = '', level = 1, subclassChoices = {} } = {}) {
    const rows = Object.hasOwn(SUBCLASS_SPELLS, subclass) ? SUBCLASS_SPELLS[subclass] : [];
    const spells = rows.map(([classLevel, vo, name, spellLevel, flag, options]) => ({
        classLevel, vo, name, level: spellLevel, ritual: flag === 'R',
        ...(options?.note ? { note: options.note } : {}),
        ...(options?.group ? { group: options.group } : {}),
        ...(options?.aka ? { aka: options.aka } : {})
    }));
    const group = chosenSpellGroup(subclass, subclassChoices);
    // Philosophe de l'Académie : seulement les sorts des écoles actives (Amis du Sophisme)
    const schools = subclass === 'academy_philosopher' ? philosopherSchools({ subclass, subclassChoices }).map(schoolLabel) : null;
    // Domaine de l'Ancêtre divin pas encore choisi : rien à afficher
    const kept = schools ? spells.filter(spell => schools.includes(spell.group))
        : group || subclass !== 'demigod_bloodline' ? spells.filter(spell => !group || spell.group === group) : [];
    return {
        reached: kept.filter(spell => spell.classLevel <= level),
        upcoming: kept.filter(spell => spell.classLevel > level),
        others: group && subclass === 'circle_of_the_land'
            ? spells.filter(spell => spell.group !== group && spell.classLevel <= level)
            : []
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
 * @property {SubclassFeature[]} options - options de cette capacité (écoles du Philosophe) ; une
 *   option choisie porte chosen: true (et second: true pour la seconde école de l'Éclectisme) et son
 *   automation ; les autres ont automation: null
 * @property {boolean} [chosen]
 * @property {boolean} [second]
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
    // Texte et liste (lot 7 : manœuvres choisies…) calculés pour le personnage
    const resolve = (entry) => {
        if (!entry) return null;
        const text = typeof entry.text === 'function' ? entry.text(derived) : entry.text;
        const list = typeof entry.list === 'function' ? entry.list(derived) : entry.list;
        return { ...entry, text, ...(list ? { list } : {}) };
    };
    // Option choisie (école du Philosophe) : marquée, avec ce que la fiche en fait ; les autres non
    const [chosen, second] = philosopherSchools(derived);
    const option = (feature) => {
        const isChosen = feature.id === chosen || feature.id === second;
        return {
            ...feature, options: [],
            automation: isChosen ? resolve(automation[feature.id]) : null,
            ...(isChosen ? { chosen: true } : {}), ...(second && feature.id === second ? { second: true } : {})
        };
    };
    const shape = (feature) => ({
        ...feature,
        automation: resolve(automation[feature.id]),
        options: list.filter(other => other.optionOf === feature.id).map(option)
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
 * dans son grimoire (nom français, ancien nom (aka) ou anglais, sans tenir compte de la mise en forme, de la casse, des
 * accents, de l'apostrophe courbe ni des espaces en trop).
 * @param {Array<{ name: string, vo: string }>} spells - subclassSpells().reached
 * @param {Array<{ name?: string }>} rows - dynamic_spells
 * @returns {Array<Object>} copies des sorts, avec listed: boolean
 */
export function markListedSpells(spells, rows) {
    const listed = new Set((Array.isArray(rows) ? rows : []).map(row => spellKey(row?.name)).filter(Boolean));
    return spells.map(spell => ({ ...spell, listed: [spell.name, spell.vo, ...(spell.aka ?? [])].some(name => listed.has(spellKey(name))) }));
}
