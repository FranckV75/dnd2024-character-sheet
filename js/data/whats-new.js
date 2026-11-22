// =============================================================================
// WHATS-NEW.JS (données) - « Nouveautés » : ce qui change pour le joueur, version par version
//
// Une entrée par version publiée, LA PLUS RÉCENTE EN PREMIER : { version, items } avec 3 à 6
// phrases courtes, adressées au joueur (« vous »), sans mot technique. Les libellés de boutons
// sont écrits entre « » exactement comme à l'écran (vérifié par tests/help.test.js).
// Affichées après une mise à jour (js/ui/whats-new.js, règle js/state/whats-new.js) et dans la
// rubrique « Nouveautés » du mode d'emploi (js/ui/help.js).
// À CHAQUE NOUVELLE VERSION : ajouter son entrée en tête (testé : la version de js/version.js
// doit avoir la sienne).
// =============================================================================

/** @type {ReadonlyArray<{ version: string, items: ReadonlyArray<string> }>} */
export const WHATS_NEW = Object.freeze([
    {
        version: '4.45.0',
        items: [
            'Campagne de l\'Odyssée : la case de l\'onglet Combat s\'appelle maintenant « Points de Foi ».',
            'Une pastille dorée sous la case donne vos points de Foi par niveau : bonus de maîtrise plus Sagesse, au moins 1.',
            'Touchez la pastille : une fenêtre liste les faveurs divines à 1, 3 et 5 points, marque celles que vos points permettent et rappelle comment prier ou sacrifier.',
            '« Passer au niveau » remet vos points de Foi au total du nouveau niveau, par exemple 5/5.',
            'Case « Mode Odyssée » décochée, c\'est « Inspiration héroïque » : une seule à la fois, comme dans le manuel.'
        ]
    },
    {
        version: '4.44.0',
        items: [
            'Menu « Gestion » : une nouvelle case « Mode Odyssée », cochée au départ. Vos fiches s\'ouvrent comme avant, rien n\'y est changé.',
            'Pour une autre campagne, décochez-la (fiche modifiable) : les espèces, les sous-classes et le style de combat de l\'Odyssée ne sont plus proposés dans les listes.',
            'Ce que la fiche utilise déjà reste en place : un Centaure reste un Centaure. La fiche vous dit ce qu\'elle garde, et il suffit de recocher la case pour tout retrouver.',
            'Case décochée, l\'encadré « Odyssée des Seigneurs Dragons » disparaît s\'il est vide.',
            'Ce réglage est enregistré avec chaque personnage : il le suit d\'une tablette à l\'autre.'
        ]
    },
    {
        version: '4.43.1',
        items: [
            'Les points d\'expérience s\'écrivent désormais XP partout dans la fiche.',
            'Sous la case XP, la fiche donne aussi le palier du niveau suivant, par exemple : Encore 1 200 XP avant le niveau 7 (23 000 XP).',
            'Rien ne change dans vos fiches enregistrées : seul l\'affichage est modifié.'
        ]
    },
    {
        version: '4.43.0',
        items: [
            'Armes spéciales : dans la roue dentée d\'une arme (« Configuration de l\'arme »), la rubrique « Dégâts en plus » ajoute jusqu\'à 4 dégâts avec leur raison, par exemple +2d6 contre les dragons.',
            '« Toujours » : le dégât est compté en permanence, à côté des dégâts de l\'arme. « À allumer » : une pastille apparaît sous l\'arme, à toucher quand la condition est remplie, même fiche verrouillée.',
            'Dans le tableau, un dégât en plus trop long est abrégé : touchez les dégâts de l\'arme pour les lire en entier, juste dessous.',
            'Le repos long éteint ces pastilles, comme les autres bonus de combat. Sur papier, les dégâts « À allumer » sont cités sous l\'arme.'
        ]
    },
    {
        version: '4.42.0',
        items: [
            'Grimoire : la mention « Pas d\'emplacement » signale un sort préparé d\'un niveau pour lequel vous n\'avez pas encore d\'emplacement. Rien n\'est décoché.',
            'Bouton « Lancer » : quand un don, votre espèce ou une capacité (Ennemi juré du Rôdeur…) offre le sort sans emplacement, « Lancer gratuit » est proposé en premier et coche la case de cette capacité.',
            'Clerc, Druide, Paladin, Rôdeur : sous le tableau, « Retirer les sorts non préparés » allège le grimoire. La liste vous est montrée avant, et la fiche est gardée dans « Revenir à… ».',
            'Magicien, vue « Au combat » : les rituels du livre non préparés se rangent sous la ligne « Rituels du livre », à déplier d\'un toucher.'
        ]
    },
    {
        version: '4.41.0',
        items: [
            'Un « Mode d\'emploi » dans le menu « Gestion » : la fiche expliquée onglet par onglet, à lire sur la tablette ou à imprimer.',
            '« Essayer un personnage d\'exemple » (menu « Gestion ») : un Guerrier de niveau 3 et une Magicienne de niveau 5, prêts à jouer, pour découvrir la fiche. Votre fiche est gardée dans « Revenir à… » ; pensez à l\'exporter avant.',
            'Outils : sous la case « Outils » (onglet « Compétences & Histoire »), le bouton « Choisir dans la liste » coche vos outils dans la liste du manuel.',
            'Après chaque mise à jour, cette fenêtre vous dit en quelques lignes ce qui a changé.'
        ]
    },
    {
        version: '4.40.0',
        items: [
            'Grimoire, bouton « Au combat » : il ne reste à l\'écran que les sorts utilisables, avec les emplacements restants.',
            'Bouton « Lancer » (vue « Au combat ») : choisissez le niveau d\'emplacement, il est coché pour vous. « En rituel » ne dépense rien.',
            '« Préparer mes sorts » (Clerc, Druide, Paladin, Rôdeur) : cochez vos sorts dans toute la liste de votre classe, après un repos long.',
            'Ajouter un sort au toucher : touchez la case du nom vide (ou le bouton ▾) pour ouvrir la liste des sorts, sans clavier.'
        ]
    }
].map((entry) => Object.freeze({ ...entry, items: Object.freeze(entry.items) })));
