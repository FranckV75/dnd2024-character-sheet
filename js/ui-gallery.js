// =============================================================================
// UI-GALLERY.JS - GESTION DE LA GALERIE DE FONDS D'ÉCRAN (MODULE ES6)
// =============================================================================

import { DEFAULT_BGS } from './data.js';

export function openGallery() {
    const modal = document.getElementById('gallery-modal');
    if (modal) modal.style.display = 'flex';
    renderGallery();
}

export function getSavedBackgrounds() {
    let saved = localStorage.getItem('dd2024_saved_bgs');
    if (!saved) return [];
    try {
        return JSON.parse(saved);
    } catch (e) {
        console.warn('⚠️ Données galerie corrompues.', e.message);
        return [];
    }
}

export function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const defaultList = window.DEFAULT_BGS || DEFAULT_BGS || [];
    const userBgs = getSavedBackgrounds();
    const allBgs = ["none", ...defaultList, ...userBgs];

    let currentBg = document.body.style.backgroundImage || "";
    currentBg = currentBg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');

    allBgs.forEach((url, idx) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        if (url === "none") {
            item.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:80px;font-size:0.7rem;color:#666;background:#eee;">SANS FOND</div>';
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

        let name = url;
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        name = filename.replace(/\.(webp|png|jpg|jpeg)$/i, '')
            .replace(/^Fond[ _-]?/, '')
            .replace(/_/g, ' ')
            .replace(/%20/g, ' ');

        const label = document.createElement('div');
        label.className = 'gallery-label';
        label.textContent = name;
        label.style.textAlign = 'center';
        label.style.fontSize = '0.75rem';
        label.style.marginTop = '4px';
        label.style.whiteSpace = 'nowrap';
        label.style.overflow = 'hidden';
        label.style.textOverflow = 'ellipsis';
        label.title = name;
        item.appendChild(label);

        if (idx > defaultList.length) {
            const btn = document.createElement('button');
            btn.className = 'gallery-del';
            btn.innerHTML = 'x';
            btn.title = "Supprimer";
            btn.onclick = (e) => {
                e.stopPropagation();
                removeBackground(idx - (defaultList.length + 1));
            };
            item.appendChild(btn);
        }

        grid.appendChild(item);
    });
}

export function selectBackground(url) {
    document.body.style.backgroundImage = `url('${url}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    localStorage.setItem('dd2024_bg', url);
    renderGallery();
}

export function addNewBackground() {
    const input = document.getElementById('new-bg-url');
    if (!input) return;
    const url = input.value.trim();
    if (!url) return;

    let saved = getSavedBackgrounds();
    saved.push(url);
    localStorage.setItem('dd2024_saved_bgs', JSON.stringify(saved));

    input.value = '';
    renderGallery();
}

export function removeBackground(userIndex) {
    let saved = getSavedBackgrounds();
    saved.splice(userIndex, 1);
    localStorage.setItem('dd2024_saved_bgs', JSON.stringify(saved));
    renderGallery();
}

window.openGallery = openGallery;
window.getSavedBackgrounds = getSavedBackgrounds;
window.renderGallery = renderGallery;
window.selectBackground = selectBackground;
window.addNewBackground = addNewBackground;
window.removeBackground = removeBackground;
