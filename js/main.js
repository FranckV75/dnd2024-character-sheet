// =============================================================================
// MAIN.JS - Point d'entrée de l'application (v4)
// =============================================================================

import { initTheme, toggleTheme } from './ui/theme.js';
import { initTabs } from './ui/tabs.js';
import { createSheet } from './ui/sheet.js';
import { createStore } from './state/store.js';
import { createDefaultCharacter } from './state/schema.js';
import {
    loadLocal, saveLocal, parseCharacterFile, serializeCharacter, exportFileName
} from './state/persistence.js';

const AUTOSAVE_DELAY_MS = 600;

const sheetRoot = document.querySelector('.sheet');
const status = document.getElementById('save-status');

initTheme();

const saved = loadLocal();
const store = createStore(saved ? saved.character : createDefaultCharacter());
createSheet(sheetRoot, store);
initTabs(sheetRoot);

// --- Sauvegarde automatique dans le navigateur ---
let saveTimer = null;
store.subscribe(() => {
    status.textContent = 'Modifications en cours…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        status.textContent = saveLocal(store.get())
            ? 'Enregistré dans ce navigateur'
            : '⚠️ Enregistrement impossible (stockage du navigateur indisponible)';
    }, AUTOSAVE_DELAY_MS);
});

// --- Importer une fiche (fichier JSON) ---
document.getElementById('file-import').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
        const { character, report } = parseCharacterFile(await file.text());
        store.replace(character);
        status.textContent = report.length
            ? `Fiche « ${file.name} » chargée (${report.length} conversion(s) d'ancien format).`
            : `Fiche « ${file.name} » chargée.`;
    } catch (e) {
        status.textContent = `⚠️ ${e.message}`;
    }
});

// --- Exporter la fiche (fichier JSON) ---
document.getElementById('btn-export').addEventListener('click', () => {
    const character = store.get();
    const url = URL.createObjectURL(new Blob([serializeCharacter(character)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFileName(character);
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status.textContent = `Exportée : ${link.download}`;
});

document.getElementById('btn-theme').addEventListener('click', toggleTheme);
