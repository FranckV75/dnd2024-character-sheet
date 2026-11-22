// =============================================================================
// ODYSSEY.JS (règles) - Mode « Odyssée des Seigneurs Dragons », réglé fiche par fiche
//
// Étude : docs/etudes/MODE_ODYSSEE.md (réponses de Franck du 21/11/2026, section 6).
// Sauvegarde : clé facultative « odyssey_mode », qui vaut "off" quand le mode est coupé. Clé
// absente, ou toute autre valeur : mode ACTIF (toutes les fiches d'avant, sans rien y écrire).
// La clé n'est écrite que lorsque le joueur décoche la case du menu « Gestion » (js/ui/odyssey.js) ;
// recocher la retire : la fiche redevient strictement celle d'avant (même empreinte, rien à renvoyer
// au compte). Elle n'est jamais dans la fiche vierge (js/state/schema.js : migrate.js l'ajouterait
// à toutes les fiches). L'ancien site (v3) l'ignore (V4_ONLY_KEYS, js/cloud/sync.js).
//
// Mode coupé : les 6 espèces, les 12 sous-classes et le style de combat de l'Odyssée ne sont plus
// PROPOSÉS dans les listes. Ce que la fiche utilise déjà reste proposé, affiché et calculé : aucune
// règle de calcul ne lit ce mode. L'encadré « Odyssée » de l'onglet 3 n'est caché que s'il est vide.
// Case heroic_inspiration (onglet Combat) : « Points de Foi » mode actif (maîtrise + Sagesse à chaque
// niveau, remis par « Passer au niveau »), « Inspiration héroïque » mode coupé (une seule à la fois).
// Les points de Foi remplacent les « points de héros » du guide du MJ, PAS l'Inspiration héroïque du
// manuel : mode actif, un Humain (Ingénieux) ou un Champion niveau 10+ la note avec un bouton à part
// sous la case (clé facultative « odyssey_inspiration » : "1" = allumée ; absente = éteinte, jamais
// dans la fiche vierge, comme odyssey_mode ; V4_ONLY_KEYS). odysseyInspirationUseful dit quand il sert.
// Repère de l'Odyssée dans les données : champ source = "Odyssée" (js/data/dd-rules.js pour les
// espèces et les sous-classes, js/data/feats.js pour le style Hoplite).
// Fonctions pures. Testé : tests/odyssey.test.js.
// =============================================================================

import { DD_RULES } from '../data/dd-rules.js';
import { FEATS_DATA } from '../data/feats.js';
import { FEAT_SLOT_ORDER, OPTIONAL_KEY_DEFAULTS } from '../state/schema.js';
import { classSlug } from './identity.js';
import { subclassId } from './class-features.js';
import { speciesSlug } from './species.js';
import { isHuman } from './feats.js';
import { subclassFeatures } from './subclass-features.js';
import { signed } from './numbers.js';
import { FAITH_FAVORS } from '../data/faith-favors.js';

export const ODYSSEY_MODE_KEY = 'odyssey_mode';
/** Valeur du champ « source » des données venues de L'Odyssée des Seigneurs Dragons */
export const ODYSSEY_SOURCE = 'Odyssée';
const MODE_OFF = 'off';

/**
 * Place de la barre du haut (#save-status), en caractères, selon l'écran (css/toolbar.css) :
 *  - tablette, menu « Gestion » replié : une ligne (une centaine de caractères à 768 px) ;
 *  - tablette, menu ouvert (c'est là qu'est la case) : deux lignes ;
 *  - ordinateur : colonne étroite, deux lignes courtes.
 */
export const STATUS_ROOM = 95;
export const STATUS_ROOM_OPEN = 180;
export const STATUS_ROOM_NARROW = 56;

/** Nom de la case du menu « Gestion » */
export const ODYSSEY_MODE_LABEL = 'Mode Odyssée';

/** Texte brut (les anciennes sauvegardes peuvent contenir un peu de HTML) */
const plain = (value) => String(value ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

/** La donnée (espèce, sous-classe, don) vient-elle de l'Odyssée ? */
export const fromOdyssey = (entry) => entry?.source === ODYSSEY_SOURCE;

/** Dons de l'Odyssée (aujourd'hui : le style de combat Hoplite) */
const ODYSSEY_FEAT_IDS = Object.freeze(Object.keys(FEATS_DATA).filter((id) => fromOdyssey(FEATS_DATA[id])));

/**
 * Le mode Odyssée est-il actif pour cette fiche ? Oui, sauf si elle dit "off".
 * @param {Object} record - fiche au format de sauvegarde
 * @returns {boolean}
 */
export function odysseyActive(record) {
    return record?.[ODYSSEY_MODE_KEY] !== MODE_OFF;
}

/**
 * Modification à enregistrer quand le joueur coche ou décoche la case.
 * @param {Object} record
 * @param {boolean} active - mode voulu
 * @returns {Object} {} si rien ne change (une fiche active sans la clé le reste) ; { odyssey_mode:
 *          "off" } pour couper ; { odyssey_mode: undefined } pour réactiver : la clé est retirée (une
 *          valeur undefined n'est ni enregistrée ni comptée dans l'empreinte, canonicalJSON de
 *          js/cloud/sync.js), la fiche décochée puis recochée est la même qu'avant.
 */
export function setOdysseyModePatch(record, active) {
    if (Boolean(active) === odysseyActive(record)) return {};
    return { [ODYSSEY_MODE_KEY]: active ? undefined : MODE_OFF };
}

/** Don noté dans un emplacement (valeur nettoyée, comme featSlots de js/rules/feats.js) */
const slotFeat = (record, slot) => plain(record?.[`feat_${slot}`]);

/**
 * Ce que la fiche utilise déjà de l'Odyssée, lu avec les outils de la fiche (noms français,
 * anglais, anciennes écritures) : speciesSlug (js/rules/species.js) et subclassId
 * (js/rules/class-features.js, la lecture de deriveCharacter).
 * @param {Object} record
 * @returns {{ species: string, subclass: string, feats: string[], box: boolean }}
 *          species, subclass : identifiants de DD_RULES ('' si la fiche n'en utilise pas de l'Odyssée) ;
 *          feats : dons de l'Odyssée notés dans un emplacement de la fiche ;
 *          box : l'encadré de l'onglet 3 a un destin héroïque ou des points de renommée
 */
export function odysseyUse(record) {
    const species = speciesSlug(record);
    const subclass = subclassId(record?.char_subclass, classSlug(plain(record?.char_class)));
    const renown = plain(record?.glory_score);
    return {
        species: fromOdyssey(DD_RULES.species[species]) ? species : '',
        subclass: fromOdyssey(DD_RULES.subclasses[subclass]) ? subclass : '',
        feats: ODYSSEY_FEAT_IDS.filter((id) => FEAT_SLOT_ORDER.some((slot) => slotFeat(record, slot) === id)),
        // Renommée : un nombre autre que 0, ou un texte (jamais effacé par la fiche)
        box: plain(record?.heroic_destiny) !== '' || (renown !== '' && Number(renown) !== 0)
    };
}

/**
 * Espèces proposées dans la liste du haut de la fiche : toutes quand le mode est actif ; sinon
 * celles du manuel, plus celle de l'Odyssée que la fiche utilise déjà.
 * @param {Object} record
 * @returns {Object[]} entrées de DD_RULES.species, dans l'ordre des données
 */
export function proposedSpecies(record) {
    const all = Object.entries(DD_RULES.species);
    if (odysseyActive(record)) return all.map(([, entry]) => entry);
    const used = odysseyUse(record).species;
    return all.filter(([slug, entry]) => !fromOdyssey(entry) || slug === used).map(([, entry]) => entry);
}

/**
 * Sous-classes proposées pour une classe : toutes quand le mode est actif ; sinon celles du
 * manuel, plus celle de l'Odyssée que la fiche utilise déjà. (Le contrôle qui vide la sous-classe
 * au changement de classe lit, lui, la liste complète : js/ui/sheet.js.)
 * @param {Object} record
 * @param {string} slug - identifiant de la classe (classSlug)
 * @returns {Object[]} entrées de DD_RULES.subclasses, dans l'ordre des données
 */
export function proposedSubclasses(record, slug) {
    if (!slug) return [];
    const all = Object.entries(DD_RULES.subclasses).filter(([, entry]) => entry.class === slug);
    if (odysseyActive(record)) return all.map(([, entry]) => entry);
    const used = odysseyUse(record).subclass;
    return all.filter(([id, entry]) => !fromOdyssey(entry) || id === used).map(([, entry]) => entry);
}

/**
 * Dons retirés de la liste d'un emplacement : aucun quand le mode est actif ; sinon les dons de
 * l'Odyssée, sauf celui que cet emplacement contient déjà.
 * @param {Object} record
 * @param {number|string} slot - numéro de l'emplacement (feat_<numéro>)
 * @returns {string[]} identifiants de FEATS_DATA
 */
export function hiddenFeatIds(record, slot) {
    if (odysseyActive(record)) return [];
    const chosen = slotFeat(record, slot);
    return ODYSSEY_FEAT_IDS.filter((id) => id !== chosen);
}

/** Nom d'un don de l'Odyssée dans une phrase : « style Hoplite » */
function featLabel(id) {
    const feat = FEATS_DATA[id];
    const name = feat.name.replace(/\s*\(Odyssée\)\s*$/, '');
    return feat.type === 'Style de combat' ? `style ${name}` : name;
}

/**
 * Ce que la fiche garde de l'Odyssée, en mots : « Centaure », « L'Hoplite », « style Hoplite »,
 * « encadré Odyssée » (destin héroïque ou points de renommée).
 * @param {Object} record
 * @returns {string[]} liste vide si la fiche n'utilise rien de l'Odyssée
 */
export function odysseyKept(record) {
    const use = odysseyUse(record);
    return [
        use.species ? DD_RULES.species[use.species].nameFr : '',
        use.subclass ? DD_RULES.subclasses[use.subclass].nameFr : '',
        ...use.feats.map(featLabel),
        use.box ? 'encadré Odyssée' : ''
    ].filter(Boolean);
}

/**
 * L'encadré « Odyssée des Seigneurs Dragons » (onglet 3) a-t-il sa place sur la fiche ? Toujours
 * quand le mode est actif ; mode coupé, seulement s'il contient quelque chose.
 * @param {Object} record
 * @returns {boolean}
 */
export function odysseyBoxUseful(record) {
    return odysseyActive(record) || odysseyUse(record).box;
}

/**
 * Case de l'onglet Combat (clé heroic_inspiration, inchangée) : son libellé, le nom d'un de ses
 * points (boutons − / +) et son maximum.
 *  - Mode actif : « Points de Foi » (guide du MJ de l'Odyssée, p. 92, « Sacrifices et prières » : ils
 *    remplacent les « points de héros » du guide du MJ, pas l'Inspiration héroïque, qui a son propre
 *    bouton : odysseyInspirationUseful). Pas de maximum fixe : voir faithPerLevel.
 *  - Mode coupé : « Inspiration héroïque » (manuel 2024) : on l'a ou on ne l'a pas, jamais plus
 *    d'une à la fois (une deuxième se donne à un autre personnage joueur).
 * @param {Object} record
 * @returns {{ label: string, noun: string, max: number }}
 */
export function inspirationWording(record) {
    return odysseyActive(record)
        ? { label: 'Points de Foi', noun: 'point de Foi', max: FAITH_MAX }
        : { label: 'Inspiration héroïque', noun: 'Inspiration héroïque', max: 1 };
}

/** Plafond des boutons − / + des points de Foi (le même qu'avant pour la case) */
export const FAITH_MAX = 99;
/** Points de Foi gagnés au moins à chaque niveau (le guide ne dit rien : choix de Franck, 22/11/2026) */
export const FAITH_MIN = 1;

/** Phrase dite quand « + » est refusé : Inspiration héroïque déjà là (mode coupé) */
export const INSPIRATION_ONLY_ONE = "Inspiration héroïque : une seule à la fois ; une autre se donne à un joueur qui n'en a pas.";

/**
 * Points de Foi de l'Odyssée : à chaque niveau, la réserve repart de 0 et reçoit bonus de maîtrise
 * + modificateur de Sagesse (au moins FAITH_MIN).
 * @param {{ pb: number, mods: { wis: number } }} derived - issu de deriveCharacter
 * @returns {{ total: number, pb: number, wis: number, raised: boolean }} raised : le minimum a joué
 */
export function faithPerLevel(derived) {
    const pb = Number(derived?.pb) || 0;
    const wis = Number(derived?.mods?.wis) || 0;
    const sum = pb + wis;
    return { total: Math.max(FAITH_MIN, sum), pb, wis, raised: sum < FAITH_MIN };
}

/** « 5 (maîtrise +3, Sagesse +2) » ; « 1 (maîtrise +2, Sagesse -2, minimum 1) » */
export function faithDetail(faith) {
    return `${faith.total} (maîtrise ${signed(faith.pb)}, Sagesse ${signed(faith.wis)}${faith.raised ? `, minimum ${FAITH_MIN}` : ''})`;
}

/** Pastille sous la case (mode actif) */
export function faithMention(faith) {
    return `+${faith.total} par niveau`;
}

/** Phrase de la pastille au toucher (barre du haut, au plus STATUS_ROOM caractères) */
export function faithSentence(faith) {
    return `Points de Foi : à chaque niveau, la case repart à ${faithDetail(faith)}.`;
}

/** Infobulle de la pastille (souris) : la phrase, et qui s'en charge */
export function faithHint(faith) {
    return `${faithSentence(faith)} « Passer au niveau » le fait pour vous.`;
}

/**
 * Nouvelle valeur de la case au passage de niveau (mode actif) : « N/N », ou null si la case
 * contient du texte libre (« 2 (béni) »), qui n'est jamais réécrit.
 * @param {unknown} value - valeur actuelle de heroic_inspiration
 * @param {number} total - points du nouveau niveau
 * @returns {string|null}
 */
export function faithReset(value, total) {
    const text = String(value ?? '').trim();
    if (text === '' || /^\d+$/.test(text) || /^\d+\s*\/\s*\d+$/.test(text)) return `${total}/${total}`;
    return null;
}

/**
 * Points de Foi disponibles d'après la case : « 3 » ou « 3/5 » → 3 ; vide → 0 ; texte libre → null.
 * @param {unknown} value - valeur de heroic_inspiration
 * @returns {number|null}
 */
export function faithPoints(value) {
    const text = String(value ?? '').trim();
    if (text === '') return 0;
    const match = /^(\d+)(?:\s*\/\s*\d+)?$/.exec(text);
    return match ? Number(match[1]) : null;
}

/** « 1 point », « 3 points » */
export function pointsWord(count) {
    return `${count} point${count > 1 ? 's' : ''}`;
}

/**
 * Paliers de faveurs (js/data/faith-favors.js) avec ce qu'il manque pour chacun.
 * @param {number|null} points - faithPoints de la case ; null : inconnu (texte libre)
 * @returns {Array<Object>} chaque palier, plus missing (0 = possible ; null = inconnu) et status
 */
export function faithFavors(points) {
    return FAITH_FAVORS.map((tier) => {
        const missing = points === null ? null : Math.max(0, tier.cost - points);
        const status = missing === null ? '' : missing === 0 ? 'Possible' : `Il manque ${pointsWord(missing)}`;
        return { ...tier, missing, status };
    });
}

/** Première phrase de la fenêtre des faveurs : les points de la case */
export function faithPointsSentence(points) {
    if (points === null) return 'La case des points de Foi contient du texte : comptez vos points vous-même.';
    if (points === 0) return "Vous n'avez aucun point de Foi pour l'instant.";
    return `Vous avez ${pointsWord(points)} de Foi.`;
}

/** Comment payer une faveur, dit dans la fenêtre */
export const FAITH_SPEND = 'Chaque faveur demandée à un dieu coûte 1, 3 ou 5 points : retirez-les avec le bouton − de la case.';

/** Clé facultative de l'Inspiration héroïque notée à part des points de Foi (mode actif) */
export const ODYSSEY_INSPIRATION_KEY = 'odyssey_inspiration';
/** Nom du bouton */
export const ODYSSEY_INSPIRATION_LABEL = 'Inspiration héroïque';

/** L'Inspiration héroïque notée à part (mode actif) est-elle allumée ? ("1" ; absente ou "" : non) */
export function odysseyInspirationLit(record) {
    return String(record?.[ODYSSEY_INSPIRATION_KEY] ?? OPTIONAL_KEY_DEFAULTS[ODYSSEY_INSPIRATION_KEY]).trim() === '1';
}

/**
 * Qui donne l'Inspiration héroïque à ce personnage, en mots (vide : personne).
 *  - Humain, trait Ingénieux : à la fin de chaque repos long (isHuman, js/rules/feats.js) ;
 *  - Champion niveau 10+, « Héros du champ d'honneur » (subclassFeatures, id guerrier_heroique).
 * @param {Object} record
 * @param {Object} derived - deriveCharacter(record)
 * @returns {string[]}
 */
export function odysseyInspirationSources(record, derived) {
    return [
        isHuman(record) ? 'Humain (Ingénieux) : vous la gagnez à la fin de chaque repos long.' : '',
        subclassFeatures(derived ?? {}).reached.some((feature) => feature.id === 'guerrier_heroique')
            ? "Champion (Héros du champ d'honneur) : en combat, vous vous la donnez quand votre tour commence sans elle." : ''
    ].filter(Boolean);
}

/**
 * Le bouton « Inspiration héroïque » a-t-il sa place sous la case des points de Foi ? Seulement en
 * mode actif (mode coupé, la case elle-même est l'Inspiration héroïque), et si le personnage la
 * gagne (Humain, Champion niveau 10+) ou si elle est déjà allumée (jamais cachée allumée).
 * @param {Object} record
 * @param {Object} derived - deriveCharacter(record)
 * @returns {boolean}
 */
export function odysseyInspirationUseful(record, derived) {
    if (!odysseyActive(record)) return false;
    return odysseyInspirationLit(record) || odysseyInspirationSources(record, derived).length > 0;
}

/**
 * Modification à enregistrer quand le joueur touche le bouton : { odyssey_inspiration: "1" } pour
 * l'allumer ; { odyssey_inspiration: undefined } pour l'éteindre (clé retirée : la fiche redevient
 * celle d'avant, même empreinte, comme setOdysseyModePatch).
 * @param {boolean} lit - état voulu
 * @returns {Object}
 */
export function odysseyInspirationPatch(lit) {
    return { [ODYSSEY_INSPIRATION_KEY]: lit ? '1' : undefined };
}

/**
 * Message de la barre du haut après un toucher du bouton : la phrase la plus complète qui tient.
 * @param {boolean} lit - état après le toucher
 * @param {number} [room] - nombre de caractères disponibles (STATUS_ROOM_NARROW : ordinateur)
 * @returns {string}
 */
export function odysseyInspirationMessage(lit, room = STATUS_ROOM) {
    return fitting(lit
        ? ['Inspiration héroïque notée : dépensez-la pour relancer un dé, puis retouchez le bouton.',
            'Inspiration héroïque notée. Retouchez une fois dépensée.']
        : ['Inspiration héroïque dépensée : bouton éteint. Retouchez-le quand vous en regagnez une.',
            'Inspiration héroïque dépensée : bouton éteint.'], room);
}

/** Infobulle du bouton (souris) : ce qu'elle fait, qui la donne, comment s'en servir */
export function odysseyInspirationHint(record, derived) {
    return ['Inspiration héroïque, à part des points de Foi : dépensez-la pour relancer un dé que vous venez de lancer.',
        ...odysseyInspirationSources(record, derived),
        "Touchez pour noter que vous l'avez, retouchez une fois dépensée."].join(' ');
}

/**
 * Phrase du repos long pour un Humain (Ingénieux) : mode actif, elle dit où noter l'Inspiration.
 * @param {Object} record
 * @returns {string}
 */
export function restInspirationSentence(record) {
    return odysseyActive(record)
        ? 'Humain (Ingénieux) : vous gagnez l’Inspiration héroïque (bouton sous les Points de Foi).'
        : 'Humain (Ingénieux) : vous gagnez l’Inspiration héroïque.';
}

/** « Cette fiche garde : Centaure, style Hoplite. » ('' si elle ne garde rien) */
function keptSentence(record) {
    const kept = odysseyKept(record);
    return kept.length ? `Cette fiche garde : ${kept.join(', ')}.` : '';
}

/**
 * Phrase d'aide de la case (infobulle à la souris) ; mode coupé, elle dit aussi ce que la fiche garde.
 * @param {Object} record
 * @returns {string}
 */
export function odysseyModeHint(record) {
    const hint = "Campagne de L'Odyssée des Seigneurs Dragons. Décochez pour jouer une autre campagne : les espèces, "
        + "les sous-classes et le style de combat de l'Odyssée ne sont plus proposés. Ce que votre fiche utilise déjà "
        + 'reste en place. Recochez pour tout retrouver.';
    const kept = odysseyActive(record) ? '' : keptSentence(record);
    return kept ? `${hint} ${kept}` : hint;
}

/** La phrase la plus complète qui tient dans la place donnée ; à défaut la dernière, la plus courte */
const fitting = (choices, room) => choices.find((text) => text.length <= room) ?? choices.at(-1);

/**
 * Message écrit dans la barre du haut après un toucher de la case. Au doigt, c'est la seule
 * explication de la case (l'infobulle ne se voit qu'à la souris) : il commence toujours par dire
 * que le mode vient d'être coupé (ou réactivé), puis ce que cela change, ce que la fiche garde et
 * comment revenir en arrière. La phrase la plus complète qui tient dans la place est choisie ; sur
 * ordinateur (colonne étroite) il reste l'essentiel, le détail est dans l'infobulle de la case.
 * @param {Object} record - fiche APRÈS le changement
 * @param {number} [room] - nombre de caractères disponibles (STATUS_ROOM_OPEN : menu ouvert sur tablette)
 * @returns {string}
 */
export function odysseyModeMessage(record, room = STATUS_ROOM_OPEN) {
    if (odysseyActive(record)) {
        const on = `${ODYSSEY_MODE_LABEL} actif : ses espèces, sous-classes et style de combat sont de nouveau proposés.`;
        return fitting([`${on} Décochez pour une autre campagne.`, on, `${ODYSSEY_MODE_LABEL} actif : ses choix sont de nouveau proposés.`], room);
    }
    const off = `${ODYSSEY_MODE_LABEL} coupé : ses espèces, sous-classes et style de combat ne sont plus proposés.`;
    const short = `${ODYSSEY_MODE_LABEL} coupé : ses choix ne sont plus proposés.`;
    const back = 'Recochez pour tout retrouver.';
    const kept = keptSentence(record);
    if (!kept) return fitting([`${off} ${back}`, off, short], room);
    return fitting([
        `${off} ${kept} ${back}`,
        `${short} ${kept} ${back}`,
        `${short} ${kept}`,
        `${ODYSSEY_MODE_LABEL} coupé. ${kept}`,
        `${ODYSSEY_MODE_LABEL} coupé. Votre fiche garde ce qu'elle utilise déjà.`
    ], room);
}

/**
 * Choix de l'Odyssée (espèce, sous-classe, don) que la fiche vient d'abandonner alors que le mode
 * est coupé : ils sortent aussitôt de leur liste (proposedSpecies, proposedSubclasses,
 * hiddenFeatIds). Mode actif, rien ne sort des listes. L'encadré de l'onglet 3 n'est pas un choix
 * de liste : il n'est jamais cité ici.
 * @param {Object} before - fiche avant la modification
 * @param {Object} after - fiche après
 * @returns {string[]} noms, comme dans odysseyKept (« Centaure », « L'Hoplite », « style Hoplite »)
 */
export function odysseyDropped(before, after) {
    if (odysseyActive(before) || odysseyActive(after)) return [];
    const was = odysseyUse(before);
    const is = odysseyUse(after);
    return [
        was.species && was.species !== is.species ? DD_RULES.species[was.species].nameFr : '',
        was.subclass && was.subclass !== is.subclass ? DD_RULES.subclasses[was.subclass].nameFr : '',
        ...was.feats.filter((id) => !is.feats.includes(id)).map(featLabel)
    ].filter(Boolean);
}

/**
 * Message de la barre du haut quand un choix de l'Odyssée vient de sortir de sa liste (mauvais
 * toucher dans une liste, mode coupé) : il dit comment le retrouver. Phrases sans accord (les noms
 * sont masculins ou féminins).
 * @param {Object} before - fiche avant la modification
 * @param {Object} after - fiche après
 * @param {number} [room] - nombre de caractères disponibles (STATUS_ROOM : une ligne sur tablette)
 * @returns {string} '' si rien n'est sorti des listes
 */
export function odysseyDroppedMessage(before, after, room = STATUS_ROOM) {
    const dropped = odysseyDropped(before, after);
    if (!dropped.length) return '';
    const names = dropped.join(', ');
    const subject = names.charAt(0).toUpperCase() + names.slice(1);
    const box = `« ${ODYSSEY_MODE_LABEL} »`;
    return fitting(dropped.length === 1
        ? [
            `${subject} n'est plus dans la liste : recochez ${box} pour retrouver ce choix.`,
            `${subject} : recochez ${box} pour retrouver ce choix.`,
            `${subject} : pour ce choix, recochez ${box}.`,
            `${subject} : recochez ${box}.`
        ]
        : [
            `${subject} ne sont plus dans les listes : recochez ${box} pour retrouver ces choix.`,
            `${subject} : recochez ${box} pour retrouver ces choix.`,
            `${subject} : pour ces choix, recochez ${box}.`,
            `${subject} : recochez ${box}.`
        ], room);
}
