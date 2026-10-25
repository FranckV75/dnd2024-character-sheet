// =============================================================================
// TABS.JS - Onglets accessibles (souris, tactile et clavier)
// =============================================================================

const STORAGE_KEY = 'dd2024_active_tab';

/**
 * Active la navigation par onglets dans `root`.
 * @param {HTMLElement} root
 */
export function initTabs(root) {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    if (tabs.length === 0) return;

    function activate(tab, focus = false) {
        for (const t of tabs) {
            const selected = t === tab;
            t.setAttribute('aria-selected', String(selected));
            t.tabIndex = selected ? 0 : -1;
            root.querySelector(`#${t.getAttribute('aria-controls')}`).hidden = !selected;
        }
        if (focus) tab.focus();
        try {
            localStorage.setItem(STORAGE_KEY, tab.dataset.tab);
        } catch {
            // Stockage indisponible : l'onglet ne sera simplement pas mémorisé
        }
    }

    for (const tab of tabs) {
        tab.addEventListener('click', () => activate(tab));
        tab.addEventListener('keydown', (event) => {
            const index = tabs.indexOf(tab);
            const target = {
                ArrowRight: tabs[(index + 1) % tabs.length],
                ArrowLeft: tabs[(index - 1 + tabs.length) % tabs.length],
                Home: tabs[0],
                End: tabs[tabs.length - 1]
            }[event.key];
            if (target) {
                event.preventDefault();
                activate(target, true);
            }
        });
    }

    let saved = null;
    try {
        saved = localStorage.getItem(STORAGE_KEY);
    } catch {
        saved = null;
    }
    activate(tabs.find(t => t.dataset.tab === saved) || tabs[0]);
}
