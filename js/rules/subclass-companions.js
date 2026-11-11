// =============================================================================
// SUBCLASS-COMPANIONS.JS (règles) - Cartes des compagnons et familiers de sous-classe (lot 7)
//
// Maître des bêtes (bête primordiale), Conclave des Amazones (stimfée, puis monture d'Outremonde du
// sort Trouver une monture au niveau 5), Serment du Seigneur Dragon
// (pseudodragon, puis dragon lié au niveau 7) : la fiche calcule une carte de statistiques d'après
// le niveau, le bonus de maîtrise et les caractéristiques du personnage, et les choix mémorisés
// (clé subclass_choices : bête, type de la Frappe, apparence, couleur de l'œuf).
//
// PV actuels des compagnons : clé facultative propre à la v4 « subclass_companions » =
//   { "<sous-classe>.<compagnon>": { "hp": 23 } }
// par exemple { "beast_master.primal_companion": { "hp": 23 } }. Absente des anciennes fiches (= PV
// pleins) ; l'ancien site (v3) l'ignore (V4_ONLY_KEYS, js/cloud/sync.js). Une valeur illisible vaut
// PV pleins ; elle est ramenée entre 0 et le maximum à l'affichage, sans être réécrite.
// Repos long : PV pleins (entrées de la sous-classe actuelle effacées) ; repos court : rien.
// Données : js/data/subclass-companions.js. Fonctions pures : le personnage reçu n'est jamais modifié.
// =============================================================================

import {
    PRIMAL_BEASTS, BEAST_STRIKE_TYPES, STIMFEE, STIMFEE_LOOKS, PSEUDODRAGON, DRAGONLINGS, DRAGONLING_SENSES, YOUNG_DRAGON_SENSES,
    OTHERWORLDLY_STEED, STEED_TYPES, STEED_LEVELS
} from '../data/subclass-companions.js';
import { ABILITY_IDS } from '../data/constants.js';
import { hunterMarkDie } from './character.js';
import { signed } from './numbers.js';

export const SUBCLASS_COMPANIONS_KEY = 'subclass_companions';

/** Clés des compagnons (« <sous-classe>.<compagnon> ») */
export const COMPANION_KEYS = Object.freeze({
    primal: 'beast_master.primal_companion',
    stimfee: 'amazon_warrior.stimfee',
    steed: 'amazon_warrior.steed',
    pseudodragon: 'oath_of_the_dragonlords.pseudodragon',
    dragon: 'oath_of_the_dragonlords.dragon'
});

/**
 * Un choix qui fait venir une NOUVELLE créature (PV pleins) : { sous-classe: { choix: compagnon } }.
 * Monture de l'Amazone : type et niveau du sort choisis en relançant Trouver une monture.
 */
const NEW_CREATURE_ON = {
    beast_master: { beast: COMPANION_KEYS.primal },
    amazon_warrior: { steed: COMPANION_KEYS.steed, steed_level: COMPANION_KEYS.steed }
};

const ABILITY_LABELS = { str: 'FOR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'SAG', cha: 'CHA' };
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const modOf = (score) => Math.floor((score - 10) / 2);
/** « 1d8 + 5 », « 1d4 - 1 », « 1d6 » */
const dice = (die, flat) => (flat > 0 ? `${die} + ${flat}` : flat < 0 ? `${die} - ${-flat}` : die);

/**
 * PV actuels enregistrés (toutes sous-classes), ou {} si la clé est absente ou abîmée.
 * @param {Object} character
 * @returns {Object<string, { hp?: * }>}
 */
export function companionsState(character) {
    const state = character?.[SUBCLASS_COMPANIONS_KEY];
    return isPlainObject(state) ? state : {};
}

/**
 * PV actuels d'un compagnon : la valeur enregistrée ramenée entre 0 et max ; absente ou illisible :
 * max (PV pleins).
 * @param {Object} character
 * @param {string} key - COMPANION_KEYS
 * @param {number} max
 * @returns {number}
 */
export function companionHp(character, key, max) {
    const entry = companionsState(character)[key];
    const raw = isPlainObject(entry) && entry.hp !== null && entry.hp !== '' && typeof entry.hp !== 'boolean'
        ? Math.trunc(Number(entry.hp)) : NaN;
    if (!Number.isFinite(raw)) return max;
    return Math.max(0, Math.min(max, raw));
}

/**
 * Patch qui enregistre les PV actuels d'un compagnon (valeur vide : PV pleins, entrée effacée).
 * Le nombre est ramené entre 0 et max ; un texte illisible ne donne aucun patch.
 * @param {Object} character
 * @param {string} key - COMPANION_KEYS
 * @param {*} value - saisie (« 23 »)
 * @param {number} max
 * @returns {Object} { subclass_companions: {...} }, ou {}
 */
export function setCompanionHpPatch(character, key, value, max) {
    if (!Object.values(COMPANION_KEYS).includes(key)) return {};
    const state = companionsState(character);
    const text = String(value ?? '').trim();
    if (!text) {
        if (!Object.hasOwn(state, key)) return {};
        const next = { ...state };
        delete next[key];
        return { [SUBCLASS_COMPANIONS_KEY]: next };
    }
    const n = Math.trunc(Number(text.replace(',', '.')));
    if (!Number.isFinite(n)) return {};
    const limit = Number.isFinite(max) ? max : Infinity;
    const entry = isPlainObject(state[key]) ? state[key] : {};
    return { [SUBCLASS_COMPANIONS_KEY]: { ...state, [key]: { ...entry, hp: Math.max(0, Math.min(limit, n)) } } };
}

/**
 * Un choix de sous-classe qui fait venir une nouvelle créature (autre bête primordiale) : ses PV
 * enregistrés sont effacés (PV pleins). {} si ce choix ne touche aucun compagnon.
 * @param {Object} character
 * @param {string} subclass
 * @param {string} choiceKey - champ de subclass_choices (« beast »)
 * @returns {Object}
 */
export function companionChoicePatch(character, subclass, choiceKey) {
    const key = NEW_CREATURE_ON[subclass]?.[choiceKey];
    const state = companionsState(character);
    if (!key || !Object.hasOwn(state, key)) return {};
    const next = { ...state };
    delete next[key];
    return { [SUBCLASS_COMPANIONS_KEY]: next };
}

/**
 * Fin d'un repos : au repos long, les compagnons de la sous-classe actuelle récupèrent tous leurs
 * PV (entrées effacées) ; au repos court, rien ne change.
 * @param {Object} character
 * @param {Object} derived - deriveCharacter(character)
 * @param {'short'|'long'} kind
 * @returns {{ patch: Object, healed: string[] }} healed : noms des compagnons blessés soignés
 */
export function restCompanions(character, derived = {}, kind = 'short') {
    const state = companionsState(character);
    const prefix = `${derived.subclass ?? ''}.`;
    // Dragon lié ou pseudodragon à 0 PV : mort ou disparu, un repos ne le ramène pas (thrène du
    // Seigneur Dragon, nouvel Appel de familier) : ses 0 PV restent tels que le joueur les a saisis
    // La monture d'Outremonde aussi : elle disparaît à 0 PV, un nouveau lancement du sort la remplace
    const gone = (key) => [COMPANION_KEYS.dragon, COMPANION_KEYS.pseudodragon, COMPANION_KEYS.steed].includes(key)
        && state[key] !== null && typeof state[key] === 'object' && String(state[key].hp ?? '').trim() !== '' && Number(state[key].hp) === 0;
    const stale = Object.keys(state).filter(key => key.startsWith(prefix) && !gone(key));
    if (kind !== 'long' || !derived.subclass || !stale.length) return { patch: {}, healed: [] };
    const healed = companionCards(derived, character)
        .filter(card => card.hp && card.hp.current < card.hp.max && !gone(card.key))
        .map(card => card.short);
    const next = { ...state };
    for (const key of stale) delete next[key];
    return { patch: { [SUBCLASS_COMPANIONS_KEY]: next }, healed };
}

/** Tableau des six caractéristiques : score, modificateur, sauvegarde (save(id, mod)) */
function abilityRows(scores, save) {
    return ABILITY_IDS.map(id => {
        const mod = modOf(scores[id]);
        return { id, label: ABILITY_LABELS[id], score: scores[id], mod, save: save(id, mod) };
    });
}

/** Libellé d'une option d'une liste [[valeur, libellé], …] */
const labelOf = (list, value) => list.find(([id]) => id === value)?.[1] ?? '';
/** Type de dégâts de la Frappe dans une phrase (« perforants ») */
const STRIKE_TEXT = Object.fromEntries(BEAST_STRIKE_TYPES.map(([id, , text]) => [id, text]));
/** « d'airain », « de bronze » */
const ofColor = (label) => (/^[aeiouyéèêâ]/i.test(label) ? `d'${label.toLowerCase()}` : `de ${label.toLowerCase()}`);

/**
 * Carte de compagnon.
 * @typedef {Object} CompanionCard
 * @property {string} key - COMPANION_KEYS
 * @property {string} feature - capacité de sous-classe (js/data/subclass-features.js)
 * @property {string} name - titre de la carte
 * @property {string} short - nom court dans une phrase (« stimfée », « bête des terres »)
 * @property {string} subtitle - type, taille, alignement
 * @property {string} missing - choix à faire avant d'afficher le reste ('' sinon)
 * @property {{ value: number, detail: string } | null} ac
 * @property {{ max: number, current: number, dice: string } | null} hp
 * @property {string} speed
 * @property {string} initiative
 * @property {Array<{ id: string, label: string, score: number, mod: number, save: number }>} abilities
 * @property {Array<[string, string]>} lines - [libellé, texte] : compétences, sens, langues…
 * @property {Array<{ name: string, text: string, inactive?: boolean }>} traits
 * @property {Array<{ name: string, text: string, inactive?: boolean }>} actions
 * @property {string[]} notes - lectures à confirmer, blocs à vérifier
 */

const emptyCard = (key, feature, name, subtitle, short) => ({
    key, feature, name, short, subtitle, missing: '', ac: null, hp: null, speed: '', initiative: '',
    abilities: [], lines: [], traits: [], actions: [], notes: []
});

/** Maître des bêtes : bête primordiale (PHB 2024, p. 122-124) */
function primalCompanion(derived, record) {
    const level = Number(derived.level) || 1;
    const pb = Number(derived.pb) || 2;
    const wis = Number(derived.mods?.wis) || 0;
    const attack = pb + wis;
    const dc = 8 + pb + wis;
    const choice = derived.subclassChoices ?? {};
    const beast = Object.hasOwn(PRIMAL_BEASTS, choice.beast ?? '') ? PRIMAL_BEASTS[choice.beast] : null;
    const card = emptyCard(COMPANION_KEYS.primal, 'compagnon_primordial',
        beast ? `Compagnon primitif : ${beast.label}` : 'Compagnon primitif',
        beast ? `Bête de taille ${beast.size.toLowerCase()}, neutre ; agit à votre tour` : 'Bête primordiale',
        beast ? beast.label.toLowerCase() : 'bête primordiale');
    card.ac = { value: 13 + wis, detail: `13 + Sagesse (${signed(wis)})` };
    if (!beast) {
        card.missing = 'Choisissez la bête (Terre, Mer ou Ciel) dans le menu « Bête primordiale » du bloc Sous-classe (onglet Aptitudes & Traits) : ses PV, sauvegardes et sa Frappe s\'afficheront ici.';
        return card;
    }
    const max = beast.hpBase + beast.hpPerLevel * level;
    card.hp = { max, current: max, dice: `${level}${beast.hitDie}` };
    card.speed = beast.speed;
    card.initiative = 'Agit à votre tour';
    // Lien primordial : + bonus de maîtrise à tous ses tests et jets de sauvegarde
    card.abilities = abilityRows(beast.scores, (id, mod) => mod + pb);
    card.lines = [
        ['Sens', `${beast.senses}, Perception passive ${12 + pb} (12 du bloc + ${pb}, Lien primordial)`],
        ['Langues', 'Comprend les langues que vous connaissez, ne parle pas.']
    ];
    card.traits = [
        { name: 'Lien primordial', text: `Ajoute votre bonus de maîtrise (${signed(pb)}) à ses tests de caractéristique et à ses jets de sauvegarde.` },
        ...beast.traits.map(([name, text]) => ({ name, text }))
    ];
    if (level >= 11) {
        const die = hunterMarkDie({ level, classSlug: derived.classSlug });
        card.traits.push({
            name: 'Fureur bestiale',
            text: `La première fois à chaque tour qu'elle touche une créature sous votre Marque du chasseur : +${die} dégâts de Force${record?.combat_buffs?.hunterMark === true ? '.' : ' (bouton Marque du chasseur éteint, onglet Combat).'}`,
            ...(record?.combat_buffs?.hunterMark === true ? {} : { inactive: true })
        });
    }
    if (level >= 15) card.traits.push({ name: 'Partage des sorts', text: 'Un sort que vous lancez en vous ciblant peut aussi l\'affecter si elle est à 9 m ou moins.' });
    card.traits.push({ name: 'Retour', text: 'Morte depuis moins d\'une heure : action Magie, vous la touchez et dépensez un emplacement de sort ; elle revient 1 minute plus tard avec tous ses PV.' });

    // Frappe : type choisi s'il est permis à cette bête (Mer : pas tranchants ; Ciel : toujours tranchants)
    const allowed = beast.strikeTypes;
    const type = allowed.length === 1 ? allowed[0] : allowed.includes(choice.strike) ? choice.strike : '';
    const names = allowed.map(id => STRIKE_TEXT[id]);
    const typeText = type
        ? STRIKE_TEXT[type]
        : `${names.slice(0, -1).join(', ')} ou ${names.at(-1)} (type à choisir dans le bloc Sous-classe)`;
    const force = level >= 7 ? ' (ou Force, Coordination facilitée)' : '';
    const extra = beast.grapple ? ` La cible est Agrippée (DD d'évasion ${dc}).` : beast.strikeExtra ? ` ${beast.strikeExtra}` : '';
    card.actions = [
        {
            name: level >= 11 ? 'Frappe de bête (×2 par ordre)' : 'Frappe de bête',
            text: `Corps à corps ${signed(attack)}, allonge 1,5 m. Touché : ${dice(beast.strikeDie, beast.strikeFlat + wis)} ${typeText}${force}.${extra}`
        },
        {
            name: 'Ordres',
            text: `Sans votre ordre (action bonus), elle ne fait que l'action Esquive. Vous pouvez aussi renoncer à une de vos attaques de l'action Attaque pour qu'elle fasse sa Frappe.${level >= 7 ? ' Commandée, elle peut en plus prendre l\'action Désengagement, Esquive, Pointe ou Soutien par sa propre action bonus.' : ''} Si vous êtes Neutralisé, elle agit librement.`
        }
    ];
    if (choice.strike && !allowed.includes(choice.strike) && allowed.length > 1) {
        card.notes.push(`Type « ${labelOf(BEAST_STRIKE_TYPES, choice.strike)} » enregistré : impossible pour la ${beast.label}, ignoré.`);
    }
    return card;
}

/** Conclave des Amazones : stimfée (Odyssée, p. 49 et bloc p. 51) */
function stimfeeCard(derived) {
    const level = Number(derived.level) || 1;
    const pb = Number(derived.pb) || 2;
    const expert = level >= 11;
    const look = labelOf(STIMFEE_LOOKS, derived.subclassChoices?.stimfee);
    const card = emptyCard(COMPANION_KEYS.stimfee, 'compagnon_stimfee', look ? `Stimfée (${look})` : 'Stimfée', STIMFEE.type, 'stimfée');
    const max = (expert ? STIMFEE.hpBaseExpert : STIMFEE.hpBase) + level;
    card.ac = expert
        ? { value: STIMFEE.ac + pb, detail: `${STIMFEE.ac} (armure naturelle) + ${pb} (Fauconnière chevronnée)` }
        : { value: STIMFEE.ac, detail: `${STIMFEE.ac} (armure naturelle)` };
    card.hp = { max, current: max, dice: `${expert ? STIMFEE.hpBaseExpert : STIMFEE.hpBase} + niveau` };
    card.speed = STIMFEE.speed;
    card.initiative = 'Agit à votre tour d\'initiative';
    card.abilities = abilityRows(STIMFEE.scores, (id, mod) => mod + pb);
    card.lines = [
        ['Compétences', STIMFEE.skills],
        ['Sens', STIMFEE.senses],
        ['Immunités', STIMFEE.immunities],
        ['Langues', STIMFEE.languages]
    ];
    card.traits = STIMFEE.traits.map(([name, text]) => ({ name, text }));
    if (expert) {
        card.traits.push({ name: 'Interception (réaction)', text: 'Quand une attaque ou un effet que vous voyez vous inflige des dégâts, la stimfée (en état de marche, à 18 m ou moins) les subit à votre place.' });
    }
    const die = expert ? '2d6' : '1d6';
    const hit = signed(STIMFEE.attackBase + pb);
    const magic = expert ? ', attaque magique' : '';
    card.actions = [
        { name: 'Serres', text: `Corps à corps ${hit}, allonge 1,5 m. Touché : ${dice(die, pb)} tranchants${magic}. Nuisance : la cible ne peut plus faire d'attaque d'opportunité jusqu'au début de son prochain tour.` },
        { name: 'Attaque en piqué', text: `Distance ${hit}, portée 18 m. Touché : ${dice(die, pb)} perforants${magic}.` },
        { name: 'Cri perçant', text: `Une créature au choix : sauvegarde de Constitution DD ${STIMFEE.dcBase + pb} ; échec : ${dice(die, pb)} psychiques et Assourdie jusqu'au début du prochain tour de la stimfée.` }
    ];
    card.notes.push(`Lecture retenue : votre bonus de maîtrise (${signed(pb)}) s'ajoute aux +${STIMFEE.attackBase}, aux dégâts et au DD ${STIMFEE.dcBase} du bloc ; PV selon le texte (${expert ? STIMFEE.hpBaseExpert : STIMFEE.hpBase} + niveau de Rôdeur). À confirmer par Franck.`);
    return card;
}

/**
 * Niveau du sort Trouver une monture retenu pour la carte : le niveau choisi (menu « Monture : niveau
 * du sort »), ramené au plus haut emplacement du personnage ; 2 sans choix (niveau du sort).
 * @param {Object} derived - deriveCharacter() (subclassChoices.steed_level, spellSlots)
 * @returns {{ level: number, chosen: number|null, max: number }}
 */
export function steedSpellLevel(derived = {}) {
    const slots = Object.keys(derived.spellSlots ?? {}).map(Number).filter(Number.isInteger);
    const max = Math.max(STEED_LEVELS[0], Math.min(STEED_LEVELS.at(-1), ...(slots.length ? [Math.max(...slots)] : [STEED_LEVELS[0]])));
    const raw = Number(derived.subclassChoices?.steed_level);
    const chosen = STEED_LEVELS.includes(raw) ? raw : null;
    return { level: chosen === null ? STEED_LEVELS[0] : Math.min(chosen, max), chosen, max };
}

/**
 * Conclave des Amazones, Magie des Amazones (niveau 5) : monture d'Outremonde du sort Trouver une
 * monture (bloc du PHB 2024, p. 272). Attaque et DD : ceux des sorts du personnage (Sagesse sans
 * caractéristique d'incantation choisie, celle du Rôdeur).
 */
function steedCard(derived) {
    const pb = Number(derived.pb) || 2;
    const { level, chosen, max } = steedSpellLevel(derived);
    const type = STEED_TYPES.find(([id]) => id === derived.subclassChoices?.steed) ?? null;
    const wis = Number(derived.mods?.wis) || 0;
    const cast = derived.spellcasting ?? { attack: pb + wis, dc: 8 + pb + wis };
    const card = emptyCard(COMPANION_KEYS.steed, 'magie_des_amazones',
        type ? `Monture d'Outremonde (${type[1]})` : "Monture d'Outremonde",
        `${type ? type[1] : 'Céleste, Fée ou Fiélon'} de taille ${OTHERWORLDLY_STEED.size.toLowerCase()}, ${OTHERWORLDLY_STEED.alignment} ; sort Trouver une monture de niveau ${level}`,
        'monture');
    if (!type) {
        card.missing = 'Choisissez le type de la monture (Céleste, Fée ou Fiélon) dans le menu « Monture : type » du bloc Sous-classe (onglet Aptitudes & Traits) : il donne les dégâts de son Coup et son action bonus.';
    }
    card.ac = { value: OTHERWORLDLY_STEED.acBase + level, detail: `${OTHERWORLDLY_STEED.acBase} + ${level} (niveau du sort)` };
    const hp = OTHERWORLDLY_STEED.hpBase + OTHERWORLDLY_STEED.hpPerLevel * level;
    card.hp = { max: hp, current: hp, dice: `${level}${OTHERWORLDLY_STEED.hitDie} ; ${OTHERWORLDLY_STEED.hpBase} + ${OTHERWORLDLY_STEED.hpPerLevel} × ${level}` };
    card.speed = level >= OTHERWORLDLY_STEED.flyFromLevel ? `${OTHERWORLDLY_STEED.speed}, ${OTHERWORLDLY_STEED.fly}` : OTHERWORLDLY_STEED.speed;
    card.initiative = 'Partage la vôtre';
    card.abilities = abilityRows(OTHERWORLDLY_STEED.scores, (id, mod) => mod);
    card.lines = [
        ['Sens', OTHERWORLDLY_STEED.senses],
        ['Langues', OTHERWORLDLY_STEED.languages],
        ['Bonus de maîtrise', `${signed(pb)} (le vôtre)`]
    ];
    card.traits = OTHERWORLDLY_STEED.traits.map(([name, text]) => ({ name, text }));
    const damage = type ? type[2] : 'radiants (Céleste), psychiques (Fée) ou nécrotiques (Fiélon)';
    const bonus = (entry) => ({
        name: `${entry[3][0]} (action bonus${type ? '' : `, ${entry[1]} seulement`})`,
        text: `${entry[3][1].replace('{level}', String(level)).replace('{dc}', `DD ${cast.dc}`)} Une fois, de nouveau après un repos long.`
    });
    card.actions = [
        { name: "Coup d'Outremonde", text: `Corps à corps ${signed(cast.attack)} (votre bonus d'attaque des sorts), allonge 1,5 m. Touché : ${dice('1d8', level)} ${damage}.` },
        ...(type ? [bonus(type)] : STEED_TYPES.map(bonus))
    ];
    if (level < OTHERWORLDLY_STEED.flyFromLevel) card.notes.push(`Vol 18 m seulement avec un sort de niveau ${OTHERWORLDLY_STEED.flyFromLevel} ou plus.`);
    if (chosen !== null && chosen > max) card.notes.push(`Niveau ${chosen} choisi, mais votre plus haut emplacement est de niveau ${max} : la carte suit le niveau ${max}.`);
    if (!derived.spellcasting) card.notes.push(`Attaque et DD calculés avec la Sagesse (caractéristique d'incantation du Rôdeur, à choisir en haut du grimoire).`);
    return card;
}

/** Serment du Seigneur Dragon : pseudodragon, familier (PHB 2024, p. 354 et Appel de familier) */
function pseudodragonCard(derived) {
    const level = Number(derived.level) || 1;
    const egg = DRAGONLINGS[derived.subclassChoices?.egg ?? '']?.label ?? '';
    const card = emptyCard(COMPANION_KEYS.pseudodragon, 'familier_pseudodragon', 'Pseudodragon (familier)',
        `${PSEUDODRAGON.type} ; type Céleste, Fée ou Fiélon au choix à chaque Appel de familier`, 'pseudodragon');
    card.ac = { value: PSEUDODRAGON.ac, detail: 'Bloc du pseudodragon' };
    card.hp = { max: PSEUDODRAGON.hp, current: PSEUDODRAGON.hp, dice: PSEUDODRAGON.hitDice };
    card.speed = PSEUDODRAGON.speed;
    card.initiative = `${signed(PSEUDODRAGON.initiative)} (jette sa propre Initiative)`;
    card.abilities = abilityRows(PSEUDODRAGON.scores, (id, mod) => mod);
    card.lines = [
        ['Compétences', PSEUDODRAGON.skills],
        ['Sens', PSEUDODRAGON.senses],
        ['Langues', PSEUDODRAGON.languages]
    ];
    card.traits = [
        ...PSEUDODRAGON.traits.map(([name, text]) => ({ name, text })),
        { name: 'Familier', text: 'Action bonus : vous voyez et entendez par ses sens jusqu\'au début de votre prochain tour. Il peut délivrer vos sorts de contact (sa réaction, à 30 m ou moins). À 0 PV, il disparaît jusqu\'au prochain Appel de familier. Action Magie : le renvoyer dans une poche dimensionnelle ou le rappeler à 9 m.' },
        {
            name: 'Œuf de dragon',
            text: level >= 7
                ? (egg ? `L'œuf ${ofColor(egg)} a éclos : voir la carte du dragon lié.` : 'L\'œuf a éclos : choisissez sa couleur (menu « Œuf de dragon »).')
                : egg ? `Œuf ${ofColor(egg)} trouvé ; il éclot au niveau 7.`
                    : level >= 6 ? 'Sans œuf au niveau 6 : il part et revient au bout de 3d6 jours avec un œuf (airain, bronze, cuivre ou argent).'
                        : 'Il cherche un œuf de dragon (il les sent à 1 500 m) ; sans œuf au niveau 6, il part en chercher un.'
        }
    ];
    card.actions = PSEUDODRAGON.actions.map(([name, text]) => ({ name, text, inactive: true }));
    card.notes.push('Un familier ne peut pas attaquer : Morsure et Dard sont grisés (le Dard, qui demande une sauvegarde, reste au jugement du MJ).');
    return card;
}

/** Serment du Seigneur Dragon : dragon lié (niveau 7), jeune dragon (niveau 15) */
function dragonCard(derived) {
    const level = Number(derived.level) || 1;
    const pb = Number(derived.pb) || 2;
    const dragon = DRAGONLINGS[derived.subclassChoices?.egg ?? ''] ?? null;
    const young = level >= 15;
    const card = emptyCard(COMPANION_KEYS.dragon, 'lien_du_seigneur_dragon',
        dragon ? `Dragon lié : ${young ? dragon.youngName : dragon.name}` : 'Dragon lié',
        dragon ? `${young ? 'Jeune dragon métallique' : `Dragonnet de taille ${dragon.size.toLowerCase()}`}, lié par le pacte du Seigneur Dragon` : 'Dragon métallique',
        'dragon lié');
    const max = 40 + 2 * level;
    card.hp = { max, current: max, dice: '40 + 2 × niveau' };
    card.initiative = 'Sous votre contrôle (son tour : au MJ)';
    const breathBox = level >= 20
        ? 'Souffle : recharge sur 5-6 (règles normales, Lien indestructible) ; Attaques multiples rendues.'
        : 'Souffle : une fois, puis repos court ou long (case « Souffle du dragon », onglet Combat). Pas d\'Attaques multiples tant qu\'il se bat à vos côtés.';
    const pact = { name: 'Pacte', text: `Vous contrôlez ses déplacements et ses actions. S'il meurt, vous mourez dans les 24 heures sauf s'il revient à la vie (le thrène du Seigneur Dragon le ramène à 1 PV). ${breathBox}` };
    if (!dragon) {
        card.missing = 'Choisissez la couleur de l\'œuf (menu « Œuf de dragon » du bloc Sous-classe) : le bloc du dragon s\'affichera ici.';
        card.traits = [pact];
        return card;
    }
    card.lines.push(['Immunité', `${dragon.immunityText}${young ? ' ; monté, vous la partagez' : ''}`]);
    if (young) {
        // Bloc du jeune dragon : pas recopié (seuls les PV et les sauvegardes viennent de la sous-classe)
        const passive = dragon.youngPassive;
        card.lines.push(['Sauvegardes', `Celles du bloc du jeune dragon + ${pb} (votre bonus de maîtrise).`]);
        card.traits = [
            pact,
            {
                name: 'Monture',
                text: `Vous pouvez le monter. Monté, vous gagnez ses résistances et immunités aux dégâts (${dragon.immunityText.toLowerCase()}) et ses sens : ${YOUNG_DRAGON_SENSES}, Perception passive ${passive} si elle est meilleure que la vôtre. Bouton « Monté sur le dragon » (onglet Combat) : ces effets sont rappelés près de la CA et de la Perception.`
            }
        ];
        card.notes.push('Jeune dragon : bloc du Manuel des monstres, non recopié ; la fiche garde les PV de la sous-classe (40 + 2 × niveau de Paladin).');
        return card;
    }
    card.ac = { value: dragon.ac, detail: `Bloc du ${dragon.name.toLowerCase()}` };
    card.speed = dragon.speed;
    card.abilities = abilityRows(dragon.scores, (id, mod) => (dragon.saves[id] ?? mod) + pb);
    card.lines.unshift(['Compétences', dragon.skills], ['Sens', DRAGONLING_SENSES], ['Langues', 'Draconique']);
    card.traits = [...dragon.traits.map(([name, text]) => ({ name, text })), pact];
    card.actions = [
        ...(dragon.multiattack ? [{ name: 'Attaques multiples', text: 'Deux Saignées (perdue tant qu\'il se bat à vos côtés, pacte).', inactive: true }] : []),
        { name: 'Saignée', text: `Corps à corps ${signed(dragon.rend.attack)}, allonge 1,5 m. Touché : ${dragon.rend.damage} ${dragon.rend.type}.` },
        ...dragon.breaths.map(breath => ({ name: breath.name, text: `${breath.area.charAt(0).toUpperCase()}${breath.area.slice(1)} ; sauvegarde de ${breath.save} DD ${breath.dc} ; échec : ${breath.effect}.` }))
    ];
    card.notes.push(`Sauvegardes : celles du bloc + ${pb} (votre bonus de maîtrise).`);
    card.notes.push(`Bloc du Manuel des monstres 2024 : seul le ${dragon.breaths[0].name.toLowerCase()} y a une recharge (5-6). Lecture retenue : le pacte (un souffle, puis repos court ou long) vaut pour les deux souffles. À confirmer par Franck.`);
    return card;
}

/**
 * Cartes des compagnons du personnage, dans l'ordre d'affichage. [] sans sous-classe à compagnon ou
 * avant le niveau de la capacité. PV actuels lus dans subclass_companions (companionHp).
 * @param {Object} derived - deriveCharacter() (subclass, level, pb, mods, classSlug, subclassChoices)
 * @param {Object} [record] - fiche (combat_buffs, subclass_companions)
 * @returns {CompanionCard[]}
 */
export function companionCards(derived = {}, record = {}) {
    const level = Number(derived.level) || 1;
    const cards = [];
    if (derived.subclass === 'beast_master' && level >= 3) cards.push(primalCompanion(derived, record));
    if (derived.subclass === 'amazon_warrior' && level >= 3) cards.push(stimfeeCard(derived));
    if (derived.subclass === 'amazon_warrior' && level >= 5) cards.push(steedCard(derived));
    if (derived.subclass === 'oath_of_the_dragonlords' && level >= 3) {
        cards.push(pseudodragonCard(derived));
        if (level >= 7) cards.push(dragonCard(derived));
    }
    for (const card of cards) {
        if (card.hp) card.hp.current = companionHp(record, card.key, card.hp.max);
    }
    return cards;
}
