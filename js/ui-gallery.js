// =============================================================================
// UI-GALLERY.JS - GESTION DE LA GALERIE DE FONDS D'ÉCRAN
// =============================================================================

/**
 * Ouvre la modal de la galerie
 */
function openGallery() {
    document.getElementById('gallery-modal').style.display = 'flex';
    renderGallery();
}

/**
 * Récupère les fonds sauvegardés par l'utilisateur
 * @returns {Array} Liste des URLs des fonds utilisateur
 */
function getSavedBackgrounds() {
    let saved = localStorage.getItem('dd2024_saved_bgs');
    return saved ? JSON.parse(saved) : [];
}

/**
 * Génère le contenu de la galerie
 */
function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';

    // Combine defaults and user saved
    const userBgs = getSavedBackgrounds();
    const allBgs = ["none", ...DEFAULT_BGS, ...userBgs];

    let currentBg = document.body.style.backgroundImage || "";
    currentBg = currentBg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');

    allBgs.forEach((url, idx) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        if (url === "none") {
            item.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:0.7rem;color:#666;background:#eee;">SANS FOND</div>';
            item.onclick = () => selectBackground("");
            if (currentBg === "" || currentBg === "none") item.classList.add('active');
            grid.appendChild(item);
            return;
        }

        if (currentBg === url) item.classList.add('active');
        item.onclick = () => selectBackground(url);

        const img = document.createElement('img');
        img.src = url;
        img.onerror = function () {
            console.error("Erreur de chargement pour : " + this.src);
            this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PHRleHQgeD0iNTA1IiB5PSI1MCUiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4/PC90ZXh0Pjwvc3ZnPg==';
        };
        item.appendChild(img);

        // Delete button (only for user bgs)
        if (idx > DEFAULT_BGS.length) {
            const btn = document.createElement('button');
            btn.className = 'gallery-del';
            btn.innerHTML = 'x';
            btn.title = "Supprimer";
            btn.onclick = (e) => {
                e.stopPropagation();
                removeBackground(idx - (DEFAULT_BGS.length + 1));
            };
            item.appendChild(btn);
        }

        grid.appendChild(item);
    });
}

/**
 * Sélectionne un fond d'écran
 * @param {string} url - URL du fond
 */
function selectBackground(url) {
    document.body.style.backgroundImage = `url('${url}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    localStorage.setItem('dd2024_bg', url);
    renderGallery();
}

/**
 * Ajoute un nouveau fond depuis une URL
 */
function addNewBackground() {
    const input = document.getElementById('new-bg-url');
    const url = input.value.trim();
    if (!url) return;

    let saved = getSavedBackgrounds();
    saved.push(url);
    localStorage.setItem('dd2024_saved_bgs', JSON.stringify(saved));

    input.value = '';
    renderGallery();
}

/**
 * Supprime un fond utilisateur
 * @param {number} userIndex - Index dans la liste des fonds utilisateur
 */
function removeBackground(userIndex) {
    let saved = getSavedBackgrounds();
    saved.splice(userIndex, 1);
    localStorage.setItem('dd2024_saved_bgs', JSON.stringify(saved));
    renderGallery();
}
