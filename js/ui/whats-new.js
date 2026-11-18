// =============================================================================
// WHATS-NEW.JS (interface) - Fenêtre « Nouveautés de la version X », après une mise à jour
//
// Quelques lignes simples sur ce qui a changé (js/data/whats-new.js), montrées une fois par
// appareil : la dernière version vue est retenue dans le navigateur (SEEN_VERSION_KEY, préférence
// d'appareil, jamais dans la fiche). Quoi montrer : js/state/whats-new.js (règle testée).
//  - Annoncée par js/ui/update.js, après la vérification de mise à jour de l'ouverture.
//  - Jamais par-dessus une autre fenêtre (question de synchronisation, avis du démarrage), ni
//    pendant que le joueur écrit dans une case : elle attend que l'écran soit libre. Une question
//    qui arrive ensuite se pose par-dessus elle.
//  - La version n'est retenue qu'à la fermeture de la fenêtre : fermée par accident avec la
//    page, elle revient à l'ouverture suivante.
//  - Les nouveautés restent lisibles dans le mode d'emploi (rubrique « Nouveautés »).
// =============================================================================

import { el } from './dom.js';
import { openModal } from './modal.js';
import { openHelp, frenchSpaces } from './help.js';
import { WHATS_NEW } from '../data/whats-new.js';
import { newsToShow, SEEN_VERSION_KEY } from '../state/whats-new.js';
import { APP_VERSION } from '../version.js';

/** Délai entre deux essais quand une autre fenêtre occupe l'écran */
const RETRY_MS = 1000;

function readSeen() {
    try {
        return localStorage.getItem(SEEN_VERSION_KEY);
    } catch {
        return null;
    }
}

function rememberCurrent() {
    try {
        localStorage.setItem(SEEN_VERSION_KEY, APP_VERSION);
    } catch {
        // Stockage indisponible : rien à retenir
    }
}

/** Le joueur écrit dans une case (texte, nombre, liste) : on ne lui prend pas la main */
function isTyping() {
    const active = document.activeElement;
    if (!active || active === document.body) return false;
    if (active.isContentEditable || active.matches('textarea, select')) return true;
    return active.matches('input') && !['checkbox', 'radio', 'button', 'range', 'file'].includes(active.type);
}

/** Exécute `run` dès qu'aucune fenêtre n'est ouverte, que la page est visible et que le joueur n'écrit pas */
function whenQuiet(run) {
    const ready = () => !document.querySelector('dialog[open]') && document.visibilityState === 'visible' && !isTyping();
    if (ready()) {
        run();
        return;
    }
    const timer = setInterval(() => {
        if (!ready()) return;
        clearInterval(timer);
        run();
    }, RETRY_MS);
}

/**
 * @param {Array<{ version: string, items: ReadonlyArray<string> }>} entries
 * @param {() => void} [onClosed]
 */
function openNews(entries, onClosed) {
    const several = entries.length > 1;
    let wantsHelp = false;
    openModal({
        title: `Nouveautés de la version ${APP_VERSION}`,
        icon: 'sparkle',
        wide: several,
        focusField: false,
        body: [
            ...entries.flatMap((entry) => [
                several ? el('h3', { class: 'news-version', text: `Version ${entry.version}` }) : null,
                el('ul', { class: 'news-list' }, entry.items.map((item) => el('li', { text: frenchSpaces(item) })))
            ]),
            el('p', {
                class: 'toolbar-modal-note',
                text: frenchSpaces('À relire quand vous voulez : menu « Gestion », « Mode d\'emploi », rubrique « Nouveautés ».')
            })
        ],
        actions: [
            {
                label: 'Mode d\'emploi', icon: 'help',
                title: 'Ouvrir la notice de la fiche',
                onClick: () => { wantsHelp = true; }
            },
            { label: 'Compris', primary: true }
        ],
        onClose: () => {
            rememberCurrent();
            // Après la fermeture complète de cette fenêtre (focus rendu à la page) ; la suite
            // (nouvelle vérification de mise à jour) attend alors la fermeture du mode d'emploi
            if (wantsHelp) setTimeout(() => openHelp({ onClose: onClosed }), 0);
            else onClosed?.();
        }
    });
}

/**
 * Montre les nouveautés si cet appareil ne les a pas encore vues.
 * @param {{ returning?: boolean, onClosed?: () => void }} [options] - returning : une fiche était
 *   déjà enregistrée sur cet appareil ; onClosed : appelé quand la fenêtre a été fermée
 */
export function announceNews({ returning = false, onClosed } = {}) {
    const plan = () => newsToShow({ entries: WHATS_NEW, lastSeen: readSeen(), current: APP_VERSION, returning });
    const first = plan();
    if (!first.remember) return;
    if (first.entries.length === 0) {
        rememberCurrent();
        return;
    }
    whenQuiet(() => {
        // Relu au dernier moment : un autre onglet a pu les montrer entre-temps
        const { entries, remember } = plan();
        if (entries.length > 0) openNews(entries, onClosed);
        else if (remember) rememberCurrent();
    });
}
