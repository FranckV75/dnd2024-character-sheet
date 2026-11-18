// =============================================================================
// TOOLS.JS (données) - Liste fermée des outils du Manuel des joueurs 2024
//
// Noms français lus sur les photos du manuel (chapitre 6 « Équipement », p. 220-221 :
// Equipement_08 et Equipement_09). Pour chaque outil : son nom, sa catégorie, la caractéristique
// du test fait avec lui (fait de règle), et quelques mots sur son usage (résumé écrit pour la
// fiche, pas le texte du livre).
//  - aliases : autres façons d'écrire le même outil dans la case « Outils » (anciens noms,
//    formes courtes), reconnues comme le nom lui-même ;
//  - exact : le nom ne se reconnaît qu'avec ses accents (« Dés », pour ne pas trouver le mot
//    courant « des »).
// Utilisé par js/rules/tools.js (reconnaître, ajouter, retirer) et js/ui/tools.js (fenêtre).
// =============================================================================

/** Catégories, dans l'ordre d'affichage. choice : libellé d'un outil « au choix » de la catégorie */
export const TOOL_CATEGORIES = Object.freeze([
    Object.freeze({ id: 'artisan', name: "Outils d'artisan", choice: "un type d'outils d'artisan au choix" }),
    Object.freeze({ id: 'other', name: 'Autres outils', choice: 'un autre outil au choix' }),
    Object.freeze({ id: 'gaming', name: 'Boîtes de jeux', choice: 'un type de boîte de jeux au choix' }),
    Object.freeze({ id: 'instrument', name: 'Instruments de musique', choice: 'un instrument de musique au choix' })
]);

const tool = (id, name, category, ability, use, extra = {}) => Object.freeze({ id, name, category, ability, use, ...extra });

/** @type {ReadonlyArray<{ id: string, name: string, category: string, ability: string, use: string, aliases?: string[], exact?: boolean }>} */
export const TOOLS = Object.freeze([
    // --- Outils d'artisan (p. 220-221) ---
    tool('alchemist', "Matériel d'alchimiste", 'artisan', 'int', 'reconnaître un produit inconnu', { aliases: ["Outils d'alchimiste"] }),
    tool('brewer', 'Matériel de brasseur', 'artisan', 'int', 'reconnaître un alcool, un poison', { aliases: ['Outils de brasseur'] }),
    tool('calligrapher', 'Matériel de calligraphe', 'artisan', 'dex', 'écriture soignée, encres', { aliases: ['Outils de calligraphe'] }),
    tool('painter', 'Matériel de peintre', 'artisan', 'wis', 'peindre ce que vous avez vu', { aliases: ['Outils de peintre'] }),
    tool('tinker', 'Outils de bricoleur', 'artisan', 'dex', 'petits mécanismes, objets en métal'),
    tool('cartographer', 'Outils de cartographe', 'artisan', 'wis', 'dessiner une carte'),
    tool('carpenter', 'Outils de charpentier', 'artisan', 'str', 'portes, coffres, objets en bois'),
    tool('cobbler', 'Outils de cordonnier', 'artisan', 'dex', 'réparer et ajuster des chaussures'),
    tool('smith', 'Outils de forgeron', 'artisan', 'str', 'armes et armures en métal'),
    tool('jeweler', 'Outils de joaillier', 'artisan', 'int', 'estimer une gemme'),
    tool('mason', 'Outils de maçon', 'artisan', 'str', 'tailler et creuser la pierre'),
    tool('woodcarver', 'Outils de menuisier', 'artisan', 'dex', 'sculpter le bois, arcs et flèches'),
    tool('potter', 'Outils de potier', 'artisan', 'int', 'céramique, cruches et lampes'),
    tool('glassblower', 'Outils de souffleur de verre', 'artisan', 'int', 'verre, fioles et loupes'),
    tool('leatherworker', 'Outils de tanneur', 'artisan', 'dex', 'travail du cuir'),
    tool('weaver', 'Outils de tisserand', 'artisan', 'dex', 'tissus, vêtements et cordes'),
    tool('cook', 'Ustensiles de cuisinier', 'artisan', 'wis', 'cuisiner, repérer un plat avarié', { aliases: ['Outils de cuisinier'] }),
    // --- Autres outils (p. 221) ---
    tool('disguise', 'Accessoires de déguisement', 'other', 'cha', 'maquillage et costumes', { aliases: ['Kit de déguisement'] }),
    tool('navigator', 'Instruments de navigateur', 'other', 'wis', 'trouver sa route en mer', { aliases: ['Outils de navigateur', 'Instruments de navigation'] }),
    tool('forgery', 'Matériel de contrefaçon', 'other', 'dex', 'imiter une écriture, un cachet', { aliases: ['Kit de contrefaçon', 'Matériel de faussaire'] }),
    tool('poisoner', "Matériel d'empoisonneur", 'other', 'int', 'repérer et préparer un poison', { aliases: ["Kit d'empoisonneur"] }),
    tool('herbalism', "Matériel d'herboriste", 'other', 'int', 'reconnaître une plante, potions', { aliases: ["Kit d'herboriste"] }),
    tool('thieves', 'Outils de voleur', 'other', 'dex', 'crocheter, désamorcer un piège'),
    // --- Boîtes de jeux (variantes de la « Boîte de jeux », p. 221) : Sagesse ---
    tool('cards', 'Cartes à jouer', 'gaming', 'wis', 'jeux de cartes', { aliases: ['Jeu de cartes'] }),
    tool('dice', 'Dés', 'gaming', 'wis', 'jeux de dés', { exact: true, aliases: ['Jeu de dés'] }),
    tool('dragonchess', 'Échecs draconiques', 'gaming', 'wis', 'jeu de plateau', { aliases: ['Échecs'] }),
    tool('three-dragon', 'Jeu des dragons', 'gaming', 'wis', 'jeu de cartes à mises'),
    // --- Instruments de musique (variantes de l'« Instrument de musique », p. 221) : Charisme ---
    tool('shawm', 'Chalemie', 'instrument', 'cha', 'instrument à vent'),
    tool('horn', 'Cor', 'instrument', 'cha', 'instrument à vent'),
    tool('bagpipes', 'Cornemuse', 'instrument', 'cha', 'instrument à vent'),
    tool('flute', 'Flûte', 'instrument', 'cha', 'instrument à vent'),
    tool('pan-flute', 'Flûte de pan', 'instrument', 'cha', 'instrument à vent'),
    tool('lute', 'Luth', 'instrument', 'cha', 'instrument à cordes'),
    tool('lyre', 'Lyre', 'instrument', 'cha', 'instrument à cordes'),
    tool('drum', 'Tambour', 'instrument', 'cha', 'percussion'),
    tool('dulcimer', 'Tympanon', 'instrument', 'cha', 'cordes frappées'),
    tool('viol', 'Viole', 'instrument', 'cha', 'instrument à cordes')
]);

/**
 * Outil donné par un historique (DD_RULES.backgrounds[…].toolProfs[0]) : un outil précis (tool)
 * ou un outil au choix dans une catégorie (category).
 */
export const BACKGROUND_TOOLS = Object.freeze({
    "Calligrapher's Supplies": Object.freeze({ tool: 'calligrapher' }),
    "Artisan's Tools": Object.freeze({ category: 'artisan' }),
    'Forgery Kit': Object.freeze({ tool: 'forgery' }),
    "Thieves' Tools": Object.freeze({ tool: 'thieves' }),
    'Musical Instrument': Object.freeze({ category: 'instrument' }),
    "Carpenter's Tools": Object.freeze({ tool: 'carpenter' }),
    'Gaming Set': Object.freeze({ category: 'gaming' }),
    "Cartographer's Tools": Object.freeze({ tool: 'cartographer' }),
    'Herbalism Kit': Object.freeze({ tool: 'herbalism' }),
    "Navigator's Tools": Object.freeze({ tool: 'navigator' })
});
