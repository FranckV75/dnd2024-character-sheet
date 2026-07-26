// =============================================================================
// UI-MODALS.JS - SYSTÈME DE MODALES & APIS D'IMPORT/EXPORT (MODULE ES6)
// =============================================================================

import { getFormData, applyFormData, cleanLegacyData, loadData } from './storage.js';
import { fetchCharacters, deleteCharacter } from './supabase-config.js';

let lastActiveElement = null;

export function showModal(contentHtml) {
    const m = document.getElementById('custom-modal');
    const txt = document.getElementById('modal-text');
    const btns = document.getElementById('modal-actions');
    const inp = document.getElementById('modal-input');
    const area = document.getElementById('modal-textarea');

    if (!m || !txt || !btns) return;

    lastActiveElement = document.activeElement;

    txt.innerHTML = ''; btns.innerHTML = '';
    if (inp) inp.style.display = 'none';
    if (area) area.style.display = 'none';

    const closeModal = () => {
        m.style.display = 'none';
        m.setAttribute('aria-hidden', 'true');
        if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
            try { lastActiveElement.focus(); } catch (e) {}
        }
    };

    if (typeof contentHtml === 'string') {
        txt.innerHTML = contentHtml;
        const btnOk = document.createElement('button');
        btnOk.innerText = 'OK';
        btnOk.className = 'btn btn-action';
        btnOk.style.width = 'auto';
        btnOk.onclick = closeModal;
        btns.appendChild(btnOk);
    } else {
        contentHtml(txt, btns, inp, area, closeModal);
    }
    m.style.display = 'flex';
    m.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
        if (inp && inp.style.display !== 'none') {
            inp.focus();
        } else if (area && area.style.display !== 'none') {
            area.focus();
        } else {
            const firstBtn = btns.querySelector('button');
            if (firstBtn) firstBtn.focus();
        }
    }, 50);
}

export function openExportMenu() {
    let nEl = document.querySelector('[data-name="char_name"]');
    let n = nEl ? nEl.innerText.trim().replace(/<[^>]*>/g, "") : "perso";
    if (!n) n = "perso";
    let defName = `DD2024_${n}.json`;

    showModal((txt, btns, inp, area, close) => {
        txt.innerHTML = "<b>Exportation</b><br>Sur tablette, utilisez 'Copier' si le téléchargement est bloqué.";

        const btnFile = document.createElement('button');
        btnFile.className = 'btn btn-save';
        btnFile.innerText = '💾 Télécharger Fichier';
        btnFile.onclick = () => { downloadFile(defName); close(); };

        const btnCopy = document.createElement('button');
        btnCopy.className = 'btn btn-copy';
        btnCopy.innerText = '📋 Copier les Données';
        btnCopy.onclick = () => {
            const data = JSON.stringify(getFormData(), null, 2);
            copyToClipboard(data);
            close();
        };

        const btnCancel = document.createElement('button');
        btnCancel.className = 'btn';
        btnCancel.innerText = 'Annuler';
        btnCancel.onclick = close;

        btns.appendChild(btnFile);
        btns.appendChild(btnCopy);
        btns.appendChild(btnCancel);
    });
}

export function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showModal("Données copiées !"))
            .catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

export function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.left = "0"; ta.style.top = "0";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try {
        document.execCommand('copy');
        showModal("Données copiées !");
    } catch (err) {
        showModal("Erreur de copie.");
    }
    document.body.removeChild(ta);
}

export function downloadFile(fileName) {
    const data = JSON.stringify(getFormData(), null, 2);
    const b = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); window.URL.revokeObjectURL(url);
}

export function openImportMenu() {
    showModal((txt, btns, inp, area, close) => {
        txt.innerHTML = "<b>Importation</b>";
        const btnFile = document.createElement('button');
        btnFile.className = 'btn btn-action';
        btnFile.innerText = '📂 Ouvrir Fichier';
        btnFile.onclick = () => { document.getElementById('file-import').click(); close(); };

        if (area) {
            area.style.display = 'block';
            area.placeholder = 'Collez ici le code JSON...';
        }

        const btnPaste = document.createElement('button');
        btnPaste.className = 'btn btn-save';
        btnPaste.innerText = '📥 Charger Texte Collé';
        btnPaste.onclick = () => {
            try {
                if (!area.value) return;
                applyFormData(cleanLegacyData(JSON.parse(area.value)));
                showModal("Fiche chargée !");
                close();
            } catch (e) { showModal("Code invalide."); }
        };
        const btnCancel = document.createElement('button');
        btnCancel.className = 'btn'; btnCancel.innerText = 'Annuler'; btnCancel.onclick = close;
        btns.appendChild(btnFile); btns.appendChild(btnPaste); btns.appendChild(btnCancel);
    });
}

export async function openCharactersModal() {
    showModal((txt, btns, inp, area, close) => {
        txt.innerHTML = '<b>👥 Mes Personnages</b><br><small style="color:var(--text-muted,#888)">Chargement...</small>';

        const listStyle = `
            display:flex; flex-direction:column; gap:8px; margin-top:12px;
            max-height:300px; overflow-y:auto;
        `;
        const itemStyle = `
            display:flex; justify-content:space-between; align-items:center;
            padding:8px 12px; border-radius:6px;
            background:rgba(139,69,19,0.08); border:1px solid rgba(139,69,19,0.2);
        `;

        const listEl = document.createElement('div');
        listEl.style.cssText = listStyle;
        txt.appendChild(listEl);

        (async () => {
            let chars = [];
            if (typeof fetchCharacters === 'function') {
                chars = await fetchCharacters();
            }

            const small = txt.querySelector('small');
            if (small) small.remove();

            if (!window.currentUser) {
                listEl.innerHTML = '<p style="color:var(--text-muted,#888); font-size:0.8rem; text-align:center; padding:16px 0;">Connectez-vous pour accéder à vos personnages cloud.<br><em>En mode hors-ligne, la fiche actuelle est sauvegardée localement.</em></p>';
            } else if (chars.length === 0) {
                listEl.innerHTML = '<p style="color:var(--text-muted,#888); font-size:0.8rem; text-align:center; padding:16px 0;">Aucun personnage sauvegardé dans le cloud.</p>';
            } else {
                chars.forEach(char => {
                    const date = new Date(char.updated_at).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                    });

                    const row = document.createElement('div');
                    row.style.cssText = itemStyle;

                    const nameSpan = document.createElement('div');
                    const nameStrong = document.createElement('strong');
                    nameStrong.style.cssText = "font-family:'Cinzel',serif; font-size:0.85rem;";
                    nameStrong.textContent = char.name;
                    const dateBr = document.createElement('br');
                    const dateSpan = document.createElement('span');
                    dateSpan.style.cssText = 'font-size:0.68rem; color:var(--text-muted,#888);';
                    dateSpan.textContent = date;
                    nameSpan.appendChild(nameStrong);
                    nameSpan.appendChild(dateBr);
                    nameSpan.appendChild(dateSpan);

                    const actionsDiv = document.createElement('div');
                    actionsDiv.style.cssText = 'display:flex; gap:6px; flex-shrink:0;';

                    const btnLoad = document.createElement('button');
                    btnLoad.className = 'btn btn-save';
                    btnLoad.style.cssText = 'padding:4px 10px; font-size:0.75rem;';
                    btnLoad.innerText = '⚔️ Charger';
                    btnLoad.onclick = async () => {
                        close();
                        await loadData(char.name);
                        showModal('Personnage chargé : ' + char.name);
                    };

                    const btnDel = document.createElement('button');
                    btnDel.className = 'btn btn-bg';
                    btnDel.style.cssText = 'padding:4px 8px; font-size:0.75rem; color:#c0392b;';
                    btnDel.innerText = '🗑️';
                    btnDel.title = `Supprimer ${char.name}`;
                    btnDel.onclick = () => {
                        showModal((txt2, btns2, i2, a2, close2) => {
                            const msg = document.createTextNode('Supprimer définitivement ');
                            const nameB = document.createElement('strong');
                            nameB.textContent = char.name;
                            const msg2 = document.createTextNode(' du cloud ?');
                            txt2.appendChild(msg);
                            txt2.appendChild(nameB);
                            txt2.appendChild(msg2);
                            txt2.appendChild(document.createElement('br'));
                            const warn = document.createElement('small');
                            warn.style.color = '#c0392b';
                            warn.textContent = 'Cette action est irréversible.';
                            txt2.appendChild(warn);
                            const confirmBtn = document.createElement('button');
                            confirmBtn.className = 'btn btn-bg';
                            confirmBtn.style.color = '#c0392b';
                            confirmBtn.innerText = '🗑️ Confirmer la suppression';
                            confirmBtn.onclick = async () => {
                                await deleteCharacter(char.name);
                                close2();
                                openCharactersModal();
                            };
                            const cancelBtn = document.createElement('button');
                            cancelBtn.className = 'btn'; cancelBtn.innerText = 'Annuler'; cancelBtn.onclick = close2;
                            btns2.appendChild(confirmBtn); btns2.appendChild(cancelBtn);
                        });
                    };

                    actionsDiv.appendChild(btnLoad);
                    actionsDiv.appendChild(btnDel);
                    row.appendChild(nameSpan);
                    row.appendChild(actionsDiv);
                    listEl.appendChild(row);
                });
            }
        })();

        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn';
        closeBtn.innerText = 'Fermer';
        closeBtn.onclick = close;
        btns.appendChild(closeBtn);
    });
}

window.showModal = showModal;
window.openExportMenu = openExportMenu;
window.copyToClipboard = copyToClipboard;
window.fallbackCopy = fallbackCopy;
window.downloadFile = downloadFile;
window.openImportMenu = openImportMenu;
window.openCharactersModal = openCharactersModal;
