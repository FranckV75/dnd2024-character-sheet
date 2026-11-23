// =============================================================================
// CLASS-PROGRESSION.JS (règles) - Aptitudes de base de la classe et colonnes de sa table
//
//  - classProgression : aptitudes atteintes et à venir, colonnes de la table au niveau du
//    personnage (Rages 4, Dégâts de Rage +2…) avec le prochain changement.
//  - classSpellCounts : sorts mineurs et sorts préparés permis par la table (null si la classe n'en a pas).
//  - featuresAtLevel : aptitudes gagnées à un niveau (assistant « Passer au niveau N »).
// Données : js/data/class-progression.js. Fonctions pures.
// =============================================================================

import { CLASS_PROGRESSION } from '../data/class-progression.js';

/** Texte des lignes sans résumé propre (choix de la sous-classe, dons) */
function genericText(feature) {
    if (feature.kind === 'subclass') {
        return 'Choisissez votre sous-classe dans le menu « Sous-classe » en haut de la fiche : ses aptitudes s\'affichent plus bas.';
    }
    if (feature.kind === 'asi') {
        return 'Le don Amélioration de caractéristique ou un autre don auquel vous avez accès : à choisir dans le bloc Dons.';
    }
    if (feature.kind === 'epic') {
        return 'Un don de Faveur épique (ou un autre don auquel vous avez accès) : à choisir dans le bloc Dons.';
    }
    return '';
}

/** Aptitude prête à afficher : identifiant stable (repli mémorisé) et texte */
function withText(classSlug, feature, index) {
    return { ...feature, id: `${classSlug}.${feature.level}.${index}`, text: feature.text ?? genericText(feature) };
}

/**
 * @param {string} classSlug - ex. 'barbarian'
 * @param {number} level - 1 à 20
 * @returns {null | {
 *   columns: { name: string, value: string|null, next: { level: number, value: string } | null }[],
 *   reached: Object[], upcoming: Object[]
 * }}
 */
export function classProgression(classSlug, level) {
    const data = CLASS_PROGRESSION[classSlug];
    if (!data) return null;
    const lvl = Math.min(20, Math.max(1, Math.trunc(Number(level)) || 1));
    const columns = Object.entries(data.columns).map(([name, values]) => {
        const value = values[lvl - 1];
        const at = values.findIndex((v, i) => i >= lvl && v !== value);
        return { name, value, next: at === -1 ? null : { level: at + 1, value: values[at] } };
    });
    const features = data.features.map((feature, index) => withText(classSlug, feature, index));
    return {
        columns,
        reached: features.filter((feature) => feature.level <= lvl),
        upcoming: features.filter((feature) => feature.level > lvl)
    };
}

/**
 * Sorts mineurs et sorts préparés de la table de classe.
 * @param {string} classSlug
 * @param {number} level
 * @returns {{ cantrips: number|null, prepared: number|null }}
 */
export function classSpellCounts(classSlug, level) {
    const data = CLASS_PROGRESSION[classSlug];
    const lvl = Math.min(20, Math.max(1, Math.trunc(Number(level)) || 1));
    const read = (name) => {
        const value = data?.columns?.[name]?.[lvl - 1];
        return value === null || value === undefined ? null : Number(value);
    };
    return { cantrips: read('Sorts mineurs'), prepared: read('Sorts préparés') };
}

/**
 * Aptitudes de base gagnées en arrivant à un niveau.
 * @param {string} classSlug
 * @param {number} level
 * @returns {Object[]}
 */
export function featuresAtLevel(classSlug, level) {
    const data = CLASS_PROGRESSION[classSlug];
    if (!data) return [];
    return data.features
        .map((feature, index) => withText(classSlug, feature, index))
        .filter((feature) => feature.level === level);
}

/**
 * Sorts toujours préparés par la classe elle-même (hors du compte « Sorts préparés ») :
 * Druidique (Communication avec les animaux), Ennemi juré (Marque du chasseur), Châtiment de
 * paladin (Châtiment divin, niveau 2), Fidèle destrier (Appel de destrier, niveau 5),
 * Communication avec le protecteur (Contact avec les plans, niveau 9), Verbe de la création
 * (Barde 20 : Mot de pouvoir guérisseur et Mot de pouvoir mortel).
 * [niveau de classe, nom (data/spells.json), nom anglais, niveau du sort, capacité qui le donne,
 *  rappel affiché sous le sort (facultatif)]
 */
const SECOND_TARGET = 'Vous pouvez viser une seconde créature située à 3 m ou moins de la première cible.';
const CLASS_ALWAYS_PREPARED = Object.freeze({
    bard: [
        [20, 'Mot de pouvoir guérisseur', 'Power Word Heal', 9, 'Verbe de la création', SECOND_TARGET],
        [20, 'Mot de pouvoir mortel', 'Power Word Kill', 9, 'Verbe de la création', SECOND_TARGET]
    ],
    druid: [[1, 'Communication avec les animaux', 'Speak with Animals', 1, 'Druidique']],
    ranger: [[1, 'Marque du chasseur', "Hunter's Mark", 1, 'Ennemi juré',
        'Sans emplacement : cases « Ennemi juré » (onglet Caractéristiques & Combat), que le bouton « Lancer » propose.']],
    paladin: [
        [2, 'Châtiment divin', 'Divine Smite', 1, 'Châtiment de paladin'],
        [5, 'Appel de destrier', 'Find Steed', 2, 'Fidèle destrier']
    ],
    warlock: [[9, 'Contact avec les plans', 'Contact Other Plane', 5, 'Communication avec le protecteur',
        "Lancé sans emplacement, sa sauvegarde est réussie d'office."]]
});

const classLevelOf = (level) => Math.min(20, Math.max(1, Math.trunc(Number(level)) || 1));

/**
 * @param {string} classSlug
 * @param {number} level
 * @returns {string[]} noms des sorts
 */
export function classAlwaysPreparedSpells(classSlug, level) {
    return classGrantedSpells(classSlug, level).map(spell => spell.name);
}

/**
 * Les mêmes sorts, avec de quoi les afficher dans le bloc « Sorts de classe » du grimoire
 * (js/ui/spells/granted.js) : nom anglais (infobulle, lancers gratuits), niveau du sort, capacité.
 * @param {string} classSlug
 * @param {number} level - niveau de classe
 * @returns {Array<{ classLevel: number, name: string, vo: string, level: number, feature: string, note?: string }>}
 */
export function classGrantedSpells(classSlug, level) {
    const lvl = classLevelOf(level);
    const list = Object.hasOwn(CLASS_ALWAYS_PREPARED, classSlug) ? CLASS_ALWAYS_PREPARED[classSlug] : [];
    return list.filter(([from]) => lvl >= from)
        .map(([classLevel, name, vo, spellLevel, feature, note]) => ({
            classLevel, name, vo, level: spellLevel, feature, ...(note ? { note } : {})
        }));
}
