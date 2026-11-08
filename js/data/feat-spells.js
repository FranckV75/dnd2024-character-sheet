// =============================================================================
// FEAT-SPELLS.JS (données) - Sorts permis par les dons à sorts (lot 6)
//
// Tiré de data/spells.json (tests/feat-spells.test.js vérifie que ces listes en sont bien le
// reflet). Chaque entrée : [nom anglais (clé enregistrée dans la fiche), nom français, 'R' si rituel].
// Le nom anglais sert de clé : il est unique et ne change pas avec la traduction.
//  - Initié à la magie : sorts mineurs et sorts de niveau 1 des listes Clerc, Druide, Magicien ;
//  - Affinité féerique : sorts de niveau 1 de Divination ou d'Enchantement (toutes listes) ;
//  - Affinité ombreuse : sorts de niveau 1 d'Illusion ou de Nécromancie (toutes listes) ;
//  - Magie rituelle : sorts de niveau 1 avec l'étiquette Rituel (toutes listes).
// Sorts imposés : [nom anglais, nom français, niveau].
// =============================================================================

export const MAGIC_INITIATE_LISTS = Object.freeze({
    cleric: Object.freeze({
        cantrips: [
            ["Guidance","Assistance"],
            ["Sacred Flame","Flamme sacrée"],
            ["Toll the Dead","Glas"],
            ["Light","Lumière"],
            ["Word of Radiance","Mot de radiance"],
            ["Mending","Réparation"],
            ["Resistance","Résistance"],
            ["Spare the Dying","Stabilisation"],
            ["Thaumaturgy","Thaumaturgie"]
        ],
        level1: [
            ["Bless","Bénédiction"],
            ["Inflict Wounds","Blessure"],
            ["Shield of Faith","Bouclier de la foi"],
            ["Create or Destroy Water","Création ou destruction d'eau"],
            ["Detect Magic","Détection de la magie","R"],
            ["Detect Evil and Good","Détection du mal et du bien"],
            ["Detect Poison and Disease","Détection du poison et des maladies","R"],
            ["Bane","Imprécation"],
            ["Command","Injonction"],
            ["Healing Word","Mot de guérison"],
            ["Protection from Evil and Good","Protection contre le mal et le bien"],
            ["Purify Food and Drink","Purification de la nourriture et de l'eau","R"],
            ["Guiding Bolt","Rayon traçant"],
            ["Sanctuary","Sanctuaire"],
            ["Cure Wounds","Soins"]
        ]
    }),
    druid: Object.freeze({
        cantrips: [
            ["Guidance","Assistance"],
            ["Poison Spray","Bouffée de poison"],
            ["Thunderclap","Coup de tonnerre"],
            ["Shillelagh","Crosse des druides"],
            ["Druidcraft","Druidisme"],
            ["Elementalism","Élémentalisme"],
            ["Produce Flame","Flammes"],
            ["Thorn Whip","Fouet épineux"],
            ["Message","Message"],
            ["Starry Wisp","Poussière d'étoile"],
            ["Mending","Réparation"],
            ["Resistance","Résistance"],
            ["Spare the Dying","Stabilisation"]
        ],
        level1: [
            ["Animal Friendship","Amitié avec les animaux"],
            ["Goodberry","Baies nourricières"],
            ["Charm Person","Charme-personne"],
            ["Speak with Animals","Communication avec les animaux","R"],
            ["Ice Knife","Couteau de glace"],
            ["Create or Destroy Water","Création ou destruction d'eau"],
            ["Detect Magic","Détection de la magie","R"],
            ["Detect Poison and Disease","Détection du poison et des maladies","R"],
            ["Entangle","Enchevêtrement"],
            ["Longstrider","Grande foulée"],
            ["Faerie Fire","Lueurs féeriques"],
            ["Healing Word","Mot de guérison"],
            ["Fog Cloud","Nappe de brouillard"],
            ["Protection from Evil and Good","Protection contre le mal et le bien"],
            ["Purify Food and Drink","Purification de la nourriture et de l'eau","R"],
            ["Jump","Saut"],
            ["Cure Wounds","Soins"],
            ["Thunderwave","Vague tonnante"]
        ]
    }),
    wizard: Object.freeze({
        cantrips: [
            ["Friends","Amis"],
            ["Acid Splash","Aspersion d'acide"],
            ["Poison Spray","Bouffée de poison"],
            ["Chill Touch","Contact glacial"],
            ["True Strike","Coup au but"],
            ["Thunderclap","Coup de tonnerre"],
            ["Elementalism","Élémentalisme"],
            ["Toll the Dead","Glas"],
            ["Minor Illusion","Illusion mineure"],
            ["Light","Lumière"],
            ["Dancing Lights","Lumières dansantes"],
            ["Mage Hand","Main de mage"],
            ["Message","Message"],
            ["Mind Sliver","Piqûre mentale"],
            ["Shocking Grasp","Poigne électrique"],
            ["Prestidigitation","Prestidigitation"],
            ["Ray of Frost","Rayon de givre"],
            ["Mending","Réparation"],
            ["Fire Bolt","Trait de feu"],
            ["Blade Ward","Voile défensif"]
        ],
        level1: [
            ["Alarm","Alarme","R"],
            ["Find Familiar","Appel de familier","R"],
            ["Mage Armor","Armure de mage"],
            ["Shield","Bouclier"],
            ["Charm Person","Charme-personne"],
            ["Comprehend Languages","Compréhension des langues","R"],
            ["Color Spray","Couleurs dansantes"],
            ["Ice Knife","Couteau de glace"],
            ["Disguise Self","Déguisement"],
            ["Detect Magic","Détection de la magie","R"],
            ["Tenser's Floating Disk","Disque flottant de Tenser","R"],
            ["Feather Fall","Feuille morte"],
            ["Tasha's Hideous Laughter","Fou rire de Tasha"],
            ["Grease","Graisse"],
            ["Longstrider","Grande foulée"],
            ["Identify","Identification","R"],
            ["Silent Image","Image silencieuse"],
            ["Burning Hands","Mains brûlantes"],
            ["Fog Cloud","Nappe de brouillard"],
            ["Chromatic Orb","Orbe chromatique"],
            ["Magic Missile","Projectile magique"],
            ["Protection from Evil and Good","Protection contre le mal et le bien"],
            ["Ray of Sickness","Rayon empoisonné"],
            ["Expeditious Retreat","Repli expéditif"],
            ["Jump","Saut"],
            ["Unseen Servant","Serviteur invisible","R"],
            ["False Life","Simulacre de vie"],
            ["Sleep","Sommeil"],
            ["Illusory Script","Texte illusoire","R"],
            ["Witch Bolt","Trait ensorcelé"],
            ["Thunderwave","Vague tonnante"]
        ]
    })
});

export const FEY_TOUCHED_SPELLS = [
        ["Animal Friendship","Amitié avec les animaux"],
        ["Bless","Bénédiction"],
        ["Charm Person","Charme-personne"],
        ["Speak with Animals","Communication avec les animaux","R"],
        ["Comprehend Languages","Compréhension des langues","R"],
        ["Detect Magic","Détection de la magie","R"],
        ["Detect Evil and Good","Détection du mal et du bien"],
        ["Detect Poison and Disease","Détection du poison et des maladies","R"],
        ["Compelled Duel","Duel forcé"],
        ["Tasha's Hideous Laughter","Fou rire de Tasha"],
        ["Heroism","Héroïsme"],
        ["Identify","Identification","R"],
        ["Bane","Imprécation"],
        ["Command","Injonction"],
        ["Hex","Maléfice"],
        ["Hunter's Mark","Marque du chasseur"],
        ["Dissonant Whispers","Murmures dissonants"],
        ["Sleep","Sommeil"]
    ];

export const SHADOW_TOUCHED_SPELLS = [
        ["Inflict Wounds","Blessure"],
        ["Wrathful Smite","Châtiment de courroux"],
        ["Color Spray","Couleurs dansantes"],
        ["Disguise Self","Déguisement"],
        ["Silent Image","Image silencieuse"],
        ["Ray of Sickness","Rayon empoisonné"],
        ["False Life","Simulacre de vie"],
        ["Illusory Script","Texte illusoire","R"]
    ];

export const RITUAL_SPELLS = [
        ["Alarm","Alarme","R"],
        ["Find Familiar","Appel de familier","R"],
        ["Speak with Animals","Communication avec les animaux","R"],
        ["Comprehend Languages","Compréhension des langues","R"],
        ["Detect Magic","Détection de la magie","R"],
        ["Detect Poison and Disease","Détection du poison et des maladies","R"],
        ["Tenser's Floating Disk","Disque flottant de Tenser","R"],
        ["Identify","Identification","R"],
        ["Purify Food and Drink","Purification de la nourriture et de l'eau","R"],
        ["Unseen Servant","Serviteur invisible","R"],
        ["Illusory Script","Texte illusoire","R"]
    ];

export const FIXED_FEAT_SPELLS = Object.freeze({
    misty: ["Misty Step","Foulée brumeuse",2],
    invisibility: ["Invisibility","Invisibilité",2],
    detectThoughts: ["Detect Thoughts","Détection des pensées",2],
    mageHand: ["Mage Hand","Main de mage",0]
});
