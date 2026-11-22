// =============================================================================
// SPELLS/BOOK.JS - Livre de sorts du Magicien dans le grimoire (js/rules/spellbook.js)
//
//  - Ligne « Livre : N sorts · M sans dépense » sous la barre : sorts du livre notés comparés
//    aux sorts obtenus sans dépense, d'où ils viennent et le coût d'une copie. Simple repère,
//    jamais en rouge : copier des sorts trouvés ou achetés est permis. Masquée au combat par
//    spells.css (la vue sert à lancer des sorts), imprimée dans tous les cas.
//  - Vue « au combat » : les rituels du livre non préparés (Savoir rituel) quittent le tableau
//    pour une ligne repliable « Rituels du livre (N) » dessous, repliée par défaut ; dépliés,
//    chacun garde son bouton « Lancer », en rituel seulement. Écran seulement.
//  - Lit : les lignes de sorts et les valeurs calculées que lui passe renderRows
//    (js/ui/spells.js), la base de sorts (g.spellsDb) pour l'infobulle.
//  - Écrit : le choix déplié / replié, retenu sur l'appareil (spells/prefs.js) ; rien dans la
//    fiche (le bouton « Lancer » passe par spells/cast.js).
// =============================================================================

import { plainText, findSpellByName, rowLevel } from '../../rules/spells.js';
import { hasSpellbook, freeSpellbookSpells, spellbookCount, spellCopyCost } from '../../rules/spellbook.js';
import { el, icon } from '../dom.js';
import { readBookRitualsOpen, saveBookRitualsOpen } from './prefs.js';
import { castRowAt } from './cast.js';

/** Ligne « Rituels du livre » (vue au combat) : infobulle (souris), phrase écrite dans le bloc
 *  déplié, et phrase courte dans la barre du haut quand on la touche (tablette) */
const BOOK_RITUALS_HELP = 'Sorts de votre livre non préparés : ils se lancent seulement en rituel (10 minutes de plus, sans emplacement).';
const BOOK_RITUALS_TAP = {
    open: 'Rituels du livre : sorts non préparés, lançables seulement en rituel (+10 min, sans emplacement).',
    closed: 'Rituels du livre repliés : touchez la ligne pour les revoir.'
};

/**
 * @param {import('./context.js').Grimoire} g
 * @returns {{ note: HTMLElement, rituals: HTMLElement,
 *   renderNote(rows: Object[], d: Object, granted: Set<string>): void,
 *   renderRituals(items: Array<{ index: number, row: Object }>): void }}
 *   note : ligne « Livre : N sorts » ; rituals : ligne repliable « Rituels du livre »
 */
export function createSpellbook(g) {
    const { tooltip, setStatus } = g;

    // Magicien : sorts du livre notés, sorts obtenus sans dépense, coût de copie (simple repère)
    const bookCount = el('span', { class: 'spellbook-count' });
    const bookHelp = el('span', { class: 'spellbook-help' });
    const bookNote = el('p', { class: 'spellbook-note', hidden: true }, bookCount, bookHelp);

    /**
     * Magicien : « Livre : 15 sorts · 17 sans dépense », puis d'où viennent ces sorts et le coût
     * d'une copie.
     */
    function renderNote(rows, d, granted) {
        bookNote.hidden = !hasSpellbook(d.classSlug);
        if (bookNote.hidden) return;
        const count = spellbookCount(rows, granted);
        const free = freeSpellbookSpells(d.level, d.subclass);
        const cost = spellCopyCost(d);
        const countText = `Livre : ${count} sort${count > 1 ? 's' : ''} · ${free.total} sans dépense`;
        const sources = [`${free.start} au départ`];
        if (free.byLevel) sources.push(`+${free.byLevel} des niveaux gagnés`);
        if (free.savant) sources.push(`+${free.savant} ${free.savantName}`);
        const helpText = ` (${sources.join(', ')}) ; les sorts copiés (trouvés, achetés) s'y ajoutent. `
            + `Copier un sort : ${cost.copy.hours} h et ${cost.copy.gold} po par niveau du sort${cost.halved ? ' (Cynisme)' : ''} ; `
            + `copie de secours : ${cost.backup.hours} h et ${cost.backup.gold} po par niveau.`;
        if (bookCount.textContent !== countText) bookCount.textContent = countText;
        if (bookHelp.textContent !== helpText) bookHelp.textContent = helpText;
    }

    // -----------------------------------------------------------------------
    // Vue au combat : ligne repliable « Rituels du livre (N) » sous le tableau
    // -----------------------------------------------------------------------

    let bookRitualsOpen = readBookRitualsOpen();
    let bookRitualsSignature = null;
    const bookRitualsLabel = el('span', { class: 'btn-label' });
    const bookRitualsList = el('ul', { class: 'feat-spells-list' });
    const bookRitualsBody = el('div', { class: 'book-rituals-body', id: 'book-rituals-body' },
        el('p', { class: 'feat-spells-intro', text: BOOK_RITUALS_HELP }), bookRitualsList);
    const bookRitualsToggle = el('button', {
        type: 'button', class: 'book-rituals-toggle', 'aria-controls': 'book-rituals-body', title: BOOK_RITUALS_HELP,
        on: {
            click: () => {
                bookRitualsOpen = !bookRitualsOpen;
                saveBookRitualsOpen(bookRitualsOpen);
                tooltip.hide();
                applyBookRitualsFold();
                setStatus(bookRitualsOpen ? BOOK_RITUALS_TAP.open : BOOK_RITUALS_TAP.closed);
            }
        }
    }, icon('book'), bookRitualsLabel, icon('chevron'));
    const bookRituals = el('section', { class: 'feat-spells book-rituals', hidden: true },
        el('h4', { class: 'feat-spells-title' }, bookRitualsToggle), bookRitualsBody);

    function applyBookRitualsFold() {
        bookRitualsToggle.setAttribute('aria-expanded', String(bookRitualsOpen));
        bookRitualsBody.hidden = !bookRitualsOpen;
        bookRituals.classList.toggle('is-open', bookRitualsOpen);
    }

    /** Un rituel du livre : nom (infobulle), niveau, temps et portée, bouton « Lancer » en rituel */
    function bookRitualLine({ index, row }) {
        const name = el('button', { type: 'button', class: 'feat-spell-name', text: plainText(row.name) || 'Sort sans nom' });
        const show = () => {
            const known = findSpellByName(g.spellsDb, row.name);
            if (!tooltip.enabled || !known) return;
            tooltip.cancelHide();
            tooltip.showFor(name, known);
        };
        name.addEventListener('mouseenter', show);
        name.addEventListener('focus', show);
        name.addEventListener('click', show);
        name.addEventListener('mouseleave', tooltip.scheduleHide);
        name.addEventListener('blur', tooltip.scheduleHide);
        const facts = [plainText(row.time), plainText(row.range)].filter(Boolean).join(' · ');
        return el('li', { class: 'feat-spell' },
            el('div', { class: 'feat-spell-head' },
                name,
                el('span', { class: 'feat-spell-level', text: `Niveau ${rowLevel(row)}` }),
                facts ? el('span', { class: 'book-ritual-facts', text: facts }) : null,
                el('button', {
                    type: 'button', class: 'btn-chip spell-cast feat-spell-cast', title: 'Lancer en rituel',
                    'aria-label': `Lancer en rituel le sort ${plainText(row.name)}`,
                    on: { click: () => castRowAt(g, index, 'ritual') }
                }, icon('sparkle'), el('span', { class: 'btn-label', text: 'Lancer' }))));
    }

    /**
     * @param {Array<{ index: number, row: Object }>} items - rituels du livre à ranger sous la
     *        ligne (vue au combat, filtre de niveau appliqué), dans l'ordre du tableau
     */
    function renderRituals(items) {
        bookRituals.hidden = items.length === 0;
        const signature = JSON.stringify(items.map(({ index, row }) => [index, row.name, rowLevel(row), row.time, row.range]));
        if (signature !== bookRitualsSignature) {
            bookRitualsSignature = signature;
            const label = `Rituels du livre (${items.length})`;
            if (bookRitualsLabel.textContent !== label) bookRitualsLabel.textContent = label;
            bookRitualsList.replaceChildren(...items.map(bookRitualLine));
        }
        applyBookRitualsFold();
    }

    return { note: bookNote, rituals: bookRituals, renderNote, renderRituals };
}
