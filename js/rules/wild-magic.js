// =============================================================================
// WILD-MAGIC.JS (règles) - Sorcellerie sauvage (PHB 2024, p. 149-151), lot 7
//
// Tirages de la Bouffée de Sorcellerie sauvage : d20 après un sort d'Ensorceleur lancé avec un
// emplacement (Bouffée sur 20), puis d100 sur la table du manuel. La fiche donne le résultat et
// la ligne de la table (01-04 … 97-00), sans recopier les effets : ils se lisent dans le manuel.
// Chaos contrôlé (niveau 14) : deux tirages sur la table, le joueur garde celui qu'il veut.
// Rien n'est enregistré. Le hasard est INJECTÉ (rng : fonction qui rend un nombre dans [0, 1[,
// le hasard du navigateur est passé par js/ui/wild-magic.js) : les règles restent pures et testables.
// =============================================================================

import { subclassCounters } from './subclass-uses.js';

export const WILD_MAGIC = 'wild_magic_sorcery';
/** Référence de la table dans le manuel */
export const SURGE_TABLE = 'table de Bouffée de Sorcellerie sauvage (Wild Magic Surge, PHB 2024 p. 150-151)';

/**
 * Lancer d'un dé.
 * @param {number} faces
 * @param {() => number} rng - nombre dans [0, 1[ (hasard du navigateur, passé par l'interface)
 * @returns {number} entre 1 et faces
 */
export function rollDie(faces, rng) {
    if (typeof rng !== 'function') throw new TypeError('rollDie : source de hasard manquante');
    const n = Math.max(1, Math.trunc(Number(faces)) || 1);
    const r = Number(rng());
    const unit = Number.isFinite(r) ? Math.min(Math.max(r, 0), 1 - Number.EPSILON) : 0;
    return Math.min(n, 1 + Math.floor(unit * n));
}

/** « 01 », « 48 », « 00 » (100 s'écrit 00 dans la table) */
const pad = (n) => (n === 100 ? '00' : String(n).padStart(2, '0'));

/**
 * Ligne de la table pour un résultat de d100 : 25 lignes de 4 numéros.
 * @param {number} value - 1 à 100
 * @returns {{ value: number, row: number, range: string }} row : 1 à 25 ; range : « 45-48 », « 97-00 »
 */
export function surgeRow(value) {
    const v = Math.min(100, Math.max(1, Math.trunc(Number(value)) || 1));
    const row = Math.ceil(v / 4);
    return { value: v, row, range: `${pad(4 * row - 3)}-${pad(4 * row)}` };
}

/**
 * Tirage sur la table (bouton d100, ou après un 20 au d20).
 * @param {number} level - niveau d'Ensorceleur
 * @param {() => number} rng
 * @returns {{ rolls: Array<{ value: number, row: number, range: string }>, keepOne: boolean, tamed: boolean }}
 *   rolls : deux tirages à partir du niveau 14 (Chaos contrôlé, égaux possibles : pas de relance) ;
 *   keepOne : le joueur garde l'un des deux ; tamed : Bouffée domptée connue (niveau 18)
 */
export function surgeTableRoll(level, rng) {
    const lvl = Number(level) || 1;
    const count = lvl >= 14 ? 2 : 1;
    return {
        rolls: Array.from({ length: count }, () => surgeRow(rollDie(100, rng))),
        keepOne: lvl >= 14,
        tamed: lvl >= 18
    };
}

/**
 * Jet de Bouffée après un sort d'Ensorceleur avec emplacement : d20, et sur 20 la table.
 * @param {number} level - niveau d'Ensorceleur
 * @param {() => number} rng
 * @returns {{ d20: number, surge: boolean, table: ReturnType<typeof surgeTableRoll> | null }}
 */
export function surgeCheck(level, rng) {
    const d20 = rollDie(20, rng);
    const surge = d20 === 20;
    return { d20, surge, table: surge ? surgeTableRoll(level, rng) : null };
}

/** « d100 : 47 → ligne 45-48 de la table … » ou, deux tirages, « … : gardez celle de votre choix. » */
function tableText(table) {
    const [first, second] = table.rolls;
    if (!second) return `d100 : ${first.value} → ligne ${first.range} de la ${SURGE_TABLE}.`;
    const lines = first.range === second.range ? `ligne ${first.range} (deux fois)` : `lignes ${first.range} ou ${second.range}`;
    return `d100 : ${first.value} et ${second.value} → ${lines} de la ${SURGE_TABLE} : gardez celle de votre choix (Chaos contrôlé).`;
}

/**
 * Phrase du résultat affichée sous les boutons.
 * @param {{ d20?: number, surge?: boolean, table?: Object|null, rolls?: Array }} result - surgeCheck()
 *   ou surgeTableRoll()
 * @returns {string}
 */
export function surgeResultText(result) {
    if (!result) return '';
    if (Array.isArray(result.rolls)) return tableText(result);
    if (!result.surge) return `d20 : ${result.d20} → pas de Bouffée (il faut un 20).`;
    return `d20 : 20 → Bouffée ! ${tableText(result.table)}`;
}

/** Sorcellerie sauvage atteinte (niveau 3 ou plus) */
const isWildMagic = (derived) => derived?.subclass === WILD_MAGIC && (Number(derived.level) || 1) >= 3;

/**
 * Bloc des tirages de l'onglet Combat (js/ui/wild-magic.js) : rien hors de la Sorcellerie sauvage.
 * Rappels : Bouffée automatique en attente quand la case Marée du chaos est cochée ;
 * Bouffée domptée disponible (niveau 18) tant que sa case n'est pas cochée.
 * @param {Object} character
 * @param {Object} derived - deriveCharacter(character)
 * @returns {{ level: number, keepTwo: boolean, reminders: string[] } | null}
 */
export function wildMagicPanel(character, derived) {
    if (!isWildMagic(derived)) return null;
    const level = Number(derived.level) || 1;
    const counters = subclassCounters(character, derived);
    const used = (feature) => (counters.find(c => c.feature === feature)?.used ?? 0) > 0;
    const reminders = [];
    if (used('marees_du_chaos')) {
        reminders.push('Marée du chaos utilisée : au prochain sort d\'Ensorceleur lancé avec un emplacement, Bouffée automatique (touchez « Table (d100) », sans le d20), puis décochez Marée du chaos.');
    }
    if (level >= 18 && counters.some(c => c.feature === 'deferlante_domptee') && !used('deferlante_domptee')) {
        reminders.push('Bouffée domptée disponible : au lieu de tirer, choisissez une ligne de la table (sauf 97-00), puis cochez sa case.');
    }
    return { level, keepTwo: level >= 14, reminders };
}

/**
 * Repère près des points de sorcellerie (zone classResource, format FeatNote avec classFeature: true),
 * fusionné par classFeatureNotes (class-features.js) : Comme par hasard, niveau 6.
 * @param {Object} derived - deriveCharacter()
 * @returns {Object<string, Object[]>}
 */
export function wildMagicNotes(derived = {}) {
    if (!isWildMagic(derived) || (Number(derived.level) || 1) < 6) return {};
    return {
        classResource: [{
            featId: 'influence_sur_la_chance', featName: 'Comme par hasard',
            text: 'Réaction, juste après le d20 d\'un test d20 d\'une autre créature que vous voyez : 1 point de sorcellerie (cochez une case) → lancez 1d4 et ajoutez-le ou retirez-le au résultat.',
            mention: 'Hasard ±1d4',
            classFeature: true
        }]
    };
}
