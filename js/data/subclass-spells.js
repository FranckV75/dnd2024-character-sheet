// =============================================================================
// SUBCLASS-SPELLS.JS (données) - Sorts toujours préparés donnés par une sous-classe
//
// Par sous-classe (clé de DD_RULES.subclasses) : lignes [niveau de classe, nom anglais, nom français,
// niveau du sort, 'R' si rituel]. Les noms sont ceux de data/spells.json (vérifiés par un test).
// Sources : Player's Handbook 2024 anglais, tables « Oath of … Spells » du chapitre Paladin ;
// Odyssée des Seigneurs Dragons, Serment des Seigneurs Dragons (« Lien télépathique » : sort de
// Rary, « Rary's Telepathic Bond »).
// Lot 2 : les cinq serments du Paladin. Les autres listes (domaines, cercles, patrons…) : lot 3.
// =============================================================================

export const SUBCLASS_SPELLS = Object.freeze({
    oath_of_devotion: [
        [3, 'Protection from Evil and Good', 'Protection contre le mal et le bien', 1],
        [3, 'Shield of Faith', 'Bouclier de la foi', 1],
        [5, 'Aid', 'Aide', 2],
        [5, 'Zone of Truth', 'Zone de vérité', 2],
        [9, 'Beacon of Hope', "Lueur d'espoir", 3],
        [9, 'Dispel Magic', 'Dissipation de la magie', 3],
        [13, 'Freedom of Movement', 'Liberté de mouvement', 4],
        [13, 'Guardian of Faith', 'Gardien de la foi', 4],
        [17, 'Commune', 'Communion', 5, 'R'],
        [17, 'Flame Strike', 'Colonne de flamme', 5]
    ],
    oath_of_glory: [
        [3, 'Guiding Bolt', 'Rayon traçant', 1],
        [3, 'Heroism', 'Héroïsme', 1],
        [5, 'Enhance Ability', 'Amélioration de caractéristique', 2],
        [5, 'Magic Weapon', 'Arme magique', 2],
        [9, 'Haste', 'Hâte', 3],
        [9, 'Protection from Energy', "Protection contre l'énergie", 3],
        [13, 'Compulsion', 'Compulsion', 4],
        [13, 'Freedom of Movement', 'Liberté de mouvement', 4],
        [17, 'Legend Lore', 'Mythes et légendes', 5],
        [17, "Yolande's Regal Presence", 'Présence royale de Yolande', 5]
    ],
    oath_of_the_ancients: [
        [3, 'Ensnaring Strike', 'Frappe piégeuse', 1],
        [3, 'Speak with Animals', 'Communication avec les animaux', 1, 'R'],
        [5, 'Misty Step', 'Foulée brumeuse', 2],
        [5, 'Moonbeam', 'Rayon de lune', 2],
        [9, 'Plant Growth', 'Croissance végétale', 3],
        [9, 'Protection from Energy', "Protection contre l'énergie", 3],
        [13, 'Ice Storm', 'Tempête de grêle', 4],
        [13, 'Stoneskin', 'Peau de pierre', 4],
        [17, 'Commune with Nature', 'Communion avec la nature', 5, 'R'],
        [17, 'Tree Stride', 'Passage par les arbres', 5]
    ],
    oath_of_vengeance: [
        [3, 'Bane', 'Imprécation', 1],
        [3, "Hunter's Mark", 'Marque du chasseur', 1],
        [5, 'Hold Person', 'Immobilisation de personne', 2],
        [5, 'Misty Step', 'Foulée brumeuse', 2],
        [9, 'Haste', 'Hâte', 3],
        [9, 'Protection from Energy', "Protection contre l'énergie", 3],
        [13, 'Banishment', 'Bannissement', 4],
        [13, 'Dimension Door', 'Porte dimensionnelle', 4],
        [17, 'Hold Monster', 'Immobilisation de monstre', 5],
        [17, 'Scrying', 'Scrutation', 5]
    ],
    oath_of_the_dragonlords: [
        [3, 'Find Familiar', 'Appel de familier', 1, 'R'],
        [3, "Hunter's Mark", 'Marque du chasseur', 1],
        [5, 'Gust of Wind', 'Bourrasque', 2],
        [5, 'Levitate', 'Lévitation', 2],
        [9, 'Haste', 'Hâte', 3],
        [9, 'Fly', 'Vol', 3],
        [13, 'Freedom of Movement', 'Liberté de mouvement', 4],
        [13, 'Stoneskin', 'Peau de pierre', 4],
        [17, 'Hold Monster', 'Immobilisation de monstre', 5],
        [17, "Rary's Telepathic Bond", 'Lien télépathique de Rary', 5, 'R']
    ]
});
