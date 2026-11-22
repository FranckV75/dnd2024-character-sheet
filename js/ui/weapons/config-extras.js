// =============================================================================
// WEAPONS/CONFIG-EXTRAS.JS - Rubrique « Dégâts en plus » de la fenêtre de configuration d'une arme
//
// Lignes modifiables (« +2d6 contre les dragons », 4 au plus) : dégâts, raison, quand les compter
// (« Toujours » ou « À allumer »), corbeille. Lit les dégâts en plus enregistrés dans la ligne de
// l'arme (weaponConfig, js/rules/weapon-extras.js) ; n'écrit rien dans la fiche : la fenêtre
// (js/ui/weapons/config.js) enregistre le tout quand on touche « Appliquer ».
// Le texte du joueur n'est jamais posé comme du HTML.
// =============================================================================

import { EXTRA_DAMAGE_MAX, EXTRA_REASON_MAX, EXTRA_DAMAGE_MODES, readExtraDamage } from '../../rules/weapon-extras.js';
import { el, icon, setIconLabel } from '../dom.js';
import { frenchSpaces } from '../help.js';

/** Réglage « Quand » d'un dégât en plus (fenêtre de configuration) : un libellé par mode des règles */
const EXTRA_MODE_LABELS = { always: 'Toujours', toggle: 'À allumer' };
const EXTRA_MODE_OPTIONS = EXTRA_DAMAGE_MODES.map(mode => [mode, EXTRA_MODE_LABELS[mode]]);

/** Aide de la rubrique « Dégâts en plus » (dans la fenêtre : la barre du haut est cachée derrière) */
const EXTRA_HELP = "Pour une arme spéciale, par exemple +2d6 contre les dragons. « Toujours » : compté en permanence dans les dégâts. "
    + "« À allumer » : une pastille apparaît sous l'arme ; touchez-la quand la condition est remplie. La corbeille retire la ligne. "
    + `Raison : ${EXTRA_REASON_MAX} caractères au plus.`;

/**
 * Rubrique « Dégâts en plus » d'une fenêtre de configuration.
 * @param {string} id - identifiant de la fenêtre (préfixe des identifiants de la rubrique)
 * @param {string|Object} weaponConfig - réglages enregistrés de l'arme
 * @returns {{
 *   box: HTMLElement,
 *   dropBlankLines(): void,
 *   values(): Array<{ dmg: string, reason: string, mode: string, on: boolean }>,
 *   refuse(invalid: Array<{ index: number, field: string }>, message: string|undefined, takeFocus: boolean): void,
 *   addedPills(): number
 * }} box : la rubrique, à poser dans la fenêtre ; dropBlankLines : retire les lignes ajoutées puis
 *   laissées vides ; values : les lignes à valider et enregistrer ; refuse : montre une saisie
 *   refusée ; addedPills : nombre de pastilles nouvelles
 */
export function createExtrasEditor(id, weaponConfig) {
    // Dégâts en plus : lignes modifiables (4 au plus). L'état allumé d'une pastille (on) est
    // gardé tant que la ligne reste « À allumer ». Rien n'est enregistré avant « Appliquer ».
    // wasPill : la ligne avait déjà sa pastille à l'ouverture (elle n'est pas annoncée comme nouvelle)
    const extras = readExtraDamage(weaponConfig)
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

    return {
        box: extraBox,
        /** Ligne ajoutée puis laissée vide : retirée, sans message */
        dropBlankLines() {
            if (!extras.some(line => !line.dmg.trim() && !line.reason.trim())) return;
            for (let i = extras.length - 1; i >= 0; i--) {
                if (!extras[i].dmg.trim() && !extras[i].reason.trim()) extras.splice(i, 1);
            }
            renderExtras();
        },
        values: () => extras.map(({ dmg, reason, mode, on }) => ({ dmg, reason, mode, on })),
        /**
         * Saisie refusée (buildWeaponConfig, js/rules/weapons.js) : chaque champ fautif est marqué,
         * le message est posé au-dessus de la première ligne fautive (ou retiré s'il n'y en a pas).
         * takeFocus : le curseur va dans le champ à corriger (faux quand un autre champ de la
         * fenêtre passe d'abord).
         */
        refuse(invalid, message, takeFocus) {
            extraControls.forEach((controls, i) => {
                for (const key of ['dmg', 'reason', 'mode']) {
                    const bad = invalid.some(entry => entry.index === i && entry.field === key);
                    controls[key].setAttribute('aria-invalid', String(bad));
                    if (bad) controls[key].setAttribute('aria-describedby', `${id}-extra-error`);
                    else controls[key].removeAttribute('aria-describedby');
                }
            });
            const bad = invalid[0] ? extraControls[invalid[0].index] : undefined;
            if (message) showExtraError(message, bad, takeFocus ? bad?.[invalid[0].field] ?? null : null);
            else extraError.hidden = true;
        },
        /**
         * Pastilles nouvelles (ligne ajoutée, ou passée de « Toujours » à « À allumer ») : une
         * pastille déjà là dont on a seulement corrigé le texte n'est pas comptée.
         */
        addedPills: () => extras.filter(line => line.mode === 'toggle' && !line.wasPill).length
    };
}
