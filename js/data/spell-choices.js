// =============================================================================
// SPELL-CHOICES.JS (données) - Capacités qui font choisir des sorts toujours préparés
//
// Player's Handbook 2024 anglais (chapitre des classes), noms français du Manuel des joueurs :
//  - Maîtrise des sorts (« Spell Mastery », Magicien 18) : un sort de niveau 1 et un sort de
//    niveau 2 du grimoire, dont le temps d'incantation est d'une action ; toujours préparés, lancés
//    à leur niveau le plus bas sans emplacement (un emplacement pour un niveau plus haut) ; après
//    un Repos long, l'un des deux peut être remplacé par un sort du grimoire de même niveau ;
//  - Sorts de prédilection (« Signature Spells », Magicien 20) : deux sorts de niveau 3 du
//    grimoire ; toujours préparés, chacun lancé une fois au niveau 3 sans emplacement, de nouveau
//    après un Repos court ou long (un emplacement pour un niveau plus haut) ;
//  - Découvertes magiques (« Magical Discoveries », Collège du Savoir, Barde 6) : deux sorts des
//    listes du Clerc, du Druide ou du Magicien (sort mineur, ou sort d'un niveau pour lequel le
//    Barde a des emplacements) ; toujours préparés ; un des deux peut être remplacé à chaque niveau
//    de Barde gagné.
//
// Forme d'une capacité :
//  - id, name : capacité (noms de js/data/class-progression.js et js/data/subclass-features.js) ;
//  - classSlug, subclass (null : capacité de classe), level : qui l'a, et à quel niveau ;
//  - bucket : où le choix est rangé dans la clé facultative « subclass_choices »
//    ({ wizard: { mastery1: 'Shield' } }, { college_of_lore: { discovery1: 'Fireball' } }) ;
//  - from : 'book' (sorts notés au grimoire de la fiche, pour le Magicien) ou 'lists' (base de
//    sorts, listes de classe `lists`) ;
//  - castTime 'action' : seulement les sorts lancés en une action ;
//  - inPlay : le choix se change en jeu (après un repos long), menu utilisable fiche verrouillée ;
//  - cast : 'atwill' (sans emplacement, à volonté) ou 'uses' (une case par sort : `uses` du champ,
//    clé de « subclass_uses », CLASS_COUNTERS de js/rules/subclass-uses.js) ;
//  - intro : ce que fait la capacité, en une phrase lisible sur tablette ;
//  - fields : un menu par sort ({ key, label, spellLevel? : niveau imposé du sort, uses? }).
// =============================================================================

export const SPELL_CHOICE_FEATURES = Object.freeze([
    Object.freeze({
        id: 'maitrise_des_sorts', name: 'Maîtrise des sorts', classSlug: 'wizard', subclass: null, bucket: 'wizard', level: 18,
        from: 'book', castTime: 'action', inPlay: true, cast: 'atwill',
        intro: "Un sort de niveau 1 et un sort de niveau 2 de votre grimoire, lancés en une action : toujours préparés, ils se lancent à leur niveau le plus bas sans emplacement, autant de fois que vous voulez. Après un repos long, vous pouvez en remplacer un.",
        fields: Object.freeze([
            Object.freeze({ key: 'mastery1', label: 'Sort de niveau 1', spellLevel: 1 }),
            Object.freeze({ key: 'mastery2', label: 'Sort de niveau 2', spellLevel: 2 })
        ])
    }),
    Object.freeze({
        id: 'sorts_de_predilection', name: 'Sorts de prédilection', classSlug: 'wizard', subclass: null, bucket: 'wizard', level: 20,
        from: 'book', inPlay: false, cast: 'uses',
        intro: 'Deux sorts de niveau 3 de votre grimoire : toujours préparés, chacun se lance une fois au niveau 3 sans emplacement, de nouveau après un repos court ou long.',
        fields: Object.freeze([
            Object.freeze({ key: 'signature1', label: 'Premier sort de niveau 3', spellLevel: 3, uses: 'wizard.sort_de_predilection_1' }),
            Object.freeze({ key: 'signature2', label: 'Second sort de niveau 3', spellLevel: 3, uses: 'wizard.sort_de_predilection_2' })
        ])
    }),
    Object.freeze({
        id: 'decouvertes_magiques', name: 'Découvertes magiques', classSlug: 'bard', subclass: 'college_of_lore', bucket: 'college_of_lore', level: 6,
        from: 'lists', lists: Object.freeze(['cleric', 'druid', 'wizard']), inPlay: false, cast: null,
        intro: "Deux sorts des listes du Clerc, du Druide ou du Magicien (sort mineur, ou sort d'un niveau pour lequel vous avez des emplacements) : toujours préparés, ils ne comptent ni dans vos sorts préparés ni dans vos sorts mineurs. À chaque niveau de Barde gagné, vous pouvez en remplacer un.",
        fields: Object.freeze([
            Object.freeze({ key: 'discovery1', label: 'Premier sort' }),
            Object.freeze({ key: 'discovery2', label: 'Second sort' })
        ])
    })
]);
