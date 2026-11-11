// =============================================================================
// SPELLS/FILTERS.JS - Barre du grimoire : filtre de niveau, liste de sorts de l'auto-complétion,
// bouton des infobulles, compteur de sorts
//
// Le filtre de niveau ne change que l'affichage (view.level) ; la liste de sorts choisie est
// enregistrée dans la fiche (spell_class_filter, clé v3).
// =============================================================================

import { SPELL_CLASS_OPTIONS, SPELL_LEVELS, effectiveSpellClass } from '../../rules/spells.js';
import { el, icon } from '../dom.js';

/**
 * @param {{ store: Object, view: { level: string }, tooltip: Object, onLevel: () => void }} deps
 *   onLevel : appelé après le choix d'un niveau (view.level déjà changé), pour réafficher
 * @returns {{ toolbar: HTMLElement, countOut: HTMLOutputElement, renderChips(): void,
 *   renderClassFilter(character: Object, d: Object): void }}
 */
export function createSpellFilters({ store, view, tooltip, onLevel }) {
    const levelChips = ['', ...SPELL_LEVELS].map(level => el('button', {
        type: 'button', class: 'btn-chip', 'data-level': level, 'aria-pressed': 'false',
        'aria-label': level === '' ? 'Tous les niveaux' : level === '0' ? 'Sorts mineurs (niveau 0)' : `Niveau ${level}`,
        text: level === '' ? 'Tous' : level,
        on: {
            click: () => {
                view.level = level;
                onLevel();
            }
        }
    }));

    const classSelect = el('select', {
        id: 'spell-class-filter', class: 'input spell-class-select',
        title: 'Liste de sorts proposée par l\'auto-complétion du nom',
        on: { change: () => store.update({ spell_class_filter: classSelect.value }) }
    });

    const tooltipBtn = el('button', {
        type: 'button', class: 'btn-icon spell-tooltip-toggle', 'aria-pressed': String(tooltip.enabled),
        'aria-label': 'Infobulles des sorts',
        title: 'Afficher la description d\'un sort au survol ou au focus de son nom',
        on: {
            click: () => {
                tooltip.setEnabled(!tooltip.enabled);
                tooltipBtn.setAttribute('aria-pressed', String(tooltip.enabled));
                if (!tooltip.enabled) tooltip.hide();
            }
        }
    }, icon('chat'));

    const countOut = el('output', { class: 'spell-count', 'aria-live': 'polite' });

    const toolbar = el('div', { class: 'spells-toolbar' },
        el('div', { class: 'spell-level-chips btn-segments', role: 'group', 'aria-label': 'Filtrer les sorts par niveau' }, levelChips),
        el('div', { class: 'spell-class-filter' },
            el('label', { for: 'spell-class-filter', text: 'Liste de sorts' }),
            classSelect),
        tooltipBtn,
        countOut);

    function renderChips() {
        for (const chip of levelChips) chip.setAttribute('aria-pressed', String(chip.dataset.level === view.level));
    }

    function renderClassFilter(character, d) {
        const value = String(character.spell_class_filter || '');
        const own = SPELL_CLASS_OPTIONS.find(([slug]) => slug === effectiveSpellClass('', d.classSlug, d.subclass));
        const firstLabel = own ? `Classe du personnage (${own[1]})` : 'Toutes les classes';
        if (classSelect.options.length === 0) {
            classSelect.replaceChildren(el('option', { value: '', text: firstLabel }),
                ...SPELL_CLASS_OPTIONS.map(([slug, label]) => el('option', { value: slug, text: label })));
        } else if (classSelect.options[0].textContent !== firstLabel) {
            classSelect.options[0].textContent = firstLabel;
        }
        classSelect.value = SPELL_CLASS_OPTIONS.some(([slug]) => slug === value) ? value : '';
    }

    return { toolbar, countOut, renderChips, renderClassFilter };
}
