// =============================================================================
// WEAPONS/ROWS.JS - Lignes du tableau des armes : construction et réécriture
//
// buildRow fabrique les éléments d'une arme (cases de saisie, auto-complétion du nom depuis le
// manuel, bouton ▾ de la liste des armes par groupe comme au grimoire, pastilles, boutons) ; refreshRows y réécrit ce que dit la fiche : textes saisis, valeurs
// calculées (computeWeapon, jamais enregistrées), aspect magique, rappels des dons (weaponFeatNotes),
// pastille de la botte, lignes cachées par le filtre. La saisie écrit dans la fiche
// (dynamic_weapons, par ctx.updateRow) ; l'affichage ne réécrit jamais la sauvegarde.
// =============================================================================

import { DD_RULES } from '../../data/dd-rules.js';
import { findRulebookWeapon } from '../../state/migrate.js';
import { computeWeapon } from '../../rules/character.js';
import { parseWeaponConfig } from '../../rules/logic.js';
import { weaponFeatNotes } from '../../rules/feat-effects.js';
import { findMastery } from '../../rules/weapon-masteries.js';
import { matchesWeaponFilter, rowFromRulebookWeapon, completeRowFromRulebook, isBlankWeapon } from '../../rules/weapons.js';
import { weaponPickerGroups } from '../../rules/weapon-picker.js';
import { el, icon } from '../dom.js';
import { cellText } from '../cell-text.js';
import { attachAutocomplete } from '../autocomplete.js';
import { isLocked } from '../lock.js';
import { createMagicParts, setMagic, enchant } from '../magic.js';
import { TEXT_COLUMNS, COLUMN_COUNT, plain } from './shared.js';
import { writeCalc, toggleDamageDetail, writeDamageDetail, writeExtraPills } from './damage.js';
import { openMastery } from './mastery.js';
import { openConfig } from './config.js';

/** Numéro des lignes construites : identifiants des rappels et du détail des dégâts */
let notesCounter = 0;

const fold = (text) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function weaponItems(query) {
    const q = fold(query.trim());
    return DD_RULES.weapons
        .filter(w => fold(w.name).includes(q))
        .map(w => ({ label: w.name, detail: `${w.dmg} · ${w.category}`, value: w }));
}

/** Bouton ▾ (liste des armes sans clavier virtuel) : infobulle (souris), puis phrase courte dans
 *  la barre du haut quand on le touche (tablette) */
const PICK_TITLE = 'Choisir dans la liste des armes (sans ouvrir le clavier)';
const PICK_HELP = 'Liste des armes : touchez-en une pour remplir la ligne (✓ : déjà dans le tableau).';

/**
 * Liste à parcourir (nom vide touché, ou bouton ▾) : les armes du manuel par groupe, avec leurs
 * dégâts ; ✓ : déjà dans le tableau, toujours choisissable (deux dagues). js/rules/weapon-picker.js.
 * @param {import('./shared.js').WeaponsContext} ctx
 * @param {number} index - ligne qu'on remplit (exclue des armes « déjà notées »)
 * @param {string} query
 */
function weaponBrowseItems(ctx, index, query) {
    const rows = ctx.weapons().filter((_, i) => i !== index);
    return weaponPickerGroups(DD_RULES.weapons, { query, rows }).flatMap((group) => [
        { header: group.title },
        ...group.items.map((item) => ({
            label: item.weapon.name,
            detail: item.weapon.dmg,
            mark: item.noted ? '✓' : '',
            value: item.weapon
        }))
    ]);
}

/**
 * Éléments d'une arme (pas encore remplis : voir refreshRows).
 * @param {import('./shared.js').WeaponsContext} ctx
 * @param {number} index - place de l'arme dans dynamic_weapons
 * @returns {import('./shared.js').WeaponRow}
 */
export function buildRow(ctx, index) {
    const textInput = (key) => cellText({
        class: 'cell-input', autocomplete: 'off', spellcheck: 'false',
        on: { input: (event) => ctx.updateRow(index, (w) => ({ ...w, [key]: event.target.value })) }
    });

    const inputs = { name: textInput('name') };
    inputs.name.placeholder = 'Nom…';
    for (const column of TEXT_COLUMNS) inputs[column.key] = textInput(column.key);

    // Nom saisi à la main et reconnu dans le manuel : calcul automatique activé
    // (le nom reste tel qu'il a été écrit, seuls les champs vides sont complétés)
    inputs.name.addEventListener('blur', () => {
        if (ctx.rows[index]?.inputs.name !== inputs.name || isLocked()) return;
        ctx.updateRow(index, (w) => completeRowFromRulebook(w, findRulebookWeapon(w.name)));
    });

    // Bouton ▾ après le nom (ligne sans nom) : la liste des armes sans ouvrir le clavier
    let detach = null;
    const pick = el('button', {
        type: 'button', class: 'weapons-pick', title: PICK_TITLE, 'aria-label': 'Choisir dans la liste des armes', hidden: true,
        on: {
            mousedown: (event) => event.preventDefault(),
            click: () => {
                detach?.open();
                if (pick.getAttribute('aria-expanded') === 'true') ctx.setStatus(PICK_HELP);
            }
        }
    }, icon('chevron'));
    detach = attachAutocomplete(inputs.name, {
        getItems: (query, { browse = false } = {}) => (browse ? weaponBrowseItems(ctx, index, query) : weaponItems(query)),
        minChars: 1,
        // Nom vide touché, ou bouton ▾ : toutes les armes du manuel, par groupe
        browse: { enabled: () => !isLocked(), trigger: pick, empty: 'Aucune arme du manuel ne correspond' },
        onSelect: (item) => {
            inputs.name.value = item.value.name;
            ctx.updateRow(index, (w) => rowFromRulebookWeapon(w, item.value));
        }
    });

    // Arme magique (réglage « Bonus magique ») : pastille après le nom et décors de la ligne ;
    // la toucher joue l'enchantement et dit l'effet du bonus dans la barre d'état
    const magic = createMagicParts(inputs.name, (parts) => {
        enchant(parts, tr);
        ctx.setStatus(parts.message);
    });
    magic.name.append(pick);

    const atk = el('span', { class: 'weapons-calc' });
    const dmg = el('span', { class: 'weapons-calc' });
    // Rappels des dons pour cette arme : une ligne repliable sous l'arme (ouverte au toucher,
    // les infobulles n'existant pas sur tablette)
    const notesId = `weapon-feats-${++notesCounter}`;
    const notesBtn = el('button', {
        type: 'button', class: 'weapons-feat-toggle', hidden: true,
        'aria-expanded': 'false', 'aria-controls': notesId,
        on: { click: () => toggleNotes(ctx, row) }
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
    const dmgCell = el('td', { on: { click: () => toggleDamageDetail(ctx, index) } }, dmg);
    dmg.addEventListener('keydown', (event) => {
        if (dmg.getAttribute('role') !== 'button' || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        toggleDamageDetail(ctx, index);
    });
    const masteryBtn = el('button', {
        type: 'button', class: 'weapons-mastery-btn', hidden: true, 'aria-haspopup': 'dialog',
        on: { click: () => openMastery(ctx, index) }
    }, el('span', { class: 'weapons-mastery-badge', 'aria-hidden': 'true' }, icon('book')));
    const configBtn = el('button', {
        type: 'button', class: 'btn-icon', title: "Configuration de l'arme",
        on: { click: () => openConfig(ctx, index) }
    }, icon('gear'));
    const deleteBtn = el('button', {
        type: 'button', class: 'btn-icon is-danger', title: "Supprimer l'arme",
        on: { click: () => ctx.deleteWeapon(index) }
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
        tr, inputs, magic, pick, atk, dmg, configBtn, deleteBtn, notesBtn, notesTr, notesList, notesOpen: false, notesSignature: '',
        masteryBtn, extraTr, extraPills, extraPrint, extraDetail, detailOpen: false, extraSignature: null, detach
    };

    // Ligne épinglée tant que le focus y reste ; le filtre est réappliqué à la sortie
    // (après la fin du changement de focus, pour qu'un passage d'une cellule à l'autre
    // de la même ligne ne la cache pas). Les pastilles « À allumer » font partie de l'arme :
    // sans cela, passer d'une case à une pastille cachait la ligne avant la fin du clic,
    // et la pastille n'était pas basculée.
    const inRow = (node) => tr.contains(node) || extraTr.contains(node);
    for (const part of [tr, extraTr]) {
        part.addEventListener('focusin', () => { ctx.pinnedRow = row; });
        part.addEventListener('focusout', (event) => {
            if (inRow(event.relatedTarget)) return;
            setTimeout(() => {
                if (ctx.pinnedRow !== row || inRow(document.activeElement)) return;
                ctx.pinnedRow = null;
                ctx.refresh();
            }, 0);
        });
    }

    return row;
}

function toggleNotes(ctx, row) {
    row.notesOpen = !row.notesOpen;
    ctx.refresh();
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
 * Réécrit toutes les lignes depuis la fiche.
 * @param {import('./shared.js').WeaponsContext} ctx
 * @param {Object[]} list - dynamic_weapons
 * @param {Object} derived - deriveCharacter(character)
 * @param {Object} buffs - bonus de combat réellement comptés (effectiveBuffs)
 * @param {Object} character
 * @returns {number} nombre de lignes affichées
 */
export function refreshRows(ctx, list, derived, buffs, character) {
    let visible = 0;
    // Lignes vides enregistrées (ajoutées puis laissées vides) : une seule reste affichée,
    // comme ligne de saisie, et aucune quand la fiche est verrouillée. Les autres sont
    // seulement masquées : la sauvegarde n'est jamais réécrite par l'affichage.
    const locked = isLocked();
    let entryShown = false;
    list.forEach((weapon, i) => {
        const row = ctx.rows[i];
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
        const shown = row === ctx.pinnedRow
            || (blank ? !locked && !entryShown : matchesWeaponFilter(weapon, ctx.filter));
        if (blank && shown) entryShown = true;
        row.tr.hidden = !shown;
        row.tr.classList.toggle('is-entry', blank);
        const offBook = !computed?.damage && !row.dmg.classList.contains('is-legacy');
        writeExtraPills(ctx, row, i, weapon, shown, writeDamageDetail(row, weapon, offBook, shown));
        writeFeatNotes(row, weaponFeatNotes(weapon, character, derived, buffs), label, shown);
        writeMasteryButton(row, findMastery(weapon.prof), label);
        row.inputs.name.placeholder = blank ? 'Nouvelle arme…' : 'Nom…';
        row.pick.hidden = locked || name !== '';
        if (shown) visible++;
    });

    return visible;
}
