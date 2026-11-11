// =============================================================================
// WEAPONS.JS - Tableau des armes (édition, auto-complétion, filtres, configuration, bonus de combat)
//
// Données : character.dynamic_weapons (lignes au format v3, voir EMPTY_WEAPON) et
// character.combat_buffs { rage, sneakAttack, hunterMark, heavyWeaponMaster, charger }.
// Les valeurs d'attaque et de dégâts sont calculées (computeWeapon), jamais enregistrées.
// Rappels des dons par arme (Sauvagerie martiale, Sentinelle, Trancheur…) : weaponFeatNotes
// (js/rules/feat-effects.js), dans l'infobulle des dégâts et une ligne repliable sous l'arme,
// ouverte par une pastille placée à côté du bonus d'attaque.
// Botte d'arme reconnue dans la colonne « Botte d'arme » (findMastery, js/rules/weapon-masteries.js) :
// une pastille (livre), posée dans le coin bas droit de la case, ouvre la règle du manuel, les
// valeurs calculées pour l'arme et la capacité Bottes d'arme de la classe, fiche verrouillée
// ou non. Elle est hors du flux (position absolue) : elle ne rehausse jamais la ligne. La saisie
// n'est jamais réécrite : la pastille apparaît ou disparaît selon ce qui est écrit.
// Les règles (filtres, remplissage depuis le manuel, validation) sont dans js/rules/weapons.js.
// =============================================================================

import { DD_RULES } from '../data/dd-rules.js';
import { EMPTY_WEAPON } from '../state/schema.js';
import { stripHTML, safeText, findRulebookWeapon } from '../state/migrate.js';
import { locateRow } from '../state/other-tab.js';
import { computeWeapon, sneakAttackDice, hunterMarkDie } from '../rules/character.js';
import { derivedOf } from './derived.js';
import { getRageBonus, parseWeaponConfig } from '../rules/logic.js';
import { weaponFeatNotes } from '../rules/feat-effects.js';
import { weaponProficiency } from '../rules/class-features.js';
import { divineFuryDie } from '../rules/subclass-features.js';
import { rageEndPatch } from '../rules/subclass-uses.js';
import {
    frenzyDice, dreadfulStrikeDice, feyStrikesDie, superiorityDie, maneuverDC, psionicDice
} from '../rules/subclass-combat.js';
import { findMastery, masteryDetails, masteryParagraphs, masteryAccessNote, weaponMasteryFeature } from '../rules/weapon-masteries.js';
import {
    matchesWeaponFilter, rowFromRulebookWeapon, completeRowFromRulebook,
    readWeaponConfig, buildWeaponConfig, normalizeDamageDie, buffsForCharacter, effectiveBuffs, toggleBuff,
    isBlankWeapon,
    removeWeapon, restoreWeapon, WEAPON_DAMAGE_TYPES
} from '../rules/weapons.js';
import { el, icon, setIconLabel } from './dom.js';
import { cellText } from './cell-text.js';
import { openModal, confirmModal } from './modal.js';
import { attachAutocomplete } from './autocomplete.js';
import { isLocked } from './lock.js';
import { createMagicParts, setMagic, enchant, magicLevel, ENCHANT_DELAY_MS } from './magic.js';
import { foldButton, bindFolding, applyFold } from './fold.js';

const FILTERS = [
    ['all', 'Toutes'],
    ['simple', 'Courantes'],
    ['martial', 'Guerre'],
    ['melee', 'Corps à corps'],
    ['ranged', 'Distance'],
    ['magic', 'Magiques']
];

/** Colonnes de texte libre, dans l'ordre du tableau */
const TEXT_COLUMNS = [
    { key: 'prop', label: 'Propriétés' },
    { key: 'prof', label: "Botte d'arme" },
    // Libellé court affiché sur tablette (colonne étroite), le libellé complet reste lu
    { key: 'ammo', label: 'Munitions', short: 'Mun.' },
    { key: 'note', label: 'Notes' }
];

const COLUMN_COUNT = 8;
const UNDO_DELAY_MS = 10000;

const STAT_OPTIONS = [
    ['', 'Auto (selon les propriétés)'],
    ['str', 'Force'],
    ['dex', 'Dextérité'],
    ['cha', 'Charisme (Pacte de la lame)'],
    ['wis', 'Sagesse (Gourdin magique / Shillelagh)'],
    ['int', 'Intelligence']
];

const DAMAGE_TYPE_LABELS = {
    TRAN: 'Tranchant', CONT: 'Contondant', PERF: 'Perforant', FEU: 'Feu', FROID: 'Froid',
    NECR: 'Nécrotique', RADI: 'Radiant', FORCE: 'Force', PSYCH: 'Psychique', POISON: 'Poison',
    ACIDE: 'Acide', FOUDRE: 'Foudre', TONNERRE: 'Tonnerre'
};

/** Boutons des bonus de combat ; chaque définition reçoit deriveCharacter() (niveau, bonus de maîtrise) */
const BUFF_DEFS = {
    rage: (derived) => ({
        icon: 'flame',
        text: `Rage (+${getRageBonus(derived.level)})`,
        title: `Rage : +${getRageBonus(derived.level)} aux dégâts des attaques utilisant la Force`
            + (divineFuryDie(derived) ? ` ; Fureur divine : +${divineFuryDie(derived)} une fois par tour, avec toute arme` : '')
    }),
    sneakAttack: ({ level }) => ({
        icon: 'swords',
        text: `Attaque sournoise (${sneakAttackDice(level)}d6)`,
        title: `Attaque sournoise : +${sneakAttackDice(level)}d6 avec une arme de finesse ou à distance (une fois par tour)`
    }),
    // Rôdeur niveau 20, Tueur implacable : 1d10 (même règle que computeWeapon)
    hunterMark: ({ level, classSlug }) => {
        const die = hunterMarkDie({ level, classSlug });
        return {
            icon: 'target',
            text: `Marque du chasseur (+${die})`,
            title: `Marque du chasseur : +${die} dégâts de force contre la cible marquée`
        };
    },
    heavyWeaponMaster: ({ pb }) => ({
        icon: 'fist',
        text: `Cogneur lourd (+${pb})`,
        title: `Cogneur lourd : +${pb} (bonus de maîtrise) aux dégâts quand vous touchez avec une arme Lourde lors de l'action Attaque à votre tour`
    }),
    // Expert de la charge (PHB 2024 « Charger », p. 202)
    charger: () => ({
        icon: 'swords',
        text: 'Charge (+1d8)',
        title: "Expert de la charge : +1d8 aux dégâts d'une attaque au corps à corps après 3 m en ligne droite vers la cible (une fois par tour). Pointe : +3 m de vitesse pour cette action."
    }),
    // Style Duel (PHB 2024 p. 209)
    dueling: () => ({
        icon: 'swords',
        text: 'Duel (+2)',
        title: "Duel (style de combat) : +2 aux dégâts avec une arme de corps à corps tenue à une main, sans autre arme. Allumé, le +2 est ajouté aux armes de corps à corps qui ne sont pas à Deux mains."
    }),
    // Faveur de prouesse martiale (PHB 2024 p. 210) : allumé = utilisée ce tour
    peerlessAim: () => ({
        icon: 'target',
        text: 'Visée infaillible',
        title: "Faveur de prouesse martiale : quand vous ratez un jet d'attaque, vous pouvez toucher à la place, une fois par tour. Allumez-le quand vous l'utilisez, éteignez-le au début de votre prochain tour."
    }),
    // Faveur de l'esprit nocturne (PHB 2024 p. 211)
    nightSpirit: () => ({
        icon: 'moon',
        text: "Dans l'ombre",
        title: "Faveur de l'esprit nocturne : dans une lumière faible ou les ténèbres, Résistance à tous les dégâts sauf psychiques et radiants (repère près de la CA), et Invisible en action Bonus. Allumez-le quand vous y êtes."
    }),
    // Boutons de sous-classe (lot 5, js/rules/subclass-combat.js)
    frenzy: ({ level }) => ({
        icon: 'flame',
        text: `Frénésie (+${frenzyDice(level)})`,
        title: `Frénésie (Berserker) : avec Témérité pendant la Rage, +${frenzyDice(level)} au premier coup du tour avec une attaque de Force. Compté seulement si le bouton Rage est allumé aussi.`
    }),
    dreadfulStrike: ({ level }) => ({
        icon: 'moon',
        text: `Frappe effroyable (+${dreadfulStrikeDice(level)})`,
        title: `Frappe effroyable (Traqueur des ténèbres) : +${dreadfulStrikeDice(level)} psychiques avec une arme, une fois par tour ; cochez une case dans la bande des capacités.`
    }),
    feyStrikes: ({ level }) => ({
        icon: 'sparkle',
        text: `Frappes effroyables (+${feyStrikesDie(level)})`,
        title: `Frappes effroyables (Vagabond féerique) : +${feyStrikesDie(level)} psychiques avec une arme, une fois par tour pour une même cible.`
    }),
    colossusSlayer: () => ({
        icon: 'target',
        text: 'Goût du sang (+1d8)',
        title: "Goût du sang (Proie du chasseur) : +1d8 avec une arme contre une créature qui a perdu des PV, une fois par tour. Allumez-le si vous avez choisi cette option et que la cible est blessée."
    }),
    superiority: (derived) => ({
        icon: 'swords',
        text: `Manœuvre (+1${superiorityDie(derived.level)})`,
        title: `Manœuvre (Maître de guerre) : dé de supériorité ${superiorityDie(derived.level)} ajouté aux dégâts ; DD des manœuvres ${maneuverDC(derived)}. Cochez un dé dans la bande des capacités.`
    }),
    psionicStrike: (derived) => ({
        icon: 'star',
        text: `Frappe psionique (+1${psionicDice(derived.level).die})`,
        title: `Frappe psionique (Soldat psi) : +1${psionicDice(derived.level).die} + Intelligence de dégâts de force, une fois par tour, cible à 9 m ou moins. Cochez un dé psionique dans la bande des capacités.`
    })
};

/** Bonus de Charge dans le texte des dégâts (computeWeapon : « +1d8 (Charge) ») */
const CHARGE_BONUS = /\+1d8 \(Charge\)/;

let configCounter = 0;
let notesCounter = 0;

const fold = (text) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const plain = (value) => stripHTML(safeText(value));

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} ctx
 */
export function initWeapons(ctx) {
    const { root, store, setStatus } = ctx;
    const container = root.querySelector('#weapons-feature');
    if (!container) return;

    let filter = 'all';
    /** @type {Array<{ tr: HTMLTableRowElement, inputs: Object<string, HTMLInputElement>, atk: HTMLElement, dmg: HTMLElement, configBtn: HTMLButtonElement, deleteBtn: HTMLButtonElement, notesBtn: HTMLButtonElement, notesTr: HTMLTableRowElement, notesList: HTMLUListElement, notesOpen: boolean, notesSignature: string, masteryBtn: HTMLButtonElement, magic: ReturnType<typeof createMagicParts>, detach: () => void }>} */
    let rows = [];
    let buffsSignature = null;
    let undoTimer = null;
    let lastDeleted = null;
    /**
     * Ligne en cours d'édition (le focus est dans l'une de ses cellules) : elle reste visible
     * même si le filtre actif l'exclut, pour ne jamais cacher le champ où l'on tape.
     * Le filtre lui est réappliqué quand le focus quitte la ligne.
     */
    let pinnedRow = null;

    // ---------------------------------------------------------------------
    // Structure fixe
    // ---------------------------------------------------------------------

    const buffsBox = el('div', { class: 'weapons-buffs', role: 'group', 'aria-label': 'Bonus de combat' });
    const filterButtons = FILTERS.map(([value, label]) => el('button', {
        type: 'button', class: 'btn-chip', 'data-filter': value,
        'aria-pressed': String(value === filter), text: label,
        on: { click: () => setFilter(value) }
    }));
    const tbody = el('tbody');
    const emptyRow = el('tr', { class: 'weapons-empty' },
        el('td', { class: 'empty', colspan: String(COLUMN_COUNT) }));
    const undoText = el('span');
    const undoBox = el('p', { class: 'weapons-undo edit-only', role: 'status', hidden: true },
        undoText,
        el('button', { type: 'button', class: 'btn-chip', text: 'Annuler la suppression', on: { click: undoDelete } }));
    const addButton = el('button', {
        type: 'button', class: 'add-row edit-only',
        on: { click: addWeapon }
    });
    setIconLabel(addButton, 'plus', 'Ajouter une arme ou un sort mineur');

    container.replaceChildren(
        el('div', { class: 'weapons-head' },
            // Icône dorée devant le titre, comme les titres de index.html (data-icon, ornaments.js)
            // Pastille à chevron (fold.js) : replie le tableau ; le titre et les bonus de combat
            // (Rage…) restent, ils servent à chaque tour
            el('h3', { id: 'weapons-title', 'data-icon': 'swords' }, icon('swords'), 'Armes', foldButton('Armes')),
            buffsBox),
        el('div', { class: 'weapons-filters btn-segments', role: 'group', 'aria-label': 'Filtrer les armes affichées' },
            filterButtons),
        el('div', { class: 'table-scroll weapons-scroll' },
            el('table', { class: 'data-table weapons-table', 'aria-labelledby': 'weapons-title' },
                el('colgroup', {},
                    ['name', 'atk', 'dmg', 'prop', 'prof', 'ammo', 'note', 'actions']
                        .map(c => el('col', { class: `weapons-col-${c}` }))),
                el('thead', {}, el('tr', {},
                    el('th', { scope: 'col', text: 'Nom' }),
                    el('th', { scope: 'col', text: 'Bonus att.' }),
                    el('th', { scope: 'col', text: 'Dégâts' }),
                    TEXT_COLUMNS.map(c => (c.short
                        ? el('th', { scope: 'col', title: c.label },
                            el('span', { class: 'weapons-th-long', text: c.label }),
                            el('span', { class: 'weapons-th-short', 'aria-hidden': 'true', text: c.short }))
                        : el('th', { scope: 'col', text: c.label }))),
                    el('th', { scope: 'col', class: 'edit-only' }, el('span', { class: 'weapons-sr', text: 'Actions' })))),
                tbody)),
        undoBox,
        addButton);
    container.dataset.foldKey = 'box:weapons';
    bindFolding(container);
    applyFold(container);

    // ---------------------------------------------------------------------
    // Lecture / écriture dans le store
    // ---------------------------------------------------------------------

    const weapons = () => {
        const list = store.get().dynamic_weapons;
        return Array.isArray(list) ? list : [];
    };

    function updateRow(index, makeRow) {
        const list = weapons();
        if (!list[index]) return;
        const next = makeRow(list[index]);
        if (next === list[index]) return;
        store.update({ dynamic_weapons: list.map((w, i) => (i === index ? next : w)) });
    }

    function addWeapon() {
        if (isLocked()) return;
        // Une ligne de saisie vide est déjà affichée : on y place le curseur plutôt que
        // d'ajouter une ligne vide de plus (qui serait masquée)
        const entry = rows.find((row, i) => !row.tr.hidden && isBlankWeapon(weapons()[i]));
        if (entry) {
            focusRowName(entry);
            return;
        }
        store.update({ dynamic_weapons: [...weapons(), { ...EMPTY_WEAPON }] });
        focusRowName(rows[rows.length - 1]);
    }

    async function deleteWeapon(index) {
        if (isLocked()) return;
        const row = weapons()[index];
        if (!row) return;
        const typed = plain(row.name).trim();
        // Comme pour les armures : une arme nommée n'est supprimée qu'après confirmation
        if (typed) {
            const ok = await confirmModal({
                title: "Supprimer l'arme",
                icon: 'trash',
                message: `Supprimer « ${typed} » du tableau des armes ?`,
                confirmLabel: 'Supprimer',
                confirmIcon: 'trash',
                danger: true
            });
            if (!ok || isLocked()) return;
        }
        // Le tableau a pu changer pendant la confirmation (ici ou dans un autre onglet) : on retire
        // la ligne demandée, retrouvée par son contenu
        const list = weapons();
        const at = locateRow(list, row, index);
        if (at === -1) {
            setStatus(`⚠️ « ${typed || 'Arme sans nom'} » a été modifiée entre-temps (autre onglet) : rien n'a été supprimé`);
            return;
        }
        index = at;
        const name = typed || 'sans nom';
        store.update({ dynamic_weapons: removeWeapon(list, index) });

        lastDeleted = { index, row };
        undoText.textContent = `Arme « ${name} » supprimée. `;
        undoBox.hidden = false;
        clearTimeout(undoTimer);
        undoTimer = setTimeout(hideUndo, UNDO_DELAY_MS);
        setStatus(`Arme « ${name} » supprimée`);

        (nearestVisibleRow(index)?.deleteBtn || addButton).focus();
    }

    /** Ligne affichée la plus proche de index (d'abord vers le bas, puis vers le haut) */
    function nearestVisibleRow(index) {
        for (let i = index; i < rows.length; i++) if (!rows[i].tr.hidden) return rows[i];
        for (let i = Math.min(index, rows.length) - 1; i >= 0; i--) if (!rows[i].tr.hidden) return rows[i];
        return null;
    }

    /** Donne le focus au nom d'une ligne, en la gardant visible quel que soit le filtre */
    function focusRowName(row) {
        if (!row) return;
        pinnedRow = row;
        refresh(store.get());
        row.inputs.name.focus();
    }

    function hideUndo() {
        clearTimeout(undoTimer);
        lastDeleted = null;
        undoBox.hidden = true;
    }

    function undoDelete() {
        if (!lastDeleted || isLocked()) return;
        const { index, row } = lastDeleted;
        hideUndo();
        const position = Math.max(0, Math.min(index, weapons().length));
        store.update({ dynamic_weapons: restoreWeapon(weapons(), index, row) });
        setStatus(`Arme « ${plain(row.name) || 'sans nom'} » rétablie`);
        focusRowName(rows[position]);
    }

    function setFilter(value) {
        filter = value;
        for (const button of filterButtons) {
            button.setAttribute('aria-pressed', String(button.dataset.filter === value));
        }
        refresh(store.get());
    }

    // ---------------------------------------------------------------------
    // Lignes du tableau
    // ---------------------------------------------------------------------

    function weaponItems(query) {
        const q = fold(query.trim());
        return DD_RULES.weapons
            .filter(w => fold(w.name).includes(q))
            .map(w => ({ label: w.name, detail: `${w.dmg} · ${w.category}`, value: w }));
    }

    function buildRow(index) {
        const textInput = (key) => cellText({
            class: 'cell-input', autocomplete: 'off', spellcheck: 'false',
            on: { input: (event) => updateRow(index, (w) => ({ ...w, [key]: event.target.value })) }
        });

        const inputs = { name: textInput('name') };
        inputs.name.placeholder = 'Nom…';
        for (const column of TEXT_COLUMNS) inputs[column.key] = textInput(column.key);

        // Nom saisi à la main et reconnu dans le manuel : calcul automatique activé
        // (le nom reste tel qu'il a été écrit, seuls les champs vides sont complétés)
        inputs.name.addEventListener('blur', () => {
            if (rows[index]?.inputs.name !== inputs.name || isLocked()) return;
            updateRow(index, (w) => completeRowFromRulebook(w, findRulebookWeapon(w.name)));
        });

        const detach = attachAutocomplete(inputs.name, {
            getItems: weaponItems,
            minChars: 1,
            onSelect: (item) => {
                inputs.name.value = item.value.name;
                updateRow(index, (w) => rowFromRulebookWeapon(w, item.value));
            }
        });

        // Arme magique (réglage « Bonus magique ») : pastille après le nom et décors de la ligne ;
        // la toucher joue l'enchantement et dit l'effet du bonus dans la barre d'état
        const magic = createMagicParts(inputs.name, (parts) => {
            enchant(parts, tr);
            setStatus(parts.message);
        });

        const atk = el('span', { class: 'weapons-calc' });
        const dmg = el('span', { class: 'weapons-calc' });
        // Rappels des dons pour cette arme : une ligne repliable sous l'arme (ouverte au toucher,
        // les infobulles n'existant pas sur tablette)
        const notesId = `weapon-feats-${++notesCounter}`;
        const notesBtn = el('button', {
            type: 'button', class: 'weapons-feat-toggle', hidden: true,
            'aria-expanded': 'false', 'aria-controls': notesId,
            on: { click: () => toggleNotes(row) }
        });
        const notesList = el('ul', { class: 'weapons-feat-notes' });
        const notesTr = el('tr', { class: 'weapons-feat-row', id: notesId, hidden: true },
            el('td', { colspan: String(COLUMN_COUNT) }, notesList));
        // Règle de la botte d'arme : bouton posé sur le bord droit de la case (zone de toucher),
        // pastille visible dans son coin bas droit ; affiché seulement pour une botte du manuel
        const masteryBtn = el('button', {
            type: 'button', class: 'weapons-mastery-btn', hidden: true, 'aria-haspopup': 'dialog',
            on: { click: () => openMastery(index) }
        }, el('span', { class: 'weapons-mastery-badge', 'aria-hidden': 'true' }, icon('book')));
        const configBtn = el('button', {
            type: 'button', class: 'btn-icon', title: "Configuration de l'arme",
            on: { click: () => openConfig(index) }
        }, icon('gear'));
        const deleteBtn = el('button', {
            type: 'button', class: 'btn-icon is-danger', title: "Supprimer l'arme",
            on: { click: () => deleteWeapon(index) }
        }, icon('trash'));

        const tr = el('tr', {},
            el('td', { class: 'magic-cell' }, magic.name, magic.fx),
            // Bouton des rappels à côté du bonus d'attaque : sur tablette, il loge sous « FOR : +7 »
            // (une seule ligne, les dégâts en ont deux ou plus) sans rehausser la ligne de l'arme
            el('td', { class: 'weapons-atk' }, atk, notesBtn),
            el('td', {}, dmg),
            TEXT_COLUMNS.map(c => (c.key === 'prof'
                ? el('td', { class: 'weapons-prof' }, inputs.prof, masteryBtn)
                : el('td', {}, inputs[c.key]))),
            el('td', { class: 'weapons-actions edit-only' }, configBtn, deleteBtn));

        const row = { tr, inputs, magic, atk, dmg, configBtn, deleteBtn, notesBtn, notesTr, notesList, notesOpen: false, notesSignature: '', masteryBtn, detach };

        // Ligne épinglée tant que le focus y reste ; le filtre est réappliqué à la sortie
        // (après la fin du changement de focus, pour qu'un passage d'une cellule à l'autre
        // de la même ligne ne la cache pas)
        tr.addEventListener('focusin', () => { pinnedRow = row; });
        tr.addEventListener('focusout', (event) => {
            if (tr.contains(event.relatedTarget)) return;
            setTimeout(() => {
                if (pinnedRow !== row || tr.contains(document.activeElement)) return;
                pinnedRow = null;
                refresh(store.get());
            }, 0);
        });

        return row;
    }

    function rebuild(list) {
        for (const row of rows) row.detach();
        rows = list.map((_, i) => buildRow(i));
        tbody.replaceChildren(...rows.flatMap(r => [r.tr, r.notesTr]), emptyRow);
        applyLockState();
    }

    function toggleNotes(row) {
        row.notesOpen = !row.notesOpen;
        refresh(store.get());
    }

    /**
     * Rappels d'une arme (dons, arme non maîtrisée) : bouton (étoile + nombre), ligne repliable,
     * infobulle des dégâts. Arme non maîtrisée : même pastille compacte (elle tient dans la colonne
     * Attaque sans rehausser la ligne), en couleur d'avertissement avec le panneau ⚠ au lieu de
     * l'étoile ; « Sans maîtrise » est dit par son infobulle et en tête de la ligne de rappels.
     */
    function writeFeatNotes(row, notes, label, shown) {
        const unproficient = notes.some(note => note.featId === 'sans_maitrise');
        const signature = JSON.stringify(notes);
        if (row.notesSignature !== signature) {
            row.notesSignature = signature;
            row.notesList.replaceChildren(...notes.map(note => el('li', { class: note.check ? 'is-check' : null },
                el('strong', { text: note.featName }), el('span', { text: note.text }))));
            row.notesBtn.replaceChildren(icon(unproficient ? 'warning' : 'star'),
                el('span', { text: String(notes.length) }));
        }
        const has = notes.length > 0;
        if (!has) row.notesOpen = false;
        row.notesBtn.hidden = !has;
        row.notesBtn.toggleAttribute('data-check', unproficient);
        row.notesBtn.setAttribute('aria-expanded', String(row.notesOpen));
        const names = [...new Set(notes.map(note => note.featName))].join(', ');
        const action = row.notesOpen ? 'Masquer' : 'Afficher';
        const warning = unproficient ? "Sans maîtrise : pas de bonus de maîtrise à l'attaque. " : '';
        row.notesBtn.setAttribute('aria-label', `${warning}${action} les rappels pour l'arme ${label} (${names})`);
        row.notesBtn.title = `${warning}Rappels : ${names}`;
        row.notesTr.hidden = !(has && row.notesOpen && shown);
        row.tr.classList.toggle('has-feat-notes', has && row.notesOpen && shown);
        if (has && row.dmg.title) row.dmg.title += `\nRappels : ${names}`;
    }

    /** Pastille de la botte : visible seulement pour une botte reconnue (la saisie n'est pas touchée) */
    function writeMasteryButton(row, mastery, label) {
        row.masteryBtn.hidden = !mastery;
        if (!mastery) return;
        row.masteryBtn.setAttribute('aria-label', `Règle de la botte ${mastery.name}, arme ${label} : ouvrir la fenêtre`);
        row.masteryBtn.title = `Règle de la botte : ${mastery.name}`;
    }

    function writeInput(input, value) {
        if (input === document.activeElement) return;
        const text = plain(value);
        if (input.value !== text) input.value = text;
    }

    /**
     * Texte calculé ; le bonus de Charge (« +1d8 (Charge) », Expert de la charge) est isolé dans
     * un span : il ne vaut que pour une attaque, l'impression ne le reprend pas (css/print.css),
     * la colonne des dégâts garde sa largeur et la page ne déborde pas. À l'écran, rien ne change.
     */
    function writeCalcText(node, text) {
        if (node.textContent === text) return;
        const match = text.match(CHARGE_BONUS);
        if (!match) {
            node.textContent = text;
            return;
        }
        node.replaceChildren(text.slice(0, match.index),
            el('span', { class: 'weapons-calc-charge', text: match[0] }),
            text.slice(match.index + match[0].length));
    }

    function writeCalc(node, computed, legacy) {
        if (computed) {
            writeCalcText(node, computed.text);
            node.title = computed.tooltip;
            node.classList.remove('is-legacy');
            return;
        }
        const text = plain(legacy);
        node.textContent = text;
        node.title = text ? 'Valeur enregistrée : arme hors manuel, pas de calcul automatique' : '';
        node.classList.toggle('is-legacy', Boolean(text));
    }

    function refreshRows(list, derived, buffs, character) {
        let visible = 0;
        // Lignes vides enregistrées (ajoutées puis laissées vides) : une seule reste affichée,
        // comme ligne de saisie, et aucune quand la fiche est verrouillée. Les autres sont
        // seulement masquées : la sauvegarde n'est jamais réécrite par l'affichage.
        const locked = isLocked();
        let entryShown = false;
        list.forEach((weapon, i) => {
            const row = rows[i];
            if (!row || !weapon || typeof weapon !== 'object') return;
            const name = plain(weapon.name);
            const label = name ? `« ${name} »` : `n° ${i + 1}`;

            writeInput(row.inputs.name, weapon.name);
            row.inputs.name.setAttribute('aria-label', `Nom de l'arme n° ${i + 1}`);
            row.inputs.name.title = name;
            for (const column of TEXT_COLUMNS) {
                const input = row.inputs[column.key];
                writeInput(input, weapon[column.key]);
                input.setAttribute('aria-label', `${column.label} de l'arme ${label}`);
                input.title = plain(weapon[column.key]);
            }

            const computed = computeWeapon(weapon, derived, buffs);
            writeCalc(row.atk, computed?.attack, weapon.atk);
            writeCalc(row.dmg, computed?.damage, weapon.dmg);

            // Aspect : palier 1 à 3 ; texte : le bonus que le calcul ajoute vraiment (une ancienne
            // fiche peut en garder un autre)
            const bonus = Number.parseInt(parseWeaponConfig(weapon.weaponConfig).magicBonus, 10) || 0;
            setMagic(row.magic, row.tr, bonus, {
                label: `Arme ${label}`,
                effect: `+${bonus} aux jets d'attaque et de dégâts`
                    + (computed ? " (déjà compté dans l'attaque et les dégâts affichés)" : ' (arme hors manuel : à ajouter vous-même)')
            });

            row.configBtn.setAttribute('aria-label', `Configurer l'arme ${label}`);
            row.deleteBtn.setAttribute('aria-label', `Supprimer l'arme ${label}`);

            const blank = isBlankWeapon(weapon);
            const shown = row === pinnedRow
                || (blank ? !locked && !entryShown : matchesWeaponFilter(weapon, filter));
            if (blank && shown) entryShown = true;
            row.tr.hidden = !shown;
            row.tr.classList.toggle('is-entry', blank);
            writeFeatNotes(row, weaponFeatNotes(weapon, character, derived, buffs), label, shown);
            writeMasteryButton(row, findMastery(weapon.prof), label);
            row.inputs.name.placeholder = blank ? 'Nouvelle arme…' : 'Nom…';
            if (shown) visible++;
        });

        emptyRow.hidden = visible > 0;
        emptyRow.firstElementChild.textContent = list.length === 0
            ? "Aucune arme pour l'instant."
            : 'Aucune arme ne correspond à ce filtre.';
    }

    // ---------------------------------------------------------------------
    // Bonus de combat (contrôles de jeu : utilisables même verrouillé)
    // ---------------------------------------------------------------------

    function refreshBuffs(character, derived) {
        const defs = buffsForCharacter(derived.classSlug, character, derived).map(key => ({ key, ...BUFF_DEFS[key](derived) }));
        const signature = defs.map(d => `${d.key}:${d.text}:${d.title}`).join('|');
        if (signature !== buffsSignature) {
            buffsSignature = signature;
            buffsBox.replaceChildren(...defs.map(d => el('button', {
                type: 'button', class: 'btn-chip weapons-buff', 'data-buff': d.key,
                title: d.title, 'aria-pressed': 'false',
                on: {
                    click: () => {
                        const current = store.get();
                        const combatBuffs = toggleBuff(current.combat_buffs, d.key);
                        // Rage éteinte : les cases « une fois par Rage » se vident (Détermination fanatique)
                        store.update({ combat_buffs: combatBuffs, ...rageEndPatch(current, derivedOf(current), combatBuffs) });
                    }
                }
            }, icon(d.icon), el('span', { class: 'btn-label', text: d.text }))));
            buffsBox.hidden = defs.length === 0;
        }
        const active = character.combat_buffs || {};
        for (const button of buffsBox.querySelectorAll('[data-buff]')) {
            button.setAttribute('aria-pressed', String(active[button.dataset.buff] === true));
        }
    }

    // ---------------------------------------------------------------------
    // Règle d'une botte d'arme (lecture seule : ouverte même fiche verrouillée)
    // ---------------------------------------------------------------------

    function openMastery(index) {
        const character = store.get();
        const weapon = weapons()[index];
        const derived = derivedOf(character);
        // Bonus de combat actifs (Rage) : mêmes que ceux du tableau
        const buffs = effectiveBuffs(derived.classSlug, character.combat_buffs, character, derived);
        const details = weapon ? masteryDetails(weapon, character, derived, buffs) : null;
        if (!details) return;
        const { mastery, values, note } = details;
        const name = plain(weapon.name);
        const feature = weaponMasteryFeature(derived);

        // Valeurs pour cette arme ; sans calcul possible (arme hors manuel...), on dit pourquoi
        let weaponBox = null;
        if (values.length > 0) {
            weaponBox = el('div', { class: 'weapons-mastery-calc' },
                el('p', { class: 'weapons-mastery-calc-title' }, icon('swords'),
                    el('span', { text: name ? `Avec l'arme « ${name} »` : 'Avec cette arme' })),
                el('ul', {}, values.map(v => el('li', {},
                    el('span', { text: `${v.label} : ` }),
                    el('strong', { text: v.value }),
                    v.detail ? el('small', { text: v.detail }) : null))));
        } else if (note) {
            weaponBox = el('div', { class: 'weapons-mastery-calc' },
                el('p', { class: 'weapons-mastery-calc-none', text: note }));
        }

        // Arme non maîtrisée : la capacité Bottes d'arme (et le don Maître d'armes) ne vaut qu'avec une arme maîtrisée
        const proficiency = computeWeapon(weapon, derived)?.proficiency;
        const unproficient = proficiency && !proficiency.proficient
            ? el('p', { class: 'weapons-mastery-unproficient', text: "Vous ne maîtrisez pas cette arme : sa botte ne s'utilise qu'avec une arme maîtrisée (réglage « Arme maîtrisée » de la configuration de l'arme)." })
            : null;

        // Bottes : page de l'édition anglaise ; capacité de classe : page du manuel français
        const source = [`Manuel des joueurs 2024 (anglais), p. ${mastery.page}`];
        if (feature) source.push(`Manuel des joueurs français, capacité Bottes d'arme (${feature.className}) : p. ${feature.page}`);

        openModal({
            title: mastery.name,
            icon: 'book',
            body: el('div', { class: 'weapons-mastery' },
                el('p', { class: 'weapons-mastery-kind', text: `Botte d'arme (en anglais : ${mastery.en})` }),
                el('div', { class: 'weapons-mastery-desc' },
                    masteryParagraphs(mastery).map(text => el('p', { text }))),
                weaponBox,
                unproficient,
                el('div', { class: 'weapons-mastery-access' },
                    el('p', { class: 'weapons-mastery-access-title', text: "Bottes d'arme" }),
                    el('p', { text: masteryAccessNote(character, derived) })),
                el('p', { class: 'weapons-mastery-source', text: `${source.join(' ; ')}.` })),
            actions: [{ label: 'Fermer', primary: true }]
        });
    }

    // ---------------------------------------------------------------------
    // Configuration d'une arme
    // ---------------------------------------------------------------------

    /** Aide du réglage « Arme maîtrisée » : ce que « Auto » décide, et pourquoi */
    function proficiencyHelp(auto) {
        const why = auto.source === 'unarmed' ? 'la Frappe à mains nues est toujours maîtrisée.'
            : auto.source === 'class' ? 'arme maîtrisée par votre classe.'
            : auto.source === 'none' ? `non maîtrisée (${auto.text.replace(/\.$/, '')}).`
            : auto.text.charAt(0).toLowerCase() + auto.text.slice(1);
        return `Auto : ${why} Oui ou Non : si un don, une capacité ou votre MJ en décide autrement.`;
    }

    function openConfig(index) {
        if (isLocked()) return;
        const weapon = weapons()[index];
        if (!weapon) return;
        const config = readWeaponConfig(weapon.weaponConfig);
        const legacyDie = !normalizeDamageDie(config.dmgDieOverride).ok;
        const id = `weapon-config-${++configCounter}`;

        const select = (key, options, value) => el('select', { id: `${id}-${key}`, class: 'input' },
            options.map(([v, label]) => el('option', { value: v, text: label, selected: v === value })));

        const statSelect = select('stat', STAT_OPTIONS, config.statOverride);
        const magicSelect = select('magic',
            [0, 1, 2, 3].map(n => [String(n), n === 0 ? '+0 (arme normale)' : `+${n}`]), String(config.magicBonus));
        const dieInput = el('input', {
            id: `${id}-die`, class: 'input', type: 'text', autocomplete: 'off', spellcheck: 'false',
            placeholder: 'Ex. 1d8, 2d6', value: config.dmgDieOverride,
            'aria-describedby': `${id}-die-help`
        });
        const typeSelect = select('type',
            [['', "Auto (selon les données de l'arme)"], ...WEAPON_DAMAGE_TYPES.map(t => [t, DAMAGE_TYPE_LABELS[t] || t])],
            config.dmgTypeOverride);
        // Maîtrise de l'arme : ce que la fiche déduit seule (classe, dons), et le choix du joueur
        const auto = weaponProficiency({ ...weapon, weaponConfig: '' }, derivedOf(store.get()));
        const profSelect = select('prof', [
            ['auto', `Auto (${auto.proficient ? 'maîtrisée' : 'non maîtrisée'})`],
            ['yes', 'Oui : bonus de maîtrise compté'],
            ['no', 'Non : sans bonus de maîtrise']
        ], config.proficiency);
        const error = el('p', { class: 'weapons-config-error', id: `${id}-error`, role: 'alert', hidden: true });

        const field = (key, label, control, ...extra) => el('div', { class: 'weapons-config-field' },
            el('label', { for: `${id}-${key}`, text: label }), control, ...extra);

        const body = el('div', { class: 'weapons-config' },
            el('p', { class: 'weapons-config-name', text: plain(weapon.name) || 'Arme sans nom' }),
            weapon.atkKey ? null : el('p', {
                class: 'weapons-config-note',
                text: "Cette arme n'est pas rattachée au manuel : choisissez son nom dans la liste des armes pour activer le calcul automatique."
            }),
            field('stat', "Caractéristique d'attaque", statSelect),
            field('magic', 'Bonus magique', magicSelect),
            field('die', 'Dé de dégâts (facultatif)', dieInput,
                el('small', {
                    id: `${id}-die-help`, class: 'weapons-config-help',
                    text: legacyDie
                        ? "Valeur libre d'une ancienne version : conservée telle quelle si vous n'y touchez pas ; une nouvelle valeur doit suivre le format 1d8, 2d6."
                        : "Remplace le dé de l'arme ; vide = dé de l'arme."
                }),
                error),
            field('type', 'Type de dégâts', typeSelect),
            field('prof', 'Arme maîtrisée', profSelect,
                el('small', { id: `${id}-prof-help`, class: 'weapons-config-help', text: proficiencyHelp(auto) })));
        profSelect.setAttribute('aria-describedby', `${id}-prof-help`);

        openModal({
            title: "Configuration de l'arme",
            icon: 'gear',
            body,
            actions: [
                { label: 'Annuler' },
                {
                    label: 'Appliquer', primary: true,
                    onClick: () => {
                        const current = weapons()[index];
                        if (!current) return true;
                        const result = buildWeaponConfig({
                            statOverride: statSelect.value,
                            magicBonus: Number(magicSelect.value),
                            dmgDieOverride: dieInput.value,
                            dmgTypeOverride: typeSelect.value,
                            proficiency: profSelect.value
                        }, current.weaponConfig);
                        if (!result.ok) {
                            error.textContent = Object.values(result.errors).join(' ');
                            error.hidden = false;
                            const dieInvalid = Boolean(result.errors.dmgDieOverride);
                            dieInput.setAttribute('aria-invalid', String(dieInvalid));
                            dieInput.setAttribute('aria-describedby', `${id}-die-help ${id}-error`);
                            if (dieInvalid) dieInput.focus();
                            return false;
                        }
                        updateRow(index, (w) => ({ ...w, weaponConfig: result.value }));
                        // Nouveau bonus magique : l'arme s'enchante sous les yeux, fenêtre refermée
                        if (magicLevel(readWeaponConfig(result.value).magicBonus) > config.magicBonus) {
                            setTimeout(() => {
                                const row = rows[index];
                                if (row) enchant(row.magic, row.tr);
                            }, ENCHANT_DELAY_MS);
                        }
                        return true;
                    }
                }
            ]
        });
    }

    // ---------------------------------------------------------------------
    // Verrouillage et rendu
    // ---------------------------------------------------------------------

    function applyLockState() {
        const locked = isLocked();
        for (const row of rows) {
            for (const input of Object.values(row.inputs)) input.readOnly = locked;
        }
    }

    function refresh(character) {
        const derived = derivedOf(character);
        const buffs = effectiveBuffs(derived.classSlug, character.combat_buffs, character, derived);
        refreshBuffs(character, derived);
        refreshRows(weapons(), derived, buffs, character);
    }

    /** Cellule en cours de saisie : arme (contenu), colonne, sélection ; null si hors du tableau */
    function focusedCell(list) {
        const active = document.activeElement;
        const index = rows.findIndex(r => r.tr.contains(active));
        if (index === -1) return null;
        const key = Object.keys(rows[index].inputs).find(k => rows[index].inputs[k] === active);
        if (!key) return null;
        return { weapon: list[index], index, key, start: active.selectionStart, end: active.selectionEnd };
    }

    /** Remet le curseur dans la même cellule de la même arme après reconstruction des lignes */
    function restoreFocus(cell, list) {
        if (!cell) return;
        const at = locateRow(list, cell.weapon, cell.index);
        const input = rows[at]?.inputs[cell.key];
        if (!input) return;
        input.focus();
        try {
            input.setSelectionRange(cell.start, cell.end);
        } catch {
            // champ sans sélection de texte
        }
    }

    /** Liste affichée (pour retrouver la cellule en cours de saisie quand une autre fiche arrive) */
    let shownList = [];

    function render(character, changedKeys, meta = {}) {
        const list = weapons();
        // Fiche reprise d'un autre onglet : les lignes restent (le champ en cours de saisie garde
        // le curseur) et la dernière suppression peut encore être annulée
        const otherTab = changedKeys === null && meta.source === 'other-tab';
        if (changedKeys === null && !otherTab) hideUndo();
        const cell = otherTab ? focusedCell(shownList) : null;
        const rebuilt = (changedKeys === null && !otherTab) || list.length !== rows.length;
        if (rebuilt) rebuild(list);
        refresh(character);
        if (rebuilt) restoreFocus(cell, list);
        shownList = list;
    }

    document.addEventListener('dd:lockchange', () => {
        applyLockState();
        // Fiche verrouillée : plus de saisie, la ligne vide épinglée disparaît aussi
        if (isLocked()) pinnedRow = null;
        refresh(store.get());
    });
    store.subscribe(render);
    render(store.get(), null);
}
