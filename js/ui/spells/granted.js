// =============================================================================
// SPELLS/GRANTED.JS - Sorts donnés à la fiche, en lecture seule au-dessus du tableau du grimoire
//
//  - Sorts de dons (lot 6, js/rules/feat-spells.js) : calculés d'après les dons et leurs choix
//    (onglet Aptitudes & Traits). Chaque groupe donne le DD et l'attaque de la caractéristique du
//    don ; les cases « lancer gratuit » sont des contrôles de JEU (utilisables verrouillé).
//  - Sorts de classe (js/rules/class-progression.js : classGrantedSpells) : Châtiment divin et
//    Appel de destrier du Paladin, Marque du chasseur du Rôdeur, Contact avec les plans de
//    l'Occultiste… ; leurs lancers sans emplacement ont une case (CLASS_COUNTERS de
//    js/rules/subclass-uses.js, mêmes cases que dans l'onglet Combat), ainsi que l'Arcanum mystique
//    de l'Occultiste (une case par niveau de sort).
//  - Sorts de sous-classe (js/rules/subclass-features.js, données js/data/subclass-spells.js) :
//    serments du Paladin, Cercle de la Terre… ; un sort aussi noté dans la liste porte un repère.
//  - Sorts d'espèce (js/rules/species.js) : lancers gratuits cochés dans subclass_uses (mêmes
//    cases que dans l'onglet Combat).
//  - Sorts choisis d'une capacité (js/rules/spell-choices.js, menus de spells/choices.js) :
//    Maîtrise des sorts et Sorts de prédilection du Magicien dans « Sorts de classe », Découvertes
//    magiques du Barde du Collège du Savoir dans « Sorts de sous-classe ». Seuls contrôles de ces
//    blocs qui écrivent un choix (clé facultative « subclass_choices »).
//  - Vue « au combat » : bouton « Lancer » sur chaque sort de niveau 1+ (fenêtre de spells/cast.js,
//    contrôle de jeu utilisable verrouillé ; affiché seulement au combat, par spells.css).
// Jamais écrits dans dynamic_spells : on ne peut pas les effacer par erreur. Chaque bloc n'est
// reconstruit que si son contenu change ; les cases cochées sont remises à jour sur place.
// =============================================================================

import { spellLevelLabel } from '../../rules/spells.js';
import { spellChoiceView } from '../../rules/spell-choices.js';
import { highestSlotLevel, givenSpellKeys } from '../../rules/spell-preparation.js';
import { spellChoiceGroup, keepChoiceFocus } from './choices.js';
import { featSpellGroups, setFeatSpellUsePatch } from '../../rules/feat-spells.js';
import { subclassSpells, subclassFeatures, markListedSpells } from '../../rules/subclass-features.js';
import { speciesView, speciesCounterDefs } from '../../rules/species.js';
import { subclassUsesState, setSubclassUsesPatch, subclassCounters } from '../../rules/subclass-uses.js';
import { classGrantedSpells } from '../../rules/class-progression.js';
import { CLASS_FREE_CASTS } from '../../rules/free-casts.js';
import { DD_RULES } from '../../data/dd-rules.js';
import { elementalAffinity } from '../../rules/subclass-combat.js';
import { affinityApplies } from './tooltip.js';
import { HUMAN_FEAT_SLOT } from '../../state/schema.js';
import { el, icon, signed } from '../dom.js';
import { foldButton, bindFolding, applyFolds } from '../fold.js';

/**
 * @param {{ store: Object, tooltip: Object, getSpellsDb: () => Object[],
 *   onCast?: (spell: { name: string, level: number, concentration: boolean, ritual: boolean, ritualOnly: boolean, names: string[] }) => void }} deps
 * @returns {{ classBox: HTMLElement, featBox: HTMLElement, subclassBox: HTMLElement, speciesBox: HTMLElement,
 *   render(character: Object, d: Object): void }}
 */
export function createGrantedSpells({ store, tooltip, getSpellsDb, onCast = null }) {
    // Repliables (pastille à chevron du titre, fold.js) : seul le titre reste, retenu sur cet appareil
    const classBox = el('section', { class: 'feat-spells class-spells', 'aria-labelledby': 'class-spells-title', 'data-fold-key': 'class-spells', hidden: true });
    bindFolding(classBox);
    let classSignature = null;

    const featBox = el('section', { class: 'feat-spells', 'aria-labelledby': 'feat-spells-title', 'data-fold-key': 'feat-spells', hidden: true });
    bindFolding(featBox);
    let featSignature = null;

    const subclassBox = el('section', { class: 'feat-spells subclass-spells', 'aria-labelledby': 'subclass-spells-title', 'data-fold-key': 'subclass-spells', hidden: true });
    bindFolding(subclassBox);
    let subclassSignature = null;

    const speciesBox = el('section', { class: 'feat-spells species-spells', 'aria-labelledby': 'species-spells-title', 'data-fold-key': 'species-spells', hidden: true });
    bindFolding(speciesBox);
    let speciesSignature = null;
    // Affinité élémentaire (Sorcellerie draconique) du dernier affichage, et base des sorts chargée :
    // le repère « +Cha » d'un sort donné en dépend (comptés dans les signatures des blocs)
    let affinity = null;
    const affinityKey = () => JSON.stringify([affinity, getSpellsDb().length > 0]);

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
        // Lancer (vue au combat) : sort de niveau 1+ préparé ; pas pour un sort lancé seulement
        // sans emplacement (Ascendance divine), qui n'est pas un sort préparé
        const level = Number(spell.level);
        const ritualOnly = /^Seulement en rituel/.test(spell.note ?? '');
        const cast = onCast && level >= 1 && !/^Une fois sans emplacement/.test(spell.note ?? '')
            ? el('button', {
                type: 'button', class: 'btn-chip spell-cast feat-spell-cast',
                title: ritualOnly ? 'Lancer en rituel' : "Lancer : choisir l'emplacement à cocher",
                'aria-label': `Lancer le sort ${spell.name}`,
                on: {
                    click: () => {
                        const entry = getSpellsDb().find(s => s.vo === spell.vo);
                        onCast({
                            name: spell.name, level, ritualOnly, names: [spell.name, spell.vo],
                            concentration: entry?.concentration === true,
                            ritual: ritualOnly || spell.ritual === true || entry?.ritual === true
                        });
                    }
                }
            }, icon('sparkle'), el('span', { class: 'btn-label', text: 'Lancer' }))
            : null;
        // Sort du type d'Affinité élémentaire (Orbe chromatique, Souffle du dragon…) : « +Cha (+4, feu) »
        const affine = affinityApplies(getSpellsDb().find(s => s.vo === spell.vo), affinity);
        return el('li', { class: 'feat-spell' },
            el('div', { class: 'feat-spell-head' },
                name,
                // Niveau inconnu (sort choisi que la base de sorts ne connaît pas) : pas de repère
                spell.level === null || spell.level === undefined ? null
                    : el('span', { class: 'feat-spell-level', text: spellLevelLabel(spell.level) }),
                // Capacité de classe qui donne le sort (« Fidèle destrier »)
                spell.source ? el('span', { class: 'feat-spell-tag', 'data-kind': 'source', text: spell.source }) : null,
                spell.ritual ? el('span', { class: 'feat-spell-tag', text: 'Rituel' }) : null,
            spell.listed ? el('span', { class: 'feat-spell-tag', 'data-kind': 'listed', text: 'Aussi dans votre liste' }) : null,
            affine ? el('span', { class: 'feat-spell-tag', 'data-kind': 'affinity', title: affinity.rule, text: affinity.mention }) : null,
            cast),
            free,
            details ? el('p', { class: 'feat-spell-note', text: details }) : null);
    }

    // -----------------------------------------------------------------------
    // Cases d'un lancer sans emplacement rangé dans subclass_uses (sorts d'espèce, sorts de classe,
    // Arcanum mystique) : les mêmes que dans l'onglet Combat, contrôles de JEU (utilisables verrouillé)
    // -----------------------------------------------------------------------

    /** @param {{ key: string, label: string, max: number, reset: string }} def - compteur de subclass_uses */
    function freeBoxes(def) {
        return el('span', { class: 'feat-spell-free' },
            ...Array.from({ length: def.max }, (_, index) => el('input', {
                type: 'checkbox', class: 'round-check', 'data-play': 'true', 'data-free-use': def.key, 'data-index': String(index),
                'aria-label': `${def.label} : lancer gratuit ${def.max > 1 ? `${index + 1} ` : ''}utilisé`,
                // Même règle que les cases de l'onglet Combat : toucher la 3e coche les 3 premières,
                // décocher la 1re les vide toutes
                on: { change: (event) => {
                    store.update(setSubclassUsesPatch(store.get(), def.key, event.target.checked ? index + 1 : index, def.max));
                } }
            })),
            el('span', { text: `${def.max > 1 ? `${def.max} lancers` : '1 lancer'} sans emplacement, de nouveau après un ${def.reset === 'short' ? 'repos court ou long' : 'repos long'}` }));
    }

    /** Cases cochées ici ou dans l'onglet Combat : seul leur état change (le bloc n'est pas reconstruit) */
    function syncFreeBoxes(box, character, maxOf) {
        const state = subclassUsesState(character);
        for (const input of box.querySelectorAll('input[data-free-use]')) {
            const key = input.dataset.freeUse;
            const checked = Number(input.dataset.index) < Math.min(Number(state[key]) || 0, maxOf(key));
            if (input.checked !== checked) input.checked = checked;
        }
    }

    // -----------------------------------------------------------------------
    // Sorts choisis d'une capacité (js/rules/spell-choices.js) : un groupe par capacité, ajouté au
    // bloc de classe (Magicien) ou de sous-classe (Barde du Collège du Savoir)
    // -----------------------------------------------------------------------

    /** Capacités d'un bloc ; le sort d'une Découverte magique aussi noté au tableau porte le repère « Aussi dans votre liste » */
    function choiceFeatures(choices, owner, rows) {
        return choices.filter(feature => feature.owner === owner).map(feature => ({
            ...feature,
            spells: feature.spells.map(spell => ({
                ...spell,
                // Sorts du Magicien : pris au grimoire, donc toujours notés au tableau (pas de repère)
                listed: spell.from === 'lists'
                    && markListedSpells([{ name: spell.name, vo: spell.vo, aka: [spell.value] }], rows)[0].listed
            }))
        }));
    }

    /**
     * Ce qui fait reconstruire un bloc. Les menus des Découvertes magiques proposent quelques
     * centaines de sorts, toujours les mêmes pour un niveau donné : seuls leur nombre et les
     * options particulières (grisée, plus proposable) sont comparés.
     */
    const choiceSignature = (features) => features.map(feature => [feature.id,
        feature.fields.map(field => [field.key, field.value, field.warning, field.hint,
            feature.from === 'lists'
                ? [field.options.length, field.options.filter(option => option.disabled || option.stale).map(option => option.value)]
                : field.options.map(option => [option.value, option.label, option.disabled])]),
        feature.spells.map(spell => [spell.key, spell.name, spell.vo, spell.level, spell.listed])]);

    /** Ligne d'un sort choisi, avec la case de son lancer sans emplacement (Sorts de prédilection) */
    const chosenLine = (counters) => (spell) => {
        let note = '';
        if (spell.cast === 'atwill') note = `Sans emplacement au niveau ${spell.atLevel}, à volonté ; à un niveau plus haut, avec un emplacement.`;
        else if (spell.cast === 'uses') note = `Sans emplacement, il se lance au niveau ${spell.atLevel} ; à un niveau plus haut, avec un emplacement.`;
        const item = featSpellLine({ name: spell.name, vo: spell.vo, level: spell.level, listed: spell.listed, note });
        const counter = spell.uses ? counters.find(entry => entry.key === spell.uses) : null;
        if (counter) item.append(freeBoxes(counter));
        return item;
    };

    const choiceGroups = (features, counters = []) => features.map(feature => spellChoiceGroup(feature, { store, spellLine: chosenLine(counters) }));

    // -----------------------------------------------------------------------
    // Sorts de classe : toujours préparés par la classe elle-même, hors du compte. Le lancer sans
    // emplacement de Châtiment de paladin, Fidèle destrier et Communication avec le protecteur a sa
    // case ; Marque du chasseur garde les cases « Ennemi juré » (ressource de classe, onglet Combat).
    // Arcanum mystique (Occultiste 11+) : les sorts se notent au tableau, une case par niveau de sort.
    // Magicien : Maîtrise des sorts (niveau 18) et Sorts de prédilection (niveau 20), sorts choisis
    // dans le grimoire par deux menus chacun.
    // -----------------------------------------------------------------------

    function renderClassSpells(character, d, choices) {
        const className = DD_RULES.classes[d.classSlug]?.nameFr ?? '';
        const spells = markListedSpells(classGrantedSpells(d.classSlug, d.level), character.dynamic_spells);
        const counters = subclassCounters(character, d).filter(counter => counter.source === 'class');
        const boxOf = (spell) => counters.find(counter => CLASS_FREE_CASTS[counter.key]?.spells.some(([vo]) => vo === spell.vo));
        const arcana = counters.filter(counter => /^warlock\.arcanum_\d$/.test(counter.key));
        const features = choiceFeatures(choices, 'class', character.dynamic_spells);
        classBox.hidden = spells.length === 0 && arcana.length === 0 && features.length === 0;
        const signature = JSON.stringify([className, spells, counters.map(({ key, max, reset, label }) => [key, max, reset, label]),
            choiceSignature(features), affinityKey()]);
        if (signature !== classSignature) {
            classSignature = signature;
            const line = (spell) => {
                const item = featSpellLine({ name: spell.name, vo: spell.vo, level: spell.level, listed: spell.listed, source: spell.feature, note: spell.note });
                const counter = boxOf(spell);
                if (counter) item.append(freeBoxes(counter));
                return item;
            };
            const arcanumGroup = arcana.length ? el('div', { class: 'feat-spells-group' },
                el('div', { class: 'feat-spells-head' }, el('strong', { class: 'feat-spells-name', text: 'Arcanum mystique' })),
                el('p', { class: 'feat-spells-extra', text: "Notez vos sorts d'Arcanum dans le tableau des sorts (un par niveau) : toujours disponibles, ils ne comptent pas dans vos sorts préparés. Chacun se lance une fois sans emplacement, de nouveau après un repos long : son bouton « Lancer » coche la case de son niveau." }),
                el('ul', { class: 'feat-spells-list' }, arcana.map(counter => el('li', { class: 'feat-spell' },
                    el('span', { class: 'feat-spell-level', text: `Sort de niveau ${counter.key.at(-1)}` }), freeBoxes(counter))))) : null;
            // Choisir un sort reconstruit le bloc : le menu utilisé garde le focus
            keepChoiceFocus(classBox, () => {
                classBox.replaceChildren(...(classBox.hidden ? [] : [
                    el('h4', { class: 'feat-spells-title', id: 'class-spells-title' }, icon('star'), el('span', { text: 'Sorts de classe' }),
                        foldButton('Sorts de classe')),
                    spells.length ? el('p', { class: 'feat-spells-intro', text: `Donnés par votre classe (${className}) : toujours préparés, ils ne comptent pas dans vos sorts préparés.` }) : null,
                    spells.length ? el('ul', { class: 'feat-spells-list' }, spells.map(line)) : null,
                    arcanumGroup,
                    ...choiceGroups(features, counters)
                ].filter(Boolean)));
                applyFolds(classBox);
            });
        }
        syncFreeBoxes(classBox, character, key => counters.find(counter => counter.key === key)?.max ?? 0);
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
        const signature = JSON.stringify([groups.map(g => ({ ...g, spells: g.spells.map(s => ({ ...s, free: s.free?.key ?? null })) })), affinityKey()]);
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
    // hors du nombre de sorts préparés. Collège du Savoir : les deux Découvertes magiques (niveau 6)
    // se choisissent ici par deux menus.
    // -----------------------------------------------------------------------

    function renderSubclassSpells(character, d, choices) {
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
        const features = choiceFeatures(choices, 'subclass', character.dynamic_spells);
        const signature = JSON.stringify([name, spells, next, othersListed, choiceSignature(features), affinityKey()]);
        subclassBox.hidden = spells.length === 0 && features.length === 0;
        if (signature === subclassSignature) return;
        subclassSignature = signature;
        const list = (items) => el('ul', { class: 'feat-spells-list' }, items.map(featSpellLine));
        const groupBlock = (group, items) => el('div', { class: 'feat-spells-group' },
            el('div', { class: 'feat-spells-head' }, el('strong', { class: 'feat-spells-name', text: group })),
            list(items.filter(spell => spell.group === group)));
        let intro;
        if (spells.length === 0) {
            // Seulement des sorts choisis (Collège du Savoir) : chaque capacité dit ce qu'elle donne
            intro = '';
        } else if (spells.every(spell => /^Seulement en rituel/.test(spell.note ?? ''))) {
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
        // Choisir un sort reconstruit le bloc : le menu utilisé garde le focus
        keepChoiceFocus(subclassBox, () => {
            subclassBox.replaceChildren(...(subclassBox.hidden ? [] : [
                el('h4', { class: 'feat-spells-title', id: 'subclass-spells-title' }, icon('star'), el('span', { text: 'Sorts de sous-classe' }),
                    foldButton('Sorts de sous-classe')),
                intro ? el('p', { class: 'feat-spells-intro', text: intro }) : null,
                ...(spells.length ? (groups[0] ? groups.map(group => groupBlock(group, spells)) : [list(spells)]) : []),
                otherGroups.length ? el('details', { class: 'subclass-spells-others' },
                    el('summary', { text: `Autres terrains, pas préparés (${otherGroups.join(', ')})` }),
                    ...otherGroups.map(group => groupBlock(group, othersListed))) : null,
                next.length ? el('p', { class: 'feat-spells-extra' }, el('strong', { text: 'À venir : ' }), `${next.join(' ; ')}.`) : null,
                ...choiceGroups(features)
            ].filter(Boolean)));
            applyFolds(subclassBox);
        });
    }

    // -----------------------------------------------------------------------
    // Sorts d'espèce (4.36.0) : Lumière de l'Aasimar, sorts des lignages elfiques, des héritages
    // fiélons… Toujours préparés, hors du compte ; lancers gratuits cochés dans subclass_uses
    // (mêmes cases que dans l'onglet Combat, clé « species.sort_… »)
    // -----------------------------------------------------------------------

    function renderSpeciesSpells(character, d) {
        const view = speciesView(character, d);
        const spells = (view?.spells ?? []).filter(spell => spell.reached);
        const upcoming = (view?.spells ?? []).filter(spell => !spell.reached);
        const defs = speciesCounterDefs(character, d);
        const signature = JSON.stringify([view?.name, spells, upcoming.map(spell => spell.name), defs.map(def => [def.key, def.max]), affinityKey()]);
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
                item.append(...[def ? freeBoxes(def) : null, stats].filter(Boolean));
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
        syncFreeBoxes(speciesBox, character, key => defs.find(entry => entry.key === key)?.max ?? 0);
    }

    return {
        classBox,
        featBox,
        subclassBox,
        speciesBox,
        render(character, d) {
            affinity = elementalAffinity(d);
            // Sorts choisis d'une capacité (Magicien 18+, Barde du Collège du Savoir 6+) : [] sinon.
            // given : sorts donnés (sous-classe, don, espèce), absents des menus du livre du Magicien
            const choices = spellChoiceView(character, d, {
                db: getSpellsDb(), maxLevel: highestSlotLevel(d.spellSlots), given: givenSpellKeys(character, d)
            });
            renderClassSpells(character, d, choices);
            renderFeatSpells(character, d);
            renderSubclassSpells(character, d, choices);
            renderSpeciesSpells(character, d);
        }
    };
}
