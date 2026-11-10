// =============================================================================
// DICTIONNAIRE DE RÈGLES D&D 2024 + ODYSSÉE DES SEIGNEURS DRAGONS
// =============================================================================

/**
 * Constante contenant toutes les règles de base de D&D 2024
 * Classes, Espèces, Historiques, Bonus de Maîtrise, Destins Héroïques
 */
const DD_RULES = {
    // =========================================================================
    // CLASSES (12 classes de D&D 2024)
    // =========================================================================
    classes: {
        barbarian: {
            name: "Barbarian",
            nameFr: "Barbare",
            hitDice: "d12",
            primaryAbility: ["str"],
            savingThrows: ["str", "con"],
            armorProf: ["light", "medium", "shield"],
            weaponProf: ["simple", "martial"]
        },
        bard: {
            name: "Bard",
            nameFr: "Barde",
            hitDice: "d8",
            primaryAbility: ["cha", "dex"],
            savingThrows: ["dex", "cha"],
            armorProf: ["light"],
            weaponProf: ["simple"]
        },
        cleric: {
            name: "Cleric",
            nameFr: "Clerc",
            hitDice: "d8",
            primaryAbility: ["wis"],
            savingThrows: ["wis", "cha"],
            armorProf: ["light", "medium", "shield"],
            weaponProf: ["simple"]
        },
        druid: {
            name: "Druid",
            nameFr: "Druide",
            hitDice: "d8",
            primaryAbility: ["wis"],
            savingThrows: ["int", "wis"],
            armorProf: ["light", "shield"],
            weaponProf: ["simple"]
        },
        fighter: {
            name: "Fighter",
            nameFr: "Guerrier",
            hitDice: "d10",
            primaryAbility: ["str", "dex"],
            savingThrows: ["str", "con"],
            armorProf: ["light", "medium", "heavy", "shield"],
            weaponProf: ["simple", "martial"]
        },
        monk: {
            name: "Monk",
            nameFr: "Moine",
            hitDice: "d8",
            primaryAbility: ["dex", "wis"],
            savingThrows: ["str", "dex"],
            armorProf: [],
            // PHB 2024 : armes courantes et armes de guerre qui ont la propriété Légère
            weaponProf: ["simple", "martial-light"]
        },
        paladin: {
            name: "Paladin",
            nameFr: "Paladin",
            hitDice: "d10",
            primaryAbility: ["str", "cha"],
            savingThrows: ["wis", "cha"],
            armorProf: ["light", "medium", "heavy", "shield"],
            weaponProf: ["simple", "martial"]
        },
        ranger: {
            name: "Ranger",
            nameFr: "Rôdeur",
            hitDice: "d10",
            primaryAbility: ["dex", "wis"],
            savingThrows: ["str", "dex"],
            armorProf: ["light", "medium", "shield"],
            weaponProf: ["simple", "martial"]
        },
        rogue: {
            name: "Rogue",
            nameFr: "Roublard",
            hitDice: "d8",
            primaryAbility: ["dex"],
            savingThrows: ["dex", "int"],
            armorProf: ["light"],
            // PHB 2024 : armes courantes et armes de guerre qui ont la propriété Finesse ou Légère
            weaponProf: ["simple", "martial-finesse", "martial-light"]
        },
        sorcerer: {
            name: "Sorcerer",
            nameFr: "Ensorceleur",
            hitDice: "d6",
            primaryAbility: ["cha"],
            savingThrows: ["con", "cha"],
            armorProf: [],
            weaponProf: ["simple"]
        },
        warlock: {
            name: "Warlock",
            nameFr: "Occultiste",
            // Nom de la v3 et des anciennes sauvegardes : toujours reconnu, jamais réécrit
            aliasesFr: ["Sorcier"],
            hitDice: "d8",
            primaryAbility: ["cha"],
            savingThrows: ["wis", "cha"],
            armorProf: ["light"],
            weaponProf: ["simple"]
        },
        wizard: {
            name: "Wizard",
            nameFr: "Magicien",
            hitDice: "d6",
            primaryAbility: ["int"],
            savingThrows: ["int", "wis"],
            armorProf: [],
            weaponProf: ["simple"]
        }
    },

    // =========================================================================
    // SOUS-CLASSES D&D 2024 (4 par classe) + ODYSSÉE (1 par classe)
    // =========================================================================
    subclasses: {
        // ----- BARBARE -----
        "path_of_the_berserker": { class: "barbarian", name: "Berserker", nameFr: "Voie du Berserker", source: "PHB2024" },
        "path_of_the_wild_heart": { class: "barbarian", name: "Wild Heart", nameFr: "Voie du Cœur sauvage", aliasesFr: ["Voie du Cœur Sauvage"], source: "PHB2024" },
        "path_of_the_world_tree": { class: "barbarian", name: "World Tree", nameFr: "Voie de l'Arbre-Monde", source: "PHB2024" },
        "path_of_the_zealot": { class: "barbarian", name: "Zealot", nameFr: "Voie du Zélateur", aliasesFr: ["Voie du Zélote"], source: "PHB2024" },
        "path_of_the_heretic": { class: "barbarian", name: "Heretic", nameFr: "Voie Herculéenne", source: "Odyssée" },

        // ----- BARDE -----
        "college_of_dance": { class: "bard", name: "College of Dance", nameFr: "Collège de la Danse", source: "PHB2024" },
        "college_of_glamour": { class: "bard", name: "College of Glamour", nameFr: "Collège de la Séduction", aliasesFr: ["Collège du Glamour"], source: "PHB2024" },
        "college_of_lore": { class: "bard", name: "College of Lore", nameFr: "Collège du Savoir", source: "PHB2024" },
        "college_of_valor": { class: "bard", name: "College of Valor", nameFr: "Collège de la Vaillance", source: "PHB2024" },
        "college_of_epic_muse": { class: "bard", name: "College of the Epic Muse", nameFr: "Collège de poésie épique", source: "Odyssée" },

        // ----- CLERC -----
        "life_domain": { class: "cleric", name: "Life Domain", nameFr: "Domaine de la Vie", source: "PHB2024" },
        "light_domain": { class: "cleric", name: "Light Domain", nameFr: "Domaine de la Lumière", source: "PHB2024" },
        "trickery_domain": { class: "cleric", name: "Trickery Domain", nameFr: "Domaine de la Ruse", aliasesFr: ["Domaine de la Supercherie"], source: "PHB2024" },
        "war_domain": { class: "cleric", name: "War Domain", nameFr: "Domaine de la Guerre", source: "PHB2024" },
        "prophecy_domain": { class: "cleric", name: "Prophecy Domain", nameFr: "Domaine de la prophétie", source: "Odyssée" },

        // ----- DRUIDE -----
        "circle_of_the_land": { class: "druid", name: "Circle of the Land", nameFr: "Cercle de la Terre", source: "PHB2024" },
        "circle_of_the_moon": { class: "druid", name: "Circle of the Moon", nameFr: "Cercle de la Lune", source: "PHB2024" },
        "circle_of_the_sea": { class: "druid", name: "Circle of the Sea", nameFr: "Cercle des Mers", aliasesFr: ["Cercle de la Mer"], source: "PHB2024" },
        "circle_of_the_stars": { class: "druid", name: "Circle of the Stars", nameFr: "Cercle des Astres", aliasesFr: ["Cercle des Étoiles"], source: "PHB2024" },
        "circle_of_sacrifice": { class: "druid", name: "Circle of Sacrifice", nameFr: "Le Cercle des sacrifices", source: "Odyssée" },

        // ----- GUERRIER -----
        "battle_master": { class: "fighter", name: "Battle Master", nameFr: "Maître de guerre", aliasesFr: ["Maître de Guerre"], source: "PHB2024" },
        "champion": { class: "fighter", name: "Champion", nameFr: "Champion", source: "PHB2024" },
        "eldritch_knight": { class: "fighter", name: "Eldritch Knight", nameFr: "Chevalier occulte", aliasesFr: ["Chevalier Occulte"], source: "PHB2024" },
        "psi_warrior": { class: "fighter", name: "Psi Warrior", nameFr: "Soldat psi", aliasesFr: ["Guerrier Psy"], source: "PHB2024" },
        "odyssean_champion": { class: "fighter", name: "Odyssean Champion", nameFr: "L'Hoplite", source: "Odyssée" },

        // ----- MOINE -----
        "warrior_of_mercy": { class: "monk", name: "Warrior of Mercy", nameFr: "Credo de la Miséricorde", aliasesFr: ["Guerrier de la Miséricorde"], source: "PHB2024" },
        "warrior_of_shadow": { class: "monk", name: "Warrior of Shadow", nameFr: "Credo de l'Ombre", aliasesFr: ["Guerrier de l'Ombre"], source: "PHB2024" },
        "warrior_of_the_elements": { class: "monk", name: "Warrior of the Elements", nameFr: "Credo des Éléments", aliasesFr: ["Guerrier des Éléments"], source: "PHB2024" },
        "warrior_of_the_open_hand": { class: "monk", name: "Warrior of the Open Hand", nameFr: "Credo de la Paume", aliasesFr: ["Guerrier de la Main Ouverte"], source: "PHB2024" },
        "way_of_the_shield_dancer": { class: "monk", name: "Way of the Shield Dancer", nameFr: "La Voie du bouclier", source: "Odyssée" },

        // ----- PALADIN -----
        "oath_of_devotion": { class: "paladin", name: "Oath of Devotion", nameFr: "Serment de Dévotion", source: "PHB2024" },
        "oath_of_glory": { class: "paladin", name: "Oath of Glory", nameFr: "Serment de Gloire", source: "PHB2024" },
        "oath_of_the_ancients": { class: "paladin", name: "Oath of the Ancients", nameFr: "Serment des Anciens", source: "PHB2024" },
        "oath_of_vengeance": { class: "paladin", name: "Oath of Vengeance", nameFr: "Serment de Vengeance", source: "PHB2024" },
        "oath_of_the_dragonlords": { class: "paladin", name: "Oath of the Dragonlords", nameFr: "Serment du Seigneur Dragon", source: "Odyssée" },

        // ----- RÔDEUR -----
        "beast_master": { class: "ranger", name: "Beast Master", nameFr: "Belluaire", aliasesFr: ["Maître des Bêtes"], source: "PHB2024" },
        "fey_wanderer": { class: "ranger", name: "Fey Wanderer", nameFr: "Vagabond féerique", aliasesFr: ["Errant Féerique"], source: "PHB2024" },
        "gloom_stalker": { class: "ranger", name: "Gloom Stalker", nameFr: "Traqueur des ténèbres", aliasesFr: ["Traqueur d'Ombre"], source: "PHB2024" },
        "hunter": { class: "ranger", name: "Hunter", nameFr: "Chasseur", source: "PHB2024" },
        "amazon_warrior": { class: "ranger", name: "Amazon Warrior", nameFr: "Conclave des Amazones", source: "Odyssée" },

        // ----- ROUBLARD -----
        "arcane_trickster": { class: "rogue", name: "Arcane Trickster", nameFr: "Arnaqueur arcanique", aliasesFr: ["Escroc Arcanique"], source: "PHB2024" },
        "assassin": { class: "rogue", name: "Assassin", nameFr: "Assassin", source: "PHB2024" },
        "soulknife": { class: "rogue", name: "Soulknife", nameFr: "Âme acérée", aliasesFr: ["Lame d'Âme"], source: "PHB2024" },
        "thief": { class: "rogue", name: "Thief", nameFr: "Voleur", source: "PHB2024" },
        "the_odyssean": { class: "rogue", name: "The Odyssean", nameFr: "L'Odysséen", source: "Odyssée" },

        // ----- ENSORCELEUR -----
        "aberrant_sorcery": { class: "sorcerer", name: "Aberrant Sorcery", nameFr: "Sorcellerie aberrante", aliasesFr: ["Sorcellerie Aberrante"], source: "PHB2024" },
        "clockwork_sorcery": { class: "sorcerer", name: "Clockwork Sorcery", nameFr: "Sorcellerie mécanique", aliasesFr: ["Sorcellerie Mécanique"], source: "PHB2024" },
        "draconic_sorcery": { class: "sorcerer", name: "Draconic Sorcery", nameFr: "Sorcellerie draconique", aliasesFr: ["Sorcellerie Draconique"], source: "PHB2024" },
        "wild_magic_sorcery": { class: "sorcerer", name: "Wild Magic Sorcery", nameFr: "Sorcellerie sauvage", aliasesFr: ["Sorcellerie Sauvage"], source: "PHB2024" },
        "demigod_bloodline": { class: "sorcerer", name: "Demigod Bloodline", nameFr: "Ascendance divine", source: "Odyssée" },

        // ----- OCCULTISTE -----
        "archfey_patron": { class: "warlock", name: "Archfey Patron", nameFr: "Protecteur Archifée", aliasesFr: ["Patron Archifée"], source: "PHB2024" },
        "celestial_patron": { class: "warlock", name: "Celestial Patron", nameFr: "Protecteur Céleste", aliasesFr: ["Patron Céleste"], source: "PHB2024" },
        "fiend_patron": { class: "warlock", name: "Fiend Patron", nameFr: "Protecteur Fiélon", aliasesFr: ["Patron Fiélon"], source: "PHB2024" },
        "great_old_one_patron": { class: "warlock", name: "Great Old One Patron", nameFr: "Protecteur Grand Ancien", aliasesFr: ["Patron Grand Ancien"], source: "PHB2024" },
        "the_fates_patron": { class: "warlock", name: "The Fates", nameFr: "Serviteur des Moires", source: "Odyssée" },

        // ----- MAGICIEN -----
        "abjurer": { class: "wizard", name: "Abjurer", nameFr: "Abjurateur", source: "PHB2024" },
        "diviner": { class: "wizard", name: "Diviner", nameFr: "Devin", source: "PHB2024" },
        "evoker": { class: "wizard", name: "Evoker", nameFr: "Évocateur", source: "PHB2024" },
        "illusionist": { class: "wizard", name: "Illusionist", nameFr: "Illusionniste", source: "PHB2024" },
        "academy_philosopher": { class: "wizard", name: "Academy Philosopher", nameFr: "Philosophe de l'Académie", source: "Odyssée" }
    },

    // =========================================================================
    // ESPÈCES D&D 2024 + ESPÈCES THYLÉENNES (Odyssée)
    // =========================================================================
    species: {
        // ----- ESPÈCES PHB 2024 -----
        human: {
            name: "Human",
            nameFr: "Humain",
            size: "Medium/Small",
            speed: 30,
            traits: ["Resourceful", "Skillful", "Versatile"],
            source: "PHB2024"
        },
        aasimar: {
            name: "Aasimar",
            nameFr: "Aasimar",
            size: "Medium/Small",
            speed: 30,
            traits: ["Celestial Resistance", "Darkvision", "Healing Hands", "Light Bearer", "Celestial Revelation"],
            source: "PHB2024"
        },
        dragonborn: {
            name: "Dragonborn",
            nameFr: "Drakéide",
            size: "Medium",
            speed: 30,
            traits: ["Draconic Ancestry", "Breath Weapon", "Damage Resistance", "Darkvision", "Draconic Flight"],
            source: "PHB2024"
        },
        dwarf: {
            name: "Dwarf",
            nameFr: "Nain",
            size: "Medium",
            speed: 30,
            traits: ["Darkvision", "Dwarven Resilience", "Dwarven Toughness", "Stonecunning"],
            source: "PHB2024"
        },
        elf: {
            name: "Elf",
            nameFr: "Elfe",
            size: "Medium",
            speed: 30,
            traits: ["Darkvision", "Fey Ancestry", "Keen Senses", "Trance", "Elven Lineage"],
            source: "PHB2024"
        },
        gnome: {
            name: "Gnome",
            nameFr: "Gnome",
            size: "Small",
            speed: 30,
            traits: ["Darkvision", "Gnomish Cunning", "Gnomish Lineage"],
            source: "PHB2024"
        },
        goliath: {
            name: "Goliath",
            nameFr: "Goliath",
            size: "Medium",
            speed: 35,
            traits: ["Giant Ancestry", "Large Form", "Powerful Build"],
            source: "PHB2024"
        },
        halfling: {
            name: "Halfling",
            nameFr: "Halfelin",
            size: "Small",
            speed: 30,
            traits: ["Brave", "Halfling Nimbleness", "Lucky", "Naturally Stealthy"],
            source: "PHB2024"
        },
        orc: {
            name: "Orc",
            nameFr: "Orc",
            size: "Medium",
            speed: 30,
            traits: ["Adrenaline Rush", "Darkvision", "Relentless Endurance"],
            source: "PHB2024"
        },
        tiefling: {
            name: "Tiefling",
            nameFr: "Tieffelin",
            size: "Medium/Small",
            speed: 30,
            traits: ["Darkvision", "Otherworldly Presence", "Fiendish Legacy"],
            source: "PHB2024"
        },

        // ----- ESPÈCES THYLÉENNES (Odyssée des Seigneurs Dragons) -----
        centaur: {
            name: "Centaur",
            nameFr: "Centaure",
            size: "Medium",
            speed: 40,
            traits: ["Equine Build", "Charge Attack", "Hooves", "Natural Affinity"],
            source: "Odyssée"
        },
        medusa: {
            name: "Medusa",
            nameFr: "Méduse",
            size: "Medium",
            speed: 30,
            traits: ["Petrifying Gaze", "Snake Hair", "Darkvision", "Serpent's Cunning"],
            source: "Odyssée"
        },
        minotaur: {
            name: "Minotaur",
            nameFr: "Minotaure",
            size: "Medium",
            speed: 30,
            traits: ["Horns", "Goring Rush", "Hammering Horns", "Labyrinthine Recall"],
            source: "Odyssée"
        },
        satyr: {
            name: "Satyr",
            nameFr: "Satyre",
            size: "Medium",
            speed: 35,
            traits: ["Fey Creature", "Magic Resistance", "Mirthful Leaps", "Reveler"],
            source: "Odyssée"
        },
        siren: {
            name: "Siren",
            nameFr: "Sirène",
            size: "Medium",
            speed: 30,
            traits: ["Amphibious", "Siren Song", "Swim Speed", "Alluring Voice"],
            source: "Odyssée"
        },
        thylean_nymph: {
            name: "Thylean Nymph",
            nameFr: "Nymphe",
            size: "Medium",
            speed: 30,
            traits: ["Fey Creature", "Nature Spirit", "Innate Spellcasting", "Charm Resistance"],
            source: "Odyssée"
        }
    },

    // =========================================================================
    // HISTORIQUES (Backgrounds) D&D 2024
    // =========================================================================
    backgrounds: {
        acolyte: {
            name: "Acolyte",
            nameFr: "Acolyte",
            abilityScores: ["wis", "int", "cha"],
            feat: "Magic Initiate (Cleric)",
            skillProfs: ["insight", "religion"],
            toolProfs: ["Calligrapher's Supplies"],
            startingGold: 50
        },
        artisan: {
            name: "Artisan",
            nameFr: "Artisan",
            abilityScores: ["str", "dex", "int"],
            feat: "Crafter",
            skillProfs: ["investigation", "persuasion"],
            toolProfs: ["Artisan's Tools"],
            startingGold: 50
        },
        charlatan: {
            name: "Charlatan",
            nameFr: "Charlatan",
            abilityScores: ["dex", "con", "cha"],
            feat: "Skilled",
            skillProfs: ["deception", "sleight_of_hand"],
            toolProfs: ["Forgery Kit"],
            startingGold: 50
        },
        criminal: {
            name: "Criminal",
            nameFr: "Criminel",
            abilityScores: ["dex", "con", "int"],
            feat: "Alert",
            skillProfs: ["sleight_of_hand", "stealth"],
            toolProfs: ["Thieves' Tools"],
            startingGold: 50
        },
        entertainer: {
            name: "Entertainer",
            nameFr: "Artiste",
            abilityScores: ["str", "dex", "cha"],
            feat: "Musician",
            skillProfs: ["acrobatics", "performance"],
            toolProfs: ["Musical Instrument"],
            startingGold: 50
        },
        farmer: {
            name: "Farmer",
            nameFr: "Fermier",
            abilityScores: ["str", "con", "wis"],
            feat: "Tough",
            skillProfs: ["animal_handling", "nature"],
            toolProfs: ["Carpenter's Tools"],
            startingGold: 50
        },
        guard: {
            name: "Guard",
            nameFr: "Garde",
            abilityScores: ["str", "int", "wis"],
            feat: "Alert",
            skillProfs: ["athletics", "perception"],
            toolProfs: ["Gaming Set"],
            startingGold: 50
        },
        guide: {
            name: "Guide",
            nameFr: "Guide",
            abilityScores: ["dex", "con", "wis"],
            feat: "Magic Initiate (Druid)",
            skillProfs: ["stealth", "survival"],
            toolProfs: ["Cartographer's Tools"],
            startingGold: 50
        },
        hermit: {
            name: "Hermit",
            nameFr: "Ermite",
            abilityScores: ["con", "wis", "cha"],
            feat: "Healer",
            skillProfs: ["medicine", "religion"],
            toolProfs: ["Herbalism Kit"],
            startingGold: 50
        },
        merchant: {
            name: "Merchant",
            nameFr: "Marchand",
            abilityScores: ["con", "int", "cha"],
            feat: "Lucky",
            skillProfs: ["animal_handling", "persuasion"],
            toolProfs: ["Navigator's Tools"],
            startingGold: 50
        },
        noble: {
            name: "Noble",
            nameFr: "Noble",
            abilityScores: ["str", "int", "cha"],
            feat: "Skilled",
            skillProfs: ["history", "persuasion"],
            toolProfs: ["Gaming Set"],
            startingGold: 50
        },
        sage: {
            name: "Sage",
            nameFr: "Sage",
            abilityScores: ["con", "int", "wis"],
            feat: "Magic Initiate (Wizard)",
            skillProfs: ["arcana", "history"],
            toolProfs: ["Calligrapher's Supplies"],
            startingGold: 50
        },
        sailor: {
            name: "Sailor",
            nameFr: "Marin",
            abilityScores: ["str", "dex", "wis"],
            feat: "Tavern Brawler",
            skillProfs: ["acrobatics", "perception"],
            toolProfs: ["Navigator's Tools"],
            startingGold: 50
        },
        scribe: {
            name: "Scribe",
            nameFr: "Scribe",
            abilityScores: ["dex", "int", "wis"],
            feat: "Skilled",
            skillProfs: ["investigation", "perception"],
            toolProfs: ["Calligrapher's Supplies"],
            startingGold: 50
        },
        soldier: {
            name: "Soldier",
            nameFr: "Soldat",
            abilityScores: ["str", "dex", "con"],
            feat: "Savage Attacker",
            skillProfs: ["athletics", "intimidation"],
            toolProfs: ["Gaming Set"],
            startingGold: 50
        },
        wayfarer: {
            name: "Wayfarer",
            nameFr: "Voyageur",
            abilityScores: ["dex", "wis", "cha"],
            feat: "Lucky",
            skillProfs: ["insight", "stealth"],
            toolProfs: ["Thieves' Tools"],
            startingGold: 50
        }
    },

    // =========================================================================
    // DESTINS HÉROÏQUES (ODYSSÉE DES SEIGNEURS DRAGONS)
    // =========================================================================
    heroicDestinies: [
        { value: '', name: '-- Aucun --' },
        { value: 'damned', name: 'Le Damné' },
        { value: 'demigod', name: 'Le Demi-dieu' },
        { value: 'vanished_one', name: 'Le Disparu' },
        { value: 'exile', name: "L'Exilé" },
        { value: 'fortunate', name: 'Le Fortuné' },
        { value: 'cursed_hero', name: 'Le Héros maudit' },
        { value: 'tormented', name: 'Le Tourmenté' },
        { value: 'dragonslayer', name: 'Le Tueur de dragons' }
    ],

    // =========================================================================
    // BONUS DE MAÎTRISE PAR NIVEAU (Proficiency Bonus)
    // =========================================================================
    proficiencyBonus: [
        2, 2, 2, 2,     // Niveaux 1-4
        3, 3, 3, 3,     // Niveaux 5-8
        4, 4, 4, 4,     // Niveaux 9-12
        5, 5, 5, 5,     // Niveaux 13-16
        6, 6, 6, 6      // Niveaux 17-20
    ],

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================

    /**
     * Récupère le bonus de maîtrise pour un niveau donné
     * @param {number} level - Niveau du personnage (1-20)
     * @returns {number} - Bonus de maîtrise
     */
    getProficiencyBonus(level) {
        if (level < 1) return 2;
        if (level > 20) return 6;
        return this.proficiencyBonus[level - 1];
    },

    /**
     * Tous les noms qui désignent une classe, une sous-classe ou une espèce : anglais, français
     * actuel, et anciens noms français (aliasesFr : « Sorcier » pour l'Occultiste, noms de
     * sous-classes corrigés d'après le manuel). Une fiche enregistrée sous un ancien nom est lue
     * sans être réécrite.
     * @param {{ name: string, nameFr: string, aliasesFr?: string[] }} entry
     * @returns {string[]}
     */
    namesOf(entry) {
        return [entry.name, entry.nameFr, ...(entry.aliasesFr ?? [])];
    },

    /**
     * Trouve une classe par son nom (FR ou EN)
     * @param {string} className - Nom de la classe
     * @returns {object|null} - Objet classe ou null
     */
    findClass(className) {
        if (!className) return null;
        const cleanName = className.toLowerCase().trim();

        for (const [key, classData] of Object.entries(this.classes)) {
            if (key === cleanName || this.namesOf(classData).some((name) => name.toLowerCase() === cleanName)) {
                return classData;
            }
        }
        return null;
    },

    /**
     * Trouve une espèce par son nom (FR ou EN)
     * @param {string} speciesName - Nom de l'espèce
     * @returns {object|null} - Objet espèce ou null
     */
    findSpecies(speciesName) {
        if (!speciesName) return null;
        const cleanName = speciesName.toLowerCase().trim();

        for (const [key, speciesData] of Object.entries(this.species)) {
            if (speciesData.name.toLowerCase() === cleanName ||
                speciesData.nameFr.toLowerCase() === cleanName ||
                key === cleanName) {
                return speciesData;
            }
        }
        return null;
    },

    /**
     * Filtre les éléments par source
     * @param {object} collection - Collection à filtrer
     * @param {string} sourceFilter - "PHB2024", "Odyssée" ou "all"
     * @returns {object} - Objet filtré
     */
    filterBySource(collection, sourceFilter) {
        if (sourceFilter === 'all') return collection;

        const filtered = {};
        for (const [key, item] of Object.entries(collection)) {
            if (item.source === sourceFilter) {
                filtered[key] = item;
            }
        }
        return filtered;
    },

    // =========================================================================
    // EMPLACEMENTS DE SORTS (D&D 2024)
    // =========================================================================

    /**
     * Tables d'emplacements de sorts par type de lanceur.
     * Chaque entrée [niv1, niv2, ..., niv9] donne le nombre d'emplacements.
     * Index = niveau du personnage (1-20).
     */
    spellSlots: {
        // Plein lanceur : Bard, Cleric, Druid, Sorcerer, Wizard
        full: {
            1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
            2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
            3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
            4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
            5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
            6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
            7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
            8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
            9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
            10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
            11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
            12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
            13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
            14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
            15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
            16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
            17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
            18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
            19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
            20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
        },
        // Demi-lanceur : Paladin, Ranger (Incantation dès le niveau 1 en D&D 2024)
        half: {
            1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
            2: [2, 0, 0, 0, 0, 0, 0, 0, 0],
            3: [3, 0, 0, 0, 0, 0, 0, 0, 0],
            4: [3, 0, 0, 0, 0, 0, 0, 0, 0],
            5: [4, 2, 0, 0, 0, 0, 0, 0, 0],
            6: [4, 2, 0, 0, 0, 0, 0, 0, 0],
            7: [4, 3, 0, 0, 0, 0, 0, 0, 0],
            8: [4, 3, 0, 0, 0, 0, 0, 0, 0],
            9: [4, 3, 2, 0, 0, 0, 0, 0, 0],
            10: [4, 3, 2, 0, 0, 0, 0, 0, 0],
            11: [4, 3, 3, 0, 0, 0, 0, 0, 0],
            12: [4, 3, 3, 0, 0, 0, 0, 0, 0],
            13: [4, 3, 3, 1, 0, 0, 0, 0, 0],
            14: [4, 3, 3, 1, 0, 0, 0, 0, 0],
            15: [4, 3, 3, 2, 0, 0, 0, 0, 0],
            16: [4, 3, 3, 2, 0, 0, 0, 0, 0],
            17: [4, 3, 3, 3, 1, 0, 0, 0, 0],
            18: [4, 3, 3, 3, 1, 0, 0, 0, 0],
            19: [4, 3, 3, 3, 2, 0, 0, 0, 0],
            20: [4, 3, 3, 3, 2, 0, 0, 0, 0]
        },
        // Tiers de lanceur (PHB 2024, Chevalier occulte et Arnaqueur arcanique : même table, sorts de
        // Magicien) ; rien avant le niveau 3, où la sous-classe arrive
        third: {
            1: [0, 0, 0, 0, 0, 0, 0, 0, 0],
            2: [0, 0, 0, 0, 0, 0, 0, 0, 0],
            3: [2, 0, 0, 0, 0, 0, 0, 0, 0],
            4: [3, 0, 0, 0, 0, 0, 0, 0, 0],
            5: [3, 0, 0, 0, 0, 0, 0, 0, 0],
            6: [3, 0, 0, 0, 0, 0, 0, 0, 0],
            7: [4, 2, 0, 0, 0, 0, 0, 0, 0],
            8: [4, 2, 0, 0, 0, 0, 0, 0, 0],
            9: [4, 2, 0, 0, 0, 0, 0, 0, 0],
            10: [4, 3, 0, 0, 0, 0, 0, 0, 0],
            11: [4, 3, 0, 0, 0, 0, 0, 0, 0],
            12: [4, 3, 0, 0, 0, 0, 0, 0, 0],
            13: [4, 3, 2, 0, 0, 0, 0, 0, 0],
            14: [4, 3, 2, 0, 0, 0, 0, 0, 0],
            15: [4, 3, 2, 0, 0, 0, 0, 0, 0],
            16: [4, 3, 3, 0, 0, 0, 0, 0, 0],
            17: [4, 3, 3, 0, 0, 0, 0, 0, 0],
            18: [4, 3, 3, 0, 0, 0, 0, 0, 0],
            19: [4, 3, 3, 1, 0, 0, 0, 0, 0],
            20: [4, 3, 3, 1, 0, 0, 0, 0, 0]
        },
        // Warlock (Pacte) : emplacements uniques qui reviennent au repos court
        pact: {
            1: [1, 0, 0, 0, 0, 0, 0, 0, 0],
            2: [2, 0, 0, 0, 0, 0, 0, 0, 0],
            3: [0, 2, 0, 0, 0, 0, 0, 0, 0],
            4: [0, 2, 0, 0, 0, 0, 0, 0, 0],
            5: [0, 0, 2, 0, 0, 0, 0, 0, 0],
            6: [0, 0, 2, 0, 0, 0, 0, 0, 0],
            7: [0, 0, 0, 2, 0, 0, 0, 0, 0],
            8: [0, 0, 0, 2, 0, 0, 0, 0, 0],
            9: [0, 0, 0, 0, 2, 0, 0, 0, 0],
            10: [0, 0, 0, 0, 2, 0, 0, 0, 0],
            11: [0, 0, 0, 0, 3, 0, 0, 0, 0],
            12: [0, 0, 0, 0, 3, 0, 0, 0, 0],
            13: [0, 0, 0, 0, 3, 0, 0, 0, 0],
            14: [0, 0, 0, 0, 3, 0, 0, 0, 0],
            15: [0, 0, 0, 0, 3, 0, 0, 0, 0],
            16: [0, 0, 0, 0, 3, 0, 0, 0, 0],
            17: [0, 0, 0, 0, 4, 0, 0, 0, 0],
            18: [0, 0, 0, 0, 4, 0, 0, 0, 0],
            19: [0, 0, 0, 0, 4, 0, 0, 0, 0],
            20: [0, 0, 0, 0, 4, 0, 0, 0, 0]
        }
    },

    /**
     * Mapping des classes vers leur type de lanceur
     */
    casterType: {
        bard: 'full', cleric: 'full', druid: 'full', sorcerer: 'full', wizard: 'full',
        paladin: 'half', ranger: 'half',
        warlock: 'pact',
        // Non-lanceurs (pas de slots par défaut) ; le Guerrier et le Roublard le deviennent avec
        // une sous-classe lanceuse (subclassCasterType) : la classe elle-même reste à null
        barbarian: null, fighter: null, monk: null, rogue: null
    },

    /** Sous-classes qui donnent l'Incantation à une classe sans magie : type de lanceur et classe */
    subclassCasterType: {
        eldritch_knight: { type: 'third', class: 'fighter' },
        arcane_trickster: { type: 'third', class: 'rogue' }
    },

    /**
     * Retourne les emplacements de sorts pour une classe et un niveau donnés.
     * @param {string} className - Nom de la classe (FR, EN ou slug)
     * @param {number} level - Niveau du personnage (1-20)
     * @param {string} [subclass] - identifiant de sous-classe (deriveCharacter().subclass) : Chevalier
     *        occulte, Arnaqueur arcanique (tiers de lanceur, seulement avec leur classe)
     * @returns {Object} - { 1: nbSlots, 2: nbSlots, ..., 9: nbSlots } ou {} si non-lanceur
     */
    getSpellSlots(className, level, subclass = '') {
        if (!className || !level) return {};

        // Trouver le slug de la classe
        let classSlug = null;
        const cleanName = className.toLowerCase().trim();
        for (const [key, cls] of Object.entries(this.classes)) {
            if (key === cleanName || this.namesOf(cls).some((name) => name.toLowerCase() === cleanName)) {
                classSlug = key;
                break;
            }
        }

        if (!classSlug) return {};

        const bySubclass = this.subclassCasterType[subclass];
        const type = this.casterType[classSlug] || (bySubclass?.class === classSlug ? bySubclass.type : null);
        if (!type) return {};

        const clampedLevel = Math.max(1, Math.min(20, level));
        const slotsArray = this.spellSlots[type][clampedLevel];
        if (!slotsArray) return {};

        const result = {};
        slotsArray.forEach((count, idx) => {
            const spellLevel = idx + 1;
            if (count > 0) {
                result[spellLevel] = count;
            }
        });
        return result;
    },

    // =========================================================================
    // ARMES (D&D 2024)
    // =========================================================================
    weapons: [
        // FRAPPE À MAINS NUES (PHB 2024, glossaire « Unarmed Strike ») : pas une arme, mais une attaque
        // au corps à corps (Force + bonus de maîtrise, 1 + mod. de Force contondants) ; dé calculé
        // par computeWeapon (Arts martiaux du Moine, Bagarreur de tavernes, Combat à mains nues)
        { name: "Frappe à mains nues", atk: "FOR", dmg: "1 cont.", prop: "-", prof: "-", ammo: "-", category: "Mains nues" },
        // ARMES COURANTES DE CORPS À CORPS
        { name: "Bâton", atk: "FOR", dmg: "1d6 cont.", prop: "Polyvalente (1d8)", prof: "Renversement", ammo: "-", category: "Courante" },
        { name: "Dague", atk: "DEX", dmg: "1d4 perf.", prop: "Finesse, Légère, Lancer (6/18 m)", prof: "Coup double", ammo: "-", category: "Courante" },
        { name: "Gourdin", atk: "FOR", dmg: "1d4 cont.", prop: "Légère", prof: "Ralentissement", ammo: "-", category: "Courante" },
        { name: "Hachette", atk: "FOR", dmg: "1d6 tran.", prop: "Légère, Lancer (6/18 m)", prof: "Ouverture", ammo: "-", category: "Courante" },
        { name: "Javeline", atk: "FOR", dmg: "1d6 perf.", prop: "Lancer (9/36 m)", prof: "Ralentissement", ammo: "-", category: "Courante" },
        { name: "Lance", atk: "FOR", dmg: "1d6 perf.", prop: "Lancer (6/18 m), Polyvalente (1d8)", prof: "Sape", ammo: "-", category: "Courante" },
        { name: "Marteau léger", atk: "FOR", dmg: "1d4 cont.", prop: "Légère, Lancer (6/18 m)", prof: "Coup double", ammo: "-", category: "Courante" },
        { name: "Masse d'armes", atk: "FOR", dmg: "1d6 cont.", prop: "-", prof: "Sape", ammo: "-", category: "Courante" },
        { name: "Massue", atk: "FOR", dmg: "1d8 cont.", prop: "Deux mains", prof: "Poussée", ammo: "-", category: "Courante" },
        { name: "Serpe", atk: "FOR", dmg: "1d4 tran.", prop: "Légère", prof: "Coup double", ammo: "-", category: "Courante" },

        // ARMES COURANTES À DISTANCE
        { name: "Arbalète légère", atk: "DEX", dmg: "1d8 perf.", prop: "Munitions (24/96 m), Chargement, Deux mains", prof: "Ralentissement", ammo: "-", category: "Courante" },
        { name: "Arc court", atk: "DEX", dmg: "1d6 perf.", prop: "Munitions (24/96 m), Deux mains", prof: "Ouverture", ammo: "-", category: "Courante" },
        { name: "Fléchette", atk: "DEX", dmg: "1d4 perf.", prop: "Finesse, Lancer (6/18 m)", prof: "Ouverture", ammo: "-", category: "Courante" },
        { name: "Fronde", atk: "DEX", dmg: "1d4 cont.", prop: "Munitions (9/36 m)", prof: "Ralentissement", ammo: "-", category: "Courante" },

        // ARMES DE GUERRE DE CORPS À CORPS
        { name: "Cimeterre", atk: "DEX", dmg: "1d6 tran.", prop: "Finesse, Légère", prof: "Coup double", ammo: "-", category: "Guerre" },
        { name: "Coutille", atk: "FOR", dmg: "1d10 tran.", prop: "Lourde, Allonge, Deux mains", prof: "Écorchure", ammo: "-", category: "Guerre" },
        { name: "Épée à deux mains", atk: "FOR", dmg: "2d6 tran.", prop: "Lourde, Deux mains", prof: "Écorchure", ammo: "-", category: "Guerre" },
        { name: "Épée courte", atk: "DEX", dmg: "1d6 perf.", prop: "Finesse, Légère", prof: "Ouverture", ammo: "-", category: "Guerre" },
        { name: "Épée longue", atk: "FOR", dmg: "1d8 tran.", prop: "Polyvalente (1d10)", prof: "Sape", ammo: "-", category: "Guerre" },
        { name: "Fléau d'armes", atk: "FOR", dmg: "1d8 cont.", prop: "-", prof: "Sape", ammo: "-", category: "Guerre" },
        { name: "Fouet", atk: "DEX", dmg: "1d4 tran.", prop: "Finesse, Allonge", prof: "Ralentissement", ammo: "-", category: "Guerre" },
        { name: "Hache d'armes", atk: "FOR", dmg: "1d8 tran.", prop: "Polyvalente (1d10)", prof: "Renversement", ammo: "-", category: "Guerre" },
        { name: "Hache à deux mains", atk: "FOR", dmg: "1d12 tran.", prop: "Lourde, Deux mains", prof: "Enchaînement", ammo: "-", category: "Guerre" },
        { name: "Hallebarde", atk: "FOR", dmg: "1d10 tran.", prop: "Lourde, Allonge, Deux mains", prof: "Enchaînement", ammo: "-", category: "Guerre" },
        { name: "Lance d'arçon", atk: "FOR", dmg: "1d10 perf.", prop: "Lourde, Allonge, Deux mains (sauf si monté)", prof: "Renversement", ammo: "-", category: "Guerre" },
        { name: "Maillet d'armes", atk: "FOR", dmg: "2d6 cont.", prop: "Lourde, Deux mains", prof: "Renversement", ammo: "-", category: "Guerre" },
        { name: "Marteau de guerre", atk: "FOR", dmg: "1d8 cont.", prop: "Polyvalente (1d10)", prof: "Poussée", ammo: "-", category: "Guerre" },
        { name: "Morgenstern", atk: "FOR", dmg: "1d8 perf.", prop: "-", prof: "Sape", ammo: "-", category: "Guerre" },
        { name: "Pic de guerre", atk: "FOR", dmg: "1d8 perf.", prop: "Polyvalente (1d10)", prof: "Sape", ammo: "-", category: "Guerre" },
        { name: "Pique", atk: "FOR", dmg: "1d10 perf.", prop: "Lourde, Allonge, Deux mains", prof: "Poussée", ammo: "-", category: "Guerre" },
        { name: "Rapière", atk: "DEX", dmg: "1d8 perf.", prop: "Finesse", prof: "Ouverture", ammo: "-", category: "Guerre" },
        { name: "Trident", atk: "FOR", dmg: "1d8 perf.", prop: "Lancer (6/18 m), Polyvalente (1d10)", prof: "Renversement", ammo: "-", category: "Guerre" },

        // ARMES DE GUERRE À DISTANCE
        { name: "Arbalète de poing", atk: "DEX", dmg: "1d6 perf.", prop: "Munitions (9/36 m), Légère, Chargement", prof: "Ouverture", ammo: "-", category: "Guerre" },
        { name: "Arbalète lourde", atk: "DEX", dmg: "1d10 perf.", prop: "Munitions (30/120 m), Lourde, Chargement, Deux mains", prof: "Poussée", ammo: "-", category: "Guerre" },
        { name: "Arc long", atk: "DEX", dmg: "1d8 perf.", prop: "Munitions (45/180 m), Lourde, Deux mains", prof: "Ralentissement", ammo: "-", category: "Guerre" },
        { name: "Sarbacane", atk: "DEX", dmg: "1 perf.", prop: "Munitions (7,5/30 m), Chargement", prof: "Ouverture", ammo: "-", category: "Guerre" },

        // ARMES À FEU (table des armes du Manuel des joueurs 2024, p. 215)
        { name: "Mousquet", atk: "DEX", dmg: "1d12 perf.", prop: "Munitions (12/36 m), Chargement, Deux mains", prof: "Ralentissement", ammo: "-", category: "Guerre" },
        { name: "Pistolet", atk: "DEX", dmg: "1d10 perf.", prop: "Munitions (9/27 m), Chargement", prof: "Ouverture", ammo: "-", category: "Guerre" }
    ]
};

export { DD_RULES };
