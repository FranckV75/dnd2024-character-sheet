// Outil de développement : voir dev/preview.html
// Il REMPLACE la fiche enregistrée dans le navigateur : il ne fonctionne donc que sur
// l'ordinateur de développement (localhost), jamais sur le site publié (même stockage que la
// fiche des joueurs).
import { parseCharacterFile, saveLocal } from '../js/state/persistence.js';
import { SEEN_VERSION_KEY } from '../js/state/whats-new.js';
import { APP_VERSION } from '../js/version.js';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

const params = new URLSearchParams(location.search);
const fixture = params.get('fixture') || 'legacy-v1.json';

if (!LOCAL_HOSTS.has(location.hostname)) {
    document.body.textContent = 'Outil de développement : disponible seulement en local. Votre fiche n\'a pas été modifiée.';
} else if (!/^(local\/)?[\w.\- ]+\.json$/.test(fixture)) {
    document.body.textContent = 'Paramètre fixture invalide.';
} else {
    const text = await fetch(new URL(`../tests/fixtures/${fixture}`, import.meta.url)).then(r => r.text());
    saveLocal(parseCharacterFile(text).character);
    localStorage.setItem('dd2024_theme', params.get('theme') === 'dark' ? 'dark' : 'light');
    localStorage.setItem('dd2024_active_tab', params.get('tab') || 'combat');
    localStorage.setItem('dd2024_lock_mode', 'false');
    // Fenêtre « Nouveautés » : jamais pendant une capture, sauf demande (&news=4.39.0 : dernière
    // version vue sur l'appareil ; &news=none : aucune, comme un joueur venu avant cette fenêtre)
    const news = params.get('news');
    if (news === 'none') localStorage.removeItem(SEEN_VERSION_KEY);
    else localStorage.setItem(SEEN_VERSION_KEY, /^\d+\.\d+\.\d+$/.test(news ?? '') ? news : APP_VERSION);
    location.replace(new URL('../index.html', import.meta.url));
}
