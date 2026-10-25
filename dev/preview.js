// Outil de développement : voir dev/preview.html
import { parseCharacterFile, saveLocal } from '../js/state/persistence.js';

const params = new URLSearchParams(location.search);
const fixture = params.get('fixture') || 'legacy-v1.json';

if (!/^(local\/)?[\w.\- ]+\.json$/.test(fixture)) {
    document.body.textContent = 'Paramètre fixture invalide.';
} else {
    const text = await fetch(new URL(`../tests/fixtures/${fixture}`, import.meta.url)).then(r => r.text());
    saveLocal(parseCharacterFile(text).character);
    localStorage.setItem('dd2024_theme', params.get('theme') === 'dark' ? 'dark' : 'light');
    localStorage.setItem('dd2024_active_tab', params.get('tab') || 'combat');
    localStorage.setItem('dd2024_lock_mode', 'false');
    location.replace(new URL('../index.html', import.meta.url));
}
