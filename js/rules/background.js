// =============================================================================
// BACKGROUND.JS (règles) - Ce que donne l'historique, et ce qui manque sur la fiche
//
// Manuel des joueurs français, chapitre 4 (p. 177-185) : chaque historique donne trois
// caractéristiques possibles (+2 et +1, ou +1 à chacune, jamais au-delà de 20), un don d'origine,
// deux compétences, un outil, et un lot d'équipement ou 50 po.
//  - backgroundSummary : lignes à afficher, avec un repère « À vérifier » pour ce qui manque ;
//  - backgroundApplyPatch : bouton « Appliquer » : coche les deux compétences, remplit le don de
//    niveau 1 (feat_1) seulement s'il est vide, et ajoute l'outil à la case « Outils » quand
//    l'historique donne un outil PRÉCIS qui n'y est pas encore (Sage, Criminel…) : le nom s'écrit à
//    la suite, rien de ce que le joueur a écrit n'est retiré ni réécrit (addToolToText,
//    js/rules/tools.js), et jamais en double. Un outil « au choix » (Artisan, Artiste, Soldat…) n'est
//    pas écrit : il se choisit dans la fenêtre des outils (backgroundAppliedMessage y invite). Les
//    caractéristiques ne sont jamais modifiées (les valeurs saisies comprennent déjà le bonus).
// Données : DD_RULES.backgrounds (js/data/dd-rules.js). Fonctions pures.
// =============================================================================

import { DD_RULES } from '../data/dd-rules.js';
import { ABILITIES, SKILLS } from '../data/constants.js';
import { FEATS_DATA } from '../data/feats.js';
import { featChoicesState, slotChoice, MAGIC_INITIATE_CLASSES } from './feat-choices.js';
import { backgroundToolExpectation, expectedToolNoted, addToolToText } from './tools.js';
import { plainText } from './plain-text.js';

const plain = (value) => plainText(value, { spaced: true });
const fold = (value) => plain(value).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").toLowerCase();

/** Mots qui montrent qu'un outil est noté dans « Outils » (outils au choix : un mot de la famille).
 *  Reconnaissance large, pour les textes écrits à la main ; s'y ajoute le nom exact d'un outil du
 *  manuel (expectedToolNoted, js/rules/tools.js), celui qu'écrit la fenêtre « Choisir dans la liste » */
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

/**
 * Outil donné par l'historique du personnage, pour la fenêtre « Choisir dans la liste ».
 * @param {Object} record
 * @returns {null | { background: string, toolId: string|null, categoryId: string, label: string }}
 */
export function backgroundTool(record) {
    const background = backgroundOf(record);
    const expectation = background ? backgroundToolExpectation(background.toolProfs[0]) : null;
    return expectation ? { background: background.nameFr, ...expectation } : null;
}

/** L'outil de cet historique est-il noté dans la case « Outils » ? (voir backgroundToolNoted) */
function toolNotedFor(record, background) {
    const tools = fold(record?.profs_tools);
    const words = TOOL_WORDS[background.toolProfs[0]] ?? [];
    // Mots courts en mot entier seulement : « cor » ne trouve pas « cordonnier ». Les dés se
    // cherchent avec l'accent (« des » est un mot courant)
    const tokens = tools.split(/[^a-z']+/).filter(Boolean);
    const short = new Set(['cor', 'jeu']);
    return words.some((word) => (short.has(word)
        ? tokens.includes(word) || (word === 'jeu' && tokens.includes('jeux'))
        : tools.includes(word)))
        || (background.toolProfs[0] === 'Gaming Set' && /(^|[^a-zà-ÿ])dés($|[^a-zà-ÿ])/i.test(plain(record?.profs_tools)))
        || expectedToolNoted(record?.profs_tools, backgroundToolExpectation(background.toolProfs[0]));
}

/**
 * L'outil de l'historique (ou un outil de la famille, s'il est au choix) est-il noté dans la case
 * « Outils » ? Reconnaissance large : un mot de la famille écrit à la main (TOOL_WORDS), ou le nom
 * d'un outil du manuel (js/rules/tools.js).
 * @param {Object} record
 * @returns {boolean} false sans historique reconnu
 */
export function backgroundToolNoted(record) {
    const background = backgroundOf(record);
    return background ? toolNotedFor(record, background) : false;
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
 *   canApply: boolean, applyText: string[], writesTool: boolean, toolChoice: string|null
 * }} check : ce qui manque sur la fiche (« À vérifier ») ; writesTool : le bouton « Appliquer » a
 *   l'outil précis de l'historique à écrire dans la case Outils ; toolChoice : outil au choix pas
 *   encore noté (« un instrument de musique au choix »), que le bouton n'écrit pas ; null sans
 *   historique reconnu
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

    const toolNoted = toolNotedFor(record, background);
    lines.push({
        id: 'tool', label: 'Outil', text: `${background.toolFr}.`,
        ...(toolNoted ? {} : { check: 'Pas encore noté dans la case « Outils » (onglet Compétences & Histoire).' })
    });

    lines.push({
        id: 'gear', label: 'Équipement',
        text: `Le lot d'équipement de l'historique (dont ${background.kitGold} po), ou 50 po.`
    });

    const applyText = [];
    if (missing.length) applyText.push(`cocher ${missing.map((s) => s.name).join(' et ')}`);
    if (!feat1) applyText.push(`choisir le don ${featName} au niveau 1`);
    const expectation = backgroundToolExpectation(background.toolProfs[0]);
    const writesTool = !toolNoted && Boolean(expectation?.toolId);
    if (writesTool) applyText.push(`noter ${expectation.label} dans la case Outils`);
    return {
        name: background.nameFr, lines, canApply: applyText.length > 0, applyText, writesTool,
        toolChoice: !toolNoted && expectation && !expectation.toolId ? expectation.label : null
    };
}

/**
 * Bouton « Appliquer » : compétences de l'historique cochées, don de niveau 1 rempli s'il est vide
 * (avec la liste de sorts d'Initié à la magie si aucune n'est choisie), outil PRÉCIS de l'historique
 * ajouté à la suite de la case « Outils » s'il n'y est pas noté (profs_tools : le texte du joueur
 * est gardé tel quel, le nom s'écrit après lui). Un outil au choix n'est pas écrit. Rien d'autre
 * ne change.
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
    const expectation = backgroundToolExpectation(background.toolProfs[0]);
    if (expectation?.toolId && !toolNotedFor(record, background)) {
        const current = typeof record?.profs_tools === 'string' ? record.profs_tools : '';
        const next = addToolToText(current, expectation.toolId);
        if (next !== current) patch.profs_tools = next;
    }
    return patch;
}

/** « a », « a et b », « a, b et c » */
const joinList = (items) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`);

/**
 * Phrase de la fenêtre de confirmation du bouton « Appliquer ».
 * @param {Object} summary - backgroundSummary(record), avant d'appliquer
 * @returns {string}
 */
export function backgroundApplyConfirm(summary) {
    const kept = summary.writesTool
        ? "Les caractéristiques ne changent pas, et rien de ce que vous avez écrit dans la case Outils n'est retiré."
        : 'Les caractéristiques et les outils ne changent pas.';
    const choice = summary.toolChoice
        ? ` L'outil de l'historique (${summary.toolChoice}) se choisit ensuite avec « Choisir dans la liste ».`
        : '';
    return `La fiche va ${joinList(summary.applyText)}. ${kept}${choice}`;
}

/**
 * Message de la barre du haut après « Appliquer ».
 * @param {Object} summary - backgroundSummary(record), APRÈS avoir appliqué
 * @returns {string} invite à choisir l'outil s'il est au choix et pas encore noté ; signale un
 *   outil précis resté à noter (mise en forme indisponible hors ligne : la case n'a pas été écrite)
 */
export function backgroundAppliedMessage(summary) {
    const done = `Historique ${summary.name} appliqué.`;
    if (summary.toolChoice) return `${done} Outil au choix : bouton « Choisir dans la liste », ligne Outil.`;
    return summary.writesTool ? `${done} Outil à noter : bouton « Choisir dans la liste », ligne Outil.` : done;
}
