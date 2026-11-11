// =============================================================================
// SPELLS/PREFS.JS - Réglages du grimoire propres à cet appareil (jamais dans la fiche)
//
// Infobulles des sorts allumées ou non, grimoire ouvert à la demande (personnage sans magie).
// Stockage indisponible (navigation privée) : réglage par défaut, rien n'est mémorisé.
// =============================================================================

const TOOLTIP_STORAGE_KEY = 'dd2024_spell_tooltips';
/** Grimoire ouvert à la demande (personnage sans magie) : réglage du navigateur, pas de la fiche */
const GRIMOIRE_STORAGE_KEY = 'dd2024_grimoire_open';

export function readTooltipSetting() {
    try {
        return localStorage.getItem(TOOLTIP_STORAGE_KEY) !== 'false';
    } catch {
        return true;
    }
}

export function saveTooltipSetting(enabled) {
    try {
        localStorage.setItem(TOOLTIP_STORAGE_KEY, String(enabled));
    } catch {
        // Stockage indisponible : le réglage ne sera pas mémorisé
    }
}

export function readGrimoireOpen() {
    try {
        return localStorage.getItem(GRIMOIRE_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

export function saveGrimoireOpen(open) {
    try {
        localStorage.setItem(GRIMOIRE_STORAGE_KEY, String(open));
    } catch {
        // Stockage indisponible : le choix ne sera pas mémorisé
    }
}
