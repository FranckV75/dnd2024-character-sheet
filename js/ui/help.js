// =============================================================================
// HELP.JS (interface) - Fenêtre « Mode d'emploi » (barre Gestion)
//
// La notice de la fiche, dans la fiche : textes de js/data/help.js (HELP_CONTENTS), rubrique
// « Nouveautés » comprise (js/data/whats-new.js).
//  - Grande fenêtre (classe modal-help, css/help.css) : le sommaire à gauche, la rubrique choisie
//    à droite, chacun avec son défilement ; en bas de la rubrique, un bouton mène à la suivante.
//  - « Imprimer le mode d'emploi » : toute la notice sur papier A4. Tant que la fenêtre est
//    ouverte, une copie complète (.help-print, invisible à l'écran) est posée dans la page et
//    <html> porte data-print="help" : css/print.css imprime alors cette copie à la place de la
//    fiche. Fenêtre fermée, tout est retiré : « Imprimer » imprime de nouveau la fiche.
//  - Lecture seule, rien n'est écrit dans la fiche : disponible fiche verrouillée.
// Textes posés par textContent (aucun innerHTML), avec les espaces insécables de la typographie
// française (frenchSpaces) : un guillemet ou un deux-points ne se retrouve jamais seul en début
// ou en fin de ligne.
// =============================================================================

import { el, icon } from './dom.js';
import { openModal } from './modal.js';
import { HELP_CONTENTS } from '../data/help.js';
import { APP_VERSION } from '../version.js';

/** Infobulle du bouton de la barre (souris) ; au toucher, la fenêtre s'ouvre sur son sommaire */
export const HELP_TITLE = "Lire la notice de la fiche, onglet par onglet (à l'écran ou à imprimer)";

/** Phrase d'explication du bouton d'impression, lisible aussi sur tablette */
const PRINT_NOTE = "« Imprimer le mode d'emploi » imprime toute la notice (papier A4 ou PDF), et non la fiche.";

/**
 * Espaces insécables : après «, avant », et avant : ; ? !
 * @param {string} text
 * @returns {string}
 */
export function frenchSpaces(text) {
    const nbsp = '\u00A0';
    return String(text ?? '')
        .replace(/« /g, `«${nbsp}`)
        .replace(/ »/g, `${nbsp}»`)
        .replace(/ ([:;?!])/g, `${nbsp}$1`);
}

/** Une entrée : son titre, puis son texte ou sa liste (rubrique « Nouveautés ») */
function entryNode(entry) {
    return el('div', { class: 'help-entry' },
        el('h4', { class: 'help-entry-title', text: frenchSpaces(entry.title) }),
        Array.isArray(entry.items)
            ? el('ul', { class: 'help-entry-list' }, entry.items.map((item) => el('li', { text: frenchSpaces(item) })))
            : el('p', { class: 'help-entry-text', text: frenchSpaces(entry.text) }));
}

/** Une rubrique entière (titre de niveau `heading`, puis ses entrées) */
function sectionNode(section, heading) {
    return el('section', { class: 'help-section' },
        el(heading, { class: 'help-section-title', text: frenchSpaces(section.title) }),
        section.entries.map(entryNode));
}

/** Copie complète pour l'imprimante (masquée à l'écran, css/help.css) */
function printCopy() {
    return el('div', { class: 'help-print', 'aria-hidden': 'true' },
        el('h1', { class: 'help-print-title', text: "Mode d'emploi de la fiche de personnage" }),
        el('p', { class: 'help-print-version', text: `Version ${APP_VERSION}` }),
        HELP_CONTENTS.map((section) => sectionNode(section, 'h2')));
}

/**
 * @param {{ section?: string }} [options] - rubrique ouverte d'abord (id de js/data/help.js)
 * @returns {() => void} Fonction qui ferme la fenêtre
 */
export function openHelp({ section } = {}) {
    const page = el('div', { class: 'help-page', tabindex: '-1' });
    const items = new Map();

    const show = (id, { focus = false } = {}) => {
        const index = Math.max(0, HELP_CONTENTS.findIndex((entry) => entry.id === id));
        const current = HELP_CONTENTS[index];
        const next = HELP_CONTENTS[index + 1];
        for (const [key, button] of items) {
            if (key === current.id) button.setAttribute('aria-current', 'true');
            else button.removeAttribute('aria-current');
        }
        const nextButton = next && el('button', {
            type: 'button', class: 'btn help-next',
            on: { click: () => show(next.id, { focus: true }) }
        }, el('span', { class: 'btn-label', text: frenchSpaces(`Rubrique suivante : ${next.title}`) }), icon('chevron'));
        page.replaceChildren(...[sectionNode(current, 'h3'), nextButton].filter(Boolean));
        page.scrollTop = 0;
        // Lecture au clavier ou au lecteur d'écran : on arrive en haut de la rubrique
        if (focus) page.focus();
    };

    const toc = el('nav', { class: 'help-toc', 'aria-label': 'Sommaire du mode d\'emploi' },
        el('p', { class: 'help-toc-title', text: 'Sommaire' }),
        el('ul', { class: 'help-toc-list' }, HELP_CONTENTS.map((entry) => {
            const button = el('button', {
                type: 'button', class: 'help-toc-item', text: frenchSpaces(entry.title),
                on: { click: () => show(entry.id) }
            });
            items.set(entry.id, button);
            return el('li', {}, button);
        })));

    // Copie pour l'imprimante : présente tant que la fenêtre est ouverte
    const copy = printCopy();
    document.body.append(copy);
    document.documentElement.dataset.print = 'help';

    const close = openModal({
        title: 'Mode d\'emploi',
        icon: 'help',
        className: 'modal-help',
        focusField: false,
        body: [
            el('div', { class: 'help-layout' }, toc, page),
            el('p', { class: 'help-print-note', text: frenchSpaces(PRINT_NOTE) })
        ],
        actions: [
            {
                label: 'Imprimer le mode d\'emploi', icon: 'printer',
                title: 'Imprimer toute la notice (papier A4 ou PDF)',
                onClick: () => {
                    window.print();
                    return false;
                }
            },
            { label: 'Fermer', primary: true }
        ],
        onClose: () => {
            copy.remove();
            delete document.documentElement.dataset.print;
        }
    });
    show(section);
    return close;
}
