// =============================================================================
// LEVEL-UP.JS - Assistant « Passer au niveau N » : ce qui change, et ce qu'on applique (pur)
//
// planLevelUp(character) compare la fiche au niveau actuel et au niveau suivant (deriveCharacter
// des deux) et liste ce qui change : points de vie, bonus de maîtrise, dons à choisir, emplacements
// de sorts, ressource et dés de classe, capacités et choix de sous-classe. Rien n'est recopié des
// règles : tout vient des fonctions déjà utilisées par la fiche.
// levelUpPatch(plan, options) ne touche qu'aux clés existantes char_level, hp_max et (sur demande)
// hp_current, toujours en texte comme la v3. Les dons, caractéristiques, sorts et sous-classe se
// choisissent ensuite dans la fiche, comme d'habitude (la fiche n'ajoute jamais une augmentation
// elle-même). Multiclasse non gérée (une seule classe) : seuls le niveau et les PV sont calculés.
// Testé : tests/level-up.test.js.
// =============================================================================

import { deriveCharacter, sneakAttackDice } from './character.js';
import { calculateProficiencyBonus, getRageBonus, getMartialArtsDie } from './logic.js';
import { bardicInspirationDie } from './subclass-calcs.js';
import { hitDieFaces, readHitPoints } from './rest.js';
import { featEffects } from './feat-effects.js';
import { featSlotCounts, featSlotLevelFor, featSlotName, featName, classFeatSlot } from './feats.js';
import { featuresAtLevel, classSpellCounts } from './class-progression.js';
import { subclassFeatures, subclassSpells, automationKind } from './subclass-features.js';
import { subclassChoiceFields } from './subclass-choices.js';
import { FEAT_SLOT_ORDER } from '../state/schema.js';
import { DD_RULES } from '../data/dd-rules.js';
import { FEATS_DATA } from '../data/feats.js';
import { signed } from './numbers.js';

/** Faveur épique (prérequis : niveau 19, emplacement du niveau 19) */
const isEpicBoon = (featId) => Object.hasOwn(FEATS_DATA, featId) && FEATS_DATA[featId].type === 'Épique';

export const MAX_LEVEL = 20;
/** Niveau du choix de la sous-classe (PHB 2024) */
const SUBCLASS_LEVEL = 3;

/** Texte brut (anciennes sauvegardes avec un peu de HTML) */
const plain = (value) => String(value ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

/**
 * Bonus de PV par niveau déjà connus de la fiche (Robuste, Résistance draconique…) : différence
 * entre les deux niveaux, par nom.
 */
function hitPointBonuses(record, dFrom, next, dTo) {
    // Faveur épique notée ailleurs qu'au niveau 19 : prérequis non rempli, aucun PV (feat-effects.js l'avertit)
    const valid = (note, character) => !isEpicBoon(note.featId) || plain(character.feat_19) === note.featId;
    const byName = (notes, character) => {
        const map = new Map();
        for (const note of notes) {
            if (!valid(note, character)) continue;
            map.set(note.featName, (map.get(note.featName) ?? 0) + (Number(note.value) || 0));
        }
        return map;
    };
    const before = byName(featEffects(record, dFrom).hpMax, record);
    const after = byName(featEffects(next, dTo).hpMax, next);
    const bonuses = [];
    for (const [name, value] of after) {
        const delta = value - (before.get(name) ?? 0);
        if (delta > 0) bonuses.push({ name, value: delta });
    }
    // Nain (PHB 2024) : +1 PV max par niveau, que la fiche ne calcule pas ailleurs
    if (DD_RULES.findSpecies(plain(record.char_species)) === DD_RULES.species.dwarf) bonuses.push({ name: 'Ténacité naine', value: 1 });
    return bonuses;
}

/** Points de vie du niveau gagné */
function hitPointsPlan(record, dFrom, next, dTo) {
    const faces = hitDieFaces(record.hd_type, dFrom.hitDie);
    const maxText = plain(record.hp_max);
    const currentText = plain(record.hp_current);
    return {
        faces,
        fixed: faces ? faces / 2 + 1 : null,
        conMod: dFrom.mods.con,
        bonuses: hitPointBonuses(record, dFrom, next, dTo),
        oldMax: readHitPoints(maxText),
        // PV max modifiable sans perdre une note du joueur : un nombre seul (« 45 », pas « 45 (Robuste) »)
        maxIsNumber: /^\d+$/.test(maxText),
        currentIsNumber: /^-?\d+$/.test(currentText),
        oldCurrent: readHitPoints(currentText)
    };
}

/**
 * PV gagnés au niveau suivant (PHB 2024) : valeur fixe (moitié du dé + 1) ou résultat du dé, plus le
 * modificateur de Constitution (minimum 1 au total), plus les bonus par niveau.
 * @param {ReturnType<typeof hitPointsPlan>} hp
 * @param {{ mode: 'fixed'|'roll', roll?: number|string }} choice
 * @returns {number|null} null : choix incomplet (dé inconnu, jet hors du dé)
 */
export function hitPointGain(hp, { mode, roll } = {}) {
    let base;
    if (mode === 'fixed') base = hp.fixed;
    else {
        const value = Number(String(roll ?? '').trim());
        base = Number.isInteger(value) && value >= 1 && (!hp.faces || value <= hp.faces) && String(roll ?? '').trim() !== '' ? value : null;
    }
    if (base === null || base === undefined) return null;
    return Math.max(1, base + hp.conMod) + hp.bonuses.reduce((n, bonus) => n + bonus.value, 0);
}

/** Emplacements de dons acquis au niveau `to` */
function featLines(next, to) {
    const lines = [];
    for (const slot of FEAT_SLOT_ORDER) {
        if (!featSlotCounts(slot, next) || featSlotLevelFor(slot, next) !== to) continue;
        const chosen = plain(next[`feat_${slot}`]);
        const reserved = classFeatSlot(slot);
        const where = reserved && !reserved.style ? `${reserved.caption} (${featSlotName(slot)})` : `Don du ${featSlotName(slot)}`;
        if (chosen && isEpicBoon(chosen) && slot !== 19) lines.push(`${where} : ${featName(chosen)} est une faveur épique, qui se prend au niveau 19 : choisissez un autre don ici (encadré Dons).`);
        else if (chosen) lines.push(`${where} : ${featName(chosen)}, déjà noté, devient actif.`);
        else if (reserved?.style) lines.push('Style de combat : choisissez-le dans Aptitudes & Traits (encadré Dons).');
        else if (slot === 19) lines.push(`${where} : choisissez une faveur épique ou un autre don (encadré Dons).`);
        else lines.push(`${where} : choisissez un don, par exemple Amélioration de caractéristique (encadré Dons).`);
    }
    return lines;
}

/** Emplacements de sorts : différences entre les deux niveaux */
function spellSlotLines(dFrom, dTo) {
    const before = dFrom.spellSlots ?? {};
    const after = dTo.spellSlots ?? {};
    const levels = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort((a, b) => Number(a) - Number(b));
    // Magie de pacte : tous les emplacements d'un seul niveau, qui monte
    const single = (slots) => Object.keys(slots).length === 1;
    if (dFrom.classSlug === 'warlock' && single(before) && single(after)) {
        const [[fromLevel, fromCount]] = Object.entries(before);
        const [[toLevel, toCount]] = Object.entries(after);
        const lines = [];
        if (fromLevel !== toLevel) lines.push(`Magie de pacte : vos emplacements passent au niveau ${toLevel}.`);
        if (toCount !== fromCount) lines.push(`Magie de pacte : ${plural(toCount, 'emplacement')} (au lieu de ${fromCount}).`);
        return lines;
    }
    const lines = [];
    for (const level of levels) {
        const a = before[level] ?? 0;
        const b = after[level] ?? 0;
        if (b === a) continue;
        if (!a) lines.push(`Nouveaux emplacements de sorts de niveau ${level} : ${b}.`);
        else if (b > a) lines.push(`Emplacements de sorts de niveau ${level} : ${a} → ${b}.`);
        else lines.push(`Emplacements de sorts de niveau ${level} : ${a} → ${b}.`);
    }
    return lines;
}

/** Sorts de sous-classe acquis à ce niveau (toujours préparés) */
function subclassSpellLines(dTo, to) {
    const { reached } = subclassSpells({ subclass: dTo.subclass, level: to, subclassChoices: dTo.subclassChoices });
    const gained = reached.filter((spell) => spell.classLevel === to);
    const names = [...new Set(gained.map((spell) => spell.level ? `${spell.name} (niv. ${spell.level})` : `${spell.name} (sort mineur)`))];
    if (!names.length) return [];
    // Cercle de la Terre sans terre choisie : les sorts de toutes les terres sont listés
    if (dTo.subclass === 'circle_of_the_land' && !dTo.subclassChoices?.land) {
        return ['Nouveaux sorts de sous-classe : choisissez d\'abord votre Type de terre dans le bloc Sous-classe.'];
    }
    if (names.length > 6) return ['Nouveaux sorts de sous-classe : voir le bloc Sous-classe (onglet Magie).'];
    return [`Sorts de sous-classe toujours préparés : ${names.join(', ')}.`];
}

/** Ressource et dés de classe qui changent avec le niveau */
function classLines(dFrom, dTo) {
    const lines = [];
    const a = dFrom.classResource;
    const b = dTo.classResource;
    if (b?.label && b.count) {
        if (!a?.label || a.label !== b.label || !a.count) lines.push(`Nouvelle ressource : ${b.label} (${b.count}).`);
        else if (a.count !== b.count) lines.push(`${b.label} : ${a.count} → ${b.count}.`);
    }
    const dice = {
        barbarian: ['Bonus de dégâts de la Rage', (level) => signed(getRageBonus(level))],
        monk: ['Dé des Arts martiaux', getMartialArtsDie],
        rogue: ['Attaque sournoise', (level) => `${sneakAttackDice(level)}d6`],
        bard: ['Dé d\'Inspiration bardique', bardicInspirationDie]
    }[dFrom.classSlug];
    if (dice) {
        const [label, value] = dice;
        const before = value(dFrom.level);
        const after = value(dTo.level);
        if (before !== after) lines.push(`${label} : ${before} → ${after}.`);
    }
    return lines;
}

/** Sous-classe : choix au niveau 3, nouvelles capacités, nouveaux menus de choix */
function subclassLines(dFrom, dTo, to) {
    const lines = [];
    if (!dTo.subclass) {
        if (to >= SUBCLASS_LEVEL && dFrom.classSlug) {
            const names = Object.values(DD_RULES.subclasses)
                .filter((info) => info.class === dFrom.classSlug)
                .map((info) => (info.source === 'Odyssée' ? `${info.nameFr} (Odyssée)` : info.nameFr));
            lines.push(`Choisissez votre sous-classe (en haut de la fiche) : ${names.join(', ')}.`);
        }
        return lines;
    }
    const { subclass, reached } = subclassFeatures(dTo);
    for (const feature of reached.filter((f) => f.level === to)) {
        const kind = automationKind(feature);
        const how = kind === 'calc' ? 'calculée par la fiche' : kind === 'partial' ? 'en partie calculée par la fiche' : 'rappel dans le bloc Sous-classe';
        lines.push(`Nouvelle capacité (${subclass.name}) : ${feature.name} (${how}).`);
    }
    const known = new Set(subclassChoiceFields(dFrom).map((field) => field.key));
    const fresh = subclassChoiceFields(dTo).filter((field) => !known.has(field.key));
    if (fresh.length) lines.push(`À choisir dans le bloc Sous-classe : ${[...new Set(fresh.map((field) => field.label))].join(', ')}.`);
    return lines;
}

/**
 * Aptitudes de base gagnées à ce niveau (js/data/class-progression.js) ; les dons et la
 * sous-classe ont leurs propres lignes.
 */
function baseFeatureLines(classSlug, to) {
    const gained = featuresAtLevel(classSlug, to).filter((feature) => feature.kind === 'feature');
    if (!gained.length) return [];
    return [
        ...gained.map((feature) => `Nouvelle aptitude : ${feature.name}.`),
        'Leur résumé : Aptitudes & Traits, bloc Capacités de classe.'
    ];
}

/** Sorts mineurs et sorts préparés de la table de classe */
function spellCountLines(classSlug, from, to) {
    const before = classSpellCounts(classSlug, from);
    const after = classSpellCounts(classSlug, to);
    const lines = [];
    if (after.cantrips !== null && after.cantrips !== before.cantrips) lines.push(`Sorts mineurs : ${before.cantrips ?? 0} → ${after.cantrips} (un sort mineur de plus à choisir).`);
    if (after.prepared !== null && after.prepared !== before.prepared) {
        const more = after.prepared - (before.prepared ?? 0);
        lines.push(`Sorts préparés : ${before.prepared ?? 0} → ${after.prepared} (${plural(more, 'sort')} de plus à préparer).`);
    }
    return lines;
}

/**
 * Ce qui change au niveau suivant.
 * @param {Object} character - fiche au format de sauvegarde
 * @returns {{ canLevel: false, from: number, reason: string }
 *   | { canLevel: true, from: number, to: number, classKnown: boolean, hp: Object, sections: Array<{ title: string, lines: string[] }> }}
 */
export function planLevelUp(character) {
    const record = character && typeof character === 'object' ? character : {};
    const dFrom = deriveCharacter(record);
    if (dFrom.level >= MAX_LEVEL) return { canLevel: false, from: dFrom.level, reason: 'Niveau 20 : c\'est le niveau maximum.' };
    const to = dFrom.level + 1;
    const next = { ...record, char_level: String(to) };
    const dTo = deriveCharacter(next);
    const classKnown = Boolean(dFrom.classSlug);
    const hp = hitPointsPlan(record, dFrom, next, dTo);

    const sections = [];
    const add = (title, lines) => { if (lines.length) sections.push({ title, lines }); };
    const general = [`Dés de vie : ${to} au total (un de plus ; les dés déjà utilisés ne changent pas).`];
    if (dTo.pb !== dFrom.pb) general.push(`Bonus de maîtrise : ${signed(dFrom.pb)} → ${signed(calculateProficiencyBonus(to))} (calculé par la fiche).`);
    add('Général', general);
    add('Dons', featLines(next, to));
    if (classKnown) {
        add('Classe', [...classLines(dFrom, dTo), ...baseFeatureLines(dTo.classSlug, to)]);
        add('Sous-classe', subclassLines(dFrom, dTo, to));
        add('Sorts', [...spellCountLines(dTo.classSlug, dFrom.level, to), ...spellSlotLines(dFrom, dTo), ...subclassSpellLines(dTo, to)]);
    } else {
        add('Classe', ['Classe non reconnue (ou multiclasse) : seuls le niveau et les points de vie sont calculés ; vérifiez le reste dans le manuel.']);
    }
    return { canLevel: true, from: dFrom.level, to, classKnown, hp, sections };
}

/**
 * Modifications à enregistrer.
 * @param {ReturnType<typeof planLevelUp>} plan
 * @param {{ mode: 'fixed'|'roll', roll?: number|string, addToCurrent?: boolean }} choice
 * @returns {Object} patch (char_level ; hp_max si c'est un nombre seul et le gain connu ; hp_current sur demande)
 */
export function levelUpPatch(plan, choice = {}) {
    if (!plan?.canLevel) return {};
    const patch = { char_level: String(plan.to) };
    const gain = hitPointGain(plan.hp, choice);
    if (gain === null) return patch;
    if (plan.hp.maxIsNumber) patch.hp_max = String(plan.hp.oldMax + gain);
    if (choice.addToCurrent && plan.hp.currentIsNumber) patch.hp_current = String(plan.hp.oldCurrent + gain);
    return patch;
}
