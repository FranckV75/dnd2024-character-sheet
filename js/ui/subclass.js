// =============================================================================
// SUBCLASS.JS - Capacités de sous-classe dans « Capacités de classe » (onglet Aptitudes & Traits)
//
// Liste les capacités atteintes de la sous-classe choisie (texte, niveau, ce que la fiche en
// fait), puis celles à venir, repliées. Seuls les menus de choix (lot 7 : option de Rage,
// manœuvres, école…) écrivent dans la fiche, dans la clé subclass_choices ; le champ libre
// « Capacités de classe » du joueur reste en dessous, inchangé.
// Règles et textes : js/rules/subclass-features.js, js/data/subclass-features.js,
// js/rules/subclass-choices.js, js/data/subclass-choices.js.
// =============================================================================

import { el, icon } from './dom.js';
import { derivedOf } from './derived.js';
import { subclassFeatures, automationKind, SUBCLASS_LEVEL } from '../rules/subclass-features.js';
import { subclassChoiceFields, setSubclassChoicePatch, stepSubclassChoicePatch } from '../rules/subclass-choices.js';
import { companionChoicePatch } from '../rules/subclass-companions.js';
import { isLocked } from './lock.js';
import { foldButton, bindFolding, applyFolds } from './fold.js';

/** Étiquette de ce que la fiche fait de la capacité */
const KIND_LABELS = { calc: 'Calculé', partial: 'En partie', reminder: 'Rappel' };

const SOURCE_LABELS = { PHB2024: 'Manuel des joueurs 2024', 'Odyssée': 'Odyssée des Seigneurs Dragons' };

/** « Niv. 3 » (le niveau du livre de l'Odyssée, s'il diffère, est dit sous le texte) */
function levelText(feature) {
    return `Niv. ${feature.level}`;
}

/**
 * Menus de choix d'une capacité (lot 7). Un choix de construction (manœuvres, école…) se verrouille
 * avec la fiche (data-build-control, lock.js) ; un choix de jeu (option de la Rage, aspect changé au
 * repos long) reste modifiable. Dans un groupe de menus (manœuvres), une option déjà prise ailleurs
 * est grisée.
 * @param {Object[]} fields - subclassChoiceFields() de cette capacité
 * @param {Object<string, string>} choice - derived.subclassChoices
 * @param {string} featureName
 * @returns {HTMLElement|null}
 */
function choiceControls(fields, choice, featureName) {
    if (!fields.length) return null;
    const locked = isLocked();
    return el('div', { class: 'feat-choices subclass-choices', role: 'group', 'aria-label': `Choix : ${featureName}` },
        fields.map(field => {
            const id = `subclass-choice-${field.key}`;
            const value = choice[field.key] ?? '';
            // Compteur (strophes de la Poésie épique) : « − [14] + », boutons de 44 px sous le doigt
            if (field.kind === 'number') return numberControl(field, value, id, locked);
            const takenElsewhere = new Set(field.group
                ? fields.filter(other => other.group === field.group && other.key !== field.key).map(other => choice[other.key]).filter(Boolean)
                : []);
            // Case à cocher (Révélation incarnée) : cochée = valeur de sa seule option
            if (field.toggle) {
                return el('div', { class: 'feat-choice subclass-choice-toggle' },
                    el('label', { class: 'subclass-choice-check' },
                        el('input', {
                            type: 'checkbox', id, class: 'round-check', 'data-subclass-choice': field.key,
                            'data-toggle-value': field.options[0][0], checked: value === field.options[0][0],
                            ...(field.inPlay ? {} : { 'data-build-control': 'true', disabled: locked })
                        }),
                        el('span', { text: field.label })),
                    field.when ? el('span', { class: 'subclass-choice-when', text: field.when }) : null);
            }
            return el('div', { class: field.wide ? 'feat-choice is-wide' : 'feat-choice' },
                el('label', { class: 'feat-choice-label', for: id, text: field.label }),
                el('select', {
                    id, class: 'input', 'data-subclass-choice': field.key,
                    ...(field.inPlay ? {} : { 'data-build-control': 'true', disabled: locked })
                },
                el('option', { value: '', text: '— Choisir —', selected: value === '' }),
                field.options.map(([optionValue, text]) => el('option', {
                    value: optionValue, text, selected: optionValue === value, disabled: takenElsewhere.has(optionValue)
                }))),
                field.when ? el('span', { class: 'subclass-choice-when', text: field.when }) : null);
        }));
}

/**
 * Compteur d'un choix (kind: 'number') : bouton « − », saisie, bouton « + ». Sans valeur, il affiche
 * le minimum. Un choix de jeu (inPlay) reste modifiable fiche verrouillée.
 */
function numberControl(field, value, id, locked) {
    const shown = value === '' ? String(field.min ?? 0) : value;
    const build = field.inPlay ? {} : { 'data-build-control': 'true', disabled: locked };
    const step = (delta, text, label) => el('button', {
        type: 'button', class: 'btn subclass-step', 'data-subclass-step': field.key, 'data-step': String(delta),
        'aria-label': label, text, ...build
    });
    return el('div', { class: 'feat-choice subclass-choice-number' },
        el('label', { class: 'feat-choice-label', for: id, text: field.label }),
        el('div', { class: 'subclass-stepper' },
            step(-1, '−', `${field.label} : retirer 1`),
            el('input', {
                id, type: 'number', class: 'input subclass-step-value', inputmode: 'numeric', 'data-subclass-choice': field.key,
                min: String(field.min ?? 0), max: String(field.max ?? 999), step: '1', value: shown, autocomplete: 'off', ...build
            }),
            step(1, '+', `${field.label} : ajouter 1`)),
        field.when ? el('span', { class: 'subclass-choice-when', text: field.when }) : null);
}

/** « Dans la fiche : … » sous une capacité ou une option choisie */
function automationLine(automation) {
    return el('p', { class: 'subclass-feature-auto' },
        icon('gear'), el('span', { text: `Dans la fiche : ${automation.text}${automation.partial ? ' Le reste : rappel seulement.' : ''}` }));
}

/** Une option (école du Philosophe) : nom, repère « Choisie », texte, et ce que la fiche en fait */
function optionLine(option, upcoming) {
    return el('li', { class: option.chosen ? 'subclass-option is-chosen' : 'subclass-option' },
        el('span', { class: 'subclass-feature-name', text: option.name }),
        option.chosen ? el('span', { class: 'subclass-option-tag', text: option.second ? 'Seconde école' : 'Choisie' }) : null,
        el('span', { class: 'subclass-option-text', text: ` : ${option.text}` }),
        option.automation && !upcoming ? automationLine(option.automation) : null);
}

/**
 * Options d'une capacité (écoles du Philosophe). Sans choix : toutes lisibles. Avec un choix :
 * l'option choisie (et la seconde école de l'Éclectisme) d'abord, les autres repliées dessous.
 */
function optionList(feature, upcoming) {
    if (!feature.options.length) return [];
    const chosen = feature.options.filter(option => option.chosen);
    const others = feature.options.filter(option => !option.chosen);
    const list = (items, label) => el('ul', { class: 'subclass-options', 'aria-label': label }, items.map(option => optionLine(option, upcoming)));
    if (!chosen.length) return [list(feature.options, `Options : ${feature.name}`)];
    return [
        list(chosen, `Choix : ${feature.name}`),
        others.length ? el('details', { class: 'subclass-options-others' },
            el('summary', { text: `Autres écoles, non choisies (${others.length})` }),
            list(others, `Autres options : ${feature.name}`)) : null
    ];
}

function featureItem(feature, { upcoming = false, fields = [], choice = {}, subclassKey = '' } = {}) {
    const kind = automationKind(feature);
    // Capacité atteinte : la pastille du niveau la replie (seul le titre reste), comme les dons
    return el('li', { class: 'subclass-feature', 'data-kind': kind, 'data-fold-key': upcoming ? null : `subclass:${subclassKey}.${feature.id}` },
        el('div', { class: 'subclass-feature-head' },
            upcoming
                ? el('span', { class: 'subclass-level', text: levelText(feature) })
                : foldButton(`${levelText(feature)}, ${feature.name}`, el('span', { text: levelText(feature) })),
            el('span', { class: 'subclass-feature-name', text: feature.name }),
            upcoming ? null : el('span', { class: 'feat-tag', 'data-kind': kind, text: KIND_LABELS[kind] })),
        el('p', { class: 'subclass-feature-text', text: feature.text }),
        upcoming ? null : choiceControls(fields.filter(field => field.feature === feature.id), choice, feature.name),
        feature.bookLevel ? el('p', {
            class: 'subclass-feature-note',
            text: `Niveau ${feature.bookLevel} dans le livre de l'Odyssée (règles de 2014) : la sous-classe s'obtient au niveau ${SUBCLASS_LEVEL} en 2024.`
        }) : null,
        feature.automation && !upcoming ? automationLine(feature.automation) : null,
        // Détail calculé (lot 7 : manœuvres choisies avec leurs chiffres…)
        feature.automation?.list?.length && !upcoming ? el('ul', { class: 'subclass-options subclass-auto-list', 'aria-label': `Détail : ${feature.name}` },
            feature.automation.list.map(line => el('li', { class: 'subclass-option-text', text: line }))) : null,
        ...optionList(feature, upcoming));
}

/** Phrase quand rien n'est à lister */
function emptyMessage(character, derived) {
    if (!derived.classSlug) return '';
    const typed = String(character.char_subclass ?? '').replace(/<[^>]*>/g, '').trim();
    if (typed) return `Sous-classe « ${typed} » non reconnue : choisissez-la dans le menu « Sous-classe » en haut de la fiche pour voir ses capacités.`;
    return derived.level >= SUBCLASS_LEVEL
        ? 'Choisissez une sous-classe dans le menu « Sous-classe » en haut de la fiche : ses capacités s\'afficheront ici.'
        : `La sous-classe s'obtient au niveau ${SUBCLASS_LEVEL} : ses capacités s'afficheront ici.`;
}

/**
 * Contenu du bloc pour un personnage (pur DOM, sans état). Les éléments ne sont construits
 * (nodes()) que si la signature a changé : pas à chaque frappe ailleurs dans la fiche.
 * @param {Object} character
 * @returns {{ nodes: () => Node[], signature: string, subclass?: string }}
 */
function build(character) {
    const derived = derivedOf(character);
    const { subclass, reached, upcoming } = subclassFeatures(derived);
    if (!subclass) {
        const message = emptyMessage(character, derived);
        return { signature: JSON.stringify(['empty', message]), nodes: () => (message ? [el('p', { class: 'subclass-empty', text: message })] : []) };
    }
    const fields = subclassChoiceFields(derived);
    const choice = derived.subclassChoices ?? {};
    // Options (écoles) : choisie ou non, et leur texte calculé (cases selon l'Intelligence…)
    const signature = JSON.stringify([subclass.key,
        reached.map(f => [f.id, f.automation?.text, f.automation?.list, f.options.map(o => [o.id, o.chosen, o.second, o.automation?.text])]),
        upcoming.map(f => f.id),
        fields.map(field => [field.key, field.inPlay]), choice]);
    const nodes = () => [
        // Titre : sa pastille replie tout le bloc (seul le titre reste)
        el('p', { class: 'subclass-title' }, icon('star'),
            el('span', { text: `Sous-classe : ${subclass.name}` }),
            foldButton(`Capacités de la sous-classe ${subclass.name}`),
            el('span', { class: 'subclass-source', text: SOURCE_LABELS[subclass.source] ?? subclass.source })),
        reached.length
            ? el('ul', { class: 'subclass-list' }, reached.map(feature => featureItem(feature, { fields, choice, subclassKey: subclass.key })))
            : el('p', { class: 'subclass-empty', text: `Aucune capacité avant le niveau ${upcoming[0]?.level ?? SUBCLASS_LEVEL}.` }),
        upcoming.length ? el('details', { class: 'subclass-upcoming' },
            el('summary', {}, icon('hourglass'), el('span', {
                text: `À venir : ${upcoming.length} capacité${upcoming.length > 1 ? 's' : ''} (niveau${upcoming.length > 1 ? 'x' : ''} ${[...new Set(upcoming.map(f => f.level))].join(', ')})`
            })),
            el('ul', { class: 'subclass-list' }, upcoming.map(feature => featureItem(feature, { upcoming: true })))) : null
    ].filter(Boolean);
    return { signature, nodes, subclass: subclass.key };
}

/**
 * @param {{ root: HTMLElement, store: Object }} ctx
 */
export function initSubclassFeatures({ root, store }) {
    const container = root.querySelector('#subclass-features');
    if (!container) return;
    let rendered = null;
    let current = '';
    // Toucher en cours sur « − » ou « + » d'un compteur : le bloc n'est pas reconstruit avant le clic
    // qui le termine. Sinon, une saisie validée en quittant la case (au même toucher) reconstruisait
    // le bloc et le bouton touché disparaissait : le clic était perdu.
    let pressing = false;
    let pending = false;
    let releaseTimer = null;
    const render = (character) => {
        if (pressing) {
            pending = true;
            return;
        }
        pending = false;
        const { signature, nodes: makeNodes, subclass = '' } = build(character);
        if (signature === rendered) return;
        rendered = signature;
        const nodes = makeNodes();
        // Blocs repliables ouverts (« À venir », « Autres écoles ») : rouverts si la sous-classe ne change pas
        const opened = subclass === current
            ? [...container.querySelectorAll('details[open]')].map(details => details.className) : [];
        current = subclass;
        // Menu de choix (ou bouton « − » / « + » d'un compteur) qui avait le focus : il le retrouve
        // après la reconstruction
        const active = container.contains(document.activeElement) ? document.activeElement : null;
        const focused = active?.dataset?.subclassChoice;
        const stepped = active?.dataset?.subclassStep ? [active.dataset.subclassStep, active.dataset.step] : null;
        container.replaceChildren(...nodes);
        container.hidden = nodes.length === 0;
        if (subclass) container.dataset.foldKey = `subclass:${subclass}`;
        else delete container.dataset.foldKey;
        applyFolds(container);
        for (const details of container.querySelectorAll('details')) {
            if (opened.includes(details.className)) details.open = true;
        }
        if (focused) container.querySelector(`[data-subclass-choice="${focused}"]`)?.focus();
        else if (stepped) container.querySelector(`[data-subclass-step="${stepped[0]}"][data-step="${stepped[1]}"]`)?.focus();
    };
    // Pastilles de repli (bloc entier et chaque capacité), retenues sur cet appareil (fold.js)
    bindFolding(container);
    const stepInput = (button) => button.closest('.subclass-stepper')?.querySelector('input[data-subclass-choice]') ?? null;
    // Compteur : un toucher sur « − » ou « + » garde le focus dans la case si elle l'a (pas de
    // validation entre l'appui et le clic) et suspend la reconstruction du bloc jusqu'au clic ; si le
    // clic ne vient pas (doigt glissé hors du bouton), le bloc est remis à jour peu après.
    const unpress = (delay) => {
        clearTimeout(releaseTimer);
        releaseTimer = setTimeout(() => {
            pressing = false;
            if (pending) render(store.get());
        }, delay);
    };
    container.addEventListener('pointerdown', (event) => {
        const button = event.target.closest('button[data-subclass-step]');
        if (!button) return;
        if (stepInput(button) === document.activeElement) event.preventDefault();
        pressing = true;
        // Filet de sécurité : jamais plus de quelques secondes sans affichage à jour
        unpress(3000);
    });
    container.addEventListener('mousedown', (event) => {
        const button = event.target.closest('button[data-subclass-step]');
        if (button && stepInput(button) === document.activeElement) event.preventDefault();
    });
    // Doigt levé n'importe où (même hors du bloc) : le clic, s'il vient, arrive dans ce délai
    const release = () => {
        if (pressing) unpress(800);
    };
    for (const type of ['pointerup', 'pointercancel']) document.addEventListener(type, release);
    // Compteur (strophes) : « − » et « + » ajoutent -1 ou +1, entre le minimum et le maximum, en partant
    // du nombre affiché dans la case (tapé juste avant, même pas encore validé)
    container.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-subclass-step]');
        if (!button) return;
        clearTimeout(releaseTimer);
        pressing = false;
        if (!current || (button.dataset.buildControl && isLocked())) {
            if (pending) render(store.get());
            return;
        }
        const character = store.get();
        const input = stepInput(button);
        const key = button.dataset.subclassStep;
        const patch = stepSubclassChoicePatch(character, derivedOf(character), key, Number(button.dataset.step), input?.value);
        const next = patch.subclass_choices?.[current]?.[key];
        // La saisie est reprise dans le pas : la case affiche le résultat avant la reconstruction, sans
        // changement en attente (sinon, retirée avec le focus, elle validerait encore l'ancien nombre)
        if (input && next !== undefined) input.value = next;
        if (Object.keys(patch).length) store.update(patch);
        // Rien de changé (borne atteinte) mais une saisie enregistrée pendant l'appui : affichage à jour
        if (pending) render(store.get());
    });
    // Un choix modifié (menu ou case à cocher) : enregistré dans subclass_choices (rien d'autre ne change)
    container.addEventListener('change', (event) => {
        const control = event.target.closest('[data-subclass-choice]');
        if (!control || !current || (control.dataset.buildControl && isLocked())) return;
        const value = control.type === 'checkbox' ? (control.checked ? control.dataset.toggleValue : '') : control.value;
        const character = store.get();
        // Compteur vidé (ou saisie illisible, que le navigateur rend vide) : rien n'est effacé
        const patch = control.type === 'number' && value.trim() === ''
            ? {} : setSubclassChoicePatch(character, current, control.dataset.subclassChoice, value);
        // Nouvelle bête primordiale (lot 7) : PV pleins, ses PV enregistrés sont effacés
        if (Object.keys(patch).length) store.update({ ...patch, ...companionChoicePatch(character, current, control.dataset.subclassChoice) });
        // Compteur : la saisie affiche la valeur retenue (ramenée dans la plage, ou ancienne valeur si
        // la saisie est illisible), même quand l'enregistrement ne change rien
        if (control.type === 'number') {
            const kept = derivedOf(store.get()).subclassChoices?.[control.dataset.subclassChoice];
            control.value = kept ?? control.min ?? '0';
        }
    });
    render(store.get());
    store.subscribe((character) => render(character));
}
