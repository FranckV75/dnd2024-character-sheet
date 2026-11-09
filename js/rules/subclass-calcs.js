// =============================================================================
// SUBCLASS-CALCS.JS (règles) - Petits calculs des capacités de sous-classe (lot 4,
// docs/SOUS_CLASSES.md) : fonctions pures, sans DOM.
//
//  - valeurs calculées par la fiche : Initiative (Traqueur d'ombre, L'Odysséen), tests de Charisme
//    de l'Errant féerique, Frappe à mains nues du Collège de la Danse, armes de corps à corps de
//    l'Ascendance divine (Charisme), arc long de la Voie herculéenne (Force) ;
//  - rappels près des valeurs (zones de featEffects) : maîtrises données par la sous-classe à cocher,
//    vitesses d'escalade et de nage, Avantage à l'Initiative ou aux jets contre la mort, coups
//    critiques élargis sous les armes ;
//  - nombres repris dans les textes du bloc « Sous-classe » : dé d'Inspiration bardique, DD des
//    capacités du Moine, etc.
// Règles du Player's Handbook 2024 anglais (chapitre des classes) ; Odyssée des Seigneurs Dragons
// pour L'Odysséen, L'Hoplite, l'Ascendance divine et la Voie herculéenne.
// Règle validée par Franck : une valeur saisie à la main n'est jamais modifiée.
// =============================================================================

import { isUnarmedStrike, weaponReach } from './weapons.js';

/** Signe devant un nombre : « +3 », « -1 » */
const signed = (n) => `${n >= 0 ? '+' : ''}${n}`;
const mod = (stats, id) => Number(stats?.mods?.[id]) || 0;
/** La sous-classe est la bonne, et son niveau est atteint */
const has = (stats, subclass, minLevel = 3) => stats?.subclass === subclass && (Number(stats.level) || 1) >= minLevel;

/**
 * Dé d'Inspiration bardique (PHB 2024, Barde : d6, d8 au niveau 5, d10 au niveau 10, d12 au niveau 15).
 * @param {number} level - niveau de Barde
 * @returns {string} « d6 »
 */
export function bardicInspirationDie(level) {
    return level >= 15 ? 'd12' : level >= 10 ? 'd10' : level >= 5 ? 'd8' : 'd6';
}

/**
 * DD des capacités du Moine (PHB 2024, Moine, « Monk's Focus » : 8 + Sagesse + bonus de maîtrise).
 * @param {{ pb: number, mods: Object }} stats
 * @returns {number}
 */
export function monkFocusDC(stats) {
    return 8 + (Number(stats?.pb) || 2) + mod(stats, 'wis');
}

/**
 * Dé d'Arts martiaux du Moine (PHB 2024 : d6, d8 au niveau 5, d10 au niveau 11, d12 au niveau 17).
 * @param {number} level
 * @returns {string} « d6 »
 */
export function martialArtsDieText(level) {
    return level >= 17 ? 'd12' : level >= 11 ? 'd10' : level >= 5 ? 'd8' : 'd6';
}

/**
 * DD fondé sur une caractéristique : 8 + modificateur + bonus de maîtrise.
 * @param {{ pb: number, mods: Object }} stats
 * @param {string} ability - 'dex', 'int'…
 */
export function abilityDC(stats, ability) {
    return 8 + (Number(stats?.pb) || 2) + mod(stats, ability);
}

/**
 * Bonus d'Initiative donnés par la sous-classe (ajoutés à l'Initiative calculée) :
 *  - Traqueur d'ombre (Rôdeur 3, « Dread Ambusher ») : modificateur de Sagesse ;
 *  - L'Odysséen (Roublard 13, Odyssée, « À toute épreuve ») : modificateur de Charisme.
 * Un modificateur nul ou négatif n'ajoute rien (« vous pouvez ajouter »).
 * @param {{ classSlug: string, subclass: string, level: number, mods: Object }} stats
 * @returns {Array<{ featId: string, featName: string, label: string, value: number }>}
 */
export function subclassInitiativeBonuses(stats) {
    const bonuses = [];
    if (stats?.classSlug === 'ranger' && has(stats, 'gloom_stalker') && mod(stats, 'wis') > 0) {
        bonuses.push({ featId: 'embusqueur_redoutable_bonus_d_initiative', featName: 'Embusqueur redoutable', label: 'Sag', value: mod(stats, 'wis') });
    }
    if (stats?.classSlug === 'rogue' && has(stats, 'the_odyssean', 13) && mod(stats, 'cha') > 0) {
        bonuses.push({ featId: 'a_toute_epreuve', featName: 'À toute épreuve', label: 'Cha', value: mod(stats, 'cha') });
    }
    return bonuses;
}

/**
 * Bonus de sous-classe à une compétence : Errant féerique (Rôdeur 3, « Otherworldly Glamour ») —
 * modificateur de Sagesse (minimum +1) à tous les tests de Charisme.
 * @param {{ classSlug: string, subclass: string, level: number, mods: Object }} stats
 * @param {string} ability - caractéristique de la compétence
 * @returns {number}
 */
export function subclassSkillBonus(stats, ability) {
    if (ability === 'cha' && stats?.classSlug === 'ranger' && has(stats, 'fey_wanderer')) return Math.max(1, mod(stats, 'wis'));
    return 0;
}

/** Ni armure ni bouclier portés (wornArmor de deriveCharacter) */
const unarmored = (stats) => {
    const worn = stats?.wornArmor ?? {};
    return !worn.light && !worn.medium && !worn.heavy && !worn.shield;
};

/**
 * Collège de la Danse (Barde 3, « Dazzling Footwork », Dégâts bardiques) : sans armure ni bouclier,
 * la Frappe à mains nues peut utiliser la Dextérité et infliger le dé d'Inspiration bardique +
 * Dextérité (contondant). La fiche le fait quand la Dextérité est au moins égale à la Force.
 * @param {Object} weapon
 * @param {Object} stats - deriveCharacter()
 * @returns {string} dé (« 1d8 ») ou '' si la capacité ne s'applique pas
 */
export function danceUnarmedDie(weapon, stats) {
    if (stats?.classSlug !== 'bard' || !has(stats, 'college_of_dance') || !isUnarmedStrike(weapon) || !unarmored(stats)) return '';
    if (mod(stats, 'dex') < mod(stats, 'str')) return '';
    return `1${bardicInspirationDie(Number(stats.level) || 1)}`;
}

/**
 * Caractéristique imposée par la sous-classe pour une arme ('' sinon) :
 *  - Collège de la Danse : 'dex' pour la Frappe à mains nues (danceUnarmedDie) ;
 *  - Ascendance divine (Ensorceleur 3, Odyssée, « La force en héritage ») : 'cha' pour les attaques
 *    au corps à corps, quand le Charisme dépasse la caractéristique habituelle de l'arme ;
 *  - Voie herculéenne (Barbare 6, Odyssée) : 'str' pour l'arc long, quand la Force dépasse la Dextérité.
 * @param {Object} weapon
 * @param {Object} stats - deriveCharacter()
 * @returns {''|'dex'|'cha'|'str'}
 */
export function subclassWeaponStat(weapon, stats) {
    if (danceUnarmedDie(weapon, stats)) return 'dex';
    if (stats?.classSlug === 'sorcerer' && has(stats, 'demigod_bloodline') && weaponReach(weapon).melee) {
        const prop = String(weapon?.prop ?? '').toLowerCase();
        const usual = Math.max(mod(stats, 'str'), prop.includes('finesse') ? mod(stats, 'dex') : -99);
        if (mod(stats, 'cha') > usual) return 'cha';
    }
    if (stats?.classSlug === 'barbarian' && has(stats, 'path_of_the_heretic', 6)) {
        const name = String(weapon?.name ?? '').replace(/<[^>]*>/g, '').toLowerCase();
        if (/\barc long\b|\blongbow\b/.test(name) && mod(stats, 'str') > mod(stats, 'dex')) return 'str';
    }
    return '';
}

/**
 * Coup critique élargi : 19 (Champion 3, L'Hoplite 15), 18 (Champion 15).
 * @param {Object} stats
 * @returns {{ min: number, featId: string, featName: string } | null}
 */
export function criticalRange(stats) {
    if (stats?.classSlug !== 'fighter') return null;
    if (has(stats, 'champion', 15)) return { min: 18, featId: 'critique_superieur', featName: 'Critique supérieur' };
    if (has(stats, 'champion')) return { min: 19, featId: 'critique_ameliore', featName: 'Critique amélioré' };
    if (has(stats, 'odyssean_champion', 15)) return { min: 19, featId: 'briseur_de_bouclier', featName: 'Briseur de bouclier' };
    return null;
}

/**
 * Maîtrises données par une sous-classe, à cocher par le joueur (la fiche ne coche rien) :
 * [sous-classe, niveau, champ de la fiche, zone de la fiche, capacité, ce qu'elle donne].
 */
const SUBCLASS_PROFICIENCIES = Object.freeze([
    ['gloom_stalker', 7, 'wis_save_prof', 'saves.wis', "Esprit d'acier", 'la maîtrise des sauvegardes de Sagesse (si vous l\'aviez déjà : Intelligence ou Charisme au choix)'],
    ['demigod_bloodline', 3, 'str_save_prof', 'saves.str', 'La force en héritage', 'la maîtrise des sauvegardes de Force'],
    ['path_of_the_heretic', 3, 'skill_prof_athletics', 'skills.athletics', 'Lutteur précoce', 'la maîtrise d\'Athlétisme'],
    ['warrior_of_mercy', 3, 'skill_prof_insight', 'skills.insight', 'Instruments de la miséricorde', 'la maîtrise de Perspicacité'],
    ['warrior_of_mercy', 3, 'skill_prof_medicine', 'skills.medicine', 'Instruments de la miséricorde', 'la maîtrise de Médecine'],
    ['prophecy_domain', 3, 'skill_prof_perception', 'skills.perception', 'Conscience étendue', 'la maîtrise de Perception']
]);

/** Sauvegardes possibles d'Esprit d'acier (Traqueur d'ombre 7) : [caractéristique, « de Sagesse »…] */
const STEEL_MIND_SAVES = Object.freeze({ wis: 'de Sagesse', int: "d'Intelligence", cha: 'de Charisme' });

/**
 * Ligne d'Esprit d'acier selon le choix enregistré (lot 7) : Intelligence ou Charisme à la place de la
 * Sagesse ; sans choix, la ligne d'origine (Sagesse).
 * @param {Object} derived - deriveCharacter() (subclassChoices)
 * @param {Array} row - ligne gloom_stalker de SUBCLASS_PROFICIENCIES
 * @returns {Array}
 */
function steelMindRow(derived, row) {
    const save = derived?.subclassChoices?.save;
    if (!save || save === 'wis' || !STEEL_MIND_SAVES[save]) return row;
    const [subclass, minLevel, , , name] = row;
    return [subclass, minLevel, `${save}_save_prof`, `saves.${save}`, name,
        `la maîtrise des sauvegardes ${STEEL_MIND_SAVES[save]} (choisie parce que la Sagesse était déjà maîtrisée)`];
}

/** Une maîtrise est cochée (l'Expertise compte comme maîtrise) */
function ticked(record, field) {
    if (record?.[field] === true) return true;
    return field.startsWith('skill_prof_') && record?.[field.replace('skill_prof_', 'skill_exp_')] === true;
}

/**
 * Notes des capacités de sous-classe du lot 4, rangées par zone (format FeatNote de feat-effects.js,
 * avec classFeature: true), fusionnées par classFeatureNotes (class-features.js).
 * @param {Object} derived - deriveCharacter(record)
 * @param {Object} record - fiche (cases de maîtrise)
 * @returns {Object<string, Object[]>}
 */
export function subclassNotes(derived, record = {}) {
    const zones = {};
    const add = (zone, featId, featName, text, extra = {}) => {
        (zones[zone] ??= []).push({ featId, featName, text, ...extra, classFeature: true });
    };
    const level = Number(derived?.level) || 1;
    // Initiative calculée
    for (const bonus of subclassInitiativeBonuses(derived)) {
        add('initiative', bonus.featId, bonus.featName,
            `${bonus.featName} : modificateur de ${bonus.label === 'Sag' ? 'Sagesse' : 'Charisme'} ${signed(bonus.value)} déjà compté dans l'Initiative.`,
            { value: bonus.value, applied: true });
    }
    // Avantage à l'Initiative
    if (derived?.classSlug === 'fighter' && has(derived, 'champion')) {
        add('initiative', 'athlete_remarquable', 'Athlète remarquable', 'Champion niveau 3 : Avantage aux jets d\'Initiative et aux tests de Force (Athlétisme).');
    }
    if (derived?.classSlug === 'rogue' && has(derived, 'assassin')) {
        add('initiative', 'assassinat', 'Assassinat', 'Assassin niveau 3 : Avantage aux jets d\'Initiative.');
    }
    // Compétences de Charisme (Errant féerique)
    const glamour = subclassSkillBonus(derived, 'cha');
    if (glamour > 0) {
        for (const id of ['deception', 'intimidation', 'performance', 'persuasion']) {
            add(`skills.${id}`, 'charme_surnaturel', 'Charme surnaturel',
                `Errant féerique niveau 3 : ${signed(glamour)} (modificateur de Sagesse, minimum +1) déjà compté, comme à tous vos tests de Charisme.`,
                { value: glamour, applied: true });
        }
    }
    // Maîtrises à cocher (Esprit d'acier : sauvegarde choisie dans le menu « save », Sagesse par défaut)
    for (const row of SUBCLASS_PROFICIENCIES) {
        const [subclass, minLevel, field, zone, name, gives] = row[0] === 'gloom_stalker' ? steelMindRow(derived, row) : row;
        if (!has(derived, subclass, minLevel) || ticked(record, field)) continue;
        add(zone, subclass, name, `${name} (niveau ${minLevel}) vous donne ${gives} : case à cocher vous-même, la fiche ne coche rien.`, { check: true });
    }
    // Vitesses
    if (derived?.classSlug === 'rogue' && has(derived, 'thief')) {
        add('speed', 'monte_en_l_air', 'Monte-en-l\'air', 'Voleur niveau 3 : vitesse d\'escalade égale à votre Vitesse ; vos sauts se calculent avec la Dextérité.');
    }
    if (derived?.classSlug === 'druid' && has(derived, 'circle_of_the_sea', 6)) {
        add('speed', 'affinite_aquatique', 'Affinité aquatique', 'Cercle de la Mer niveau 6 : vitesse de nage égale à votre Vitesse.');
    }
    if (derived?.classSlug === 'paladin' && has(derived, 'oath_of_glory', 7)) {
        add('speed', 'aura_d_alacrite', 'Aura d\'alacrité',
            "Serment de Gloire niveau 7 : +3 m. La Vitesse saisie n'est pas modifiée : ajoutez-les vous-même s'ils n'y sont pas déjà.",
            { value: 3, manual: true });
    }
    // Jets contre la mort
    if (derived?.classSlug === 'fighter' && has(derived, 'champion', 18)) {
        add('deathSaves', 'survivant', 'Survivant',
            `Champion niveau 18 : Avantage aux jets contre la mort, et 18 à 20 comptent comme un 20. Ensanglanté avec au moins 1 PV : ${5 + mod(derived, 'con')} PV (5 + Con) au début de chaque tour.`);
    }
    return zones;
}

/**
 * Notes de sous-classe sous une arme (coup critique élargi). Pas pour les armes vides.
 * @param {Object} weapon
 * @param {Object} derived
 * @returns {Object[]} FeatNote
 */
export function subclassWeaponNotes(weapon, derived) {
    const crit = criticalRange(derived);
    if (!crit) return [];
    return [{
        featId: crit.featId, featName: crit.featName, classFeature: true, value: crit.min,
        text: `Coup critique sur ${crit.min}${crit.min === 18 ? ' à 20' : ' ou 20'}${isUnarmedStrike(weapon) ? ' (Frappe à mains nues comprise)' : ''}.`
            + (crit.featId === 'briseur_de_bouclier' ? ' Corps à corps : la cible perd son bouclier, ou subit 1d6 dégâts de plus.' : '')
    }];
}
