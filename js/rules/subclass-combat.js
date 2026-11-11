// =============================================================================
// SUBCLASS-COMBAT.JS (règles) - Combat des sous-classes (lot 5, docs/etudes/SOUS_CLASSES.md) :
// fonctions pures, sans DOM.
//
//  - dégâts des boutons de sous-classe du tableau des armes (clés de combat_buffs ouvertes par
//    SUBCLASS_BUFFS, js/rules/weapons.js) : Frénésie, Frappe effroyable, Frappes effroyables,
//    Goût du sang, dé de supériorité, Frappe psionique ;
//  - dés des ressources : dé de supériorité, dés d'énergie psionique ;
//  - rappels sous les armes (Rossée de racines, Maître de la lance) ;
//  - Résistances et immunités données par la sous-classe : repères près de la CA (zone armorClass
//    de featEffects), avec la condition quand elle existe (Rage, Forme stellaire…).
// Règles du Player's Handbook 2024 anglais (chapitre des classes) ; Odyssée des Seigneurs Dragons
// pour la Voie herculéenne, la Guerrière amazone et L'Hoplite.
// Règle validée par Franck : une valeur saisie à la main n'est jamais modifiée.
// =============================================================================

import { isUnarmedStrike, weaponReach } from './weapons.js';
import { getRageBonus } from './logic.js';
import { MANEUVERS } from '../data/maneuvers.js';
import { LAND_TYPES, DAMAGE_TYPES } from '../data/subclass-choices.js';
import { signed } from './numbers.js';

const mod = (stats, id) => Number(stats?.mods?.[id]) || 0;
const levelOf = (stats) => Number(stats?.level) || 1;
/** La sous-classe est la bonne, et son niveau est atteint */
const has = (stats, subclass, minLevel = 3) => stats?.subclass === subclass && levelOf(stats) >= minLevel;

/**
 * Dé de supériorité du Maître de guerre (PHB 2024) : d8, d10 au niveau 10, d12 au niveau 18.
 * @param {number} level - niveau de Guerrier
 * @returns {string} « d8 »
 */
export function superiorityDie(level) {
    return level >= 18 ? 'd12' : level >= 10 ? 'd10' : 'd8';
}

/** Nombre de dés de supériorité : 4, 5 au niveau 7, 6 au niveau 15 */
export function superiorityDiceCount(level) {
    return level >= 15 ? 6 : level >= 7 ? 5 : 4;
}

/**
 * DD des manœuvres : 8 + Force ou Dextérité (la meilleure) + maîtrise.
 * @param {{ mods: Object, pb: number }} stats
 * @returns {number}
 */
export function maneuverDC(stats) {
    return 8 + Math.max(mod(stats, 'str'), mod(stats, 'dex')) + (Number(stats?.pb) || 2);
}

/**
 * Nombre de manœuvres connues (PHB 2024, p. 93) : 3 au niveau 3, puis 2 de plus aux niveaux 7, 10
 * et 15 (5, 7, 9).
 * @param {number} level - niveau de Guerrier
 * @returns {number}
 */
export function maneuversKnown(level) {
    if (level < 3) return 0;
    return level >= 15 ? 9 : level >= 10 ? 7 : level >= 7 ? 5 : 3;
}

/**
 * Manœuvres choisies (lot 7, menus « maneuver1 »… de subclass_choices, déjà validés par
 * deriveCharacter : sans doublon, menus atteints seulement), dans l'ordre des menus.
 * @param {Object} derived - deriveCharacter() (subclassChoices)
 * @returns {Object[]} entrées de MANEUVERS
 */
export function knownManeuvers(derived) {
    if (!has(derived, 'battle_master')) return [];
    return Object.entries(derived.subclassChoices ?? {})
        .filter(([key]) => /^maneuver\d+$/.test(key))
        .sort(([a], [b]) => Number(a.slice(8)) - Number(b.slice(8)))
        .map(([, id]) => MANEUVERS.find(m => m.id === id))
        .filter(Boolean);
}

/**
 * Chiffres d'une manœuvre pour le personnage : dé, DD, Parade, Regain.
 * @param {Object} maneuver - entrée de MANEUVERS
 * @param {Object} derived - deriveCharacter()
 * @returns {string} « 1d8 ; DD 13 (Force) », « 1d8 + 3 dégâts en moins »…
 */
export function maneuverNumbers(maneuver, derived) {
    const die = `1${superiorityDie(levelOf(derived))}`;
    const plus = (n) => (n < 0 ? ` - ${-n}` : ` + ${n}`);
    if (maneuver.id === 'parry') return `${die}${plus(Math.max(mod(derived, 'str'), mod(derived, 'dex')))} dégâts en moins`;
    if (maneuver.id === 'rally') return `${die}${plus(Math.floor(levelOf(derived) / 2))} PV temporaires`;
    return maneuver.save ? `${die} ; DD ${maneuverDC(derived)} (${maneuver.save === 'str' ? 'Force' : 'Sagesse'})` : die;
}

/**
 * Dés d'énergie psionique (Guerrier psionique et Âme acérée, même table du PHB 2024) :
 * niveau 3 : 4 d6 ; 5 : 6 d8 ; 9 : 8 d8 ; 11 : 8 d10 ; 13 : 10 d10 ; 17 : 12 d12.
 * @param {number} level - niveau de Guerrier ou de Roublard
 * @returns {{ count: number, die: string }}
 */
export function psionicDice(level) {
    if (level >= 17) return { count: 12, die: 'd12' };
    if (level >= 13) return { count: 10, die: 'd10' };
    if (level >= 11) return { count: 8, die: 'd10' };
    if (level >= 9) return { count: 8, die: 'd8' };
    if (level >= 5) return { count: 6, die: 'd8' };
    return { count: 4, die: 'd6' };
}

/** Frénésie : autant de d6 que le bonus de dégâts de Rage */
export const frenzyDice = (level) => `${getRageBonus(level)}d6`;
/** Frappe effroyable du Traqueur d'ombre : 2d6, 2d8 au niveau 11 (Rafale du traqueur) */
export const dreadfulStrikeDice = (level) => (level >= 11 ? '2d8' : '2d6');
/** Frappes effroyables de l'Errant féerique : 1d4, 1d6 au niveau 11 */
export const feyStrikesDie = (level) => (level >= 11 ? '1d6' : '1d4');

/**
 * Dégâts en plus des boutons de sous-classe allumés, pour une arme (computeWeapon).
 * Les boutons ne sont proposés qu'à la bonne sous-classe (effectiveBuffs), ce qui est revérifié ici.
 * @param {Object} weapon - ligne du tableau
 * @param {{ subclass: string, level: number, mods: Object }} stats - deriveCharacter()
 * @param {Object} buffs - effectiveBuffs()
 * @param {string} stat - caractéristique de l'attaque (« FOR », « DEX »…)
 * @returns {Array<{ die: string, type: string }>}
 */
export function subclassBuffDamage(weapon, stats, buffs = {}, stat = '') {
    const out = [];
    const level = levelOf(stats);
    const realWeapon = !isUnarmedStrike(weapon);
    // Frénésie (Berserker) : Témérité pendant la Rage, attaque de Force, premier coup du tour
    if (buffs.frenzy && buffs.rage && stat === 'FOR' && has(stats, 'path_of_the_berserker')) {
        out.push({ die: frenzyDice(level), type: 'Frénésie 1/tour' });
    }
    // Manœuvres : attaque avec une arme ou une attaque à mains nues (PHB 2024, Trip Attack…)
    if (buffs.superiority && has(stats, 'battle_master')) out.push({ die: `1${superiorityDie(level)}`, type: 'Supériorité' });
    if (!realWeapon) return out;
    if (buffs.dreadfulStrike && has(stats, 'gloom_stalker')) {
        out.push({ die: dreadfulStrikeDice(level), type: 'Psychique 1/tour' });
    }
    if (buffs.feyStrikes && has(stats, 'fey_wanderer')) out.push({ die: feyStrikesDie(level), type: 'Psychique' });
    if (buffs.colossusSlayer && has(stats, 'hunter')) out.push({ die: '1d8', type: 'Goût du sang 1/tour' });
    if (buffs.psionicStrike && has(stats, 'psi_warrior')) {
        const int = mod(stats, 'int');
        out.push({ die: `1${psionicDice(level).die}${int ? signed(int) : ''}`, type: 'Force 1/tour' });
    }
    return out;
}

/** Arme de corps à corps Lourde ou Polyvalente (Rossée de racines) */
function heavyOrVersatile(weapon) {
    const props = String(weapon?.prop ?? '').toLowerCase().split(/[,;]/).map(p => p.trim());
    return props.some(p => p.startsWith('lourde') || p.startsWith('polyvalente'));
}

/** Lance, trident ou javeline (Maître de la lance, L'Hoplite) ; pas la Lance d'arçon (déjà 1d10, Allonge) */
const SPEAR = /^(lance|trident|javeline)\b/;
const fold = (text) => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2018\u2019]/g, "'").trim().toLowerCase();
const isSpear = (weapon) => {
    const name = fold(weapon?.name);
    return SPEAR.test(name) && !name.startsWith("lance d'arcon");
};

/**
 * Rappels sous une arme (zone weapon:<i> de featEffects).
 * @param {Object} weapon
 * @param {Object} derived - deriveCharacter()
 * @returns {Array<{ featId: string, featName: string, text: string, classFeature: true }>}
 */
export function subclassCombatWeaponNotes(weapon, derived) {
    const notes = [];
    const add = (featId, featName, text) => notes.push({ featId, featName, text, classFeature: true });
    if (has(derived, 'battle_master')) {
        // Manœuvres connues jouées avec une attaque (lot 7) : rappelées sous chaque arme
        const melee = weaponReach(weapon).melee;
        const withAttack = knownManeuvers(derived)
            .filter(m => ['hit', 'miss', 'attack'].includes(m.timing) || (m.timing === 'bonus' && m.damage === 'self'))
            .filter(m => melee || !['sweeping_attack', 'lunging_attack', 'feinting_attack'].includes(m.id))
            .map(m => `${m.name}${m.save ? ` (${m.save === 'str' ? 'For' : 'Sag'})` : ''}`);
        add('dd_des_man_uvres', 'Manœuvres', `Dé de supériorité : ${superiorityDie(levelOf(derived))} ; DD des manœuvres : ${maneuverDC(derived)}.`
            + (withAttack.length ? ` Connues : ${withAttack.join(', ')}.` : ''));
    }
    if (has(derived, 'path_of_the_world_tree', 10) && weaponReach(weapon).melee && !isUnarmedStrike(weapon) && heavyOrVersatile(weapon)) {
        add('racines_percutantes', 'Rossée de racines', 'À votre tour : allonge +3 m, et Poussée ou Renversement en plus de la botte de l\'arme.');
    }
    if (has(derived, 'odyssean_champion', 7) && isSpear(weapon)) {
        add('maitre_de_la_lance', 'Maître de la lance', 'Dé de dégâts d8 (d10 à deux mains) et allonge 3 m : à régler dans la configuration de l\'arme. Action Bonus après l\'attaque : talon de l\'arme, 1d4 contondants.');
    }
    return notes;
}

/**
 * Résistances et immunités de la sous-classe : [sous-classe, niveau, id de la capacité, nom,
 * mention courte, texte, condition (clé de combat_buffs qui l'allume, ou { choice } : case à cocher
 * de subclass_choices qui l'allume, comme « starry_form » ; facultative), choix (lot 7,
 * facultatif : { key, value } de subclass_choices ; un AUTRE choix enregistré retire le repère)].
 * Sans condition, la Résistance est permanente (ou dépend d'un choix noté dans le texte).
 */
export const SUBCLASS_DEFENSES = Object.freeze([
    ['war_domain', 17, 'avatar_de_bataille', 'Avatar de la bataille', 'Résistance C/P/T',
        'Résistance aux dégâts contondants, perforants et tranchants.'],
    ['circle_of_the_land', 10, 'protection_de_la_nature', 'Protégé de dame Nature', 'Résistance (terre)',
        'Immunité à l\'état Empoisonné ; Résistance selon la terre : aride feu, polaire froid, tempérée foudre, tropicale poison.'],
    ['psi_warrior', 10, 'esprit_protege', 'Esprit blindé', 'Résistance psychique',
        'Résistance aux dégâts psychiques. Charmé ou Effrayé au début du tour : un dé psionique y met fin.'],
    ['aberrant_sorcery', 6, 'defenses_psychiques', 'Défenses psychiques', 'Résistance psychique',
        'Résistance aux dégâts psychiques ; Avantage aux sauvegardes contre les états Charmé et Effrayé.'],
    ['great_old_one_patron', 10, 'bouclier_mental', 'Bouclier mental', 'Résistance psychique',
        'Résistance aux dégâts psychiques ; qui vous en inflige subit les mêmes dégâts.'],
    ['abjurer', 14, 'resistance_aux_sorts', 'Résistance aux sorts', 'Résistance aux sorts',
        'Avantage aux sauvegardes contre les sorts et Résistance aux dégâts des sorts.'],
    ['oath_of_the_ancients', 7, 'aura_de_garde', 'Aura de garde', 'Résistance (aura)',
        'Vous et vos alliés dans votre Aura de protection : Résistance aux dégâts nécrotiques, psychiques et radiants.'],
    ['fiend_patron', 10, 'resilience_fielonne', 'Résistance fiélonne', 'Résistance au choix',
        'Résistance à un type de dégâts (sauf force) choisi à la fin de chaque repos court ou long.'],
    ['celestial_patron', 6, 'ame_radieuse', 'Âme radiante', 'Résistance radiante',
        'Résistance aux dégâts radiants.'],
    ['draconic_sorcery', 6, 'affinite_elementaire', 'Affinité élémentaire', 'Résistance (affinité)',
        'Résistance au type choisi avec Affinité élémentaire : acide, froid, feu, foudre ou poison.'],
    ['path_of_the_wild_heart', 3, 'rage_sauvage', 'Rage du prédateur (Ours)', 'Ours (Rage)',
        'Si vous choisissez l\'Ours en entrant en Rage : Résistance à tous les dégâts sauf force, nécrotiques, psychiques et radiants.', 'rage',
        { key: 'rage', value: 'bear' }],
    ['path_of_the_heretic', 10, 'rage_d_hercule', 'Rage d\'Hercule', 'Immunité poison (Rage)',
        'Pendant la Rage : immunité aux dégâts de poison et à l\'état Effrayé.', 'rage'],
    ['path_of_the_berserker', 6, 'rage_aveugle', 'Rage aveugle', 'Charme et peur (Rage)',
        'Pendant la Rage : immunité aux états Charmé et Effrayé.', 'rage'],
    ['circle_of_the_stars', 14, 'plein_d_etoiles', 'Plénitude stellaire', 'Résistance C/P/T (forme)',
        'En Forme stellaire : Résistance aux dégâts contondants, perforants et tranchants.', { choice: 'starry_form' }],
    ['circle_of_the_sea', 10, 'ne_de_la_tempete', 'Enfant de la tempête', 'Résistance (Courroux)',
        'Tant que le Courroux des mers est actif : Résistance aux dégâts de froid, de foudre et de tonnerre, et vol.'],
    ['amazon_warrior', 3, 'cri_de_guerre', 'Cri de guerre', 'Résistance C/P/T (Cri)',
        'Pendant le Cri de guerre : Résistance aux dégâts contondants, perforants et tranchants.'],
    ['warrior_of_the_elements', 17, 'incarnation_elementaire', 'Incarnation élémentaire', 'Résistance (Harmonisation)',
        'Harmonisation élémentaire active : Résistance à l\'acide, au froid, au feu, à la foudre ou au tonnerre (au choix à chaque tour).']
]);

/** « Résistance … » d'un type de dégâts (DAMAGE_TYPES) : « au feu », « aux dégâts contondants » */
const resistanceTo = (id) => DAMAGE_TYPES.find(([type]) => type === id)?.[2] ?? '';

/**
 * Résistance dont le type dépend d'un choix de sous-classe (lot 7) : Protégé de dame Nature (terre
 * du Cercle de la Terre), Affinité élémentaire, Résistance fiélonne.
 * @param {string} subclass
 * @param {Object<string, string>} choice - derived.subclassChoices (choix déjà validés)
 * @returns {{ featId: string, mention: string, text: string } | null} null sans choix : la ligne
 *   générique de SUBCLASS_DEFENSES reste
 */
export function choiceDefense(subclass, choice = {}) {
    if (subclass === 'circle_of_the_land') {
        const land = LAND_TYPES.find(([id]) => id === choice?.land);
        if (!land) return null;
        const to = resistanceTo(land[2]);
        const name = land[1].toLowerCase();
        return {
            featId: 'protection_de_la_nature', mention: `Résistance ${to} (terre ${name})`,
            text: `Immunité à l'état Empoisonné ; Résistance ${to} tant que la terre ${name} est choisie.`
        };
    }
    if (subclass === 'draconic_sorcery' && resistanceTo(choice?.element)) {
        const to = resistanceTo(choice.element);
        return { featId: 'affinite_elementaire', mention: `Résistance ${to}`, text: `Résistance ${to} (type choisi avec Affinité élémentaire).` };
    }
    if (subclass === 'fiend_patron' && resistanceTo(choice?.resistance)) {
        const [, label] = DAMAGE_TYPES.find(([id]) => id === choice.resistance);
        return {
            featId: 'resilience_fielonne', mention: `Résistance : ${label.toLowerCase()}`,
            text: `Résistance ${resistanceTo(choice.resistance)}, choisie à la fin du dernier repos ; un autre type (sauf force) peut être choisi à la fin de chaque repos court ou long.`
        };
    }
    return null;
}

/** Condition d'une défense remplie : bouton de combat_buffs allumé, ou case de subclass_choices cochée */
const conditionMet = (buff, derived, record) => (typeof buff === 'string'
    ? record?.combat_buffs?.[buff] === true
    : derived?.subclassChoices?.[buff.choice] === 'on');

/**
 * Repères de Résistance près de la CA (zone armorClass). Une défense liée à la Rage est grisée
 * (inactive) tant que le bouton Rage est éteint ; Plénitude stellaire, tant que « En Forme stellaire »
 * n'est pas cochée (bloc Sous-classe). Un type de dégâts choisi (choiceDefense) remplace
 * la mention et le texte génériques de la ligne.
 * @param {Object} derived - deriveCharacter()
 * @param {Object} [record] - fiche (combat_buffs)
 * @returns {Object} { armorClass: [...] } ou {}
 */
export function subclassDefenseNotes(derived, record = {}) {
    const chosen = choiceDefense(derived?.subclass, derived?.subclassChoices ?? {});
    const notes = SUBCLASS_DEFENSES
        .filter(([subclass, level]) => has(derived, subclass, level))
        .filter(([, , , , , , , needs]) => !needs || !derived.subclassChoices?.[needs.key]
            || derived.subclassChoices[needs.key] === needs.value)
        .map(([, , featId, featName, mention, text, buff]) => ({
            featId, featName, text, mention, classFeature: true,
            ...(chosen?.featId === featId ? { mention: chosen.mention, text: chosen.text } : {}),
            ...(buff && !conditionMet(buff, derived, record) ? { inactive: true } : {})
        }));
    return notes.length ? { armorClass: notes } : {};
}
