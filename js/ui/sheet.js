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
import { deriveCharacter, featSlotState, hitDieForClass, exhaustionSeverity } from '../rules/character.js';
import { featEffects, AUTOMATED_FEATS } from '../rules/feat-effects.js';
import { sanitizeRich, sanitizeRulesText } from './sanitize.js';
import { el, fillSelect, icon, signed } from './dom.js';
import { applyLock, isLocked } from './lock.js';
import { openModal } from './modal.js';

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
            'aria-label': `Don du niveau ${level}`,
            'aria-describedby': `feat-when-${level}`
        }, el('option', { value: '', text: '— Choisir un don —' }), featOptions());
        // data-feat-state (posé au rendu, voir featSlotState) : actif, à choisir, prévu ou à venir ;
        // la légende (« À venir », « Actif au niveau 12 ») ne s'affiche que pour les niveaux pas encore atteints
        return el('div', { class: 'feat', 'data-feat-slot': String(level) },
            el('div', { class: 'feat-head' },
                el('span', { class: 'feat-badge', text: `Niv. ${level}` }),
                select,
                el('output', { class: 'feat-asi', 'data-out': `featAsi:${level}` }),
                el('span', { class: 'feat-when', id: `feat-when-${level}`, hidden: true },
                    icon('hourglass'), el('span', { class: 'feat-when-text' }))),
            el('div', { class: 'feat-desc', 'data-feat-desc': String(level), hidden: true }),
            // Ce que la fiche fait de ce don (calculs, rappels) : renderFeatSheet
            el('div', { class: 'feat-sheet', 'data-feat-sheet': String(level), hidden: true }));
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

function renderOutputs(root, character, d) {
    for (const out of root.querySelectorAll('[data-out]')) {
        const [name, arg] = out.dataset.out.split(':');
        const value = OUTPUTS[name]?.(d, arg, character);
        out.textContent = value ?? '';
    }
    root.querySelector('[data-out="armorClass"]').title = d.armorClass.source;
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

function renderFeats(root, character, d, effects) {
    for (const level of FEAT_LEVELS) {
        const slot = root.querySelector(`[data-feat-slot="${level}"]`);
        const state = featSlotState(level, d.level, character[`feat_${level}`]);
        if (slot.dataset.featState !== state) slot.dataset.featState = state;
        const when = slot.querySelector('.feat-when');
        const caption = FEAT_WHEN[state]?.(level) ?? '';
        const text = when.querySelector('.feat-when-text');
        if (text.textContent !== caption) text.textContent = caption;
        when.hidden = !caption;

        const box = root.querySelector(`[data-feat-desc="${level}"]`);
        // Même lecture que les règles (featSlots, js/rules/feats.js) : valeur nettoyée du HTML
        // des anciennes sauvegardes, pour que le don qui compte soit aussi celui qui est décrit
        const featId = stripHTML(String(character[`feat_${level}`] ?? ''));
        const feat = Object.hasOwn(FEATS_DATA, featId) ? FEATS_DATA[featId] : undefined;
        box.hidden = !feat;
        if (feat) {
            box.innerHTML = sanitizeRulesText(`<strong>Prérequis :</strong> ${feat.prereq}<br>${feat.desc || '<em>Description à compléter.</em>'}`);
        }
        renderFeatSheet(root.querySelector(`[data-feat-sheet="${level}"]`), state === 'active' && feat ? featId : '', level, effects);
    }
}

// ---------------------------------------------------------------------------
// Dons : mentions près des valeurs et encadré « Dans la fiche »
// Les notes viennent de featEffects (js/rules/feat-effects.js). Règle validée par Franck :
// une valeur saisie à la main (PV max…) n'est jamais modifiée, la fiche affiche seulement
// « dont +X grâce à <don> » ; une valeur calculée (Initiative) intègre le don.
// ---------------------------------------------------------------------------

/** Libellé court d'une mention, par famille de zone ; le détail s'ouvre au toucher */
const MENTION_LABELS = {
    initiative: (note) => note.featName,
    // espaces insécables : le chiffre ne reste jamais seul en bout de ligne
    hpMax: (note) => `dont\u00a0+${note.value} grâce à ${note.featName}`,
    armorClass: (note) => ({
        // C/P/T : seuls les dégâts contondants, perforants et tranchants d'une attaque sont réduits
        maitre_des_armures_lourdes: `Dégâts C/P/T\u00a0−${note.value}`,
        maitre_des_boucliers: `Coup de bouclier DD\u00a0${note.value}`
    })[note.featId] ?? note.featName,
    saves: (note) => ({
        mage_de_guerre: 'Avantage Concentration',
        maitre_des_boucliers: 'Interposition'
    })[note.featId] ?? note.featName
};

/** Titre de la fenêtre de détail d'une zone */
function zoneTitle(zone) {
    if (zone === 'initiative') return 'Initiative';
    if (zone === 'hpMax') return 'Points de vie maximum';
    if (zone === 'armorClass') return "Classe d'armure";
    const name = ABILITIES.find(a => `saves.${a.id}` === zone)?.name ?? '';
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
    const label = MENTION_LABELS[zone.split('.')[0]];
    const byFeat = new Map();
    for (const note of notes) {
        if (note.inactive) continue;
        // La note chiffrée de chaque don donne la mention (« dont +8 », « DD 13 »)
        const kept = byFeat.get(note.featId);
        if (!kept || (kept.value === undefined && note.value !== undefined)) byFeat.set(note.featId, note);
    }
    return [...byFeat.values()].map(note => label(note));
}

/** Liste des notes de dons (fenêtre de détail) */
function featNotesList(notes) {
    return el('ul', { class: 'feat-notes' }, notes.map(note => el('li', { class: note.inactive ? 'is-inactive' : null },
        el('strong', { class: 'feat-notes-name', text: note.featName }),
        el('span', { text: note.text }),
        note.applied ? el('span', { class: 'feat-tag', text: 'Déjà compté' }) : null,
        note.manual ? el('span', { class: 'feat-tag', 'data-kind': 'manual', text: 'À reporter' }) : null)));
}

/** Notes affichées par chaque bouton de mention (lues au toucher) */
const mentionNotes = new WeakMap();
/** Signature du contenu déjà affiché (évite de reconstruire à chaque saisie) */
const renderedSignatures = new WeakMap();

function openFeatNotes(button) {
    const zone = button.dataset.featZone;
    openModal({
        title: zoneTitle(zone),
        icon: 'star',
        body: [
            el('p', { class: 'feat-notes-intro', text: 'Effets des dons atteints par le personnage :' }),
            featNotesList(mentionNotes.get(button) ?? [])
        ],
        actions: [{ label: 'Fermer', primary: true }]
    });
}

/**
 * Mentions dorées près des valeurs (Initiative, PV max, CA, jets de sauvegarde). Un seul bouton
 * par zone : un toucher ouvre le détail (les infobulles n'existent pas sur tablette).
 */
function renderFeatMentions(root, effects) {
    for (const button of root.querySelectorAll('[data-feat-zone]')) {
        const zone = button.dataset.featZone;
        const notes = zoneNotes(effects, zone);
        const labels = zoneMentions(zone, notes);
        const signature = JSON.stringify([labels, notes.map(note => note.text)]);
        if (renderedSignatures.get(button) === signature) continue;
        renderedSignatures.set(button, signature);
        mentionNotes.set(button, notes);

        button.hidden = labels.length === 0;
        button.replaceChildren(...labels.map(label => el('span', { class: 'feat-mention-line' },
            icon('star'), el('span', { text: label }))));
        button.title = notes.map(note => `${note.featName} : ${note.text}`).join('\n');
        button.setAttribute('aria-haspopup', 'dialog');
        button.setAttribute('aria-label', `${labels.join(', ')} : détail des dons (${zoneTitle(zone)})`);
    }
}

/**
 * Étiquette d'une note dans l'encadré « Dans la fiche » : [data-kind, texte].
 * « À reporter » : chiffre qui porte sur une valeur saisie à la main (Robuste et les PV max),
 * que la fiche n'ajoute jamais elle-même ; « Calculé » : chiffre établi par la fiche.
 */
function noteKind(note) {
    if (note.inactive) return ['waiting', 'En attente'];
    if (note.manual) return ['manual', 'À reporter'];
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
 * Encadré « Dans la fiche » sous la description d'un don actif : ce que la fiche calcule
 * ou rappelle pour ce don, ou « rappel seulement » si elle ne l'applique pas.
 * @param {HTMLElement} box
 * @param {string} featId - don actif de l'emplacement ('' : encadré masqué)
 * @param {number} level - niveau de l'emplacement
 * @param {Object} effects - featEffects()
 */
function renderFeatSheet(box, featId, level, effects) {
    box.hidden = !featId;
    const zones = (FEAT_SHEET_ZONES[featId] ?? ['featSlot']).map(zone => (zone === 'featSlot' ? `featSlot:${level}` : zone));
    const notes = featId ? zones.flatMap(zone => effects[zone] ?? []).filter(note => note.featId === featId) : [];
    const signature = JSON.stringify([featId, notes]);
    if (renderedSignatures.get(box) === signature) return;
    renderedSignatures.set(box, signature);
    if (!featId) {
        box.replaceChildren();
        return;
    }
    const automated = AUTOMATED_FEATS.includes(featId) && notes.length > 0;
    box.replaceChildren(
        el('span', { class: 'feat-sheet-title' }, icon('gear'), el('span', { text: 'Dans la fiche' })),
        automated
            ? el('ul', { class: 'feat-sheet-list' }, notes.map(note => {
                const [kind, tag] = noteKind(note);
                return el('li', { 'data-kind': kind },
                    el('span', { class: 'feat-tag', text: tag }), el('span', { text: note.text }));
            }))
            : el('p', { class: 'feat-sheet-none', text: 'Rappel seulement : la fiche ne calcule rien pour ce don, sa description ci-dessus fait foi.' }));
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
    for (const field of root.querySelectorAll('[data-field]')) {
        writeField(field, character[field.dataset.field], replaced);
    }
    const effects = featEffects(character, d);
    renderOutputs(root, character, d);
    renderFeats(root, character, d, effects);
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
    for (const rich of root.querySelectorAll('[data-kind="rich"]')) {
        rich.contentEditable = 'true';
        rich.setAttribute('role', 'textbox');
        rich.setAttribute('aria-multiline', 'true');
        rich.setAttribute('aria-keyshortcuts', 'Alt+F10');
    }
    bindFields(root, store);
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
