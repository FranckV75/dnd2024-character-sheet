// =============================================================================
// BOOT-NOTICES.JS - Avis affichés au démarrage quand une donnée est en danger
//
//  - Mise en forme indisponible (DOMPurify non chargé, connexion coupée) : bandeau en haut de
//    la fiche ; les textes longs sont en lecture seule (sanitize.js, sheet.js, lock.js).
//  - Sauvegarde du navigateur illisible : fenêtre qui explique qu'une fiche vierge est ouverte
//    et que l'ancien texte est gardé de côté (BACKUP_KEY, persistence.js), avec un bouton pour
//    le télécharger.
// =============================================================================

import { el, icon } from './dom.js';
import { openModal } from './modal.js';

/**
 * Bandeau permanent (non imprimé) en haut de la fiche.
 * @param {HTMLElement} root - la fiche (main.sheet)
 */
export function showRichTextNotice(root) {
    if (!root || root.querySelector('.sheet-notice')) return;
    root.prepend(el('p', { class: 'sheet-notice', role: 'status' },
        icon('warning'),
        el('span', { text: 'Mise en forme indisponible (connexion) : textes longs en lecture seule. Rechargez la page une fois la connexion revenue.' })));
}

/** Nom du fichier de la copie de secours : DD2024_copie_de_secours_<aaaa-mm-jj>.json */
function backupFileName(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `DD2024_copie_de_secours_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

/**
 * @param {{ backupKey: string, text: string }} info - backupKey '' : la copie n'a pas pu être gardée
 */
export function showUnreadableSaveNotice({ backupKey, text }) {
    const download = () => {
        const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
        const link = el('a', { href: url, download: backupFileName() });
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return false; // la fenêtre reste ouverte
    };
    openModal({
        title: '⚠️ Fiche du navigateur illisible',
        body: [
            el('p', { text: 'La fiche enregistrée dans ce navigateur n\'a pas pu être lue. Une fiche vierge est ouverte à la place.' }),
            el('p', {
                text: backupKey
                    ? 'L\'ancien contenu n\'est pas effacé : une copie de secours est gardée dans ce navigateur. Téléchargez-la et envoyez-la à Franck pour la récupérer.'
                    : 'La copie de secours n\'a pas pu être gardée (stockage plein) : téléchargez-la maintenant, avant de modifier la fiche.'
            })
        ],
        actions: [
            { label: 'Fermer' },
            { label: 'Télécharger la copie de secours', icon: 'export', primary: true, onClick: download }
        ]
    });
}
