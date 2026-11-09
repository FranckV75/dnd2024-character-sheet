// =============================================================================
// SUBCLASS-SPELLS.JS (données) - Sorts toujours préparés (ou sorts mineurs connus) donnés par une
// sous-classe
//
// Par sous-classe (clé de DD_RULES.subclasses) : lignes [niveau de classe, nom anglais, nom français,
// niveau du sort (0 = sort mineur), 'R' si rituel, { note, group }]. Les noms sont ceux de
// data/spells.json (vérifiés par un test). note : précision affichée sous le sort (rituel seulement,
// caractéristique…) ; group : terrain du Cercle de la Terre (un seul préparé à la fois), domaine
// de l'Ancêtre divin (un seul, choisi une fois pour toutes) ou école du Philosophe de l'Académie.
// Sources : Player's Handbook 2024 anglais, tables de sorts des sous-classes (« … Spells ») et
// capacités qui donnent un sort ; Odyssée des Seigneurs Dragons : Serment des Seigneurs Dragons
// (« Lien télépathique » : sort de Rary), Domaine de la Prophétie (sorts des niveaux 1 et 3 du livre
// ramenés au niveau 3, décision de Franck), Cercle du Sacrifice.
// Pas ici : sorts au choix du joueur (Découvertes magiques du Savoir, Escroc arcanique, Chevalier
// occulte) et sorts ajoutés à une liste sans être préparés (patron des Destinées).
// =============================================================================

/** Sorts de l'Ancêtre divin : lancés sans emplacement, pas préparés */
const FREE_CAST = 'Une fois sans emplacement, de nouveau après un repos court ou long.';

export const SUBCLASS_SPELLS = Object.freeze({
    // Paladin (lot 2)
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
    ],
    // Barbare
    path_of_the_wild_heart: [
        [3, 'Beast Sense', 'Perception bestiale', 2, 'R', { note: 'Seulement en rituel ; Sagesse.' }],
        [3, 'Speak with Animals', 'Communication avec les animaux', 1, 'R', { note: 'Seulement en rituel ; Sagesse.' }],
        [10, 'Commune with Nature', 'Communion avec la nature', 5, 'R', { note: 'Seulement en rituel ; Sagesse.' }]
    ],
    // Barde
    college_of_glamour: [
        [3, 'Charm Person', 'Charme-personne', 1],
        [3, 'Mirror Image', 'Image miroir', 2],
        [6, 'Command', 'Injonction', 1]
    ],
    // Clerc
    life_domain: [
        [3, 'Aid', 'Aide', 2],
        [3, 'Bless', 'Bénédiction', 1],
        [3, 'Cure Wounds', 'Soins', 1],
        [3, 'Lesser Restoration', 'Restauration partielle', 2],
        [5, 'Mass Healing Word', 'Mot de guérison de groupe', 3],
        [5, 'Revivify', 'Retour à la vie', 3],
        [7, 'Aura of Life', 'Aura de vie', 4],
        [7, 'Death Ward', 'Protection contre la mort', 4],
        [9, 'Greater Restoration', 'Restauration suprême', 5],
        [9, 'Mass Cure Wounds', 'Soins de groupe', 5]
    ],
    light_domain: [
        [3, 'Burning Hands', 'Mains brûlantes', 1],
        [3, 'Faerie Fire', 'Lueurs féeriques', 1],
        [3, 'Scorching Ray', 'Rayon ardent', 2],
        [3, 'See Invisibility', "Détection de l'invisibilité", 2],
        [5, 'Daylight', 'Lumière du jour', 3],
        [5, 'Fireball', 'Boule de feu', 3],
        [7, 'Arcane Eye', 'Oeil du mage', 4],
        [7, 'Wall of Fire', 'Mur de feu', 4],
        [9, 'Flame Strike', 'Colonne de flamme', 5],
        [9, 'Scrying', 'Scrutation', 5]
    ],
    trickery_domain: [
        [3, 'Charm Person', 'Charme-personne', 1],
        [3, 'Disguise Self', 'Déguisement', 1],
        [3, 'Invisibility', 'Invisibilité', 2],
        [3, 'Pass without Trace', 'Passage sans trace', 2],
        [5, 'Hypnotic Pattern', 'Motif hypnotique', 3],
        [5, 'Nondetection', 'Antidétection', 3],
        [7, 'Confusion', 'Confusion', 4],
        [7, 'Dimension Door', 'Porte dimensionnelle', 4],
        [9, 'Dominate Person', 'Domination de personne', 5],
        [9, 'Modify Memory', 'Modification de mémoire', 5]
    ],
    war_domain: [
        [3, 'Guiding Bolt', 'Rayon traçant', 1],
        [3, 'Magic Weapon', 'Arme magique', 2],
        [3, 'Shield of Faith', 'Bouclier de la foi', 1],
        [3, 'Spiritual Weapon', 'Arme spirituelle', 2],
        [5, "Crusader's Mantle", 'Aura du croisé', 3],
        [5, 'Spirit Guardians', 'Esprits gardiens', 3],
        [7, 'Fire Shield', 'Bouclier de feu', 4],
        [7, 'Freedom of Movement', 'Liberté de mouvement', 4],
        [9, 'Hold Monster', 'Immobilisation de monstre', 5],
        [9, 'Steel Wind Strike', "Frappe du vent d'acier", 5]
    ],
    prophecy_domain: [
        [3, 'Message', 'Message', 0, '', { note: 'Sort mineur (Conscience étendue).' }],
        [3, 'Detect Magic', 'Détection de la magie', 1, 'R'],
        [3, 'Identify', 'Identification', 1, 'R'],
        [3, 'Augury', 'Augure', 2, 'R'],
        [3, 'Locate Object', "Localisation d'objet", 2],
        [5, 'Clairvoyance', 'Clairvoyance', 3],
        [5, 'Beacon of Hope', "Lueur d'espoir", 3],
        [7, 'Divination', 'Divination', 4, 'R'],
        [7, 'Death Ward', 'Protection contre la mort', 4],
        [9, 'Dream', 'Songe', 5],
        [9, 'Scrying', 'Scrutation', 5]
    ],
    // Druide
    circle_of_the_moon: [
        [3, 'Cure Wounds', 'Soins', 1],
        [3, 'Moonbeam', 'Rayon de lune', 2],
        [3, 'Starry Wisp', "Poussière d'étoile", 0],
        [5, 'Conjure Animals', "Invocation d'animaux", 3],
        [7, 'Fount of Moonlight', 'Fontaine de lune', 4],
        [9, 'Mass Cure Wounds', 'Soins de groupe', 5]
    ],
    circle_of_the_sea: [
        [3, 'Fog Cloud', 'Nappe de brouillard', 1],
        [3, 'Gust of Wind', 'Bourrasque', 2],
        [3, 'Ray of Frost', 'Rayon de givre', 0],
        [3, 'Shatter', 'Fracassement', 2],
        [3, 'Thunderwave', 'Vague tonnante', 1],
        [5, 'Lightning Bolt', 'Éclair', 3],
        [5, 'Water Breathing', 'Respiration aquatique', 3, 'R'],
        [7, 'Control Water', "Contrôle de l'eau", 4],
        [7, 'Ice Storm', 'Tempête de grêle', 4],
        [9, 'Conjure Elemental', "Invocation d'élémentaire", 5],
        [9, 'Hold Monster', 'Immobilisation de monstre', 5]
    ],
    circle_of_the_stars: [
        [3, 'Guidance', 'Assistance', 0, '', { note: 'Tant que vous tenez votre Carte stellaire.' }],
        [3, 'Guiding Bolt', 'Rayon traçant', 1, '', { note: 'Tant que vous tenez votre Carte stellaire.' }]
    ],
    circle_of_the_land: [
        [3, 'Blur', 'Flou', 2, '', { group: 'Aride' }],
        [3, 'Burning Hands', 'Mains brûlantes', 1, '', { group: 'Aride' }],
        [3, 'Fire Bolt', 'Trait de feu', 0, '', { group: 'Aride' }],
        [5, 'Fireball', 'Boule de feu', 3, '', { group: 'Aride' }],
        [7, 'Blight', 'Flétrissement', 4, '', { group: 'Aride' }],
        [9, 'Wall of Stone', 'Mur de pierre', 5, '', { group: 'Aride' }],
        [3, 'Fog Cloud', 'Nappe de brouillard', 1, '', { group: 'Polaire' }],
        [3, 'Hold Person', 'Immobilisation de personne', 2, '', { group: 'Polaire' }],
        [3, 'Ray of Frost', 'Rayon de givre', 0, '', { group: 'Polaire' }],
        [5, 'Sleet Storm', 'Tempête de neige', 3, '', { group: 'Polaire' }],
        [7, 'Ice Storm', 'Tempête de grêle', 4, '', { group: 'Polaire' }],
        [9, 'Cone of Cold', 'Cône de froid', 5, '', { group: 'Polaire' }],
        [3, 'Misty Step', 'Foulée brumeuse', 2, '', { group: 'Tempérée' }],
        [3, 'Shocking Grasp', 'Poigne électrique', 0, '', { group: 'Tempérée' }],
        [3, 'Sleep', 'Sommeil', 1, '', { group: 'Tempérée' }],
        [5, 'Lightning Bolt', 'Éclair', 3, '', { group: 'Tempérée' }],
        [7, 'Freedom of Movement', 'Liberté de mouvement', 4, '', { group: 'Tempérée' }],
        [9, 'Tree Stride', 'Passage par les arbres', 5, '', { group: 'Tempérée' }],
        [3, 'Acid Splash', "Aspersion d'acide", 0, '', { group: 'Tropicale' }],
        [3, 'Ray of Sickness', 'Rayon empoisonné', 1, '', { group: 'Tropicale' }],
        [3, 'Web', "Toile d'araignée", 2, '', { group: 'Tropicale' }],
        [5, 'Stinking Cloud', 'Nuage nauséabond', 3, '', { group: 'Tropicale' }],
        [7, 'Polymorph', 'Métamorphose', 4, '', { group: 'Tropicale' }],
        [9, 'Insect Plague', "Fléau d'insectes", 5, '', { group: 'Tropicale' }]
    ],
    circle_of_sacrifice: [
        [3, 'Produce Flame', 'Flammes', 0, '', { note: 'Sort mineur : + modificateur de Sagesse aux dégâts.' }],
        [14, 'Teleportation Circle', 'Cercle de téléportation', 5]
    ],
    // Guerrier
    psi_warrior: [
        [18, 'Telekinesis', 'Télékinésie', 5, '', { note: 'Sans emplacement ni composantes, une fois par repos long ou en dépensant un dé psionique.' }]
    ],
    // Moine
    warrior_of_shadow: [
        [3, 'Darkness', 'Ténèbres', 2, '', { note: '1 point de ki, sans composantes.' }],
        [3, 'Minor Illusion', 'Illusion mineure', 0, '', { note: 'Sort mineur ; Sagesse.' }]
    ],
    warrior_of_the_elements: [
        [3, 'Elementalism', 'Élémentalisme', 0, '', { note: 'Sort mineur ; Sagesse.' }]
    ],
    // Rôdeur
    fey_wanderer: [
        [3, 'Charm Person', 'Charme-personne', 1],
        [5, 'Misty Step', 'Foulée brumeuse', 2],
        [9, 'Summon Fey', 'Convocation de fée', 3],
        [13, 'Dimension Door', 'Porte dimensionnelle', 4],
        [17, 'Mislead', 'Double illusoire', 5]
    ],
    gloom_stalker: [
        [3, 'Disguise Self', 'Déguisement', 1],
        [5, 'Rope Trick', 'Corde enchantée', 2],
        [9, 'Fear', 'Peur', 3],
        [13, 'Greater Invisibility', 'Invisibilité suprême', 4],
        [17, 'Seeming', 'Apparence trompeuse', 5]
    ],
    // Ensorceleur
    aberrant_sorcery: [
        [3, 'Mind Sliver', 'Piqûre mentale', 0],
        [3, 'Arms of Hadar', 'Tentacules de Hadar', 1],
        [3, 'Calm Emotions', 'Apaisement des émotions', 2],
        [3, 'Detect Thoughts', 'Détection des pensées', 2],
        [3, 'Dissonant Whispers', 'Murmures dissonants', 1],
        [5, 'Hunger of Hadar', 'Voracité de Hadar', 3],
        [5, 'Sending', 'Communication à distance', 3],
        [7, "Evard's Black Tentacles", "Tentacules noirs d'Evard", 4],
        [7, 'Summon Aberration', "Convocation d'aberration", 4],
        [9, "Rary's Telepathic Bond", 'Lien télépathique de Rary', 5, 'R'],
        [9, 'Telekinesis', 'Télékinésie', 5]
    ],
    clockwork_sorcery: [
        [3, 'Aid', 'Aide', 2],
        [3, 'Alarm', 'Alarme', 1, 'R'],
        [3, 'Lesser Restoration', 'Restauration partielle', 2],
        [3, 'Protection from Evil and Good', 'Protection contre le mal et le bien', 1],
        [5, 'Dispel Magic', 'Dissipation de la magie', 3],
        [5, 'Protection from Energy', "Protection contre l'énergie", 3],
        [7, 'Freedom of Movement', 'Liberté de mouvement', 4],
        [7, 'Summon Construct', "Convocation d'artificiel", 4],
        [9, 'Greater Restoration', 'Restauration suprême', 5],
        [9, 'Wall of Force', 'Mur de force', 5]
    ],
    draconic_sorcery: [
        [3, 'Alter Self', "Modification d'apparence", 2],
        [3, 'Chromatic Orb', 'Orbe chromatique', 1],
        [3, 'Command', 'Injonction', 1],
        [3, "Dragon's Breath", 'Souffle du dragon', 2],
        [5, 'Fear', 'Peur', 3],
        [5, 'Fly', 'Vol', 3],
        [7, 'Arcane Eye', 'Oeil du mage', 4],
        [7, 'Charm Monster', 'Charme-monstre', 4],
        [9, 'Legend Lore', 'Mythes et légendes', 5],
        [9, 'Summon Dragon', 'Convocation de dragon', 5]
    ],
    // Ascendance divine (Odyssée, Ancêtre divin, niveau 1 du livre ramené au 3) : deux sorts par
    // domaine, lancés sans emplacement (pas des sorts préparés) ; seul le domaine choisi (menu
    // « domain », js/data/subclass-choices.js) est affiché. Connaissance : le livre dit « balisage »,
    // aucun sort de ce nom ; Identification (domaine de la Connaissance de 2014) en attendant Franck.
    demigod_bloodline: [
        [3, 'Command', 'Injonction', 1, '', { group: 'Connaissance', note: FREE_CAST }],
        [3, 'Identify', 'Identification', 1, 'R', { group: 'Connaissance', note: FREE_CAST }],
        [3, 'Shield of Faith', 'Bouclier de la foi', 1, '', { group: 'Guerre', note: FREE_CAST }],
        [3, 'Thunderous Smite', 'Châtiment de tonnerre', 1, '', { group: 'Guerre', note: FREE_CAST }],
        [3, 'Faerie Fire', 'Lueurs féeriques', 1, '', { group: 'Lumière', note: FREE_CAST }],
        [3, 'Burning Hands', 'Mains brûlantes', 1, '', { group: 'Lumière', note: FREE_CAST }],
        [3, 'Bane', 'Imprécation', 1, '', { group: 'Mort', note: FREE_CAST }],
        [3, 'Ray of Sickness', 'Rayon empoisonné', 1, '', { group: 'Mort', note: FREE_CAST }],
        [3, 'Entangle', 'Enchevêtrement', 1, '', { group: 'Nature', note: FREE_CAST }],
        [3, 'Healing Word', 'Mot de guérison', 1, '', { group: 'Nature', note: FREE_CAST }],
        [3, 'Charm Person', 'Charme-personne', 1, '', { group: 'Ruse', note: FREE_CAST }],
        [3, "Tasha's Hideous Laughter", 'Fou rire de Tasha', 1, '', { group: 'Ruse', note: FREE_CAST }],
        [3, 'Fog Cloud', 'Nappe de brouillard', 1, '', { group: 'Tempête', note: FREE_CAST }],
        [3, 'Thunderwave', 'Vague tonnante', 1, '', { group: 'Tempête', note: FREE_CAST }],
        [3, 'Bless', 'Bénédiction', 1, '', { group: 'Vie', note: FREE_CAST }],
        [3, 'Cure Wounds', 'Soins', 1, '', { group: 'Vie', note: FREE_CAST }]
    ],
    // Sorcier
    archfey_patron: [
        [3, 'Calm Emotions', 'Apaisement des émotions', 2],
        [3, 'Faerie Fire', 'Lueurs féeriques', 1],
        [3, 'Misty Step', 'Foulée brumeuse', 2],
        [3, 'Phantasmal Force', 'Force fantasmagorique', 2],
        [3, 'Sleep', 'Sommeil', 1],
        [5, 'Blink', 'Clignotement', 3],
        [5, 'Plant Growth', 'Croissance végétale', 3],
        [7, 'Dominate Beast', 'Domination de bête', 4],
        [7, 'Greater Invisibility', 'Invisibilité suprême', 4],
        [9, 'Dominate Person', 'Domination de personne', 5],
        [9, 'Seeming', 'Apparence trompeuse', 5]
    ],
    celestial_patron: [
        [3, 'Light', 'Lumière', 0],
        [3, 'Sacred Flame', 'Flamme sacrée', 0],
        [3, 'Aid', 'Aide', 2],
        [3, 'Cure Wounds', 'Soins', 1],
        [3, 'Guiding Bolt', 'Rayon traçant', 1],
        [3, 'Lesser Restoration', 'Restauration partielle', 2],
        [5, 'Daylight', 'Lumière du jour', 3],
        [5, 'Revivify', 'Retour à la vie', 3],
        [7, 'Guardian of Faith', 'Gardien de la foi', 4],
        [7, 'Wall of Fire', 'Mur de feu', 4],
        [9, 'Greater Restoration', 'Restauration suprême', 5],
        [9, 'Summon Celestial', 'Convocation de céleste', 5]
    ],
    fiend_patron: [
        [3, 'Burning Hands', 'Mains brûlantes', 1],
        [3, 'Command', 'Injonction', 1],
        [3, 'Scorching Ray', 'Rayon ardent', 2],
        [3, 'Suggestion', 'Suggestion', 2],
        [5, 'Fireball', 'Boule de feu', 3],
        [5, 'Stinking Cloud', 'Nuage nauséabond', 3],
        [7, 'Fire Shield', 'Bouclier de feu', 4],
        [7, 'Wall of Fire', 'Mur de feu', 4],
        [9, 'Geas', 'Quête', 5],
        [9, 'Insect Plague', "Fléau d'insectes", 5]
    ],
    great_old_one_patron: [
        [3, 'Detect Thoughts', 'Détection des pensées', 2],
        [3, 'Dissonant Whispers', 'Murmures dissonants', 1],
        [3, 'Phantasmal Force', 'Force fantasmagorique', 2],
        [3, "Tasha's Hideous Laughter", 'Fou rire de Tasha', 1],
        [5, 'Clairvoyance', 'Clairvoyance', 3],
        [5, 'Hunger of Hadar', 'Voracité de Hadar', 3],
        [7, 'Confusion', 'Confusion', 4],
        [7, 'Summon Aberration', "Convocation d'aberration", 4],
        [9, 'Modify Memory', 'Modification de mémoire', 5],
        [9, 'Telekinesis', 'Télékinésie', 5],
        [10, 'Hex', 'Maléfice', 1]
    ],
    // Magicien
    abjurer: [
        [10, 'Counterspell', 'Contresort', 3],
        [10, 'Dispel Magic', 'Dissipation de la magie', 3]
    ],
    illusionist: [
        [3, 'Minor Illusion', 'Illusion mineure', 0, '', { note: 'Sort mineur, hors du nombre de sorts mineurs (un autre au choix si vous le connaissez déjà).' }],
        [6, 'Summon Beast', 'Convocation de bête', 2],
        [6, 'Summon Fey', 'Convocation de fée', 3]
    ],
    // Philosophe de l'Académie (Odyssée, p. 46) : Amis donné par l'école du Sophisme (group = libellé
    // de l'école, PHILOSOPHER_SCHOOLS) ; seulement si cette école est choisie
    academy_philosopher: [
        [3, 'Friends', 'Amis', 0, '', { group: 'Sophisme', note: 'Sort mineur du Sophisme, hors du nombre de sorts mineurs (Intelligence).' }]
    ]
});
