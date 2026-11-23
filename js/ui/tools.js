// =============================================================================
// TOOLS.JS (interface) - Fenêtre « Choisir dans la liste » de la case « Outils »
//
// La case « Outils » (onglet Compétences & Histoire, clé profs_tools) reste un texte libre. Le
// bouton placé dessous (fiche déverrouillée) ouvre la liste des outils du manuel, rangés par
// catégorie, une case à cocher par outil, avec une recherche.
//  - Un outil déjà écrit dans la case (reconnu par son nom) apparaît coché ;
//  - cocher écrit le nom à la suite du texte, décocher retire ce nom et son séparateur : le reste,
//    écrit à la main, ne bouge pas (js/rules/tools.js) ; ce qui vient de changer est écrit dans
//    la fenêtre (la barre du haut est cachée derrière elle) ;
//  - en tête, « D'où viennent vos outils » : ce que donnent l'historique et les dons du personnage
//    (Façonneur, Musicien, Doué, Chef cuisinier, Empoisonneur), avec où il en est (« Noté »,
//    « 2 sur 3 ») ; puis un encadré par outil donné, ou par liste où il se choisit (une catégorie
//    entière mise en tête n'est pas répétée plus bas). Rien n'est coché tout seul : la fenêtre aide
//    à choisir, le joueur coche (js/rules/tool-sources.js). Quand une origine laisse un choix, une
//    phrase prévient que le compte prend aussi les outils de la classe (toolCountWarning).
// Le texte passe par le chemin des champs riches : nettoyage DOMPurify puis store. Aucune clé
// nouvelle. Ouverte aussi depuis l'encadré « Historique » (js/ui/background.js).
// =============================================================================

import { el, icon } from './dom.js';
import { openModal } from './modal.js';
import { isLocked } from './lock.js';
import { sanitizeRich, richTextAvailable } from './sanitize.js';
import { TOOLS } from '../data/tools.js';
import {
    toolsInText, addToolToText, removeToolFromText, matchesToolQuery, toolGroups, toolAbilityName
} from '../rules/tools.js';
import {
    toolSources, toolSourceProgress, featuredToolSections, sectionProgress, toolCountWarning
} from '../rules/tool-sources.js';

const FIELD = 'profs_tools';

/** Ce que fait le bouton : infobulle (souris) ; sur tablette, la phrase est écrite sous le bouton */
export const TOOLS_PICK_HELP = 'Cochez vos outils dans la liste du manuel : leur nom s\'écrit dans la case Outils.';

/**
 * Ouvre la fenêtre des outils.
 * @param {{ store: Object, setStatus: (message: string) => void }} ctx
 */
export function openToolPicker({ store, setStatus }) {
    // Mise en forme indisponible (DOMPurify non chargé) : les champs riches sont en lecture seule
    if (!richTextAvailable()) {
        setStatus('⚠️ Liste des outils indisponible hors ligne pour l\'instant : rechargez la page une fois connecté.');
        return;
    }
    // Fiche verrouillée : la case ne se modifie pas (le bouton est d'ailleurs caché)
    if (isLocked()) return;

    // Ce que donnent l'historique et les dons : lu à l'ouverture (ils ne changent pas fenêtre ouverte)
    const sources = toolSources(store.get());
    const featured = featuredToolSections(sources);

    const search = el('input', {
        type: 'search', class: 'input prep-search', placeholder: 'Chercher un outil…', autocomplete: 'off',
        spellcheck: 'false', 'aria-label': 'Chercher un outil par son nom'
    });
    const counter = el('output', { class: 'prep-count', 'aria-live': 'polite' });
    // Ce qui vient de changer, écrit dans la fenêtre : la barre du haut est cachée derrière elle
    const said = el('p', { class: 'tools-said', role: 'status', text: 'Chaque case cochée ou décochée met à jour la case Outils.' });
    const noMatch = el('p', { class: 'prep-empty muted', hidden: true, text: 'Aucun outil ne correspond.' });

    /** Une entrée par case affichée : { tool, li, box } (un outil mis en tête peut en avoir plusieurs) */
    const entries = [];

    /** Nombre de changements faits dans cette fenêtre (message de fermeture) */
    let changes = 0;
    /** Autre fiche chargée pendant que la fenêtre est ouverte : pas de message de fermeture */
    let otherSheet = false;
    // Bouton qui a ouvert la fenêtre (celui de l'encadré Historique est redessiné à chaque case cochée)
    const opener = document.activeElement;

    function toggle(tool, checked) {
        const current = store.get()[FIELD] ?? '';
        const next = checked ? addToolToText(current, tool.id) : removeToolFromText(current, tool.id);
        if (next === current) {
            // Rien n'a changé (cas rare) : la case reprend l'état du texte, sans rien annoncer
            refresh(store.get());
            return;
        }
        store.update({ [FIELD]: sanitizeRich(next) });
        changes++;
        // Tournure sans accord (« Cartes à jouer », « Flûte », « Outils de voleur »)
        const message = checked ? `Ajouté à la case Outils : ${tool.name}.` : `Retiré de la case Outils : ${tool.name}.`;
        said.textContent = message;
        setStatus(message);
    }

    function item(tool) {
        const box = el('input', {
            type: 'checkbox', class: 'round-check',
            on: { change: (event) => toggle(tool, event.target.checked) }
        });
        const li = el('li', { class: 'prep-item' },
            el('label', { class: 'prep-label' }, box,
                el('span', { class: 'prep-text' },
                    el('span', { class: 'prep-name', text: tool.name }),
                    el('small', { class: 'prep-note', text: `${toolAbilityName(tool)} · ${tool.use}` }))));
        entries.push({ tool, li, box });
        return li;
    }

    /** Étiquette d'avancement (« Noté », « 2 sur 3 »), remplie par refresh */
    const stateTag = () => el('span', { class: 'tools-source-state' });

    const section = (title, tools, extraClass = '', state = null) => el('section', { class: `prep-group ${extraClass}`.trim(), 'aria-label': title },
        el('h3', { class: 'prep-level' }, el('span', { text: title }), state),
        el('ul', { class: 'prep-items' }, tools.map(item)));

    const groups = toolGroups();
    const sections = [];
    /** Encadrés du haut : { section (featuredToolSections), state } */
    const featuredStates = [];
    // En tête : chaque outil donné par l'historique ou un don, ou la liste où il se choisit
    for (const entry of featured) {
        const state = stateTag();
        featuredStates.push({ section: entry, state });
        sections.push(section(entry.title, TOOLS.filter((tool) => entry.toolIds.includes(tool.id)), 'tools-featured', state));
    }
    // Une catégorie entière déjà en tête n'est pas répétée
    const shownAbove = new Set(featured.map((entry) => entry.categoryId).filter(Boolean));
    for (const group of groups) {
        if (shownAbove.has(group.id)) continue;
        sections.push(section(group.name, group.tools));
    }
    const listBox = el('div', { class: 'prep-list' }, sections);

    /** Lignes « D'où viennent vos outils » : { source, li, state } */
    const sourceRows = sources.map((source) => {
        const state = stateTag();
        const li = el('li', { class: 'tools-source' },
            el('span', { class: 'tools-source-title', text: source.title }),
            el('span', { class: 'tools-source-text', text: `${source.label}.` }),
            state);
        return { source, li, state };
    });
    // Le compte prend tous les outils cochés, ceux de la classe compris : dit quand une origine laisse un choix
    const countWarning = toolCountWarning(sources);
    const sourcesBox = sourceRows.length ? el('section', { class: 'tools-sources', 'aria-label': "D'où viennent vos outils" },
        el('h3', { class: 'prep-level', text: "D'où viennent vos outils" }),
        el('ul', { class: 'tools-source-list' }, sourceRows.map((row) => row.li)),
        el('p', { class: 'prep-hint muted', text: "Rien n'est coché tout seul : cochez vous-même les outils choisis. Vos autres outils (classe, espèce, appris en jeu) se cochent de la même façon." }),
        countWarning ? el('p', { class: 'prep-hint muted', text: countWarning }) : null) : null;

    const paint = (state, { status, done }) => {
        state.textContent = status;
        state.hidden = !status;
        state.dataset.done = String(done);
    };

    /** Cases cochées, compteur et avancement, d'après le texte de la case (après chaque changement, ici ou ailleurs) */
    function refresh(character) {
        const noted = new Set(toolsInText(character[FIELD]));
        for (const { tool, box } of entries) box.checked = noted.has(tool.id);
        counter.textContent = noted.size > 1 ? `${noted.size} outils cochés` : `${noted.size} outil coché`;
        const progress = toolSourceProgress(sources, character);
        sourceRows.forEach((row, index) => paint(row.state, progress[index]));
        for (const { section: entry, state } of featuredStates) paint(state, sectionProgress(entry, progress));
    }

    function applySearch() {
        let any = false;
        for (const { tool, li } of entries) {
            const shown = matchesToolQuery(tool, search.value);
            li.hidden = !shown;
            any ||= shown;
        }
        for (const group of listBox.children) {
            group.hidden = ![...group.querySelectorAll('.prep-item')].some((li) => !li.hidden);
        }
        noMatch.hidden = any;
    }
    search.addEventListener('input', applySearch);

    refresh(store.get());

    let unsubscribe = () => {};
    const close = openModal({
        title: 'Outils maîtrisés',
        icon: 'gear',
        wide: true,
        // Pas de clavier virtuel à l'ouverture sur tablette : le focus va au bouton Fermer
        focusField: false,
        body: [
            el('p', { class: 'prep-hint', text: 'Cochez les outils que votre personnage maîtrise : leur nom s\'écrit dans la case « Outils ». Décocher retire seulement ce nom et sa virgule : relisez la case si vous aviez écrit une phrase autour.' }),
            el('p', { class: 'prep-hint muted', text: 'Sous chaque outil : la caractéristique du test fait avec lui (vous y ajoutez votre bonus de maîtrise).' }),
            sourcesBox,
            el('div', { class: 'prep-controls' }, search, counter, said),
            listBox,
            noMatch
        ].filter(Boolean),
        actions: [{ label: 'Fermer', primary: true }],
        onClose: () => {
            unsubscribe();
            if (changes > 0 && !otherSheet) setStatus(`Case Outils : ${counter.textContent} dans la liste du manuel.`);
            // Le bouton de l'encadré Historique a été redessiné : le focus revient sur le nouveau
            if (opener instanceof HTMLElement && !opener.isConnected && opener.closest('.origin-tool-pick')) {
                document.querySelector('.origin-tool-pick .tools-pick-btn')?.focus();
            }
        }
    });
    // Hauteur gardée pendant la recherche (comme « Préparer mes sorts », css/spells.css)
    const dialog = listBox.closest('dialog');
    if (dialog) {
        dialog.classList.add('modal-prep', 'modal-tools');
        dialog.style.setProperty('--prep-open-height', `${dialog.offsetHeight}px`);
    }
    unsubscribe = store.subscribe((character, changedKeys) => {
        // Autre fiche chargée : la fenêtre ne la concerne plus
        if (!changedKeys) {
            otherSheet = true;
            close();
        }
        else if (changedKeys.includes(FIELD)) refresh(character);
    });
}

/**
 * Bouton « Choisir dans la liste » (même présentation sous la case Outils et dans l'encadré
 * de l'historique).
 * @param {{ store: Object, setStatus: Function }} ctx
 * @returns {HTMLButtonElement}
 */
export function toolPickerButton(ctx) {
    return el('button', {
        type: 'button', class: 'btn-chip tools-pick-btn', 'aria-haspopup': 'dialog', title: TOOLS_PICK_HELP,
        on: { click: () => openToolPicker(ctx) }
    }, icon('plus'), el('span', { class: 'btn-label', text: 'Choisir dans la liste' }));
}

/**
 * Bouton et phrase d'aide sous la case « Outils » (visibles fiche déverrouillée seulement).
 * @param {{ root: HTMLElement, store: Object, setStatus: Function }} ctx
 */
export function initTools(ctx) {
    const host = ctx.root.querySelector('#tools-pick');
    if (!host) return;
    host.replaceChildren(
        toolPickerButton(ctx),
        el('small', { class: 'tools-pick-help', text: 'Cochez vos outils dans la liste du manuel : leur nom s\'écrit ici. Vous pouvez aussi écrire à la main.' }));
}
