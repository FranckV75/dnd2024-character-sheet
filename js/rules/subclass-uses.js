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
//  - Voie du Zélote (« Path of the Zealot ») : Soldat des dieux (« Warrior of the Gods »), réserve
//    de d12 : 4, 5 au niveau 6, 6 au niveau 12, 7 au niveau 17, toute rendue au Repos long ;
//    Détermination fanatique (« Fanatical Focus »), une fois par Rage active ; Présence zélée
//    (« Zealous Presence »), une fois par Repos long, ou rendue en dépensant une Rage (le joueur
//    décoche alors la case lui-même) ; Rage des dieux (« Rage of the Gods »), une fois par Repos long ;
//  - Serments du Paladin : Défense glorieuse (Gloire, niveau 15), Charisme fois (minimum 1) par Repos
//    long ; Sentinelle impérissable (Anciens, niveau 15) ; capacités du niveau 20 (Nimbe sacré, Légende
//    vivante, Champion des Anciens, Ange vengeur), une fois par Repos long ;
//  - Serment des Seigneurs Dragons (Odyssée) : Lien indestructible, une fois par Repos long ;
//  - lot 5 : ressources de combat de 32 sous-classes (dés de supériorité, dés psioniques qui reviennent
//    un par un au repos court, Lumière guérisseuse, usages « Sagesse/Charisme fois »…), d'après les
//    textes de js/data/subclass-features.js, eux-mêmes vérifiés dans le manuel.
// Fonctions pures : le personnage reçu n'est jamais modifié, elles renvoient un patch.
// =============================================================================

import { SUBCLASS_FEATURES } from '../data/subclass-features.js';
import { DD_RULES } from '../data/dd-rules.js';
import { RESET_TEXT } from './feat-uses.js';
import { superiorityDiceCount, psionicDice } from './subclass-combat.js';
import { CREATURE_TYPES, DIVINE_DOMAINS } from '../data/subclass-choices.js';
import { SUBCLASS_SPELLS } from '../data/subclass-spells.js';
import { philosopherSchools } from './subclass-choices.js';

export const SUBCLASS_USES_KEY = 'subclass_uses';

/** Une fois par Repos long */
const once = () => 1;
/** Modificateur de Sagesse ou de Charisme, minimum 1 */
const wisMin1 = ({ mods }) => Math.max(1, Number(mods?.wis) || 0);
const chaMin1 = ({ mods }) => Math.max(1, Number(mods?.cha) || 0);
/** Noms des deux sorts du domaine choisi pour l'Ancêtre divin (Ascendance divine), ou [] */
function divineAncestorSpells({ subclassChoices: c } = {}) {
    const domain = DIVINE_DOMAINS.find(([id]) => id === c?.domain)?.[1];
    return domain ? (SUBCLASS_SPELLS.demigod_bloodline ?? []).filter(row => row[5]?.group === domain).map(row => row[2]) : [];
}
/** Modificateur d'Intelligence, sans minimum (Philosophe de l'Académie : aucune case s'il est nul) */
const intMod = ({ mods }) => Math.max(0, Number(mods?.int) || 0);

/**
 * Capacités à cases, par sous-classe (clé de DD_RULES.subclasses).
 *  - feature : id de la capacité (js/data/subclass-features.js) ; elle doit être atteinte ;
 *  - label : nom des cases ; inText : le même au milieu d'une phrase ; max(derived) : nombre de cases ;
 *  - reset : 'long' (repos long), 'short' (repos court ou long), 'rage' (fin de la Rage ou tout repos),
 *    'shortOne' (une case au repos court, toutes au repos long : dés psioniques), ou une fonction
 *    (derived) qui renvoie l'un d'eux (Éclat protecteur : repos court à partir du niveau 6) ;
 *  - use : à quoi sert une case (phrase courte), ou une fonction (derived) qui la donne selon un choix
 *    de sous-classe (lot 7 : présage tiré, type de monstre, domaine, d20 noté…) ;
 *  - school : école du Philosophe de l'Académie qui donne la case (absente sans ce choix).
 */
export const SUBCLASS_COUNTERS = Object.freeze({
    path_of_the_zealot: [
        {
            feature: 'guerrier_des_dieux',
            label: 'Soldat des dieux (d12)',
            inText: 'dés de Soldat des dieux',
            max: ({ level }) => (level >= 17 ? 7 : level >= 12 ? 6 : level >= 6 ? 5 : 4),
            reset: 'long',
            use: 'Action Bonus : lancez autant de ces d12 que vous voulez et regagnez le total en PV.'
        },
        {
            feature: 'focalisation_fanatique',
            label: 'Détermination fanatique',
            inText: 'Détermination fanatique',
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
        { feature: 'sentinelle_immortelle', label: 'Sentinelle impérissable', inText: 'Sentinelle impérissable', max: once, reset: 'long',
            use: 'Tombé à 0 PV sans mourir : restez à 1 PV et regagnez 3 fois votre niveau de Paladin en PV.' },
        { feature: 'champion_antique', label: 'Champion des Anciens', inText: 'Champion des Anciens', max: once, reset: 'long',
            use: 'Action Bonus, 1 minute. Un emplacement de niveau 5 la rend (décochez).' }
    ],
    oath_of_vengeance: [
        { feature: 'ange_vengeur', label: 'Ange vengeur', inText: 'Ange vengeur', max: once, reset: 'long',
            use: 'Action Bonus, 10 minutes. Un emplacement de niveau 5 la rend (décochez).' }
    ],
    oath_of_the_dragonlords: [
        // Lot 7 : souffle du dragon lié (pacte du Seigneur Dragon, Odyssée p. 55) : une fois, puis repos
        // court ou long ; au niveau 20 (Lien indestructible), recharge normale sur 5-6 : plus de case
        { feature: 'lien_du_seigneur_dragon', label: 'Souffle du dragon', inText: 'Souffle du dragon',
            max: ({ level = 1 }) => (level >= 20 ? 0 : 1), reset: 'short',
            use: 'Le dragon lié souffle une fois, puis il doit finir un repos court ou long.' },
        { feature: 'lien_indestructible', label: 'Lien indestructible', inText: 'Lien indestructible', max: once, reset: 'long',
            use: 'Votre dragon rate une sauvegarde : il la réussit à la place.' }
    ],
    // Lot 5 : ressources de combat (PHB 2024 et Odyssée ; textes de js/data/subclass-features.js)
    path_of_the_berserker: [
        { feature: 'presence_intimidante', label: "Présence intimidante", inText: "Présence intimidante", max: once, reset: 'long',
            use: "Action Bonus : sauvegarde de Sagesse ou Effrayé 1 minute. Dépenser une Rage la rend (décochez)." }
    ],
    college_of_glamour: [
        { feature: 'magie_enjoleuse_charme_ou_effroi', label: "Magie envoûtante", inText: "Magie envoûtante", max: once, reset: 'long',
            use: "Après un sort d'Enchantement ou d'Illusion : Charmé ou Effrayé. Une Inspiration bardique la rend (décochez)." },
        { feature: 'majeste_inebranlable', label: "Majesté souveraine", inText: "Majesté souveraine", max: once, reset: 'short',
            use: "Action Bonus, 1 minute : qui vous touche fait une sauvegarde de Charisme ou rate." },
        { feature: 'manteau_de_majeste', label: "Mante de majesté", inText: "Mante de majesté", max: once, reset: 'long',
            use: "Action Bonus : Injonction sans emplacement, 1 minute. Un emplacement de niveau 3+ la rend (décochez)." }
    ],
    light_domain: [
        { feature: 'flash_protecteur', label: "Éclat protecteur", inText: "Éclat protecteur", max: wisMin1,
            // Éclat protecteur amélioré (niveau 6) : rendu aussi au repos court
            reset: ({ level }) => (level >= 6 ? 'short' : 'long'),
            use: "Réaction : Désavantage à une attaque à 9 m." },
        { feature: 'couronne_de_lumiere', label: "Auréole", inText: "Auréole", max: wisMin1, reset: 'long',
            use: "Action Magie, 1 minute : Désavantage aux sauvegardes contre le feu et le radiant." }
    ],
    war_domain: [
        { feature: 'pretre_de_guerre', label: "Prêtre de guerre", inText: "Prêtre de guerre", max: wisMin1, reset: 'short',
            use: "Action Bonus : une attaque avec une arme ou à mains nues." }
    ],
    prophecy_domain: [
        { feature: 'perception_du_danger', label: "Perception du danger", inText: "Perception du danger", max: () => 2, reset: 'short',
            use: "Réaction : déplacement et sort bénéfique sur un allié blessé ou qui rate une sauvegarde." },
        { feature: 'vapeurs_regeneratrices', label: "Vapeurs régénératrices", inText: "Vapeurs régénératrices", max: once, reset: 'long',
            use: "Effet de Nappe de brouillard ajouté à un sort de soins, sur l'une des cibles." }
    ],
    circle_of_the_land: [
        { feature: 'recuperation_naturelle', label: "Ressourcement", inText: "Ressourcement", max: () => 2, reset: 'long',
            use: "Une case pour le sort du Cercle sans emplacement, une pour les emplacements regagnés après un repos court." }
    ],
    circle_of_the_moon: [
        { feature: 'pas_de_lune', label: "Foulée sélène", inText: "Foulée sélène", max: wisMin1, reset: 'long',
            use: "Action Bonus : téléportation de 9 m, Avantage à la prochaine attaque. Un emplacement de niveau 2+ en rend une (décochez)." }
    ],
    circle_of_the_stars: [
        { feature: 'presage_cosmique', label: "Présage cosmique", inText: "Présage cosmique", max: wisMin1, reset: 'long',
            // Lot 7 : selon le présage tiré au repos long (menu « omen »)
            use: ({ subclassChoices: c } = {}) => ({
                weal: "Réaction : +1d6 (Fortune) au test d20 d'une créature visible à 9 m.",
                woe: "Réaction : −1d6 (Péril) au test d20 d'une créature visible à 9 m."
            })[c?.omen] ?? "Réaction : +1d6 (Fortune) ou −1d6 (Péril) à un test d20 à 9 m." },
        { feature: 'carte_stellaire', label: "Carte stellaire", inText: "Carte stellaire", max: wisMin1, reset: 'long',
            use: "Rayon traçant sans emplacement (carte en main)." }
    ],
    battle_master: [
        { feature: 'superiorite_martiale_des_de_superiorite', label: "Dés de supériorité", inText: "dés de supériorité", max: ({ level }) => superiorityDiceCount(level), reset: 'short',
            use: "Une case par manœuvre utilisée (dé et DD sous chaque arme)." },
        { feature: 'connais_ton_ennemi', label: "Observation de l'ennemi", inText: "Observation de l'ennemi", max: once, reset: 'long',
            use: "Action Bonus : immunités, résistances et vulnérabilités d'une créature. Un dé de supériorité la rend (décochez)." }
    ],
    psi_warrior: [
        { feature: 'pouvoir_psionique_des_d_energie_psionique', label: "Dés psioniques", inText: "dés psioniques", max: ({ level }) => psionicDice(level).count, reset: 'shortOne',
            use: "Champ protecteur, Frappe psionique… : une case par dé dépensé." },
        { feature: 'mouvement_telekinesique', label: "Déplacement télékinétique", inText: "Déplacement télékinétique", max: once, reset: 'short',
            use: "Action Magie : déplacer un objet ou une créature consentante de 9 m. Un dé psionique la rend (décochez)." },
        { feature: 'adepte_telekinesique_bond_psionique', label: "Bond psi", inText: "Bond psi", max: once, reset: 'short',
            use: "Action Bonus : vol au double de la Vitesse jusqu'à la fin du tour. Un dé psionique la rend (décochez)." },
        { feature: 'rempart_de_force', label: "Rempart de force", inText: "Rempart de force", max: once, reset: 'long',
            use: "Action Bonus, 1 minute : abri partiel pour des alliés. Un dé psionique la rend (décochez)." },
        { feature: 'maitre_telekinesiste', label: "Maître télékinétique", inText: "Maître télékinétique", max: once, reset: 'long',
            use: "Télékinésie sans emplacement. Un dé psionique la rend (décochez)." }
    ],
    soulknife: [
        { feature: 'pouvoir_psionique', label: "Dés psioniques", inText: "dés psioniques", max: ({ level }) => psionicDice(level).count, reset: 'shortOne',
            use: "Savoir-faire, Murmures psychiques… : une case par dé dépensé." },
        { feature: 'voile_psychique', label: "Voile psychique", inText: "Voile psychique", max: once, reset: 'long',
            use: "Action Magie : Invisible 1 heure. Un dé psionique la rend (décochez)." },
        { feature: 'dechirure_mentale', label: "Rupture spirituelle", inText: "Rupture spirituelle", max: once, reset: 'long',
            use: "Sauvegarde de Sagesse ou Étourdi. 3 dés psioniques la rendent (décochez)." }
    ],
    odyssean_champion: [
        { feature: 'phalange', label: "Mur de boucliers", inText: "Mur de boucliers", max: once, reset: 'long',
            use: "Action Bonus, 1 minute : +2 à la CA près d'un allié avec bouclier, +1 de plus avec un bouclier." }
    ],
    warrior_of_mercy: [
        { feature: 'deluge_de_soins_et_de_blessures', label: "Déluge de soins et de meurtrissures", inText: "Déluge de soins et de meurtrissures", max: wisMin1, reset: 'long',
            use: "Pendant un Déluge de coups : Main guérisseuse et Main meurtrissante sans point de Credo." },
        { feature: 'main_de_l_ultime_misericorde', label: "Main de l'ultime miséricorde", inText: "Main de l'ultime miséricorde", max: once, reset: 'long',
            use: "Action Magie et 5 points de Credo : ramène à la vie une créature morte depuis moins de 24 h." }
    ],
    fey_wanderer: [
        { feature: 'renforts_feeriques', label: "Renforts féeriques", inText: "Renforts féeriques", max: once, reset: 'long',
            use: "Convocation de fée sans emplacement." },
        { feature: 'errant_des_brumes', label: "Vagabond des brumes", inText: "Vagabond des brumes", max: wisMin1, reset: 'long',
            use: "Foulée brumeuse sans emplacement, avec un passager." }
    ],
    gloom_stalker: [
        { feature: 'embusqueur_redoutable_frappe_effroyable', label: "Frappe effroyable", inText: "Frappe effroyable", max: wisMin1, reset: 'long',
            use: "Une case par Frappe effroyable (bouton du tableau des armes)." }
    ],
    amazon_warrior: [
        { feature: 'cri_de_guerre', label: "Cri de guerre", inText: "Cri de guerre", max: wisMin1, reset: 'long',
            use: ({ subclassChoices: c } = {}) => {
                const foe = CREATURE_TYPES.find(([id]) => id === c?.foe)?.[1];
                return foe
                    ? `Action Bonus, 1 minute : Avantage aux attaques contre : ${foe} ; Résistance C/P/T.`
                    : "Action Bonus, 1 minute : Avantage contre un type de monstre, Résistance C/P/T.";
            } },
        { feature: 'brassards_de_parade', label: "Brassards de parade", inText: "Brassards de parade", max: wisMin1, reset: 'short',
            use: "Réaction quand une attaque vous touche : +5 à la CA jusqu'à votre prochain tour." },
        { feature: 'points_de_pression', label: "Points de pression", inText: "Points de pression", max: wisMin1, reset: 'short',
            use: "Action Bonus : attaque, puis sauvegarde de Constitution ou Paralysé." }
    ],
    arcane_trickster: [
        { feature: 'voleur_de_sorts', label: "Voleur de sorts", inText: "Voleur de sorts", max: once, reset: 'long',
            use: "Réaction : volez un sort qui vous cible." }
    ],
    aberrant_sorcery: [
        { feature: 'implosion_distordante', label: "Distorsion implosive", inText: "Distorsion implosive", max: once, reset: 'long',
            use: "Action Magie : téléportation et 3d10 de force. 5 points de sorcellerie la rendent (décochez)." }
    ],
    clockwork_sorcery: [
        { feature: 'retablissement_de_l_equilibre', label: "Équilibre restauré", inText: "Équilibre restauré", max: chaMin1, reset: 'long',
            use: "Réaction : annule l'Avantage et le Désavantage d'un jet à 18 m." },
        { feature: 'transe_de_l_ordre', label: "Transe harmonique", inText: "Transe harmonique", max: once, reset: 'long',
            use: "Action Bonus, 1 minute : vos d20 de 9 ou moins comptent comme 10. 5 points de sorcellerie la rendent (décochez)." },
        { feature: 'cavalcade_mecanique', label: "Chevauchée mécanique", inText: "Chevauchée mécanique", max: once, reset: 'long',
            use: "Action Magie : 100 PV à répartir, réparations, fin des sorts. 7 points de sorcellerie la rendent (décochez)." }
    ],
    draconic_sorcery: [
        { feature: 'ailes_de_dragon', label: "Ailes draconiques", inText: "Ailes draconiques", max: once, reset: 'long',
            use: "Action Bonus : vol de 18 m pendant 1 heure. 3 points de sorcellerie la rendent (décochez)." },
        { feature: 'compagnon_draconique', label: "Compagnon draconique", inText: "Compagnon draconique", max: once, reset: 'long',
            use: "Convocation de dragon sans emplacement." }
    ],
    wild_magic_sorcery: [
        { feature: 'marees_du_chaos', label: "Marée du chaos", inText: "Marée du chaos", max: once, reset: 'long',
            use: "Avantage à un test d20. Lancer un sort d'Ensorceleur avec un emplacement la rend (décochez, et lancez la Bouffée)." },
        { feature: 'deferlante_domptee', label: "Bouffée domptée", inText: "Bouffée domptée", max: once, reset: 'long',
            use: "Après un sort avec emplacement : effet de Bouffée choisi au lieu d'être tiré." }
    ],
    demigod_bloodline: [
        { feature: 'ancetre_divin', label: "Sorts de l'ancêtre divin", inText: "Sorts de l'ancêtre divin", max: () => 2, reset: 'short',
            use: (derived = {}) => {
                const spells = divineAncestorSpells(derived);
                return spells.length
                    ? `Sans emplacement : ${spells.join(', ')} (une case par sort).`
                    : "Une case par sort du domaine lancé sans emplacement.";
            } },
        { feature: 'resistance_divine', label: "Résistance divine", inText: "Résistance divine", max: once, reset: 'long',
            use: "Une sauvegarde ratée devient réussie." }
    ],
    archfey_patron: [
        { feature: 'foulees_feeriques', label: "Foulée des fées", inText: "Foulée des fées", max: chaMin1, reset: 'long',
            use: "Foulée brumeuse sans emplacement, avec un effet en plus." },
        { feature: 'defenses_envoutantes', label: "Charmantes défenses", inText: "Charmantes défenses", max: once, reset: 'long',
            use: "Réaction quand on vous touche : dégâts divisés par deux, renvoyés en psychique. Un emplacement de pacte la rend (décochez)." }
    ],
    celestial_patron: [
        { feature: 'lumiere_guerisseuse', label: "Lumière guérisseuse (d6)", inText: "dés de Lumière guérisseuse", max: ({ level }) => 1 + level, reset: 'long',
            use: "Action Bonus : lancez des d6 de la réserve (Charisme au maximum à la fois) et rendez le total en PV." },
        { feature: 'vengeance_brulante', label: "Vengeance aveuglante", inText: "Vengeance aveuglante", max: once, reset: 'long',
            use: "Jet contre la mort : moitié des PV maximum, et 2d8 + Charisme radiants autour." }
    ],
    fiend_patron: [
        { feature: 'chance_du_tenebreux', label: "Chance du Ténébreux", inText: "Chance du Ténébreux", max: chaMin1, reset: 'long',
            use: "+1d10 à un test de caractéristique ou une sauvegarde." },
        { feature: 'traversee_des_enfers', label: "Traversée des enfers", inText: "Traversée des enfers", max: once, reset: 'long',
            use: "Sur une attaque qui touche : sauvegarde de Charisme ou 8d10 psychiques. Un emplacement de pacte la rend (décochez)." }
    ],
    great_old_one_patron: [
        { feature: 'combattant_clairvoyant', label: "Combattant clairvoyant", inText: "Combattant clairvoyant", max: once, reset: 'short',
            use: "Avec le lien d'Esprit éveillé : Désavantage pour vous attaquer, Avantage pour vous. Un emplacement de pacte la rend (décochez)." }
    ],
    the_fates_patron: [
        // Lot 7 : un seul d20 par repos (menu « prediction »), perdu au repos suivant
        { feature: 'predictions_des_moires', label: "Prédiction des Moires", inText: "Prédiction des Moires", max: once, reset: 'short',
            use: ({ subclassChoices: c } = {}) => (c?.prediction
                ? `Remplace un jet d'attaque, de sauvegarde ou de caractéristique (le vôtre ou celui d'une créature visible) par ${c.prediction}.`
                : "Notez le d20 lancé à la fin du repos (menu de la capacité) : il remplace un jet d'attaque, de sauvegarde ou de caractéristique.") },
        { feature: 'exigence_des_moires', label: "Exigence des Moires", inText: "Exigence des Moires", max: () => 2, reset: 'long',
            use: "Une créature réduite à 0 PV : un emplacement de sort regagné." },
        { feature: 'nul_n_echappe_a_son_destin', label: "Nul n'échappe à son destin", inText: "Nul n'échappe à son destin", max: once, reset: 'long',
            use: "Action : sauvegarde de Sagesse, sinon la cible doit aller vers une autre créature." }
    ],
    diviner: [
        { feature: 'presage', label: "Présage (d20 notés)", inText: "résultats de Présage", max: ({ level }) => (level >= 14 ? 3 : 2), reset: 'long',
            use: "Notez les d20 lancés après le repos long ; une case par résultat utilisé." },
        { feature: 'troisieme_il', label: "Troisième œil", inText: "Troisième œil", max: once, reset: 'short',
            use: ({ subclassChoices: c } = {}) => ({
                darkvision: "Vision dans le noir à 36 m jusqu'au prochain repos.",
                comprehension: "Lire toutes les langues jusqu'au prochain repos.",
                see: "Détection de l'invisibilité sans emplacement."
            })[c?.eye] ?? "Action Bonus : vision dans le noir 36 m, lire les langues, ou Détection de l'invisibilité." }
    ],
    evoker: [
        { feature: 'surcharge', label: "Surcharge magique (sans contrepartie)", inText: "Surcharge magique (sans contrepartie)", max: once, reset: 'long',
            use: "Dégâts maximum d'un sort de niveau 1 à 5. Les fois suivantes avant le repos long : 2d12 nécrotiques par niveau, puis plus." }
    ],
    illusionist: [
        { feature: 'double_illusoire', label: "Calque illusoire", inText: "Calque illusoire", max: once, reset: 'short',
            use: "Réaction : une attaque vous rate. Un emplacement de niveau 2+ la rend (décochez)." },
        { feature: 'creatures_fantasmagoriques', label: "Créatures fantasmagoriques", inText: "Créatures fantasmagoriques", max: () => 2, reset: 'long',
            use: "Une case par sort lancé sans emplacement (chacun une fois par repos long)." }
    ],
    warrior_of_the_open_hand: [
        { feature: 'plenitude_physique', label: "Plénitude physique", inText: "Plénitude physique", max: wisMin1, reset: 'long',
            use: "Action Bonus : regagnez un dé d'Arts martiaux + Sagesse en PV (minimum 1)." }
    ],
    // Lot 7 : cases d'une école seulement si elle est choisie (school, philosopherSchools) ; la
    // seconde école de l'Éclectisme compte à partir du niveau 5 (Odyssée, p. 44 et 46)
    academy_philosopher: [
        { feature: 'empirisme', school: 'empirisme', label: "Empirisme (sort gratuit)", inText: "Empirisme (sort gratuit)", max: once, reset: 'short',
            use: "Lancez Identification ou Détection de la magie sans emplacement (un seul des deux)." },
        { feature: 'epicurisme', school: 'epicurisme', label: "Épicurisme", inText: "Épicurisme", max: intMod, reset: 'short',
            use: "Réaction : Désavantage à l'attaque d'une créature visible qui vous cible." },
        { feature: 'stoicisme', school: 'stoicisme', label: "Stoïcisme", inText: "Stoïcisme", max: once, reset: 'short',
            use: "Tombé à 0 PV par des dégâts : dépensez un emplacement niv. 1+ (à cocher dans les emplacements) pour rester à 1 PV." },
        { feature: 'hedonisme', school: 'hedonisme', label: "Hédonisme", inText: "Hédonisme", max: once, reset: 'short',
            use: ({ level = 1 } = {}) => `Un sort ou une capacité vous soigne : +${2 * level} PV (2 × niveau de Magicien).` },
        { feature: 'principes_metaphysiques', label: "Principes métaphysiques", inText: "Principes métaphysiques", max: once, reset: 'short',
            use: "Réaction : un sort à cible unique change de cible." },
        { feature: 'paradoxe_magique', label: "Paradoxe magique", inText: "Paradoxe magique", max: intMod, reset: 'long',
            use: "Concentration perdue : vous la gardez." }
    ]
});

/** Texte du rechargement, Rage comprise */
export const SUBCLASS_RESET_TEXT = Object.freeze({
    ...RESET_TEXT, rage: 'fin de la Rage', shortOne: '1 au repos court, toutes au repos long'
});

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

/** Rechargement d'une capacité, au niveau du personnage */
const resetOf = (def, derived) => (typeof def.reset === 'function' ? def.reset(derived ?? {}) : def.reset);

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
 *   max: number, used: number, reset: 'long'|'short'|'rage'|'shortOne', resetText: string, use: string }>}
 */
export function subclassCounters(character, derived) {
    const subclass = derived?.subclass ?? '';
    if (!Object.hasOwn(SUBCLASS_COUNTERS, subclass)) return [];
    const features = SUBCLASS_FEATURES[subclass] ?? [];
    const state = subclassUsesState(character);
    return ALL_COUNTERS.filter(def => def.subclass === subclass).flatMap(def => {
        const feature = features.find(f => f.id === def.feature);
        if (!feature || feature.level > (derived.level ?? 1)) return [];
        // École du Philosophe : seulement l'école (ou la seconde école) choisie
        if (def.school && !philosopherSchools(derived).includes(def.school)) return [];
        const max = Math.max(0, Math.trunc(def.max(derived)) || 0);
        if (max === 0) return [];
        return [{
            key: def.key,
            source: 'subclass',
            feature: def.feature,
            featName: DD_RULES.subclasses[subclass]?.nameFr ?? feature.name,
            level: feature.level,
            label: def.label,
            max,
            used: clampUses(state[def.key], max),
            reset: resetOf(def, derived),
            resetText: SUBCLASS_RESET_TEXT[resetOf(def, derived)],
            use: typeof def.use === 'function' ? def.use(derived) : def.use
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
 * qui reviennent au repos court (la Rage est finie aussi), mais un seul dé psionique ('shortOne') ;
 * repos long = toutes. Les capacités qui ne
 * sont plus atteintes sont vidées elles aussi, mais seules les atteintes sont annoncées (restored).
 * @param {Object} character
 * @param {Object} derived - deriveCharacter(character)
 * @param {'rage'|'short'|'long'} kind
 * @returns {{ patch: Object, restored: Array<{ featId: string, featName: string, label: string, inText: string, count: number }> }}
 *   patch vide si rien n'est à vider
 */
export function restSubclassUses(character, derived, kind) {
    const recharges = (reset) => kind === 'long' || reset === 'rage'
        || (kind === 'short' && (reset === 'short' || reset === 'shortOne'));
    // Dés psioniques : un seul dé rendu au repos court
    const regained = (reset, used) => (kind === 'short' && reset === 'shortOne' ? Math.min(1, used) : used);
    const counters = subclassCounters(character, derived);
    const restored = counters
        .filter(counter => counter.used > 0 && recharges(counter.reset))
        .map(({ feature, featName, label, used, key, reset }) => ({
            featId: feature, featName, label, inText: ALL_COUNTERS.find(def => def.key === key).inText, count: regained(reset, used),
            // Dés psioniques au repos court : ceux qui restent dépensés
            ...(regained(reset, used) < used ? { remaining: used - regained(reset, used) } : {})
        }));
    const state = subclassUsesState(character);
    // Valeur enregistrée, ramenée au maximum actuel pour une capacité atteinte (niveau baissé)
    const usedOf = (def) => clampUses(state[def.key], counters.find(c => c.key === def.key)?.max ?? Infinity);
    const stale = ALL_COUNTERS.filter(def => recharges(resetOf(def, derived)) && clampUses(state[def.key], Infinity) > 0);
    if (!stale.length) return { patch: {}, restored };
    const next = { ...state };
    for (const def of stale) {
        const used = usedOf(def);
        next[def.key] = used - regained(resetOf(def, derived), used);
    }
    return { patch: { [SUBCLASS_USES_KEY]: next }, restored };
}

/**
 * Le bouton Rage s'éteint (onglet Combat) : les cases « une fois par Rage » se vident
 * (Détermination fanatique du Zélote). Rien si la Rage n'était pas allumée ou le reste.
 * @param {Object} character - fiche avant le changement (combat_buffs actuel)
 * @param {Object} derived - deriveCharacter(character)
 * @param {Object} nextBuffs - combat_buffs après le changement
 * @returns {Object} patch (vide si rien ne change)
 */
export function rageEndPatch(character, derived, nextBuffs) {
    if (character?.combat_buffs?.rage !== true || nextBuffs?.rage === true) return {};
    return restSubclassUses(character, derived, 'rage').patch;
}
