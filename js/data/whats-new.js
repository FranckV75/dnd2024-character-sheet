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
