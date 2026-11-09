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
// Lot 6, dons à sorts (ce qu'ils donnent : js/rules/feat-spells.js). Les sorts choisis sont
// enregistrés par leur nom anglais (clé stable, listes de js/data/feat-spells.js) :
//  - Initié à la magie (« Magic Initiate », p. 201) : liste Clerc, Druide ou Magicien, caractéristique
//    des sorts (Int, Sag ou Cha, sans +1 : champ castAbility), 2 sorts mineurs et 1 sort de niveau 1
//    de cette liste ; répétable avec une autre liste ;
//  - Affinité féerique (« Fey-Touched », p. 204) et Affinité ombreuse (« Shadow-Touched », p. 207) :
//    +1 Int, Sag ou Cha (c'est aussi la caractéristique des sorts) et 1 sort de niveau 1 de
//    Divination ou d'Enchantement (féerique), d'Illusion ou de Nécromancie (ombreuse) ;
//  - Magie rituelle (« Ritual Caster », p. 206) : +1 Int, Sag ou Cha ; autant de sorts rituels de
//    niveau 1 que le bonus de maîtrise (un menu de plus aux niveaux 5, 9, 13 et 17) ;
//  - Télépathe (« Telepathic », p. 207-208) et Télékinésiste (« Telekinetic », p. 207) : +1 Int, Sag
//    ou Cha, caractéristique de leur sort.
// Lot 5 : le +1 de chaque don général que la fiche ne suivait pas encore (Sentinelle, Mobile,
// Figure de proue…) vient du champ « asi » de js/data/feats.js, vérifié contre le PHB 2024 (32 dons) :
// un menu « Caractéristique +1 » s'il y a un choix, sinon fixedAbility (Gaillard : Constitution).
// Lot 8, faveurs épiques (« Epic Boon Feats », p. 210-211) : +1 jusqu'à 30 (menu selon le champ
// « asi »), plus l'Expertise de Faveur de compétence et les deux types de dégâts de Faveur de
// résistance aux énergies (à changer après un repos long : le menu se change à tout moment).
// Champs facultatifs d'un menu : dependsOn + optionsBy (options selon un autre choix : sorts de la
// liste choisie), fromLevel (menu utile à partir de ce niveau de personnage).
// Fonctions pures : le personnage reçu n'est jamais modifié.
// =============================================================================

import { ABILITIES, ABILITY_IDS, SKILLS } from '../data/constants.js';
import { featSlots, featName, characterLevel } from './feats.js';
import { FEATS_DATA } from '../data/feats.js';
import {
    MAGIC_INITIATE_LISTS, FEY_TOUCHED_SPELLS, SHADOW_TOUCHED_SPELLS, RITUAL_SPELLS
} from '../data/feat-spells.js';

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
/** Sorts d'une liste de js/data/feat-spells.js : [nom anglais (valeur), nom français] */
const spellOptions = (list) => list.map(([vo, name]) => [vo, name]);
const CASTING_ABILITIES = abilityOptions(['int', 'wis', 'cha']);

/** Listes d'Initié à la magie : [id, nom] */
export const MAGIC_INITIATE_CLASSES = Object.freeze([['cleric', 'Clerc'], ['druid', 'Druide'], ['wizard', 'Magicien']]);

/** Menu d'un sort d'Initié à la magie : les sorts de la liste choisie (part : cantrips ou level1) */
function initiateSpellField(key, label, part) {
    const optionsBy = Object.fromEntries(MAGIC_INITIATE_CLASSES.map(([id]) => [id, spellOptions(MAGIC_INITIATE_LISTS[id][part])]));
    const union = new Map(Object.values(optionsBy).flat());
    return { key, label, spell: true, wide: true, dependsOn: 'list', optionsBy, options: [...union] };
}

/** Sorts rituels de Magie rituelle : autant que le bonus de maîtrise (2, puis +1 aux niveaux 5, 9, 13, 17) */
const RITUAL_FROM_LEVEL = [0, 0, 5, 9, 13, 17];

/**
 * Champs à choisir pour chaque don.
 *  - key : clé dans la sauvegarde ; label : libellé affiché ; options : [[valeur, texte], …] ;
 *  - groups : options regroupées (Amélioration de caractéristique) ; wide : menu sur toute la largeur
 *    (libellés longs) ;
 *  - fixedAbility : caractéristique augmentée sans choix (Esprit affûté : Intelligence).
 */
const CHOICE_RULES = {
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
    },
    // Lot 6 : dons à sorts
    initie_a_la_magie: {
        repeatable: true,
        fields: [
            { key: 'list', label: 'Liste de sorts', options: MAGIC_INITIATE_CLASSES },
            { key: 'castAbility', label: 'Caractéristique des sorts', options: CASTING_ABILITIES },
            initiateSpellField('cantrip1', 'Sort mineur 1', 'cantrips'),
            initiateSpellField('cantrip2', 'Sort mineur 2', 'cantrips'),
            initiateSpellField('spell', 'Sort de niveau 1', 'level1')
        ]
    },
    affinite_feerique: {
        fields: [
            { key: 'ability', label: 'Caractéristique +1', options: CASTING_ABILITIES },
            { key: 'spell', label: 'Sort de niveau 1', spell: true, wide: true, options: spellOptions(FEY_TOUCHED_SPELLS) }
        ]
    },
    affinite_ombreuse: {
        fields: [
            { key: 'ability', label: 'Caractéristique +1', options: CASTING_ABILITIES },
            { key: 'spell', label: 'Sort de niveau 1', spell: true, wide: true, options: spellOptions(SHADOW_TOUCHED_SPELLS) }
        ]
    },
    magie_rituelle: {
        fields: [
            { key: 'ability', label: 'Caractéristique +1', options: CASTING_ABILITIES },
            ...RITUAL_FROM_LEVEL.map((fromLevel, i) => ({
                key: `ritual${i + 1}`, label: `Sort rituel ${i + 1}`, spell: true, wide: true,
                options: spellOptions(RITUAL_SPELLS), ...(fromLevel ? { fromLevel } : {})
            }))
        ]
    },
    telepathe: {
        fields: [{ key: 'ability', label: 'Caractéristique +1', options: CASTING_ABILITIES }]
    },
    telekinesiste: {
        fields: [{ key: 'ability', label: 'Caractéristique +1', options: CASTING_ABILITIES }]
    }
};

/** Abréviations du champ « asi » de js/data/feats.js */
const ASI_ABBREVIATIONS = Object.freeze({ For: 'str', Dex: 'dex', Con: 'con', Int: 'int', Sag: 'wis', Cha: 'cha' });

/**
 * Caractéristiques d'un « +1 » de don général : « +1 For ou Dex » → ['str', 'dex'].
 * @param {string} asi - champ « asi » de js/data/feats.js
 * @returns {string[]} [] si le texte n'est pas un simple +1 (Aucune, faveur épique, +2…)
 */
export function asiAbilities(asi) {
    const match = String(asi ?? '').match(/^\+1 (.+)$/);
    if (!match) return [];
    const ids = match[1].split(' ou ').map(word => ASI_ABBREVIATIONS[word.trim()]);
    return ids.length && ids.every(Boolean) ? ids : [];
}

/** Dons généraux sans autre choix : seulement leur +1 (menu, ou caractéristique fixe sans menu) */
const GENERAL_ASI_RULES = Object.fromEntries(Object.entries(FEATS_DATA)
    .filter(([id, feat]) => feat.type === 'Général' && !Object.hasOwn(CHOICE_RULES, id))
    .map(([id, feat]) => [id, asiAbilities(feat.asi)])
    .filter(([, ids]) => ids.length > 0)
    .map(([id, ids]) => [id, ids.length === 1
        ? { fixedAbility: ids[0], fields: [] }
        : { fields: [{ key: 'ability', label: 'Caractéristique +1', options: abilityOptions(ids) }] }]));

/** Types de dégâts de Faveur de résistance aux énergies (PHB 2024 p. 210) : [id, nom] */
export const ENERGY_TYPES = Object.freeze([
    ['acid', 'Acide'], ['cold', 'Froid'], ['fire', 'Feu'], ['lightning', 'Foudre'], ['necrotic', 'Nécrotique'],
    ['poison', 'Poison'], ['psychic', 'Psychique'], ['radiant', 'Radiant'], ['thunder', 'Tonnerre']
]);

/**
 * Caractéristiques du +1 d'une faveur épique : « +1 au choix (max 30) » → les six ;
 * « +1 For ou Dex (max 30) » → ['str', 'dex'].
 * @param {string} asi - champ « asi » de js/data/feats.js
 * @returns {string[]}
 */
export function epicAsiAbilities(asi) {
    const text = String(asi ?? '').replace(/\s*\(max 30\)\s*$/, '');
    return text === '+1 au choix' ? [...ABILITY_IDS] : asiAbilities(text);
}

/** Choix en plus du +1, pour deux faveurs */
const EPIC_EXTRA_FIELDS = {
    faveur_de_competence: [{ key: 'expertise', label: 'Expertise', options: skillOptions(SKILL_IDS) }],
    faveur_de_resistance_aux_energies: [
        { key: 'energy1', label: 'Résistance 1', options: ENERGY_TYPES },
        { key: 'energy2', label: 'Résistance 2', options: ENERGY_TYPES }
    ]
};

/** Faveurs épiques : menu « Caractéristique +1 » (jusqu'à 30), et leurs autres choix */
const EPIC_RULES = Object.fromEntries(Object.entries(FEATS_DATA)
    .filter(([, feat]) => feat.type === 'Épique')
    .map(([id, feat]) => [id, {
        epic: true,
        fields: [
            { key: 'ability', label: 'Caractéristique +1', options: abilityOptions(epicAsiAbilities(feat.asi)) },
            ...(EPIC_EXTRA_FIELDS[id] ?? [])
        ]
    }]));

export const FEAT_CHOICE_RULES = Object.freeze({ ...CHOICE_RULES, ...GENERAL_ASI_RULES, ...EPIC_RULES });

/**
 * Options d'un menu, compte tenu des autres choix du don (sorts de la liste choisie pour Initié
 * à la magie ; aucune tant que la liste n'est pas choisie).
 * @param {Object} field - champ de FEAT_CHOICE_RULES
 * @param {Object<string, string>} [choice] - autres choix du même don
 * @returns {Array<[string, string]>}
 */
export function fieldOptions(field, choice = {}) {
    if (!field.optionsBy) return field.options;
    return Object.hasOwn(field.optionsBy, choice[field.dependsOn] ?? '') ? field.optionsBy[choice[field.dependsOn]] : [];
}

/**
 * Menu utile au niveau du personnage (Magie rituelle : un sort rituel de plus aux niveaux 5, 9…)
 * @param {Object} field
 * @param {Object} character
 * @returns {boolean}
 */
export function fieldActive(field, character) {
    return !field.fromLevel || characterLevel(character?.char_level) >= field.fromLevel;
}

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
    // Dans l'ordre des champs : la liste d'Initié à la magie est lue avant ses sorts
    for (const field of rule?.fields ?? []) {
        const value = stored[field.key];
        if (typeof value === 'string' && fieldOptions(field, choice).some(([option]) => option === value)) choice[field.key] = value;
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
            missing: rule.fields.filter(field => fieldActive(field, character) && !choice[field.key]).map(field => field.label)
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
