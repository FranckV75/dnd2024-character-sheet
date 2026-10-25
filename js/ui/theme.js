// =============================================================================
// THEME.JS - Thème clair / sombre (attribut data-theme sur <html>)
// =============================================================================

const STORAGE_KEY = 'dd2024_theme';

/**
 * Applique le thème mémorisé (clair par défaut)
 */
export function initTheme() {
    setTheme(readStoredTheme());
}

/**
 * @param {'light'|'dark'} theme
 */
export function setTheme(theme) {
    const value = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = value;
    try {
        localStorage.setItem(STORAGE_KEY, value);
    } catch {
        // Stockage indisponible (navigation privée) : le thème reste valable pour la session
    }
}

export function toggleTheme() {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}

function readStoredTheme() {
    try {
        return localStorage.getItem(STORAGE_KEY) || 'light';
    } catch {
        return 'light';
    }
}
