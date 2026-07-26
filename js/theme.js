// =============================================================================
// DARK MODE MANAGEMENT (MODULE ES6)
// =============================================================================

export function initTheme() {
    const savedTheme = localStorage.getItem('dd2024_theme') || 'light';
    setTheme(savedTheme);
}

export function setTheme(theme) {
    document.body.dataset.theme = theme;
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        btn.title = theme === 'dark' ? 'Mode clair' : 'Mode sombre';
    }
    localStorage.setItem('dd2024_theme', theme);

    const savedOpacity = localStorage.getItem('dd2024_opacity');
    if (savedOpacity && typeof window.updateOpacity === 'function') {
        window.updateOpacity(savedOpacity);
    }
}

export function toggleTheme() {
    const current = document.body.dataset.theme || 'light';
    setTheme(current === 'light' ? 'dark' : 'light');
}

window.initTheme = initTheme;
window.setTheme = setTheme;
window.toggleTheme = toggleTheme;
