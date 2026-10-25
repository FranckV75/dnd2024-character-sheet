// =============================================================================
// TOOLBAR.JS - Barre « Gestion » (import / export, thème...)
// Version de base : sera complétée à l'étape 4 (verrou, cinéma, nouvelle fiche,
// impression, import par texte collé...).
// =============================================================================

import { el } from './dom.js';
import { toggleTheme } from './theme.js';
import { parseCharacterFile, serializeCharacter, exportFileName } from '../state/persistence.js';

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} ctx
 */
export function initToolbar({ store, setStatus }) {
    const host = document.getElementById('toolbar-feature');

    const fileInput = el('input', {
        type: 'file', id: 'file-import', accept: '.json,application/json', hidden: true,
        on: {
            change: async (event) => {
                const file = event.target.files[0];
                event.target.value = '';
                if (!file) return;
                try {
                    const { character, report } = parseCharacterFile(await file.text());
                    store.replace(character);
                    setStatus(report.length
                        ? `Fiche « ${file.name} » chargée (${report.length} conversion(s) d'ancien format).`
                        : `Fiche « ${file.name} » chargée.`);
                } catch (e) {
                    setStatus(`⚠️ ${e.message}`);
                }
            }
        }
    });

    const exportButton = el('button', {
        type: 'button', class: 'btn', id: 'btn-export', text: '⬇️ Exporter',
        on: {
            click: () => {
                const character = store.get();
                const url = URL.createObjectURL(new Blob([serializeCharacter(character)], { type: 'application/json' }));
                const link = el('a', { href: url, download: exportFileName(character) });
                document.body.append(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
                setStatus(`Exportée : ${link.download}`);
            }
        }
    });

    host.replaceChildren(
        el('span', { class: 'app-bar-title', text: 'Gestion' }),
        el('label', { class: 'btn', for: 'file-import', text: '📂 Importer' }),
        fileInput,
        exportButton,
        el('button', {
            type: 'button', class: 'btn', id: 'btn-theme', 'aria-label': 'Basculer le thème clair / sombre',
            text: '🌗', on: { click: toggleTheme }
        })
    );
}
