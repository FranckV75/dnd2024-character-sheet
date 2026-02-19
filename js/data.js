// =============================================================================
// DATA.JS - CONSTANTES ET DONNÉES STATIQUES
// =============================================================================

/**
 * Images de fond par défaut disponibles dans la galerie
 */
const DEFAULT_BGS = [
    // --- IMAGES PERMANENTES ---
    "Fond_Equipe.webp",
    "Fond_Fafnir.webp",
    "Fond_Odyssée.webp",
    "Fond_Iria.webp",
    "Fond_Hedera.webp",
    "Fond_Cephalus.webp"
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

/**
 * Compétences groupées par caractéristique pour l'affichage en sections
 */
const SKILLS_BY_STAT = {
    str: [{ id: 'athletics', name: 'Athlétisme' }],
    dex: [
        { id: 'acrobatics', name: 'Acrobaties' },
        { id: 'sleight_of_hand', name: 'Escamotage' },
        { id: 'stealth', name: 'Discrétion' }
    ],
    int: [
        { id: 'arcana', name: 'Arcanes' },
        { id: 'history', name: 'Histoire' },
        { id: 'investigation', name: 'Investigation' },
        { id: 'nature', name: 'Nature' },
        { id: 'religion', name: 'Religion' }
    ],
    wis: [
        { id: 'animal_handling', name: 'Dressage' },
        { id: 'insight', name: 'Intuition' },
        { id: 'medicine', name: 'Médecine' },
        { id: 'perception', name: 'Perception' },
        { id: 'survival', name: 'Survie' }
    ],
    cha: [
        { id: 'deception', name: 'Tromperie' },
        { id: 'intimidation', name: 'Intimidation' },
        { id: 'performance', name: 'Représentation' },
        { id: 'persuasion', name: 'Persuasion' }
    ]
};

/**
 * Labels et icônes pour chaque caractéristique
 */
const STAT_LABELS = {
    str: { icon: '💪', name: 'FORCE' },
    dex: { icon: '🎯', name: 'DEXTÉRITÉ' },
    int: { icon: '📚', name: 'INTELLIGENCE' },
    wis: { icon: '👁️', name: 'SAGESSE' },
    cha: { icon: '✨', name: 'CHARISME' }
};
