// =============================================================================
// FEAT-EFFECTS/LOT7.JS (règles) - Effets des dons du lot 7
// Athlète, Bagarreur de tavernes, Combattant à deux armes, Comédien, Discret, Empoigneur, Tireur
// d'élite… (Attaque à mains nues, armes et rappels).
// =============================================================================

import { actorDC, grappleDC, unarmedRowHint } from './helpers.js';

export const LOT7_FEAT_RULES = {
    // ----- Lot 7 — règles vérifiées dans le PHB 2024 anglais (le +1 : js/rules/feat-choices.js) -----

    // Athlète — PHB 2024 « Athlete », p. 202 : Vitesse d'escalade = Vitesse (la Vitesse saisie n'est pas lue)
    athlete: ({ add }) => {
        add('speed', "Vitesse d'escalade égale à votre Vitesse.");
        add('featSlot', "Vitesse d'escalade égale à votre Vitesse (repère à côté de la Vitesse).");
        add('featSlot', 'À terre : vous vous relevez avec seulement 1,50 m de mouvement. Saut en longueur ou en hauteur avec élan après 1,50 m seulement.');
    },

    // Bagarreur de tavernes — PHB 2024 « Tavern Brawler », p. 202 : Attaque à mains nues 1d4 + For
    bagarreur_de_tavernes: ({ record, add }) => {
        add('featSlot', 'Attaque à mains nues : 1d4 + mod. de Force contondants au lieu de 1 + Force, et vous relancez les 1 sur ses dés de dégâts. Une fois par tour, touchée pendant l\'action Attaque : vous pouvez aussi repousser la cible de 1,50 m.');
        add('featSlot', 'Vous maîtrisez les armes improvisées.');
        unarmedRowHint(record, add);
    },

    // Combattant à deux armes — PHB 2024 « Dual Wielder », p. 203
    combattant_a_deux_armes: ({ add }) => {
        add('featSlot', "Après une attaque avec une arme Légère (action Attaque), l'attaque en plus (action Bonus) peut se faire avec une autre arme de corps à corps qui n'est pas à Deux mains, même sans Légère (sans modificateur aux dégâts, sauf s'il est négatif).");
        add('featSlot', 'Vous dégainez ou rangez deux armes (pas à Deux mains) au lieu d\'une.');
    },

    // Combattant monté — PHB 2024 « Mounted Combatant », p. 205
    combattant_monte: ({ add }) => {
        add('featSlot', 'Monté : Avantage aux attaques contre une créature non montée à 1,50 m de votre monture et plus petite qu\'elle d\'au moins une taille.');
        add('featSlot', 'Esquive de la monture : sauvegarde de Dextérité pour moitié des dégâts, elle ne subit rien si elle réussit et la moitié si elle rate (vous la montez, aucun de vous deux Neutralisé).');
        add('featSlot', 'Une attaque qui touche votre monture peut vous toucher à la place (si vous n\'êtes pas Neutralisé).');
    },

    // Comédien — PHB 2024 « Actor », p. 202 : DD de l'Imitation = 8 + mod. Cha + bonus de maîtrise
    comedien: ({ derived, add }) => {
        const dc = actorDC(derived);
        for (const skill of ['deception', 'performance']) {
            add(`skills.${skill}`, 'Avantage pour vous faire passer pour la personne dont vous avez pris le déguisement.');
        }
        add('featSlot', 'Déguisé en une personne, réelle ou inventée : Avantage aux jets de Tromperie ou de Représentation pour passer pour elle (repère à côté de ces compétences).');
        add('featSlot', `Imitation de sons et de voix : une créature qui l'entend doit réussir un jet d'Intuition (Sagesse) DD ${dc} pour la reconnaître comme fausse.`, { value: dc });
    },

    // Discret — PHB 2024 « Skulker », p. 208
    discret: ({ add }) => {
        add('skills.stealth', "Avantage pour l'action Furtivité pendant un combat.");
        add('featSlot', 'Vision aveugle à 3 m : à noter vous-même avec vos sens.');
        add('featSlot', "Avantage en Discrétion pour l'action Furtivité pendant un combat (repère à côté de Discrétion). Caché, une attaque ratée ne révèle pas votre position.");
    },

    // Empoigneur — PHB 2024 « Grappler », p. 204 : DD de Lutte = 8 + mod. For + bonus de maîtrise
    empoigneur: ({ derived, record, add }) => {
        const dc = grappleDC(derived);
        add('featSlot', `Attaque à mains nues pendant l'action Attaque, une fois par tour : dégâts et Lutte en même temps (sauvegarde de Force ou de Dextérité DD ${dc}, au choix de la cible).`, { value: dc });
        add('featSlot', "Avantage aux attaques contre une créature que vous agrippez. La déplacer (votre taille ou plus petite) ne divise pas votre Vitesse.");
        unarmedRowHint(record, add);
    },

    // Façonneur — PHB 2024 « Crafter », p. 200
    faconneur: ({ add }) => {
        add('featSlot', "Trois outils d'artisan au choix de la table Fabrication rapide : à noter vous-même dans Outils.");
        add('featSlot', '−20 % sur le prix des objets non magiques que vous achetez.');
        add('featSlot', "Fin d'un repos long : vous fabriquez un objet de la table Fabrication rapide (outil maîtrisé en main) ; il tombe en morceaux à la fin du repos long suivant.");
        add('rest', "Fabrication rapide : un objet de la table (outil d'artisan maîtrisé), qui dure jusqu'à la fin du prochain repos long.", { restKind: 'long' });
    },

    // Formation aux armes de guerre — PHB 2024 « Martial Weapon Training », p. 205
    formation_aux_armes_de_guerre: ({ add }) => {
        add('featSlot', "Maîtrise des armes de guerre : la fiche ajoute le bonus de maîtrise à l'attaque des armes de guerre du tableau.", { applied: true });
    },

    // Maître d'armes : botte d'un type d'arme en plus (bottes d'armes, js/rules/weapon-masteries.js)
    maitre_d_armes: ({ add }) => {
        add('featSlot', "Botte d'arme d'un type d'arme courante ou de guerre que vous maîtrisez, à changer après un repos long : rappelée dans la description de chaque botte (pastille en forme de livre sous la botte, dans le tableau des armes).");
    },

    // Maître arbalétrier — PHB 2024 « Crossbow Expert », p. 203
    maitre_arbaletrier: ({ add }) => {
        add('featSlot', "Arbalètes : vous ignorez la propriété Chargement, et être à 1,50 m d'un ennemi ne donne pas le Désavantage à vos attaques (rappel sous chaque arbalète).");
        add('featSlot', "L'attaque en plus de la propriété Légère avec une arbalète Légère (arbalète de poing) ajoute votre modificateur aux dégâts.");
    },

    // Tireur d'élite — PHB 2024 « Sharpshooter », p. 207
    tireur_d_elite: ({ add }) => {
        add('featSlot', "Attaques à distance avec une arme : elles ignorent les Abris partiels et supérieurs ; ni la longue portée ni un ennemi à 1,50 m ne donnent le Désavantage (rappel sous ces armes).");
    }
};
