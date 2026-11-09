// =============================================================================
// MAIN.JS - Point d'entrée de l'application (v4)
// Crée le store, construit la fiche puis branche chaque fonctionnalité.
// Chaque module reçoit le même contexte : { root, store, setStatus, saveWithCharacter, saveNow }.
// Enregistre la fiche dans le navigateur et reprend celle qu'un autre onglet y a enregistrée.
// =============================================================================

import { initTheme } from './ui/theme.js';
import { initAnimations } from './ui/motion-pref.js';
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
import { initSubclassFeatures } from './ui/subclass.js';
import { initStyleEditor } from './ui/style-editor.js';
import { initMotion } from './ui/motion.js';
import { initFeedback } from './ui/feedback.js';
import { initAccount } from './ui/account.js';
import { fitCellTexts } from './ui/cell-text.js';
import { createStore } from './state/store.js';
import { createDefaultCharacter } from './state/schema.js';
import { loadLocal, saveLocal, STORAGE_KEYS } from './state/persistence.js';
import { createLocalSave } from './state/local-save.js';
import { richTextAvailable } from './ui/sanitize.js';
import { showRichTextNotice, showUnreadableSaveNotice } from './ui/boot-notices.js';

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
initAnimations();

// Texte enregistré tel quel (avant lecture) : sert à repérer les écritures d'un autre onglet
const bootText = readStored(STORAGE_KEYS.character);
const saved = loadLocal();
const store = createStore(saved ? saved.character : createDefaultCharacter());

function readStored(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

// --- Sauvegarde automatique dans le navigateur, plusieurs onglets (js/state/local-save.js) ---
// Écriture différée pendant la saisie, mais jamais perdue : elle est faite tout de suite
// quand la page est masquée (rechargement, onglet fermé, changement d'application sur iPad,
// où Safari gèle les minuteries). beforeunload est évité : peu fiable sur iOS.
const localSave = createLocalSave({
    store,
    // Accès différé : lire « localStorage » peut échouer (stockage bloqué), local-save.js le prévoit
    storage: {
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
        removeItem: (key) => localStorage.removeItem(key)
    },
    writeSheet: (character) => saveLocal(character),
    knownText: bootText,
    delay: AUTOSAVE_DELAY_MS,
    status: {
        saved: () => setAutosaveStatus('Enregistré dans ce navigateur'),
        changing: () => setAutosaveStatus('Modifications en cours…'),
        failed: () => setStatus('⚠️ Enregistrement impossible (stockage du navigateur indisponible)'),
        message: setStatus
    }
});

const ctx = {
    root, store, setStatus,
    /** Ajoute une donnée à enregistrer avec la fiche (voir local-save.js) */
    saveWithCharacter: (key, getValue, onStoredChange) => localSave.saveWithCharacter(key, getValue, onStoredChange),
    /** Enregistre tout de suite la fiche (et les données associées) */
    saveNow: () => localSave.saveNow()
};

// Écouteurs posés AVANT ceux des fonctionnalités : au retour sur l'onglet, la fiche des autres
// onglets est reprise avant la vérification en ligne (account.js)
const checkOtherTabs = () => localSave.checkOtherTabs();
window.addEventListener('storage', (event) => {
    if (localSave.watches(event.key)) checkOtherTabs();
});
window.addEventListener('pageshow', checkOtherTabs);
window.addEventListener('focus', checkOtherTabs);
window.addEventListener('pagehide', () => localSave.flush());
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') localSave.flush();
    else checkOtherTabs();
});

// --- Construction de la fiche ---
// Une étape en échec (fiche piégée, donnée inattendue) n'empêche ni la barre Gestion (import,
// export, compte) ni l'enregistrement automatique de démarrer.
for (const [label, step] of [
    ['la construction de la fiche', () => createSheet(root, store)],
    ['les icônes', () => decorateIcons(root)], // icônes dorées des titres et des onglets (data-icon)
    ['les onglets', () => initTabs(root)]
]) {
    try {
        step();
    } catch (error) {
        console.error(`Échec de ${label} :`, error);
    }
}
for (const init of [initToolbar, initAccount, initGallery, initWeapons, initArmors, initSpells, initRest, initSubclassFeatures, initStyleEditor, initMotion, initFeedback]) {
    try {
        init(ctx);
    } catch (error) {
        console.error(`Échec de l'initialisation de ${init.name} :`, error);
    }
}
try {
    initLock();
} catch (error) {
    console.error('Échec de l\'initialisation du verrou :', error);
}

// Cases de texte des tableaux : hauteur ajustée au contenu après chaque mise à jour
let fitFrame = 0;
const scheduleFit = () => {
    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(() => fitCellTexts(root));
};
store.subscribe(scheduleFit);
scheduleFit();

// Enregistrement automatique branché en dernier : un import est enregistré une fois que chaque
// fonctionnalité a réagi (base en ligne remise à zéro…)
localSave.start();

// --- Avis du démarrage ---
// Mise en forme indisponible (DOMPurify non chargé) : textes longs en lecture seule
if (!richTextAvailable()) showRichTextNotice(root);
// Sauvegarde du navigateur illisible : une copie de secours est gardée avant tout enregistrement
if (saved?.backupKey !== undefined) showUnreadableSaveNotice({ backupKey: saved.backupKey, text: bootText ?? '' });
