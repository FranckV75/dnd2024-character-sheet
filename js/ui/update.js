// =============================================================================
// UPDATE.JS - Mises à jour fiables sur tablette
//
// GitHub Pages autorise les navigateurs à garder les fichiers 10 minutes, et une tablette peut
// garder plus longtemps encore l'ancien code d'une fiche restée ouverte : la page pouvait mêler
// une nouvelle page et un ancien programme. À l'ouverture et à chaque retour sur l'onglet (au plus
// une fois par minute), la version en ligne (package.json, jamais pris en mémoire) est comparée à
// celle de la page (js/version.js). Plus récente : la fiche est enregistrée, chaque fichier de
// l'application déjà chargé est redemandé au site, puis la page est rechargée.
// Une seule tentative par version (mémorisée pour l'onglet) : si elle échoue, un message demande
// de fermer puis rouvrir la fiche. Hors ligne ou site injoignable : rien ne se passe.
// Jamais pendant qu'une fenêtre est ouverte (choix en cours) : la vérification attend le retour
// suivant sur l'onglet.
// =============================================================================

import { APP_VERSION } from '../version.js';
import { isNewerVersion, appFilesToRefresh } from '../state/update-check.js';

const TRIED_KEY = 'dd2024_update_tried';
const MIN_INTERVAL_MS = 60_000;

function readSession(key) {
    try {
        return sessionStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeSession(key, value) {
    try {
        if (value === null) sessionStorage.removeItem(key);
        else sessionStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

async function onlineVersion() {
    const response = await fetch(`package.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.version ?? null;
}

/**
 * @param {{ setStatus: (message: string) => void, saveNow: () => void }} ctx
 */
export function initUpdates({ setStatus, saveNow }) {
    // Rechargement fait par une mise à jour : on le dit, une fois
    const tried = readSession(TRIED_KEY);
    if (tried && tried === APP_VERSION) {
        writeSession(TRIED_KEY, null);
        setTimeout(() => setStatus(`Fiche mise à jour (version ${APP_VERSION}).`), 0);
    }

    let lastCheck = 0;
    let busy = false;

    const check = async () => {
        if (busy || Date.now() - lastCheck < MIN_INTERVAL_MS) return;
        if (document.querySelector('dialog[open]')) return;
        busy = true;
        lastCheck = Date.now();
        try {
            const remote = await onlineVersion();
            if (!isNewerVersion(remote, APP_VERSION)) return;
            // Une seule tentative par version : la page n'entre jamais dans une boucle de rechargements
            if (readSession(TRIED_KEY) === remote || !writeSession(TRIED_KEY, remote)) {
                setStatus(`Nouvelle version ${remote} en ligne : fermez puis rouvrez la fiche pour l'installer.`);
                return;
            }
            if (document.querySelector('dialog[open]')) {
                writeSession(TRIED_KEY, null);
                return;
            }
            setStatus(`Installation de la version ${remote}…`);
            saveNow();
            const urls = appFilesToRefresh(performance.getEntriesByType('resource').map((entry) => entry.name), location.origin);
            await Promise.allSettled([location.href.split('#')[0], ...urls].map((url) => fetch(url, { cache: 'reload' })));
            location.reload();
        } catch {
            // Hors ligne, site injoignable, réponse illisible : on réessaiera au prochain retour
        } finally {
            busy = false;
        }
    };

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
    });
    // À l'ouverture, une fois la fiche affichée
    setTimeout(check, 2000);
}
