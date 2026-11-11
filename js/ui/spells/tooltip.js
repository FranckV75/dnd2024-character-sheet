// =============================================================================
// SPELLS/TOOLTIP.JS - Infobulle d'un sort (survol et focus du nom ; fonctionne aussi verrouillé)
//
// Une seule infobulle pour tout le grimoire (lignes du tableau, sorts de dons, de sous-classe et
// d'espèce), ajoutée à la fin de la page. La description est affichée en texte brut
// (textContent), jamais en HTML. Le réglage allumé / éteint est propre à l'appareil (prefs.js).
// =============================================================================

import { el } from '../dom.js';
import { spellDisplayName, spellLevelLabel, descToPlainText, spellDamageTypes } from '../../rules/spells.js';
import { adeptElements, elementWord } from '../../rules/feat-choices.js';
import { readTooltipSetting, saveTooltipSetting } from './prefs.js';

/** « Adepte (feu) » : types d'Adepte élémentaire infligés par ce sort */
export function adeptTypes(spell, elements) {
    return spell && elements.length ? spellDamageTypes(spell).filter(type => elements.includes(type)) : [];
}

/** Règle d'Adepte élémentaire pour ces types (infobulle et repère) */
export function adeptRule(types) {
    const words = types.map(elementWord).join(', ');
    return `Adepte élémentaire (${words}) : quand ce sort inflige des dégâts de ce type, il ignore la Résistance à ces dégâts et un 1 sur un dé de dégâts compte comme un 2.`;
}

/**
 * Crée l'infobulle et ses écouteurs (toucher hors de l'infobulle, Échap).
 * @param {{ store: Object }} deps
 * @returns {{ enabled: boolean, setEnabled(on: boolean): void, showFor(anchor: HTMLElement, spell: Object): void,
 *   cancelHide(): void, scheduleHide(): void, hide(): void }}
 */
export function createSpellTooltip({ store }) {
    let enabled = readTooltipSetting();
    const tooltip = el('div', { class: 'spell-tooltip', id: 'spell-tooltip', role: 'tooltip', hidden: true });
    let hideTimer = null;
    let tooltipOwner = null;
    /** Le dernier toucher / clic a eu lieu dans l'infobulle */
    let touchedTooltip = false;

    function fillTooltip(spell) {
        const components = String(spell.components || '').split(/[\s,]+/).filter(Boolean).join(', ');
        const tags = [spell.concentration ? 'Concentration' : '', spell.ritual ? 'Rituel' : ''].filter(Boolean);
        const meta = [
            ['Temps d\'incantation', spell.castTime],
            ['Portée', spell.range],
            ['Durée', spell.duration],
            ['Composantes', components]
        ].filter(([, value]) => value);
        tooltip.replaceChildren(
            el('div', { class: 'spell-tooltip-head' },
                el('strong', { class: 'spell-tooltip-name', text: spellDisplayName(spell) }),
                el('span', { class: 'spell-tooltip-level', text: [spellLevelLabel(spell.level), spell.school].filter(Boolean).join(' · ') }),
                tags.length ? el('span', { class: 'spell-tooltip-tags', text: tags.join(' · ') }) : null),
            el('dl', { class: 'spell-tooltip-meta' }, meta.map(([label, value]) => el('div', {},
                el('dt', { text: label }), el('dd', { text: String(value) })))),
            el('p', { class: 'spell-tooltip-desc', text: descToPlainText(spell.desc) || 'Description non disponible.' }),
            ...adeptLine(spell));
    }

    /** Ligne Adepte élémentaire de l'infobulle (sort du type choisi) */
    function adeptLine(spell) {
        const types = adeptTypes(spell, adeptElements(store.get()));
        return types.length ? [el('p', { class: 'spell-tooltip-adept', text: adeptRule(types) })] : [];
    }

    /**
     * Au-dessus du nom s'il y a la place, sinon en dessous ; toujours entièrement dans la partie
     * visible de l'écran (clavier virtuel compris) : une longue description qui ne tient pas est
     * raccourcie à la place disponible et défile à l'intérieur de l'infobulle.
     */
    function positionTooltip(anchor) {
        const rect = anchor.getBoundingClientRect();
        const margin = 8;
        const viewportWidth = document.documentElement.clientWidth;
        const visual = window.visualViewport;
        const viewTop = visual ? visual.offsetTop : 0;
        const viewBottom = viewTop + (visual ? visual.height : window.innerHeight);
        tooltip.style.maxHeight = '';
        const natural = tooltip.offsetHeight;
        const above = rect.top - viewTop - 2 * margin;
        const below = viewBottom - rect.bottom - 2 * margin;
        const placeAbove = natural <= above || (natural > below && above > below);
        const room = placeAbove ? above : below;
        if (natural > room) tooltip.style.maxHeight = `${Math.max(120, Math.floor(room))}px`;
        const height = tooltip.offsetHeight;
        let top = placeAbove ? rect.top - height - margin : rect.bottom + margin;
        // Jamais au-dessus du haut de l'écran visible (très petit espace disponible)
        if (top < viewTop + margin) top = viewTop + margin;
        const left = Math.max(margin, Math.min(rect.left, viewportWidth - tooltip.offsetWidth - margin));
        tooltip.style.left = `${left + window.scrollX}px`;
        tooltip.style.top = `${top + window.scrollY}px`;
    }

    /** Infobulle d'un sort de la base, posée près de anchor (nom d'une ligne, sort de don) */
    function showFor(anchor, spell) {
        if (tooltipOwner && tooltipOwner !== anchor) tooltipOwner.removeAttribute('aria-describedby');
        fillTooltip(spell);
        tooltip.hidden = false;
        positionTooltip(anchor);
        tooltipOwner = anchor;
        anchor.setAttribute('aria-describedby', tooltip.id);
    }

    function hide() {
        clearTimeout(hideTimer);
        touchedTooltip = false;
        tooltip.hidden = true;
        if (tooltipOwner) tooltipOwner.removeAttribute('aria-describedby');
        tooltipOwner = null;
    }

    function scheduleHide() {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            // Pointeur ou doigt sur l'infobulle (lecture d'une longue description) : elle reste
            if (tooltip.matches(':hover') || touchedTooltip) return;
            // Le nom garde le focus : l'infobulle reste (accès au clavier)
            if (tooltipOwner && tooltipOwner === document.activeElement) return;
            hide();
        }, 150);
    }

    // Toucher / clic hors du nom et de l'infobulle : elle se ferme (sur tablette, elle ne doit
    // pas masquer les lignes du dessus ; le :hover « collant » d'iOS la garderait sinon).
    // Dans l'infobulle (faire défiler une longue description du doigt, sélectionner du texte
    // à la souris), elle reste ouverte.
    document.addEventListener('pointerdown', (event) => {
        const inside = !tooltip.hidden && tooltip.contains(event.target);
        // Au doigt, le nom perd le focus en touchant l'infobulle : elle ne doit pas se fermer pour autant
        touchedTooltip = inside && event.pointerType !== 'mouse';
        if (tooltip.hidden || event.target === tooltipOwner || inside) return;
        hide();
    }, true);
    tooltip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    tooltip.addEventListener('mouseleave', scheduleHide);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !tooltip.hidden) hide();
    });
    document.body.append(tooltip);

    return {
        get enabled() {
            return enabled;
        },
        setEnabled(on) {
            enabled = on;
            saveTooltipSetting(on);
        },
        showFor,
        cancelHide: () => clearTimeout(hideTimer),
        scheduleHide,
        hide
    };
}
