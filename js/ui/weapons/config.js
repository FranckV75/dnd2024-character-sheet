// =============================================================================
// WEAPONS/CONFIG.JS - Fenêtre « Configuration de l'arme » (roue dentée d'une ligne)
//
// Réglages d'une arme : caractéristique d'attaque, bonus magique, dé et type de dégâts, arme
// maîtrisée, et la rubrique « Dégâts en plus » (js/ui/weapons/config-extras.js). Geste d'ÉDITION :
// sans effet fiche verrouillée. Lit la ligne de l'arme ; écrit son weaponConfig (format v3, validé
// par buildWeaponConfig, js/rules/weapons.js) quand on touche « Appliquer », rien avant.
// =============================================================================

import { weaponProficiency } from '../../rules/class-features.js';
import { readWeaponConfig, buildWeaponConfig, normalizeDamageDie, WEAPON_DAMAGE_TYPES } from '../../rules/weapons.js';
import { derivedOf } from '../derived.js';
import { el } from '../dom.js';
import { frenchSpaces } from '../help.js';
import { openModal } from '../modal.js';
import { isLocked } from '../lock.js';
import { enchant, magicLevel, ENCHANT_DELAY_MS } from '../magic.js';
import { plain, fitStatus, weaponInSentence } from './shared.js';
import { createExtrasEditor } from './config-extras.js';

const STAT_OPTIONS = [
    ['', 'Auto (selon les propriétés)'],
    ['str', 'Force'],
    ['dex', 'Dextérité'],
    ['cha', 'Charisme (Pacte de la lame)'],
    ['wis', 'Sagesse (Gourdin magique / Shillelagh)'],
    ['int', 'Intelligence']
];

const DAMAGE_TYPE_LABELS = {
    TRAN: 'Tranchant', CONT: 'Contondant', PERF: 'Perforant', FEU: 'Feu', FROID: 'Froid',
    NECR: 'Nécrotique', RADI: 'Radiant', FORCE: 'Force', PSYCH: 'Psychique', POISON: 'Poison',
    ACIDE: 'Acide', FOUDRE: 'Foudre', TONNERRE: 'Tonnerre'
};

/** Numéro des fenêtres ouvertes : identifiants de leurs champs */
let configCounter = 0;

/** Aide du réglage « Arme maîtrisée » : ce que « Auto » décide, et pourquoi */
function proficiencyHelp(auto) {
    const why = auto.source === 'unarmed' ? "l'attaque à mains nues est toujours maîtrisée."
        : auto.source === 'class' ? 'arme maîtrisée par votre classe.'
        : auto.source === 'none' ? `non maîtrisée (${auto.text.replace(/\.$/, '')}).`
        : auto.text.charAt(0).toLowerCase() + auto.text.slice(1);
    return `Auto : ${why} Oui ou Non : si un don, une capacité ou votre MJ en décide autrement.`;
}

/**
 * @param {import('./shared.js').WeaponsContext} ctx
 * @param {number} index - place de l'arme dans dynamic_weapons
 */
export function openConfig(ctx, index) {
    if (isLocked()) return;
    const weapon = ctx.weapons()[index];
    if (!weapon) return;
    const config = readWeaponConfig(weapon.weaponConfig);
    const legacyDie = !normalizeDamageDie(config.dmgDieOverride).ok;
    const id = `weapon-config-${++configCounter}`;

    const select = (key, options, value) => el('select', { id: `${id}-${key}`, class: 'input' },
        options.map(([v, label]) => el('option', { value: v, text: label, selected: v === value })));

    const statSelect = select('stat', STAT_OPTIONS, config.statOverride);
    const magicSelect = select('magic',
        [0, 1, 2, 3].map(n => [String(n), n === 0 ? '+0 (arme normale)' : `+${n}`]), String(config.magicBonus));
    const dieInput = el('input', {
        id: `${id}-die`, class: 'input', type: 'text', autocomplete: 'off', spellcheck: 'false',
        placeholder: 'Ex. 1d8, 2d6', value: config.dmgDieOverride,
        'aria-describedby': `${id}-die-help`
    });
    const typeSelect = select('type',
        [['', "Auto (selon les données de l'arme)"], ...WEAPON_DAMAGE_TYPES.map(t => [t, DAMAGE_TYPE_LABELS[t] || t])],
        config.dmgTypeOverride);
    // Maîtrise de l'arme : ce que la fiche déduit seule (classe, dons), et le choix du joueur
    const auto = weaponProficiency({ ...weapon, weaponConfig: '' }, derivedOf(ctx.store.get()));
    const profSelect = select('prof', [
        ['auto', `Auto (${auto.proficient ? 'maîtrisée' : 'non maîtrisée'})`],
        ['yes', 'Oui : bonus de maîtrise compté'],
        ['no', 'Non : sans bonus de maîtrise']
    ], config.proficiency);
    const error = el('p', { class: 'weapons-config-error', id: `${id}-error`, role: 'alert', hidden: true });

    const field = (key, label, control, ...extra) => el('div', { class: 'weapons-config-field' },
        el('label', { for: `${id}-${key}`, text: label }), control, ...extra);

    const extras = createExtrasEditor(id, weapon.weaponConfig);

    const body = el('div', { class: 'weapons-config' },
        el('p', { class: 'weapons-config-name', text: plain(weapon.name) || 'Arme sans nom' }),
        weapon.atkKey ? null : el('p', {
            class: 'weapons-config-note',
            text: "Cette arme n'est pas rattachée au manuel : choisissez son nom dans la liste des armes pour activer le calcul automatique."
        }),
        field('stat', "Caractéristique d'attaque", statSelect),
        field('magic', 'Bonus magique', magicSelect),
        field('die', 'Dé de dégâts (facultatif)', dieInput,
            el('small', {
                id: `${id}-die-help`, class: 'weapons-config-help',
                text: legacyDie
                    ? "Valeur libre d'une ancienne version : conservée telle quelle si vous n'y touchez pas ; une nouvelle valeur doit suivre le format 1d8, 2d6."
                    : "Remplace le dé de l'arme ; vide = dé de l'arme."
            }),
            error),
        field('type', 'Type de dégâts', typeSelect),
        field('prof', 'Arme maîtrisée', profSelect,
            el('small', { id: `${id}-prof-help`, class: 'weapons-config-help', text: proficiencyHelp(auto) })),
        extras.box);
    profSelect.setAttribute('aria-describedby', `${id}-prof-help`);

    const form = { id, config, statSelect, magicSelect, dieInput, typeSelect, profSelect, error, extras };
    openModal({
        title: "Configuration de l'arme",
        icon: 'gear',
        body,
        actions: [
            { label: 'Annuler' },
            { label: 'Appliquer', primary: true, onClick: () => applyConfig(ctx, index, form) }
        ]
    });
}

/**
 * Bouton « Appliquer » : valide la saisie et l'enregistre dans la ligne de l'arme. Saisie
 * refusée : chaque message près de ses champs, rien n'est enregistré, la fenêtre reste ouverte.
 * @param {import('./shared.js').WeaponsContext} ctx
 * @param {number} index - place de l'arme dans dynamic_weapons
 * @param {Object} form - champs de la fenêtre (openConfig) ; config : réglages lus à l'ouverture
 * @returns {boolean} true : la fenêtre se referme
 */
function applyConfig(ctx, index, form) {
    const { id, config, statSelect, magicSelect, dieInput, typeSelect, profSelect, error, extras } = form;
    const current = ctx.weapons()[index];
    if (!current) return true;
    extras.dropBlankLines();
    const result = buildWeaponConfig({
        statOverride: statSelect.value,
        magicBonus: Number(magicSelect.value),
        dmgDieOverride: dieInput.value,
        dmgTypeOverride: typeSelect.value,
        proficiency: profSelect.value,
        extraDamage: extras.values()
    }, current.weaponConfig);
    if (!result.ok) {
        // Chaque message près de ses champs : réglages de l'arme, puis dégâts en plus
        const { extraDamage: extraMessage, ...others } = result.errors;
        error.textContent = Object.values(others).join(' ');
        error.hidden = Object.keys(others).length === 0;
        const dieInvalid = Boolean(result.errors.dmgDieOverride);
        dieInput.setAttribute('aria-invalid', String(dieInvalid));
        dieInput.setAttribute('aria-describedby', `${id}-die-help ${id}-error`);
        // Dé de l'arme faux : il passe d'abord (son message est sous son champ) ;
        // le message des dégâts en plus est posé quand même, sans prendre le curseur
        extras.refuse(result.invalidExtras || [], extraMessage, !dieInvalid);
        if (dieInvalid) dieInput.focus();
        return false;
    }
    ctx.updateRow(index, (w) => ({ ...w, weaponConfig: result.value }));
    // Nouvelle pastille (ligne ajoutée, ou passée de « Toujours » à « À allumer ») :
    // fenêtre refermée, la barre du haut dit où elle est et à quoi elle sert. Une
    // pastille déjà là dont on a seulement corrigé le texte n'est pas annoncée.
    const added = extras.addedPills();
    if (added) {
        const said = (where) => (added === 1
            ? `Pastille ajoutée sous ${where} : touchez-la quand la condition est remplie.`
            : `${added} pastilles ajoutées sous ${where} : touchez-les quand leur condition est remplie.`);
        ctx.setStatus(frenchSpaces(fitStatus(said(weaponInSentence(current)), said("l'arme"))));
    }
    // Nouveau bonus magique : l'arme s'enchante sous les yeux, fenêtre refermée
    if (magicLevel(readWeaponConfig(result.value).magicBonus) > config.magicBonus) {
        setTimeout(() => {
            const row = ctx.rows[index];
            if (row) enchant(row.magic, row.tr);
        }, ENCHANT_DELAY_MS);
    }
    return true;
}
