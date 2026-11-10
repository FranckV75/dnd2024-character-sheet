// =============================================================================
// LEVEL-UP.JS (interface) - Bouton « Passer au niveau N » près du Niveau, et sa fenêtre
//
// La fenêtre liste ce qui change (js/rules/level-up.js : PV, maîtrise, dons, classe, sous-classe,
// sorts), fait choisir les PV gagnés (valeur fixe du manuel ou résultat du dé), puis applique le
// niveau et les PV maximum en une seule modification, après une sauvegarde de secours
// (« Avant une montée de niveau », écran « Revenir à… »).
// Bouton masqué fiche verrouillée (edit-only) et au niveau 20.
// =============================================================================

import { el, icon, signed } from './dom.js';
import { openModal } from './modal.js';
import { planLevelUp, hitPointGain, levelUpPatch } from '../rules/level-up.js';

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void, keepSnapshot?: (reason: string) => void }} ctx
 */
export function initLevelUp({ root, store, setStatus, keepSnapshot }) {
    const field = root.querySelector('#f-char_level')?.closest('.field');
    if (!field) return;
    const button = el('button', {
        type: 'button', class: 'btn-icon level-up-btn edit-only', 'aria-haspopup': 'dialog',
        on: { click: () => openLevelUp(store, setStatus, keepSnapshot) }
    }, icon('plus'));
    // Case et bouton sur une même ligne : le bouton ne recouvre ni le libellé ni la case
    const input = field.querySelector('#f-char_level');
    const row = el('div', { class: 'level-input-row' });
    input.before(row);
    row.append(input, button);

    const render = (character) => {
        const plan = planLevelUp(character);
        button.hidden = !plan.canLevel;
        if (!plan.canLevel) return;
        const label = `Passer au niveau ${plan.to}`;
        button.setAttribute('aria-label', label);
        button.title = `${label} : ce qui change, puis niveau et PV maximum mis à jour`;
    };
    store.subscribe((character, changedKeys) => {
        if (changedKeys === null || changedKeys.some((key) => ['char_level', 'char_class'].includes(key))) render(character);
    });
    render(store.get());
}

/** Bloc « Points de vie » : choix fixe / dé, résultat en direct */
function hitPointsBlock(plan, onChange) {
    const { hp } = plan;
    const name = `hp-mode-${plan.to}`;
    const con = signed(hp.conMod);
    const fixedRadio = el('input', { type: 'radio', class: 'round-check', name, value: 'fixed', checked: hp.fixed !== null, disabled: hp.fixed === null });
    const rollRadio = el('input', { type: 'radio', class: 'round-check', name, value: 'roll', checked: hp.fixed === null });
    const rollInput = el('input', {
        type: 'number', class: 'input level-up-roll', min: '1', max: hp.faces ? String(hp.faces) : null,
        inputmode: 'numeric', 'aria-label': hp.faces ? `Résultat de votre d${hp.faces}` : 'Résultat de votre dé de vie'
    });
    const current = el('input', { type: 'checkbox', class: 'round-check' });
    const result = el('p', { class: 'level-up-result', 'aria-live': 'polite' });

    const choice = () => ({
        mode: rollRadio.checked ? 'roll' : 'fixed',
        roll: rollInput.value,
        addToCurrent: current.checked
    });
    const update = () => {
        const gain = hitPointGain(hp, choice());
        if (gain === null) result.textContent = rollRadio.checked ? 'Indiquez le résultat de votre dé.' : '';
        else if (hp.maxIsNumber) result.textContent = `PV maximum : ${hp.oldMax} → ${hp.oldMax + gain} (+${gain}).`;
        else if (hp.oldMax === null) result.textContent = `PV gagnés : +${gain}. La case PV maximum est vide : remplissez-la vous-même.`;
        else result.textContent = `PV gagnés : +${gain}. Votre case PV maximum contient du texte : ajoutez-les vous-même.`;
        onChange();
    };
    for (const input of [fixedRadio, rollRadio, current]) input.addEventListener('change', update);
    rollInput.addEventListener('input', () => {
        rollRadio.checked = true;
        update();
    });

    const bonusText = hp.bonuses.length
        ? ` + ${hp.bonuses.map((bonus) => `${bonus.value} (${bonus.name})`).join(' + ')}`
        : '';
    const die = hp.faces ? `d${hp.faces}` : 'dé de vie';
    const block = el('section', { class: 'level-up-section level-up-hp' },
        el('h3', { class: 'level-up-title', text: 'Points de vie' }),
        el('label', { class: 'level-up-option' }, fixedRadio,
            el('span', { text: hp.fixed !== null ? `Valeur fixe : ${hp.fixed} ${con} (Constitution)${bonusText}` : 'Valeur fixe : dé de vie inconnu (choisissez la classe ou le dé de vie)' })),
        el('label', { class: 'level-up-option' }, rollRadio,
            el('span', { text: `Mon jet de ${die} :` }), rollInput,
            el('span', { text: ` ${con} (Constitution)${bonusText}` })),
        el('p', { class: 'muted', text: 'Le total gagné vaut au moins 1 avant les bonus.' }),
        hp.currentIsNumber ? el('label', { class: 'level-up-option' }, current, el('span', { text: 'Ajouter aussi ces PV aux PV actuels' })) : null,
        result);
    update();
    return { block, choice };
}

function openLevelUp(store, setStatus, keepSnapshot) {
    const plan = planLevelUp(store.get());
    // Fiche remplacée (autre onglet, compte, import) ou données du calcul modifiées pendant que la
    // fenêtre est ouverte : on n'applique pas un calcul périmé
    let changed = false;
    const watched = new Set(['char_level', 'char_class', 'char_subclass', 'char_species', 'hd_type', 'con_score', 'hp_max', 'hp_current']);
    const unsubscribe = store.subscribe((state, changedKeys) => {
        if (changedKeys === null || changedKeys.some((key) => watched.has(key) || key.startsWith('feat_'))) changed = true;
    });
    if (!plan.canLevel) {
        unsubscribe();
        setStatus(plan.reason);
        return;
    }
    const message = el('p', { class: 'toolbar-modal-msg', role: 'alert' });
    const hpBlock = hitPointsBlock(plan, () => {
        message.textContent = '';
        message.classList.remove('is-error');
    });
    const sections = plan.sections.map((section) => el('section', { class: 'level-up-section' },
        el('h3', { class: 'level-up-title', text: section.title }),
        el('ul', {}, ...section.lines.map((line) => el('li', { text: line })))));

    openModal({
        title: `Passer au niveau ${plan.to}`,
        icon: 'star',
        wide: true,
        focusField: false,
        body: [hpBlock.block, ...sections, message],
        onClose: unsubscribe,
        actions: [
            { label: 'Annuler' },
            {
                label: `Passer au niveau ${plan.to}`,
                primary: true,
                onClick: () => {
                    const choice = hpBlock.choice();
                    if (choice.mode === 'roll' && hitPointGain(plan.hp, choice) === null) {
                        message.textContent = plan.hp.faces
                            ? `Indiquez le résultat de votre d${plan.hp.faces} (entre 1 et ${plan.hp.faces}), ou choisissez la valeur fixe.`
                            : 'Indiquez le résultat de votre dé de vie.';
                        message.classList.add('is-error');
                        return false;
                    }
                    if (changed) {
                        message.textContent = 'La fiche a changé pendant que cette fenêtre était ouverte : fermez-la puis rouvrez-la.';
                        message.classList.add('is-error');
                        return false;
                    }
                    keepSnapshot?.('level-up');
                    store.update(levelUpPatch(plan, choice));
                    setStatus(`Niveau ${plan.to} atteint. Pensez aux choix listés (dons, sous-classe, sorts).`);
                    return true;
                }
            }
        ]
    });
}
