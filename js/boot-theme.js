// =============================================================================
// BOOT-THEME.JS - Thème mémorisé posé avant le premier affichage
// Script classique (pas un module) chargé dans <head> avant les feuilles de style :
// en thème sombre, la page ne s'affiche plus d'abord en clair le temps que
// js/ui/theme.js (module, chargé plus tard) applique le thème. Même clé que theme.js.
// =============================================================================

try {
    const theme = localStorage.getItem('dd2024_theme');
    if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;
} catch {
    // Stockage indisponible : theme.js appliquera le thème clair par défaut
}
