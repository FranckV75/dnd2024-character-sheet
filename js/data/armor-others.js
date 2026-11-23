// =============================================================================
// ARMOR-OTHERS.JS (données) - Groupe « Autres » de la liste des armures (bouton ▾)
//
// Demande de Franck (23/11/2026) : après les armures et le bouclier du manuel, la liste propose
// un cinquième groupe, « Autres » : objets magiques et sorts qui changent la CA. C'est une liste
// de départ, faite pour être complétée.
//
// POUR AJOUTER UNE ENTRÉE : copier un bloc { ... } ci-dessous, le coller à la place voulue (la
// liste s'affiche dans cet ordre) et changer ses valeurs. Rien d'autre à modifier.
//   name    : le nom écrit dans la ligne (pour un sort : celui de data/spells.json) ;
//   type    : le type de la ligne, un de ceux de l'engrenage (ARMOR_TYPES, js/rules/armors.js) :
//               'Bonus'    : ajoute « value » à la CA (anneau, cape, sort…) ;
//               'Maîtrise' : ajoute le bonus de maîtrise (value : '') ;
//               'none'     : ne compte pas dans la CA (simple rappel ; value : '') ;
//               'Légère', 'Interméd.', 'Lourde', 'Bouclier' : compte comme une armure ou un
//               bouclier porté (formation, une seule à la fois) : à éviter pour un objet ou un sort ;
//   value   : la « Valeur de base » de l'engrenage, telle qu'elle est enregistrée : '+1', '+2'… ;
//   ca      : le texte montré dans la liste après « CA » (court : il tient sur une ligne) ;
//   comment : le texte écrit dans la colonne Commentaire (conditions, ce que la fiche ne compte
//             pas) ; écrit seulement si le joueur n'a pas déjà mis son propre commentaire ;
//   kind    : 'objet' ou 'sort' ; vo : nom anglais (pour retrouver la règle).
//
// Une ligne choisie ici est une ligne ordinaire du tableau (mêmes clés qu'une ligne saisie à la
// main, aucune clé nouvelle) : le joueur la règle ensuite avec l'engrenage, comme les autres.
// Ces noms ne sont PAS reconnus quand on les tape à la main sans passer par la liste : une ligne
// « Anneau de protection » d'une ancienne fiche reste exactement comme elle était.
//
// Règles vérifiées dans le Dungeon Master's Guide 2024 (objets) et le Player's Handbook 2024
// (sorts) ; les textes sont des résumés dans nos mots.
// Ce que le calcul de CA ne sait pas faire aujourd'hui, et qui est donc écrit en commentaire :
//  - « sans armure ni bouclier » (Bracelets de défense) : le bonus s'ajoute toujours ;
//  - « CA de base sans armure » (Robe de l'archimage 15 + Dex, Armure du mage 13 + Dex) : notée
//    comme un bonus par rapport à 10 + Dex (+5, +3). Le total est juste sans armure ; il est trop
//    haut si une armure est équipée, avec une Défense sans armure (Barbare, Moine…) ou si les
//    deux sont actives ensemble ;
//  - « CA minimale » (Peau d'écorce, 17) : ligne de rappel, qui ne compte pas.
// Testé : tests/armor-others.test.js.
// =============================================================================

export const ARMOR_OTHERS = [
    // --- Objets magiques (Dungeon Master's Guide 2024) ---
    {
        name: 'Anneau de protection', kind: 'objet', vo: 'Ring of Protection',
        type: 'Bonus', value: '+1', ca: '+1',
        comment: 'Objet magique (harmonisation). Aussi +1 aux jets de sauvegarde, non compté ici.'
    },
    {
        name: 'Cape de protection', kind: 'objet', vo: 'Cloak of Protection',
        type: 'Bonus', value: '+1', ca: '+1',
        comment: 'Objet magique (harmonisation). Aussi +1 aux jets de sauvegarde, non compté ici.'
    },
    {
        name: 'Bracelets de défense', kind: 'objet', vo: 'Bracers of Defense',
        type: 'Bonus', value: '+2', ca: '+2 (sans armure)',
        comment: 'Objet magique (harmonisation). Seulement sans armure ni bouclier : à décocher sinon.'
    },
    {
        name: 'Pierre de Ioun de protection', kind: 'objet', vo: 'Ioun Stone (Protection)',
        type: 'Bonus', value: '+1', ca: '+1',
        comment: 'Objet magique (harmonisation).'
    },
    {
        name: "Robe de l'archimage", kind: 'objet', vo: 'Robe of the Archmagi',
        type: 'Bonus', value: '+5', ca: '15 + Dex',
        comment: 'Objet magique (harmonisation). CA 15 + Dex sans armure, notée +5. À décocher en armure ; ne se cumule pas avec une Défense sans armure ni avec Armure du mage.'
    },

    // --- Sorts (Player's Handbook 2024 ; noms de data/spells.json) ---
    {
        name: 'Armure du mage', kind: 'sort', vo: 'Mage Armor',
        type: 'Bonus', value: '+3', ca: '13 + Dex',
        comment: 'Sort, 8 heures. CA 13 + Dex sans armure, notée +3. À décocher en armure ; ne se cumule pas avec une Défense sans armure.'
    },
    {
        name: 'Bouclier de la foi', kind: 'sort', vo: 'Shield of Faith',
        type: 'Bonus', value: '+2', ca: '+2',
        comment: 'Sort, 10 minutes, concentration.'
    },
    {
        name: "Peau d'écorce", kind: 'sort', vo: 'Barkskin',
        type: 'none', value: '', ca: '17 minimum',
        comment: 'Sort, 1 heure. La CA vaut 17 si elle est plus basse : non calculé, à lire à la place de la CA de la fiche.'
    }
];
