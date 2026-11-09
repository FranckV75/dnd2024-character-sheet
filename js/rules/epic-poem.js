// =============================================================================
// EPIC-POEM.JS (règles) - Collège de poésie épique (Odyssée, Guide du joueur, p. 37-38), lot 7
//
// Le barde compte les strophes de son poème (une par événement décisif accepté par le MJ, jamais
// perdues). Le rang du poème vient du nombre de strophes et du nombre de joueurs du groupe :
// il faut (joueurs × rang) strophes pour chaque rang, jusqu'au rang 10 (le livre compte 6 joueurs).
// Le rang donne un résultat minimum au dé d'Inspiration bardique (2 au rang 1, puis +1 tous les deux
// rangs) et débloque un effet tous les deux rangs, à donner avec le dé : ces effets profitent à
// l'allié qui garde le dé, jamais à la fiche du barde (l'Inspiration bardique vise une autre créature).
// Mémorisé dans subclass_choices.college_of_epic_muse (strophes, party : js/data/subclass-choices.js).
// Fonctions pures : aucune valeur saisie n'est modifiée.
// =============================================================================

import { stepSubclassChoicePatch } from './subclass-choices.js';
import { bardicInspirationDie } from './subclass-calcs.js';

export const EPIC_MUSE = 'college_of_epic_muse';
/** Groupe du livre : 6 joueurs */
export const DEFAULT_PARTY = 6;
/** Rang le plus haut du poème */
export const MAX_RANK = 10;

/** Effets débloqués par le rang (table p. 37-38), choisis à chaque don du dé (rien n'est mémorisé) */
export const EPIC_EFFECTS = Object.freeze([
    { id: 'courage', label: 'Courage épique', rank: 2, text: 'Avantage aux sauvegardes contre la terreur (état Effrayé).' },
    { id: 'clairvoyance', label: 'Clairvoyance épique', rank: 4, text: 'Ne peut pas être surpris ; Perception passive +5.' },
    { id: 'determination', label: 'Détermination épique', rank: 6, text: 'Avantage aux jets de sauvegarde contre la mort.' },
    { id: 'reflexes', label: 'Réflexes épiques', rank: 8, text: 'Avantage aux sauvegardes contre les sorts qui visent ou touchent plusieurs créatures.' },
    { id: 'resistance', label: 'Résistance épique', rank: 10, text: 'Résistance à un type de dégâts choisi par le barde au moment du don.' }
]);

/** Entier lu dans une valeur enregistrée (chaîne validée, ou nombre), ou null */
function wholeNumber(value) {
    const n = typeof value === 'number' ? value : typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value) ? Number(value) : NaN;
    return Number.isInteger(n) ? n : null;
}

/**
 * Résultat minimum du dé d'Inspiration bardique au rang donné : 2 (rang 1), 3 (rang 3), 4 (rang 5),
 * 5 (rang 7), 6 (rang 9) ; un rang pair garde celui du rang d'avant.
 * @param {number} rank
 * @returns {number|null} null avant le rang 1
 */
export function epicMinResult(rank) {
    const r = Math.min(MAX_RANK, Math.trunc(Number(rank)) || 0);
    return r >= 1 ? 2 + Math.floor((r - 1) / 2) : null;
}

/**
 * État du poème.
 * @param {Object<string, string>} [choice] - derived.subclassChoices de la Poésie épique
 *   (strophes : « 0 » à « 999 » ; party : « 1 » à « 8 ») ; absent ou illisible : 0 strophe, 6 joueurs
 * @returns {{ strophes: number, party: number, partyChosen: boolean, rank: number, minResult: number|null,
 *   effects: Array<{ id: string, label: string, rank: number, unlocked: boolean, text: string }>,
 *   next: { rank: number, needed: number, missing: number } | null }}
 *   next : prochain rang, strophes qu'il demande et strophes qui manquent (null au rang 10)
 */
export function epicPoem(choice = {}) {
    const s = wholeNumber(choice?.strophes);
    const strophes = s !== null && s >= 0 && s <= 999 ? s : 0;
    const p = wholeNumber(choice?.party);
    const partyChosen = p !== null && p >= 1 && p <= 8;
    const party = partyChosen ? p : DEFAULT_PARTY;
    const rank = Math.min(MAX_RANK, Math.floor(strophes / party));
    const next = rank < MAX_RANK
        ? { rank: rank + 1, needed: party * (rank + 1), missing: party * (rank + 1) - strophes }
        : null;
    return {
        strophes, party, partyChosen, rank, minResult: epicMinResult(rank),
        effects: EPIC_EFFECTS.map(effect => ({ ...effect, unlocked: rank >= effect.rank })),
        next
    };
}

/** « 14 strophes — rang 2 (6 joueurs). Rang 3 à 18 strophes : encore 4. » */
export function epicPoemSummary(poem) {
    const count = `${poem.strophes} strophe${poem.strophes > 1 ? 's' : ''}`;
    const players = `${poem.party} joueur${poem.party > 1 ? 's' : ''}`;
    const head = `${count} — rang ${poem.rank} (${players}).`;
    if (!poem.next) return `${head} Rang ${MAX_RANK} atteint : les strophes suivantes n'ajoutent plus rien.`;
    return `${head} Rang ${poem.next.rank} à ${poem.next.needed} strophes : encore ${poem.next.missing}.`;
}

/** Poème du personnage, ou null s'il n'a pas la sous-classe au niveau 3 */
function poemOf(derived) {
    if (derived?.subclass !== EPIC_MUSE || (Number(derived.level) || 1) < 3) return null;
    return epicPoem(derived.subclassChoices ?? {});
}

/**
 * Patch des boutons « − » et « + 1 strophe » : strophes + delta, entre 0 et 999.
 * @param {Object} character
 * @param {Object} derived - deriveCharacter(character)
 * @param {number} delta
 * @returns {Object} { subclass_choices } ou {} hors de la Poésie épique (ou avant le niveau 3)
 */
export function strophePatch(character, derived, delta) {
    if (!poemOf(derived)) return {};
    return stepSubclassChoicePatch(character, derived, 'strophes', delta);
}

/** « Courage épique, Clairvoyance épique » des effets débloqués, ou « aucun » */
const unlockedText = (poem) => poem.effects.filter(e => e.unlocked).map(e => e.label).join(', ') || 'aucun';

/**
 * Textes « Dans la fiche » des capacités (js/rules/subclass-features.js), selon le poème.
 * @param {Object} derived - deriveCharacter()
 * @returns {{ composition: string, inspirations: string, inspirationList: string[], aegis: string, epithets: string }}
 */
export function epicPoemTexts(derived = {}) {
    const poem = poemOf(derived) ?? epicPoem({});
    const level = Number(derived.level) || 1;
    const die = `1${bardicInspirationDie(level)}`;
    const min = poem.minResult;
    return {
        composition: `Compteur de strophes ci-dessous (modifiable fiche verrouillée) : ${epicPoemSummary(poem)}${level >= 6
            ? ' Égide du poète : allié concerné à 1,50 m ou moins → décochez vous-même une case d\'Inspiration bardique.' : ''}`,
        inspirations: `Dé d'Inspiration : ${die}${min ? ` · résultat minimum ${min}` : ' · pas encore de minimum (rang 1 à atteindre)'} ; effets débloqués : ${unlockedText(poem)}. Repère près des cases d'Inspiration bardique (onglet Combat). Les effets profitent à l'allié qui garde le dé, jamais à votre fiche :`,
        inspirationList: poem.effects.map(e => `${e.label} (rang ${e.rank}${e.unlocked ? ', débloqué' : ', pas encore'}) : ${e.text}`),
        aegis: 'Rappel « À vérifier » près de la CA tant que la case Intermédiaires n\'est pas cochée. Regain d\'un dé d\'Inspiration : rappel sous le compteur de strophes.',
        epithets: `Dé à lancer : ${die}${min ? ` (le minimum du rang, ${min}, s'applique sans doute aussi : à confirmer avec le MJ)` : ''}.`
    };
}

/**
 * Repère près des cases d'Inspiration bardique (zone classResource, format FeatNote avec
 * classFeature: true), fusionné par classFeatureNotes (class-features.js).
 * @param {Object} derived - deriveCharacter()
 * @returns {Object<string, Object[]>}
 */
export function epicPoemNotes(derived = {}) {
    const poem = poemOf(derived);
    if (!poem) return {};
    const die = `1${bardicInspirationDie(Number(derived.level) || 1)}`;
    return {
        classResource: [{
            featId: 'inspirations_poetiques', featName: 'Poésie épique',
            text: `${epicPoemSummary(poem)} Dé d'Inspiration ${die}${poem.minResult ? `, résultat minimum ${poem.minResult}` : ''} ; effets débloqués : ${unlockedText(poem)}.`,
            mention: `Poème rang ${poem.rank}${poem.minResult ? ` · min. ${poem.minResult}` : ''}`,
            classFeature: true
        }]
    };
}
