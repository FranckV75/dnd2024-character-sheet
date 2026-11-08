// =============================================================================
// ARMORS.JS - Tableau des armures (édition, auto-complétion, armure équipée)
//
// Chaque ligne de dynamic_armors garde exactement les clés de la v3
// (name, type, ca, str, stealth, weight, price, comment, equipped) ; les clés
// inconnues d'une ancienne sauvegarde sont conservées. Clé facultative « magic » (1 à 3) :
// bonus magique d'une armure ou d'un bouclier.
// Colonne CA : calculée, jamais saisie. Elle montre ce que la ligne apporte (« 18 », « +3 ») ;
// le calcul s'affiche dans une bulle au toucher ou au survol. Le type, la valeur de base (clé
// « ca ») et le bonus magique se règlent avec l'engrenage ; pour une armure du manuel, type et
// base viennent du manuel. La CA de la fiche est recalculée par sheet.js à chaque changement.
// =============================================================================

import { EMPTY_ARMOR } from '../state/schema.js';
import { stripHTML } from '../state/migrate.js';
import { parseNumber, armorCategory, deriveCharacter, mediumArmorDexMax } from '../rules/character.js';
import {
    ARMOR_TYPES, searchArmorCatalogue, armorRowFromCatalogue, armorWarnings, armorTraining, isBlankArmor,
    armorMagicBonus, armorCanBeMagic, withArmorMagic, ARMOR_MAGIC_MAX, armorLine, catalogueArmor, catalogueArmorClass
} from '../rules/armors.js';
import { el, icon, setIconLabel } from './dom.js';
import { cellText } from './cell-text.js';
import { attachAutocomplete } from './autocomplete.js';
import { openModal, confirmModal } from './modal.js';
import { isLocked } from './lock.js';
import { createCalcBubble } from './calc-bubble.js';
import { createMagicParts, setMagic, enchant, magicLevel, ENCHANT_DELAY_MS } from './magic.js';

/** Colonnes de texte libre : clé de la sauvegarde → libellé accessible */
const TEXT_COLUMNS = {
    name: { aria: 'Nom de l\'armure' },
    str: { aria: 'Force minimale', inputmode: 'numeric' },
    weight: { aria: 'Poids' },
    price: { aria: 'Prix' },
    comment: { aria: 'Commentaire' }
};

/** Clés de la fiche dont dépendent le tableau, ses avertissements et ses CA calculées */
const WATCHED_KEYS = new Set([
    'dynamic_armors', 'str_score', 'dex_score', 'char_level', 'char_class', 'char_species',
    'prof_armor_light', 'prof_armor_med', 'prof_armor_heavy', 'prof_armor_shield'
]);
/** Les dons atteints (feat_<N> ; feat_0 selon l'espèce) changent la Dex max des armures intermédiaires */
const isWatched = (key) => WATCHED_KEYS.has(key) || key.startsWith('feat_');

const COLUMN_COUNT = 10;

/** Libellé court du type, d'après la catégorie lue par le calcul de CA */
const CATEGORY_LABELS = {
    light: 'Légère', medium: 'Interméd.', heavy: 'Lourde', shield: 'Bouclier', bonus: 'Bonus', proficiency: 'Maîtrise'
};
/** Libellé long de la catégorie (bulle, fenêtre de réglages) */
const CATEGORY_NAMES = {
    light: 'Armure légère', medium: 'Armure intermédiaire', heavy: 'Armure lourde', shield: 'Bouclier',
    bonus: 'Bonus fixe à la CA', proficiency: 'Bonus de maîtrise à la CA'
};
const STATUS_COUNTED = 'Comptée dans la CA de la fiche.';

const textOf = (value) => stripHTML(String(value ?? ''));
const armorsOf = (character) => (Array.isArray(character.dynamic_armors) ? character.dynamic_armors : []);
const asObject = (row) => (row && typeof row === 'object' ? row : {});
const typeOf = (row) => textOf(row.type) || 'none';

/**
 * Valeur de base à enregistrer (clé « ca ») : le nombre saisi, précédé de « + » pour un bouclier
 * ou un bonus positif, comme les valeurs du manuel ; sans nombre : vide.
 * @param {string} raw
 * @param {string} type - valeur de ARMOR_TYPES
 * @returns {string}
 */
function baseText(raw, type) {
    const value = parseNumber(String(raw ?? ''), Number.NaN);
    if (!Number.isFinite(value)) return '';
    return (type === 'Bouclier' || type === 'Bonus') && value > 0 ? `+${value}` : String(value);
}

/** Contexte du calcul de CA d'une ligne (modificateurs, maîtrise, Dex max des armures intermédiaires) */
function armorContext(derived) {
    return { mods: derived.mods, pb: derived.pb, mediumDexMax: mediumArmorDexMax(derived.feats, derived.scores.dex) };
}

/**
 * La ligne reprend-elle telles quelles les valeurs du manuel (type et base) ? Alors l'engrenage ne
 * règle que le bonus magique ; sinon (objet hors manuel, valeur modifiée), type et base se règlent.
 */
function followsManual(row, entry) {
    if (!entry) return false;
    const type = textOf(row.type);
    const stored = parseNumber(textOf(row.ca), Number.NaN);
    return (type === '' || type === entry.type)
        && (!Number.isFinite(stored) || stored === parseNumber(entry.ca, Number.NaN));
}

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} ctx
 */
export function initArmors({ root, store, setStatus }) {
    const container = root.querySelector('#armors-feature');
    if (!container) return;

    const tbody = el('tbody');
    const table = el('table', { class: 'data-table armors-table' },
        el('caption', { class: 'armors-sr', text: 'Armures, boucliers et autres avantages défensifs' }),
        el('thead', {}, el('tr', {},
            el('th', { scope: 'col', class: 'col-name', text: 'Nom' }),
            el('th', { scope: 'col', class: 'col-type', text: 'Type' }),
            el('th', { scope: 'col', class: 'col-ca', text: 'CA', title: 'Calculée : toucher la valeur pour voir le calcul' }),
            el('th', { scope: 'col', class: 'col-str', text: 'For min.' }),
            el('th', { scope: 'col', class: 'col-check', text: 'Discr. désav.', title: 'Désavantage aux tests de Dextérité (Discrétion)' }),
            el('th', { scope: 'col', class: 'col-weight', text: 'Poids' }),
            el('th', { scope: 'col', class: 'col-price', text: 'Prix' }),
            el('th', { scope: 'col', class: 'col-comment', text: 'Commentaire' }),
            el('th', { scope: 'col', class: 'col-equip', text: 'Équipée / actif' }),
            el('th', { scope: 'col', class: 'col-del' }, el('span', { class: 'armors-sr', text: 'Réglages et suppression' })))),
        tbody);
    const addButton = el('button', {
        type: 'button', class: 'add-row edit-only',
        on: { click: addRow }
    });
    setIconLabel(addButton, 'plus', 'Ajouter une armure');
    const tableScroll = el('div', { class: 'table-scroll' }, table);
    container.replaceChildren(tableScroll, addButton);

    /** Contrôles de chaque ligne affichée : [{ tr, controls }] */
    let rows = [];
    let detachers = [];
    /** Calcul affiché par ligne (bulle) : { name, category, formula, note } */
    let details = [];

    // -----------------------------------------------------------------------
    // Écriture dans le store (jamais de modification directe de store.get())
    // -----------------------------------------------------------------------

    function replaceRow(index, makeRow) {
        const list = armorsOf(store.get());
        if (index < 0 || index >= list.length) return;
        store.update({ dynamic_armors: list.map((row, i) => (i === index ? makeRow(asObject(row)) : row)) });
    }

    const editRow = (index, patch) => replaceRow(index, row => ({ ...row, ...patch }));

    function addRow() {
        if (isLocked()) return;
        // Une ligne de saisie vide est déjà affichée : on y place le curseur
        const list = armorsOf(store.get());
        const entry = rows.find((row, i) => !row.tr.hidden && isBlankArmor(asObject(list[i])));
        if (entry) {
            entry.controls.name.focus();
            return;
        }
        store.update({ dynamic_armors: [...armorsOf(store.get()), { ...EMPTY_ARMOR }] });
        rows.at(-1)?.controls.name.focus();
    }

    async function deleteRow(index) {
        if (isLocked()) return;
        const row = armorsOf(store.get())[index];
        const name = textOf(asObject(row).name).trim();
        if (name) {
            const ok = await confirmModal({
                title: 'Supprimer l\'armure',
                icon: 'trash',
                message: `Supprimer « ${name} » du tableau des armures ?`,
                confirmLabel: 'Supprimer',
                confirmIcon: 'trash',
                danger: true
            });
            if (!ok) return;
        }
        // Le tableau a pu changer pendant la confirmation : on retire la ligne demandée
        const list = armorsOf(store.get());
        const at = list.indexOf(row);
        if (at === -1) return;
        store.update({ dynamic_armors: list.filter((_, i) => i !== at) });
        // Le bouton supprimé a disparu avec la ligne : le focus va au bouton voisin (ou à « Ajouter »)
        if (!document.activeElement || document.activeElement === document.body) {
            (rows[Math.min(at, rows.length - 1)]?.tr.querySelector('.col-del button') || addButton).focus();
        }
        setStatus(name ? `Armure supprimée : ${name}` : 'Ligne d\'armure supprimée');
    }

    // -----------------------------------------------------------------------
    // Fenêtre de réglages (engrenage) : type, valeur de base, bonus magique
    // -----------------------------------------------------------------------

    let configCounter = 0;
    function openConfig(index) {
        if (isLocked()) return;
        const original = asObject(armorsOf(store.get())[index]);
        const ctx = armorContext(deriveCharacter(store.get()));
        const entry = catalogueArmor(original);
        const manual = followsManual(original, entry);
        const name = textOf(original.name).trim();
        const id = `armor-config-${++configCounter}`;

        // Type et base : lecture seule pour une armure du manuel, réglables sinon
        const initialType = typeOf(original);
        const typeSelect = el('select', { id: `${id}-type`, class: 'input' },
            ARMOR_TYPES.map(([value, label]) => el('option', { value, text: label, selected: value === initialType })));
        if (!ARMOR_TYPES.some(([value]) => value === initialType)) {
            typeSelect.append(el('option', { value: initialType, text: `${initialType} (valeur enregistrée)`, selected: true }));
        }
        const initialBase = textOf(original.ca);
        const baseInput = el('input', {
            id: `${id}-base`, class: 'input', type: 'text', inputmode: 'numeric', autocomplete: 'off',
            value: initialBase, placeholder: 'ex. 12, ou +1 pour une cape'
        });
        const magicSelect = el('select', { id: `${id}-magic`, class: 'input' },
            Array.from({ length: ARMOR_MAGIC_MAX + 1 }, (_, n) => el('option', {
                value: String(n), text: n === 0 ? '+0 (non magique)' : `+${n}`, selected: n === armorMagicBonus(original)
            })));
        const magicField = el('div', { class: 'weapons-config-field' },
            el('label', { for: `${id}-magic`, text: 'Bonus magique' }), magicSelect,
            el('small', { class: 'weapons-config-help', text: 'Une armure ou un bouclier +1, +2 ou +3 ajoute ce bonus à sa CA.' }));
        const preview = el('p', { class: 'armor-config-preview', 'aria-live': 'polite' });

        /** Ligne telle qu'elle serait enregistrée avec les réglages de la fenêtre */
        const draft = () => {
            const next = { ...original };
            if (!manual) {
                const type = typeSelect.value;
                if (type !== initialType) next.type = type;
                if (baseInput.value.trim() !== initialBase.trim() || type !== initialType) next.ca = baseText(baseInput.value, type);
            }
            const canMagic = armorCanBeMagic(next);
            return withArmorMagic(next, canMagic ? Number(magicSelect.value) : 0);
        };
        const refresh = () => {
            const next = draft();
            magicField.hidden = !armorCanBeMagic(next);
            const line = armorLine(next, ctx);
            const parts = [el('strong', { text: line.kind === 'none' ? 'Ne compte pas dans la CA' : `Dans la CA : ${line.display}` })];
            if (line.kind !== 'none') parts.push(el('span', { text: ` (${line.formula})` }));
            preview.replaceChildren(...parts);
        };
        for (const control of [typeSelect, baseInput, magicSelect]) {
            control.addEventListener('input', refresh);
            control.addEventListener('change', refresh);
        }

        const fields = [];
        if (manual) {
            fields.push(el('p', {
                class: 'weapons-config-note',
                text: `D'après le manuel : ${CATEGORY_NAMES[armorCategory({ type: entry.type })].toLowerCase()}, CA ${entry.ca}.`
                    + (armorCategory({ type: entry.type }) === 'medium' && ctx.mediumDexMax > 2
                        ? ` Avec Maître des armures intermédiaires : Dex max ${ctx.mediumDexMax}.` : '')
            }));
        } else {
            fields.push(
                el('div', { class: 'weapons-config-field' },
                    el('label', { for: `${id}-type`, text: 'Type' }), typeSelect),
                el('div', { class: 'weapons-config-field' },
                    el('label', { for: `${id}-base`, text: 'Valeur de base' }), baseInput,
                    el('small', {
                        class: 'weapons-config-help',
                        text: 'Armure : sa CA sans la Dextérité (12 pour « 12 + Dex »). Bouclier ou bonus : ce qu\'il ajoute (+2, +1). Inutile pour le type Maîtrise.'
                    })));
            if (entry) {
                const restore = el('button', {
                    type: 'button', class: 'btn-chip', text: 'Reprendre les valeurs du manuel',
                    on: {
                        click: () => {
                            typeSelect.value = entry.type;
                            baseInput.value = catalogueArmorClass(entry);
                            refresh();
                        }
                    }
                });
                fields.push(el('p', { class: 'weapons-config-note' },
                    `Le manuel indique : ${entry.type}, CA ${entry.ca}. `, restore));
            }
        }
        fields.push(magicField, preview);
        refresh();

        openModal({
            title: armorCategory(original) === 'shield' ? 'Réglages du bouclier' : "Réglages de l'armure",
            icon: 'gear',
            body: el('div', { class: 'weapons-config' },
                el('p', { class: 'weapons-config-name', text: name || 'Sans nom' }),
                ...fields),
            actions: [
                { label: 'Annuler' },
                {
                    label: 'Appliquer', primary: true,
                    onClick: () => {
                        // Le tableau a pu changer pendant la fenêtre : on modifie la ligne ouverte
                        const list = armorsOf(store.get());
                        const at = list[index] === original ? index : list.indexOf(original);
                        if (at === -1) return;
                        const next = draft();
                        replaceRow(at, () => next);
                        // Nouveau bonus magique : la ligne s'enchante sous les yeux, fenêtre refermée
                        const before = armorCanBeMagic(original) ? armorMagicBonus(original) : 0;
                        if (armorCanBeMagic(next) && armorMagicBonus(next) > before) {
                            setTimeout(() => {
                                const target = rows[at];
                                if (target) enchant(target.magic, target.tr);
                            }, ENCHANT_DELAY_MS);
                        }
                        const line = armorLine(next, ctx);
                        setStatus(`${name || 'Armure'} : ${line.kind === 'none' ? 'ne compte pas dans la CA' : `CA ${line.display}`}`);
                    }
                }
            ]
        });
    }

    // -----------------------------------------------------------------------
    // Bulle du calcul de CA (toucher, survol, focus ; fonctionne aussi verrouillé)
    // -----------------------------------------------------------------------

    const caBubble = createCalcBubble({ id: 'armor-ca-bubble', className: 'armor-ca-bubble' });
    caBubble.hideOnScroll(tableScroll);

    function bubbleContent(index) {
        const info = details[index];
        if (!info) return null;
        return [
            el('div', { class: 'spell-tooltip-head' },
                el('strong', { class: 'spell-tooltip-name', text: info.name || 'Sans nom' }),
                info.category ? el('span', { class: 'spell-tooltip-level', text: info.category }) : null),
            el('p', { class: 'armor-ca-formula', text: info.formula }),
            info.note ? el('p', { class: 'armor-ca-note', 'data-counted': String(info.counted), text: info.note }) : null
        ];
    }

    // -----------------------------------------------------------------------
    // Construction des lignes
    // -----------------------------------------------------------------------

    function textInput(index, key) {
        const column = TEXT_COLUMNS[key];
        return cellText({
            class: 'cell-input', 'aria-label': `${column.aria} (ligne ${index + 1})`,
            inputmode: column.inputmode, autocomplete: 'off', spellcheck: key === 'comment' ? 'true' : 'false',
            on: { input: (e) => editRow(index, { [key]: e.target.value }) }
        });
    }

    function buildRow(index) {
        const controls = {};
        for (const key of Object.keys(TEXT_COLUMNS)) controls[key] = textInput(index, key);
        controls.name.placeholder = 'Nom…';

        // Type : lu (catégorie du calcul de CA), réglé avec l'engrenage
        controls.type = el('span', { class: 'armor-type' });
        // CA : valeur calculée ; la toucher (ou la survoler) affiche le calcul
        controls.ca = el('button', { type: 'button', class: 'armor-ca-value' });
        caBubble.attach(controls.ca, () => bubbleContent(index));

        controls.stealth = el('input', {
            type: 'checkbox', class: 'round-check',
            'aria-label': `Désavantage en Discrétion (ligne ${index + 1})`,
            on: { change: (e) => editRow(index, { stealth: e.target.checked }) }
        });
        controls.equipped = el('input', {
            type: 'checkbox', class: 'round-check', 'data-play': 'true',
            'aria-label': `Équipée / active (ligne ${index + 1})`,
            on: { change: (e) => editRow(index, { equipped: e.target.checked }) }
        });
        // Bouton (et non simple infobulle) : sur tablette, le toucher affiche le message dans la barre d'état
        controls.warn = el('button', {
            type: 'button', class: 'armor-warn', hidden: true,
            on: { click: () => setStatus(controls.warn.dataset.message || '') }
        }, icon('warning'));

        // Réglages (type, valeur de base, bonus magique) : fiche déverrouillée seulement
        controls.config = el('button', {
            type: 'button', class: 'btn-icon edit-only armor-config', title: 'Réglages (type, valeur, bonus magique)',
            'aria-label': `Réglages de l'armure (ligne ${index + 1})`, 'aria-haspopup': 'dialog',
            on: { click: () => openConfig(index) }
        }, icon('gear'));

        const del = el('button', {
            type: 'button', class: 'btn-icon is-danger edit-only', title: 'Supprimer',
            'aria-label': `Supprimer l'armure (ligne ${index + 1})`,
            on: { click: () => deleteRow(index) }
        }, icon('trash'));

        // Nom saisi au clavier (sans passer par les suggestions) : si c'est exactement une armure
        // du manuel et que le type n'est pas encore choisi, la ligne est complétée comme une suggestion
        controls.name.addEventListener('change', () => {
            const row = asObject(armorsOf(store.get())[index]);
            if (typeOf(row) !== 'none') return;
            const name = textOf(row.name).trim().toLowerCase();
            const entry = name && searchArmorCatalogue(name).find(a => a.name.toLowerCase() === name);
            if (entry) replaceRow(index, current => armorRowFromCatalogue(entry, current));
        });

        detachers.push(attachAutocomplete(controls.name, {
            minChars: 1,
            getItems: (query) => searchArmorCatalogue(query).map(a => ({
                label: a.name, detail: `CA ${a.ca} · ${a.type}`, value: a
            })),
            onSelect: (item) => {
                controls.name.value = item.value.name;
                replaceRow(index, row => armorRowFromCatalogue(item.value, row));
            }
        }));

        // Armure ou bouclier magique : pastille après le nom et décors de la ligne (magic.js)
        const magic = createMagicParts(controls.name, (parts) => {
            enchant(parts, tr);
            setStatus(parts.message);
        });

        const tr = el('tr', {},
            el('td', { class: 'col-name magic-cell' }, magic.name, magic.fx),
            el('td', { class: 'col-type' }, controls.type),
            el('td', { class: 'col-ca' }, controls.ca),
            el('td', { class: 'col-str' }, controls.str),
            el('td', { class: 'col-check' }, controls.stealth),
            el('td', { class: 'col-weight' }, controls.weight),
            el('td', { class: 'col-price' }, controls.price),
            el('td', { class: 'col-comment' }, controls.comment),
            el('td', { class: 'col-equip' }, el('span', { class: 'armor-equip' }, controls.equipped, controls.warn)),
            el('td', { class: 'col-del' }, el('span', { class: 'armor-actions' }, controls.config, del)));
        return { tr, controls, magic };
    }

    function rebuild(count) {
        caBubble.hide();
        detachers.forEach(detach => detach());
        detachers = [];
        rows = Array.from({ length: count }, (_, i) => buildRow(i));
        tbody.replaceChildren(...(count
            ? rows.map(r => r.tr)
            : [el('tr', {}, el('td', {
                class: 'empty', colspan: String(COLUMN_COUNT),
                text: 'Aucune armure pour l\'instant. Ajoutez une armure, un bouclier ou tout autre avantage défensif (anneau, cape…).'
            }))]));
    }

    // -----------------------------------------------------------------------
    // Mise à jour des valeurs (sans jamais réécrire le champ en cours de saisie)
    // -----------------------------------------------------------------------

    function setText(input, value) {
        if (input === document.activeElement) return;
        if (input.value !== value) input.value = value;
    }

    function fill(character) {
        const list = armorsOf(character);
        const warnings = armorWarnings(list, armorTraining(character), parseNumber(character.str_score, 10));
        const derived = deriveCharacter(character);
        const computed = derived.armorClass.rows || [];
        // Lignes vides enregistrées : une seule reste affichée (ligne de saisie), aucune quand
        // la fiche est verrouillée ; une ligne en cours de saisie reste visible. Les autres sont
        // seulement masquées, la sauvegarde n'est pas réécrite.
        const locked = isLocked();
        let entryShown = false;
        details = [];
        rows.forEach(({ tr, controls, magic: magicParts }, i) => {
            const row = asObject(list[i]);
            const blank = isBlankArmor(row);
            const shown = !blank || tr.contains(document.activeElement) || (!locked && !entryShown);
            if (blank && shown) entryShown = true;
            tr.hidden = !shown;
            tr.classList.toggle('is-entry', blank);
            controls.name.placeholder = blank ? 'Nouvelle armure…' : 'Nom…';
            for (const key of Object.keys(TEXT_COLUMNS)) setText(controls[key], textOf(row[key]));
            controls.comment.title = textOf(row.comment);
            controls.stealth.checked = row.stealth === true;
            controls.equipped.checked = row.equipped === true;

            // Type et CA calculés
            const result = computed[i] || { line: { kind: 'none', display: '—', formula: '', category: '' }, status: 'none', note: '' };
            const { line, status } = result;
            const label = textOf(row.name).trim();
            const rawType = textOf(row.type);
            const typeLabel = CATEGORY_LABELS[line.category] || (rawType && rawType !== 'none' ? rawType : '—');
            controls.type.textContent = blank ? '' : typeLabel;
            controls.type.title = CATEGORY_NAMES[line.category] || '';
            controls.ca.hidden = blank;
            controls.ca.textContent = line.display;
            controls.ca.dataset.status = status;
            const note = status === 'counted' ? STATUS_COUNTED : result.note;
            details[i] = {
                name: label, category: CATEGORY_NAMES[line.category] || '',
                formula: line.formula, note, counted: status === 'counted'
            };
            controls.ca.setAttribute('aria-label',
                `CA de ${label ? `« ${label} »` : `la ligne ${i + 1}`} : ${line.kind === 'none' ? 'ne compte pas' : line.display}`);

            controls.config.hidden = blank;
            const magic = armorCanBeMagic(row) ? magicLevel(armorMagicBonus(row)) : 0;
            controls.config.setAttribute('aria-label',
                `Réglages de ${label ? `« ${label} »` : `l'armure (ligne ${i + 1})`}${magic ? `, bonus magique +${magic}` : ''}`);
            const shield = line.category === 'shield';
            // Équipée mais pas comptée (autre armure retenue, bouclier non maîtrisé) : la note le dit
            let where;
            if (status === 'counted') where = ' (déjà compté dans la CA de la fiche)';
            else if (row.equipped === true && result.note) where = ` (${result.note.replace(/\.$/, '')})`;
            else where = shield ? ' quand il est équipé' : ' quand elle est équipée';
            setMagic(magicParts, tr, blank ? 0 : magic, {
                label: `${shield ? 'Bouclier' : 'Armure'} ${label ? `« ${label} »` : `ligne ${i + 1}`}`,
                effect: `+${magic} à la CA${where}`
            });

            const messages = warnings[i] || [];
            controls.warn.hidden = messages.length === 0;
            controls.warn.title = messages.join('\n');
            controls.warn.dataset.message = messages.join(' ');
            controls.warn.setAttribute('aria-label', `Avertissement : ${messages.join(' ')}`);
            tr.classList.toggle('armor-warning', messages.length > 0);
        });
        // Bulle ouverte : son contenu suit le calcul (Dextérité modifiée, armure équipée…)
        caBubble.refresh();
    }

    function applyLocked() {
        const locked = isLocked();
        for (const { controls } of rows) {
            for (const key of Object.keys(TEXT_COLUMNS)) controls[key].readOnly = locked;
            controls.stealth.disabled = locked;
            // controls.equipped et la CA (bulle du calcul) : restent utilisables en mode verrouillé
        }
    }

    function render(character, changedKeys) {
        const count = armorsOf(character).length;
        if (changedKeys === null || count !== rows.length) {
            rebuild(count);
            applyLocked();
        } else if (!changedKeys.some(isWatched)) {
            return;
        }
        fill(character);
    }

    store.subscribe(render);
    document.addEventListener('dd:lockchange', () => {
        applyLocked();
        fill(store.get());
    });
    render(store.get(), null);
}
