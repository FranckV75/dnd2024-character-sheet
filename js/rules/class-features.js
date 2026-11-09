// =============================================================================
// CLASS-FEATURES.JS (règles) - Capacités de classe et de sous-classe qui changent un nombre
// calculé par la fiche (fonctions pures, sans DOM)
//  - Aura de protection (Paladin niveau 6) : + mod. de Charisme (minimum +1) aux sauvegardes ;
//  - Touche-à-tout (Barde niveau 2) : + moitié du bonus de maîtrise aux compétences non maîtrisées ;
//  - Défense sans armure de sous-classe : Résilience draconique (Ensorceleur, Sorcellerie
//    draconique, niveau 3) et Jeu de jambes éblouissant (Barde, Collège de la Danse, niveau 3) ;
//  - maîtrise des armes : bonus de maîtrise à l'attaque seulement avec une arme maîtrisée.
// Textes vérifiés dans le Player's Handbook 2024 anglais (pages citées).
// Règle validée par Franck : une valeur saisie à la main n'est jamais modifiée ; ces capacités ne
// changent que des valeurs calculées (sauvegardes, compétences, CA, attaque), avec une explication.
// =============================================================================

import { DD_RULES } from '../data/dd-rules.js';
import { ABILITY_IDS, SKILLS } from '../data/constants.js';
import { parseWeaponConfig } from './logic.js';
import { isUnarmedStrike } from './weapons.js';
import { subclassNotes } from './subclass-calcs.js';
import { subclassDefenseNotes } from './subclass-combat.js';

/** Texte brut (les anciennes sauvegardes peuvent contenir du HTML), sans accents ni majuscules */
function fold(value) {
    return String(value ?? '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[’']/g, "'")
        .replace(/\s+/g, ' ')
        .toLowerCase().trim();
}

const signed = (n) => `${n >= 0 ? '+' : ''}${n}`;

// -----------------------------------------------------------------------------
// Sous-classe
// -----------------------------------------------------------------------------

/**
 * Mots qui suffisent à reconnaître une sous-classe saisie librement (anciennes fiches :
 * « Draconique », « Danse ») ; seulement pour les sous-classes dont la fiche calcule quelque chose.
 */
const SUBCLASS_KEYWORDS = {
    draconic_sorcery: { class: 'sorcerer', pattern: /draconi/ },
    // « danse », pas « dans » (une saisie libre contenant « dans » n'est pas la Danse)
    college_of_dance: { class: 'bard', pattern: /\bdanse\b|\bdance\b/ },
    college_of_valor: { class: 'bard', pattern: /vaillance|valou?r/ }
};

/**
 * Identifiant de la sous-classe (clé de DD_RULES.subclasses) à partir du texte enregistré :
 * nom français du menu (« Sorcellerie Draconique »), nom anglais ou identifiant, sans tenir compte
 * des accents, des majuscules ni du HTML des anciennes sauvegardes.
 * @param {string} text - character.char_subclass
 * @param {string} [classSlug] - classe du personnage : une sous-classe d'une autre classe est ignorée
 * @returns {string} ex. 'draconic_sorcery' ; '' si inconnue
 */
export function subclassId(text, classSlug = '') {
    const clean = fold(text);
    if (!clean) return '';
    const fits = (sub) => !classSlug || sub.class === classSlug;
    for (const [slug, sub] of Object.entries(DD_RULES.subclasses)) {
        if (fits(sub) && [slug.replace(/_/g, ' '), sub.name, sub.nameFr].some(name => fold(name) === clean.replace(/_/g, ' '))) return slug;
    }
    for (const [slug, rule] of Object.entries(SUBCLASS_KEYWORDS)) {
        if ((!classSlug || rule.class === classSlug) && rule.pattern.test(clean)) return slug;
    }
    return '';
}

// -----------------------------------------------------------------------------
// Sauvegardes et compétences
// -----------------------------------------------------------------------------

/**
 * Aura de protection (PHB 2024, Paladin niveau 6 « Aura of Protection ») : vous et vos alliés
 * dans l'aura ajoutez votre modificateur de Charisme (minimum +1) à vos jets de sauvegarde. L'aura
 * est inactive tant que vous êtes Neutralisé (la fiche ne le sait pas : rappel sous la sauvegarde).
 * @param {{ classSlug: string, level: number, mods: Object }} stats
 * @returns {number} bonus (0 si la capacité n'est pas atteinte)
 */
export function auraOfProtectionBonus({ classSlug, level, mods }) {
    if (classSlug !== 'paladin' || level < 6) return 0;
    return Math.max(1, Number(mods?.cha) || 0);
}

/**
 * Touche-à-tout (PHB 2024, Barde niveau 2 « Jack of All Trades ») : moitié du bonus de
 * maîtrise (arrondie à l'inférieur) aux tests de caractéristique qui utilisent une compétence que
 * vous ne maîtrisez pas. Pas à l'Initiative (en 2024, ce n'est pas un test de compétence).
 * @param {{ classSlug: string, level: number, pb: number }} stats
 * @returns {number} bonus (0 si la capacité n'est pas atteinte)
 */
export function jackOfAllTradesBonus({ classSlug, level, pb }) {
    if (classSlug !== 'bard' || level < 2) return 0;
    return Math.floor((Number(pb) || 0) / 2);
}

// -----------------------------------------------------------------------------
// Classe d'armure sans armure
// -----------------------------------------------------------------------------

/**
 * Moine de La Voie du bouclier (Odyssée, guide du joueur p. 46, Technique arésienne, niveau 3) :
 * « le port du bouclier ne vous empêche pas d'utiliser les aptitudes Arts martiaux, Défense sans
 * armure et Déplacement sans armure ». Sert à la CA, aux armes de Moine et au DD de Lutte.
 * @param {{ classSlug: string, subclass?: string, level?: number }} stats
 * @returns {boolean}
 */
export function shieldKeepsMartialArts({ classSlug, subclass = '', level = 1 }) {
    return classSlug === 'monk' && subclass === 'way_of_the_shield_dancer' && level >= 3;
}

/**
 * Formules de CA « sans armure » de la classe et de la sous-classe :
 *  - Barbare (p. 51) : 10 + Dex + Con, bouclier permis ;
 *  - Moine (p. 102) : 10 + Dex + Sag, ni armure ni bouclier ;
 *  - Ensorceleur, Sorcellerie draconique niveau 3, Résilience draconique (« Draconic Resilience ») :
 *    10 + Dex + Cha sans armure, bouclier permis ;
 *  - Barde, Collège de la Danse niveau 3, Jeu de jambes éblouissant (« Dazzling Footwork ») :
 *    10 + Dex + Cha sans armure ni bouclier ;
 *  - Moine, La Voie du bouclier (Odyssée, guide du joueur p. 46) niveau 3 : le bouclier n'empêche pas
 *    la Défense sans armure (shieldKeepsMartialArts).
 * @param {{ classSlug: string, subclass?: string, level?: number, mods: Object }} params
 * @returns {Array<{ value: number, label: string, short: string, stat: string, statMod: number, shieldAllowed: boolean }>}
 *   short : nom court pour les phrases (« Défense sans armure (Moine) »)
 */
export function unarmoredDefenseOptions({ classSlug, subclass = '', level = 1, mods }) {
    const dex = Number(mods?.dex) || 0;
    const option = (label, stat, statMod, shieldAllowed) => ({ value: 10 + dex + statMod, label, short: label, stat, statMod, shieldAllowed });
    const list = [];
    if (classSlug === 'barbarian') list.push(option('Défense sans armure (Barbare)', 'Con', Number(mods?.con) || 0, true));
    if (classSlug === 'monk') {
        list.push(option('Défense sans armure (Moine)', 'Sag', Number(mods?.wis) || 0, shieldKeepsMartialArts({ classSlug, subclass, level })));
    }
    if (classSlug === 'sorcerer' && subclass === 'draconic_sorcery' && level >= 3) {
        list.push(option('Résilience draconique (Ensorceleur)', 'Cha', Number(mods?.cha) || 0, true));
    }
    if (classSlug === 'bard' && subclass === 'college_of_dance' && level >= 3) {
        list.push(option('Défense sans armure (Collège de la Danse)', 'Cha', Number(mods?.cha) || 0, false));
    }
    return list;
}

// -----------------------------------------------------------------------------
// Maîtrise des armes
// -----------------------------------------------------------------------------

/** Réglage « Maîtrisée » de la configuration d'une arme (propriété facultative `proficiency` de weaponConfig) */
export const WEAPON_PROFICIENCY_SETTINGS = Object.freeze(['auto', 'yes', 'no']);

/**
 * Réglage « Maîtrisée » d'une arme : 'yes', 'no', ou 'auto' (absent, inconnu).
 * @param {string|Object} weaponConfig - champ weaponConfig (chaîne JSON en v3)
 * @returns {'auto'|'yes'|'no'}
 */
export function weaponProficiencySetting(weaponConfig) {
    const value = parseWeaponConfig(weaponConfig).proficiency;
    return value === 'yes' || value === 'no' ? value : 'auto';
}

/**
 * Catégorie d'une ligne d'arme : colonne « category » remplie depuis le manuel (« Courante »,
 * « Guerre », « Mains nues »).
 * @param {{ category?: string, name?: string }} weapon
 * @returns {'simple'|'martial'|'unarmed'|''} '' : inconnue (arme saisie à la main)
 */
export function weaponCategory(weapon) {
    if (isUnarmedStrike(weapon)) return 'unarmed';
    const kind = fold(weapon?.category);
    if (kind.includes('courante')) return 'simple';
    if (kind.includes('guerre')) return 'martial';
    return '';
}

/** Propriétés d'une arme, sans accents (« Finesse, Légère » → ['finesse', 'legere']) */
function weaponProperties(weapon) {
    return fold(weapon?.prop).split(/[,;]/).map(p => p.trim()).filter(Boolean);
}

/**
 * Armes qui comptent comme ayant la propriété Finesse pour une sous-classe : Roublard L'Odysséen
 * (Odyssée, guide du joueur), Soldat vagabond niveau 3 : « les lances et les tridents comptent comme
 * ayant la propriété finesse ». La Lance est une arme courante ; le Trident (arme de guerre) devient
 * donc une arme maîtrisée par ce Roublard (armes de guerre Finesse ou Légères). Sert aussi au calcul
 * de l'attaque (Dextérité) et à l'Attaque sournoise (weaponStatOverride, computeWeapon).
 */
export function subclassFinesse(weapon, { classSlug, subclass, level }) {
    if (classSlug !== 'rogue' || subclass !== 'the_odyssean' || level < 3) return false;
    const name = fold(weapon?.name);
    return /^(lance|trident)\b/.test(name) && !name.startsWith("lance d'arcon");
}

/** Classes dont un choix que la fiche n'enregistre pas peut donner les armes de guerre */
const CHOICE_MARTIAL = {
    cleric: "le Clerc maîtrise les armes de guerre s'il a choisi l'Ordre divin Protecteur",
    druid: "le Druide maîtrise les armes de guerre s'il a choisi l'Ordre primordial Gardien",
    warlock: "le Sorcier maîtrise l'arme de son Pacte de la lame"
};

/** Phrase qui dit quelles armes la classe maîtrise (pour l'explication « sans maîtrise ») */
export function classWeaponProficiencyText(classSlug) {
    const cls = DD_RULES.classes[classSlug];
    if (!cls) return '';
    const prof = cls.weaponProf ?? [];
    const martial = prof.includes('martial') ? 'armes de guerre'
        : prof.includes('martial-finesse') ? 'armes de guerre Finesse ou Légères'
        : prof.includes('martial-light') ? 'armes de guerre Légères' : '';
    return `${cls.nameFr} : armes courantes${martial ? ` et ${martial}` : ' seulement'}`;
}

/**
 * Le personnage maîtrise-t-il cette arme ? (PHB 2024 : le bonus de maîtrise ne s'ajoute au jet
 * d'attaque qu'avec une arme maîtrisée, chapitre « Weapons »). Décision de Franck : la fiche
 * applique la règle, avec des choix prudents quand elle ne peut pas savoir :
 *  1. réglage « Arme maîtrisée : Oui / Non » de la configuration de l'arme, s'il est choisi ;
 *  2. Frappe à mains nues : toujours maîtrisée ;
 *  3. catégorie inconnue (arme saisie à la main) ou classe non reconnue : maîtrisée (comme avant) ;
 *  4. arme courante : toutes les classes ;
 *  5. arme de guerre : classe (Moine : Légère ; Roublard : Finesse ou Légère, Trident compris pour
 *     L'Odysséen, Odyssée), don Formation aux
 *     armes de guerre, Collège de la Vaillance (Barde niveau 3) ; Clerc, Druide, Sorcier : choix que
 *     la fiche n'enregistre pas (Protecteur, Gardien, Pacte de la lame) → maîtrise supposée, rappelée.
 * @param {Object} weapon - ligne de dynamic_weapons
 * @param {{ classSlug: string, subclass?: string, level?: number, feats?: string[] }} stats - deriveCharacter()
 * @returns {{ proficient: boolean, source: 'setting'|'unarmed'|'unknown'|'class'|'feat'|'subclass'|'assumed'|'none', text: string }}
 *   text : explication courte (vide quand tout est simple : arme maîtrisée par la classe)
 */
export function weaponProficiency(weapon, { classSlug = '', subclass = '', level = 1, feats = [] } = {}) {
    const result = (proficient, source, text = '') => ({ proficient, source, text });
    const setting = weaponProficiencySetting(weapon?.weaponConfig);
    if (setting === 'yes') return result(true, 'setting', 'Maîtrisée : réglage « Arme maîtrisée : Oui » de la configuration de l\'arme.');
    if (setting === 'no') return result(false, 'setting', 'Non maîtrisée : réglage « Arme maîtrisée : Non » de la configuration de l\'arme.');

    const category = weaponCategory(weapon);
    if (category === 'unarmed') return result(true, 'unarmed');
    const cls = DD_RULES.classes[classSlug];
    if (!category || !cls) {
        return result(true, 'unknown', !cls
            ? 'Classe non reconnue : la fiche compte la maîtrise.'
            : 'Arme hors catalogue (catégorie inconnue) : la fiche compte la maîtrise.');
    }
    const prof = cls.weaponProf ?? [];
    if (category === 'simple') return result(prof.includes('simple'), prof.includes('simple') ? 'class' : 'none');

    const props = weaponProperties(weapon);
    const finesse = props.some(p => p.startsWith('finesse'));
    const light = props.some(p => p.startsWith('legere'));
    if (prof.includes('martial') || (prof.includes('martial-finesse') && finesse) || (prof.includes('martial-light') && light)) {
        return result(true, 'class');
    }
    if (feats.includes('formation_aux_armes_de_guerre')) {
        return result(true, 'feat', 'Maîtrisée grâce au don Formation aux armes de guerre.');
    }
    if (subclassFinesse(weapon, { classSlug, subclass, level })) {
        return result(true, 'subclass', "Maîtrisée grâce à L'Odysséen (Soldat vagabond, niveau 3) : le trident compte comme une arme Finesse.");
    }
    if (classSlug === 'bard' && subclass === 'college_of_valor' && level >= 3) {
        return result(true, 'subclass', 'Maîtrisée grâce au Collège de la Vaillance (Formation martiale, niveau 3).');
    }
    if (Object.hasOwn(CHOICE_MARTIAL, classSlug)) {
        return result(true, 'assumed', `Maîtrise supposée : ${CHOICE_MARTIAL[classSlug]}. Sinon, réglez « Arme maîtrisée : Non » dans la configuration de l'arme.`);
    }
    return result(false, 'none', `${classWeaponProficiencyText(classSlug)}.`);
}

/**
 * Rappel affiché sous une arme non maîtrisée (ou dont la maîtrise est supposée).
 * @param {{ proficient: boolean, source: string, text: string }} proficiency - weaponProficiency()
 * @param {number} pb - bonus de maîtrise
 * @param {boolean} [hasMastery] - la colonne « Botte d'arme » contient une botte
 * @returns {string} '' si rien à dire
 */
export function weaponProficiencyNote(proficiency, pb, hasMastery = false) {
    if (!proficiency) return '';
    if (!proficiency.proficient) {
        return `Arme non maîtrisée : le bonus de maîtrise (${signed(pb)}) n'est pas ajouté à l'attaque. ${proficiency.text}`
            + `${hasMastery ? ' Sa botte d\'arme ne s\'utilise pas non plus.' : ''}`
            + (proficiency.source === 'setting' ? '' : ' Si vous la maîtrisez (don, capacité), réglez « Arme maîtrisée : Oui » dans la configuration de l\'arme.');
    }
    if (proficiency.source === 'assumed') return proficiency.text;
    return '';
}

// -----------------------------------------------------------------------------
// Notes affichées près des valeurs (même forme que les notes de dons, feat-effects.js)
// -----------------------------------------------------------------------------

/**
 * Formations d'armure données par une sous-classe (la fiche ne coche jamais les cases elle-même) :
 *  - Collège de la Vaillance niveau 3 (PHB 2024 « Martial Training ») : armures intermédiaires et boucliers ;
 *  - Collège de poésie épique niveau 6 (Odyssée, Égide du poète ; « armures moyennes » dans le livre) :
 *    armures intermédiaires.
 * [sous-classe, niveau, nom de la capacité, formations]
 */
const SUBCLASS_ARMOR_TRAINING = Object.freeze([
    ['college_of_valor', 3, 'Collège de la Vaillance', 'Formation martiale', ['medium', 'shield']],
    ['college_of_epic_muse', 6, 'Collège de poésie épique', 'Égide du poète', ['medium']],
    // Odyssée : L'Odysséen (Soldat vagabond) et la Voie du bouclier donnent la maîtrise des boucliers au niveau 3
    ['the_odyssean', 3, "L'Odysséen", 'Soldat vagabond', ['shield']],
    ['way_of_the_shield_dancer', 3, 'La Voie du bouclier', 'Technique arésienne', ['shield']]
]);

/** Formation d'armure : [clé de sauvegarde, mots, case de l'onglet Combat] */
const TRAINING_FIELDS = Object.freeze({
    medium: ['prof_armor_med', 'armures intermédiaires', 'Intermédiaires'],
    shield: ['prof_armor_shield', 'boucliers', 'Boucliers']
});

/**
 * Notes des capacités de classe et de sous-classe, rangées par zone de la fiche ('saves.<id>',
 * 'skills.<id>', 'hpMax', 'armorClass'), au format FeatNote (feat-effects.js) avec classFeature: true.
 * Par défaut la valeur est déjà comptée par deriveCharacter (applied: true) ; une valeur saisie à la
 * main (PV max) n'est jamais modifiée : la note dit « dont +X » (manual: true).
 * @param {Object} derived - deriveCharacter()
 * @param {Object} [record] - personnage (cases de formation aux armures)
 * @returns {Object<string, Object[]>}
 */
export function classFeatureNotes(derived, record = {}) {
    const zones = {};
    const add = (zone, featId, featName, text, value, extra = { applied: true }) => {
        (zones[zone] ??= []).push({ featId, featName, text, value, ...extra, classFeature: true });
    };
    const aura = Number(derived?.auraOfProtection) || 0;
    if (aura > 0) {
        const cha = Number(derived.mods?.cha) || 0;
        const range = derived.level >= 18 ? '9 m' : '3 m';
        for (const id of ABILITY_IDS) {
            add(`saves.${id}`, 'aura_de_protection', 'Aura de protection',
                `Paladin niveau 6 : ${signed(aura)} (modificateur de Charisme${cha < 1 ? ', minimum +1' : ''}) déjà compté dans ce jet, pour vous et vos alliés à ${range} de vous. Inactive tant que vous êtes Neutralisé : retirez alors ${signed(aura)}.`,
                aura);
        }
    }
    const jack = Number(derived?.jackOfAllTrades) || 0;
    if (jack > 0) {
        for (const skill of SKILLS) {
            if (!derived.skills?.[skill.id]?.jack) continue;
            add(`skills.${skill.id}`, 'touche_a_tout', 'Touche-à-tout',
                `Barde niveau 2 : ${signed(jack)} (moitié du bonus de maîtrise) déjà compté, car vous ne maîtrisez pas cette compétence${skill.id === 'perception' ? ' (aussi dans la Perception passive)' : ''}.`,
                jack);
        }
    }
    // Résilience draconique (PHB 2024 p. 148, Ensorceleur niveau 3) : PV max +3, puis +1 par niveau
    // d'Ensorceleur (= niveau) ; la CA est calculée par unarmoredDefenseOptions
    if (derived?.classSlug === 'sorcerer' && derived.subclass === 'draconic_sorcery' && derived.level >= 3) {
        add('hpMax', 'resilience_draconique', 'Résilience draconique',
            `dont +${derived.level} PV grâce à Résilience draconique (Ensorceleur niveau 3 : +3, puis +1 par niveau d'Ensorceleur) : à compter vous-même dans les PV max saisis, la fiche ne les ajoute pas.`,
            derived.level, { manual: true });
    }
    for (const [subclass, minLevel, name, feature, kinds] of SUBCLASS_ARMOR_TRAINING) {
        if (derived?.subclass !== subclass || derived.level < minLevel) continue;
        const missing = kinds.filter(kind => record?.[TRAINING_FIELDS[kind][0]] !== true);
        if (!missing.length) continue;
        const words = kinds.map(kind => TRAINING_FIELDS[kind][1]).join(' et aux ');
        const boxes = missing.map(kind => `« ${TRAINING_FIELDS[kind][2]} »`).join(' et ');
        add('armorClass', subclass, name,
            `${feature} (niveau ${minLevel}) : vous êtes formé aux ${words}. Case ${boxes} des maîtrises d'armures (onglet Combat) à cocher : la fiche ne coche rien elle-même${missing.includes('shield') ? ', et sans elle le bouclier ne compte pas dans la CA' : ''}.`,
            undefined, { check: true });
    }
    // Petits calculs des sous-classes (lot 4) : Initiative, compétences, maîtrises à cocher, vitesses…
    for (const [zone, notes] of Object.entries(subclassNotes(derived, record))) (zones[zone] ??= []).push(...notes);
    // Résistances de la sous-classe (lot 5) : repères près de la CA
    for (const [zone, notes] of Object.entries(subclassDefenseNotes(derived, record))) (zones[zone] ??= []).push(...notes);
    return zones;
}
