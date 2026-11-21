// =============================================================================
// ODYSSEY.JS (interface) - Mode « Odyssée des Seigneurs Dragons », réglé fiche par fiche
//
// Règles : js/rules/odyssey.js (clé facultative « odyssey_mode », actif par défaut).
//  - Case « Mode Odyssée » du menu « Gestion », au bout de la rangée « Mode d'emploi » : cochée =
//    mode actif. Réglage de la fiche : masquée fiche verrouillée (edit-only), comme « Nouvelle
//    fiche ». Au toucher, la barre du haut dit que le mode vient d'être coupé, ce que cela change,
//    ce que la fiche garde et comment revenir en arrière (deux lignes sur tablette, menu ouvert ;
//    l'essentiel sur ordinateur, où la colonne des messages est étroite) ; à la souris, l'infobulle
//    l'explique.
//  - Mode coupé, un choix de l'Odyssée abandonné (espèce, sous-classe, style) sort aussitôt de sa
//    liste : la barre du haut dit comment le retrouver (recocher la case).
//  - Encadré « Odyssée des Seigneurs Dragons » (onglet 3) : caché quand le mode est coupé ET qu'il
//    est vide (ni destin héroïque ni points de renommée). Il n'est caché qu'à un moment calme :
//    changement du mode, ouverture ou remplacement de la fiche, verrou, impression. Vidé à la main,
//    mode coupé, il reste donc sous le doigt (une renommée ramenée à 0 par erreur se corrige).
//    L'écran et le papier disent la même chose : au moment d'imprimer, l'encadré inutile disparaît
//    aussi de l'écran (beforeprint ; filet : attribut data-odyssey-unused, css/print.css).
//  - Libellé « Inspiration héroïque ou points de Foi » (onglet Combat) : « Inspiration héroïque »
//    quand le mode est coupé, boutons − / + compris.
// Les listes d'espèces, de sous-classes et de dons suivent le mode dans js/ui/sheet.js.
// Mise en forme : css/toolbar.css (.toolbar-check).
// =============================================================================

import { el } from './dom.js';
import { isLocked } from './lock.js';
import { frenchSpaces } from './help.js';
import { renameSteppers } from './stepper.js';
import { COMPACT_QUERY } from './toolbar.js';
import {
    ODYSSEY_MODE_KEY, ODYSSEY_MODE_LABEL, STATUS_ROOM, STATUS_ROOM_OPEN, STATUS_ROOM_NARROW,
    odysseyActive, setOdysseyModePatch, odysseyModeHint, odysseyModeMessage, odysseyDroppedMessage,
    odysseyBoxUseful, inspirationWording
} from '../rules/odyssey.js';

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} ctx
 */
export function initOdyssey({ root, store, setStatus }) {
    initBox(root, store);
    initInspiration(root, store);
    // Tablette (barre repliable, message sur toute la largeur) ou ordinateur (colonne étroite)
    const compact = window.matchMedia(COMPACT_QUERY);
    initDroppedNotice(store, setStatus, compact);
    const host = document.getElementById('toolbar-help');
    if (!host) return;

    // Une vraie case à cocher, dessinée comme celles de la fiche, dans un bouton de la barre
    const box = el('input', { type: 'checkbox', class: 'round-check', id: 'odyssey-mode' });
    const control = el('label', { class: 'btn toolbar-check edit-only', for: 'odyssey-mode' },
        box, el('span', { class: 'btn-label', text: ODYSSEY_MODE_LABEL }));
    host.append(control);

    const render = (character) => {
        const active = odysseyActive(character);
        if (box.checked !== active) box.checked = active;
        const hint = frenchSpaces(odysseyModeHint(character));
        if (control.title !== hint) control.title = hint;
    };

    box.addEventListener('change', () => {
        // Fiche verrouillée : la case est masquée ; un changement venu d'ailleurs est annulé
        const patch = isLocked() ? {} : setOdysseyModePatch(store.get(), box.checked);
        if (!Object.keys(patch).length) {
            render(store.get());
            return;
        }
        store.update(patch);
        // La case est dans le menu ouvert : sur tablette, le message y dispose de deux lignes
        setStatus(frenchSpaces(odysseyModeMessage(store.get(), compact.matches ? STATUS_ROOM_OPEN : STATUS_ROOM_NARROW)));
    });

    store.subscribe((character) => render(character));
    render(store.get());
}

/**
 * Mode coupé : un choix de l'Odyssée que la fiche abandonne (autre espèce, autre classe ou
 * sous-classe, autre style de combat) sort aussitôt de sa liste. La barre du haut le dit, avec le
 * moyen de le retrouver. Rien à l'ouverture ou au remplacement de la fiche (changedKeys nul).
 * @param {Object} store
 * @param {(message: string) => void} setStatus
 * @param {MediaQueryList} compact
 */
function initDroppedNotice(store, setStatus, compact) {
    let previous = store.get();
    store.subscribe((character, changedKeys) => {
        const before = previous;
        previous = character;
        if (changedKeys === null) return;
        const message = odysseyDroppedMessage(before, character, compact.matches ? STATUS_ROOM : STATUS_ROOM_NARROW);
        if (message) setStatus(frenchSpaces(message));
    });
}

/**
 * Encadré « Odyssée des Seigneurs Dragons » de l'onglet 3.
 * @param {HTMLElement} root
 * @param {Object} store
 */
function initBox(root, store) {
    const box = root.querySelector('section.box.odyssey');
    if (!box) return;
    /** @param {boolean} settle - moment calme : l'encadré inutile peut disparaître de l'écran */
    const sync = (character, settle) => {
        const useful = odysseyBoxUseful(character);
        box.toggleAttribute('data-odyssey-unused', !useful);
        if (useful) box.hidden = false;
        else if (settle) box.hidden = true;
    };
    store.subscribe((character, changedKeys) => sync(character, changedKeys === null || changedKeys.includes(ODYSSEY_MODE_KEY)));
    document.addEventListener('dd:lockchange', () => sync(store.get(), true));
    // Impression : l'encadré inutile quitte aussi l'écran, qui montre ainsi ce qui est imprimé
    window.addEventListener('beforeprint', () => sync(store.get(), true));
    sync(store.get(), true);
}

/**
 * Libellé de la case d'Inspiration (onglet Combat) et nom de ses boutons − / +.
 * @param {HTMLElement} root
 * @param {Object} store
 */
function initInspiration(root, store) {
    const input = root.querySelector('#f-heroic_inspiration');
    const label = root.querySelector('label[for="f-heroic_inspiration"]');
    if (!input || !label) return;
    const render = (character) => {
        const wording = inspirationWording(character);
        if (label.textContent !== wording.label) label.textContent = wording.label;
        renameSteppers(input, wording.noun);
    };
    store.subscribe((character) => render(character));
    render(store.get());
}
