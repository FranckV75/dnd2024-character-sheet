// =============================================================================
// TABS.JS - Onglets accessibles (souris, tactile et clavier)
// Un changement d'onglet fait par l'utilisateur est signalé par l'événement
// 'dd:tabchange' sur `root` ({ panel, direction }) : motion.js y fait glisser le panneau.
// =============================================================================

const STORAGE_KEY = 'dd2024_active_tab';

/**
 * Active la navigation par onglets dans `root`.
 * @param {HTMLElement} root
 */
export function initTabs(root) {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    if (tabs.length === 0) return;

    const panelOf = (tab) => root.querySelector(`#${tab.getAttribute('aria-controls')}`);

    /**
     * @param {HTMLElement} tab
     * @param {{ focus?: boolean, direction?: number, announce?: boolean }} [options]
     *   direction : 1 = vers la droite, -1 = vers la gauche (sinon déduit de l'ordre des onglets) ;
     *   announce : false au démarrage (onglet mémorisé), pour ne rien animer
     */
    function activate(tab, { focus = false, direction = 0, announce = true } = {}) {
        const previous = tabs.find(t => t.getAttribute('aria-selected') === 'true');
        for (const t of tabs) {
            const selected = t === tab;
            t.setAttribute('aria-selected', String(selected));
            t.tabIndex = selected ? 0 : -1;
            panelOf(t).hidden = !selected;
        }
        if (focus) tab.focus();
        try {
            localStorage.setItem(STORAGE_KEY, tab.dataset.tab);
        } catch {
            // Stockage indisponible : l'onglet ne sera simplement pas mémorisé
        }
        if (announce && previous && previous !== tab) {
            const sens = direction || Math.sign(tabs.indexOf(tab) - tabs.indexOf(previous));
            root.dispatchEvent(new CustomEvent('dd:tabchange', { detail: { panel: panelOf(tab), direction: sens } }));
        }
    }

    for (const tab of tabs) {
        tab.addEventListener('click', () => activate(tab));
        tab.addEventListener('keydown', (event) => {
            const index = tabs.indexOf(tab);
            // [onglet visé, sens du déplacement] : la flèche droite va toujours vers la droite,
            // même quand elle repasse du dernier onglet au premier
            const move = {
                ArrowRight: [tabs[(index + 1) % tabs.length], 1],
                ArrowLeft: [tabs[(index - 1 + tabs.length) % tabs.length], -1],
                Home: [tabs[0], -1],
                End: [tabs[tabs.length - 1], 1]
            }[event.key];
            if (move) {
                event.preventDefault();
                activate(move[0], { focus: true, direction: move[1] });
            }
        });
    }

    let saved = null;
    try {
        saved = localStorage.getItem(STORAGE_KEY);
    } catch {
        saved = null;
    }
    activate(tabs.find(t => t.dataset.tab === saved) || tabs[0], { announce: false });
}
