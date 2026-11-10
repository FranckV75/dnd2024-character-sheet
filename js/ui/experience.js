// =============================================================================
// EXPERIENCE.JS (interface) - Points d'expérience : « Encore X PX avant le niveau N » et pavé « + PX »
//
//  - Sous la case PX : PX restants avant le niveau suivant, ou « PX du niveau N atteints » quand
//    le seuil est passé ; rien pour une progression par étapes (0 PX au-delà du niveau 1),
//    un texte ou le niveau 20.
//  - Bouton + à côté de la case : pavé de chiffres (js/ui/number-pad.js) pour ajouter les PX
//    gagnés. Utilisable fiche verrouillée (un ajout se fait toujours par un bouton explicite).
//  - Seuil atteint : le bouton « Passer au niveau N » (js/ui/level-up.js) s'illumine (is-ready).
// Règles : js/rules/experience.js. Mise en forme : css/stepper.css.
// =============================================================================

import { el, icon } from './dom.js';
import { openNumberPad } from './number-pad.js';
import { experienceProgress, addExperience, formatXp, MAX_XP_ENTRY } from '../rules/experience.js';

/** Texte sous la case PX (vide si rien à dire) */
export function progressText(progress) {
    if (!progress.known || progress.nextLevel === null) return '';
    if (progress.ready) return `PX du niveau ${progress.reachable} atteints`;
    return `Encore ${formatXp(progress.remaining)} PX avant le niveau ${progress.nextLevel}`;
}

/**
 * @param {{ root: HTMLElement, store: Object }} ctx
 */
export function initExperience({ root, store }) {
    const input = root.querySelector('#f-char_xp');
    const field = input?.closest('.field');
    if (!field) return;
    const button = el('button', {
        type: 'button', class: 'btn-icon xp-add-btn', 'aria-haspopup': 'dialog',
        'aria-label': 'Ajouter des PX gagnés', title: 'Ajouter des PX gagnés',
        on: { click: () => openPad(store) }
    }, icon('plus'));
    const row = el('div', { class: 'xp-input-row' });
    input.before(row);
    row.append(input, button);
    const line = el('p', { class: 'xp-progress', 'aria-live': 'polite' });
    row.append(line);

    const render = (character) => {
        const progress = experienceProgress(character);
        line.textContent = progressText(progress);
        line.classList.toggle('is-ready', progress.ready);
        root.querySelector('.level-up-btn')?.classList.toggle('is-ready', progress.ready);
    };
    store.subscribe((character, changedKeys) => {
        if (changedKeys === null || changedKeys.some((key) => ['char_xp', 'char_level'].includes(key))) render(character);
    });
    render(store.get());
}

/** « Korgul : 21 800 PX · encore 1 200 PX avant le niveau 7 » */
function summaryText(record) {
    const progress = experienceProgress(record);
    const name = String(record?.char_name ?? '').replace(/<[^>]*>/g, '').trim();
    const xp = progress.xp === null ? 'PX à corriger' : `${formatXp(Math.max(0, progress.xp))} PX`;
    const next = progressText(progress);
    const text = next ? `${xp} · ${next.charAt(0).toLowerCase()}${next.slice(1)}` : xp;
    return name ? `${name} : ${text}` : text;
}

function openPad(store) {
    openNumberPad({
        store,
        title: 'PX gagnés',
        summary: summaryText,
        max: MAX_XP_ENTRY,
        label: 'PX gagnés',
        actions: [{
            label: 'Ajouter', className: 'is-heal',
            run: (record, amount) => {
                const outcome = addExperience(record, amount);
                if (!outcome.ok) return outcome;
                const after = experienceProgress({ ...record, ...outcome.patch });
                const lines = [{ text: `+ ${formatXp(Number(amount))} PX : ${formatXp(outcome.before)} → ${formatXp(outcome.after)}.`, className: 'is-heal' }];
                if (after.ready) lines.push({ text: `${progressText(after)} : touchez + à côté du Niveau (fiche déverrouillée).` });
                return { ok: true, patch: outcome.patch, lines };
            }
        }]
    });
}
