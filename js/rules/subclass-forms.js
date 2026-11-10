// =============================================================================
// SUBCLASS-FORMS.JS (règles) - Formes du Cercle de la Lune et du Cercle des Étoiles (lot 7)
// (fonctions pures, sans DOM)
//
// La « carte » de la forme est une liste de lignes chiffrées affichée sous la capacité, dans le bloc
// Sous-classe (onglet Aptitudes & Traits) : MANUAL_AUTOMATION de js/rules/subclass-features.js.
// La forme en cours est une case à cocher du même bloc (choix « wild_shape » ou « starry_form » de
// subclass_choices, js/data/subclass-choices.js) : elle allume les repères près de la CA, de la
// sauvegarde de Constitution et de la Vitesse (formNotes), et Plénitude stellaire (SUBCLASS_DEFENSES).
// La fiche ne coche aucune case de Forme sauvage et n'écrit pas les PV temporaires : elle affiche
// les chiffres, le joueur les reporte.
//
// Règles du Player's Handbook 2024 anglais :
//  - Forme sauvage du Druide (niveau 2, p. 81) : formes connues 4 / 6 / 8 aux niveaux 2 / 4 / 8,
//    FP maximal 1/4 / 1/2 / 1, vol permis à partir du niveau 8 ; durée = moitié du niveau de Druide
//    (heures, arrondi inférieur) ; PV temporaires = niveau de Druide ; utilisations 2 / 3 / 4 aux
//    niveaux 2 / 6 / 17 (getClassResourceInfo, js/rules/logic.js) ;
//  - Cercle de la Lune (p. 86-87) : Formes du cercle (niveau 3 : FP max = niveau ÷ 3 arrondi
//    inférieur, CA 13 + Sagesse si plus que celle de la bête, PV temporaires = 3 × niveau) ; sorts du
//    cercle lançables en forme ; Formes du cercle améliorées (niveau 6 : dégâts radiants au choix,
//    Sagesse ajoutée aux sauvegardes de Constitution) ; Foulée sélène (10) ; Forme lunaire (14 : +2d10
//    radiants une fois par tour, Foulée sélène partagée) ;
//  - Cercle des Étoiles (p. 88-89) : Forme stellaire (niveau 3, 10 minutes, constellation Archer,
//    Calice ou Dragon) ; Constellations scintillantes (10 : 2d8, vol 6 m du Dragon, changement à chaque
//    tour) ; Plénitude stellaire (14 : Résistance C/P/T en forme).
// =============================================================================

import { CONSTELLATIONS } from '../data/subclass-choices.js';
import { SUBCLASS_SPELLS } from '../data/subclass-spells.js';

const levelOf = (derived) => Number(derived?.level) || 1;
const wisOf = (derived) => Number(derived?.mods?.wis) || 0;
const pbOf = (derived) => Number(derived?.pb) || 2;
const signed = (n) => `${n >= 0 ? '+' : ''}${n}`;
/** « 1d8 + 3 », « 1d8 - 1 », « 1d8 » (modificateur nul) */
const withMod = (dice, n) => (n > 0 ? `${dice} + ${n}` : n < 0 ? `${dice} - ${-n}` : dice);

/** Le personnage est un druide de ce cercle, au niveau 3 au moins */
function isCircle(derived, subclass, minLevel = 3) {
    return derived?.classSlug === 'druid' && derived.subclass === subclass && levelOf(derived) >= minLevel;
}

/**
 * Forme sauvage de base du Druide (PHB 2024, p. 81).
 * @param {number} level - niveau de Druide
 * @returns {{ uses: number, knownForms: number, maxCR: string, fly: boolean, hours: number, tempHp: number }}
 */
export function wildShapeBase(level) {
    const lvl = Number(level) || 1;
    return {
        uses: lvl >= 17 ? 4 : lvl >= 6 ? 3 : lvl >= 2 ? 2 : 0,
        knownForms: lvl >= 8 ? 8 : lvl >= 4 ? 6 : 4,
        maxCR: lvl >= 8 ? '1' : lvl >= 4 ? '1/2' : '1/4',
        fly: lvl >= 8,
        hours: Math.floor(lvl / 2),
        tempHp: lvl
    };
}

/**
 * Formes du cercle (Cercle de la Lune, niveau 3) : remplacent le FP maximal et les PV temporaires de
 * la Forme sauvage de base ; la CA de forme ne compte que si elle dépasse celle de la bête.
 * @param {number} level - niveau de Druide
 * @param {number} wis - modificateur de Sagesse
 * @returns {{ maxCR: number, ac: number, tempHp: number }}
 */
export function moonFormNumbers(level, wis) {
    const lvl = Number(level) || 1;
    return { maxCR: Math.floor(lvl / 3), ac: 13 + (Number(wis) || 0), tempHp: 3 * lvl };
}

/** Nombre de d8 de l'Archer et du Calice : 1, puis 2 au niveau 10 (Constellations scintillantes) */
export const starryDice = (level) => ((Number(level) || 1) >= 10 ? 2 : 1);

/**
 * Chiffres d'une constellation pour le personnage. Le toucher de l'Archer est celui d'une attaque de
 * sort de Druide : maîtrise + Sagesse, calculé ici (le menu de caractéristique d'incantation de
 * l'onglet Magie peut être vide) ; un focaliseur magique n'est pas compté.
 * @param {Object} derived - deriveCharacter() (level, pb, mods)
 * @param {string} id - 'archer' | 'chalice' | 'dragon'
 * @returns {string} '' si la constellation est inconnue
 */
export function constellationNumbers(derived, id) {
    const dice = `${starryDice(levelOf(derived))}d8`;
    const wis = wisOf(derived);
    if (id === 'archer') {
        return `à l'activation puis par une action Bonus à chacun de vos tours, attaque de sort à distance ${signed(pbOf(derived) + wis)} contre une créature à 18 m, ${withMod(dice, wis)} dégâts radiants.`;
    }
    if (id === 'chalice') {
        return `quand un sort lancé avec un emplacement rend des PV, vous ou une créature à 9 m récupérez ${withMod(dice, wis)} PV (une fois par sort).`;
    }
    if (id === 'dragon') {
        return 'aux tests d\'Intelligence et de Sagesse, et aux sauvegardes de Constitution pour maintenir la Concentration, un 9 ou moins au d20 compte comme un 10'
            + (levelOf(derived) >= 10 ? ' ; vitesse de vol de 6 m, vol stationnaire.' : '.');
    }
    return '';
}

/** Constellation choisie et validée (derived.subclassChoices), ou '' */
export function chosenConstellation(derived) {
    const id = derived?.subclassChoices?.constellation;
    return CONSTELLATIONS.some(([value]) => value === id) ? id : '';
}

/** La forme est cochée dans le bloc Sous-classe (choix déjà validés par deriveCharacter) */
export const inWildShape = (derived) => isCircle(derived, 'circle_of_the_moon') && derived.subclassChoices?.wild_shape === 'on';
export const inStarryForm = (derived) => isCircle(derived, 'circle_of_the_stars') && derived.subclassChoices?.starry_form === 'on';

/**
 * Carte de la Forme sauvage du Cercle de la Lune : lignes chiffrées.
 * @param {Object} derived - deriveCharacter()
 * @returns {string[]} [] si le personnage n'est pas un druide de la Lune de niveau 3+
 */
export function moonFormLines(derived) {
    if (!isCircle(derived, 'circle_of_the_moon')) return [];
    const level = levelOf(derived);
    const wis = wisOf(derived);
    const base = wildShapeBase(level);
    const moon = moonFormNumbers(level, wis);
    const lines = [
        `Bête de FP ${moon.maxCR} au maximum (niveau ÷ 3) ; ${base.knownForms} formes connues, ${base.fly ? 'vitesse de vol permise' : 'sans vitesse de vol (permise au niveau 8)'}.`,
        `CA en forme : ${moon.ac} (13 + Sagesse ${signed(wis)}), si la CA de la bête est plus basse.`,
        `PV temporaires en prenant la forme : ${moon.tempHp} (3 × niveau), à reporter vous-même.`,
        `Durée : ${base.hours} h au plus ; action Bonus et une case Forme sauvage à cocher (${base.uses} au total, une rendue au repos court, toutes au repos long).`
    ];
    if (level >= 18) {
        lines.push('Sorts lançables en forme : tous vos sorts, sauf composante matérielle coûteuse ou consommée (Sorts de bête).');
    } else {
        const spells = (SUBCLASS_SPELLS.circle_of_the_moon ?? []).filter(([from]) => from <= level).map(row => row[2]);
        if (spells.length) lines.push(`Sorts lançables en forme : ${spells.join(', ')}.`);
    }
    if (level >= 6) {
        lines.push(wis > 0
            ? `Sauvegarde de Constitution en forme : celle de la bête ${signed(wis)} (Sagesse).`
            : 'Sauvegarde de Constitution en forme : la Sagesse s\'y ajoute, rien à ajouter tant qu\'elle n\'est pas positive.');
        lines.push('Chaque attaque de la forme peut infliger des dégâts radiants au lieu de son type (au choix à chaque coup).');
    }
    if (level >= 10) lines.push(`Foulée sélène : ${Math.max(1, wis)} case${Math.max(1, wis) > 1 ? 's' : ''} dans l'onglet Combat (téléportation de 9 m).`);
    if (level >= 14) {
        lines.push('Forme lunaire : +2d10 dégâts radiants une fois par tour sur une cible touchée par une attaque de la forme ; Foulée sélène peut emmener une créature consentante à 3 m.');
    }
    return lines;
}

/**
 * Carte de la Forme stellaire du Cercle des Étoiles : lignes chiffrées, constellation choisie d'abord.
 * @param {Object} derived - deriveCharacter()
 * @returns {string[]} [] si le personnage n'est pas un druide des Étoiles de niveau 3+
 */
export function starryFormLines(derived) {
    if (!isCircle(derived, 'circle_of_the_stars')) return [];
    const level = levelOf(derived);
    const chosen = chosenConstellation(derived);
    const ordered = [...CONSTELLATIONS].sort(([a], [b]) => (b === chosen) - (a === chosen));
    const lines = [
        'Durée : 10 minutes ; lumière vive à 3 m, faible 3 m plus loin ; action Bonus et une case Forme sauvage à cocher vous-même.',
        ...ordered.map(([id, label]) => `${label}${id === chosen ? ' (choisie)' : ''} : ${constellationNumbers(derived, id)}`),
        level >= 10
            ? 'Au début de chacun de vos tours en forme, vous pouvez changer de constellation.'
            : 'Avant le niveau 10, la constellation reste la même jusqu\'à la fin de la forme.'
    ];
    if (level >= 14) lines.push('Plénitude stellaire : Résistance aux dégâts contondants, perforants et tranchants pendant la forme.');
    return lines;
}

/**
 * Repères près des valeurs pendant la forme (format FeatNote de feat-effects.js, classFeature: true),
 * fusionnés par classFeatureNotes (class-features.js). Rien quand la forme n'est pas cochée (Plénitude
 * stellaire, grisée hors forme, est dans SUBCLASS_DEFENSES).
 * @param {Object} derived - deriveCharacter() (subclassChoices)
 * @returns {Object<string, Object[]>}
 */
export function formNotes(derived = {}) {
    const zones = {};
    const add = (zone, featId, featName, text, extra = {}) => {
        (zones[zone] ??= []).push({ featId, featName, text, ...extra, classFeature: true });
    };
    const level = levelOf(derived);
    const wis = wisOf(derived);
    if (inWildShape(derived)) {
        const moon = moonFormNumbers(level, wis);
        add('armorClass', 'formes_du_cercle', 'Formes du cercle',
            `En Forme sauvage : CA ${moon.ac} (13 + Sagesse) si celle de la bête est plus basse. La CA affichée reste celle du druide.`,
            { mention: `Forme : CA ${moon.ac}` });
        if (level >= 6 && wis > 0) {
            add('saves.con', 'formes_du_cercle_ameliorees', 'Formes du cercle améliorées',
                `En Forme sauvage : ${signed(wis)} (Sagesse) à ajouter à la sauvegarde de Constitution de la bête ; le nombre affiché est celui du druide.`);
        }
    }
    if (inStarryForm(derived) && chosenConstellation(derived) === 'dragon') {
        add('saves.con', 'forme_etoilee', 'Forme stellaire (Dragon)',
            'Sauvegarde pour maintenir la Concentration : un 9 ou moins au d20 compte comme un 10.');
        if (level >= 10) {
            add('speed', 'constellations_scintillantes', 'Constellations scintillantes (Dragon)',
                'En Forme stellaire : vitesse de vol de 6 m, vol stationnaire.', { mention: 'Vol 6\u00a0m' });
        }
    }
    return zones;
}
