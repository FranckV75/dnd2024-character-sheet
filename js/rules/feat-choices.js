// =============================================================================
// FEAT-CHOICES.JS (règles) - Choix mémorisés des dons (lot 3)
//
// La fiche RETIENT ce que le joueur a choisi pour un don (caractéristique augmentée, compétence,
// type de dégâts) ; elle ne modifie JAMAIS une valeur saisie ou une case cochée (règle validée par
// Franck) : elle affiche des repères près des valeurs et signale ce qui reste à cocher.
//
// Sauvegarde : clé facultative « feat_choices » =
//   { "<niveau de l'emplacement>": { "<id du don>": { <champ>: <valeur>, … } } }
// par exemple { "4": { "resilient": { "ability": "wis" } } }. Les choix sont rangés par don : changer
// le don d'un emplacement puis revenir au premier retrouve ses choix. Absente des anciennes fiches.
// Valeurs : toujours des chaînes ; une valeur inconnue (sauvegarde retouchée) est ignorée.
//
// Règles du Player's Handbook 2024 anglais (pages imprimées) :
//  - Amélioration de caractéristique (« Ability Score Improvement », p. 202) : +2 à une, ou +1 à
//    deux ; pas au-delà de 20 ; répétable ;
//  - Résilient (« Resilient », p. 206) : +1 à une caractéristique dont on ne maîtrise pas le jet de
//    sauvegarde, et maîtrise de ce jet ;
//  - Observateur (« Observant », p. 205) : +1 Int ou Sag ; Intuition, Investigation ou Perception :
//    maîtrise, ou Expertise si elle était déjà maîtrisée ;
//  - Expert (« Skill Expert », p. 207) : +1 au choix ; maîtrise d'une compétence ; Expertise d'une
//    compétence maîtrisée ;
//  - Esprit affûté (« Keen Mind », p. 204) : +1 Int ; Arcanes, Histoire, Investigation, Nature ou
//    Religion : maîtrise, ou Expertise si elle était déjà maîtrisée ;
//  - Doué (« Skilled », p. 201) : trois maîtrises de compétences ou d'outils ; répétable ;
//  - Adepte élémentaire (« Elemental Adept », p. 203) : +1 Int, Sag ou Cha ; Acide, Froid, Feu,
//    Foudre ou Tonnerre : les sorts ignorent la Résistance à ce type, et les 1 des dés de dégâts
//    comptent comme des 2 ; répétable avec un autre type de dégâts.
// Fonctions pures : le personnage reçu n'est jamais modifié.
// =============================================================================

import { ABILITIES, ABILITY_IDS, SKILLS } from '../data/constants.js';
import { featSlots, featName } from './feats.js';

export const FEAT_CHOICES_KEY = 'feat_choices';

const ABILITY_NAMES = Object.fromEntries(ABILITIES.map(a => [a.id, a.name]));
const SKILL_NAMES = Object.fromEntries(SKILLS.map(s => [s.id, s.name]));
const SKILL_IDS = SKILLS.map(s => s.id);

/** Types de dégâts d'Adepte élémentaire : [id, nom, nom en minuscules (dans une phrase)] */
export const ELEMENTS = Object.freeze([
    ['acid', 'Acide', 'acide'],
    ['cold', 'Froid', 'froid'],
    ['fire', 'Feu', 'feu'],
    ['lightning', 'Foudre', 'foudre'],
    ['thunder', 'Tonnerre', 'tonnerre']
]);
const ELEMENT_NAMES = Object.fromEntries(ELEMENTS.map(([id, name]) => [id, name]));
export const elementWord = (id) => ELEMENTS.find(([key]) => key === id)?.[2] ?? id;

/** Choix « Un outil » de Doué : la maîtrise d'outil se note dans le champ Outils */
export const TOOL_CHOICE = 'tool';

/**
 * Répartitions d'Amélioration de caractéristique : « str,str » (+2 Force) ou « str,con »
 * (+1 Force, +1 Constitution), dans l'ordre de la fiche.
 */
export const ASI_OPTIONS = Object.freeze([
    ...ABILITY_IDS.map(id => [`${id},${id}`, `${ABILITY_NAMES[id]} +2`]),
    ...ABILITY_IDS.flatMap((a, i) => ABILITY_IDS.slice(i + 1)
        .map(b => [`${a},${b}`, `${ABILITY_NAMES[a]} +1, ${ABILITY_NAMES[b]} +1`]))
]);

const abilityOptions = (ids) => ids.map(id => [id, ABILITY_NAMES[id]]);
const skillOptions = (ids) => ids.map(id => [id, SKILL_NAMES[id]]);

/**
 * Champs à choisir pour chaque don.
 *  - key : clé dans la sauvegarde ; label : libellé affiché ; options : [[valeur, texte], …] ;
 *  - groups : options regroupées (Amélioration de caractéristique) ; wide : menu sur toute la largeur
 *    (libellés longs) ;
 *  - fixedAbility : caractéristique augmentée sans choix (Esprit affûté : Intelligence).
 */
export const FEAT_CHOICE_RULES = Object.freeze({
    amelioration_de_caracteristique: {
        repeatable: true,
        fields: [{
            key: 'asi', label: 'Augmentation', options: ASI_OPTIONS, wide: true,
            groups: [['+2 à une caractéristique', 0, 6], ['+1 à deux caractéristiques', 6, ASI_OPTIONS.length]]
        }]
    },
    resilient: {
        fields: [{ key: 'ability', label: 'Caractéristique', options: abilityOptions(ABILITY_IDS) }]
    },
    observateur: {
        fields: [
            { key: 'ability', label: 'Caractéristique +1', options: abilityOptions(['int', 'wis']) },
            { key: 'skill', label: 'Compétence', options: skillOptions(['insight', 'investigation', 'perception']) }
        ]
    },
    expert: {
        fields: [
            { key: 'ability', label: 'Caractéristique +1', options: abilityOptions(ABILITY_IDS) },
            { key: 'skill', label: 'Maîtrise', options: skillOptions(SKILL_IDS) },
            { key: 'expertise', label: 'Expertise', options: skillOptions(SKILL_IDS) }
        ]
    },
    esprit_affute: {
        fixedAbility: 'int',
        fields: [{ key: 'skill', label: 'Compétence', options: skillOptions(['arcana', 'history', 'investigation', 'nature', 'religion']) }]
    },
    doue: {
        repeatable: true,
        fields: [1, 2, 3].map(n => ({
            key: `pick${n}`, label: `Maîtrise ${n}`,
            options: [...skillOptions(SKILL_IDS), [TOOL_CHOICE, 'Un outil']]
        }))
    },
    adepte_elementaire: {
        repeatable: true,
        fields: [
            { key: 'ability', label: 'Caractéristique +1', options: abilityOptions(['int', 'wis', 'cha']) },
            { key: 'element', label: 'Type de dégâts', options: ELEMENTS.map(([id, name]) => [id, name]) }
        ]
    }
});

/** Dons dont on garde un choix par emplacement (pris plusieurs fois, chacun avec son choix) */
export const REPEATABLE_CHOICE_FEATS = Object.freeze(
    Object.entries(FEAT_CHOICE_RULES).filter(([, rule]) => rule.repeatable).map(([id]) => id));

/** État enregistré, toujours un objet (valeur absente ou illisible = rien de choisi) */
export function featChoicesState(character) {
    const value = character?.[FEAT_CHOICES_KEY];
    return isPlainObject(value) ? value : {};
}

function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Choix enregistrés d'un don dans un emplacement, limités aux valeurs connues.
 * @param {Object} character
 * @param {number|string} level - niveau de l'emplacement (feat_<niveau>)
 * @param {string} featId
 * @returns {Object<string, string>} { champ: valeur } (champ absent = pas encore choisi)
 */
export function slotChoice(character, level, featId) {
    const rule = Object.hasOwn(FEAT_CHOICE_RULES, featId) ? FEAT_CHOICE_RULES[featId] : null;
    const slot = featChoicesState(character)[String(level)];
    const stored = isPlainObject(slot) && isPlainObject(slot[featId]) ? slot[featId] : {};
    const choice = {};
    for (const field of rule?.fields ?? []) {
        const value = stored[field.key];
        if (typeof value === 'string' && field.options.some(([option]) => option === value)) choice[field.key] = value;
    }
    return choice;
}

/**
 * Patch qui enregistre un choix (valeur vide : le choix est retiré). Les autres emplacements,
 * les autres dons du même emplacement et les autres champs ne changent pas.
 * @param {Object} character
 * @param {number|string} level
 * @param {string} featId
 * @param {string} key - champ (FEAT_CHOICE_RULES)
 * @param {string} value - valeur choisie, '' pour retirer le choix
 * @returns {Object} { feat_choices: {...} }, ou {} si le champ ou la valeur est inconnu
 */
export function setFeatChoicePatch(character, level, featId, key, value) {
    if (!Object.hasOwn(FEAT_CHOICE_RULES, featId)) return {};
    const field = FEAT_CHOICE_RULES[featId].fields.find(f => f.key === key);
    if (!field) return {};
    const text = String(value ?? '');
    if (text && !field.options.some(([option]) => option === text)) return {};
    const state = featChoicesState(character);
    const slotKey = String(level);
    const slot = isPlainObject(state[slotKey]) ? state[slotKey] : {};
    const current = isPlainObject(slot[featId]) ? { ...slot[featId] } : {};
    if (text) current[key] = text;
    else delete current[key];
    return { [FEAT_CHOICES_KEY]: { ...state, [slotKey]: { ...slot, [featId]: current } } };
}

/**
 * Ce que chaque don atteint donne d'après les choix, emplacement par emplacement.
 * @param {Object} character
 * @returns {Array<{ level: number, featId: string, featName: string, choice: Object,
 *   abilities: Array<{ ability: string, amount: number }>, save: string,
 *   skills: Array<{ skill: string, kind: 'proficiency'|'proficiencyOrExpertise'|'expertise', field: string }>,
 *   tools: number, element: string, missing: string[] }>}
 *   abilities : augmentations (une ligne par caractéristique) ; save : jet de sauvegarde maîtrisé
 *   (Résilient) ; skills : maîtrises et Expertises dues ; tools : maîtrises d'outils (Doué) ;
 *   element : type de dégâts (Adepte élémentaire) ; missing : libellés des champs pas encore choisis
 */
export function featChoiceGrants(character) {
    const grants = [];
    for (const slot of featSlots(character)) {
        if (!slot.reached || !Object.hasOwn(FEAT_CHOICE_RULES, slot.featId)) continue;
        const rule = FEAT_CHOICE_RULES[slot.featId];
        const choice = slotChoice(character, slot.level, slot.featId);
        const increases = [];
        if (rule.fixedAbility) increases.push(rule.fixedAbility);
        if (choice.asi) increases.push(...choice.asi.split(','));
        if (choice.ability) increases.push(choice.ability);
        const abilities = [];
        for (const ability of increases) {
            const known = abilities.find(a => a.ability === ability);
            if (known) known.amount += 1;
            else abilities.push({ ability, amount: 1 });
        }
        const skills = [];
        let tools = 0;
        if (choice.skill) {
            skills.push({
                skill: choice.skill, field: 'skill',
                kind: slot.featId === 'expert' ? 'proficiency' : 'proficiencyOrExpertise'
            });
        }
        if (choice.expertise) skills.push({ skill: choice.expertise, field: 'expertise', kind: 'expertise' });
        for (const key of ['pick1', 'pick2', 'pick3']) {
            if (choice[key] === TOOL_CHOICE) tools += 1;
            else if (choice[key]) skills.push({ skill: choice[key], field: key, kind: 'proficiency' });
        }
        grants.push({
            level: slot.level,
            featId: slot.featId,
            featName: featName(slot.featId),
            choice,
            abilities,
            save: slot.featId === 'resilient' ? choice.ability ?? '' : '',
            skills,
            tools,
            element: choice.element ?? '',
            missing: rule.fields.filter(field => !choice[field.key]).map(field => field.label)
        });
    }
    return grants;
}

/**
 * Types de dégâts choisis avec Adepte élémentaire (dons atteints), sans doublon.
 * @param {Object} character
 * @returns {string[]} identifiants ('fire'…)
 */
export function adeptElements(character) {
    return [...new Set(featChoiceGrants(character).map(grant => grant.element).filter(Boolean))];
}

/** Nom affiché d'une caractéristique, d'une compétence, d'un type de dégâts */
export const abilityName = (id) => ABILITY_NAMES[id] ?? id;
export const skillName = (id) => SKILL_NAMES[id] ?? id;
export const elementName = (id) => ELEMENT_NAMES[id] ?? id;
