// =============================================================================
// CONSTANTS.JS - Caractéristiques, compétences et fonds d'écran par défaut
// =============================================================================

/**
 * Les 6 caractéristiques, dans l'ordre d'affichage de la fiche
 */
export const ABILITIES = [
    { id: 'str', name: 'Force', short: 'FOR', icon: '💪' },
    { id: 'dex', name: 'Dextérité', short: 'DEX', icon: '🎯' },
    { id: 'con', name: 'Constitution', short: 'CON', icon: '🛡️' },
    { id: 'int', name: 'Intelligence', short: 'INT', icon: '📚' },
    { id: 'wis', name: 'Sagesse', short: 'SAG', icon: '👁️' },
    { id: 'cha', name: 'Charisme', short: 'CHA', icon: '✨' }
];

export const ABILITY_IDS = ABILITIES.map(a => a.id);

/**
 * Les 18 compétences D&D 2024 (ordre alphabétique français) et leur caractéristique
 */
export const SKILLS = [
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

/**
 * Compétences groupées par caractéristique (déduit de SKILLS)
 */
export const SKILLS_BY_STAT = Object.fromEntries(
    ABILITY_IDS.map(id => [id, SKILLS.filter(s => s.stat === id)])
);

/**
 * Images de fond proposées par défaut dans la galerie (assets/backgrounds/)
 */
export const DEFAULT_BGS = [
    'Fond_Equipe.webp',
    'Fond_Fafnir.webp',
    'Fond_Odyssée.webp',
    'Fond_Iria.webp',
    'Fond_Hedera.webp',
    'Fond_Cephalus.webp',
    'Fond_La_Team.webp'
];
