// =============================================================================
// BACKGROUND.JS (règles) - Ce que donne l'historique, et ce qui manque sur la fiche
//
// Manuel des joueurs français, chapitre 4 (p. 177-185) : chaque historique donne trois
// caractéristiques possibles (+2 et +1, ou +1 à chacune, jamais au-delà de 20), un don d'origine,
// deux compétences, un outil, et un lot d'équipement ou 50 po.
//  - backgroundSummary : lignes à afficher, avec un repère « À vérifier » pour ce qui manque ;
//  - backgroundApplyPatch : bouton « Appliquer » : coche les deux compétences et remplit le don de
//    niveau 1 (feat_1) seulement s'il est vide. Les caractéristiques ne sont jamais modifiées (les
//    valeurs saisies comprennent déjà le bonus), l'outil n'est jamais écrit (rappel seulement).
// Données : DD_RULES.backgrounds (js/data/dd-rules.js). Fonctions pures.
// =============================================================================

import { DD_RULES } from '../data/dd-rules.js';
import { ABILITIES, SKILLS } from '../data/constants.js';
import { FEATS_DATA } from '../data/feats.js';
import { featChoicesState, slotChoice, MAGIC_INITIATE_CLASSES } from './feat-choices.js';

const plain = (value) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const fold = (value) => plain(value).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").toLowerCase();

/** Mots qui montrent qu'un outil est noté dans « Outils » (outils au choix : un mot de la famille) */
const TOOL_WORDS = Object.freeze({
    "Calligrapher's Supplies": ['calligraph'],
    "Artisan's Tools": ['artisan', 'alchim', 'brass', 'calligraph', 'bricol', 'cartograph', 'charpent', 'cordonn', 'cuisin',
        'forgeron', 'joaill', 'macon', 'peintr', 'potier', 'sculpt', 'souffleur', 'tann', 'tisser'],
    'Forgery Kit': ['contrefacon', 'faussaire'],
    "Thieves' Tools": ['voleur'],
    'Musical Instrument': ['musique', 'luth', 'flute', 'tambour', 'lyre', 'cor', 'viole', 'cornemuse', 'chalemie', 'tympanon', 'flute de pan'],
    "Carpenter's Tools": ['charpent'],
    'Gaming Set': ['jeu', 'echecs', 'osselets', 'cartes', 'dragons'],
    "Cartographer's Tools": ['cartograph'],
    'Herbalism Kit': ['herbor'],
    "Navigator's Tools": ['navigat']
});

/**
 * Historique du personnage (nom français ou anglais, sans HTML).
 * @param {Object} record
 * @returns {Object|null} entrée de DD_RULES.backgrounds, avec son id
 */
export function backgroundOf(record) {
    const name = fold(record?.char_background);
    if (!name) return null;
    for (const [id, background] of Object.entries(DD_RULES.backgrounds)) {
        if ([id, background.name, background.nameFr].some((n) => fold(n) === name)) return { id, ...background };
    }
    return null;
}

/** « Initié à la magie (Clerc) » */
function featLabel(background) {
    const name = FEATS_DATA[background.featId]?.name ?? background.feat;
    const list = MAGIC_INITIATE_CLASSES.find(([id]) => id === background.featList)?.[1];
    return list ? `${name} (${list})` : name;
}

/**
 * Lignes de l'encadré « Historique ».
 * @param {Object} record
 * @returns {null | {
 *   name: string,
 *   lines: { id: string, label: string, text: string, check?: string }[],
 *   canApply: boolean, applyText: string[]
 * }} check : ce qui manque sur la fiche (« À vérifier ») ; null sans historique reconnu
 */
export function backgroundSummary(record) {
    const background = backgroundOf(record);
    if (!background) return null;
    const lines = [];

    const abilities = background.abilityScores.map((id) => ABILITIES.find((a) => a.id === id)?.name ?? id);
    lines.push({
        id: 'abilities', label: 'Caractéristiques',
        text: `${abilities.join(', ')} : +2 à l'une et +1 à une autre, ou +1 à chacune (20 au plus). Déjà comprises dans les valeurs saisies : la fiche ne les ajoute pas.`
    });

    const featName = featLabel(background);
    const feat1 = plain(record?.feat_1);
    let featCheck;
    if (!feat1) featCheck = 'Don de niveau 1 vide.';
    else if (feat1 !== background.featId) {
        featCheck = `Votre don de niveau 1 est ${FEATS_DATA[feat1]?.name ?? feat1} : normal seulement si votre MJ l'a permis.`;
    } else if (background.featList) {
        const list = slotChoice(record, 1, background.featId).list;
        if (list && list !== background.featList) {
            const chosen = MAGIC_INITIATE_CLASSES.find(([id]) => id === list)?.[1] ?? list;
            featCheck = `Liste de sorts choisie : ${chosen} (l'historique donne celle du ${featName.match(/\((.*)\)/)[1]}).`;
        }
    }
    lines.push({ id: 'feat', label: "Don d'origine", text: `${featName}, au niveau 1.`, ...(featCheck ? { check: featCheck } : {}) });

    const skills = background.skillProfs.map((id) => SKILLS.find((s) => s.id === id));
    const missing = skills.filter((skill) => record?.[`skill_prof_${skill.id}`] !== true);
    lines.push({
        id: 'skills', label: 'Compétences', text: `${skills.map((s) => s.name).join(' et ')}.`,
        ...(missing.length ? { check: `Pas cochée${missing.length > 1 ? 's' : ''} : ${missing.map((s) => s.name).join(', ')}.` } : {})
    });

    const tools = fold(record?.profs_tools);
    const words = TOOL_WORDS[background.toolProfs[0]] ?? [];
    // Mots courts en mot entier seulement : « cor » ne trouve pas « cordonnier ». Les dés se
    // cherchent avec l'accent (« des » est un mot courant)
    const tokens = tools.split(/[^a-z']+/).filter(Boolean);
    const short = new Set(['cor', 'jeu']);
    const toolNoted = words.some((word) => (short.has(word)
        ? tokens.includes(word) || (word === 'jeu' && tokens.includes('jeux'))
        : tools.includes(word)))
        || (background.toolProfs[0] === 'Gaming Set' && /(^|[^a-zà-ÿ])dés($|[^a-zà-ÿ])/i.test(plain(record?.profs_tools)));
    lines.push({
        id: 'tool', label: 'Outil', text: `${background.toolFr}.`,
        ...(toolNoted ? {} : { check: 'Pas trouvé dans « Outils » (onglet Compétences & Histoire) : à noter vous-même.' })
    });

    lines.push({
        id: 'gear', label: 'Équipement',
        text: `Le lot d'équipement de l'historique (dont ${background.kitGold} po), ou 50 po.`
    });

    const applyText = [];
    if (missing.length) applyText.push(`cocher ${missing.map((s) => s.name).join(' et ')}`);
    if (!feat1) applyText.push(`choisir le don ${featName} au niveau 1`);
    return { name: background.nameFr, lines, canApply: applyText.length > 0, applyText };
}

/**
 * Bouton « Appliquer » : compétences de l'historique cochées, don de niveau 1 rempli s'il est vide
 * (avec la liste de sorts d'Initié à la magie si aucune n'est choisie). Rien d'autre ne change.
 * @param {Object} record
 * @returns {Object} patch ({} si rien à faire)
 */
export function backgroundApplyPatch(record) {
    const background = backgroundOf(record);
    if (!background) return {};
    const patch = {};
    for (const id of background.skillProfs) {
        if (record?.[`skill_prof_${id}`] !== true) patch[`skill_prof_${id}`] = true;
    }
    if (!plain(record?.feat_1)) {
        patch.feat_1 = background.featId;
        if (background.featList) {
            const state = featChoicesState(record);
            const slot = state['1'] && typeof state['1'] === 'object' ? state['1'] : {};
            const stored = slot[background.featId] && typeof slot[background.featId] === 'object' ? slot[background.featId] : {};
            if (!stored.list) {
                patch.feat_choices = { ...state, 1: { ...slot, [background.featId]: { ...stored, list: background.featList } } };
            }
        }
    }
    return patch;
}
