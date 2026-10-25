// =============================================================================
// MAIN.JS - Point d'entrée de l'application (v4)
// Crée le store, construit la fiche puis branche chaque fonctionnalité.
// Chaque module reçoit le même contexte : { root, store, setStatus }.
// =============================================================================

import { initTheme } from './ui/theme.js';
import { initTabs } from './ui/tabs.js';
import { decorateIcons } from './ui/ornaments.js';
import { icon } from './ui/dom.js';
import { createSheet } from './ui/sheet.js';
import { initLock } from './ui/lock.js';
import { initToolbar } from './ui/toolbar.js';
import { initGallery } from './ui/gallery.js';
import { initWeapons } from './ui/weapons.js';
import { initArmors } from './ui/armors.js';
import { initSpells } from './ui/spells.js';
import { initRest } from './ui/rest.js';
import { initStyleEditor } from './ui/style-editor.js';
import { initAccount } from './ui/account.js';
import { fitCellTexts } from './ui/cell-text.js';
import { createStore } from './state/store.js';
import { createDefaultCharacter } from './state/schema.js';
import { loadLocal, saveLocal } from './state/persistence.js';

const AUTOSAVE_DELAY_MS = 600;

const STATUS_HOLD_MS = 4000;

const root = document.querySelector('.sheet');
const status = document.getElementById('save-status');
let statusHeldUntil = 0;

/** Émoji en tête d'un message (⚠️ avertissement, ✅ ou ✔ réussite) */
const STATUS_EMOJI = /^(⚠️?|✅|✔️?)\s*/u;

/**
 * Affiche un message dans la barre : l'émoji d'avertissement devient l'icône dessinée
 * (rouge, voir components.css), celui de réussite est simplement retiré.
 * @param {string} message
 */
const showStatus = (message) => {
    const text = String(message ?? '');
    const match = text.match(STATUS_EMOJI);
    const clean = match ? text.slice(match[0].length) : text;
    if (match && match[1].startsWith('⚠')) {
        const warning = icon('warning');
        warning.classList.add('status-icon');
        status.replaceChildren(warning, clean);
    } else {
        status.textContent = clean;
    }
    status.title = clean; // texte complet si la barre le coupe (« … »)
};

/** Message d'une fonctionnalité (import, suppression...) : reste affiché quelques secondes */
const setStatus = (message) => {
    showStatus(message);
    statusHeldUntil = performance.now() + STATUS_HOLD_MS;
};

/** Message de l'enregistrement automatique : ne remplace pas un message récent */
const setAutosaveStatus = (message) => {
    if (performance.now() >= statusHeldUntil) showStatus(message);
};

initTheme();

const saved = loadLocal();
const store = createStore(saved ? saved.character : createDefaultCharacter());

/**
 * Données enregistrées dans le navigateur EN MÊME TEMPS que la fiche (même onglet, même
 * instant), par exemple le suivi de synchronisation en ligne : clé → fonction qui donne la valeur.
 */
const savedWithCharacter = new Map();

const ctx = {
    root, store, setStatus,
    /** Ajoute une donnée à enregistrer avec la fiche */
    saveWithCharacter: (key, getValue) => savedWithCharacter.set(key, getValue),
    /** Enregistre tout de suite la fiche (et les données associées) */
    saveNow: () => saveNow()
};

createSheet(root, store);
decorateIcons(root); // icônes dorées des titres et des onglets (data-icon)
initTabs(root);
for (const init of [initToolbar, initAccount, initGallery, initWeapons, initArmors, initSpells, initRest, initStyleEditor]) {
    try {
        init(ctx);
    } catch (error) {
        console.error(`Échec de l'initialisation de ${init.name} :`, error);
    }
}
initLock();

// Cases de texte des tableaux : hauteur ajustée au contenu après chaque mise à jour
let fitFrame = 0;
const scheduleFit = () => {
    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(() => fitCellTexts(root));
};
store.subscribe(scheduleFit);
scheduleFit();

// --- Sauvegarde automatique dans le navigateur ---
// Écriture différée pendant la saisie, mais jamais perdue : elle est faite tout de suite
// quand la page est masquée (rechargement, onglet fermé, changement d'application sur iPad,
// où Safari gèle les minuteries). beforeunload est évité : peu fiable sur iOS.
var saveTimer = null; // var : utilisable par ctx.saveNow avant cette ligne

function saveNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (!saveLocal(store.get())) {
        setStatus('⚠️ Enregistrement impossible (stockage du navigateur indisponible)');
        return;
    }
    for (const [key, getValue] of savedWithCharacter) {
        try {
            localStorage.setItem(key, getValue());
        } catch {
            // Stockage plein : on efface l'ancienne valeur plutôt que de la laisser à côté
            // d'une fiche qui ne lui correspond plus
            try { localStorage.removeItem(key); } catch { /* stockage indisponible */ }
        }
    }
    setAutosaveStatus('Enregistré dans ce navigateur');
}

/** Écrit la sauvegarde en attente, s'il y en a une */
function flushSave() {
    if (saveTimer !== null) saveNow();
}

store.subscribe((_state, changedKeys) => {
    // Import ou nouvelle fiche : enregistré immédiatement
    if (changedKeys === null) {
        saveNow();
        return;
    }
    setAutosaveStatus('Modifications en cours…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, AUTOSAVE_DELAY_MS);
});
window.addEventListener('pagehide', flushSave);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSave();
});
