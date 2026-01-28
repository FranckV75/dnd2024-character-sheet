// =============================================================================
// DARK MODE MANAGEMENT
// =============================================================================

/**
 * Initialise le thème au chargement de la page
 */
function initTheme() {
    const savedTheme = localStorage.getItem('dd2024_theme') || 'light';
    setTheme(savedTheme);
}

/**
 * Applique le thème spécifié
 * @param {string} theme - 'light' ou 'dark'
 */
function setTheme(theme) {
    document.body.dataset.theme = theme;
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        btn.title = theme === 'dark' ? 'Mode clair' : 'Mode sombre';
    }
    localStorage.setItem('dd2024_theme', theme);
}

/**
 * Bascule entre le mode clair et sombre
 */
function toggleTheme() {
    const current = document.body.dataset.theme || 'light';
    setTheme(current === 'light' ? 'dark' : 'light');
}
