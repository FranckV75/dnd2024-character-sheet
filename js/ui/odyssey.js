// =============================================================================
// ODYSSEY.JS (interface) - Mode « Odyssée des Seigneurs Dragons », réglé fiche par fiche
//
// Règles : js/rules/odyssey.js (clé facultative « odyssey_mode », actif par défaut).
//  - Case « Mode Odyssée » du menu « Gestion », au bout de la rangée « Mode d'emploi » : cochée =
//    mode actif. Réglage de la fiche : masquée fiche verrouillée (edit-only), comme « Nouvelle
//    fiche ». Au toucher, la barre du haut dit ce que le mode fait et ce que la fiche garde ; à la
//    souris, l'infobulle l'explique.
// Les listes d'espèces, de sous-classes et de dons suivent le mode dans js/ui/sheet.js.
// Mise en forme : css/toolbar.css (.toolbar-check).
// =============================================================================

import { el } from './dom.js';
import { isLocked } from './lock.js';
import { frenchSpaces } from './help.js';
import {
    ODYSSEY_MODE_LABEL, odysseyActive, setOdysseyModePatch, odysseyModeHint, odysseyModeMessage
} from '../rules/odyssey.js';

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} ctx
 */
export function initOdyssey({ store, setStatus }) {
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
        setStatus(frenchSpaces(odysseyModeMessage(store.get())));
    });

    store.subscribe((character) => render(character));
    render(store.get());
}
