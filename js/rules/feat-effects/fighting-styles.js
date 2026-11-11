// =============================================================================
// FEAT-EFFECTS/FIGHTING-STYLES.JS (règles) - Effets des styles de combat (lot 4)
// Manuel des joueurs français p. 209-210, et ce qui peut les remplacer au niveau 2 (Combattant béni,
// Combattant druidique).
// =============================================================================

import { signed, alternativeNotes } from './helpers.js';

export const FIGHTING_STYLE_RULES = {
    // ----- Lot 4 : styles de combat — Manuel des joueurs français p. 209, Protection p. 210 (« Fighting Style Feats ») -----

    // Défense : +1 à la CA en armure légère, intermédiaire ou lourde (compté dans la CA calculée)
    defense: ({ derived: { armorClass }, add }) => {
        const worn = armorClass?.rows?.some(row => row.status === 'counted' && row.line.kind === 'body');
        if (worn) {
            add('armorClass', 'Défense : +1 en armure, déjà compté dans la CA.', { value: 1, applied: true });
            add('featSlot', "+1 à la CA en armure : déjà compté dans la CA (le détail s'affiche en touchant l'écusson).", { value: 1, applied: true });
        } else {
            add('armorClass', 'Défense : seulement en armure (aucune équipée).', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : aucune armure légère, intermédiaire ou lourde équipée.', { inactive: true });
        }
    },

    // Archerie : +2 aux jets d'attaque avec les armes à distance (compté dans le tableau des armes)
    archerie: ({ add }) => {
        add('featSlot', "+2 aux jets d'attaque avec les armes à distance (arcs, arbalètes, frondes, fléchettes) : déjà compté dans le tableau des armes. Pas avec une arme de corps à corps lancée.", { value: 2, applied: true });
    },

    // Duel : +2 aux dégâts, arme de corps à corps à une main et aucune autre arme (bouton Duel)
    duel: ({ add }) => {
        add('featSlot', "+2 aux dégâts avec une arme de corps à corps tenue à une main, sans autre arme. Bouton « Duel (+2) » au-dessus du tableau des armes : allumé, le +2 s'ajoute aux armes de corps à corps qui ne sont pas à Deux mains.");
    },

    // Armes à deux mains : 1 ou 2 sur un dé de dégâts = 3 (arme Deux mains ou Polyvalente, tenue à deux mains)
    arme_a_deux_mains: ({ add }) => {
        add('featSlot', 'Arme de corps à corps Deux mains ou Polyvalente tenue à deux mains : chaque 1 ou 2 sur un dé de dégâts compte comme un 3 (rappel sous ces armes).');
    },

    // Armes de lancer : +2 aux dégâts d'une attaque à distance avec une arme de Lancer (calculé sous l'arme)
    arme_de_lancer: ({ add }) => {
        add('featSlot', "+2 aux dégâts quand vous touchez avec une attaque à distance d'une arme de Lancer : dégâts calculés sous chaque arme de Lancer du tableau.");
    },

    // Combat à deux armes : l'attaque en plus d'une arme Légère garde le modificateur aux dégâts
    combat_a_deux_armes: ({ add }) => {
        add('featSlot', "L'attaque en plus (action Bonus) avec une arme Légère ajoute votre modificateur aux dégâts : dégâts calculés sous chaque arme Légère du tableau.");
    },

    // Combat à mains nues : Attaque à mains nues 1d6 + For (1d8 sans arme ni bouclier), 1d4 à l'agrippé
    combat_a_mains_nues: ({ derived: { mods }, add }) => {
        const str = signed(mods.str);
        add('featSlot', `Attaque à mains nues : 1d6 ${str} contondants, ou 1d8 ${str} si vous ne tenez ni arme ni bouclier (au lieu de 1 ${str}). Au début de chacun de vos tours : 1d4 contondants à une créature que vous Agrippez.`, { value: mods.str });
    },

    // Combat en aveugle : Vision aveugle à 3 m
    combat_en_aveugle: ({ add }) => {
        add('featSlot', 'Vision aveugle à 3 m : à noter vous-même avec vos sens (vous voyez ce qui est à 3 m même dans le noir ou invisible).');
    },

    // Interception : Réaction, réduire de 1d10 + bonus de maîtrise les dégâts d'un allié à 1,50 m
    interception: ({ derived: { pb }, add }) => {
        add('featSlot', `Réaction quand une créature que vous voyez touche une autre créature à 1,50 m de vous : les dégâts sont réduits de 1d10 +${pb}. Il faut tenir un bouclier ou une arme courante ou de guerre.`, { value: pb });
    },

    // Protection : Réaction, bouclier en main, Désavantage aux attaques contre un allié à 1,50 m
    protection: ({ derived: { wornArmor }, add }) => {
        add('featSlot', "Réaction (bouclier en main) quand une créature que vous voyez attaque une autre cible à 1,50 m de vous : Désavantage à ce jet et aux attaques contre cette cible jusqu'au début de votre prochain tour, si vous restez à 1,50 m d'elle.");
        if (!wornArmor.shield) add('featSlot', 'Aucun bouclier équipé (tableau des armures) : ce style demande de tenir un bouclier.', { inactive: true });
    },

    // Hoplite (Odyssée, guide du joueur p. 43, avec la sous-classe L'Hoplite) : Réaction, bouclier porté,
    // attaque d'opportunité contre une créature qui attaque un allié à 1,50 m
    hoplite: ({ derived: { wornArmor }, add }) => {
        add('weapons', "Hoplite : Réaction (bouclier porté) quand une créature attaque au corps à corps un allié à 1,50 m de vous : attaque d'opportunité au corps à corps contre elle.");
        add('featSlot', "Réaction quand une créature attaque au corps à corps un allié à 1,50 m de vous : vous lui portez une attaque d'opportunité au corps à corps. Il faut porter un bouclier.");
        if (!wornArmor.shield) add('featSlot', 'Aucun bouclier équipé (tableau des armures) : ce style demande de porter un bouclier.', { inactive: true });
    },

    // À la place du style de combat (niveau 2) : deux sorts mineurs (PHB 2024, Paladin et Rôdeur)
    guerrier_beni: ({ record, add }) => alternativeNotes('guerrier_beni', 'Clerc', 'Assistance et Flamme sacrée', 'le Charisme', record, add),
    guerrier_druidique: ({ record, add }) => alternativeNotes('guerrier_druidique', 'Druide', "Assistance et Poussière d'étoile", 'la Sagesse', record, add)
};
