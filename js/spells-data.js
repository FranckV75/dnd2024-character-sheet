/**
 * SPELLS-DATA.JS
 * Chargement réactif et asynchrone des données de sorts D&D 2024.
 * Données externalisées dans data/spells.json (446 Ko).
 */

// Initialisation globale (tableau vide pour éviter toute ReferenceError)
window.SPELLS_DATA = [];

/**
 * Charge les données des sorts depuis data/spells.json via fetch()
 */
async function loadSpellsData() {
    try {
        const response = await fetch('data/spells.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        window.SPELLS_DATA = await response.json();
    } catch (err) {
        console.warn('⚠️ Impossible de charger data/spells.json:', err.message);
    }
}

// Lancer le chargement asynchrone immédiatement
loadSpellsData();