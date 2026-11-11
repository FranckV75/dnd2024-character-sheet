// =============================================================================
// SPELLS/GRANTED.JS - Sorts donnés à la fiche, en lecture seule au-dessus du tableau du grimoire
//
//  - Sorts de dons (lot 6, js/rules/feat-spells.js) : calculés d'après les dons et leurs choix
//    (onglet Aptitudes & Traits). Chaque groupe donne le DD et l'attaque de la caractéristique du
//    don ; les cases « lancer gratuit » sont des contrôles de JEU (utilisables verrouillé).
//  - Sorts de sous-classe (js/rules/subclass-features.js, données js/data/subclass-spells.js) :
//    serments du Paladin, Cercle de la Terre… ; un sort aussi noté dans la liste porte un repère.
//  - Sorts d'espèce (js/rules/species.js) : lancers gratuits cochés dans subclass_uses (mêmes
//    cases que dans l'onglet Combat).
// Jamais écrits dans dynamic_spells : on ne peut pas les effacer par erreur. Chaque bloc n'est
// reconstruit que si son contenu change ; les cases cochées sont remises à jour sur place.
// =============================================================================

import { spellLevelLabel } from '../../rules/spells.js';
import { featSpellGroups, setFeatSpellUsePatch } from '../../rules/feat-spells.js';
import { subclassSpells, subclassFeatures, markListedSpells } from '../../rules/subclass-features.js';
import { speciesView, speciesCounterDefs } from '../../rules/species.js';
import { subclassUsesState, setSubclassUsesPatch } from '../../rules/subclass-uses.js';
import { HUMAN_FEAT_SLOT } from '../../state/schema.js';
import { el, icon, signed } from '../dom.js';
import { foldButton, bindFolding, applyFolds } from '../fold.js';

/**
 * @param {{ store: Object, tooltip: Object, getSpellsDb: () => Object[] }} deps
 * @returns {{ featBox: HTMLElement, subclassBox: HTMLElement, speciesBox: HTMLElement,
 *   render(character: Object, d: Object): void }}
 */
export function createGrantedSpells({ store, tooltip, getSpellsDb }) {
    // Repliables (pastille à chevron du titre, fold.js) : seul le titre reste, retenu sur cet appareil
    const featBox = el('section', { class: 'feat-spells', 'aria-labelledby': 'feat-spells-title', 'data-fold-key': 'feat-spells', hidden: true });
    bindFolding(featBox);
    let featSignature = null;

    const subclassBox = el('section', { class: 'feat-spells subclass-spells', 'aria-labelledby': 'subclass-spells-title', 'data-fold-key': 'subclass-spells', hidden: true });
    bindFolding(subclassBox);
    let subclassSignature = null;

    const speciesBox = el('section', { class: 'feat-spells species-spells', 'aria-labelledby': 'species-spells-title', 'data-fold-key': 'species-spells', hidden: true });
    bindFolding(speciesBox);
    let speciesSignature = null;

    function featSpellLine(spell) {
        const name = el('button', { type: 'button', class: 'feat-spell-name', text: spell.name });
        const show = () => {
            const entry = getSpellsDb().find(s => s.vo === spell.vo);
            if (!tooltip.enabled || !entry) return;
            tooltip.cancelHide();
            tooltip.showFor(name, entry);
        };
        name.addEventListener('mouseenter', show);
        name.addEventListener('focus', show);
        name.addEventListener('click', show);
        name.addEventListener('mouseleave', tooltip.scheduleHide);
        name.addEventListener('blur', tooltip.scheduleHide);
        const free = spell.free
            ? el('label', { class: 'feat-spell-free' },
                el('input', {
                    type: 'checkbox', class: 'round-check', 'data-play': 'true', 'data-feat-spell-use': spell.free.key,
                    checked: spell.free.used,
                    'aria-label': `${spell.name} : lancer gratuit utilisé`,
                    on: { change: (event) => store.update(setFeatSpellUsePatch(store.get(), spell.free.key, event.target.checked)) }
                }),
                el('span', { text: spell.free.text }))
            : null;
        const details = [spell.slotText ? `Toujours préparé ; ${spell.slotText}.` : '', spell.note].filter(Boolean).join(' ');
        return el('li', { class: 'feat-spell' },
            el('div', { class: 'feat-spell-head' },
                name,
                el('span', { class: 'feat-spell-level', text: spellLevelLabel(spell.level) }),
                spell.ritual ? el('span', { class: 'feat-spell-tag', text: 'Rituel' }) : null,
            spell.listed ? el('span', { class: 'feat-spell-tag', 'data-kind': 'listed', text: 'Aussi dans votre liste' }) : null),
            free,
            details ? el('p', { class: 'feat-spell-note', text: details }) : null);
    }

    // -----------------------------------------------------------------------
    // Sorts de dons (lot 6)
    // -----------------------------------------------------------------------

    function featGroup(group) {
        const stats = group.dc === null
            ? el('span', { class: 'feat-spells-stats is-missing', text: 'Caractéristique à choisir sous le don' })
            : el('span', { class: 'feat-spells-stats', text: `${group.abilityName} · DD ${group.dc} · attaque ${signed(group.attack)}` });
        return el('div', { class: 'feat-spells-group', 'data-feat': group.featId },
            el('div', { class: 'feat-spells-head' },
                el('strong', { class: 'feat-spells-name', text: group.featName }),
                el('span', { class: 'feat-spells-slot', text: group.level === HUMAN_FEAT_SLOT ? 'Don niv. 1 · Humain' : `Don niv. ${group.level}` }),
                stats),
            group.spells.length ? el('ul', { class: 'feat-spells-list' }, group.spells.map(featSpellLine)) : null,
            ...group.extras.map(extra => el('p', { class: 'feat-spells-extra' },
                el('strong', { text: `${extra.label} : ` }), extra.text)),
            group.missing.length
                ? el('p', { class: 'feat-spells-missing', text: `À choisir sous le don (onglet Aptitudes & Traits) : ${group.missing.join(', ')}.` })
                : null,
            ...group.warnings.map(text => el('p', { class: 'feat-spells-warning', text })));
    }

    function renderFeatSpells(character, d) {
        const groups = featSpellGroups(character, d);
        featBox.hidden = groups.length === 0;
        // Les cases cochées ne reconstruisent pas le bloc : seul leur état change
        const signature = JSON.stringify(groups.map(g => ({ ...g, spells: g.spells.map(s => ({ ...s, free: s.free?.key ?? null })) })));
        if (signature !== featSignature) {
            featSignature = signature;
            featBox.replaceChildren(...(groups.length ? [
                el('h4', { class: 'feat-spells-title', id: 'feat-spells-title' }, icon('star'), el('span', { text: 'Sorts de dons' }),
                    foldButton('Sorts de dons')),
                el('p', { class: 'feat-spells-intro', text: "Donnés par vos dons : toujours préparés, ils ne comptent pas dans vos sorts préparés. Pour les changer, modifiez le choix sous le don." }),
                ...groups.map(featGroup)
            ] : []));
            applyFolds(featBox);
        }
        const used = new Map(groups.flatMap(g => g.spells.filter(s => s.free).map(s => [s.free.key, s.free.used])));
        for (const box of featBox.querySelectorAll('input[data-feat-spell-use]')) {
            const checked = used.get(box.dataset.featSpellUse) === true;
            if (box.checked !== checked) box.checked = checked;
        }
    }

    // -----------------------------------------------------------------------
    // Sorts de sous-classe (lot 2 des sous-classes : serments du Paladin) : toujours préparés,
    // hors du nombre de sorts préparés
    // -----------------------------------------------------------------------

    function renderSubclassSpells(character, d) {
        const { reached, upcoming, others = [] } = subclassSpells(d);
        const name = subclassFeatures(d).subclass?.name ?? '';
        const spells = markListedSpells(reached, character.dynamic_spells);
        const land = d.subclass === 'circle_of_the_land';
        // Terre choisie (lot 7) : un seul terrain affiché, les autres repliés dessous
        const chosenLand = land && others.length > 0;
        const otherGroups = [...new Set(others.map(spell => spell.group))];
        const othersListed = markListedSpells(others, character.dynamic_spells);
        // Niveaux à venir : « niveau 9 : Hâte, Protection contre l'énergie »
        // (Cercle de la Terre : « Boule de feu (Aride) »)
        const next = [...new Set(upcoming.map(spell => spell.classLevel))]
            .map(level => `niveau ${level} : ${upcoming.filter(spell => spell.classLevel === level)
                .map(spell => (spell.group ? `${spell.name} (${spell.group})` : spell.name)).join(', ')}`);
        // Sorts rangés par terrain (Cercle de la Terre), sinon une seule liste
        const groups = [...new Set(spells.map(spell => spell.group ?? ''))];
        const signature = JSON.stringify([name, spells, next, othersListed]);
        subclassBox.hidden = spells.length === 0;
        if (signature === subclassSignature) return;
        subclassSignature = signature;
        const list = (items) => el('ul', { class: 'feat-spells-list' }, items.map(featSpellLine));
        const groupBlock = (group, items) => el('div', { class: 'feat-spells-group' },
            el('div', { class: 'feat-spells-head' }, el('strong', { class: 'feat-spells-name', text: group })),
            list(items.filter(spell => spell.group === group)));
        let intro;
        if (spells.every(spell => /^Seulement en rituel/.test(spell.note ?? ''))) {
            // Voie du Cœur sauvage : rituels seulement
            intro = `Donnés par votre sous-classe (${name}) : lancés seulement en rituel, ils ne comptent pas dans vos sorts préparés.`;
        } else if (spells.every(spell => /^Une fois sans emplacement/.test(spell.note ?? ''))) {
            // Ascendance divine : sorts de l'ancêtre, lancés sans emplacement
            intro = `Donnés par votre sous-classe (${name}) : chacun se lance une fois sans emplacement, de nouveau après un repos court ou long ; ce ne sont pas des sorts préparés.`;
        } else {
            intro = `Donnés par votre sous-classe (${name}) : toujours préparés, ils ne comptent ni dans vos sorts préparés ni dans vos sorts mineurs.`
                + (land ? (chosenLand
                    ? ' Terre choisie à votre dernier repos long : seuls ses sorts sont préparés.'
                    : ' Seuls ceux du terrain choisi à votre dernier repos long sont préparés (choix dans l\'onglet Aptitudes & Traits).') : '');
        }
        subclassBox.replaceChildren(...(spells.length ? [
            el('h4', { class: 'feat-spells-title', id: 'subclass-spells-title' }, icon('star'), el('span', { text: 'Sorts de sous-classe' }),
                foldButton('Sorts de sous-classe')),
            el('p', { class: 'feat-spells-intro', text: intro }),
            ...(groups[0] ? groups.map(group => groupBlock(group, spells)) : [list(spells)]),
            otherGroups.length ? el('details', { class: 'subclass-spells-others' },
                el('summary', { text: `Autres terrains, pas préparés (${otherGroups.join(', ')})` }),
                ...otherGroups.map(group => groupBlock(group, othersListed))) : null,
            next.length ? el('p', { class: 'feat-spells-extra' }, el('strong', { text: 'À venir : ' }), `${next.join(' ; ')}.`) : null
        ].filter(Boolean) : []));
        applyFolds(subclassBox);
    }

    // -----------------------------------------------------------------------
    // Sorts d'espèce (4.36.0) : Lumière de l'Aasimar, sorts des lignages elfiques, des héritages
    // fiélons… Toujours préparés, hors du compte ; lancers gratuits cochés dans subclass_uses
    // (mêmes cases que dans l'onglet Combat, clé « species.sort_… »)
    // -----------------------------------------------------------------------

    function speciesFreeBoxes(def, used) {
        return el('span', { class: 'feat-spell-free species-spell-free' },
            ...Array.from({ length: def.max }, (_, index) => el('input', {
                type: 'checkbox', class: 'round-check', 'data-play': 'true', 'data-species-use': def.key, 'data-index': String(index),
                checked: index < used,
                'aria-label': `${def.label} : lancer gratuit ${def.max > 1 ? `${index + 1} ` : ''}utilisé`,
                // Même règle que les cases de l'onglet Combat : toucher la 3e coche les 3 premières,
                // décocher la 1re les vide toutes
                on: { change: (event) => {
                    store.update(setSubclassUsesPatch(store.get(), def.key, event.target.checked ? index + 1 : index, def.max));
                } }
            })),
            el('span', { text: `${def.max > 1 ? `${def.max} lancers` : '1 lancer'} sans emplacement, de nouveau après un ${def.reset === 'short' ? 'repos court ou long' : 'repos long'}` }));
    }

    function renderSpeciesSpells(character, d) {
        const view = speciesView(character, d);
        const spells = (view?.spells ?? []).filter(spell => spell.reached);
        const upcoming = (view?.spells ?? []).filter(spell => !spell.reached);
        const defs = speciesCounterDefs(character, d);
        const signature = JSON.stringify([view?.name, spells, upcoming.map(spell => spell.name), defs.map(def => [def.key, def.max])]);
        speciesBox.hidden = spells.length === 0;
        if (signature !== speciesSignature) {
            speciesSignature = signature;
            const abilityName = { int: 'Intelligence', wis: 'Sagesse', cha: 'Charisme' };
            const line = (spell) => {
                const item = featSpellLine({ name: spell.name, vo: spell.vo, level: spell.spellLevel });
                const def = defs.find(entry => entry.feature === spell.vo);
                const stats = spell.dc === null
                    ? el('p', { class: 'feat-spells-missing', text: 'Caractéristique à choisir dans « Espèce & historique » (onglet Aptitudes & Traits).' })
                    : el('p', { class: 'feat-spell-note', text: `${spell.source} · ${abilityName[spell.ability]} · DD ${spell.dc} · attaque ${signed(spell.attack)}` });
                item.append(...[def ? speciesFreeBoxes(def, 0) : null, stats].filter(Boolean));
                return item;
            };
            speciesBox.replaceChildren(...(spells.length ? [
                el('h4', { class: 'feat-spells-title', id: 'species-spells-title' }, icon('star'), el('span', { text: "Sorts d'espèce" }),
                    foldButton("Sorts d'espèce")),
                el('p', { class: 'feat-spells-intro', text: `Donnés par votre espèce (${view.name}) : toujours préparés, ils ne comptent ni dans vos sorts préparés ni dans vos sorts mineurs.` }),
                el('ul', { class: 'feat-spells-list' }, spells.map(line)),
                upcoming.length ? el('p', { class: 'feat-spells-extra' }, el('strong', { text: 'À venir : ' }),
                    `${upcoming.map(spell => `${spell.name} (niveau ${spell.level})`).join(', ')}.`) : null
            ].filter(Boolean) : []));
            applyFolds(speciesBox);
        }
        // Cases cochées ici ou dans l'onglet Combat : seul leur état change
        const state = subclassUsesState(character);
        for (const box of speciesBox.querySelectorAll('input[data-species-use]')) {
            const def = defs.find(entry => entry.key === box.dataset.speciesUse);
            const checked = Number(box.dataset.index) < Math.min(Number(state[box.dataset.speciesUse]) || 0, def?.max ?? 0);
            if (box.checked !== checked) box.checked = checked;
        }
    }

    return {
        featBox,
        subclassBox,
        speciesBox,
        render(character, d) {
            renderFeatSpells(character, d);
            renderSubclassSpells(character, d);
            renderSpeciesSpells(character, d);
        }
    };
}
