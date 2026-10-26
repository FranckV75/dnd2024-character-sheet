// Outil de développement : voir dev/preview.html
// Il REMPLACE la fiche enregistrée dans le navigateur : il ne fonctionne donc que sur
// l'ordinateur de développement (localhost), jamais sur le site publié (même stockage que la
// fiche des joueurs).
import { parseCharacterFile, saveLocal } from '../js/state/persistence.js';

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
    location.replace(new URL('../index.html', import.meta.url));
}
