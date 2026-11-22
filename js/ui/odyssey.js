// =============================================================================
// ODYSSEY.JS (interface) - Mode « Odyssée des Seigneurs Dragons », réglé fiche par fiche
//
// Règles : js/rules/odyssey.js (clé facultative « odyssey_mode », actif par défaut).
//  - Case « Mode Odyssée » du menu « Gestion », au bout de la rangée « Mode d'emploi » : cochée =
//    mode actif. Réglage de la fiche : masquée fiche verrouillée (edit-only), comme « Nouvelle
//    fiche ». Au toucher, la barre du haut dit que le mode vient d'être coupé, ce que cela change,
//    ce que la fiche garde et comment revenir en arrière (deux lignes sur tablette, menu ouvert ;
//    l'essentiel sur ordinateur, où la colonne des messages est étroite) ; à la souris, l'infobulle
//    l'explique.
//  - Mode coupé, un choix de l'Odyssée abandonné (espèce, sous-classe, style) sort aussitôt de sa
//    liste : la barre du haut dit comment le retrouver (recocher la case).
//  - Encadré « Odyssée des Seigneurs Dragons » (onglet 3) : caché quand le mode est coupé ET qu'il
//    est vide (ni destin héroïque ni points de renommée). Il n'est caché qu'à un moment calme :
//    changement du mode, ouverture ou remplacement de la fiche, verrou, impression. Vidé à la main,
//    mode coupé, il reste donc sous le doigt (une renommée ramenée à 0 par erreur se corrige).
//    L'écran et le papier disent la même chose : au moment d'imprimer, l'encadré inutile disparaît
//    aussi de l'écran (beforeprint ; filet : attribut data-odyssey-unused, css/print.css).
//  - Case de l'onglet Combat (clé heroic_inspiration) : « Points de Foi » quand le mode est actif,
//    avec une pastille « +5 par niveau » (bonus de maîtrise + Sagesse, au moins 1) ; un toucher
//    ouvre la fenêtre « Points de Foi » : les faveurs à 1, 3 et 5 points, celles que les points de
//    la case permettent, et comment les demander (js/data/faith-favors.js) ; son bouton « Les dieux
//    de Thyléa » ouvre par-dessus la liste des dieux, leur domaine et leurs faveurs. Mode coupé :
//    « Inspiration héroïque », sans pastille ; ses boutons − / + vont de 0 à 1 (js/ui/counters.js).
//  - Bouton « Inspiration héroïque » sous la pastille (mode actif seulement) : les points de Foi ne
//    remplacent pas l'Inspiration héroïque. Visible pour un Humain (Ingénieux), un Champion niveau
//    10+, ou quand elle est allumée (odysseyInspirationUseful) ; une fois affiché, il reste sous le
//    doigt jusqu'au prochain changement de fiche ou de mode (éteint par erreur, il se rallume).
//    Bascule (aria-pressed) : clé facultative odyssey_inspiration ("1" ; éteint : clé retirée).
//    Champ de jeu : utilisable fiche verrouillée. Imprimé seulement allumé (css/print.css).
// Les listes d'espèces, de sous-classes et de dons suivent le mode dans js/ui/sheet.js.
// Mise en forme : css/toolbar.css (.toolbar-check).
// =============================================================================

import { el, icon } from './dom.js';
import { derivedOf } from './derived.js';
import { isLocked } from './lock.js';
import { frenchSpaces } from './help.js';
import { renameSteppers } from './stepper.js';
import { openModal } from './modal.js';
import { COMPACT_QUERY } from './toolbar.js';
import {
    ODYSSEY_MODE_KEY, ODYSSEY_MODE_LABEL, STATUS_ROOM, STATUS_ROOM_OPEN, STATUS_ROOM_NARROW,
    odysseyActive, setOdysseyModePatch, odysseyModeHint, odysseyModeMessage, odysseyDroppedMessage,
    odysseyBoxUseful, inspirationWording, faithPerLevel, faithMention, faithSentence, faithHint,
    faithPoints, faithFavors, faithPointsSentence, pointsWord, FAITH_SPEND,
    ODYSSEY_INSPIRATION_LABEL, odysseyInspirationLit, odysseyInspirationUseful, odysseyInspirationPatch,
    odysseyInspirationMessage, odysseyInspirationHint
} from '../rules/odyssey.js';
import { FAITH_WAYS, FAITH_FOOTNOTE, FAITH_GODS, FAITH_GODS_INTRO, FAITH_SPELL_NOTE } from '../data/faith-favors.js';

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} ctx
 */
export function initOdyssey({ root, store, setStatus }) {
    initBox(root, store);
    // Tablette (barre repliable, message sur toute la largeur) ou ordinateur (colonne étroite)
    const compact = window.matchMedia(COMPACT_QUERY);
    initInspiration(root, store, setStatus, compact);
    initDroppedNotice(store, setStatus, compact);
    const host = document.getElementById('toolbar-help');
    if (!host) return;

    // Une vraie case à cocher, dessinée comme celles de la fiche, dans un bouton de la barre
    const box = el('input', { type: 'checkbox', class: 'round-check', id: 'odyssey-mode' });
    const control = el('label', { class: 'btn toolbar-check edit-only', for: 'odyssey-mode' },
        box, el('span', { class: 'btn-label', text: ODYSSEY_MODE_LABEL }));
    host.append(control);

    const render = (character) => {
        const active = odysseyActive(character);
        if (box.checked !== active) box.checked = active;
        const hint = frenchSpaces(odysseyModeHint(character));
        if (control.title !== hint) control.title = hint;
    };

    box.addEventListener('change', () => {
        // Fiche verrouillée : la case est masquée ; un changement venu d'ailleurs est annulé
        const patch = isLocked() ? {} : setOdysseyModePatch(store.get(), box.checked);
        if (!Object.keys(patch).length) {
            render(store.get());
            return;
        }
        store.update(patch);
        // La case est dans le menu ouvert : sur tablette, le message y dispose de deux lignes
        setStatus(frenchSpaces(odysseyModeMessage(store.get(), compact.matches ? STATUS_ROOM_OPEN : STATUS_ROOM_NARROW)));
    });

    store.subscribe((character) => render(character));
    render(store.get());
}

/**
 * Mode coupé : un choix de l'Odyssée que la fiche abandonne (autre espèce, autre classe ou
 * sous-classe, autre style de combat) sort aussitôt de sa liste. La barre du haut le dit, avec le
 * moyen de le retrouver. Rien à l'ouverture ou au remplacement de la fiche (changedKeys nul).
 * @param {Object} store
 * @param {(message: string) => void} setStatus
 * @param {MediaQueryList} compact
 */
function initDroppedNotice(store, setStatus, compact) {
    let previous = store.get();
    store.subscribe((character, changedKeys) => {
        const before = previous;
        previous = character;
        if (changedKeys === null) return;
        const message = odysseyDroppedMessage(before, character, compact.matches ? STATUS_ROOM : STATUS_ROOM_NARROW);
        if (message) setStatus(frenchSpaces(message));
    });
}

/**
 * Encadré « Odyssée des Seigneurs Dragons » de l'onglet 3.
 * @param {HTMLElement} root
 * @param {Object} store
 */
function initBox(root, store) {
    const box = root.querySelector('section.box.odyssey');
    if (!box) return;
    /** @param {boolean} settle - moment calme : l'encadré inutile peut disparaître de l'écran */
    const sync = (character, settle) => {
        const useful = odysseyBoxUseful(character);
        box.toggleAttribute('data-odyssey-unused', !useful);
        if (useful) box.hidden = false;
        else if (settle) box.hidden = true;
    };
    store.subscribe((character, changedKeys) => sync(character, changedKeys === null || changedKeys.includes(ODYSSEY_MODE_KEY)));
    document.addEventListener('dd:lockchange', () => sync(store.get(), true));
    // Impression : l'encadré inutile quitte aussi l'écran, qui montre ainsi ce qui est imprimé
    window.addEventListener('beforeprint', () => sync(store.get(), true));
    sync(store.get(), true);
}

/**
 * Case « Points de Foi » / « Inspiration héroïque » (onglet Combat) : libellé, nom de ses boutons
 * − / + et pastille des points de Foi gagnés par niveau (mode actif seulement), qui ouvre la
 * fenêtre des faveurs ; dessous, le bouton « Inspiration héroïque » (mode actif, quand il sert).
 * @param {HTMLElement} root
 * @param {Object} store
 * @param {(message: string) => void} setStatus
 * @param {MediaQueryList} compact - tablette (message sur une ligne) ou ordinateur (colonne étroite)
 */
function initInspiration(root, store, setStatus, compact) {
    const input = root.querySelector('#f-heroic_inspiration');
    const label = root.querySelector('label[for="f-heroic_inspiration"]');
    if (!input || !label) return;
    const cell = input.closest('.stat-cell');
    // Même pastille dorée que « Vitesse 12 m (Centaure) » : un toucher ouvre la fenêtre des faveurs
    const text = el('span');
    const mention = el('button', { type: 'button', class: 'feat-mention faith-mention', hidden: true, 'aria-haspopup': 'dialog' },
        el('span', { class: 'feat-mention-line' }, icon('star'), text));
    mention.addEventListener('click', () => {
        const character = store.get();
        if (odysseyActive(character)) openFaithFavors(character);
    });
    // Inspiration héroïque à part (mode actif) : étoile pleine quand elle est allumée
    const toggle = el('button', { type: 'button', class: 'feat-mention faith-inspiration', hidden: true, 'aria-pressed': 'false' },
        el('span', { class: 'feat-mention-line' }, icon('star'), el('span', { text: ODYSSEY_INSPIRATION_LABEL })));
    // Les deux pastilles l'une sous l'autre, sous la case (css/feats.css)
    cell?.append(mention, toggle);
    toggle.addEventListener('click', () => {
        const character = store.get();
        if (!odysseyActive(character)) return;
        const lit = !odysseyInspirationLit(character);
        store.update(odysseyInspirationPatch(lit));
        setStatus(frenchSpaces(odysseyInspirationMessage(lit, compact.matches ? STATUS_ROOM : STATUS_ROOM_NARROW)));
    });
    let shown = false;
    /** @param {Array<string>|null} changedKeys - null : fiche ouverte ou remplacée */
    const renderToggle = (character, changedKeys) => {
        const active = odysseyActive(character);
        const derived = active ? derivedOf(character) : null;
        // Une fois affiché, le bouton reste jusqu'au prochain changement de fiche ou de mode
        const calm = changedKeys === null || changedKeys.includes(ODYSSEY_MODE_KEY);
        shown = active && (odysseyInspirationUseful(character, derived) || (shown && !calm));
        toggle.hidden = !shown;
        if (!shown) return;
        const lit = odysseyInspirationLit(character);
        toggle.setAttribute('aria-pressed', String(lit));
        const hint = frenchSpaces(odysseyInspirationHint(character, derived));
        if (toggle.title !== hint) toggle.title = hint;
    };
    let signature = '';
    const render = (character, changedKeys = null) => {
        renderToggle(character, changedKeys);
        const wording = inspirationWording(character);
        if (label.textContent !== wording.label) label.textContent = wording.label;
        renameSteppers(input, wording.noun);
        const faith = odysseyActive(character) ? faithPerLevel(derivedOf(character)) : null;
        const next = faith ? faithHint(faith) : '';
        if (next === signature) return;
        signature = next;
        mention.hidden = !faith;
        if (!faith) return;
        text.textContent = faithMention(faith);
        mention.title = frenchSpaces(`${next} Touchez la pastille pour les faveurs qu'ils permettent.`);
        mention.setAttribute('aria-label', `${faithMention(faith)} : ${next} Ouvre la liste des faveurs.`);
    };
    store.subscribe((character, changedKeys) => render(character, changedKeys));
    render(store.get());
}

/**
 * Fenêtre « Points de Foi » : les points de la case, les faveurs à 1, 3 et 5 points (celles que
 * ces points permettent sont marquées « Possible »), puis comment les demander. Lecture seule :
 * les points se retirent avec le bouton − de la case.
 * @param {Object} character
 */
function openFaithFavors(character) {
    const points = faithPoints(character.heroic_inspiration);
    const faith = faithPerLevel(derivedOf(character));
    const tiers = faithFavors(points).map((tier) => el('section', {
        class: 'level-up-section faith-tier',
        'data-tier': tier.id,
        'data-short': Boolean(tier.missing)
    },
        el('h3', { class: 'level-up-title faith-tier-title' },
            el('span', { text: `${tier.title} · ${pointsWord(tier.cost)}` }),
            ...(tier.status ? [el('span', { class: 'faith-tier-status', text: tier.status })] : [])),
        el('ul', {}, ...tier.uses.map((use) => el('li', { text: use })))));
    const ways = el('section', { class: 'level-up-section faith-ways' },
        el('h3', { class: 'level-up-title', text: 'Comment demander une faveur' }),
        el('ul', {}, ...FAITH_WAYS.map((way) => el('li', {},
            el('strong', { text: `${way.title} : ` }), el('span', { text: way.text })))));
    openModal({
        title: 'Points de Foi',
        icon: 'star',
        wide: true,
        focusField: false,
        className: 'modal-faith',
        body: [
            el('p', { class: 'faith-intro', text: frenchSpaces(`${faithPointsSentence(points)} ${FAITH_SPEND}`) }),
            el('p', { class: 'faith-intro', text: frenchSpaces(faithSentence(faith)) }),
            el('p', { class: 'faith-gods-row' }, el('button', {
                type: 'button',
                class: 'btn faith-gods-btn',
                'aria-haspopup': 'dialog',
                title: 'Les dieux à qui dédier une faveur, et ce que chacun accorde.',
                on: { click: openFaithGods }
            }, icon('star'), el('span', { class: 'btn-label', text: 'Les dieux de Thyléa' }))),
            ...tiers,
            ways,
            el('p', { class: 'faith-footnote', text: frenchSpaces(`${FAITH_FOOTNOTE} Source : guide du MJ de l'Odyssée, p. 92.`) })
        ],
        actions: [{ label: 'Fermer', primary: true }]
    });
}

/**
 * Fenêtre « Les dieux de Thyléa », ouverte par-dessus celle des points de Foi : chaque dieu, son
 * domaine, une phrase de présentation et les faveurs qu'il accorde volontiers
 * (js/data/faith-favors.js). « Retour » ramène à la fenêtre des points de Foi.
 */
function openFaithGods() {
    const groups = FAITH_GODS.map((group) => el('section', { class: 'level-up-section faith-gods' },
        el('h3', { class: 'level-up-title', text: group.title }),
        ...group.gods.map((god) => el('article', { class: 'faith-god' },
            el('h4', { class: 'faith-god-name' },
                el('span', { text: god.full }),
                ...(god.domains ? [el('span', { class: 'faith-god-domain', text: `${god.domains} · ${god.alignment}` })] : [])),
            el('p', { class: 'faith-god-about', text: frenchSpaces(god.about) }),
            el('p', { class: 'faith-god-favors' },
                el('strong', { text: 'Faveurs : ' }), el('span', { text: frenchSpaces(god.favors) }))))));
    openModal({
        title: 'Les dieux de Thyléa',
        icon: 'star',
        wide: true,
        focusField: false,
        className: 'modal-faith',
        body: [
            el('p', { class: 'faith-intro', text: frenchSpaces(FAITH_GODS_INTRO) }),
            ...groups,
            el('p', { class: 'faith-footnote', text: frenchSpaces(`${FAITH_SPELL_NOTE} Sources : guide du joueur de l'Odyssée, p. 9 et 10, et fiche des faveurs de la table.`) })
        ],
        actions: [{ label: 'Retour', primary: true }]
    });
}
