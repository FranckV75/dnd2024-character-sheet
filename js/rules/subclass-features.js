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
import { bardicInspirationDie, monkFocusDC, martialArtsDieText, abilityDC } from './subclass-calcs.js';
import {
    SUBCLASS_DEFENSES, frenzyDice, dreadfulStrikeDice, feyStrikesDie, superiorityDie, maneuverDC, psionicDice
} from './subclass-combat.js';
import { SUBCLASS_COUNTERS, SUBCLASS_RESET_TEXT } from './subclass-uses.js';

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
    college_of_epic_muse: {
        egide_du_poete: { text: 'Rappel « À vérifier » près de la CA tant que la case Intermédiaires n\'est pas cochée.', partial: true }
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
        lien_indestructible: { text: COMBAT_BOXES, partial: true }
    },
    // Lot 4 : petits calculs (js/rules/subclass-calcs.js)
    champion: {
        style_de_combat_supplementaire: { text: 'Second emplacement « Style de combat » dans les dons (onglet Aptitudes & Traits).' },
        critique_ameliore: { text: 'Sous chaque arme (onglet Combat) : « Coup critique sur 19 ou 20 ».' },
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
        esprit_d_acier: { text: CHECK_TEXT('de la sauvegarde de Sagesse') },
        embusqueur_redoutable_frappe_effroyable: { text: (d) => `Bouton « Frappe effroyable » du tableau des armes (+${dreadfulStrikeDice(d.level)} psychiques) et ${countText(d, 'gloom_stalker', 'embusqueur_redoutable_frappe_effroyable')}.` },
        deluge_du_traqueur: { text: 'Dé de la Frappe effroyable passé à 2d8 (bouton du tableau des armes) ; attaque en plus ou effroi à jouer vous-même.', partial: true }
    },
    fey_wanderer: {
        charme_surnaturel: { text: (d) => `${signed(Math.max(1, mod(d, 'wis')))} compté dans Intimidation, Persuasion, Représentation et Supercherie ; la compétence au choix est à cocher vous-même.`, partial: true },
        frappes_redoutables: { text: (d) => `Bouton « Frappes redoutables » du tableau des armes : +${feyStrikesDie(d.level)} psychiques.` }
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
        instruments_de_la_misericorde: { text: `${CHECK_TEXT('de Perspicacité et de Médecine', true)} Matériel d'herboriste : à noter vous-même.`, partial: true }
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
        jeu_de_jambes_eblouissant_degats_bardiques: { text: (d) => `Frappe à mains nues calculée (onglet Combat) : Dextérité et 1${bardicInspirationDie(d.level)} contondants, sans armure ni bouclier, quand la Dextérité est au moins égale à la Force.` },
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
        affinite_elementaire: { text: (d) => `Bonus à un jet de dégâts du type choisi : ${signed(mod(d, 'cha'))} ; Résistance rappelée près de la CA.`, partial: true }
    },
    demigod_bloodline: {
        la_force_en_heritage: { text: `Armes de corps à corps : Charisme utilisé quand il est meilleur (onglet Combat). ${CHECK_TEXT('de la sauvegarde de Force')}`, partial: true }
    },
    path_of_the_heretic: {
        lutteur_precoce: { text: CHECK_TEXT('d\'Athlétisme'), partial: true },
        archer_aux_muscles_d_acier: { text: 'Arc long : Force utilisée quand elle dépasse la Dextérité (onglet Combat).', partial: true },
        foulee_du_titan: { text: (d) => `Sauvegarde de Constitution DD ${abilityDC(d, 'str')} (8 + Force + maîtrise).`, partial: true }
    },
    circle_of_the_sea: {
        affinite_aquatique: { text: 'Rappel « Nage = Vitesse » près de la Vitesse (onglet Combat).', partial: true }
    },
    // Lot 5 : boutons du tableau des armes et dés des ressources (js/rules/subclass-combat.js)
    path_of_the_berserker: {
        frenesie: { text: (d) => `Bouton « Frénésie » du tableau des armes : +${frenzyDice(d.level)} au premier coup de Force du tour, compté quand la Rage est allumée aussi.` }
    },
    hunter: {
        proie_du_chasseur: { text: 'Bouton « Tueur de colosses » du tableau des armes (+1d8) ; Briseur de hordes à jouer vous-même.', partial: true }
    },
    battle_master: {
        superiorite_martiale_des_de_superiorite: { text: (d) => `${countText(d, 'battle_master', 'superiorite_martiale_des_de_superiorite')} (dés de ${superiorityDie(d.level)}) ; bouton « Manœuvre » du tableau des armes pour ajouter le dé aux dégâts.` },
        superiorite_martiale_man_uvres: { text: 'Dé et DD rappelés sous chaque arme ; la liste de vos manœuvres est à noter vous-même.', partial: true },
        dd_des_man_uvres: { text: (d) => `DD des manœuvres : ${maneuverDC(d)} (8 + Force ou Dextérité + maîtrise), rappelé sous chaque arme.` },
        superiorite_martiale_amelioree: { text: 'Dé de supériorité d10 compté (bouton et rappels).' },
        superiorite_martiale_ultime: { text: 'Dé de supériorité d12 compté (bouton et rappels).' }
    },
    path_of_the_world_tree: {
        racines_percutantes: { text: 'Rappel sous les armes de corps à corps Lourdes ou Polyvalentes (onglet Combat).', partial: true }
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
    (GENERATED_AUTOMATION[subclass] ??= {})[featId] = {
        text: `Repère « ${mention} » près de la CA (onglet Combat)${buff === 'rage' ? ', allumé avec le bouton Rage' : ''}.`,
        ...(PERMANENT_DEFENSES.includes(subclass) ? {} : { partial: true })
    };
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
