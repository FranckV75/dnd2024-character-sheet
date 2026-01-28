/**
 * UI-MODALS.JS
 * Système de modales, import et export de données
 * Extrait de script.js lors du refactoring Option B
 */

// =============================================================================
// SYSTÈME DE MODALES
// =============================================================================

/**
 * Affiche une modale personnalisée
 * @param {string|Function} contentHtml - Contenu HTML ou fonction de configuration
 */
function showModal(contentHtml) {
    const m = document.getElementById('custom-modal');
    const txt = document.getElementById('modal-text');
    const btns = document.getElementById('modal-actions');
    const inp = document.getElementById('modal-input');
    const area = document.getElementById('modal-textarea');

    if (!m || !txt || !btns) return;

    txt.innerHTML = ''; btns.innerHTML = '';
    if (inp) inp.style.display = 'none';
    if (area) area.style.display = 'none';

    if (typeof contentHtml === 'string') {
        txt.innerHTML = contentHtml;
        const btnOk = document.createElement('button');
        btnOk.innerText = 'OK';
        btnOk.className = 'btn btn-action';
        btnOk.style.width = 'auto';
        btnOk.onclick = () => { m.style.display = 'none'; };
        btns.appendChild(btnOk);
    } else {
        contentHtml(txt, btns, inp, area, () => m.style.display = 'none');
    }
    m.style.display = 'flex';
}

// =============================================================================
// SYSTÈME D'EXPORT
// =============================================================================

/**
 * Ouvre le menu d'export avec options de téléchargement ou copie
 */
function openExportMenu() {
    let nEl = document.querySelector('[data-name="char_name"]');
    let n = nEl ? nEl.innerText.trim().replace(/<[^>]*>/g, "") : "perso";
    if (!n) n = "perso";
    let defName = `DD2024_${n}.json`;

    showModal((txt, btns, inp, area, close) => {
        txt.innerHTML = "<b>Sauvegarde & Export</b><br>Sur tablette, utilisez 'Copier' si le téléchargement est bloqué.";

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

/**
 * Copie du texte dans le presse-papiers (API moderne avec fallback)
 * @param {string} text - Texte à copier
 */
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showModal("Données copiées !"))
            .catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

/**
 * Fallback pour la copie dans le presse-papiers (anciens navigateurs)
 * @param {string} text - Texte à copier
 */
function fallbackCopy(text) {
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

/**
 * Télécharge les données du formulaire en fichier JSON
 * @param {string} fileName - Nom du fichier à télécharger
 */
function downloadFile(fileName) {
    const data = JSON.stringify(getFormData(), null, 2);
    const b = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); window.URL.revokeObjectURL(url);
}

// =============================================================================
// SYSTÈME D'IMPORT
// =============================================================================

/**
 * Ouvre le menu d'import avec options fichier ou texte collé
 */
function openImportMenu() {
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
                applyFormData(JSON.parse(area.value));
                alert("Fiche chargée !");
                close();
            } catch (e) { alert("Code invalide."); }
        };
        const btnCancel = document.createElement('button');
        btnCancel.className = 'btn'; btnCancel.innerText = 'Annuler'; btnCancel.onclick = close;
        btns.appendChild(btnFile); btns.appendChild(btnPaste); btns.appendChild(btnCancel);
    });
}
