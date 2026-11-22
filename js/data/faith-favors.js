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

/**
 * Dieux à qui dédier une faveur. Nom, titre, domaines et alignement : guide du joueur de
 * l'Odyssée, p. 9-10 (« Les puissances de Thyléa », tableau « Divinités thyléennes ») ; phrase de
 * présentation résumée avec nos mots. Faveurs typiques : fiche de la table, « Exemples d'atouts
 * liés au portfolio » (photo de Franck, 22/11/2026) ; * = sort, voir FAITH_SPELL_NOTE.
 * Narsus figure sur la fiche de la table mais pas dans le guide du joueur.
 */
export const FAITH_GODS = Object.freeze([
    Object.freeze({
        title: 'Les anciens titans',
        gods: Object.freeze([
            Object.freeze({
                name: 'Thyléa', full: 'Thyléa, la Mère de tous', domains: 'Nature', alignment: 'Neutre',
                about: "Déesse généreuse de la vie, qui a donné son nom au continent. Elle prend la forme d'un arbre géant au cœur du golfe Céruléen et parle par les saisons.",
                favors: 'Points de vie temporaires, jets de savoir, Charme de vitalité, Amitié avec les animaux*.'
            }),
            Object.freeze({
                name: 'Kentimane', full: 'Kentimane aux Cent Bras', domains: 'Destruction', alignment: 'Neutre',
                about: 'Le plus puissant des titans, époux et gardien de la Grande Mère, avec cent têtes et cent bras.',
                favors: 'Attaques ; tests et jets de sauvegarde de Force et de Constitution ; Résistance ; Mains de Kentimane.'
            }),
            Object.freeze({
                name: 'Sydon', full: 'Sydon, le Seigneur des Tempêtes', domains: 'Tempête', alignment: 'Loyal mauvais',
                about: "Maître des océans, jaloux et vengeur, qui punit par la tempête. Chaque village lui sacrifie ; on prie les Cinq Dieux en silence pour ne pas l'irriter.",
                favors: "Beau temps, mer calme, tests de Charisme face à l'Ordre de Sydon."
            }),
            Object.freeze({
                name: 'Luthéria', full: 'Luthéria, la Maîtresse des Rêves', domains: 'Mort', alignment: 'Chaotique mauvais',
                about: 'Sœur et épouse de Sydon, elle accueille les morts aux Enfers et veille sur les races féeriques. Chaque boisson servie lui doit une libation.',
                favors: 'Sauvegarde en cas de mort, Bénédiction de protection, Moquerie cruelle*.'
            })
        ])
    }),
    Object.freeze({
        title: 'Les Cinq Dieux',
        gods: Object.freeze([
            Object.freeze({
                name: 'Mytros', full: "Mytros, déesse de l'aube", domains: 'Lumière, Vie', alignment: 'Loyal bon',
                about: 'La Reine d\'Argent, protectrice du royaume de Mytros. La plus puissante des Cinq et la source de la magie des prêtres.',
                favors: 'Tous les jets de sauvegarde, Augure, Héroïsme…'
            }),
            Object.freeze({
                name: 'Volkan', full: 'Volkan, dieu de la forge', domains: 'Forge', alignment: 'Neutre bon',
                about: 'Époux de Mytros, vénéré par les nains, les artisans et les sorciers.',
                favors: "Tests et jets de sauvegarde d'Intelligence, points de vie temporaires."
            }),
            Object.freeze({
                name: 'Pythor', full: 'Pythor, dieu des batailles', domains: 'Guerre', alignment: 'Chaotique bon',
                about: "Fils de Mytros et de Volkan, il marche parmi les mortels et règne sur Estoria.",
                favors: 'Attaques ; tests et jets de sauvegarde de Force.'
            }),
            Object.freeze({
                name: 'Kyrah', full: 'Kyrah, déesse de la musique', domains: 'Ruse', alignment: 'Chaotique bon',
                about: 'Déesse rusée de la musique et de la poésie, la plus rapide des dieux ; les bardes en font leur muse.',
                favors: 'Tests et jets de sauvegarde de Dextérité, Tromperie, Vitesse.'
            }),
            Object.freeze({
                name: 'Vallus', full: 'Vallus, déesse de la sagesse', domains: 'Savoir', alignment: 'Loyal bon',
                about: "Déesse de la sagesse et de la beauté, qui connaît l'histoire de Thyléa ; on la prie pour un conseil ou un indice.",
                favors: 'Tests et jets de sauvegarde de Sagesse, Mythes et légendes*, Scarabée de protection.'
            })
        ])
    }),
    Object.freeze({
        title: 'Autre dieu de la table',
        gods: Object.freeze([
            Object.freeze({
                name: 'Narsus', full: 'Narsus', domains: '', alignment: '',
                about: "Absent du guide du joueur : voir avec le MJ.",
                favors: 'Tests et jets de sauvegarde de Charisme.'
            })
        ])
    })
]);

/** Renvoi des faveurs marquées * */
export const FAITH_SPELL_NOTE = '* Même effet que le sort, lancé au niveau du personnage, pendant 1 round.';

/** Phrase d'ouverture de la fenêtre des dieux */
export const FAITH_GODS_INTRO = "Chaque faveur se demande à un dieu et doit entrer dans son domaine. Voici les dieux de Thyléa et les faveurs qu'ils accordent volontiers ; le MJ a le dernier mot.";
