// =============================================================================
// CONDITIONS.JS - Les 15 états du Manuel des joueurs 2024
//
// Noms français : photo de la page « Les états » du Manuel des joueurs 2024 français (Franck,
// 10/11/2026), dans l'ordre alphabétique du manuel. Effets : résumé court des définitions du
// glossaire des règles, pour le rappel en jeu (le manuel fait foi).
// id : identifiant enregistré dans la fiche (clé facultative « conditions », js/rules/conditions.js) ;
// ne jamais le renommer.
// includes : états entraînés par celui-ci (« certains états en entraînent d'autres »).
// leaves : états qui restent quand celui-ci prend fin (Inconscient → À terre).
// tracked : 'fatigue_level' pour l'Épuisement, suivi par niveau dans l'encadré Repos, jamais coché ici.
// =============================================================================

export const CONDITIONS = Object.freeze([
    {
        id: 'prone', nameFr: 'À terre',
        effects: [
            'Déplacement : ramper, ou se relever en dépensant la moitié de votre vitesse ; impossible si votre vitesse est 0.',
            'Désavantage à vos jets d\'attaque.',
            'Attaques contre vous : avantage si l\'attaquant est à 1,5 m ou moins, sinon désavantage.'
        ]
    },
    {
        id: 'grappled', nameFr: 'Agrippé',
        effects: [
            'Vitesse 0, et elle ne peut pas augmenter.',
            'Désavantage à vos jets d\'attaque contre toute autre cible que celui qui vous agrippe.',
            'Celui qui vous agrippe peut vous déplacer avec lui.'
        ]
    },
    {
        id: 'deafened', nameFr: 'Assourdi',
        effects: ['Vous n\'entendez rien : échec automatique aux tests de caractéristique qui reposent sur l\'ouïe.']
    },
    {
        id: 'blinded', nameFr: 'Aveuglé',
        effects: [
            'Vous ne voyez rien : échec automatique aux tests de caractéristique qui reposent sur la vue.',
            'Attaques contre vous avec avantage ; vos jets d\'attaque avec désavantage.'
        ]
    },
    {
        id: 'charmed', nameFr: 'Charmé',
        effects: [
            'Vous ne pouvez pas attaquer celui qui vous a charmé, ni le cibler avec une capacité ou un effet magique nuisible.',
            'Il a l\'avantage à ses tests de caractéristique pour interagir socialement avec vous.'
        ]
    },
    {
        id: 'frightened', nameFr: 'Effrayé',
        effects: [
            'Désavantage aux tests de caractéristique et aux jets d\'attaque tant que la source de votre peur est en vue.',
            'Vous ne pouvez pas vous approcher volontairement de la source de votre peur.'
        ]
    },
    {
        id: 'poisoned', nameFr: 'Empoisonné',
        effects: ['Désavantage aux jets d\'attaque et aux tests de caractéristique.']
    },
    {
        id: 'restrained', nameFr: 'Entravé',
        effects: [
            'Vitesse 0, et elle ne peut pas augmenter.',
            'Attaques contre vous avec avantage ; vos jets d\'attaque avec désavantage.',
            'Désavantage à vos jets de sauvegarde de Dextérité.'
        ]
    },
    {
        id: 'exhaustion', nameFr: 'Épuisement', tracked: 'fatigue_level',
        effects: [
            'Par niveau : -2 aux tests de d20 et -1,5 m de vitesse ; mort au niveau 6.',
            'Les niveaux se cumulent ; un repos long en retire un. Niveau réglé dans l\'encadré Repos.'
        ]
    },
    {
        id: 'stunned', nameFr: 'Étourdi', includes: ['incapacitated'],
        effects: [
            'Vous subissez l\'état Neutralisé.',
            'Échec automatique aux jets de sauvegarde de Force et de Dextérité.',
            'Attaques contre vous avec avantage.'
        ]
    },
    {
        id: 'unconscious', nameFr: 'Inconscient', includes: ['incapacitated', 'prone'], leaves: ['prone'],
        effects: [
            'Vous subissez les états Neutralisé et À terre, et lâchez ce que vous tenez ; vous restez À terre en reprenant conscience.',
            'Vitesse 0 (elle ne peut pas augmenter) ; vous n\'avez pas conscience de ce qui vous entoure.',
            'Échec automatique aux jets de sauvegarde de Force et de Dextérité.',
            'Attaques contre vous avec avantage ; toute attaque qui vous touche à 1,5 m ou moins est un coup critique.'
        ]
    },
    {
        id: 'invisible', nameFr: 'Invisible',
        effects: [
            'Avantage à vos jets d\'initiative.',
            'Les effets qui exigent de vous voir ne vous affectent pas, sauf si leur auteur vous voit d\'une manière ou d\'une autre ; ce que vous portez est aussi caché.',
            'Attaques contre vous avec désavantage ; vos jets d\'attaque avec avantage (sauf si l\'autre peut vous voir).'
        ]
    },
    {
        id: 'incapacitated', nameFr: 'Neutralisé',
        effects: [
            'Aucune action, action bonus ni réaction.',
            'Votre concentration est rompue et vous ne pouvez pas parler.',
            'Désavantage au jet d\'initiative si vous êtes Neutralisé à ce moment-là.'
        ]
    },
    {
        id: 'paralyzed', nameFr: 'Paralysé', includes: ['incapacitated'],
        effects: [
            'Vous subissez l\'état Neutralisé ; vitesse 0, et elle ne peut pas augmenter.',
            'Échec automatique aux jets de sauvegarde de Force et de Dextérité.',
            'Attaques contre vous avec avantage ; toute attaque qui vous touche à 1,5 m ou moins est un coup critique.'
        ]
    },
    {
        id: 'petrified', nameFr: 'Pétrifié', includes: ['incapacitated'],
        effects: [
            'Vous êtes changé en substance inanimée (avec vos objets non magiques) ; poids multiplié par 10, vous cessez de vieillir.',
            'Vous subissez l\'état Neutralisé ; vitesse 0, et elle ne peut pas augmenter.',
            'Attaques contre vous avec avantage ; échec automatique aux jets de sauvegarde de Force et de Dextérité.',
            'Résistance à tous les dégâts ; immunité à l\'état Empoisonné.'
        ]
    }
]);
