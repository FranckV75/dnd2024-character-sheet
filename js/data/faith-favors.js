// =============================================================================
// FAITH-FAVORS.JS - Faveurs divines achetées avec les points de Foi (mode Odyssée)
//
// Source : guide du MJ de l'Odyssée, p. 92, « Sacrifices et prières » (règle optionnelle qui
// remplace l'Inspiration héroïque). Le dépôt est public : résumé avec nos mots, jamais le texte
// du livre. Fenêtre : js/ui/odyssey.js ; règles de calcul : js/rules/odyssey.js (faithFavors).
// =============================================================================

/** Comment demander une faveur : prière (sur le moment) ou sacrifice (pour les jours suivants) */
export const FAITH_WAYS = Object.freeze([
    Object.freeze({
        title: 'Prière',
        text: "Action bonus pour demander une faveur, réaction pour demander une protection. La faveur sert dans le même tour. Un dieu ne se prie qu'une fois par scène ; on peut en prier un deuxième, jamais un troisième."
    }),
    Object.freeze({
        title: 'Sacrifice',
        text: "Un par jour, au cours d'un rituel d'une heure : animal ordinaire pour une faveur mineure, animal rare pour une majeure, offrande exceptionnelle pour une grande. La faveur sert en général les jours suivants, et peut s'étendre au petit groupe du personnage."
    })
]);

/** Rappel commun : le dieu, son domaine, et le dernier mot au MJ */
export const FAITH_FOOTNOTE = "La faveur doit correspondre au domaine du dieu prié. Le MJ décide, et le dieu peut l'adapter à son humeur.";

/** Les trois paliers de faveurs, du moins cher au plus cher */
export const FAITH_FAVORS = Object.freeze([
    Object.freeze({
        id: 'mineure',
        title: 'Faveur mineure',
        cost: 1,
        uses: Object.freeze([
            "+1d6 ou l'avantage à un jet d'attaque ou à un test de caractéristique.",
            "Votre bonus de maîtrise à une compétence que vous ne maîtrisez pas.",
            "Votre bonus de maîtrise à un jet de sauvegarde qui ne le reçoit pas d'habitude.",
            "+1d6 ou l'avantage à un jet de sauvegarde.",
            'Des points de vie temporaires égaux à votre bonus de maîtrise.',
            'Le désavantage à une attaque ou à un test d\'un ennemi contre vous.'
        ])
    }),
    Object.freeze({
        id: 'majeure',
        title: 'Faveur majeure',
        cost: 3,
        uses: Object.freeze([
            'Une action de mouvement en plus.',
            "Le désavantage au jet de sauvegarde d'un ennemi contre l'un de vos sorts ou l'une de vos capacités.",
            "Relancer les dégâts d'une attaque, ou un effet chiffré d'un sort ou d'une capacité, que vous infligez ; vous gardez le résultat de votre choix.",
            'Une utilisation gratuite d\'une capacité qui se recharge au repos court.',
            "Obliger un adversaire à relancer les dégâts ou l'effet chiffré qu'il vous inflige ; vous gardez le résultat de votre choix.",
            'Vous stabiliser aussitôt, sans jet contre la mort.'
        ])
    }),
    Object.freeze({
        id: 'grande',
        title: 'Grande faveur',
        cost: 5,
        uses: Object.freeze([
            'Récupérer les capacités qui se rechargent au repos court, comme après un repos court (sans ses autres effets).',
            'Une utilisation gratuite d\'une capacité qui se recharge au repos long.',
            'Jouer un tour de plus.',
            'Échapper à une mort instantanée.'
        ])
    })
]);
