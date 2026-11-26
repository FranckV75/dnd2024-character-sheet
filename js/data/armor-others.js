// =============================================================================
// ARMOR-OTHERS.JS (données) - Groupe « Autres » de la liste des armures (bouton ▾)
//
// Demande de Franck (23/11/2026) : après les armures et le bouclier du manuel, la liste propose
// un cinquième groupe, « Autres » : objets magiques et sorts qui changent la CA. C'est une liste
// de départ, faite pour être complétée.
//
// POUR AJOUTER UNE ENTRÉE : copier un bloc { ... } ci-dessous, le coller à la place voulue (la
// liste s'affiche dans cet ordre) et changer ses valeurs. Rien d'autre à modifier.
//   name    : le nom écrit dans la ligne (pour un sort : celui de data/spells.json) ; unique, et
//             différent du nom d'une armure du manuel ;
//   type    : le type de la ligne, un de ceux de l'engrenage (ARMOR_TYPES, js/rules/armors.js) :
//               'Bonus'    : ajoute « value » à la CA (anneau, cape, sort…) ;
//               'Maîtrise' : ajoute le bonus de maîtrise (value : '') ;
//               'none'     : ne compte pas dans la CA (simple rappel ; value : '') ;
//               'Légère', 'Interméd.', 'Lourde', 'Bouclier' : compte comme une armure ou un
//               bouclier porté (formation, une seule à la fois) : à éviter pour un objet ou un sort ;
//   value   : la « Valeur de base » de l'engrenage, écrite comme il l'enregistre : un nombre
//             entier, précédé de « + » s'il est positif pour 'Bonus' et 'Bouclier' ('+1', '+2',
//             '-1'), sans signe pour une armure ('15') ; '' pour 'Maîtrise' et 'none' ;
//   ca      : le texte montré dans la liste après « CA » : 16 caractères au plus (il tient sur
//             une ligne, comme « 15 + Dex (max 2) ») ;
//   comment : le texte écrit dans la colonne Commentaire : obligatoire, 80 caractères au plus (la
//             colonne est étroite sur tablette : un texte long déforme le tableau). L'essentiel
//             seulement : durée, condition, « à décocher… ». Écrit seulement si le joueur n'a pas
//             déjà mis son propre commentaire ;
//   detail  : (facultatif) le reste, sans limite de longueur : affiché dans la bulle de la CA de
//             la ligne (toucher la CA), jamais enregistré dans la fiche ;
//   oldComments : (facultatif) liste des anciens textes de « comment ». QUAND ON CHANGE LE TEXTE
//             D'UN COMMENTAIRE, les fiches déjà enregistrées gardent l'ancien : il faut le
//             recopier ici (oldComments: ['ancien texte']), sinon la fiche le prend pour un
//             commentaire du joueur (il n'est plus remplacé quand on choisit autre chose sur la
//             ligne, et la bulle ne reconnaît plus la ligne) ;
//   kind    : 'objet' ou 'sort' ; vo : nom anglais (pour retrouver la règle) ;
//   rarity  : (objets seulement, obligatoire) rareté du Dungeon Master's Guide 2024 :
//             'uncommon' (peu commun), 'rare', 'very_rare' (très rare), 'legendary' (légendaire).
//             Ces objets sont magiques par nature : leur bonus à la CA EST leur magie, déjà compté
//             dans « value ». La rareté ne change pas la CA : elle donne seulement à la ligne
//             l'aspect d'un objet magique (pastille ✦ et décors, comme une armure +1 à +3 ;
//             MAGIC_RARITIES, js/rules/armors.js). Elle est écrite dans la ligne choisie
//             (clé facultative « magic_rarity ») : la ligne reste magique si le joueur change
//             ensuite son commentaire. Sans effet pour une entrée de type armure ou bouclier
//             (leur magie, c'est le « Bonus magique » de l'engrenage).
// tests/armor-others.test.js vérifie ces contraintes : un oubli fait échouer npm run check en
// nommant l'entrée.
//
// Une ligne choisie ici est une ligne ordinaire du tableau (mêmes clés qu'une ligne saisie à la
// main, plus la rareté d'un objet, « magic_rarity », que l'engrenage règle aussi) : le joueur la règle ensuite avec l'engrenage, comme les autres.
// Ces noms ne sont PAS reconnus quand on les tape à la main sans passer par la liste : une ligne
// « Anneau de protection » d'une ancienne fiche reste exactement comme elle était. La fiche
// reconnaît une ligne de la liste à son nom ET à son commentaire (celui de l'entrée, tel quel) :
// c'est ce qui lui permet d'afficher « detail » dans la bulle et de prévenir quand la même entrée
// est active deux fois (un même sort ne se cumule pas avec lui-même ; on ne s'harmonise qu'avec
// un seul exemplaire d'un objet : toutes les entrées 'objet' de départ demandent l'harmonisation).
//
// Règles vérifiées dans le Dungeon Master's Guide 2024 (objets) et le Player's Handbook 2024
// (sorts) ; les textes sont des résumés dans nos mots.
// Ce que le calcul de CA ne sait pas faire aujourd'hui, et qui est donc écrit en commentaire ou
// dans la bulle :
//  - « sans armure ni bouclier » (Bracelets de défense) : le bonus s'ajoute toujours ;
//  - « CA de base sans armure » (Robe de l'archimage 15 + Dex, Armure du mage 13 + Dex) : notée
//    comme un bonus par rapport à 10 + Dex (+5, +3). Le total est juste sans armure ; il est trop
//    haut si une armure est équipée, avec une Défense sans armure (Barbare, Moine…) ou si les
//    deux sont actives ensemble ;
//  - « CA minimale » (Peau d'écorce, 17) : ligne de rappel, qui ne compte pas (sa bulle le dit) ;
//  - la fin d'un sort (durée, concentration, repos court ou long) : rien ne décoche la ligne, le
//    joueur le fait lui-même.
// Testé : tests/armor-others.test.js.
// =============================================================================

/** Longueurs maximales (colonne Commentaire sur tablette ; texte « CA … » de la liste) */
export const ARMOR_OTHER_COMMENT_MAX = 80;
export const ARMOR_OTHER_CA_MAX = 16;

const SPELL_END = "La fiche ne décoche pas la ligne quand le sort finit (durée, repos) : à faire soi-même.";

export const ARMOR_OTHERS = [
    // --- Objets magiques (Dungeon Master's Guide 2024) ---
    {
        name: 'Anneau de protection', kind: 'objet', vo: 'Ring of Protection', rarity: 'rare',
        type: 'Bonus', value: '+1', ca: '+1',
        comment: 'Objet magique (harmonisation). Aussi +1 aux jets de sauvegarde, non compté ici.'
    },
    {
        name: 'Cape de protection', kind: 'objet', vo: 'Cloak of Protection', rarity: 'uncommon',
        type: 'Bonus', value: '+1', ca: '+1',
        comment: 'Objet magique (harmonisation). Aussi +1 aux jets de sauvegarde, non compté ici.'
    },
    {
        name: 'Bracelets de défense', kind: 'objet', vo: 'Bracers of Defense', rarity: 'rare',
        type: 'Bonus', value: '+2', ca: '+2 (sans armure)',
        comment: 'Objet magique (harmonisation). Sans armure ni bouclier : à décocher sinon.'
    },
    {
        name: 'Pierre de Ioun de protection', kind: 'objet', vo: 'Ioun Stone (Protection)', rarity: 'rare',
        type: 'Bonus', value: '+1', ca: '+1',
        comment: 'Objet magique (harmonisation).'
    },
    {
        name: "Robe de l'archimage", kind: 'objet', vo: 'Robe of the Archmagi', rarity: 'legendary',
        type: 'Bonus', value: '+5', ca: '15 + Dex',
        comment: 'Objet magique (harmonisation). CA 15 + Dex, notée +5 : à décocher en armure.',
        detail: "Harmonisation réservée à un Ensorceleur, un Occultiste ou un Magicien. Sans armure, la CA de base vaut 15 + Dex : la fiche la note +5 par rapport à 10 + Dex. Ne se cumule pas avec une Défense sans armure (Barbare, Moine…) ni avec Armure du mage : seule la meilleure base compte, la fiche les additionnerait. Aussi +2 au DD de sauvegarde et au bonus d'attaque des sorts, et Avantage aux jets de sauvegarde contre les sorts et les effets magiques : non comptés ici."
    },

    // --- Sorts (Player's Handbook 2024 ; noms de data/spells.json) ---
    {
        name: 'Armure du mage', kind: 'sort', vo: 'Mage Armor',
        type: 'Bonus', value: '+3', ca: '13 + Dex',
        comment: 'Sort, 8 heures. CA 13 + Dex, notée +3 : à décocher en armure.',
        detail: `Sans armure, la CA de base vaut 13 + Dex : la fiche la note +3 par rapport à 10 + Dex. Ne se cumule pas avec une Défense sans armure (Barbare, Moine…) ni avec la Robe de l'archimage : seule la meilleure base compte, la fiche les additionnerait. ${SPELL_END}`
    },
    {
        name: 'Bouclier de la foi', kind: 'sort', vo: 'Shield of Faith',
        type: 'Bonus', value: '+2', ca: '+2',
        comment: 'Sort, 10 minutes, concentration.',
        detail: SPELL_END
    },
    {
        name: "Peau d'écorce", kind: 'sort', vo: 'Barkskin',
        type: 'none', value: '', ca: '17 minimum',
        comment: 'Sort, 1 heure. CA 17 si celle de la fiche est plus basse : non calculé.',
        detail: `Tant que le sort dure, la CA vaut 17 si celle de la fiche est plus basse. La fiche ne le calcule pas : cette ligne est un rappel, la cocher ne change pas la CA (ne lui donnez pas le type « Bonus » : 17 s'ajouterait). ${SPELL_END}`
    }
];
