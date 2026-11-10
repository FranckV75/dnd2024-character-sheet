// =============================================================================
// FOLD.JS - Blocs repliables des capacités de sous-classe, des compagnons et des sorts de
// sous-classe (sur le modèle des dons repliables, js/ui/sheet.js)
//
// Un bouton (pastille dorée avec chevron) replie ou déplie un bloc : seul son titre reste. Le choix
// est retenu SUR CET APPAREIL (navigateur), jamais dans la sauvegarde du personnage : chaque joueur
// garde la fiche qui lui convient sur sa tablette. Impression : tout est imprimé, replié ou non
// (règles CSS sous @media screen).
// Clés : « subclass:<sous-classe> » (bloc entier), « subclass:<sous-classe>.<capacité> »,
// « companion:<compagnon> », « subclass-spells », « feat-spells », et « box:<nom> »
// pour les encadrés de index.html marqués data-fold-box (capacités de classe, compagnons, armures,
// traits, Odyssée, apparence…).
// =============================================================================

import { el, icon } from './dom.js';

const STORAGE_KEY = 'dd2024_blocks_folded';

function read() {
    try {
        const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return new Set(Array.isArray(list) ? list.filter(entry => typeof entry === 'string' && entry) : []);
    } catch {
        return new Set();
    }
}

let folded = read();

function save() {
    try {
        if (folded.size) localStorage.setItem(STORAGE_KEY, JSON.stringify([...folded]));
        else localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Stockage indisponible (navigation privée) : le repli vaut pour la session
    }
}

/** Le bloc est-il replié sur cet appareil ? */
export function isFolded(key) {
    return folded.has(key);
}

/**
 * Pose l'état replié sur un bloc et son bouton (attribut data-folded, aria-expanded, libellés).
 * @param {HTMLElement} block - élément qui porte data-fold-key
 */
export function applyFold(block) {
    const key = block?.dataset.foldKey;
    if (!key) return;
    const isClosed = folded.has(key);
    if (isClosed) block.dataset.folded = 'true';
    else delete block.dataset.folded;
    // Seul le bouton de CE bloc (pas ceux des blocs repliables qu'il contient)
    const button = [...block.querySelectorAll('[data-fold-toggle]')].find(b => b.closest('[data-fold-key]') === block);
    if (!button) return;
    button.setAttribute('aria-expanded', String(!isClosed));
    button.setAttribute('aria-label', `${button.dataset.foldLabel} : ${isClosed ? 'déplier' : 'replier'}`);
    button.title = isClosed ? 'Afficher le détail' : 'Ne garder que le titre';
}

/**
 * Bouton de repli : une pastille avec un chevron, et le texte visible (« Niv. 3 », nom du compagnon…).
 * @param {string} label - nom accessible (« Niv. 3, Rage du prédateur »)
 * @param {...(Node|string)} content - contenu visible du bouton (aucun : chevron seul)
 * @returns {HTMLButtonElement}
 */
export function foldButton(label, ...content) {
    const bare = content.length === 0;
    return el('button', { type: 'button', class: bare ? 'fold-toggle fold-toggle-bare' : 'fold-toggle', 'data-fold-toggle': 'true', 'data-fold-label': label },
        ...content, icon('chevron'));
}

/**
 * Écoute les boutons de repli d'un conteneur (un seul écouteur, les blocs peuvent être reconstruits)
 * et ceux des autres onglets du navigateur.
 * @param {HTMLElement} container
 */
export function bindFolding(container) {
    container.dataset.foldBound = 'true';
    container.addEventListener('click', (event) => {
        const button = event.target.closest('[data-fold-toggle]');
        if (!button || !container.contains(button)) return;
        // Blocs imbriqués (encadré « Capacités de classe » > bloc « Sous-classe ») : seul le
        // conteneur écouté le plus proche du bouton agit (sinon le repli s'annulerait)
        if (button.parentElement.closest('[data-fold-bound]') !== container) return;
        const block = button.closest('[data-fold-key]');
        const key = block?.dataset.foldKey;
        if (!key) return;
        if (folded.has(key)) folded.delete(key);
        else folded.add(key);
        save();
        applyFold(block);
    });
    window.addEventListener('storage', (event) => {
        if (event.key !== STORAGE_KEY) return;
        folded = read();
        applyFolds(container);
    });
}

/**
 * Encadrés fixes de index.html (section.box data-fold-box="<nom>") : une pastille à chevron au bout
 * du titre h3 replie l'encadré (seul le titre reste).
 * @param {{ root: HTMLElement }} ctx
 */
export function initBoxFolding({ root }) {
    for (const box of root.querySelectorAll('section.box[data-fold-box]')) {
        const title = box.querySelector(':scope > h3');
        if (!title) continue;
        box.dataset.foldKey = `box:${box.dataset.foldBox}`;
        // Nom de l'encadré : texte propre du titre, sans ce que d'autres modules y ajoutent
        // (pastille « Concentration : … » de l'encadré États)
        const label = [...title.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent).join('').trim() || title.textContent.trim();
        title.append(foldButton(label));
        // Un écouteur par encadré (les blocs qu'il contient, sous-classe ou compagnons, ont le leur)
        bindFolding(box);
        applyFold(box);
    }
}

/**
 * Pose l'état replié de tous les blocs d'un conteneur (après une reconstruction).
 * @param {HTMLElement} container
 */
export function applyFolds(container) {
    // Le conteneur lui-même peut être un bloc repliable (sorts de sous-classe, bloc « Sous-classe »)
    applyFold(container);
    for (const block of container.querySelectorAll('[data-fold-key]')) applyFold(block);
}
