// =============================================================================
// GALLERY.JS - Fonds d'écran, cadrage et opacité de la fiche
//
// Réglages d'apparence propres à l'appareil (utilisables en mode verrouillé) :
//  - galerie de fonds (images fournies, adresses ajoutées, image de l'appareil, aucun fond) ;
//  - position verticale et zoom du fond, opacité de la fiche.
//
// Mémorisation (mêmes clés et formats que la v3) :
//  - localStorage 'dd2024_bg'        : fond affiché ('' = aucun, 'Fond_X.webp', https://…, data:image/…)
//  - localStorage 'dd2024_saved_bgs' : JSON, tableau des adresses ajoutées par l'utilisateur
//  - localStorage 'dd2024_opacity' / 'dd2024_bg_zoom' / 'dd2024_bg_pos_y' : nombres sous forme de texte
//  - localStorage 'dd2024_gallery_bg' : lu par la v3 pour remplir _visual_prefs.galleryBg
//  - champ du personnage _visual_prefs { opacity, theme, galleryBg, bgZoom, bgPosY } (textes, comme la v3)
//
// Affichage : variables CSS sur <html> (--app-bg-image, --app-bg-size, --app-bg-pos-y,
// --sheet-alpha) et attributs data-app-bg / data-translucent, utilisés par css/gallery.css (calque fixe derrière la page, compatible iPad).
// Validation des valeurs et conversions _visual_prefs : fonctions pures de js/rules/gallery.js.
// Image de l'appareil : réduite (≤ 1920 px, JPEG) avant d'être mémorisée, pour laisser de la place
// à la sauvegarde automatique du personnage ; au-delà de 1,5 M caractères elle n'est pas mémorisée.
// Une très grande image enregistrée par la v3 (non réduite) est affichée par une adresse blob:
// (une variable CSS de plus de 2 Mio serait ignorée par Chrome / Edge) ; dd2024_bg reste intact.
// =============================================================================

import { el, icon, setIconLabel } from './dom.js';
import { openModal, confirmModal } from './modal.js';
import { setTheme } from './theme.js';
import { DEFAULT_BGS } from '../data/constants.js';
import {
    GALLERY_LIMITS as LIMITS,
    DEVICE_IMAGE_MAX_CHARS,
    clampNumber,
    isDataImage,
    needsObjectUrl,
    dataImageBytes,
    resolveBackground as resolveRaw,
    displayName,
    parseSavedBackgrounds,
    backgroundSize,
    fitWithin,
    portableBackground,
    toVisualPrefs,
    fromVisualPrefs
} from '../rules/gallery.js';

const KEYS = {
    bg: 'dd2024_bg',
    galleryBg: 'dd2024_gallery_bg',
    saved: 'dd2024_saved_bgs',
    opacity: 'dd2024_opacity',
    zoom: 'dd2024_bg_zoom',
    posY: 'dd2024_bg_pos_y'
};

/** Dossier des images fournies avec l'application */
const ASSET_BASE = new URL('../../assets/backgrounds/', import.meta.url);

/** Image de l'appareil assez petite pour être gardée telle quelle (sans réduction) */
const SMALL_FILE_BYTES = 512 * 1024;
const JPEG_QUALITY = 0.82;

/** Réglages courants de l'appareil */
const prefs = { bg: '', zoom: 100, posY: 50, opacity: 1 };

/** Fond actuellement écrit dans localStorage (évite de réécrire une grosse image à chaque réglage) */
let storedBg = null;
/** Fond affiché mais volontairement non mémorisé (image trop lourde) */
let sessionOnlyBg = null;

const resolveBackground = (value) => resolveRaw(value, { assetBase: ASSET_BASE, defaults: DEFAULT_BGS });
const isValidBackground = (value) => resolveBackground(value) !== null;

// ---------------------------------------------------------------------------
// Stockage du navigateur (toujours protégé : navigation privée, quota dépassé)
// ---------------------------------------------------------------------------

function readKey(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

/** @returns {boolean} false si l'écriture a échoué (quota, stockage indisponible) */
function writeKey(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

function removeKey(key) {
    try {
        localStorage.removeItem(key);
    } catch {
        // Stockage indisponible
    }
}

const getSavedBackgrounds = () => parseSavedBackgrounds(readKey(KEYS.saved));

function setSavedBackgrounds(list) {
    return writeKey(KEYS.saved, JSON.stringify(list));
}

// ---------------------------------------------------------------------------
// Application à la page
// ---------------------------------------------------------------------------

/** Adresse blob: de l'image affichée quand elle est trop longue pour une variable CSS */
let objectUrl = { source: '', href: '' };

function releaseObjectUrl() {
    if (objectUrl.href) URL.revokeObjectURL(objectUrl.href);
    objectUrl = { source: '', href: '' };
}

/**
 * Adresse à placer dans --app-bg-image. Une grande image de l'appareil (enregistrée par la v3,
 * qui ne la réduisait pas) dépasserait la longueur qu'accepte une variable CSS : elle est alors
 * affichée par une adresse blob: équivalente. La valeur mémorisée (dd2024_bg) n'est pas modifiée.
 * @param {string|null} url
 * @returns {string|null}
 */
function displayUrl(url) {
    if (!needsObjectUrl(url)) {
        releaseObjectUrl();
        return url;
    }
    if (objectUrl.source === url) return objectUrl.href;
    const decoded = dataImageBytes(url);
    releaseObjectUrl();
    if (!decoded) return null;
    objectUrl = { source: url, href: URL.createObjectURL(new Blob([decoded.bytes], { type: decoded.type })) };
    return objectUrl.href;
}

function applyBackground() {
    const root = document.documentElement;
    const url = displayUrl(resolveBackground(prefs.bg));
    if (url) {
        root.style.setProperty('--app-bg-image', `url("${url}")`);
        root.dataset.appBg = 'on';
    } else {
        root.style.removeProperty('--app-bg-image');
        delete root.dataset.appBg;
    }
}

function applyZoom() {
    // Même rendu que la v3 : 100 % = l'image couvre tout l'écran
    document.documentElement.style.setProperty('--app-bg-size', backgroundSize(prefs.zoom));
}

function applyPosY() {
    document.documentElement.style.setProperty('--app-bg-pos-y', `${prefs.posY}%`);
}

function applyOpacity() {
    const root = document.documentElement;
    root.style.setProperty('--sheet-alpha', String(prefs.opacity));
    if (prefs.opacity < 1) root.dataset.translucent = 'true';
    else delete root.dataset.translucent;
}

function applyAll() {
    applyBackground();
    applyZoom();
    applyPosY();
    applyOpacity();
}

// ---------------------------------------------------------------------------
// Mémorisation (appareil + personnage)
// ---------------------------------------------------------------------------

/**
 * Écrit les réglages dans le navigateur. Le fond n'est réécrit que s'il a changé :
 * une image de l'appareil pèse plusieurs centaines de Ko.
 * @returns {boolean} false si le fond affiché n'est pas mémorisé (image trop lourde)
 */
function persistLocal() {
    let bgOk = true;
    if (prefs.bg !== storedBg) {
        if (prefs.bg === sessionOnlyBg) {
            bgOk = false;
        } else if (writeKey(KEYS.bg, prefs.bg)) {
            storedBg = prefs.bg;
        } else {
            // Quota dépassé : ne pas retenter à chaque réglage
            sessionOnlyBg = prefs.bg;
            bgOk = false;
        }
    }
    const portable = portableBackground(prefs.bg);
    if (portable) writeKey(KEYS.galleryBg, portable);
    else removeKey(KEYS.galleryBg);
    writeKey(KEYS.opacity, String(prefs.opacity));
    writeKey(KEYS.zoom, String(prefs.zoom));
    writeKey(KEYS.posY, String(prefs.posY));
    return bgOk;
}

function currentTheme() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function mirrorToCharacter(store) {
    store.update({ _visual_prefs: toVisualPrefs(prefs, currentTheme(), store.get()._visual_prefs) });
}

/**
 * Réglages au démarrage : le navigateur d'abord, puis le personnage, puis les valeurs par défaut.
 * @param {Object} character
 */
function loadInitialPrefs(character) {
    const raw = character?._visual_prefs;
    const vp = raw && typeof raw === 'object' ? raw : {};
    const pick = (key, vpValue) => {
        const stored = readKey(key);
        return stored !== null ? stored : vpValue;
    };

    storedBg = readKey(KEYS.bg);
    if (storedBg !== null) prefs.bg = storedBg;
    else prefs.bg = readKey(KEYS.galleryBg) || (typeof vp.galleryBg === 'string' ? vp.galleryBg : '');
    if (!isValidBackground(prefs.bg)) prefs.bg = '';

    prefs.zoom = clampNumber(pick(KEYS.zoom, vp.bgZoom), LIMITS.zoom);
    prefs.posY = clampNumber(pick(KEYS.posY, vp.bgPosY), LIMITS.posY);
    prefs.opacity = clampNumber(pick(KEYS.opacity, vp.opacity), LIMITS.opacity);
}

/**
 * Personnage remplacé (import, chargement) : ses préférences visuelles s'appliquent (comme la v3).
 * @param {unknown} vp
 * @returns {boolean} true si des préférences ont été appliquées
 */
function applyCharacterPrefs(vp) {
    const next = fromVisualPrefs(vp, isValidBackground);
    if (!next) return false;
    const { theme, ...values } = next;
    Object.assign(prefs, values);
    if (theme && theme !== currentTheme()) setTheme(theme);
    applyAll();
    persistLocal();
    return true;
}

// ---------------------------------------------------------------------------
// Image de l'appareil : réduite avant d'être mémorisée
// ---------------------------------------------------------------------------

function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result));
        reader.addEventListener('error', () => reject(reader.error));
        reader.readAsDataURL(file);
    });
}

/**
 * Image choisie sur l'appareil → adresse data:image. Les grandes images sont réduites
 * (côté le plus long ≤ 1920 px, JPEG) pour laisser de la place à la sauvegarde du personnage.
 * @param {File} file
 * @returns {Promise<string|null>} null si l'image est illisible par le navigateur
 */
async function deviceImageToDataURL(file) {
    const objectUrl = URL.createObjectURL(file);
    try {
        const img = new Image();
        img.src = objectUrl;
        await img.decode();
        const { width, height, scaled } = fitWithin(img.naturalWidth, img.naturalHeight);
        if (!width) return null;
        // Petite image : gardée telle quelle (transparence et animation conservées)
        if (!scaled && file.size <= SMALL_FILE_BYTES) {
            const original = await readAsDataURL(file);
            return isDataImage(original) ? original : null;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) return null;
        // JPEG n'a pas de transparence : fond blanc plutôt que noir sous les zones transparentes
        context.fillStyle = '#fff';
        context.fillRect(0, 0, width, height);
        context.drawImage(img, 0, 0, width, height);
        const result = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        return isDataImage(result) ? result : null;
    } catch {
        return null;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

const megabytes = (chars) => (chars / 1024 / 1024).toFixed(1).replace('.', ',');

// ---------------------------------------------------------------------------
// Commandes compactes de la barre de gestion
// ---------------------------------------------------------------------------

function buildSlider({ id, short, aria, limits, value, format, onInput, onChange }) {
    const input = el('input', {
        type: 'range',
        id,
        class: 'appearance-range',
        min: String(limits.min),
        max: String(limits.max),
        step: String(limits.step),
        value: String(value),
        'aria-label': aria
    });
    const refresh = () => {
        const text = format(Number.parseFloat(input.value));
        input.setAttribute('aria-valuetext', text);
        input.title = `${aria} : ${text}`;
        // Partie remplie de la glissière (css/gallery.css)
        const share = (Number.parseFloat(input.value) - limits.min) / (limits.max - limits.min);
        input.style.setProperty('--fill', `${Math.round(share * 100)}%`);
    };
    refresh();
    input.addEventListener('input', () => {
        onInput(Number.parseFloat(input.value));
        refresh();
    });
    input.addEventListener('change', () => {
        onChange();
        refresh();
    });
    const control = el('div', { class: 'appearance-slider' },
        el('label', { for: id, class: 'appearance-slider-label', text: short }),
        input);
    return { control, input, refresh };
}

const percent = (n) => `${Math.round(n)} %`;
const percentOpacity = (n) => `${Math.round(n * 100)} %`;

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} ctx
 */
export function initGallery(ctx) {
    const { store, setStatus } = ctx;
    const container = document.getElementById('appearance-controls');

    loadInitialPrefs(store.get());
    applyAll();

    if (!container) return;

    const commit = () => {
        const stored = persistLocal();
        mirrorToCharacter(store);
        return stored;
    };

    const posY = buildSlider({
        id: 'bg-pos-y', short: 'Position', aria: 'Position verticale du fond', limits: LIMITS.posY,
        value: prefs.posY, format: percent,
        onInput: (v) => { prefs.posY = clampNumber(v, LIMITS.posY); applyPosY(); },
        onChange: commit
    });
    const zoom = buildSlider({
        id: 'bg-zoom', short: 'Zoom', aria: 'Zoom du fond', limits: LIMITS.zoom,
        value: prefs.zoom, format: percent,
        onInput: (v) => { prefs.zoom = clampNumber(v, LIMITS.zoom); applyZoom(); },
        onChange: commit
    });
    const opacity = buildSlider({
        id: 'sheet-opacity', short: 'Opacité', aria: 'Opacité de la fiche', limits: LIMITS.opacity,
        value: prefs.opacity, format: percentOpacity,
        onInput: (v) => { prefs.opacity = clampNumber(v, LIMITS.opacity); applyOpacity(); },
        onChange: commit
    });

    const syncSliders = () => {
        for (const [slider, value] of [[posY, prefs.posY], [zoom, prefs.zoom], [opacity, prefs.opacity]]) {
            if (document.activeElement === slider.input) continue;
            slider.input.value = String(value);
            slider.refresh();
        }
    };

    const galleryButton = el('button', {
        type: 'button',
        class: 'btn appearance-gallery-btn',
        'aria-haspopup': 'dialog',
        title: "Choisir l'image de fond",
        on: { click: () => openGallery({ setStatus, commit }) }
    });
    setIconLabel(galleryButton, 'image', 'Fonds');

    // « Fonds » rejoint le groupe de boutons d'affichage (thème, cinéma) quand il existe
    const buttonGroup = document.getElementById('view-controls');
    buttonGroup?.append(galleryButton);
    container.replaceChildren(...(buttonGroup ? [] : [galleryButton]), posY.control, zoom.control, opacity.control);

    store.subscribe((state, changedKeys) => {
        if (changedKeys !== null) return;
        if (applyCharacterPrefs(state._visual_prefs)) syncSliders();
    });

    // Le thème fait partie de _visual_prefs (v3) : le garder à jour quand il change
    new MutationObserver(() => {
        const vp = store.get()._visual_prefs;
        if (vp && typeof vp === 'object' && vp.theme !== currentTheme()) {
            store.update({ _visual_prefs: { ...vp, theme: currentTheme() } });
        }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

// ---------------------------------------------------------------------------
// Galerie (fenêtre)
// ---------------------------------------------------------------------------

function openGallery({ setStatus, commit }) {
    const grid = el('div', { class: 'gallery-grid', role: 'group', 'aria-label': 'Fonds disponibles' });
    const message = el('p', { class: 'gallery-message', role: 'status', 'aria-live': 'polite' });
    const say = (text) => { message.textContent = text; };

    /**
     * @param {string} value fond choisi
     * @param {{remember?: boolean}} [options] remember: false = affiché sans être mémorisé
     */
    const select = (value, { remember = true } = {}) => {
        // La tuile activée au clavier est reconstruite par render() : lui rendre le focus ensuite
        const focusInGrid = grid.contains(document.activeElement);
        if (!remember) sessionOnlyBg = value;
        prefs.bg = value;
        applyBackground();
        const stored = commit();
        render();
        if (focusInGrid) grid.querySelector('.gallery-pick[aria-pressed="true"]')?.focus();
        if (stored) {
            say('');
        } else {
            say("Attention : image trop volumineuse pour être mémorisée : elle reste affichée jusqu'au rechargement de la page.");
            setStatus('⚠️ Fond affiché mais non mémorisé (image trop volumineuse)');
        }
        return stored;
    };

    const emptyThumb = (symbol) => el('span', { class: 'gallery-thumb gallery-thumb-empty', 'aria-hidden': 'true', text: symbol });

    const tile = ({ value, name, url, onRemove }) => {
        const active = value === prefs.bg;
        let preview = emptyThumb('∅');
        if (url) {
            preview = el('img', { class: 'gallery-thumb', src: url, alt: '', loading: 'lazy', decoding: 'async' });
            preview.addEventListener('error', () => preview.replaceWith(emptyThumb('?')), { once: true });
        }
        const pick = el('button', {
            type: 'button',
            class: 'gallery-pick',
            'aria-pressed': active ? 'true' : 'false',
            title: name,
            on: { click: () => select(value) }
        }, preview, el('span', { class: 'gallery-name', text: name }));
        const item = el('div', { class: active ? 'gallery-item active' : 'gallery-item' }, pick);
        if (onRemove) {
            item.append(el('button', {
                type: 'button',
                class: 'btn-icon gallery-remove',
                'aria-label': `Retirer le fond « ${name} » de la galerie`,
                title: 'Retirer de la galerie',
                on: { click: onRemove }
            }, icon('close')));
        }
        return item;
    };

    function render() {
        const items = [tile({ value: '', name: 'Aucun fond', url: null })];
        for (const name of DEFAULT_BGS) {
            items.push(tile({ value: name, name: displayName(name), url: resolveBackground(name) }));
        }
        if (isDataImage(prefs.bg)) {
            items.push(tile({ value: prefs.bg, name: "Image de l'appareil", url: prefs.bg }));
        }
        getSavedBackgrounds().forEach((value, index) => {
            items.push(tile({
                value,
                name: displayName(value),
                url: resolveBackground(value),
                onRemove: () => {
                    const list = getSavedBackgrounds();
                    list.splice(index, 1);
                    setSavedBackgrounds(list);
                    render();
                    say('Fond retiré de la galerie.');
                    grid.querySelector('.gallery-pick')?.focus();
                }
            }));
        });
        grid.replaceChildren(...items);
    }

    // --- Ajout d'une adresse ---
    const urlInput = el('input', {
        type: 'url',
        id: 'gallery-new-url',
        class: 'gallery-url',
        placeholder: 'https://…',
        autocomplete: 'off',
        inputmode: 'url'
    });
    const addUrl = () => {
        const value = urlInput.value.trim();
        if (!value) return;
        if (!/^https?:\/\//i.test(value) || !resolveBackground(value)) {
            say('Adresse refusée : elle doit commencer par http:// ou https://.');
            return;
        }
        const list = getSavedBackgrounds();
        if (!list.includes(value)) {
            list.push(value);
            if (!setSavedBackgrounds(list)) {
                say('Attention : impossible de mémoriser cette adresse (stockage du navigateur plein ou indisponible).');
                return;
            }
        }
        urlInput.value = '';
        if (select(value)) say('Fond ajouté à la galerie.');
    };
    urlInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addUrl();
        }
    });

    // --- Image de l'appareil ---
    const fileInput = el('input', {
        type: 'file',
        accept: 'image/*',
        class: 'gallery-file',
        tabindex: '-1',
        'aria-hidden': 'true'
    });
    fileInput.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        fileInput.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            say("Ce fichier n'est pas une image.");
            return;
        }
        say("Préparation de l'image…");
        const dataUrl = await deviceImageToDataURL(file);
        if (!dataUrl) {
            say('Image illisible par ce navigateur.');
            return;
        }
        let remember = true;
        if (dataUrl.length > DEVICE_IMAGE_MAX_CHARS) {
            const ok = await confirmModal({
                title: 'Image volumineuse',
                icon: 'warning',
                message: `Même réduite, cette image occupe ${megabytes(dataUrl.length)} Mo. `
                    + "Le stockage du navigateur est limité (environ 5 Mo pour toute l'application) "
                    + "et doit garder de la place pour la sauvegarde du personnage : l'image sera affichée, "
                    + "mais pas mémorisée (elle disparaîtra au rechargement de la page). Continuer ?",
                confirmLabel: 'Afficher quand même'
            });
            if (!ok) {
                say('');
                return;
            }
            remember = false;
        }
        select(dataUrl, { remember });
    });

    const body = [
        grid,
        el('div', { class: 'gallery-add' },
            el('label', { for: 'gallery-new-url', class: 'gallery-add-label', text: 'Ajouter une image par son adresse' }),
            el('div', { class: 'gallery-add-row' },
                urlInput,
                el('button', { type: 'button', class: 'btn', on: { click: addUrl } },
                    icon('plus'), el('span', { class: 'btn-label', text: 'Ajouter' })),
                el('button', {
                    type: 'button',
                    class: 'btn',
                    title: 'Choisir une image enregistrée sur cet appareil',
                    on: { click: () => fileInput.click() }
                }, icon('image'), el('span', { class: 'btn-label', text: "Image de l'appareil" })),
                fileInput)),
        message
    ];

    render();
    openModal({ title: "Fonds d'écran", icon: 'image', body, wide: true, actions: [{ label: 'Fermer', primary: true }] });
    // Focus sur le fond actuel plutôt que sur le champ d'adresse (évite le clavier sur tablette)
    grid.querySelector('.gallery-pick[aria-pressed="true"]')?.focus();
}
