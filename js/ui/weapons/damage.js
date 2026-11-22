// =============================================================================
// WEAPONS/DAMAGE.JS - Case des dégâts d'une arme, détail sous l'arme, pastilles « À allumer »
//
// Écrit le texte calculé (attaque, dégâts) dans sa case ; les dégâts en plus du joueur
// (js/rules/weapon-extras.js) y tiennent chacun sur une ligne, abrégés avec « … » : toucher la
// case les écrit en entier sous l'arme (toggleDamageDetail), fiche verrouillée ou non.
// « À allumer » : une pastille par dégât, dans une ligne sous l'arme (même aspect et même règle
// de verrou que Rage). Lit la ligne de l'arme (weaponConfig) ; n'écrit dans la fiche que l'état
// allumé d'une pastille (toggleExtra), rangé dans weaponConfig, jamais à part.
// =============================================================================

import {
    readExtraDamage, activeExtraDamage, extraDamageText, extraDamageLabel, offBookDamage, toggleExtraDamage
} from '../../rules/weapon-extras.js';
import { el, icon } from '../dom.js';
import { frenchSpaces } from '../help.js';
import { plain, fitStatus, weaponInSentence } from './shared.js';

/** Bonus de Charge dans le texte des dégâts (computeWeapon : « +1d8 (Charge) ») */
const CHARGE_BONUS = /\+1d8 \(Charge\)/;

/** Dernier contenu écrit dans une case calculée (texte et découpage) : rien n'est réécrit s'il n'a pas changé */
const calcSignatures = new WeakMap();

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
export function writeCalc(node, computed, legacy, weapon) {
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

/**
 * Toucher les dégâts d'une arme qui porte des dégâts en plus : ils s'écrivent en entier sous
 * l'arme (nouveau toucher : le détail se referme). La barre du haut tient sur une ligne et
 * coupait ce texte ; elle dit seulement où le lire, en deux phrases de 30 caractères au plus :
 * sur ordinateur, la colonne des messages fait 175 px sur deux lignes (une phrase par ligne).
 * @param {import('./shared.js').WeaponsContext} ctx
 * @param {number} index - place de l'arme dans dynamic_weapons
 */
export function toggleDamageDetail(ctx, index) {
    const weapon = ctx.weapons()[index];
    const row = ctx.rows[index];
    if (!weapon || !row || activeExtraDamage(weapon.weaponConfig).length === 0) return;
    row.detailOpen = !row.detailOpen;
    ctx.refresh();
    ctx.setStatus(row.detailOpen
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
export function writeDamageDetail(row, weapon, offBook, shown) {
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
function toggleExtra(ctx, index, lineIndex, label) {
    const weapon = ctx.weapons()[index];
    const line = weapon ? readExtraDamage(weapon.weaponConfig).find(entry => entry.index === lineIndex) : null;
    // La ligne a changé entre-temps (autre onglet) : on ne bascule jamais un autre dégât que celui affiché
    if (!line || line.mode !== 'toggle' || extraDamageLabel(line) !== label) {
        ctx.refresh();
        return;
    }
    ctx.updateRow(index, (w) => ({ ...w, weaponConfig: toggleExtraDamage(w.weaponConfig, lineIndex) }));
    const said = line.on ? `${label} : n'est plus compté dans les dégâts` : `${label} : compté dans les dégâts`;
    ctx.setStatus(frenchSpaces(fitStatus(`${said} de ${weaponInSentence(weapon)}.`, `${said}.`)));
}

/**
 * Ligne des pastilles « À allumer » d'une arme, et mention imprimée à leur place.
 * @param {import('./shared.js').WeaponsContext} ctx
 * @param {Object} row
 * @param {number} index - place de l'arme dans dynamic_weapons
 * @param {Object} weapon
 * @param {boolean} shown - la ligne de l'arme est affichée (filtres)
 * @param {boolean} detail - le détail des dégâts est ouvert dans la même ligne (writeDamageDetail)
 */
export function writeExtraPills(ctx, row, index, weapon, shown, detail) {
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
                on: { click: () => toggleExtra(ctx, index, line.index, label) }
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
