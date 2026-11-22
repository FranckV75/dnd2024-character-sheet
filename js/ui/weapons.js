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
// Dégâts en plus écrits par le joueur (« +2d6 contre les dragons », réglage de l'arme, règles dans
// js/rules/weapon-extras.js) : « Toujours » = ajoutés au texte des dégâts ; « À allumer » = pastille
// dans une ligne sous l'arme (même aspect et même règle de verrou que Rage), dont l'état est rangé
// dans la ligne de l'arme (weaponConfig), jamais à part. Dans la case, chaque dégât en plus tient
// sur une ligne, abrégé avec « … » ; toucher la case écrit les dégâts en entier sous l'arme
// (toggleDamageDetail), fiche verrouillée ou non.
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
import { rageArmorWarning, rageBlockedByArmor, RAGE_ARMOR_STATUS } from '../rules/rage.js';
import {
    frenzyDice, dreadfulStrikeDice, feyStrikesDie, superiorityDie, maneuverDC, psionicDice, dragonMount
} from '../rules/subclass-combat.js';
import {
    findMastery, masteryDetails, masteryParagraphs, masteryAccessNote, masterySource, weaponMasteryFeature, hasWeaponMasterFeat
} from '../rules/weapon-masteries.js';
import {
    matchesWeaponFilter, rowFromRulebookWeapon, completeRowFromRulebook,
    readWeaponConfig, buildWeaponConfig, normalizeDamageDie, buffsForCharacter, effectiveBuffs, toggleBuff,
    isBlankWeapon,
    removeWeapon, restoreWeapon, WEAPON_DAMAGE_TYPES
} from '../rules/weapons.js';
import {
    EXTRA_DAMAGE_MAX, EXTRA_REASON_MAX, EXTRA_DAMAGE_MODES, readExtraDamage, activeExtraDamage, extraDamageText, extraDamageLabel,
    offBookDamage, toggleExtraDamage
} from '../rules/weapon-extras.js';
import { el, icon, setIconLabel } from './dom.js';
import { frenchSpaces } from './help.js';
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
    // Style Duel (Manuel des joueurs français p. 209)
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
    }),
    // Serment du Seigneur Dragon, Jeune dragon (niveau 15) : aucun dégât en plus, repères près de la
    // CA et de la Perception (dragonMountNotes, js/rules/subclass-combat.js)
    dragonMount: (derived) => {
        const mount = dragonMount(derived);
        return {
            icon: 'crown',
            text: 'Monté sur le dragon',
            title: mount?.dragon
                ? `Jeune dragon : allumez-le quand vous montez votre ${mount.dragon.toLowerCase()}. Vous partagez son ${mount.immunity.charAt(0).toLowerCase()}${mount.immunity.slice(1)} (repère près de la CA) et ses sens : ${mount.senses}, Perception passive ${mount.passive} si elle est meilleure que la vôtre (repère près de la Perception).`
                : "Jeune dragon : allumez-le quand vous montez votre dragon. Vous partagez son immunité aux dégâts et ses sens ; choisissez la couleur de l'œuf (onglet Aptitudes & Traits) pour les voir près de la CA et de la Perception."
        };
    }
};

/** Bonus de Charge dans le texte des dégâts (computeWeapon : « +1d8 (Charge) ») */
const CHARGE_BONUS = /\+1d8 \(Charge\)/;

/** Réglage « Quand » d'un dégât en plus (fenêtre de configuration) : un libellé par mode des règles */
const EXTRA_MODE_LABELS = { always: 'Toujours', toggle: 'À allumer' };
const EXTRA_MODE_OPTIONS = EXTRA_DAMAGE_MODES.map(mode => [mode, EXTRA_MODE_LABELS[mode]]);

/** Aide de la rubrique « Dégâts en plus » (dans la fenêtre : la barre du haut est cachée derrière) */
const EXTRA_HELP = "Pour une arme spéciale, par exemple +2d6 contre les dragons. « Toujours » : compté en permanence dans les dégâts. "
    + "« À allumer » : une pastille apparaît sous l'arme ; touchez-la quand la condition est remplie. La corbeille retire la ligne. "
    + `Raison : ${EXTRA_REASON_MAX} caractères au plus.`;

/**
 * La barre du haut tient sur une ligne (591 px à 768 px, soit une centaine de caractères) : une
 * phrase qui cite l'arme n'y est écrite que si elle y tient, sinon sa version courte la remplace.
 */
const STATUS_ROOM = 95;
const fitStatus = (full, short) => (full.length <= STATUS_ROOM ? full : short);

/** Dernier contenu écrit dans une case calculée (texte et découpage) : rien n'est réécrit s'il n'a pas changé */
const calcSignatures = new WeakMap();

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
    // Rage allumée avec une armure lourde équipée : avertissement à côté du bouton (js/rules/rage.js) ;
    // un bouton et non une simple infobulle : sur tablette, le toucher écrit la phrase dans la barre
    const rageWarn = el('button', {
        type: 'button', class: 'weapons-rage-warn', hidden: true,
        title: 'La Rage ne compte pas avec une armure lourde équipée : ses bonus (dégâts, Résistance, Avantage) ne sont pas ajoutés',
        on: { click: () => setStatus(RAGE_ARMOR_STATUS) }
    }, icon('warning'), el('span', { class: 'weapons-rage-warn-text' }));
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
        // Dégâts en plus « À allumer » : pastilles dans une ligne sous l'arme (contrôles de jeu,
        // utilisables fiche verrouillée comme Rage) ; à l'impression, une mention à la place
        const extraPills = el('div', { class: 'weapons-extra-pills', role: 'group' });
        const extraPrint = el('span', { class: 'weapons-extra-print' });
        // Dégâts écrits en entier (la case les abrège) : sous les pastilles, qui ne bougent donc pas
        // quand il s'ouvre ; toute la largeur du tableau, le texte n'y est jamais coupé
        const extraDetail = el('p', { class: 'weapons-extra-detail', id: `weapon-damage-${notesCounter}`, hidden: true },
            el('strong'), ' ', el('span'));
        const extraTr = el('tr', { class: 'weapons-extra-row', hidden: true },
            el('td', { colspan: String(COLUMN_COUNT) }, extraPills, extraDetail, extraPrint));
        // Toute la case se touche (44 px de haut et plus), pas seulement le texte ; au clavier,
        // Entrée ou Espace sur les dégâts (bouton seulement quand l'arme a des dégâts en plus)
        const dmgCell = el('td', { on: { click: () => toggleDamageDetail(index) } }, dmg);
        dmg.addEventListener('keydown', (event) => {
            if (dmg.getAttribute('role') !== 'button' || (event.key !== 'Enter' && event.key !== ' ')) return;
            event.preventDefault();
            toggleDamageDetail(index);
        });
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
            dmgCell,
            TEXT_COLUMNS.map(c => (c.key === 'prof'
                ? el('td', { class: 'weapons-prof' }, inputs.prof, masteryBtn)
                : el('td', {}, inputs[c.key]))),
            el('td', { class: 'weapons-actions edit-only' }, configBtn, deleteBtn));

        const row = {
            tr, inputs, magic, atk, dmg, configBtn, deleteBtn, notesBtn, notesTr, notesList, notesOpen: false, notesSignature: '',
            masteryBtn, extraTr, extraPills, extraPrint, extraDetail, detailOpen: false, extraSignature: null, detach
        };

        // Ligne épinglée tant que le focus y reste ; le filtre est réappliqué à la sortie
        // (après la fin du changement de focus, pour qu'un passage d'une cellule à l'autre
        // de la même ligne ne la cache pas). Les pastilles « À allumer » font partie de l'arme :
        // sans cela, passer d'une case à une pastille cachait la ligne avant la fin du clic,
        // et la pastille n'était pas basculée.
        const inRow = (node) => tr.contains(node) || extraTr.contains(node);
        for (const part of [tr, extraTr]) {
            part.addEventListener('focusin', () => { pinnedRow = row; });
            part.addEventListener('focusout', (event) => {
                if (inRow(event.relatedTarget)) return;
                setTimeout(() => {
                    if (pinnedRow !== row || inRow(document.activeElement)) return;
                    pinnedRow = null;
                    refresh(store.get());
                }, 0);
            });
        }

        return row;
    }

    function rebuild(list) {
        for (const row of rows) row.detach();
        rows = list.map((_, i) => buildRow(i));
        tbody.replaceChildren(...rows.flatMap(r => [r.tr, r.extraTr, r.notesTr]), emptyRow);
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
     * Dégâts en plus du joueur (`parts`, toujours à la fin du texte) : un span chacun, même police
     * que le reste ; sur tablette il est abrégé avec « … » (css/weapons.css), et ceux d'une pastille
     * allumée (`toggle`) ne sont pas imprimés dans la case (mention sous l'arme à la place).
     * @param {HTMLElement} node
     * @param {string} text
     * @param {Array<{ die: string, type: string, toggle: boolean }>} [parts]
     */
    function writeCalcText(node, text, parts = []) {
        const tail = parts.map(extraDamageText).join('');
        // Arme hors manuel sans valeur enregistrée : le texte n'est fait que des dégâts en plus
        const cut = tail === '' ? -1 : text.endsWith(tail) ? tail.length : text === tail.trimStart() ? text.length : -1;
        const split = cut !== -1;
        const signature = `${text}\n${split ? parts.map(part => (part.toggle ? 't' : 'a')).join('') : ''}`;
        if (calcSignatures.get(node) === signature && node.textContent === text) return;
        calcSignatures.set(node, signature);
        const head = split ? text.slice(0, text.length - cut) : text;
        const match = head.match(CHARGE_BONUS);
        const children = match
            ? [head.slice(0, match.index), el('span', { class: 'weapons-calc-charge', text: match[0] }), head.slice(match.index + match[0].length)]
            : [head];
        if (split) {
            for (const part of parts) {
                // L'espace reste hors du span : chaque dégât en plus peut passer seul à la ligne
                const piece = extraDamageText(part);
                if (children.some(child => child !== '')) children.push(' ');
                children.push(el('span', {
                    class: part.toggle ? 'weapons-calc-extra is-toggle' : 'weapons-calc-extra',
                    text: piece.trimStart()
                }));
            }
        }
        node.replaceChildren(...children.filter(child => child !== ''));
    }

    /**
     * @param {HTMLElement} node
     * @param {{ text: string, tooltip: string }|undefined} computed - valeur calculée (arme du manuel)
     * @param {*} legacy - ancienne valeur enregistrée (arme hors manuel)
     * @param {Object} [weapon] - pour la case des dégâts : ligne de l'arme (dégâts en plus)
     */
    function writeCalc(node, computed, legacy, weapon) {
        if (computed) {
            writeCalcText(node, computed.text, weapon ? activeExtraDamage(weapon.weaponConfig) : []);
            node.title = computed.tooltip;
            node.classList.remove('is-legacy');
            return;
        }
        // Arme écrite à la main, non rattachée au manuel : valeur enregistrée, puis dégâts en plus
        const shown = offBookDamage(plain(legacy), weapon ? weapon.weaponConfig : '');
        writeCalcText(node, shown.text, shown.parts);
        node.title = shown.tooltip;
        node.classList.toggle('is-legacy', shown.legacy);
    }

    /** Nom d'une arme dans une phrase : « Épée longue », ou « cette arme » sans nom */
    function weaponInSentence(weapon) {
        const name = plain(weapon?.name);
        return name ? `« ${name} »` : 'cette arme';
    }

    /**
     * Toucher les dégâts d'une arme qui porte des dégâts en plus : ils s'écrivent en entier sous
     * l'arme (nouveau toucher : le détail se referme). La barre du haut tient sur une ligne et
     * coupait ce texte ; elle dit seulement où le lire, en deux phrases de 30 caractères au plus :
     * sur ordinateur, la colonne des messages fait 175 px sur deux lignes (une phrase par ligne).
     */
    function toggleDamageDetail(index) {
        const weapon = weapons()[index];
        const row = rows[index];
        if (!weapon || !row || activeExtraDamage(weapon.weaponConfig).length === 0) return;
        row.detailOpen = !row.detailOpen;
        refresh(store.get());
        setStatus(row.detailOpen
            ? "Dégâts en entier sous l'arme. Touchez encore pour refermer."
            : 'Détail des dégâts refermé.');
    }

    /**
     * Case des dégâts d'une arme qui porte des dégâts en plus : elle devient un bouton (toucher,
     * Entrée, Espace) qui ouvre le détail écrit sous l'arme.
     * @param {Object} row
     * @param {Object} weapon
     * @param {boolean} offBook - arme hors manuel sans valeur enregistrée : seuls les dégâts en plus sont connus
     * @param {boolean} shown - la ligne de l'arme est affichée (filtres)
     * @returns {boolean} le détail est affiché
     */
    function writeDamageDetail(row, weapon, offBook, shown) {
        const active = activeExtraDamage(weapon.weaponConfig).length > 0;
        row.dmg.classList.toggle('has-extras', active);
        // Plus rien à détailler (dernière pastille éteinte, dégât retiré) : le détail se referme
        if (!active) row.detailOpen = false;
        const open = row.detailOpen && shown;
        if (active) {
            row.dmg.setAttribute('role', 'button');
            row.dmg.setAttribute('tabindex', '0');
            row.dmg.setAttribute('aria-expanded', String(open));
            row.dmg.setAttribute('aria-controls', row.extraDetail.id);
        } else {
            for (const name of ['role', 'tabindex', 'aria-expanded', 'aria-controls']) row.dmg.removeAttribute(name);
        }
        if (open) {
            const [title, text] = row.extraDetail.children;
            const label = offBook ? 'Dégâts en plus' : 'Dégâts';
            const full = offBook
                ? `${row.dmg.textContent}. Arme hors manuel : ses propres dégâts ne sont pas calculés, ajoutez-les vous-même.`
                : row.dmg.textContent;
            if (title.textContent !== label) title.textContent = label;
            if (text.textContent !== full) text.textContent = full;
        }
        row.extraDetail.hidden = !open;
        return open;
    }

    /** Pastille « À allumer » touchée : l'état est écrit dans la ligne de l'arme (weaponConfig) */
    function toggleExtra(index, lineIndex, label) {
        const weapon = weapons()[index];
        const line = weapon ? readExtraDamage(weapon.weaponConfig).find(entry => entry.index === lineIndex) : null;
        // La ligne a changé entre-temps (autre onglet) : on ne bascule jamais un autre dégât que celui affiché
        if (!line || line.mode !== 'toggle' || extraDamageLabel(line) !== label) {
            refresh(store.get());
            return;
        }
        updateRow(index, (w) => ({ ...w, weaponConfig: toggleExtraDamage(w.weaponConfig, lineIndex) }));
        const said = line.on ? `${label} : n'est plus compté dans les dégâts` : `${label} : compté dans les dégâts`;
        setStatus(frenchSpaces(fitStatus(`${said} de ${weaponInSentence(weapon)}.`, `${said}.`)));
    }

    /**
     * Ligne des pastilles « À allumer » d'une arme, et mention imprimée à leur place.
     * @param {Object} row
     * @param {number} index - place de l'arme dans dynamic_weapons
     * @param {Object} weapon
     * @param {boolean} shown - la ligne de l'arme est affichée (filtres)
     * @param {boolean} detail - le détail des dégâts est ouvert dans la même ligne (writeDamageDetail)
     */
    function writeExtraPills(row, index, weapon, shown, detail) {
        const lines = readExtraDamage(weapon.weaponConfig).filter(line => line.mode === 'toggle');
        const who = weaponInSentence(weapon);
        const signature = `${who}\n${lines.map(line => `${line.index}:${extraDamageLabel(line)}`).join('\n')}`;
        if (row.extraSignature !== signature) {
            row.extraSignature = signature;
            row.extraPills.setAttribute('aria-label', frenchSpaces(`Dégâts en plus à allumer, arme ${who}`));
            row.extraPills.replaceChildren(...lines.map((line) => {
                const label = extraDamageLabel(line);
                return el('button', {
                    type: 'button', class: 'btn-chip weapons-buff weapons-extra-pill', 'data-extra': String(line.index),
                    'aria-pressed': 'false',
                    title: frenchSpaces(`À allumer quand la condition est remplie : ${label} s'ajoute aux dégâts de ${who}.`),
                    on: { click: () => toggleExtra(index, line.index, label) }
                }, icon('sparkle'), el('span', { class: 'btn-label', text: label }));
            }));
            row.extraPrint.textContent = lines.length
                ? frenchSpaces(`Selon le cas : ${lines.map(extraDamageLabel).join(' ; ')}`)
                : '';
        }
        for (const button of row.extraPills.children) {
            const line = lines.find(entry => String(entry.index) === button.dataset.extra);
            button.setAttribute('aria-pressed', String(line?.on === true));
        }
        const visible = (lines.length > 0 && shown) || detail;
        row.extraTr.hidden = !visible;
        // Sans pastille, la ligne ne porte que le détail : rien à imprimer (css/print.css)
        row.extraTr.classList.toggle('is-detail-only', lines.length === 0);
        row.tr.classList.toggle('has-extra-pills', visible);
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
            writeCalc(row.dmg, computed?.damage, weapon.dmg, weapon);

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
            const offBook = !computed?.damage && !row.dmg.classList.contains('is-legacy');
            writeExtraPills(row, i, weapon, shown, writeDamageDetail(row, weapon, offBook, shown));
            writeFeatNotes(row, weaponFeatNotes(weapon, character, derived, buffs), label, shown);
            writeMasteryButton(row, findMastery(weapon.prof), label);
            row.inputs.name.placeholder = blank ? 'Nouvelle arme…' : 'Nom…';
            if (shown) visible++;
        });

        emptyRow.hidden = visible > 0;
        const emptyText = list.length === 0
            ? "Aucune arme pour l'instant."
            : 'Aucune arme ne correspond à ce filtre.';
        if (emptyRow.firstElementChild.textContent !== emptyText) emptyRow.firstElementChild.textContent = emptyText;
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
                        const currentDerived = derivedOf(current);
                        // Rage éteinte : les cases « une fois par Rage » se vident (Détermination fanatique)
                        store.update({ combat_buffs: combatBuffs, ...rageEndPatch(current, currentDerived, combatBuffs) });
                        // Rage allumée avec une armure lourde : le bouton reste allumé, la barre prévient
                        if (d.key === 'rage' && combatBuffs.rage === true && rageBlockedByArmor(currentDerived)) setStatus(RAGE_ARMOR_STATUS);
                    }
                }
            }, icon(d.icon), el('span', { class: 'btn-label', text: d.text }))));
            // Avertissement juste après le bouton Rage
            buffsBox.querySelector('[data-buff="rage"]')?.after(rageWarn);
            buffsBox.hidden = defs.length === 0;
        }
        const active = character.combat_buffs || {};
        for (const button of buffsBox.querySelectorAll('[data-buff]')) {
            button.setAttribute('aria-pressed', String(active[button.dataset.buff] === true));
        }
        const warning = rageArmorWarning(character, derived, defs.map(d => d.key));
        rageWarn.hidden = !warning;
        if (rageWarn.lastElementChild.textContent !== warning) rageWarn.lastElementChild.textContent = warning;
        buffsBox.querySelector('[data-buff="rage"]')?.classList.toggle('is-void', Boolean(warning));
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

        // Pages du Manuel des joueurs français : la botte, puis ce qui en donne l'accès
        const source = masterySource(mastery, feature, hasWeaponMasterFeat(character));

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
                el('p', { class: 'weapons-mastery-source', text: source })),
            actions: [{ label: 'Fermer', primary: true }]
        });
    }

    // ---------------------------------------------------------------------
    // Configuration d'une arme
    // ---------------------------------------------------------------------

    /** Aide du réglage « Arme maîtrisée » : ce que « Auto » décide, et pourquoi */
    function proficiencyHelp(auto) {
        const why = auto.source === 'unarmed' ? "l'attaque à mains nues est toujours maîtrisée."
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

        // Dégâts en plus : lignes modifiables (4 au plus). L'état allumé d'une pastille (on) est
        // gardé tant que la ligne reste « À allumer ». Rien n'est enregistré avant « Appliquer ».
        // wasPill : la ligne avait déjà sa pastille à l'ouverture (elle n'est pas annoncée comme nouvelle)
        const extras = readExtraDamage(weapon.weaponConfig)
            .map(({ dmg, reason, mode, on }) => ({ dmg, reason, mode, on, wasPill: mode === 'toggle' }));
        // Message de refus : posé dans la liste, juste au-dessus de la première ligne fautive
        // (en bas de la rubrique, il restait hors de vue dès que la fenêtre défile)
        const extraError = el('p', { class: 'weapons-config-error', id: `${id}-extra-error`, role: 'alert', hidden: true });
        const extraList = el('div', { class: 'weapons-extra-lines' });
        const extraAdd = el('button', {
            type: 'button', class: 'btn weapons-extra-add',
            on: {
                click: () => {
                    if (extras.length >= EXTRA_DAMAGE_MAX) return;
                    extras.push({ dmg: '', reason: '', mode: 'always', on: false, wasPill: false });
                    renderExtras();
                    extraList.lastElementChild?.querySelector('input')?.focus();
                }
            }
        });
        setIconLabel(extraAdd, 'plus', 'Ajouter un dégât en plus');
        const extraFull = el('small', { class: 'weapons-config-help', text: `${EXTRA_DAMAGE_MAX} dégâts en plus au maximum par arme.`, hidden: true });
        /** @type {Array<{ dmg: HTMLInputElement, reason: HTMLInputElement, mode: HTMLSelectElement, remove: HTMLButtonElement, line: HTMLElement }>} */
        let extraControls = [];

        function renderExtras() {
            extraControls = extras.map((line, i) => {
                const n = i + 1;
                const dmgInput = el('input', {
                    class: 'input', type: 'text', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off',
                    placeholder: '2d6', value: line.dmg, 'aria-label': `Dégâts en plus n° ${n}`,
                    on: { input: (event) => { line.dmg = event.target.value; } }
                });
                const reasonInput = el('input', {
                    class: 'input', type: 'text', autocomplete: 'off', autocapitalize: 'off', maxlength: String(EXTRA_REASON_MAX),
                    placeholder: 'contre les dragons', value: line.reason, 'aria-label': `Raison du dégât en plus n° ${n}`,
                    on: { input: (event) => { line.reason = event.target.value; } }
                });
                const modeSelect = el('select', {
                    class: 'input', 'aria-label': `Quand compter le dégât en plus n° ${n}`,
                    on: { change: (event) => { line.mode = event.target.value; } }
                }, EXTRA_MODE_OPTIONS.map(([value, label]) => el('option', { value, text: label, selected: value === line.mode })));
                const removeBtn = el('button', {
                    type: 'button', class: 'btn-icon is-danger', title: 'Retirer ce dégât en plus',
                    'aria-label': `Retirer le dégât en plus n° ${n}`,
                    on: {
                        click: () => {
                            extras.splice(i, 1);
                            renderExtras();
                            // Jamais dans un champ de texte : sur tablette, le clavier s'ouvrirait
                            // alors qu'on vient seulement de retirer une ligne
                            (extraControls[Math.min(i, extras.length - 1)]?.remove || extraAdd).focus();
                        }
                    }
                }, icon('trash'));
                return {
                    dmg: dmgInput, reason: reasonInput, mode: modeSelect, remove: removeBtn,
                    line: el('div', { class: 'weapons-extra-line' }, dmgInput, reasonInput, modeSelect, removeBtn)
                };
            });
            // Le message d'un refus précédent sort de la liste avec les anciennes lignes
            extraList.replaceChildren(...extraControls.map(c => c.line));
            extraHead.hidden = extras.length === 0;
            extraAdd.hidden = extras.length >= EXTRA_DAMAGE_MAX;
            extraFull.hidden = extras.length < EXTRA_DAMAGE_MAX;
            extraError.hidden = true;
        }
        // En-têtes des colonnes (les champs ont chacun leur nom pour les lecteurs d'écran)
        const extraHead = el('div', { class: 'weapons-extra-line weapons-extra-head', 'aria-hidden': 'true' },
            el('span', { text: 'Dégâts' }), el('span', { text: 'Raison' }), el('span', { text: 'Quand' }), el('span'));
        const extraTitleId = `${id}-extra-title`;
        const extraBox = el('div', { class: 'weapons-config-field weapons-config-extras', role: 'group', 'aria-labelledby': extraTitleId },
            el('span', { class: 'label', id: extraTitleId, text: 'Dégâts en plus' }),
            el('small', { class: 'weapons-config-help', text: frenchSpaces(EXTRA_HELP) }),
            extraHead, extraList, extraAdd, extraFull);
        renderExtras();

        /**
         * Refus d'un dégât en plus : le message au-dessus de la ligne fautive, le curseur dans le
         * champ à corriger, et la zone de la fenêtre déroulée pour que les deux se voient ensemble.
         * @param {string} message
         * @param {{ line: HTMLElement }|undefined} bad - première ligne fautive
         * @param {HTMLElement|null} field - champ à corriger (null : le curseur ne bouge pas)
         */
        function showExtraError(message, bad, field) {
            extraError.textContent = frenchSpaces(`${message} Rien n'a été enregistré.`);
            extraError.hidden = false;
            extraList.insertBefore(extraError, bad ? bad.line : extraList.firstChild);
            field?.focus({ preventScroll: true });
            const zone = extraError.closest('.modal-body');
            if (!zone) return;
            const frame = zone.getBoundingClientRect();
            const top = extraError.getBoundingClientRect().top - frame.top;
            const bottom = (bad ? bad.line : extraError).getBoundingClientRect().bottom - frame.top;
            const margin = 6;
            // Trop haut : on remonte jusqu'au message ; trop bas : on descend juste assez, sans
            // jamais faire sortir le message par le haut
            if (top < margin) zone.scrollTop += top - margin;
            else if (bottom > zone.clientHeight - margin) zone.scrollTop += Math.min(top - margin, bottom - zone.clientHeight + margin);
        }

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
                el('small', { id: `${id}-prof-help`, class: 'weapons-config-help', text: proficiencyHelp(auto) })),
            extraBox);
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
                        // Ligne ajoutée puis laissée vide : retirée, sans message
                        if (extras.some(line => !line.dmg.trim() && !line.reason.trim())) {
                            for (let i = extras.length - 1; i >= 0; i--) {
                                if (!extras[i].dmg.trim() && !extras[i].reason.trim()) extras.splice(i, 1);
                            }
                            renderExtras();
                        }
                        const result = buildWeaponConfig({
                            statOverride: statSelect.value,
                            magicBonus: Number(magicSelect.value),
                            dmgDieOverride: dieInput.value,
                            dmgTypeOverride: typeSelect.value,
                            proficiency: profSelect.value,
                            extraDamage: extras.map(({ dmg, reason, mode, on }) => ({ dmg, reason, mode, on }))
                        }, current.weaponConfig);
                        if (!result.ok) {
                            // Chaque message près de ses champs : réglages de l'arme, puis dégâts en plus
                            const { extraDamage: extraMessage, ...others } = result.errors;
                            error.textContent = Object.values(others).join(' ');
                            error.hidden = Object.keys(others).length === 0;
                            const dieInvalid = Boolean(result.errors.dmgDieOverride);
                            dieInput.setAttribute('aria-invalid', String(dieInvalid));
                            dieInput.setAttribute('aria-describedby', `${id}-die-help ${id}-error`);
                            const invalid = result.invalidExtras || [];
                            extraControls.forEach((controls, i) => {
                                for (const key of ['dmg', 'reason', 'mode']) {
                                    const bad = invalid.some(entry => entry.index === i && entry.field === key);
                                    controls[key].setAttribute('aria-invalid', String(bad));
                                    if (bad) controls[key].setAttribute('aria-describedby', `${id}-extra-error`);
                                    else controls[key].removeAttribute('aria-describedby');
                                }
                            });
                            // Dé de l'arme faux : il passe d'abord (son message est sous son champ) ;
                            // le message des dégâts en plus est posé quand même, sans prendre le curseur
                            const bad = invalid[0] ? extraControls[invalid[0].index] : undefined;
                            if (extraMessage) showExtraError(extraMessage, bad, dieInvalid ? null : bad?.[invalid[0].field] ?? null);
                            else extraError.hidden = true;
                            if (dieInvalid) dieInput.focus();
                            return false;
                        }
                        updateRow(index, (w) => ({ ...w, weaponConfig: result.value }));
                        // Nouvelle pastille (ligne ajoutée, ou passée de « Toujours » à « À allumer ») :
                        // fenêtre refermée, la barre du haut dit où elle est et à quoi elle sert. Une
                        // pastille déjà là dont on a seulement corrigé le texte n'est pas annoncée.
                        const added = extras.filter(line => line.mode === 'toggle' && !line.wasPill).length;
                        if (added) {
                            const said = (where) => (added === 1
                                ? `Pastille ajoutée sous ${where} : touchez-la quand la condition est remplie.`
                                : `${added} pastilles ajoutées sous ${where} : touchez-les quand leur condition est remplie.`);
                            setStatus(frenchSpaces(fitStatus(said(weaponInSentence(current)), said("l'arme"))));
                        }
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
