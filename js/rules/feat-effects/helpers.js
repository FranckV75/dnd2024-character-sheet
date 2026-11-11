// =============================================================================
// FEAT-EFFECTS/HELPERS.JS (règles) - Outils communs aux effets des dons
// Fabrique des notes (note), reconnaissance d'armes et d'armures, DD calculés (Coup de bouclier,
// Empoisonneur, Comédien, Lutte), choix mémorisés d'un don. Utilisé par les fichiers de ce dossier ;
// les DD et isPolearm sont réexportés par js/rules/feat-effects.js.
// =============================================================================

import { featSlots, featName, classOf, subclassOf, STYLE_ALTERNATIVES } from '../feats.js';
import { isUnarmedStrike } from '../weapons.js';
import { DD_RULES } from '../../data/dd-rules.js';
import { abilityName, slotChoice, ENERGY_TYPES } from '../feat-choices.js';
import { shieldKeepsMartialArts } from '../class-features.js';

export const signed = (n) => `${n >= 0 ? '+' : ''}${n}`;

/** Note prête à ranger (featName ajouté, champs facultatifs absents s'ils ne sont pas fournis) */
export function note(featId, text, extra = {}) {
    return { featId, featName: featName(featId), text, ...extra };
}

/** DD du Coup de bouclier (PHB 2024 « Shield Master », p. 207) : 8 + mod. Force + bonus de maîtrise */
export function shieldBashDC(derived) {
    return 8 + derived.mods.str + derived.pb;
}

/** Points de vie de Robuste (PHB 2024 « Tough », p. 202) : 2 × niveau du personnage */
export function toughHitPoints(level) {
    return 2 * level;
}

/** Texte brut d'un champ saisi (les anciennes sauvegardes peuvent contenir du HTML) */
export const plainText = (value) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
/** Sans accents ni majuscules, pour reconnaître un nom saisi (« Bâton » → « baton ») */
export const fold = (value) => plainText(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/**
 * Formations d'armure (cases « Maîtrises d'armures » de l'onglet Combat) : [clé, mots, case].
 * La fiche ne coche jamais ces cases : elle dit seulement si elles le sont.
 */
export const ARMOR_TRAINING = Object.freeze({
    light: ['prof_armor_light', 'armures légères', 'Légères'],
    medium: ['prof_armor_med', 'armures intermédiaires', 'Intermédiaires'],
    heavy: ['prof_armor_heavy', 'armures lourdes', 'Lourdes'],
    shield: ['prof_armor_shield', 'boucliers', 'Boucliers']
});

/**
 * Protection légère, intermédiaire, lourde (PHB 2024 « Lightly / Moderately / Heavily Armored »,
 * p. 204-205) : prérequis de formation, formations données (cochées ou à cocher), formation déjà
 * donnée par la classe.
 */
export function armorTrainingNotes(kinds, prerequisite, { derived, record, add }) {
    if (prerequisite) {
        const [field, words, box] = ARMOR_TRAINING[prerequisite];
        if (record[field] !== true) {
            add('featSlot', `Prérequis : formation aux ${words} (case « ${box} » des maîtrises d'armures, onglet Combat, non cochée).`, { check: true });
        }
    }
    for (const kind of kinds) {
        const [field, words, box] = ARMOR_TRAINING[kind];
        if (record[field] === true) add('featSlot', `Formation aux ${words} : case « ${box} » cochée.`, { ticked: true });
        else add('featSlot', `Formation aux ${words} à cocher (case « ${box} » des maîtrises d'armures, onglet Combat) : la fiche ne coche rien elle-même.`, { check: true });
    }
    const fromClass = DD_RULES.classes[derived.classSlug]?.armorProf ?? [];
    if (kinds.every(kind => fromClass.includes(kind))) {
        add('featSlot', `Votre classe (${derived.className}) donne déjà cette formation : ce don ne vous apporte que son +1.`);
    }
}

/** Maîtrise d'outil donnée par un don : notée ou non dans le champ Outils (onglet Compétences & Histoire) */
export function toolNote(record, pattern, label, add) {
    if (pattern.test(fold(record.profs_tools))) add('featSlot', `${label} : maîtrise notée dans le champ Outils.`, { ticked: true });
    else add('featSlot', `${label} : maîtrise à noter dans le champ Outils (onglet Compétences & Histoire).`, { check: true });
}

/** Arme du tableau qui a une propriété (« finesse », « allonge »...) */
export const hasProperty = (weapon, word) => fold(weapon?.prop).split(/[,;]/).some(part => part.trim().startsWith(word));

/**
 * Arme d'hast de Maître d'hast (PHB 2024 « Polearm Master », p. 206) : Bâton, Lance, ou arme à la
 * fois Lourde et à Allonge (Coutille, Hallebarde, Lance d'arçon, Pique). Nom reconnu au début
 * (« Bâton +1 ») ; la Lance d'arçon l'est par ses propriétés.
 * Aussi « Bâton de feu » ou « Lance de foudre », mais pas « Lance-pierre ».
 */
export function isPolearm(weapon) {
    const name = fold(weapon?.name);
    return /^(baton|lance)(?=$|[\s+,(])/.test(name) || (hasProperty(weapon, 'lourde') && hasProperty(weapon, 'allonge'));
}

/**
 * DD du poison d'Empoisonneur (PHB 2024 « Poisoner », p. 206) : 8 + modificateur de la
 * caractéristique augmentée par le don + bonus de maîtrise ; null tant qu'elle n'est pas choisie.
 * @param {Object} record
 * @param {Object} derived
 * @returns {number|null}
 */
export function poisonerDC(record, derived) {
    const slot = featSlots(record).find(s => s.reached && s.featId === 'empoisonneur');
    const ability = slot ? slotChoice(record, slot.level, 'empoisonneur').ability : '';
    return ability ? 8 + derived.mods[ability] + derived.pb : null;
}

/** Choix d'un don dans son premier emplacement atteint ({} si le don n'est pas atteint) */
export function firstChoice(record, featId) {
    const slot = featSlots(record).find(s => s.reached && s.featId === featId);
    return slot ? slotChoice(record, slot.level, featId) : {};
}

/**
 * Faveur d'attaque irrésistible : valeur de la caractéristique augmentée par le don (Force ou
 * Dextérité, choisie dans l'encadré), ajoutée aux dégâts sur un 20 au d20.
 * @returns {{ score: number, name: string } | null} null tant que la caractéristique n'est pas choisie
 */
export function irresistibleBoost(record, derived) {
    const { ability } = firstChoice(record, 'faveur_d_attaque_irresistible');
    return ability ? { score: derived.scores[ability], name: abilityName(ability) } : null;
}

/** Types de dégâts choisis avec Faveur de résistance aux énergies */
export function energyChoices(record) {
    const choice = firstChoice(record, 'faveur_de_resistance_aux_energies');
    return [choice.energy1, choice.energy2].filter(Boolean);
}
export const energyName = (id) => ENERGY_TYPES.find(([key]) => key === id)?.[1] ?? id;

/** Capacité Sorts (prérequis de Faveur de mémoire magique) : emplacements de sorts de la classe,
 *  ou sous-classe Chevalier occulte / Arnaqueur arcanique. Pas la Magie de pacte de l'Occultiste : le
 *  PHB 2024 écrit « Spellcasting or Pact Magic Feature » quand elle suffit, ici « Spellcasting Feature ». */
export function hasSpellcasting(record, derived) {
    return (derived.classSlug !== 'warlock' && Object.keys(derived.spellSlots ?? {}).length > 0)
        || ['eldritch_knight', 'arcane_trickster'].includes(subclassOf(record));
}

/** DD de l'Imitation du Comédien (PHB 2024 « Actor », p. 202) : 8 + mod. Charisme + bonus de maîtrise */
export function actorDC(derived) {
    return 8 + derived.mods.cha + derived.pb;
}

/**
 * DD de la Lutte à mains nues (PHB 2024 p. 377) : 8 + mod. Force + bonus de maîtrise ; le Moine
 * sans armure ni bouclier peut prendre la Dextérité (Arts martiaux, p. 102) ; le bouclier est permis
 * à La Voie du bouclier (Odyssée).
 */
export function grappleDC(derived) {
    const { str, dex } = derived.mods;
    const worn = derived.wornArmor ?? {};
    const martialArts = derived.classSlug === 'monk' && !(worn.light || worn.medium || worn.heavy)
        && (!worn.shield || shieldKeepsMartialArts(derived));
    return 8 + (martialArts ? Math.max(str, dex) : str) + derived.pb;
}

/** Rappel : pas de ligne « Attaque à mains nues » dans le tableau des armes (ses dégâts n'y sont pas calculés) */
export function unarmedRowHint(record, add) {
    const weapons = Array.isArray(record.dynamic_weapons) ? record.dynamic_weapons : [];
    // Ligne rattachée au manuel seulement (sinon ses dégâts ne sont pas calculés)
    if (!weapons.some(weapon => isUnarmedStrike(weapon) && weapon.atkKey)) {
        add('featSlot', '« Attaque à mains nues » peut être ajoutée au tableau des armes (liste du manuel) : ses dégâts y sont alors calculés.', { inactive: true });
    }
}

/** Notes de Combattant béni / druidique : sorts à noter soi-même, et classe qui y a droit */
export function alternativeNotes(id, list, advised, ability, record, add) {
    const alt = STYLE_ALTERNATIVES[id];
    add('featSlot', `Deux sorts mineurs de ${list} à ajouter vous-même au grimoire (${advised} sont conseillés), lancés avec ${ability}. Ils remplacent le style de combat.`);
    if (classOf(record) !== alt.classId) {
        add('featSlot', `${alt.name} est une option du ${alt.className} (niveau 2), à la place de son style de combat.`, { check: true });
    }
}
