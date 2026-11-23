// =============================================================================
// TOOL-SOURCES.JS (règles) - D'où viennent les outils du personnage (historique, dons)
//
// La fenêtre « Outils maîtrisés » (js/ui/tools.js) présente en tête ce que donnent l'historique et
// les dons du personnage, et où il en est. Rien n'est écrit ici : la case « Outils » (profs_tools)
// reste un texte saisi par le joueur, que seules ses cases cochées modifient.
//  - toolSources : une « source » par origine : l'historique, puis chaque don atteint qui donne des
//    outils (FEAT_TOOLS, js/data/tools.js) : Chef cuisinier et Empoisonneur (un outil précis),
//    Façonneur (trois outils différents de la table Façonnage rapide), Musicien (trois instruments),
//    Doué (autant d'outils que de menus du don réglés sur « Un outil », pris dans toute la liste) ;
//  - toolSourceProgress : combien d'outils notés dans la case comptent pour chaque source. Un outil
//    noté ne compte qu'une fois : il va d'abord à la source la plus étroite (outil précis, puis
//    liste courte, puis catégorie, puis « toute la liste »). Les listes sont emboîtées ou sans outil
//    commun : ce partage donne à chaque source le plus d'outils possible ;
//  - featuredToolSections : encadrés du haut de la fenêtre (les sources qui proposent exactement
//    les mêmes outils partagent un encadré : Artiste et Musicien, tous deux « instruments »).
// Un don prévu pour plus tard (emplacement pas encore atteint) ne compte pas, comme partout.
// Fonctions pures. Testé : tests/tool-sources.test.js.
// =============================================================================

import { TOOLS, FEAT_TOOLS } from '../data/tools.js';
import { toolsInText, removeToolFromText, backgroundToolExpectation } from './tools.js';
import { backgroundOf, backgroundToolNoted } from './background.js';
import { featSlots, featName, featSlotName } from './feats.js';
import { featChoiceGrants, FEAT_CHOICE_RULES } from './feat-choices.js';

const TOOL_BY_ID = new Map(TOOLS.map((tool) => [tool.id, tool]));
const TOOL_ORDER = new Map(TOOLS.map((tool, index) => [tool.id, index]));
const categoryToolIds = (categoryId) => TOOLS.filter((tool) => tool.category === categoryId).map((tool) => tool.id);

/** Où se règlent les menus d'un don (phrase de Doué) */
const FEAT_MENUS_PLACE = 'onglet Aptitudes & Traits';

/** « un outil au choix », « deux outils au choix »… (Doué) */
const ANY_TOOL_LABELS = Object.freeze(['un outil au choix', 'deux outils au choix', 'trois outils au choix']);

/**
 * Source d'outils.
 * @typedef {Object} ToolSource
 * @property {string} id - 'background', ou 'feat:<emplacement>:<don>'
 * @property {'background'|'feat'} kind
 * @property {string} title - « Historique (Sage) », « Don Façonneur (niveau 1) »
 * @property {string} from - suite de « Donné par … » : « votre historique (Sage) »
 * @property {string} label - ce qui est donné : « Outils de voleur », « trois instruments de musique au choix »
 * @property {string|null} toolId - outil précis ; null s'il y a un choix
 * @property {string[]|null} toolIds - outils qui comptent pour la source ; null : toute la liste
 * @property {string|null} categoryId - catégorie entière où se fait le choix (sinon null)
 * @property {number} count - nombre d'outils donnés (0 : Doué sans menu réglé sur « Un outil »)
 */

/** Source d'un don, d'après FEAT_TOOLS ; null si le don ne donne aucun outil pour l'instant */
function featSource(record, slot, grants) {
    const rule = FEAT_TOOLS[slot.featId];
    const name = featName(slot.featId);
    const slotName = featSlotName(slot.level);
    const base = {
        id: `feat:${slot.level}:${slot.featId}`, kind: 'feat',
        title: `Don ${name} (${slotName})`, from: `votre don ${name} (${slotName})`
    };
    if (rule.tool) {
        const tool = TOOL_BY_ID.get(rule.tool);
        return tool ? { ...base, label: tool.name, toolId: tool.id, toolIds: [tool.id], categoryId: null, count: 1 } : null;
    }
    if (rule.tools) {
        return { ...base, label: rule.choice, toolId: null, toolIds: [...rule.tools], categoryId: null, count: rule.count };
    }
    if (rule.category) {
        return { ...base, label: rule.choice, toolId: null, toolIds: categoryToolIds(rule.category), categoryId: rule.category, count: rule.count };
    }
    // Doué : autant d'outils que de menus réglés sur « Un outil »
    const grant = grants.find((g) => g.level === slot.level && g.featId === slot.featId);
    const count = grant?.tools ?? 0;
    const open = grant?.missing.length ?? 0;
    // Trois compétences choisies : le don ne donne aucun outil
    if (count === 0 && open === 0) return null;
    const label = count > 0
        ? `${ANY_TOOL_LABELS[count - 1] ?? `${count} outils au choix`}, dans toute la liste`
        : `trois compétences ou outils ; pour compter un outil ici, choisissez « Un outil » dans les menus du don (${FEAT_MENUS_PLACE})`;
    return { ...base, label, toolId: null, toolIds: null, categoryId: null, count };
}

/**
 * Ce qui donne des outils au personnage : son historique, puis ses dons atteints.
 * @param {Object} record - fiche au format de sauvegarde
 * @returns {ToolSource[]}
 */
export function toolSources(record) {
    const sources = [];
    const background = backgroundOf(record);
    const expectation = background ? backgroundToolExpectation(background.toolProfs[0]) : null;
    if (expectation) {
        sources.push({
            id: 'background', kind: 'background',
            title: `Historique (${background.nameFr})`, from: `votre historique (${background.nameFr})`,
            label: expectation.label,
            toolId: expectation.toolId,
            toolIds: expectation.toolId ? [expectation.toolId] : categoryToolIds(expectation.categoryId),
            categoryId: expectation.toolId ? null : expectation.categoryId,
            count: 1
        });
    }
    const grants = featChoiceGrants(record);
    const seen = new Set();
    for (const slot of featSlots(record)) {
        if (!slot.reached || !Object.hasOwn(FEAT_TOOLS, slot.featId)) continue;
        // Un don non répétable noté dans deux emplacements ne donne ses outils qu'une fois
        const repeatable = FEAT_CHOICE_RULES[slot.featId]?.repeatable === true;
        if (seen.has(slot.featId) && !repeatable) continue;
        seen.add(slot.featId);
        const source = featSource(record, slot, grants);
        if (source) sources.push(source);
    }
    return sources;
}

/**
 * Mot de l'avancement : « Noté », « À choisir », « 2 sur 3 ».
 * @param {number} noted - outils notés qui comptent
 * @param {number} count - outils donnés
 * @param {boolean} precise - un outil précis (sinon un choix)
 * @returns {string} '' si rien n'est donné
 */
export function toolProgressText(noted, count, precise) {
    if (count <= 0) return '';
    if (count === 1) {
        if (noted >= 1) return precise ? 'Noté' : 'Choisi';
        return precise ? 'À noter' : 'À choisir';
    }
    return `${Math.min(noted, count)} sur ${count}`;
}

/**
 * Où en est chaque source, d'après la case « Outils ».
 * @param {ToolSource[]} sources - toolSources(record)
 * @param {Object} record
 * @returns {{ id: string, noted: number, count: number, done: boolean, status: string, toolIds: string[] }[]}
 *   dans l'ordre des sources ; noted : outils de la case comptés pour la source (toolIds) ; done :
 *   tout ce que donne la source est noté ; status : toolProgressText
 */
export function toolSourceProgress(sources, record) {
    const noted = toolsInText(record?.profs_tools);
    const used = new Set();
    const taken = new Map();
    // La source la plus étroite d'abord ; à égalité, l'ordre des sources
    const order = sources.map((_source, index) => index)
        .sort((a, b) => (sources[a].toolIds?.length ?? Infinity) - (sources[b].toolIds?.length ?? Infinity) || a - b);
    for (const index of order) {
        const source = sources[index];
        const mine = noted.filter((id) => !used.has(id) && (source.toolIds === null || source.toolIds.includes(id)))
            .slice(0, source.count);
        for (const id of mine) used.add(id);
        taken.set(index, mine);
    }
    return sources.map((source, index) => {
        const mine = taken.get(index);
        // Outil de l'historique écrit à la main autrement que dans la liste (« Jeux de hasard ») : il
        // compte, comme dans l'encadré Historique (backgroundToolNoted). Les outils de la liste, déjà
        // comptés chacun pour une source, sont d'abord mis de côté
        const byHand = source.kind === 'background' && mine.length === 0 && backgroundToolNoted({
            ...record, profs_tools: noted.reduce((text, id) => removeToolFromText(text, id), record?.profs_tools ?? '')
        });
        const count = byHand ? 1 : mine.length;
        return {
            id: source.id, noted: count, count: source.count,
            done: source.count > 0 && count >= source.count,
            status: toolProgressText(count, source.count, source.toolId !== null),
            toolIds: mine
        };
    });
}

/** « a », « a et b », « a, b et c » */
const joinList = (items) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`);

/**
 * Encadrés du haut de la fenêtre : un par liste d'outils proposée (les sources qui proposent
 * exactement les mêmes outils partagent le leur). Une source « toute la liste » (Doué) n'en a pas.
 * @param {ToolSource[]} sources
 * @returns {{ key: string, title: string, toolIds: string[], categoryId: string|null,
 *   sourceIds: string[], precise: boolean }[]} toolIds dans l'ordre du manuel ; categoryId : la
 *   catégorie entière est dans l'encadré (elle n'est pas répétée plus bas) ; precise : un outil précis
 */
export function featuredToolSections(sources) {
    const sections = [];
    for (const source of sources) {
        if (source.toolIds === null || source.count <= 0) continue;
        const toolIds = [...source.toolIds].sort((a, b) => TOOL_ORDER.get(a) - TOOL_ORDER.get(b));
        const key = toolIds.join('|');
        const known = sections.find((section) => section.key === key);
        if (known) {
            known.sources.push(source);
            continue;
        }
        sections.push({ key, toolIds, categoryId: source.categoryId, precise: source.toolId !== null, sources: [source] });
    }
    return sections.map(({ sources: own, ...section }) => ({
        ...section,
        title: own.length === 1
            ? `Donné par ${own[0].from} : ${own[0].label}`
            : `Donnés par ${joinList(own.map((source) => source.from))} : ${own.map((source) => source.label).join(' ; ')}`,
        sourceIds: own.map((source) => source.id)
    }));
}

/**
 * Avancement d'un encadré : celui de ses sources, additionné.
 * @param {{ sourceIds: string[], precise: boolean }} section - featuredToolSections
 * @param {{ id: string, noted: number, count: number }[]} progress - toolSourceProgress
 * @returns {{ done: boolean, status: string }}
 */
export function sectionProgress(section, progress) {
    const own = progress.filter((entry) => section.sourceIds.includes(entry.id));
    const noted = own.reduce((sum, entry) => sum + entry.noted, 0);
    const count = own.reduce((sum, entry) => sum + entry.count, 0);
    return { done: count > 0 && noted >= count, status: toolProgressText(noted, count, section.precise) };
}
