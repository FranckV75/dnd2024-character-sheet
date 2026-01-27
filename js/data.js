// =============================================================================
// DATA.JS - CONSTANTES ET DONNÉES STATIQUES
// =============================================================================

/**
 * Images de fond par défaut disponibles dans la galerie
 */
const DEFAULT_BGS = [
    // --- IMAGES PERMANENTES ---
    "Fond_Equipe.png",
    "Fond_Fafnir.png",
    // Test des deux noms pour être sûr
    "Fond_Odyss%C3%A9e_des_Seigneurs_Dragons.png"
];

/**
 * Liste des 18 compétences D&D avec leurs statistiques associées
 */
const SKILLS = [
    { id: 'acrobatics', name: 'Acrobaties', stat: 'dex' },
    { id: 'arcana', name: 'Arcanes', stat: 'int' },
    { id: 'athletics', name: 'Athlétisme', stat: 'str' },
    { id: 'stealth', name: 'Discrétion', stat: 'dex' },
    { id: 'animal_handling', name: 'Dressage', stat: 'wis' },
    { id: 'sleight_of_hand', name: 'Escamotage', stat: 'dex' },
    { id: 'history', name: 'Histoire', stat: 'int' },
    { id: 'intimidation', name: 'Intimidation', stat: 'cha' },
    { id: 'insight', name: 'Intuition', stat: 'wis' },
    { id: 'investigation', name: 'Investigation', stat: 'int' },
    { id: 'medicine', name: 'Médecine', stat: 'wis' },
    { id: 'nature', name: 'Nature', stat: 'int' },
    { id: 'perception', name: 'Perception', stat: 'wis' },
    { id: 'persuasion', name: 'Persuasion', stat: 'cha' },
    { id: 'religion', name: 'Religion', stat: 'int' },
    { id: 'performance', name: 'Représentation', stat: 'cha' },
    { id: 'survival', name: 'Survie', stat: 'wis' },
    { id: 'deception', name: 'Tromperie', stat: 'cha' }
];
