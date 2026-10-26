// =============================================================================
// GALLERY.JS (règles) - Valeurs des réglages d'apparence (fond d'écran, opacité)
//
// Fonctions pures (aucun DOM, aucun localStorage) utilisées par js/ui/gallery.js :
//  - bornes des curseurs et lecture des nombres mémorisés (textes v3) ;
//  - validation des fonds avant de les placer dans url("…") (protection contre l'injection CSS) ;
//  - conversion avec le champ du personnage _visual_prefs (format v3 : textes).
// =============================================================================

/** Bornes des curseurs (les valeurs mémorisées hors bornes sont ramenées dedans) */
export const GALLERY_LIMITS = Object.freeze({
    zoom: Object.freeze({ min: 20, max: 200, step: 5, fallback: 100 }),
    posY: Object.freeze({ min: 0, max: 100, step: 1, fallback: 50 }),
    opacity: Object.freeze({ min: 0.2, max: 1, step: 0.05, fallback: 1 })
});

/** Image de l'appareil : côté le plus long après réduction (pixels) */
export const DEVICE_IMAGE_MAX_SIDE = 1920;

/** Au-delà de cette longueur (caractères), une image de l'appareil n'est pas mémorisée :
 *  elle priverait la sauvegarde automatique du personnage de place (stockage ≈ 5 Mo). */
export const DEVICE_IMAGE_MAX_CHARS = 1_500_000;

/**
 * Nombre borné ; texte libre ou valeur absente → valeur par défaut.
 * @param {unknown} value
 * @param {{min: number, max: number, fallback: number}} limits
 * @returns {number}
 */
export function clampNumber(value, { min, max, fallback }) {
    const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '').replace(',', '.'));
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}

/** @returns {boolean} true si la valeur est renseignée (ni absente, ni vide) */
export const isSet = (value) => value !== undefined && value !== null && value !== '';

/**
 * Image de l'appareil (adresse data: en base64, de type image uniquement).
 * @param {unknown} value
 * @returns {boolean}
 */
export function isDataImage(value) {
    return typeof value === 'string'
        && /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(value);
}

/**
 * Nom d'une image fournie avec l'application ('Fond_X.webp'), sans chemin ni caractère spécial.
 * @param {unknown} value
 * @param {string[]} [defaults] liste des images fournies (DEFAULT_BGS)
 * @returns {boolean}
 */
export function isDefaultName(value, defaults = []) {
    if (typeof value !== 'string') return false;
    return defaults.includes(value) || /^Fond[^/\\"'()<>\s]*\.(webp|png|jpe?g)$/i.test(value);
}

/** Adresse du site publié : la v3 y servait les images fournies à la racine (« …/Fond_Iria.webp ») */
const LEGACY_SITE_IMAGE = /^https?:\/\/franckv75\.github\.io\/dnd2024-character-sheet\/([^/?#]+)$/i;

/**
 * Adresse complète d'une image fournie telle que la v3 la servait (à la racine du site) :
 * le fichier a été déplacé dans assets/backgrounds/, l'ancienne adresse n'existe plus.
 * @param {unknown} value
 * @param {string[]} [defaults] liste des images fournies (DEFAULT_BGS)
 * @returns {string} nom de l'image fournie ('Fond_Iria.webp'), ou '' si ce n'est pas le cas
 */
export function legacySiteImage(value, defaults = []) {
    const match = typeof value === 'string' ? value.trim().match(LEGACY_SITE_IMAGE) : null;
    if (!match) return '';
    try {
        const name = decodeURIComponent(match[1]);
        return defaults.includes(name) ? name : '';
    } catch {
        return '';
    }
}

/**
 * Chrome, Edge et Chrome Android ignorent sans erreur une variable CSS de plus de 2 Mio
 * (2 097 152 caractères) : une grande image de l'appareil enregistrée par la v3 ne s'afficherait
 * pas. Au-delà de cette longueur, l'interface passe par une adresse blob: (dataImageBytes).
 */
export const CSS_VARIABLE_SAFE_CHARS = 2_000_000;

/**
 * @param {unknown} value
 * @returns {boolean} true si l'image de l'appareil est trop longue pour une variable CSS
 */
export function needsObjectUrl(value) {
    return typeof value === 'string' && value.length > CSS_VARIABLE_SAFE_CHARS && isDataImage(value);
}

/**
 * Contenu binaire d'une image de l'appareil (data:image/…;base64,…), pour créer une adresse blob:.
 * @param {unknown} value
 * @returns {{type: string, bytes: Uint8Array}|null} null si ce n'est pas une image data: lisible
 */
export function dataImageBytes(value) {
    if (!isDataImage(value)) return null;
    const comma = value.indexOf(',');
    const type = value.slice('data:'.length, value.indexOf(';'));
    try {
        const binary = atob(value.slice(comma + 1));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return { type, bytes };
    } catch {
        return null;
    }
}

/**
 * Transforme une valeur mémorisée en adresse utilisable dans url("…"), ou null si elle est
 * vide ou refusée (protocole inconnu, chemin relatif, caractères dangereux).
 * L'ancienne adresse complète d'une image fournie (racine du site v3) désigne l'image fournie.
 * @param {unknown} value '' | 'Fond_X.webp' | 'https://…' | 'data:image/…'
 * @param {{assetBase: string|URL, defaults?: string[]}} options assetBase = dossier des images fournies (se termine par /)
 * @returns {string|null}
 */
export function resolveBackground(value, { assetBase, defaults = [] }) {
    if (typeof value !== 'string') return null;
    const v = value.trim();
    if (!v || v === 'none') return null;
    if (isDataImage(v)) return v;
    const name = isDefaultName(v, defaults) ? v : legacySiteImage(v, defaults);
    if (name) {
        try {
            return new URL(encodeURIComponent(name), assetBase).href;
        } catch {
            return null;
        }
    }
    if (/^https?:\/\//i.test(v)) {
        try {
            const url = new URL(v);
            // href est normalisé : guillemets doubles, espaces et retours à la ligne y sont encodés.
            // La valeur est placée entre guillemets doubles (url("…")) : ' et ( ) n'y sont pas dangereux.
            if ((url.protocol === 'http:' || url.protocol === 'https:') && !/["\\\s]/.test(url.href)) {
                return url.href;
            }
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * Nom lisible d'une image ('Fond_La_Team.webp' → 'La Team', 'https://x/a%20b.jpg' → 'a b').
 * @param {string} value
 * @returns {string}
 */
export function displayName(value) {
    if (typeof value !== 'string' || !value) return '';
    if (isDataImage(value)) return "Image de l'appareil";
    let name = value.split(/[?#]/)[0].split('/').filter(Boolean).pop() || value;
    try {
        name = decodeURIComponent(name);
    } catch {
        // Nom laissé tel quel
    }
    return name.replace(/\.(webp|png|jpe?g|gif|avif)$/i, '')
        .replace(/^Fond[ _-]?/, '')
        .replace(/_/g, ' ')
        .trim() || value;
}

/**
 * Liste des adresses ajoutées par l'utilisateur (localStorage 'dd2024_saved_bgs', JSON v3).
 * @param {string|null} raw
 * @returns {string[]}
 */
export function parseSavedBackgrounds(raw) {
    if (!raw) return [];
    try {
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list.filter(item => typeof item === 'string' && item.trim()) : [];
    } catch {
        return [];
    }
}

/**
 * Taille CSS du fond : 100 % = l'image couvre tout l'écran (même rendu que la v3).
 * @param {number} zoom
 * @returns {string}
 */
export function backgroundSize(zoom) {
    return Math.round(zoom) === 100 ? 'cover' : `${zoom}% auto`;
}

/**
 * Dimensions réduites pour qu'aucun côté ne dépasse maxSide (jamais agrandies).
 * @param {number} width
 * @param {number} height
 * @param {number} [maxSide]
 * @returns {{width: number, height: number, scaled: boolean}}
 */
export function fitWithin(width, height, maxSide = DEVICE_IMAGE_MAX_SIDE) {
    if (!(width > 0) || !(height > 0)) return { width: 0, height: 0, scaled: false };
    const ratio = Math.min(1, maxSide / Math.max(width, height));
    return {
        width: Math.max(1, Math.round(width * ratio)),
        height: Math.max(1, Math.round(height * ratio)),
        scaled: ratio < 1
    };
}

/**
 * Fond recopié dans le personnage : jamais une image de l'appareil (trop lourde pour la base).
 * @param {string} bg
 * @returns {string|null}
 */
export function portableBackground(bg) {
    return bg && !isDataImage(bg) ? bg : null;
}

/**
 * Réglages → champ _visual_prefs du personnage (format v3 : nombres en texte).
 * Les clés inconnues de l'ancien objet sont conservées.
 * @param {{bg: string, zoom: number, posY: number, opacity: number}} prefs
 * @param {'light'|'dark'} theme
 * @param {unknown} [previous] ancien _visual_prefs
 * @returns {{opacity: string, theme: string, galleryBg: string|null, bgZoom: string, bgPosY: string}}
 */
export function toVisualPrefs(prefs, theme, previous) {
    const base = previous && typeof previous === 'object' ? previous : {};
    return {
        ...base,
        opacity: String(prefs.opacity),
        theme,
        galleryBg: portableBackground(prefs.bg),
        bgZoom: String(prefs.zoom),
        bgPosY: String(prefs.posY)
    };
}

/**
 * Champ _visual_prefs du personnage (textes v3) → réglages à appliquer.
 * Seules les valeurs présentes et valides sont renvoyées.
 * @param {unknown} vp
 * @param {(bg: string) => boolean} isValidBg
 * @returns {{bg?: string, zoom?: number, posY?: number, opacity?: number, theme?: 'light'|'dark'}|null}
 */
export function fromVisualPrefs(vp, isValidBg) {
    if (!vp || typeof vp !== 'object') return null;
    const out = {};
    if (typeof vp.galleryBg === 'string' && isValidBg(vp.galleryBg)) out.bg = vp.galleryBg;
    if (isSet(vp.bgZoom)) out.zoom = clampNumber(vp.bgZoom, GALLERY_LIMITS.zoom);
    if (isSet(vp.bgPosY)) out.posY = clampNumber(vp.bgPosY, GALLERY_LIMITS.posY);
    if (isSet(vp.opacity)) out.opacity = clampNumber(vp.opacity, GALLERY_LIMITS.opacity);
    if (vp.theme === 'dark' || vp.theme === 'light') out.theme = vp.theme;
    return out;
}
