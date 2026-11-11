// =============================================================================
// SUBCLASS-CHOICES.JS (règles) - Choix de sous-classe mémorisés (lot 7)
//
// La fiche RETIENT ce que le joueur a choisi pour une capacité de sous-classe (option de la Rage
// sauvage, manœuvres, école du Philosophe…) ; comme pour les dons (feat-choices.js), elle ne modifie
// jamais une valeur saisie : elle affiche des repères et des chiffres calculés.
//
// Sauvegarde : clé facultative « subclass_choices » =
//   { "<clé de sous-classe>": { "<champ>": "<valeur>", … } }
// par exemple { "path_of_the_wild_heart": { "rage": "bear" } }. Les choix sont rangés par
// sous-classe : changer de sous-classe puis revenir à la première retrouve ses choix. Absente des
// anciennes fiches ; l'ancien site (v3) l'ignore (V4_ONLY_KEYS, js/cloud/sync.js).
// Valeurs : toujours des chaînes ; une valeur inconnue (sauvegarde retouchée) est ignorée, comme un
// choix d'une capacité pas encore atteinte.
// Champs : js/data/subclass-choices.js. Fonctions pures : le personnage reçu n'est jamais modifié.
// =============================================================================

import { SUBCLASS_CHOICE_FIELDS, PHILOSOPHER_SCHOOLS } from '../data/subclass-choices.js';
import { SUBCLASS_FEATURES } from '../data/subclass-features.js';
import { knownManeuvers, maneuverNumbers, superiorityDie } from './subclass-combat.js';

export const SUBCLASS_CHOICES_KEY = 'subclass_choices';

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Choix enregistrés (toutes sous-classes), ou {} si la clé est absente ou abîmée.
 * @param {Object} character
 * @returns {Object<string, Object<string, string>>}
 */
export function subclassChoicesState(character) {
    const state = character?.[SUBCLASS_CHOICES_KEY];
    return isPlainObject(state) ? state : {};
}

/** Niveau de la capacité d'un champ (js/data/subclass-features.js), ou Infinity si elle est inconnue */
function featureLevel(subclass, featureId) {
    const list = Object.hasOwn(SUBCLASS_FEATURES, subclass) ? SUBCLASS_FEATURES[subclass] : [];
    return list.find(feature => feature.id === featureId)?.level ?? Infinity;
}

/**
 * Définitions brutes des champs d'une sous-classe.
 * @param {string} subclass
 * @returns {Object[]}
 */
function fieldDefs(subclass) {
    return Object.hasOwn(SUBCLASS_CHOICE_FIELDS, subclass) ? SUBCLASS_CHOICE_FIELDS[subclass] : [];
}

/**
 * Menus à choisir au niveau du personnage, dans l'ordre des données.
 * Un champ à plusieurs menus (count : manœuvres) devient « maneuver1 », « maneuver2 »… selon le niveau.
 * @param {{ subclass?: string, level?: number }} derived - deriveCharacter()
 * @returns {Array<{ key: string, feature: string, label: string, options: Array<[string, string]>,
 *   inPlay: boolean, when?: string, group?: string, wide?: boolean, toggle?: boolean,
 *   clearOn?: 'rest'|'longRest', restReminder?: 'short'|'long', kind?: 'number', min?: number, max?: number }>}
 *   kind 'number' : compteur entre min et max (options toujours [] : jamais d'erreur sans options) ;
 *   inPlay : choix changé en jeu (Rage, repos) : reste modifiable fiche verrouillée ;
 *   group : clé du champ d'origine (menus multiples : pas deux fois la même option) ;
 *   toggle, clearOn, restReminder : voir js/data/subclass-choices.js
 */
export function subclassChoiceFields(derived = {}) {
    // Menu lié à un autre choix (requires : seconde école de l'Éclectisme) : seulement si ce choix,
    // déjà validé (derived.subclassChoices), a la bonne valeur
    const chosen = derived.subclassChoices ?? {};
    return levelFields(derived).filter(field => requiresMet(field.requires, chosen));
}

/**
 * Condition requires d'un menu remplie par les choix déjà validés (value : une valeur ou une liste
 * de valeurs permises) ; vrai sans condition.
 */
function requiresMet(requires, chosen) {
    if (!requires) return true;
    const current = chosen[requires.key];
    return Array.isArray(requires.value) ? current !== undefined && requires.value.includes(current) : current === requires.value;
}

/** Menus atteints au niveau du personnage, sans tenir compte de requires (voir subclassChoiceFields) */
function levelFields(derived = {}) {
    const { subclass = '', level = 1 } = derived;
    const fields = [];
    for (const def of fieldDefs(subclass)) {
        const from = Math.max(featureLevel(subclass, def.feature), def.fromLevel ?? 0);
        if (level < from) continue;
        const base = {
            // Compteur (kind: 'number') : pas d'options, mais une plage (voir numberChoice)
            feature: def.feature, label: def.label, options: Array.isArray(def.options) ? def.options : [], inPlay: def.inPlay === true,
            ...(def.kind === 'number' ? { kind: 'number', min: numberBound(def, 'min'), max: numberBound(def, 'max') } : {}),
            ...(def.when ? { when: def.when } : {}), ...(def.wide ? { wide: true } : {}),
            ...(def.toggle ? { toggle: true } : {}), ...(def.clearOn ? { clearOn: def.clearOn } : {}),
            ...(def.restReminder ? { restReminder: def.restReminder } : {}),
            ...(def.requires ? { requires: def.requires } : {})
        };
        if (typeof def.count === 'function') {
            const count = Math.max(0, Math.floor(Number(def.count(derived)) || 0));
            for (let i = 1; i <= count; i++) {
                fields.push({ ...base, key: `${def.key}${i}`, label: `${def.label} ${i}`, group: def.key });
            }
        } else {
            fields.push({ ...base, key: def.key });
        }
    }
    return fields;
}

/** Bornes d'un compteur (kind: 'number') : entiers, 0 et 999 par défaut */
function numberBound(def, which) {
    const fallback = which === 'min' ? 0 : 999;
    const n = def?.[which];
    return Number.isInteger(n) ? n : fallback;
}

/**
 * Valeur enregistrée d'un compteur (kind: 'number'), réécrite en chaîne, ou null si elle est illisible
 * ou hors de la plage. Une chaîne doit être un entier sans signe ni zéro en tête (« 14 », pas « 014 »,
 * « -1 » ni « 1e3 ») ; un nombre entier (sauvegarde retouchée à la main) est toléré.
 * @param {{ min?: number, max?: number }} field
 * @param {*} value
 * @returns {string|null}
 */
function numberChoice(field, value) {
    let n;
    if (typeof value === 'string') {
        if (!/^(0|[1-9]\d*)$/.test(value)) return null;
        n = Number(value);
    } else if (typeof value === 'number' && Number.isInteger(value)) {
        n = value;
    } else {
        return null;
    }
    return n >= numberBound(field, 'min') && n <= numberBound(field, 'max') ? String(n) : null;
}

/** Valeur valide d'un champ (option connue, ou compteur dans sa plage), ou null */
function validValue(field, value) {
    if (field.kind === 'number') return numberChoice(field, value);
    const options = Array.isArray(field.options) ? field.options : [];
    return typeof value === 'string' && options.some(([id]) => id === value) ? value : null;
}

/**
 * Choix valides du personnage pour sa sous-classe et son niveau : { champ: valeur }.
 * Une valeur hors des options, ou d'un menu pas encore atteint, est ignorée ; dans un champ à
 * plusieurs menus, une option déjà prise par un menu précédent est ignorée. Un compteur
 * (kind: 'number') donne sa valeur en chaîne (« 14 »), ignorée hors de sa plage.
 * @param {Object} character
 * @param {{ subclass?: string, level?: number }} derived - deriveCharacter()
 * @returns {Object<string, string>}
 */
export function subclassChoice(character, derived = {}) {
    const saved = subclassChoicesState(character)[derived.subclass ?? ''];
    if (!isPlainObject(saved)) return {};
    const result = {};
    const taken = new Map();
    for (const field of levelFields(derived)) {
        const value = validValue(field, saved[field.key]);
        if (value === null) continue;
        // Choix lié à un autre (seconde école) : ignoré si cet autre choix n'a pas la bonne valeur
        if (!requiresMet(field.requires, result)) continue;
        if (field.group) {
            const used = taken.get(field.group) ?? new Set();
            if (used.has(value)) continue;
            used.add(value);
            taken.set(field.group, used);
        }
        result[field.key] = value;
    }
    return result;
}

/**
 * Valeurs choisies d'un champ (un seul menu : 0 ou 1 valeur ; menus multiples : dans l'ordre).
 * @param {Object<string, string>} choice - subclassChoice()
 * @param {string} key - clé du champ dans les données (« rage », « maneuver »…)
 * @returns {string[]}
 */
export function chosenValues(choice, key) {
    return Object.entries(choice ?? {})
        .filter(([field]) => field === key || (field.startsWith(key) && /^\d+$/.test(field.slice(key.length))))
        .sort(([a], [b]) => (Number(a.slice(key.length)) || 0) - (Number(b.slice(key.length)) || 0))
        .map(([, value]) => value);
}

/**
 * Libellé d'une option choisie.
 * @param {string} subclass
 * @param {string} key - clé du champ dans les données
 * @param {string} value
 * @returns {string} '' si inconnue (compteur : la valeur elle-même, « 14 »)
 */
export function choiceLabel(subclass, key, value) {
    const def = fieldDefs(subclass).find(field => field.key === key);
    if (def?.kind === 'number') return numberChoice(def, value) ?? '';
    return (Array.isArray(def?.options) ? def.options : []).find(([id]) => id === value)?.[1] ?? '';
}

/**
 * Patch qui enregistre un choix (valeur vide : le choix est effacé). Le menu doit exister dans les
 * données de la sous-classe (même pas encore atteint : rien d'autre n'est vérifié ici).
 * @param {Object} character
 * @param {string} subclass - clé de sous-classe
 * @param {string} key - champ (« rage », « maneuver2 »…)
 * @param {string|number} value - compteur (kind: 'number') : nombre ou chaîne, arrondi vers zéro et
 *   ramené entre min et max, enregistré en chaîne (« 14 »)
 * @returns {Object} { subclass_choices: {...} }, ou {} si le champ ou la valeur est inconnu
 */
export function setSubclassChoicePatch(character, subclass, key, value) {
    const def = fieldDefs(subclass).find(field => field.key === key
        || (typeof field.count === 'function' && key.startsWith(field.key) && /^\d+$/.test(key.slice(field.key.length))));
    if (!def) return {};
    let text = String(value ?? '');
    if (def.kind === 'number') {
        text = text.trim();
        if (text) {
            const n = Math.trunc(Number(text));
            if (!Number.isFinite(n)) return {};
            text = String(Math.min(numberBound(def, 'max'), Math.max(numberBound(def, 'min'), n)));
        }
    } else if (text && !(Array.isArray(def.options) ? def.options : []).some(([id]) => id === text)) {
        return {};
    }
    const state = subclassChoicesState(character);
    const current = isPlainObject(state[subclass]) ? { ...state[subclass] } : {};
    if (text) current[key] = text;
    else delete current[key];
    return { [SUBCLASS_CHOICES_KEY]: { ...state, [subclass]: current } };
}

/**
 * Patch qui ajoute delta à un compteur (kind: 'number') atteint de la sous-classe du personnage
 * (boutons « − » et « + » : strophes de la Poésie épique). Une valeur absente ou illisible part du
 * minimum ; le résultat est ramené entre min et max.
 * typed : nombre tapé dans la case et pas encore enregistré (toucher « + » juste après la saisie,
 * avant que la case ne soit quittée) ; lisible, il remplace la valeur enregistrée comme point de
 * départ (ramené entre min et max), pour que ni la saisie ni le toucher ne soient perdus.
 * @param {Object} character
 * @param {Object} derived - deriveCharacter(character) (subclass, level, subclassChoices)
 * @param {string} key - champ (« strophes »)
 * @param {number} delta
 * @param {string|number} [typed] - contenu de la case (« 14 ») ; vide ou illisible : ignoré
 * @returns {Object} { subclass_choices: {...} }, ou {} si ce compteur n'est pas atteint
 */
export function stepSubclassChoicePatch(character, derived = {}, key, delta, typed) {
    const field = levelFields(derived).find(f => f.key === key && f.kind === 'number');
    const step = Math.trunc(Number(delta));
    if (!field || !Number.isFinite(step)) return {};
    const choice = derived.subclassChoices ?? subclassChoice(character, derived);
    const text = String(typed ?? '').trim().replace(',', '.');
    const entered = text ? Math.trunc(Number(text)) : NaN;
    const current = Number.isFinite(entered)
        ? Math.min(field.max, Math.max(field.min, entered))
        : choice[key] !== undefined ? Number(choice[key]) : field.min;
    return setSubclassChoicePatch(character, derived.subclass ?? '', key, current + step);
}

/**
 * Écoles actives du Philosophe de l'Académie (Odyssée, p. 44 et 46) : [] sans école choisie,
 * [école], ou ['eclectisme', seconde école] pour un Éclectique de niveau 5 ou plus qui l'a choisie.
 * Les choix sont déjà validés par deriveCharacter (niveau atteint, valeur connue, seconde école
 * comptée seulement avec l'Éclectisme) : les cases, repères et sorts des écoles passent tous par ici.
 * @param {{ subclass?: string, subclassChoices?: Object<string, string> }} derived - deriveCharacter()
 * @returns {string[]} ids des écoles (PHILOSOPHER_SCHOOLS)
 */
export function philosopherSchools(derived = {}) {
    if (derived?.subclass !== 'academy_philosopher') return [];
    const { school, second_school: second } = derived.subclassChoices ?? {};
    if (!school) return [];
    return school === 'eclectisme' && second ? [school, second] : [school];
}

/** Libellé d'une école (« Stoïcisme »), '' si inconnue */
export const schoolLabel = (id) => PHILOSOPHER_SCHOOLS.find(([value]) => value === id)?.[1] ?? '';

/** Nom d'une capacité de sous-classe (js/data/subclass-features.js) */
function featureName(subclass, featureId) {
    const list = Object.hasOwn(SUBCLASS_FEATURES, subclass) ? SUBCLASS_FEATURES[subclass] : [];
    return list.find(feature => feature.id === featureId)?.name ?? '';
}

/** Le repos efface ce champ (clearOn : 'rest' = tout repos, 'longRest' = repos long seulement) */
const clearedBy = (def, kind) => def.clearOn === 'rest' || (def.clearOn === 'longRest' && kind === 'long');

/**
 * Fin d'un repos : efface les choix dont l'effet s'arrête (clearOn : Troisième œil, Révélation dans
 * la chair, Prédictions des Moires, Présage cosmique au repos long). Seule la sous-classe actuelle
 * est touchée ; un champ sans clearOn n'est jamais effacé (le dernier choix reste proposé).
 * @param {Object} character
 * @param {Object} derived - deriveCharacter(character) (subclass, level, subclassChoices)
 * @param {'short'|'long'} kind
 * @returns {{ patch: Object, cleared: Array<{ featId: string, featName: string, label: string, value: string }> }}
 *   patch vide si rien n'est à effacer ; cleared : choix valides effacés (pas ceux d'une capacité
 *   pas encore atteinte, effacés sans être annoncés)
 */
export function restSubclassChoices(character, derived = {}, kind = 'short') {
    const subclass = derived.subclass ?? '';
    const state = subclassChoicesState(character);
    const saved = state[subclass];
    if (!isPlainObject(saved)) return { patch: {}, cleared: [] };
    const defs = fieldDefs(subclass).filter(def => clearedBy(def, kind) && Object.hasOwn(saved, def.key));
    if (!defs.length) return { patch: {}, cleared: [] };
    const valid = derived.subclassChoices ?? subclassChoice(character, derived);
    const cleared = defs.filter(def => valid[def.key] !== undefined).map(def => ({
        featId: def.feature, featName: featureName(subclass, def.feature), label: def.label,
        value: choiceLabel(subclass, def.key, valid[def.key])
    }));
    const next = { ...saved };
    for (const def of defs) delete next[def.key];
    return { patch: { [SUBCLASS_CHOICES_KEY]: { ...state, [subclass]: next } }, cleared };
}

/**
 * Vitesse saisie lue en mètres, quand elle n'est qu'un nombre : « 9 », « 9 m », « 10,5 m ».
 * Toute autre écriture (« 30 ft », « 9 m (vol 18 m) », vide) donne null : la fiche n'affiche alors
 * pas de chiffre. Rien n'est jamais écrit dans le champ.
 * @param {*} text - champ speed de la fiche
 * @returns {number|null}
 */
export function speedMeters(text) {
    const plain = String(text ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    const match = /^(\d+(?:[.,]\d+)?)\s*(?:m|mètres?|metres?)?$/i.exec(plain);
    if (!match) return null;
    const meters = Number(match[1].replace(',', '.'));
    return Number.isFinite(meters) && meters > 0 ? meters : null;
}

/** « 18 m », « 10,5 m » */
const metersText = (meters) => `${String(Math.round(meters * 100) / 100).replace('.', ',')} m`;

/**
 * Repères des choix de sous-classe près des valeurs (format FeatNote de feat-effects.js, avec
 * classFeature: true), fusionnés par classFeatureNotes (class-features.js). Les Résistances qui
 * dépendent d'un choix sont dans SUBCLASS_DEFENSES (subclass-combat.js, colonne « choix », et
 * choiceDefense pour le type de dégâts choisi). Zone rest : rappels de fin de repos (restReminder,
 * clearOn des données), affichés par le résumé des repos.
 * @param {Object} derived - deriveCharacter() (subclassChoices)
 * @param {Object} [record] - fiche (combat_buffs : Rage allumée)
 * @returns {Object<string, Object[]>}
 */
export function subclassChoiceNotes(derived = {}, record = {}) {
    const zones = {};
    const add = (zone, featId, featName, text, extra = {}) => {
        (zones[zone] ??= []).push({ featId, featName, text, ...extra, classFeature: true });
    };
    const choice = derived.subclassChoices ?? {};
    const rage = record?.combat_buffs?.rage === true;
    if (derived.subclass === 'path_of_the_wild_heart') {
        // Aspect de faune (niveau 6), changé à chaque repos long
        if (choice.aspect === 'panther') add('speed', 'aspect_sauvage', 'Aspect de faune (Panthère)', "Vitesse d'escalade égale à votre Vitesse.", { mention: 'Escalade\u00a0= Vitesse' });
        if (choice.aspect === 'salmon') add('speed', 'aspect_sauvage', 'Aspect de faune (Saumon)', 'Vitesse de nage égale à votre Vitesse.', { mention: 'Nage\u00a0= Vitesse' });
        // Puissance de la faune (niveau 14) : Faucon, seulement pendant la Rage et sans armure
        if (choice.power === 'falcon') {
            add('speed', 'puissance_sauvage', 'Puissance de la faune (Faucon)',
                "Pendant la Rage, si vous ne portez pas d'armure : vitesse de vol égale à votre Vitesse.",
                { mention: 'Vol\u00a0= Vitesse (Rage)', ...(rage && !derived.wornArmor?.light && !derived.wornArmor?.medium && !derived.wornArmor?.heavy ? {} : { inactive: true }) });
        }
    }
    if (derived.subclass === 'battle_master' && (Number(derived.level) || 1) >= 3) {
        const die = `1${superiorityDie(Number(derived.level) || 1)}`;
        // Manœuvres de test ou de défense connues : repères (le dé n'est jamais ajouté au nombre)
        for (const maneuver of knownManeuvers(derived)) {
            const zonesFor = MANEUVER_ZONES[maneuver.id];
            if (!zonesFor) continue;
            for (const zone of zonesFor) {
                add(zone, 'superiorite_martiale_man_uvres', maneuver.name,
                    zone === 'armorClass'
                        ? `${maneuver.name} : ${maneuver.id === 'parry' ? `Réaction, ${maneuverNumbers(maneuver, derived)} au corps à corps` : `+${die} à la CA jusqu'au début de votre prochain tour`} (un dé de supériorité). La CA affichée n'est pas modifiée.`
                        : `${maneuver.name} : +${die} possible en dépensant un dé de supériorité (rien n'est ajouté au nombre affiché).`,
                    zone === 'armorClass' ? { mention: maneuver.id === 'parry' ? 'Parade' : `+${die} CA` } : {});
            }
        }
        // Disciple martial : compétence choisie, à cocher par le joueur
        const skill = choice.student_skill;
        if (skill && record?.[`skill_prof_${skill}`] !== true && record?.[`skill_exp_${skill}`] !== true) {
            add(`skills.${skill}`, 'disciple_de_la_guerre', 'Disciple martial',
                'Disciple martial (Maître de guerre niveau 3) vous donne cette maîtrise : case à cocher vous-même, la fiche ne coche rien.',
                { check: true });
        }
    }
    // Troisième œil (Devin, niveau 10) : vision dans le noir jusqu'au prochain repos
    if (derived.subclass === 'diviner' && choice.eye === 'darkvision') {
        add('speed', 'troisieme_il', 'Troisième œil', 'Vision dans le noir à 36 m jusqu\'au début de votre prochain repos court ou long.', { mention: 'Vision dans le noir 36\u00a0m' });
    }
    // Révélation incarnée (Sorcellerie aberrante, niveau 14) : nage et vol pendant 10 minutes
    if (derived.subclass === 'aberrant_sorcery') {
        const meters = speedMeters(record?.speed);
        if (choice.rev_aquatic === 'on') {
            add('speed', 'revelation_dans_la_chair', 'Révélation incarnée',
                `Vitesse de nage égale à 2 × votre Vitesse${meters ? ` (${metersText(2 * meters)})` : ''} et respiration sous l'eau, pendant 10 minutes.`,
                { mention: 'Nage\u00a0= 2 × Vitesse' });
        }
        if (choice.rev_flight === 'on') {
            add('speed', 'revelation_dans_la_chair', 'Révélation incarnée',
                `Vitesse de vol égale à votre Vitesse${meters ? ` (${metersText(meters)})` : ''}, avec vol stationnaire, pendant 10 minutes.`,
                { mention: 'Vol\u00a0= Vitesse' });
        }
    }
    // Philosophe de l'Académie : repères des écoles actives (la fiche ne coche rien)
    const schools = philosopherSchools(derived);
    if (schools.includes('empirisme')
        && record?.skill_prof_perception !== true && record?.skill_exp_perception !== true) {
        add('skills.perception', 'empirisme', 'Empirisme',
            'Empirisme (Philosophe de l\'Académie) vous donne la maîtrise de Perception : case à cocher vous-même, la fiche ne coche rien.',
            { check: true });
    }
    if (schools.includes('sophisme') && record?.skill_exp_persuasion !== true) {
        const pb = Number(derived.pb) || 2;
        const boxes = record?.skill_prof_persuasion === true ? 'case Expertise à cocher' : 'cases Maîtrise et Expertise à cocher';
        add('skills.persuasion', 'sophisme', 'Sophisme',
            `Sophisme (Philosophe de l'Académie) : Expertise en Persuasion (+${2 * pb} au lieu de +${pb}) : ${boxes} vous-même, la fiche ne coche rien.`,
            { check: true });
    }
    if (schools.includes('scepticisme')) {
        add('armorClass', 'scepticisme', 'Scepticisme',
            'Avantage aux sauvegardes contre les sorts et les effets de charme, et contre les effets des illusions ; Avantage aux tests pour percer une illusion.',
            { mention: 'Avantage contre sorts' });
    }
    // Fin de repos (zone rest) : choix à refaire ou à confirmer (restReminder), choix qui s'arrête (clearOn)
    for (const field of subclassChoiceFields(derived)) {
        const current = choice[field.key];
        const now = current ? (field.kind === 'number' ? current : field.options.find(([id]) => id === current)?.[1] ?? '') : '';
        const name = featureName(derived.subclass, field.feature) || field.label;
        const kind = field.restReminder === 'long' || field.clearOn === 'longRest' ? { restKind: 'long' } : {};
        const where = 'dans le bloc Sous-classe (onglet Aptitudes & Traits)';
        // Le nom de la capacité est déjà affiché devant le texte : le libellé du menu n'est pas répété
        const subject = field.label === name ? '' : field.label;
        const capital = (text) => text.charAt(0).toUpperCase() + text.slice(1);
        if (field.clearOn && (field.restReminder || current)) {
            const what = subject ? `${subject}${now && !field.toggle ? ` (${now})` : ''} : ` : (now ? `${now} : ` : '');
            const state = current ? 'prend fin avec ce repos, la fiche l\'efface' : 'pas encore choisi';
            add('rest', field.feature, name, `${what}${what ? state : capital(state)}${field.restReminder ? ` ; nouveau choix à faire ${where}` : ''}.${field.restReminder && field.when ? ` ${field.when}` : ''}`, kind);
        } else if (field.restReminder) {
            const state = now ? `actuellement ${now}` : 'pas encore choisi';
            add('rest', field.feature, name, `${subject ? `${subject} : ${state}` : capital(state)} ; ${now ? 'vous pouvez le changer' : 'à choisir'} ${where}.`, kind);
        }
    }
    return zones;
}

/** Zones des repères des manœuvres de test ou de défense (le dé de supériorité y est rappelé) */
const MANEUVER_ZONES = {
    ambush: ['initiative', 'skills.stealth'],
    commanding_presence: ['skills.intimidation', 'skills.performance', 'skills.persuasion'],
    tactical_assessment: ['skills.history', 'skills.investigation', 'skills.insight'],
    parry: ['armorClass'],
    evasive_footwork: ['armorClass'],
    bait_and_switch: ['armorClass']
};
