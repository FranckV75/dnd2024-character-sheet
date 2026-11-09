// =============================================================================
// SHEET.JS - Construction de la fiche et liaison des champs avec le store
//
// Principe : chaque champ porte data-field="<clé de la sauvegarde>".
//  - Saisie de l'utilisateur  → store.update({ clé: valeur })
//  - Changement dans le store → render() met à jour tous les champs et les
//    valeurs calculées (data-out="..."), à partir de deriveCharacter().
// Les tableaux (armes, armures, sorts), le repos, la barre de gestion... sont
// gérés par leurs propres modules (js/ui/weapons.js, armors.js, spells.js...).
// =============================================================================

import { ABILITIES, SKILLS, SKILLS_BY_STAT } from '../data/constants.js';
import { DD_RULES } from '../data/dd-rules.js';
import { FEATS_DATA } from '../data/feats.js';
import { FEAT_SLOT_ORDER, HUMAN_FEAT_SLOT, STYLE_FEAT_SLOT, featSlotLevel } from '../state/schema.js';
import { stripHTML } from '../state/migrate.js';
import { deriveCharacter, featSlotState, hitDieForClass, exhaustionSeverity } from '../rules/character.js';
import { featEffects, AUTOMATED_FEATS } from '../rules/feat-effects.js';
import { featCounters, setFeatUsesPatch } from '../rules/feat-uses.js';
import { subclassCounters, setSubclassUsesPatch } from '../rules/subclass-uses.js';
import { FEAT_CHOICE_RULES, slotChoice, setFeatChoicePatch, fieldOptions, fieldActive } from '../rules/feat-choices.js';
import {
    featName, featSlotName, isHuman, classFeatSlot, featSlotCounts, featSlotLevelFor, STYLE_ALTERNATIVES
} from '../rules/feats.js';
import { sanitizeRich, sanitizeRulesText, richTextAvailable } from './sanitize.js';
import { el, fillSelect, icon, signed, sheetElements, RICH_FIELD } from './dom.js';
import { applyLock, isLocked } from './lock.js';
import { openModal } from './modal.js';
import { createCalcBubble } from './calc-bubble.js';

const SKILL_STATS = ['str', 'dex', 'int', 'wis', 'cha'];
// Icônes dorées des groupes de compétences (dessinées par dom.js, à la place des émojis)
const SKILL_GROUP_ICONS = { str: 'fist', dex: 'feather', int: 'book', wis: 'eye', cha: 'sparkle' };
const FEAT_TYPE_ORDER = ['Origine', 'Général', 'Style de combat', 'Épique'];
const SPELL_ABILITY_LABELS = { none: '—', int: 'Intelligence', wis: 'Sagesse', cha: 'Charisme' };

// ---------------------------------------------------------------------------
// Construction des blocs générés à partir des données du jeu
// ---------------------------------------------------------------------------

function buildAbilities(root) {
    root.querySelector('#abilities').replaceChildren(...ABILITIES.map(a => el('div', { class: 'ability' },
        el('label', { for: `f-${a.id}_score`, class: 'label', text: a.name }),
        el('input', {
            id: `f-${a.id}_score`, class: 'input score center', 'data-field': `${a.id}_score`,
            inputmode: 'numeric', autocomplete: 'off'
        }),
        el('output', { class: 'mod', 'data-out': `mod:${a.id}` }),
        // Augmentation due à un don à choix (Amélioration de caractéristique, Résilient…) : repère
        // seulement, la valeur saisie n'est jamais modifiée (renderFeatMentions)
        el('button', { type: 'button', class: 'feat-mention', 'data-feat-zone': `scores.${a.id}`, hidden: true }),
        el('div', { class: 'save' },
            el('input', {
                type: 'checkbox', class: 'round-check', 'data-field': `${a.id}_save_prof`,
                'aria-label': `Maîtrise du jet de sauvegarde de ${a.name}`
            }),
            el('span', { text: 'Sauv.' }),
            el('output', { 'data-out': `save:${a.id}` })),
        // Don qui touche ce jet de sauvegarde (Mage de guerre, Maître des boucliers) : renderFeatMentions
        el('button', { type: 'button', class: 'feat-mention', 'data-feat-zone': `saves.${a.id}`, hidden: true })
    )));
}

function buildSkills(root) {
    const container = root.querySelector('#skills');
    const extra = container.querySelector('.skills-extra');
    for (const stat of SKILL_STATS) {
        const ability = ABILITIES.find(a => a.id === stat);
        container.insertBefore(el('section', { class: 'skill-group', 'aria-label': ability.name },
            el('div', { class: 'skill-group-head' },
                icon(SKILL_GROUP_ICONS[stat]),
                el('span', { text: ability.name }),
                el('output', { class: 'mod', 'data-out': `mod:${stat}` })),
            // data-rank (posé au rendu) : maîtrise / expertise, pour faire ressortir la ligne
            SKILLS_BY_STAT[stat].map(skill => el('div', { class: 'skill-row', 'data-skill': skill.id },
                el('input', {
                    type: 'checkbox', class: 'round-check', 'data-field': `skill_prof_${skill.id}`,
                    'aria-label': `Maîtrise : ${skill.name}`
                }),
                el('input', {
                    type: 'checkbox', class: 'round-check expertise', 'data-field': `skill_exp_${skill.id}`,
                    'aria-label': `Expertise : ${skill.name}`
                }),
                el('span', { class: 'skill-name', text: skill.name }),
                // Maîtrise ou Expertise due à un don (Observateur, Expert, Doué…) : renderFeatMentions
                el('button', { type: 'button', class: 'feat-mention skill-mention', 'data-feat-zone': `skills.${skill.id}`, hidden: true }),
                el('output', { class: 'skill-bonus', 'data-out': `skill:${skill.id}` })))
        ), extra);
    }
}

/** @param {string[]} types - familles de dons proposées (toutes, ou « Origine » pour l'Humain) */
function featOptions(types = FEAT_TYPE_ORDER) {
    const feats = Object.entries(FEATS_DATA).map(([id, f]) => ({ id, ...f }));
    return types.map(type => {
        const group = el('optgroup', { label: type === 'Épique' ? 'Faveurs épiques' : `Dons : ${type}` });
        feats.filter(f => f.type === type)
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
            .forEach(f => group.append(el('option', {
                value: f.id,
                text: f.aliases?.length ? `${f.name} (${f.aliases.join(', ')})` : f.name
            })));
        return group;
    });
}

// ---------------------------------------------------------------------------
// Dons repliés : toucher la pastille du niveau ne laisse que le titre du don (description et
// encadré « Dans la fiche » masqués). Choix retenu sur l'appareil (comme le thème), jamais dans
// la sauvegarde, sous la forme « emplacement:don » : un autre don choisi dans l'emplacement
// s'affiche déplié. Impression : tout est imprimé, replié ou non.
// ---------------------------------------------------------------------------

const FOLD_KEY = 'dd2024_feats_folded';

/** Dons repliés sur cet appareil : « numéro de l'emplacement:identifiant du don » */
function readFolded() {
    try {
        const list = JSON.parse(localStorage.getItem(FOLD_KEY) || '[]');
        return new Set(Array.isArray(list) ? list.map(String).filter(entry => entry.includes(':')) : []);
    } catch {
        return new Set();
    }
}

let foldedSlots = readFolded();

function saveFolded() {
    try {
        if (foldedSlots.size) localStorage.setItem(FOLD_KEY, JSON.stringify([...foldedSlots]));
        else localStorage.removeItem(FOLD_KEY);
    } catch {
        // Stockage indisponible (navigation privée) : le repli vaut pour la session
    }
}

/** Clé de repli de l'emplacement (son don décrit, posé par renderFeats) ; '' sans don */
const foldKey = (slot) => (slot.dataset.foldFeat ? `${slot.dataset.featSlot}:${slot.dataset.foldFeat}` : '');

/** Repli d'un emplacement posé sur la fiche. Sans don, la pastille n'est qu'un texte (« Niv. 8 ») */
function applyFold(slot) {
    const id = slot.dataset.featSlot;
    const button = slot.querySelector('.feat-badge');
    const key = foldKey(slot);
    const folded = key !== '' && foldedSlots.has(key);
    if ((slot.dataset.folded === 'true') !== folded) {
        if (folded) slot.dataset.folded = 'true';
        else delete slot.dataset.folded;
    }
    if (!key) {
        for (const name of ['aria-expanded', 'aria-controls', 'aria-label', 'title']) button.removeAttribute(name);
        return;
    }
    // Nom accessible qui commence par le texte visible (« Niv. 4 : replier… »)
    // Style de combat : « Niv. 1 » pour un Guerrier, « Niv. 2 » sinon (texte de la pastille, renderFeats)
    const visible = id === String(HUMAN_FEAT_SLOT) ? 'Niv. 1 (Humain)' : (button.firstElementChild?.textContent || `Niv. ${id}`);
    button.setAttribute('aria-expanded', String(!folded));
    button.setAttribute('aria-controls', `feat-desc-${id} feat-sheet-${id}`);
    button.setAttribute('aria-label', `${visible} : ${folded ? 'déplier' : 'replier'} la description du don`);
    button.title = folded ? 'Afficher la description' : 'Ne garder que le titre';
}

function bindFeatFolding(root) {
    root.querySelector('#feats').addEventListener('click', (event) => {
        const button = event.target.closest('.feat-badge');
        if (!button || button.disabled) return;
        const slot = button.closest('[data-feat-slot]');
        const key = foldKey(slot);
        if (!key) return;
        if (foldedSlots.has(key)) foldedSlots.delete(key);
        else {
            // Un seul don retenu par emplacement : l'ancien (don remplacé depuis) est oublié
            for (const entry of [...foldedSlots]) if (entry.startsWith(`${slot.dataset.featSlot}:`)) foldedSlots.delete(entry);
            foldedSlots.add(key);
        }
        saveFolded();
        applyFold(slot);
    });
    // Autre onglet du navigateur : même appareil, même choix
    window.addEventListener('storage', (event) => {
        if (event.key !== FOLD_KEY) return;
        foldedSlots = readFolded();
        for (const slot of root.querySelectorAll('#feats [data-feat-slot]')) applyFold(slot);
    });
}

function buildFeats(root) {
    root.querySelector('#feats').replaceChildren(...FEAT_SLOT_ORDER.map(level => {
        const human = level === HUMAN_FEAT_SLOT;
        const reserved = classFeatSlot(level);
        const style = Boolean(reserved?.style);
        // Second don de l'Humain (trait Polyvalent) : un don d'origine seulement ; style de combat :
        // un don de cette catégorie (ou, au niveau 2, Guerrier béni / druidique à la place)
        const select = el('select', {
            id: `f-feat_${level}`, class: 'input', 'data-field': `feat_${level}`,
            'aria-label': human ? "Second don d'origine (Humain, trait Polyvalent)"
                : style ? `${reserved.caption} (${featSlotName(level)})`
                : reserved ? `Don en plus du niveau ${level} (${reserved.caption})` : `Don du niveau ${level}`,
            'aria-describedby': `feat-when-${level}`
        }, el('option', {
            value: '',
            text: human ? "— Choisir un don d'origine —" : style ? '— Choisir un style de combat —' : '— Choisir un don —'
        }),
        featOptions(human ? ['Origine'] : style ? ['Style de combat'] : FEAT_TYPE_ORDER),
        level === STYLE_FEAT_SLOT
            ? el('optgroup', { label: 'À la place du style' }, Object.entries(STYLE_ALTERNATIVES).map(([id, alt]) =>
                el('option', { value: id, text: `${alt.name} (${alt.className})` })))
            : null);
        // data-feat-state (posé au rendu, voir featSlotState) : actif, à choisir, prévu ou à venir ;
        // la légende (« À venir », « Actif au niveau 12 ») ne s'affiche que pour les niveaux pas encore atteints ;
        // celle de l'emplacement de l'Humain dit d'où il vient (« Humain : Polyvalent »)
        // La pastille replie le don (bindFeatFolding) ; sans don choisi, rien à replier
        // Emplacements réservés (Humain, Guerrier, Roublard) : masqués jusqu'au premier rendu
        return el('div', { class: 'feat', 'data-feat-slot': String(level), hidden: human || Boolean(reserved) },
            el('div', { class: 'feat-head' },
                el('button', { type: 'button', class: 'feat-badge', disabled: true },
                    el('span', { text: `Niv. ${featSlotLevel(level)}` }), icon('chevron')),
                select,
                el('output', { class: 'feat-asi', 'data-out': `featAsi:${level}` }),
                el('span', { class: 'feat-when', id: `feat-when-${level}`, hidden: true },
                    icon(human || reserved ? 'user' : 'hourglass'), el('span', { class: 'feat-when-text' }))),
            el('div', { class: 'feat-desc', id: `feat-desc-${level}`, 'data-feat-desc': String(level), hidden: true }),
            // Ce que la fiche fait de ce don (calculs, rappels) : renderFeatSheet
            el('div', { class: 'feat-sheet', id: `feat-sheet-${level}`, 'data-feat-sheet': String(level), hidden: true }));
    }));
}

function buildStaticOptions(root) {
    fillSelect(root.querySelector('#f-char_class'),
        Object.values(DD_RULES.classes).map(c => [c.nameFr, c.nameFr]));
    fillSelect(root.querySelector('#f-char_species'),
        Object.values(DD_RULES.species).map(s => [s.nameFr, s.nameFr]));
    fillSelect(root.querySelector('#f-char_background'),
        Object.values(DD_RULES.backgrounds).map(b => [b.nameFr, b.nameFr]));
    root.querySelector('#f-heroic_destiny').replaceChildren(
        ...DD_RULES.heroicDestinies.map(h => el('option', { value: h.value, text: h.value ? h.name : '— Aucun —' })));
    root.querySelector('#f-spell_ability').replaceChildren(
        ...Object.entries(SPELL_ABILITY_LABELS).map(([value, label]) => el('option', { value, text: label })));
}

// ---------------------------------------------------------------------------
// Lecture des saisies
// ---------------------------------------------------------------------------

function readField(field) {
    if (field.type === 'checkbox') return field.checked;
    if (field.dataset.kind === 'rich') return sanitizeRich(field.innerHTML);
    if (field.dataset.type === 'number') {
        const n = parseInt(field.value, 10);
        return Number.isFinite(n) ? n : 0;
    }
    return field.value;
}

function bindFields(root, store) {
    const onEdit = (event) => {
        // Le champ lui-même, jamais un élément placé dans un texte saisi (voir sheetElements)
        const rich = event.target.closest(RICH_FIELD);
        const field = rich || event.target.closest('[data-field]');
        if (!field || !root.contains(field) || !field.dataset.field) return;
        // Mise en forme indisponible : le texte affiché est simplifié, il n'est jamais réenregistré
        if (rich && !richTextAvailable()) return;
        const key = field.dataset.field;
        const patch = { [key]: readField(field) };

        // Règle D&D : l'Expertise implique la maîtrise
        if (key.startsWith('skill_exp_') && patch[key] === true) {
            patch[key.replace('skill_exp_', 'skill_prof_')] = true;
        }
        if (key.startsWith('skill_prof_') && patch[key] === false) {
            patch[key.replace('skill_prof_', 'skill_exp_')] = false;
        }

        // Nouvelle classe : sous-classe remise à zéro si elle n'appartient pas à la classe,
        // dé de vie mis à jour (comme en v3)
        if (key === 'char_class') {
            if (!subclassesOf(patch.char_class).some(s => s.nameFr === store.get().char_subclass)) {
                patch.char_subclass = '';
            }
            const die = hitDieForClass(patch.char_class);
            if (die) patch.hd_type = die;
        }

        // Perception passive saisie puis effacée (champ quitté) : retour au calcul automatique,
        // comme la v3. Pendant la saisie, le champ vide reste affiché (le focus n'est pas perdu).
        if (key === 'passive_perception' && event.type === 'change' && !String(patch[key]).trim()) {
            patch.passive_perc_manual = '';
        }
        store.update(patch);
    };
    root.addEventListener('input', onEdit);
    root.addEventListener('change', onEdit);

    // Valeur calculée touchée (fiche déverrouillée) : elle devient une saisie libre, pré-remplie
    for (const button of root.querySelectorAll('[data-manual-switch]')) {
        const flag = button.dataset.manualSwitch;
        button.addEventListener('click', () => {
            if (isLocked()) return;
            store.update({ [flag]: 'true', passive_perception: String(deriveCharacter(store.get()).passivePerception) });
            const input = root.querySelector(`[data-manual-only="${flag}"]`);
            input?.focus();
            input?.select();
        });
    }
}

// ---------------------------------------------------------------------------
// Affichage
// ---------------------------------------------------------------------------

function subclassesOf(className) {
    const slug = Object.entries(DD_RULES.classes).find(([, c]) => c.nameFr === className)?.[0];
    return slug ? Object.values(DD_RULES.subclasses).filter(s => s.class === slug) : [];
}

/**
 * Garantit qu'une valeur enregistrée reste visible même si elle n'est pas dans la liste.
 * Les options « (valeur enregistrée) » d'une autre valeur (fiche précédente, choix
 * abandonné) sont retirées : elles ne doivent plus pouvoir être choisies.
 */
function ensureOption(select, value) {
    for (const option of select.querySelectorAll('option[data-legacy]')) {
        if (option.value !== value) option.remove();
    }
    if (!value || [...select.options].some(o => o.value === value)) return;
    select.append(el('option', { value, 'data-legacy': 'true', text: `${stripHTML(value)} (valeur enregistrée)` }));
}

/**
 * @param {boolean} force - fiche entièrement remplacée (import, chargement en ligne) : le champ
 *        en cours de saisie est aussi réécrit, sinon il garderait l'ancien texte et le renverrait
 */
function writeField(field, value, force = false) {
    if (field.type === 'checkbox') {
        field.checked = value === true;
        return;
    }
    if (!force && field === document.activeElement && field.tagName !== 'SELECT') return;

    if (field.dataset.kind === 'rich') {
        const html = sanitizeRich(value ?? '');
        if (field.innerHTML !== html) field.innerHTML = html;
        return;
    }
    if (field.tagName === 'SELECT') {
        const text = String(value ?? '');
        ensureOption(field, text);
        field.value = text;
        return;
    }
    const text = stripHTML(String(value ?? ''));
    if (field.value !== text) field.value = text;
}

function renderDynamicSelects(root, character, d) {
    // Sous-classes de la classe choisie
    const subSelect = root.querySelector('#f-char_subclass');
    const subs = subclassesOf(character.char_class);
    const wanted = subs.map(s => s.nameFr).join('|');
    if (subSelect.dataset.forClass !== wanted) {
        fillSelect(subSelect, subs.map(s => [s.nameFr, s.source === 'Odyssée' ? `${s.nameFr} (Odyssée)` : s.nameFr]));
        subSelect.dataset.forClass = wanted;
    }

    // Dés de vie utilisés : de 0 au niveau
    const hdSelect = root.querySelector('#f-hd_current');
    if (hdSelect.options.length !== d.level + 1 || hdSelect.querySelector('[data-legacy]')) {
        hdSelect.replaceChildren(...Array.from({ length: d.level + 1 }, (_, i) => el('option', { value: String(i), text: String(i) })));
    }

    // Caractéristique d'incantation avec son modificateur
    for (const option of root.querySelector('#f-spell_ability').options) {
        const label = SPELL_ABILITY_LABELS[option.value];
        if (label) option.textContent = option.value === 'none' ? label : `${label} (${signed(d.mods[option.value])})`;
    }
}

function renderClassResource(root, character, d) {
    const box = root.querySelector('#class-resource');
    const slots = box.querySelector('#class-resource-slots');
    const { count, label } = d.classResource;
    if (slots.childElementCount !== count) {
        slots.replaceChildren(...Array.from({ length: count }, (_, i) => el('input', {
            type: 'checkbox', class: 'round-check', 'data-field': `class_res_${i}`,
            'aria-label': `${label} ${i + 1}`
        })));
    }
    box.classList.toggle('muted', count === 0);
}

const OUTPUTS = {
    armorClass: (d) => d.armorClass.value,
    initiative: (d) => signed(d.initiative),
    passivePerception: (d) => d.passivePerception,
    pb: (d) => signed(d.pb),
    level: (d) => d.level,
    classResourceLabel: (d) => d.classResource.count ? d.classResource.label : 'Ressource de classe',
    exhaustion: (d) => d.exhaustion.dead ? 'Mort'
        : d.exhaustion.level ? `${d.exhaustion.d20Penalty} aux tests de d20 ; vitesse -${String(d.exhaustion.speedPenaltyM).replace('.', ',')} m` : 'Aucun effet',
    renownTier: (d) => d.renownTier,
    spellDc: (d) => d.spellcasting ? d.spellcasting.dc : '—',
    spellAttack: (d) => d.spellcasting ? signed(d.spellcasting.attack) : '—',
    mod: (d, id) => signed(d.mods[id]),
    save: (d, id) => signed(d.saves[id].bonus),
    skill: (d, id) => signed(d.skills[id].bonus),
    featAsi: (d, level, character) => {
        const asi = FEATS_DATA[character[`feat_${level}`]]?.asi;
        return asi && asi !== 'Aucune' ? asi : '';
    }
};

// ---------------------------------------------------------------------------
// Écusson CA : la toucher (ou la survoler) affiche l'addition complète
// ---------------------------------------------------------------------------

let acBubble = null;
let lastArmorClass = null;

/** Contenu de la bulle : une ligne par élément compté, le total, puis les remarques */
function armorClassBubble() {
    const ac = lastArmorClass;
    if (!ac) return null;
    const parts = ac.parts ?? [];
    const items = parts.map(part => el('li', {},
        el('span', { class: 'ac-calc-label', text: part.label }),
        el('span', { class: 'ac-calc-value', text: part.value }),
        // « +2 bouclier » répète la valeur : seul un calcul (« = ») ou une précision entre parenthèses est utile
        /[=(]/.test(part.formula) ? el('small', { class: 'ac-calc-formula', text: part.formula }) : null));
    return [
        el('div', { class: 'spell-tooltip-head' },
            el('strong', { class: 'spell-tooltip-name', text: "Classe d'armure" })),
        el('ul', { class: 'ac-calc-list' }, ...items),
        parts.length > 1
            ? el('p', { class: 'ac-calc-total' }, el('span', { text: 'Total' }), el('span', { text: String(ac.value) }))
            : null,
        ...(ac.notes ?? []).map(text => el('p', { class: 'armor-ca-note', text })),
        el('p', { class: 'ac-calc-hint', text: 'Le détail de chaque ligne est dans le tableau des armures.' })
    ];
}

function bindArmorClassBubble(root) {
    const badge = root.querySelector('.ac-hex');
    if (!badge) return;
    acBubble = createCalcBubble({ id: 'ac-bubble', className: 'armor-ca-bubble ac-bubble' });
    acBubble.attach(badge, armorClassBubble);
    // Élément non bouton : Entrée et Espace l'ouvrent comme un clic
    badge.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        badge.click();
    });
}

/**
 * Valeur affichée par un élément data-out="nom" ou "nom:argument" ('' si le nom est inconnu).
 * Object.hasOwn : un nom comme « __proto__ » ou « constructor » ne désigne jamais une fonction.
 * @param {string} spec - valeur de data-out
 * @param {Object} d - deriveCharacter()
 * @param {Object} character
 * @returns {string|number}
 */
export function outputValue(spec, d, character) {
    const [name, arg] = String(spec ?? '').split(':');
    return (Object.hasOwn(OUTPUTS, name) ? OUTPUTS[name](d, arg, character) : undefined) ?? '';
}

function renderOutputs(root, character, d) {
    for (const out of sheetElements(root, '[data-out]')) {
        out.textContent = outputValue(out.dataset.out, d, character);
    }
    lastArmorClass = d.armorClass;
    root.querySelector('.ac-hex').setAttribute('aria-label', `Classe d'armure ${d.armorClass.value} : détail du calcul`);
    acBubble?.refresh();
    // Détail de l'Initiative calculée (« Dex +2, Vigilant +2 »)
    root.querySelector('[data-out="initiative"]').title = `Initiative : ${d.initiativeDetail}`;

    // Perception passive : valeur calculée (la toucher, fiche déverrouillée, permet d'en saisir
    // une autre), ou saisie libre (passive_perc_manual, même clé que la v3)
    const manual = String(character.passive_perc_manual) === 'true';
    const ppSwitch = root.querySelector('[data-manual-switch="passive_perc_manual"]');
    ppSwitch.hidden = manual;
    ppSwitch.disabled = isLocked();
    ppSwitch.setAttribute('aria-label', `Perception passive calculée : ${d.passivePerception}. Saisir une autre valeur`);
    root.querySelector('[data-manual-only="passive_perc_manual"]').hidden = !manual;

    // Épuisement élevé mis en évidence (comme la v3) : avertissement dès 3, danger dès 5
    const exhaustion = root.querySelector('[data-out="exhaustion"]');
    const severity = exhaustionSeverity(character.fatigue_level);
    if (severity) exhaustion.dataset.severity = severity;
    else delete exhaustion.dataset.severity;
}

/** Légende des emplacements pas encore atteints (le don reste modifiable : on peut le prévoir).
 *  Emplacement libre : « À venir » suffit, la pastille dit déjà le niveau. */
const FEAT_WHEN = {
    upcoming: () => 'À venir',
    planned: (level) => `Actif au niveau ${level}`
};

function renderFeats(root, character, d, effects, counters) {
    const human = isHuman(character);
    for (const level of FEAT_SLOT_ORDER) {
        const slot = root.querySelector(`[data-feat-slot="${level}"]`);
        const humanSlot = level === HUMAN_FEAT_SLOT;
        const reserved = classFeatSlot(level);
        const counts = featSlotCounts(level, character);
        const chosen = stripHTML(String(character[`feat_${level}`] ?? '')) !== '';
        // Emplacement de l'Humain ou d'une classe : affiché s'il compte, ou s'il garde un don (espèce
        // ou classe changée ensuite : le don est montré, ne compte pas, la valeur saisie n'est pas effacée)
        if (humanSlot || reserved) slot.hidden = !counts && !chosen;
        // Niveau d'acquisition : le style de combat du Guerrier est au niveau 1
        const slotLevel = featSlotLevelFor(level, character);
        const badgeText = slot.querySelector('.feat-badge > span');
        if (badgeText.textContent !== `Niv. ${slotLevel}`) badgeText.textContent = `Niv. ${slotLevel}`;
        let state = featSlotState(slotLevel, d.level, character[`feat_${level}`]);
        if (!counts && chosen) state = 'planned';
        if (slot.dataset.featState !== state) slot.dataset.featState = state;
        const when = slot.querySelector('.feat-when');
        // Don de classe : « À venir » / « Actif au niveau 14 » tant qu'il n'est pas atteint
        const caption = humanSlot
            ? (human ? 'Humain : Polyvalent' : 'Réservé aux Humains')
            : reserved && !counts ? reserved.reserved
            : FEAT_WHEN[state]?.(slotLevel) ?? (reserved ? reserved.caption : '');
        const text = when.querySelector('.feat-when-text');
        if (text.textContent !== caption) text.textContent = caption;
        when.hidden = !caption;

        const box = root.querySelector(`[data-feat-desc="${level}"]`);
        // Même lecture que les règles (featSlots, js/rules/feats.js) : valeur nettoyée du HTML
        // des anciennes sauvegardes, pour que le don qui compte soit aussi celui qui est décrit
        const featId = stripHTML(String(character[`feat_${level}`] ?? ''));
        // Guerrier béni / druidique (à la place du style de combat) : pas un don, mais décrit pareil
        const alternative = level === STYLE_FEAT_SLOT && Object.hasOwn(STYLE_ALTERNATIVES, featId) ? STYLE_ALTERNATIVES[featId] : null;
        const feat = Object.hasOwn(FEATS_DATA, featId) ? FEATS_DATA[featId]
            : alternative ? { prereq: `${alternative.className} niveau 2`, desc: alternative.desc } : undefined;
        box.hidden = !feat;
        if (feat) {
            box.innerHTML = sanitizeRulesText(`<strong>Prérequis :</strong> ${feat.prereq}<br>${feat.desc || '<em>Description à compléter.</em>'}`);
        }
        const badge = slot.querySelector('.feat-badge');
        if (badge.disabled !== !feat) badge.disabled = !feat;
        const foldFeat = feat ? featId : '';
        if (slot.dataset.foldFeat !== foldFeat) slot.dataset.foldFeat = foldFeat;
        applyFold(slot);
        const activeId = state === 'active' && feat ? featId : '';
        renderFeatSheet(root.querySelector(`[data-feat-sheet="${level}"]`), activeId, level, effects,
            // Don pris dans deux emplacements : ses cases restent sous le premier (le second a une alerte)
            counters.filter(counter => counter.featId === activeId && counter.level === level), character);
    }
}

// ---------------------------------------------------------------------------
// Dons à usages limités : cases cochées = usages dépensés (js/rules/feat-uses.js)
// Mêmes cases dans l'onglet Combat et dans l'encadré du don ; elles restent utilisables fiche
// verrouillée (état de jeu, comme la ressource de classe) et se vident au repos.
// Les capacités de sous-classe à usages limités (js/rules/subclass-uses.js, clé subclass_uses) ont
// les mêmes cases, dans l'onglet Combat seulement.
// ---------------------------------------------------------------------------

/** Groupe de cases d'un compteur ; `where` distingue les deux endroits pour les identifiants */
function counterGroup(counter, where) {
    const id = `feat-counter-${where}-${counter.key}`;
    return el('div', {
        class: 'feat-counter', 'data-feat-counter': counter.key, 'data-max': String(counter.max),
        // Capacité de sous-classe : clé subclass_uses (sinon feat_uses)
        'data-counter-source': counter.source === 'subclass' ? 'subclass' : 'feat'
    },
        el('span', { class: 'feat-counter-name', id: `${id}-name` },
            el('span', { class: 'label accent', text: counter.label }),
            el('small', { class: 'feat-counter-meta', text: `${counter.featName} · ${counter.resetText}` })),
        el('div', { class: 'resource-slots', role: 'group', 'aria-labelledby': `${id}-name` },
            Array.from({ length: counter.max }, (_, i) => el('input', {
                type: 'checkbox', class: 'round-check', 'data-feat-use': counter.key,
                'aria-label': `${counter.label} : ${i + 1} sur ${counter.max} (cochée = dépensé)`
            }))),
        el('small', { class: 'feat-counter-use', text: counter.use }));
}

/** Coche les `used` premières cases de chaque compteur (sans reconstruire : le focus reste) */
function syncCounterChecks(root, counters) {
    for (const counter of counters) {
        for (const group of root.querySelectorAll(`[data-feat-counter="${counter.key}"]`)) {
            group.querySelectorAll('input[data-feat-use]').forEach((box, i) => {
                const checked = i < counter.used;
                if (box.checked !== checked) box.checked = checked;
            });
        }
    }
}

/** Bande « dons » de l'onglet Combat (et capacités de sous-classe), masquée si rien n'a de cases */
function renderFeatCounters(root, counters) {
    const box = root.querySelector('#feat-counters');
    // (le rechargement peut changer avec le niveau : Flash protecteur, repos court au niveau 6)
    const signature = JSON.stringify(counters.map(({ key, max, label, resetText, featName, use }) => [key, max, label, resetText, featName, use]));
    if (renderedSignatures.get(box) !== signature) {
        renderedSignatures.set(box, signature);
        box.replaceChildren(...counters.map(counter => counterGroup(counter, 'combat')));
    }
    box.hidden = counters.length === 0;
}

/** Une case touchée : nombre de cases cochées du groupe → feat_uses */
function bindFeatCounters(root, store) {
    root.addEventListener('change', (event) => {
        const box = event.target.closest('input[data-feat-use]');
        if (!box || !root.contains(box)) return;
        const group = box.closest('[data-feat-counter]');
        // Comme les emplacements de sorts : toucher la 3e case coche les 3 premières, décocher la 1re
        // les vide toutes (les cases cochées sont toujours les premières)
        const boxes = [...group.querySelectorAll('input[data-feat-use]')];
        const index = boxes.indexOf(box);
        const used = box.checked ? index + 1 : index;
        const setPatch = group.dataset.counterSource === 'subclass' ? setSubclassUsesPatch : setFeatUsesPatch;
        store.update(setPatch(store.get(), box.dataset.featUse, used, Number(group.dataset.max)));
    });
}

// ---------------------------------------------------------------------------
// Dons : mentions près des valeurs et encadré « Dans la fiche »
// Les notes viennent de featEffects (js/rules/feat-effects.js). Règle validée par Franck :
// une valeur saisie à la main (PV max…) n'est jamais modifiée, la fiche affiche seulement
// « dont +X grâce à <don> » ; une valeur calculée (Initiative) intègre le don.
// ---------------------------------------------------------------------------

/** Libellé court d'une mention, par famille de zone ; le détail s'ouvre au toucher */
const MENTION_LABELS = {
    initiative: (note) => ['athlete_remarquable', 'assassinat'].includes(note.featId) ? `Avantage (${note.featName})` : note.featName,
    // espaces insécables : le chiffre ne reste jamais seul en bout de ligne
    hpMax: (note) => `dont\u00a0+${note.value} grâce à ${note.featName}`,
    // Résistance de sous-classe : mention courte fournie avec la note (subclass-combat.js)
    armorClass: (note) => note.mention ?? ({
        // C/P/T : seuls les dégâts contondants, perforants et tranchants d'une attaque sont réduits
        maitre_des_armures_lourdes: `Dégâts C/P/T\u00a0−${note.value}`,
        maitre_des_armures_intermediaires: 'Dex max 3',
        maitre_des_boucliers: `Coup de bouclier DD\u00a0${note.value}`,
        duelliste_defensif: `Parade\u00a0+${note.value}`,
        defense: 'Défense\u00a0+1',
        faveur_de_l_esprit_nocturne: 'Résistance (ombre)'
    })[note.featId] ?? note.featName,
    speed: (note) => ({
        athlete: 'Escalade\u00a0= Vitesse',
        monte_en_l_air: 'Escalade\u00a0= Vitesse',
        affinite_aquatique: 'Nage\u00a0= Vitesse'
    })[note.featId] ?? `dont\u00a0+${note.value}\u00a0m grâce à ${note.featName}`,
    deathSaves: (note) => `Avantage (${note.featName})`,
    saves: (note) => ({
        mage_de_guerre: 'Avantage Concentration',
        maitre_des_boucliers: 'Interposition',
        // Capacité de classe (Paladin niveau 6), déjà comptée dans le jet
        aura_de_protection: `dont\u00a0+${note.value} Aura`
    })[note.featId] ?? note.featName,
    // Augmentation d'un don à choix : « +2 don niv. 4 » (la valeur saisie n'est pas modifiée)
    scores: (note) => `+${note.value}\u00a0don ${Number(note.slot) === HUMAN_FEAT_SLOT ? 'humain' : `niv.\u00a0${note.slot}`}`,
    // Touche-à-tout (Barde niveau 2), déjà compté : « +1 Touche-à-tout »
    skills: (note) => note.featId === 'touche_a_tout' ? `+${note.value}\u00a0Touche-à-tout` : note.featName
};

/** Titre de la fenêtre de détail d'une zone */
function zoneTitle(zone) {
    if (zone === 'initiative') return 'Initiative';
    if (zone === 'hpMax') return 'Points de vie maximum';
    if (zone === 'armorClass') return "Classe d'armure";
    if (zone === 'speed') return 'Vitesse';
    if (zone === 'deathSaves') return 'Jets contre la mort';
    const [family, id] = zone.split('.');
    if (family === 'skills') return `Compétence : ${SKILLS.find(skill => skill.id === id)?.name ?? id}`;
    const name = ABILITIES.find(a => a.id === id)?.name ?? '';
    if (family === 'scores') return name;
    return `Jet de sauvegarde ${/^[AEIOUÉ]/.test(name) ? "d'" : 'de '}${name}`;
}

/** Notes d'une zone ; la CA reprend aussi le Coup de bouclier (rangé avec les armes) */
function zoneNotes(effects, zone) {
    const notes = effects[zone] ?? [];
    if (zone !== 'armorClass') return notes;
    return [...notes, ...effects.weapons.filter(note => note.featId === 'maitre_des_boucliers')];
}

/** Une mention par don actif de la zone (un don sans effet pour le moment n'en a pas) */
function zoneMentions(zone, notes) {
    const family = zone.split('.')[0];
    const label = Object.hasOwn(MENTION_LABELS, family) ? MENTION_LABELS[family] : (note) => note.featName;
    const byFeat = new Map();
    for (const note of notes) {
        if (note.inactive) continue;
        // Un don répétable pris deux fois (Amélioration de caractéristique) : une mention par emplacement
        const key = `${note.featId}:${note.slot ?? ''}`;
        // La note chiffrée de chaque don donne la mention (« dont +8 », « DD 13 »)
        const kept = byFeat.get(key);
        if (!kept || (kept.value === undefined && note.value !== undefined)) byFeat.set(key, note);
    }
    // Deux sources du même effet (Athlète et Monte-en-l'air : « Escalade = Vitesse ») : une seule pastille
    return [...new Set([...byFeat.values()].map(note => label(note)))];
}

/** Liste des notes de dons (fenêtre de détail) */
function featNotesList(notes) {
    return el('ul', { class: 'feat-notes' }, notes.map(note => el('li', { class: note.inactive ? 'is-inactive' : null },
        el('strong', {
            class: 'feat-notes-name',
            text: note.slot !== undefined ? `${note.featName} (${featSlotName(note.slot).replace('niveau', 'niv.')})` : note.featName
        }),
        el('span', { text: note.text }),
        note.applied ? el('span', { class: 'feat-tag', text: 'Déjà compté' }) : null,
        note.manual ? el('span', { class: 'feat-tag', 'data-kind': 'manual', text: 'À reporter' }) : null,
        note.check ? el('span', { class: 'feat-tag', 'data-kind': 'check', text: 'À vérifier' }) : null,
        note.ticked ? el('span', { class: 'feat-tag', 'data-kind': 'done', text: 'Coché' }) : null)));
}

/** Notes affichées par chaque bouton de mention (lues au toucher) */
const mentionNotes = new WeakMap();
/** Signature du contenu déjà affiché (évite de reconstruire à chaque saisie) */
const renderedSignatures = new WeakMap();

/** Phrase d'introduction de la fenêtre de détail : dons, capacités de classe, ou les deux */
function featNotesIntro(notes) {
    const classNotes = notes.some(note => note.classFeature);
    const featNotes = notes.some(note => !note.classFeature);
    if (classNotes && featNotes) return 'Effets des dons et des capacités de classe du personnage :';
    if (classNotes) return 'Capacité de classe du personnage :';
    return 'Effets des dons atteints par le personnage :';
}

function openFeatNotes(button) {
    const zone = button.dataset.featZone;
    const notes = mentionNotes.get(button) ?? [];
    openModal({
        title: zoneTitle(zone),
        icon: 'star',
        body: [
            el('p', { class: 'feat-notes-intro', text: featNotesIntro(notes) }),
            featNotesList(notes)
        ],
        actions: [{ label: 'Fermer', primary: true }]
    });
}

/**
 * Mentions dorées près des valeurs (Initiative, PV max, CA, jets de sauvegarde). Un seul bouton
 * par zone : un toucher ouvre le détail (les infobulles n'existent pas sur tablette).
 */
function renderFeatMentions(root, effects) {
    for (const button of sheetElements(root, '[data-feat-zone]')) {
        const zone = button.dataset.featZone;
        const notes = zoneNotes(effects, zone);
        const labels = zoneMentions(zone, notes);
        // Case due à un don pas cochée, valeur au-delà de 20… : la mention le signale (« À vérifier »)
        const check = notes.some(note => note.check && !note.inactive);
        const signature = JSON.stringify([labels, check, notes.map(note => note.text)]);
        if (renderedSignatures.get(button) === signature) continue;
        renderedSignatures.set(button, signature);
        mentionNotes.set(button, notes);

        button.hidden = labels.length === 0;
        button.toggleAttribute('data-check', check);
        button.replaceChildren(...labels.map(label => el('span', { class: 'feat-mention-line' },
            icon('star'), el('span', { text: label }))),
        ...(check ? [el('span', { class: 'feat-mention-line feat-mention-check' }, icon('warning'), el('span', { text: 'À vérifier' }))] : []));
        button.title = notes.map(note => `${note.featName} : ${note.text}`).join('\n');
        button.setAttribute('aria-haspopup', 'dialog');
        const what = notes.every(note => note.classFeature) ? 'de la capacité de classe' : 'des dons';
        button.setAttribute('aria-label', `${labels.join(', ')}${check ? ', à vérifier' : ''} : détail ${what} (${zoneTitle(zone)})`);
    }
}

/**
 * Étiquette d'une note dans l'encadré « Dans la fiche » : [data-kind, texte].
 * « À reporter » : chiffre qui porte sur une valeur saisie à la main (Robuste et les PV max),
 * que la fiche n'ajoute jamais elle-même ; « Calculé » : chiffre établi par la fiche.
 */
function noteKind(note) {
    if (note.inactive) return ['waiting', 'En attente'];
    if (note.check) return ['check', 'À vérifier'];
    if (note.manual) return ['manual', 'À reporter'];
    if (note.ticked) return ['done', 'Coché'];
    if (note.applied || note.value !== undefined) return ['calc', 'Calculé'];
    return ['reminder', 'Rappel'];
}

/**
 * Zones dont l'encadré reprend les notes ('featSlot' : résumé de l'emplacement). Guérisseur :
 * notes de soins complètes ; Mage de guerre : résumé, puis les rappels de sorts, que l'onglet
 * Magie n'affiche pas.
 */
const FEAT_SHEET_ZONES = { guerisseur: ['healing'], mage_de_guerre: ['featSlot', 'spells'] };

/**
 * Menus des choix d'un don (lots 3 et 6, js/rules/feat-choices.js) : caractéristique, compétence,
 * type de dégâts, sorts… Ils ne cochent rien et ne changent aucune valeur saisie ; fiche
 * verrouillée, ils restent lisibles mais ne se modifient plus (data-build-control, lock.js).
 * Les menus de sorts d'Initié à la magie suivent la liste choisie, et ceux de Magie rituelle
 * n'apparaissent qu'au niveau où le don en donne un de plus : voir syncChoices.
 * @returns {HTMLElement|null} null si le don n'a rien à choisir
 */
function choiceControls(featId, level) {
    const rule = Object.hasOwn(FEAT_CHOICE_RULES, featId) ? FEAT_CHOICE_RULES[featId] : null;
    // Gaillard, Duelliste défensif… : +1 sans choix (fixedAbility), aucun menu
    if (!rule || !rule.fields.length) return null;
    const option = ([value, text]) => el('option', { value, text });
    return el('div', {
        class: 'feat-choices', role: 'group', 'aria-label': `Choix du don ${featName(featId)} (${featSlotName(level)})`,
        'data-feat-choice-slot': String(level), 'data-feat-choice-feat': featId
    },
        rule.fields.map(field => {
            const id = `feat-choice-${level}-${field.key}`;
            const options = field.groups
                ? field.groups.map(([label, from, to]) => el('optgroup', { label }, field.options.slice(from, to).map(option)))
                : field.options.map(option);
            // Options d'un menu dépendant (sorts de la liste choisie) : posées par syncChoices
            return el('div', { class: field.wide ? 'feat-choice is-wide' : 'feat-choice' },
                el('label', { class: 'feat-choice-label', for: id, text: field.label }),
                el('select', { id, class: 'input', 'data-feat-choice': field.key, 'data-build-control': 'true' },
                    el('option', { value: '', text: '— Choisir —' }), field.optionsBy ? [] : options));
        }));
}

/**
 * Menus remis sur les choix enregistrés (sans reconstruire : le focus reste). Un menu dépendant
 * reçoit les options de l'autre choix (« Choisissez d'abord la liste » sinon) ; un menu pas encore
 * utile au niveau du personnage est masqué.
 * @param {HTMLElement} container
 * @param {string} featId
 * @param {Object<string, string>} choice - slotChoice()
 * @param {Object} character
 */
function syncChoices(container, featId, choice, character) {
    const rule = FEAT_CHOICE_RULES[featId];
    for (const select of container.querySelectorAll('select[data-feat-choice]')) {
        const field = rule?.fields.find(f => f.key === select.dataset.featChoice);
        if (!field) continue;
        select.closest('.feat-choice').hidden = !fieldActive(field, character);
        if (field.optionsBy) {
            const source = choice[field.dependsOn] ?? '';
            if (select.dataset.optionsFor !== source) {
                select.dataset.optionsFor = source;
                const options = fieldOptions(field, choice);
                select.replaceChildren(
                    el('option', { value: '', text: source ? '— Choisir —' : "— Choisissez d'abord la liste —" }),
                    ...options.map(([value, text]) => el('option', { value, text })));
            }
        }
        const value = choice[field.key] ?? '';
        if (select.value !== value) select.value = value;
    }
}

/** Un choix modifié : enregistré dans feat_choices (rien d'autre ne change) */
function bindFeatChoices(root, store) {
    root.addEventListener('change', (event) => {
        const select = event.target.closest('select[data-feat-choice]');
        if (!select || !root.contains(select) || isLocked()) return;
        const group = select.closest('[data-feat-choice-slot]');
        const patch = setFeatChoicePatch(store.get(), group.dataset.featChoiceSlot, group.dataset.featChoiceFeat,
            select.dataset.featChoice, select.value);
        if (Object.keys(patch).length) store.update(patch);
    });
}

/** Parties de l'encadré déjà construites : { structure, choices, list, notesSignature } */
const featSheetParts = new WeakMap();

/**
 * Encadré « Dans la fiche » sous la description d'un don actif : les choix du don (lot 3), puis ce
 * que la fiche calcule ou rappelle pour ce don, ou « rappel seulement » si elle ne l'applique pas.
 * Les menus de choix et les cases du don ne sont reconstruits que si le don change (le focus reste).
 * @param {HTMLElement} box
 * @param {string} featId - don actif de l'emplacement ('' : encadré masqué)
 * @param {number} level - niveau de l'emplacement
 * @param {Object} effects - featEffects()
 * @param {Object[]} counters - compteurs du don (featCounters), souvent aucun
 * @param {Object} character
 */
function renderFeatSheet(box, featId, level, effects, counters, character) {
    box.hidden = !featId;
    const zones = (FEAT_SHEET_ZONES[featId] ?? ['featSlot']).map(zone => (zone === 'featSlot' ? `featSlot:${level}` : zone));
    const notes = featId ? zones.flatMap(zone => effects[zone] ?? []).filter(note => note.featId === featId) : [];
    // Les cases cochées ne reconstruisent pas l'encadré (syncCounterChecks) : seul leur nombre compte ici
    const structure = JSON.stringify([featId, counters.map(counter => [counter.key, counter.max, counter.label])]);
    let parts = featSheetParts.get(box);
    if (!parts || parts.structure !== structure) {
        parts = { structure, choices: null, list: null, notesSignature: null };
        featSheetParts.set(box, parts);
        if (!featId) {
            box.replaceChildren();
            return;
        }
        parts.choices = choiceControls(featId, level);
        parts.list = el('div', { class: 'feat-sheet-body' });
        // replaceChildren écrirait « null » en toutes lettres : on ne lui passe que des nœuds
        box.replaceChildren(...[
            el('span', { class: 'feat-sheet-title' }, icon('gear'), el('span', { text: 'Dans la fiche' })),
            parts.choices,
            parts.list,
            ...counters.map(counter => counterGroup(counter, `slot${level}`))
        ].filter(Boolean));
    }
    if (!featId) return;
    if (parts.choices) syncChoices(parts.choices, featId, slotChoice(character, level, featId), character);
    const notesSignature = JSON.stringify(notes);
    if (parts.notesSignature === notesSignature) return;
    parts.notesSignature = notesSignature;
    // Don que la fiche ne calcule pas : ses notes éventuelles (son +1, une alerte « même don pris
    // deux fois ») puis « le reste : rappel seulement »
    const automated = AUTOMATED_FEATS.includes(featId);
    const items = notes.map(note => {
        const [kind, tag] = noteKind(note);
        return el('li', { 'data-kind': kind },
            el('span', { class: 'feat-tag', text: tag }), el('span', { text: note.text }));
    });
    parts.list.replaceChildren(...[
        items.length ? el('ul', { class: 'feat-sheet-list' }, items) : null,
        automated && items.length ? null : el('p', {
            class: 'feat-sheet-none',
            text: items.length
                ? 'Le reste du don : rappel seulement, sa description ci-dessus fait foi.'
                : 'Rappel seulement : la fiche ne calcule rien pour ce don, sa description ci-dessus fait foi.'
        })
    ].filter(Boolean));
}

/** Compétences maîtrisées (et expertes) mises en avant : la règle vient de deriveCharacter */
function renderSkillRanks(root, d) {
    for (const row of root.querySelectorAll('.skill-row[data-skill]')) {
        const skill = d.skills[row.dataset.skill];
        const rank = skill?.expertise ? 'expertise' : skill?.proficient ? 'proficient' : 'none';
        if (row.dataset.rank !== rank) row.dataset.rank = rank;
    }
}

function render(root, character, replaced = false) {
    const d = deriveCharacter(character);
    renderDynamicSelects(root, character, d);
    renderClassResource(root, character, d);
    for (const field of sheetElements(root, '[data-field]')) {
        // Une valeur inattendue (fiche fabriquée) n'empêche pas d'afficher les autres champs
        try {
            writeField(field, character[field.dataset.field], replaced);
        } catch (error) {
            console.error(`Champ « ${field.dataset.field} » illisible :`, error);
        }
    }
    const effects = featEffects(character, d);
    const counters = featCounters(character, d);
    renderOutputs(root, character, d);
    renderFeats(root, character, d, effects, counters);
    // Bande de l'onglet Combat : cases des dons, puis celles de la sous-classe
    const combatCounters = [...counters, ...subclassCounters(character, d)];
    renderFeatCounters(root, combatCounters);
    syncCounterChecks(root, combatCounters);
    renderFeatMentions(root, effects);
    renderSkillRanks(root, d);
    applyLock(root);
}

/**
 * Construit la fiche dans `root` et la relie au store.
 * @param {HTMLElement} root
 * @param {ReturnType<import('../state/store.js').createStore>} store
 */
export function createSheet(root, store) {
    buildStaticOptions(root);
    buildAbilities(root);
    buildSkills(root);
    buildFeats(root);
    // Modifiables seulement si la mise en forme est disponible (applyLock, lock.js)
    for (const rich of sheetElements(root, RICH_FIELD)) {
        rich.contentEditable = richTextAvailable() ? 'true' : 'false';
        rich.setAttribute('role', 'textbox');
        rich.setAttribute('aria-multiline', 'true');
        rich.setAttribute('aria-keyshortcuts', 'Alt+F10');
    }
    bindFields(root, store);
    bindFeatCounters(root, store);
    bindFeatChoices(root, store);
    bindFeatFolding(root);
    bindArmorClassBubble(root);
    // Mention d'un don (Initiative, PV max, CA, sauvegardes) : détail dans une fenêtre,
    // même fiche verrouillée (lecture seule)
    root.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-feat-zone]');
        if (button && root.contains(button)) openFeatNotes(button);
    });
    store.subscribe((character, changedKeys) => render(root, character, changedKeys === null));
    // Verrouillage : la valeur calculée de la perception passive n'est plus remplaçable
    document.addEventListener('dd:lockchange', () => {
        for (const button of root.querySelectorAll('[data-manual-switch]')) button.disabled = isLocked();
    });
    render(root, store.get());
}
