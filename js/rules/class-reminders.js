// =============================================================================
// CLASS-REMINDERS.JS (règles) - Rappels des capacités de classe près des valeurs (4.37.0)
//
// « Avantage (Sens du danger) » près de la sauvegarde de Dextérité d'un Barbare de niveau 2 :
// ce que la fiche ne peut pas calculer (Avantage, immunité, minimum au dé, déclencheur à
// l'Initiative) mais qu'un joueur oublie à la table. Relevé fait sur js/data/class-progression.js
// et js/data/subclass-features.js (résumés du Manuel des joueurs français), sans doublon avec les
// autres repères (subclass-calcs.js, subclass-combat.js, class-features.js).
//
// Format FeatNote (feat-effects.js) avec classFeature: true ; mention : texte de la pastille.
//  - buff 'rage' : rappel grisé (inactive) tant que le bouton Rage est éteint ;
//  - manual : la valeur saisie n'est jamais modifiée (« dont +4 ») ;
//  - check : case de maîtrise à cocher (« À vérifier »).
// Fonctions pures.
// =============================================================================

import { ABILITY_IDS, SKILLS } from '../data/constants.js';

const signed = (n) => (n >= 0 ? `+${n}` : `${n}`);
const ABILITY_WORDS = Object.freeze({
    str: 'de Force', dex: 'de Dextérité', con: 'de Constitution', int: "d'Intelligence", wis: 'de Sagesse', cha: 'de Charisme'
});
const ALL_SAVES = ABILITY_IDS.map((id) => `saves.${id}`);

/**
 * Rappels : [classe ou null, sous-classe ou null, niveau, featId, nom, zones, mention, texte, options].
 * zones, mention et texte peuvent dépendre du personnage (fonction de ctx = { derived, record, level }).
 */
const REMINDERS = Object.freeze([
    // --- Barbare ---
    ['barbarian', null, 1, 'rage_force', 'Rage', ['saves.str', 'scores.str'], 'Avantage (Rage)',
        'Pendant la Rage : Avantage aux tests et aux jets de sauvegarde de Force.', { buff: 'rage' }],
    ['barbarian', null, 1, 'rage_resistance', 'Rage', ['armorClass'], 'Résistance C/P/T (Rage)',
        'Pendant la Rage : Résistance aux dégâts contondants, perforants et tranchants.', { buff: 'rage' }],
    ['barbarian', null, 2, 'sens_du_danger', 'Sens du danger', ['saves.dex'], 'Avantage (Sens du danger)',
        'Avantage aux jets de sauvegarde de Dextérité, sauf si vous êtes Neutralisé.'],
    ['barbarian', null, 7, 'instinct_sauvage', 'Instinct sauvage', ['initiative'], 'Avantage (Instinct sauvage)',
        "Avantage aux jets d'Initiative."],
    ['barbarian', null, 11, 'rage_implacable', 'Rage implacable', ['deathSaves'], 'Rage implacable (DD 10)',
        ({ level }) => `Pendant la Rage, en tombant à 0 PV sans mourir sur le coup : jet de sauvegarde de Constitution DD 10 ; réussi, vous restez à ${level * 2} PV (double du niveau). Le DD monte de 5 à chaque nouvelle fois et revient à 10 après un repos court ou long.`,
        { buff: 'rage' }],
    ['barbarian', null, 15, 'rage_persistante', 'Rage persistante', ['initiative'], 'Rages récupérables',
        "En jouant l'Initiative, vous pouvez récupérer toutes vos Rages (de nouveau après un repos long)."],
    ['barbarian', null, 18, 'puissance_indomptable', 'Puissance indomptable', ['saves.str', 'scores.str'],
        ({ derived }) => `Minimum ${derived.scores?.str ?? 10}`,
        ({ derived }) => `Test ou jet de sauvegarde de Force : un total inférieur à votre valeur de Force (${derived.scores?.str ?? 10}) vaut cette valeur.`],
    ['barbarian', null, 20, 'champion_primitif', 'Champion primitif', ['scores.str', 'scores.con'], 'dont +4 (Champion primitif)',
        "Force et Constitution +4 (25 au plus) : à compter vous-même dans les valeurs saisies, la fiche ne les ajoute pas.", { manual: true }],
    // --- Barde ---
    ['bard', null, 7, 'contre_charme', 'Contre-charme', ['saves.wis'], 'Relance (Contre-charme)',
        'Réaction : quand vous ou une créature à 9 m ratez une sauvegarde contre Charmé ou Effrayé, nouveau jet avec Avantage.'],
    ['bard', null, 18, 'inspiration_superieure', 'Inspiration supérieure', ['initiative'], 'Inspiration supérieure',
        "En jouant l'Initiative avec une Inspiration bardique ou moins, vous remontez à deux."],
    // --- Druide ---
    ['druid', null, 20, 'archidruide', 'Archidruide', ['initiative'], 'Forme sauvage +1 (Archidruide)',
        "En jouant l'Initiative sans Forme sauvage restante, vous en récupérez une."],
    // --- Moine ---
    ['monk', null, 2, 'metabolisme_surnaturel', 'Métabolisme surnaturel', ['initiative'], 'Métabolisme surnaturel',
        "En jouant l'Initiative : récupérer tous vos points de Credo et des PV (une fois par repos long)."],
    ['monk', null, 7, 'esquive_totale', 'Esquive totale', ['saves.dex'], 'Esquive totale',
        'Sauvegarde de Dextérité pour moitié des dégâts : aucun dégât si elle réussit, moitié si elle échoue (sauf si vous êtes Neutralisé).'],
    ['monk', null, 15, 'credo_parcheve', 'Credo parachevé', ['initiative'], 'Credo remonte à 4',
        "En jouant l'Initiative sans Métabolisme surnaturel, avec moins de 4 points de Credo : vous remontez à 4."],
    ['monk', null, 20, 'esprit_et_corps', 'Esprit et corps', ['scores.dex', 'scores.wis'], 'dont +4 (Esprit et corps)',
        "Dextérité et Sagesse +4 (25 au plus) : à compter vous-même dans les valeurs saisies, la fiche ne les ajoute pas.", { manual: true }],
    // --- Paladin ---
    ['paladin', null, 10, 'aura_de_courage', 'Aura de courage', ['saves.wis'], 'Immunité Effrayé (aura)',
        "Vous et vos alliés dans votre Aura de protection êtes immunisés contre l'état Effrayé."],
    // --- Rôdeur ---
    ['ranger', null, 6, 'arpenteur_nage', 'Arpenteur', ['speed'], 'Escalade et nage = Vitesse',
        "Vitesses d'escalade et de nage égales à votre Vitesse."],
    ['ranger', null, 13, 'chasseur_implacable', 'Chasseur implacable', ['saves.con'], 'Marque du chasseur : sans jet',
        'Les dégâts subis ne rompent jamais votre Concentration sur marque du chasseur.'],
    // --- Roublard ---
    ['rogue', null, 7, 'esquive_totale', 'Esquive totale', ['saves.dex'], 'Esquive totale',
        'Sauvegarde de Dextérité pour moitié des dégâts : aucun dégât si elle réussit, moitié si elle échoue (sauf si vous êtes Neutralisé).'],
    ['rogue', null, 7, 'savoir_faire', 'Savoir-faire',
        ({ derived }) => SKILLS.filter((skill) => derived.skills?.[skill.id]?.proficient).map((skill) => `skills.${skill.id}`),
        'd20 minimum 10 (Savoir-faire)', 'Test d\'une compétence maîtrisée : un 9 ou moins au d20 compte comme un 10.'],
    ['rogue', null, 18, 'insaisissable', 'Insaisissable', ['armorClass'], "Pas d'Avantage contre vous",
        "Aucun jet d'attaque contre vous n'a l'Avantage, sauf si vous êtes Neutralisé."],
    // --- Sous-classes ---
    ['fighter', 'champion', 3, 'athlete_remarquable', 'Athlète accompli', ['skills.athletics'], 'Avantage (Athlète accompli)',
        'Avantage aux tests de Force (Athlétisme).'],
    ['paladin', 'oath_of_devotion', 7, 'aura_de_devotion', 'Aura de dévotion', ['saves.wis'], 'Immunité Charmé (aura)',
        "Vous et vos alliés dans votre Aura de protection êtes immunisés contre l'état Charmé."],
    ['ranger', 'fey_wanderer', 3, 'charme_surnaturel', 'Charme mystique',
        // Compétences de Charisme : bonus déjà compté (subclass-calcs.js) ; reste le test de Charisme seul
        ['scores.cha'],
        ({ derived }) => `${signed(Math.max(1, Number(derived.mods?.wis) || 0))} (Charme mystique)`,
        ({ derived }) => `Tests de Charisme : ajoutez votre modificateur de Sagesse (minimum +1), soit ${signed(Math.max(1, Number(derived.mods?.wis) || 0))}. Déjà compté dans les compétences de Charisme ; à ajouter vous-même à un test de Charisme sans compétence.`],
    ['ranger', 'fey_wanderer', 7, 'torsion_ensorcelante', 'Fascination détournée', ['saves.wis'], 'Avantage contre Charmé/Effrayé',
        'Avantage aux sauvegardes pour éviter ou finir les états Charmé ou Effrayé.'],
    ['sorcerer', 'aberrant_sorcery', 6, 'defenses_psychiques', 'Défenses psychiques', ['saves.wis'], 'Avantage contre Charmé/Effrayé',
        'Avantage aux sauvegardes pour éviter ou finir les états Charmé et Effrayé.'],
    ['warlock', 'archfey_patron', 10, 'defenses_envoutantes', 'Charmantes défenses', ['saves.wis'], 'Immunité : Charmé',
        "Vous êtes immunisé contre l'état Charmé."],
    ['wizard', 'abjurer', 14, 'resistance_aux_sorts', 'Résistance aux sorts', ALL_SAVES, 'Avantage contre les sorts',
        'Avantage aux jets de sauvegarde contre les sorts (et Résistance à leurs dégâts).'],
    ['monk', 'way_of_the_shield_dancer', 17, 'vaillance_inflexible', 'Vaillance inflexible', ['saves.wis'], 'Ni Effrayé ni Paralysé (TG+)',
        'Les sorts et capacités des créatures de taille Très Grande ou plus ne peuvent vous rendre ni Effrayé ni Paralysé.']
]);

/** Maîtrises de sauvegarde données par la classe, à cocher : [classe, niveau, featId, nom, sauvegardes] */
const SAVE_TRAINING = Object.freeze([
    ['monk', 14, 'survivant_discipline', 'Survivant discipliné', ABILITY_IDS,
        'Vous maîtrisez tous les jets de sauvegarde ; après une sauvegarde ratée, 1 point de Credo permet de la relancer.'],
    ['rogue', 15, 'esprit_fuyant', 'Esprit fuyant', ['wis', 'cha'], 'Vous maîtrisez les jets de sauvegarde de Sagesse et de Charisme.']
]);

const value = (entry, ctx) => (typeof entry === 'function' ? entry(ctx) : entry);

/**
 * @param {Object} derived - deriveCharacter(record)
 * @param {Object} [record]
 * @returns {Object<string, Object[]>} zones de notes
 */
export function classReminderNotes(derived, record = {}) {
    const zones = {};
    const level = Number(derived?.level) || 1;
    const ctx = { derived, record, level };
    const raging = record?.combat_buffs?.rage === true;
    for (const [classSlug, subclass, minLevel, featId, featName, where, mention, text, options = {}] of REMINDERS) {
        if (derived?.classSlug !== classSlug || level < minLevel) continue;
        if (subclass && derived.subclass !== subclass) continue;
        const note = {
            featId, featName, text: value(text, ctx), mention: value(mention, ctx), classFeature: true,
            ...(options.manual ? { manual: true, value: 4 } : {}),
            ...(options.buff === 'rage' && !raging ? { inactive: true } : {})
        };
        for (const zone of value(where, ctx)) (zones[zone] ??= []).push({ ...note });
    }
    for (const [classSlug, minLevel, featId, featName, abilities, text] of SAVE_TRAINING) {
        if (derived?.classSlug !== classSlug || level < minLevel) continue;
        for (const id of abilities) {
            if (record?.[`${id}_save_prof`] === true) continue;
            (zones[`saves.${id}`] ??= []).push({
                featId, featName, classFeature: true, check: true, mention: `Maîtrise (${featName})`,
                text: `${text} Case de maîtrise du jet de sauvegarde ${ABILITY_WORDS[id]} à cocher : la fiche ne coche rien elle-même.`
            });
        }
    }
    return zones;
}
