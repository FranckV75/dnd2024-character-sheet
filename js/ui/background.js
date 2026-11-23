// =============================================================================
// BACKGROUND.JS (interface) - Bloc « Historique » de l'encadré « Espèce & historique »
//
// Ce que donne l'historique choisi en haut de la fiche (caractéristiques, don d'origine,
// compétences, outil, équipement), avec un repère « À vérifier » pour ce qui manque, et un
// bouton « Appliquer » (fiche déverrouillée) qui coche les compétences, remplit le don de
// niveau 1 s'il est vide et ajoute à la case « Outils » l'outil précis de l'historique s'il n'y est
// pas (le texte du joueur est gardé ; le résultat passe par le nettoyage des champs riches), après
// confirmation. Un outil au choix n'est pas écrit : le message de la barre du haut invite à le
// choisir. La ligne « Outil » porte le bouton « Choisir dans la liste » (fenêtre des outils,
// js/ui/tools.js), qui présente en tête l'outil de l'historique.
// Règles : js/rules/background.js.
// =============================================================================

import { el, icon } from './dom.js';
import { confirmModal } from './modal.js';
import { foldButton, bindFolding, applyFolds } from './fold.js';
import {
    backgroundSummary, backgroundApplyPatch, backgroundApplyConfirm, backgroundAppliedMessage
} from '../rules/background.js';
import { toolPickerButton } from './tools.js';
import { sanitizeRich, richTextAvailable } from './sanitize.js';

/** Clés qui changent le bloc */
const WATCHED = /^(char_background|feat_1|feat_choices|profs_tools|skill_prof_)/;

/**
 * @param {Object} line - ligne de backgroundSummary
 * @param {Object} ctx - { store, setStatus } : pour le bouton de la ligne « Outil »
 */
function lineItem(line, ctx) {
    return el('li', { class: 'origin-line', 'data-origin-line': line.id },
        el('span', { class: 'origin-line-label', text: line.label }),
        el('span', { class: 'origin-line-text', text: line.text }),
        line.check ? el('span', { class: 'origin-check' }, icon('warning'),
            el('span', { class: 'feat-tag', 'data-kind': 'check', text: 'À vérifier' }),
            el('span', { text: line.check })) : null,
        // Outil de l'historique : la fenêtre des outils s'ouvre sur lui (fiche déverrouillée)
        line.id === 'tool' ? el('span', { class: 'origin-tool-pick edit-only' }, toolPickerButton(ctx),
            el('small', { text: line.check ? "Cochez-le dans la liste : il s'écrit dans la case Outils." : 'Pour voir ou changer vos outils.' })) : null);
}

/**
 * @param {{ root: HTMLElement, store: Object, setStatus?: Function }} ctx
 */
export function initBackground({ root, store, setStatus = () => {} }) {
    const container = root.querySelector('#background-info');
    if (!container) return;

    async function apply() {
        const character = store.get();
        const summary = backgroundSummary(character);
        if (!summary?.canApply) return;
        const ok = await confirmModal({
            title: `Historique : ${summary.name}`,
            icon: 'scroll',
            message: backgroundApplyConfirm(summary),
            confirmLabel: 'Appliquer'
        });
        if (!ok) return;
        const patch = backgroundApplyPatch(store.get());
        if ('profs_tools' in patch) {
            // Case « Outils » : même chemin que les champs riches (nettoyage DOMPurify). Mise en forme
            // indisponible (hors ligne) : la case est en lecture seule, l'outil n'est pas écrit
            if (richTextAvailable()) patch.profs_tools = sanitizeRich(patch.profs_tools);
            else delete patch.profs_tools;
        }
        if (Object.keys(patch).length) {
            store.update(patch);
            // Le bouton disparaît une fois tout appliqué : le focus revient au titre du bloc
            if (!container.contains(document.activeElement)) {
                (container.querySelector('.origin-apply button') ?? container.querySelector('.fold-toggle'))?.focus({ preventScroll: true });
            }
            setStatus(backgroundAppliedMessage(backgroundSummary(store.get()) ?? summary));
        } else if (summary.writesTool) {
            setStatus("⚠️ Outil non écrit hors ligne pour l'instant : rechargez la page une fois connecté.");
        }
    }

    let rendered = null;
    const render = (character) => {
        const summary = backgroundSummary(character);
        const signature = JSON.stringify(summary);
        if (signature === rendered) return;
        rendered = signature;
        if (!summary) {
            container.replaceChildren();
            container.hidden = true;
            return;
        }
        // replaceChildren écrit « null » en texte : les éléments absents sont retirés avant
        container.replaceChildren(...[
            el('p', { class: 'subclass-title origin-title' }, icon('scroll'),
                el('span', { text: `Historique : ${summary.name}` }),
                foldButton(`Historique : ${summary.name}`)),
            el('ul', { class: 'origin-lines' }, summary.lines.map((line) => lineItem(line, { store, setStatus }))),
            summary.canApply ? el('p', { class: 'origin-apply edit-only' },
                el('button', {
                    type: 'button', class: 'btn-chip', 'aria-haspopup': 'dialog',
                    on: { click: apply }
                }, icon('plus'), el('span', { text: 'Appliquer à la fiche' })),
                el('small', { text: ` ${summary.applyText.join(' ; ')}.` })) : null
        ].filter(Boolean));
        container.hidden = false;
        container.dataset.foldKey = 'origin:background';
        applyFolds(container);
    };
    bindFolding(container);
    render(store.get());
    store.subscribe((character, changedKeys) => {
        if (changedKeys === null || changedKeys.some((key) => WATCHED.test(key))) render(character);
    });
}
