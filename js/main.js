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

const root = document.querySelector('.sheet');
const status = document.getElementById('save-status');
const setStatus = (message) => { status.textContent = message; };

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
let saveTimer = null;
store.subscribe(() => {
    setStatus('Modifications en cours…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        setStatus(saveLocal(store.get())
            ? 'Enregistré dans ce navigateur'
            : '⚠️ Enregistrement impossible (stockage du navigateur indisponible)');
    }, AUTOSAVE_DELAY_MS);
});
