// =============================================================================
// MAIN.JS - Point d'entrée de l'application (v4)
// Crée le store, construit la fiche puis branche chaque fonctionnalité.
// Chaque module reçoit le même contexte : { root, store, setStatus }.
// =============================================================================

import { initTheme } from './ui/theme.js';
import { initTabs } from './ui/tabs.js';
import { createSheet } from './ui/sheet.js';
import { initLock } from './ui/lock.js';
import { initToolbar } from './ui/toolbar.js';
import { initGallery } from './ui/gallery.js';
import { initWeapons } from './ui/weapons.js';
import { initArmors } from './ui/armors.js';
import { initSpells } from './ui/spells.js';
import { initRest } from './ui/rest.js';
import { initStyleEditor } from './ui/style-editor.js';
import { createStore } from './state/store.js';
import { createDefaultCharacter } from './state/schema.js';
import { loadLocal, saveLocal } from './state/persistence.js';

const AUTOSAVE_DELAY_MS = 600;

const STATUS_HOLD_MS = 4000;

const root = document.querySelector('.sheet');
const status = document.getElementById('save-status');
let statusHeldUntil = 0;

/** Message d'une fonctionnalité (import, suppression...) : reste affiché quelques secondes */
const setStatus = (message) => {
    status.textContent = message;
    statusHeldUntil = performance.now() + STATUS_HOLD_MS;
};

/** Message de l'enregistrement automatique : ne remplace pas un message récent */
const setAutosaveStatus = (message) => {
    if (performance.now() >= statusHeldUntil) status.textContent = message;
};

initTheme();

const saved = loadLocal();
const store = createStore(saved ? saved.character : createDefaultCharacter());
const ctx = { root, store, setStatus };

createSheet(root, store);
initTabs(root);
for (const init of [initToolbar, initGallery, initWeapons, initArmors, initSpells, initRest, initStyleEditor]) {
    try {
        init(ctx);
    } catch (error) {
        console.error(`Échec de l'initialisation de ${init.name} :`, error);
    }
}
initLock();

// --- Sauvegarde automatique dans le navigateur ---
// Écriture différée pendant la saisie, mais jamais perdue : elle est faite tout de suite
// quand la page est masquée (rechargement, onglet fermé, changement d'application sur iPad,
// où Safari gèle les minuteries). beforeunload est évité : peu fiable sur iOS.
let saveTimer = null;

function saveNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (saveLocal(store.get())) setAutosaveStatus('Enregistré dans ce navigateur');
    else setStatus('⚠️ Enregistrement impossible (stockage du navigateur indisponible)');
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
