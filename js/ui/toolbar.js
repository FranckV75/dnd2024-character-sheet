// =============================================================================
// TOOLBAR.JS - Barre « Gestion » de la fiche
//
//  - Repli : sur tablette (≤ 1100 px), la barre démarre repliée sur un seul bouton
//    « Gestion » qui déplie les commandes (affichage et compte compris).
//  - Groupe « Fiche » : verrou (lock.js), puis nouvelle fiche, import, export, impression.
//  - Groupe « Affichage » (#view-controls) : thème et mode cinéma, avant « Fonds » (gallery.js).
//  - Boutons à icônes dessinées (dom.js) plutôt qu'à emojis : même style dans les deux thèmes.
//  - Verrou (lock.js), mode cinéma (masque la fiche pour voir le fond),
//    import (fichier ou texte collé), export (fichier ou presse-papiers),
//    nouvelle fiche, impression / PDF, thème clair / sombre.
//  - « Nouvelle fiche » et « Importer » portent la classe edit-only : masqués
//    quand la fiche est verrouillée.
// =============================================================================

import { el, icon, setIconLabel } from './dom.js';
import { toggleTheme } from './theme.js';
import { isLocked, toggleLocked } from './lock.js';
import { openModal, confirmModal } from './modal.js';
import { createDefaultCharacter } from '../state/schema.js';
import { parseCharacterFile, serializeCharacter, exportFileName, STORAGE_KEYS } from '../state/persistence.js';

/** Largeur en dessous de laquelle la barre démarre repliée (même seuil que sheet.css) */
const COMPACT_QUERY = '(max-width: 1100px)';
const COLLAPSED_CLASS = 'app-bar--collapsed';
const CINEMA_CLASS = 'cinema';

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} ctx
 */
export function initToolbar({ store, setStatus }) {
    const host = document.getElementById('toolbar-feature');
    const bar = document.getElementById('app-bar');
    if (!host || !bar) return;

    // ---------------------------------------------------------------- Boutons
    const toggleButton = el('button', {
        type: 'button', class: 'btn toolbar-toggle', id: 'btn-toolbar-toggle',
        'aria-expanded': 'true', 'aria-controls': 'toolbar-panel view-group account-group',
        on: { click: () => setCollapsed(!bar.classList.contains(COLLAPSED_CLASS)) }
    });
    setIconLabel(toggleButton, 'menu', 'Gestion');

    const lockButton = el('button', {
        type: 'button', class: 'btn btn-state', id: 'btn-lock', 'aria-pressed': 'false',
        on: { click: toggleLocked }
    });

    const cinemaButton = el('button', {
        type: 'button', class: 'btn', id: 'btn-cinema', 'aria-pressed': 'false',
        on: { click: () => setCinema(!document.body.classList.contains(CINEMA_CLASS)) }
    });

    const importButton = el('button', {
        type: 'button', class: 'btn edit-only', id: 'btn-import',
        'aria-haspopup': 'dialog', title: 'Remplacer la fiche par un fichier ou un texte exporté',
        on: { click: () => openImportModal(store, setStatus) }
    });
    setIconLabel(importButton, 'import', 'Importer');

    const exportButton = el('button', {
        type: 'button', class: 'btn', id: 'btn-export',
        'aria-haspopup': 'dialog', title: 'Enregistrer la fiche dans un fichier ou la copier',
        on: { click: () => openExportModal(store, setStatus) }
    });
    setIconLabel(exportButton, 'export', 'Exporter');

    const newButton = el('button', {
        type: 'button', class: 'btn edit-only', id: 'btn-new',
        'aria-haspopup': 'dialog', title: 'Commencer une fiche vierge',
        on: { click: () => newCharacter(store, setStatus) }
    });
    setIconLabel(newButton, 'file-plus', 'Nouvelle fiche');

    const printButton = el('button', {
        type: 'button', class: 'btn', id: 'btn-print',
        title: 'Imprimer la fiche ou l\'enregistrer en PDF',
        on: { click: () => window.print() }
    });
    setIconLabel(printButton, 'printer', 'Imprimer');

    const themeButton = el('button', {
        type: 'button', class: 'btn btn-icon-only', id: 'btn-theme',
        on: { click: toggleTheme }
    });

    // Commandes de la fiche : le verrou (état), puis les actions groupées
    const panel = el('div', { class: 'app-bar-group toolbar-panel', id: 'toolbar-panel', role: 'group', 'aria-label': 'Fiche' },
        lockButton,
        el('div', { class: 'btn-group' }, newButton, importButton, exportButton, printButton));

    host.replaceChildren(
        toggleButton,
        el('span', { class: 'app-bar-title', text: 'Gestion' }),
        panel
    );

    // Affichage : thème et cinéma ouvrent le groupe (gallery.js y ajoute « Fonds »)
    (document.getElementById('view-controls') || panel).append(themeButton, cinemaButton);

    // ---------------------------------------------------------------- Verrou
    const renderLock = () => {
        const locked = isLocked();
        lockButton.setAttribute('aria-pressed', String(locked));
        setIconLabel(lockButton, locked ? 'lock' : 'unlock', locked ? 'Verrouillée' : 'Modifiable');
        lockButton.title = locked
            ? 'Fiche verrouillée : seuls les champs de jeu sont modifiables. Cliquer pour déverrouiller.'
            : 'Cliquer pour verrouiller la fiche (évite les modifications accidentelles en jeu)';
    };
    document.addEventListener('dd:lockchange', renderLock);
    renderLock();

    // ---------------------------------------------------------------- Thème
    const renderTheme = () => {
        const dark = document.documentElement.dataset.theme === 'dark';
        // L'icône annonce le thème vers lequel on bascule (comme la v3)
        themeButton.replaceChildren(icon(dark ? 'sun' : 'moon'));
        const label = dark ? 'Passer au thème clair' : 'Passer au thème sombre';
        themeButton.setAttribute('aria-label', label);
        themeButton.title = label;
    };
    // Observe l'attribut plutôt que le clic : le thème peut changer ailleurs (initTheme...)
    new MutationObserver(renderTheme).observe(document.documentElement, {
        attributes: true, attributeFilter: ['data-theme']
    });
    renderTheme();

    // ---------------------------------------------------------------- Mode cinéma
    // Non mémorisé (comme la v3) : la fiche réapparaît toujours au chargement.
    function setCinema(on) {
        document.body.classList.toggle(CINEMA_CLASS, on);
        cinemaButton.setAttribute('aria-pressed', String(on));
        setIconLabel(cinemaButton, on ? 'close' : 'eye', on ? 'Quitter le mode cinéma' : 'Cinéma');
        cinemaButton.title = on
            ? 'Réafficher la fiche (touche Échap)'
            : 'Mode cinéma : masquer la fiche pour admirer le fond d\'écran';
    }
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !document.body.classList.contains(CINEMA_CLASS)) return;
        if (document.querySelector('dialog[open]')) return; // Échap ferme d'abord la fenêtre ouverte
        setCinema(false);
    });
    setCinema(false);

    // ---------------------------------------------------------------- Repli (tablette)
    function setCollapsed(collapsed) {
        bar.classList.toggle(COLLAPSED_CLASS, collapsed);
        toggleButton.setAttribute('aria-expanded', String(!collapsed));
    }
    const compact = window.matchMedia(COMPACT_QUERY);
    setCollapsed(compact.matches);
    compact.addEventListener('change', (event) => setCollapsed(event.matches));
}

// =============================================================================
// Import : fichier JSON ou texte collé
// =============================================================================

/**
 * @param {Object} store
 * @param {(message: string) => void} setStatus
 */
function openImportModal(store, setStatus) {
    const message = el('p', { class: 'toolbar-modal-msg', role: 'alert' });
    const showError = (text) => {
        message.textContent = `⚠️ ${text}`;
        message.classList.add('is-error');
    };

    let close = () => {};
    const load = (text, sourceLabel) => {
        const { character, report } = parseCharacterFile(text);
        store.replace(character);
        setStatus(report.length
            ? `${sourceLabel} chargée (${report.length} conversion(s) d'ancien format).`
            : `${sourceLabel} chargée.`);
    };

    // (a) Fichier : champ caché visuellement (et non `hidden`, pour les anciens Safari iOS)
    const fileInput = el('input', {
        type: 'file', id: 'file-import', class: 'toolbar-file-input', accept: '.json,application/json',
        tabindex: '-1', 'aria-hidden': 'true',
        on: {
            change: async (event) => {
                const file = event.target.files[0];
                event.target.value = '';
                if (!file) return;
                try {
                    load(await file.text(), `Fiche « ${file.name} »`);
                    close();
                } catch (e) {
                    showError(e.message);
                }
            }
        }
    });
    const chooseButton = el('button', {
        type: 'button', class: 'btn btn-primary', text: '📂 Choisir un fichier .json…',
        on: { click: () => fileInput.click() }
    });

    // (b) Texte collé
    const pasteArea = el('textarea', {
        id: 'import-paste', class: 'toolbar-json', rows: '7', spellcheck: 'false', autocomplete: 'off',
        placeholder: '{ "char_name": "…", … }'
    });

    close = openModal({
        title: '📂 Importer une fiche',
        wide: true,
        body: [
            el('p', { class: 'toolbar-modal-note', text: 'La fiche actuelle sera remplacée. Exportez-la d\'abord si vous voulez la conserver.' }),
            el('section', { class: 'toolbar-option' },
                el('h3', { class: 'toolbar-option-title', text: 'Depuis un fichier' }),
                el('div', { class: 'toolbar-option-row' }, chooseButton, fileInput)),
            el('section', { class: 'toolbar-option' },
                el('h3', { class: 'toolbar-option-title' },
                    el('label', { for: 'import-paste', text: 'Ou en collant le texte d\'une fiche (JSON)' })),
                pasteArea),
            message
        ],
        actions: [
            { label: 'Annuler' },
            {
                label: 'Importer le texte collé',
                onClick: () => {
                    const text = pasteArea.value.trim();
                    if (!text) {
                        showError('Collez d\'abord le texte d\'une fiche dans la zone ci-dessus.');
                        pasteArea.focus();
                        return false;
                    }
                    try {
                        load(text, 'Fiche collée');
                    } catch (e) {
                        showError(e.message);
                        return false;
                    }
                    return true;
                }
            }
        ]
    });
    // openModal place le focus sur le premier champ (le champ fichier caché) : on le
    // remet sur le bouton visible, sans ouvrir le clavier virtuel des tablettes
    chooseButton.focus();
}

// =============================================================================
// Export : téléchargement ou presse-papiers
// =============================================================================

/**
 * @param {Object} store
 * @param {(message: string) => void} setStatus
 */
function openExportModal(store, setStatus) {
    const character = store.get();
    const json = serializeCharacter(character);
    const fileName = exportFileName(character);

    const message = el('p', { class: 'toolbar-modal-msg', role: 'status' });
    const say = (text, isError = false) => {
        message.textContent = text;
        message.classList.toggle('is-error', isError);
    };

    // Zone de secours : affichée seulement si la copie automatique échoue
    const fallbackArea = el('textarea', {
        id: 'export-json', class: 'toolbar-json', rows: '7', readonly: true, spellcheck: 'false',
        'aria-label': 'Texte de la fiche à copier'
    });
    const fallback = el('div', { class: 'toolbar-fallback', hidden: true }, fallbackArea);

    let close = () => {};

    const download = () => {
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        const link = el('a', { href: url, download: fileName });
        document.body.append(link);
        link.click();
        link.remove();
        // Révocation différée : certains navigateurs (Safari) lisent l'URL après le clic
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatus(`Exportée : ${fileName}`);
        close();
    };

    const showFallback = () => {
        fallbackArea.value = json;
        fallback.hidden = false;
        fallbackArea.focus();
        fallbackArea.select();
        fallbackArea.setSelectionRange(0, json.length);
        fallbackArea.scrollTop = 0;
    };

    const copy = async () => {
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(json);
                say('✔ Fiche copiée dans le presse-papiers. Collez-la où vous voulez (mail, notes…).');
                setStatus('Fiche copiée dans le presse-papiers');
                return;
            } catch {
                // Refusé (page non sécurisée, permission) : solution de secours ci-dessous
            }
        }
        showFallback();
        let copied = false;
        try {
            copied = document.execCommand('copy');
        } catch {
            copied = false;
        }
        if (copied) {
            say('✔ Fiche copiée dans le presse-papiers.');
            setStatus('Fiche copiée dans le presse-papiers');
        } else {
            say('La copie automatique est bloquée par le navigateur : le texte est sélectionné ci-dessous, '
                + 'copiez-le (Ctrl+C, ou appui long puis « Copier » sur tablette).', true);
        }
    };

    const downloadButton = el('button', {
        type: 'button', class: 'btn btn-primary', text: '⬇️ Télécharger', on: { click: download }
    });

    close = openModal({
        title: '⬇️ Exporter la fiche',
        wide: true,
        body: [
            el('section', { class: 'toolbar-option' },
                el('h3', { class: 'toolbar-option-title', text: 'Télécharger un fichier' }),
                el('div', { class: 'toolbar-option-row' },
                    downloadButton,
                    el('span', { class: 'toolbar-file-name', text: fileName }))),
            el('section', { class: 'toolbar-option' },
                el('h3', { class: 'toolbar-option-title', text: 'Ou copier le texte de la fiche' }),
                el('p', { class: 'toolbar-modal-note', text: 'Utile sur tablette quand le téléchargement est bloqué : le texte pourra être recollé dans « Importer ».' }),
                el('div', { class: 'toolbar-option-row' },
                    el('button', { type: 'button', class: 'btn', text: '📋 Copier dans le presse-papiers', on: { click: copy } })),
                fallback),
            message
        ],
        actions: [{ label: 'Fermer' }]
    });
    downloadButton.focus();
}

// =============================================================================
// Nouvelle fiche
// =============================================================================

/**
 * @param {Object} store
 * @param {(message: string) => void} setStatus
 */
async function newCharacter(store, setStatus) {
    const ok = await confirmModal({
        title: '📄 Nouvelle fiche',
        message: 'La fiche actuelle sera remplacée par une fiche vierge. Exportez-la d\'abord si vous voulez la conserver.',
        confirmLabel: 'Créer une fiche vierge',
        danger: true
    });
    if (!ok) return;
    store.replace(createDefaultCharacter());
    try {
        localStorage.removeItem(STORAGE_KEYS.activeName);
    } catch {
        // Stockage indisponible : rien à effacer
    }
    setStatus('Nouvelle fiche vierge créée.');
}
