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

import { ABILITIES, SKILLS_BY_STAT } from '../data/constants.js';
import { DD_RULES } from '../data/dd-rules.js';
import { FEATS_DATA } from '../data/feats.js';
import { FEAT_LEVELS } from '../state/schema.js';
import { stripHTML } from '../state/migrate.js';
import { deriveCharacter, hitDieForClass } from '../rules/character.js';
import { sanitizeRich, sanitizeRulesText } from './sanitize.js';
import { el, fillSelect, icon, signed } from './dom.js';
import { applyLock } from './lock.js';

const SKILL_STATS = ['str', 'dex', 'int', 'wis', 'cha'];
// Icônes dorées des groupes de compétences (dessinées par dom.js, à la place des émojis)
const SKILL_GROUP_ICONS = { str: 'arm', dex: 'feather', int: 'book', wis: 'eye', cha: 'sparkle' };
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
        el('div', { class: 'save' },
            el('input', {
                type: 'checkbox', class: 'round-check', 'data-field': `${a.id}_save_prof`,
                'aria-label': `Maîtrise du jet de sauvegarde de ${a.name}`
            }),
            el('span', { text: 'Sauv.' }),
            el('output', { 'data-out': `save:${a.id}` }))
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
            SKILLS_BY_STAT[stat].map(skill => el('div', { class: 'skill-row' },
                el('input', {
                    type: 'checkbox', class: 'round-check', 'data-field': `skill_prof_${skill.id}`,
                    'aria-label': `Maîtrise : ${skill.name}`
                }),
                el('input', {
                    type: 'checkbox', class: 'round-check expertise', 'data-field': `skill_exp_${skill.id}`,
                    'aria-label': `Expertise : ${skill.name}`
                }),
                el('span', { class: 'skill-name', text: skill.name }),
                el('output', { class: 'skill-bonus', 'data-out': `skill:${skill.id}` })))
        ), extra);
    }
}

function featOptions() {
    const feats = Object.entries(FEATS_DATA).map(([id, f]) => ({ id, ...f }));
    return FEAT_TYPE_ORDER.map(type => {
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

function buildFeats(root) {
    root.querySelector('#feats').replaceChildren(...FEAT_LEVELS.map(level => {
        const select = el('select', {
            id: `f-feat_${level}`, class: 'input', 'data-field': `feat_${level}`,
            'aria-label': `Don du niveau ${level}`
        }, el('option', { value: '', text: '— Choisir un don —' }), featOptions());
        return el('div', { class: 'feat' },
            el('div', { class: 'feat-head' },
                el('span', { class: 'feat-badge', text: `Niv. ${level}` }),
                select,
                el('output', { class: 'feat-asi', 'data-out': `featAsi:${level}` })),
            el('div', { class: 'feat-desc', 'data-feat-desc': String(level), hidden: true }));
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
        const field = event.target.closest('[data-field]');
        if (!field || !root.contains(field)) return;
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
        store.update(patch);
    };
    root.addEventListener('input', onEdit);
    root.addEventListener('change', onEdit);
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

function renderOutputs(root, character, d) {
    for (const out of root.querySelectorAll('[data-out]')) {
        const [name, arg] = out.dataset.out.split(':');
        const value = OUTPUTS[name]?.(d, arg, character);
        out.textContent = value ?? '';
    }
    root.querySelector('[data-out="armorClass"]').title = d.armorClass.source;

    // Perception passive : valeur calculée, ou saisie libre si la fiche v3 l'avait rendue manuelle
    const manual = String(character.passive_perc_manual) === 'true';
    root.querySelector('[data-out="passivePerception"]').hidden = manual;
    root.querySelector('[data-manual-only="passive_perc_manual"]').hidden = !manual;
}

function renderFeats(root, character) {
    for (const level of FEAT_LEVELS) {
        const box = root.querySelector(`[data-feat-desc="${level}"]`);
        const feat = FEATS_DATA[character[`feat_${level}`]];
        box.hidden = !feat;
        if (feat) {
            box.innerHTML = sanitizeRulesText(`<strong>Prérequis :</strong> ${feat.prereq}<br>${feat.desc || '<em>Description à compléter.</em>'}`);
        }
    }
}

function render(root, character, replaced = false) {
    const d = deriveCharacter(character);
    renderDynamicSelects(root, character, d);
    renderClassResource(root, character, d);
    for (const field of root.querySelectorAll('[data-field]')) {
        writeField(field, character[field.dataset.field], replaced);
    }
    renderOutputs(root, character, d);
    renderFeats(root, character);
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
    for (const rich of root.querySelectorAll('[data-kind="rich"]')) {
        rich.contentEditable = 'true';
        rich.setAttribute('role', 'textbox');
        rich.setAttribute('aria-multiline', 'true');
        rich.setAttribute('aria-keyshortcuts', 'Alt+F10');
    }
    bindFields(root, store);
    store.subscribe((character, changedKeys) => render(root, character, changedKeys === null));
    render(root, store.get());
}
