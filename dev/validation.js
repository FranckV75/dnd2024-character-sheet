// =============================================================================
// VALIDATION.JS - Page temporaire de validation des étapes 0 à 2
// Importe une fiche, la fait passer par le moteur v4 et affiche le résultat.
// =============================================================================

import { initTheme, toggleTheme } from '../js/ui/theme.js';
import { createStore } from '../js/state/store.js';
import { migrateCharacter, stripHTML } from '../js/state/migrate.js';
import {
    loadLocal, saveLocal, serializeCharacter, parseCharacterFile, exportFileName, characterName
} from '../js/state/persistence.js';
import { deriveCharacter, computeWeapon } from '../js/rules/character.js';
import { ABILITIES, SKILLS } from '../js/data/constants.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { FEATS_DATA } from '../js/data/feats.js';

const store = createStore();
const output = document.getElementById('output');
const status = document.getElementById('status');

/** Données brutes du dernier chargement, pour vérifier qu'aucune clé n'est perdue */
let lastRaw = null;
let lastReport = [];

// --- Petits utilitaires d'affichage (texte uniquement, jamais de HTML injecté) ---

function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'class') node.className = value;
        else node.setAttribute(key, value);
    }
    for (const child of children.flat()) {
        if (child === null || child === undefined) continue;
        node.append(child instanceof Node ? child : String(child));
    }
    return node;
}

const signed = (n) => (n >= 0 ? `+${n}` : String(n));
const plain = (v) => stripHTML(String(v ?? '')) || '—';

function card(title, content, wide = false) {
    return el('section', { class: wide ? 'v-card wide' : 'v-card' }, el('h2', {}, title), content);
}

function table(headers, rows) {
    return el('table', {},
        el('thead', {}, el('tr', {}, headers.map(h => el('th', {}, h)))),
        el('tbody', {}, rows.map(cells => el('tr', {}, cells.map(c => el('td', {}, c))))));
}

const check = (ok, label) => el('li', { class: ok ? 'ok' : 'ko' }, `${ok ? '✔' : '✖'} ${label}`);

// --- Rendu ---

function render(character) {
    const d = deriveCharacter(character);
    const subclass = Object.values(DD_RULES.subclasses).find(s => s.nameFr === character.char_subclass);
    const destiny = DD_RULES.heroicDestinies.find(h => h.value === character.heroic_destiny);

    // Contrôles automatiques
    const lostKeys = lastRaw ? Object.keys(lastRaw).filter(k => !(k in character)) : [];
    const roundTrip = JSON.stringify(parseCharacterFile(serializeCharacter(character)).character) === JSON.stringify(character);
    const stable = JSON.stringify(migrateCharacter(character).character) === JSON.stringify(character);

    output.replaceChildren(
        card('Contrôles automatiques', el('ul', {},
            check(lostKeys.length === 0, lostKeys.length ? `Clés perdues : ${lostKeys.join(', ')}` : `Aucune donnée perdue (${Object.keys(character).length} champs)`),
            check(roundTrip, 'Export puis réimport : fiche identique'),
            check(stable, 'Fiche stable (une seconde conversion ne change rien)')
        )),

        card('Conversions appliquées', lastReport.length
            ? el('ul', {}, lastReport.map(line => el('li', {}, line)))
            : el('p', { class: 'v-muted' }, 'Aucune : la fiche était déjà au format actuel.')),

        card('Identité', table(['Champ', 'Valeur'], [
            ['Nom', plain(character.char_name)],
            ['Classe', `${plain(character.char_class)} (${d.classSlug || 'classe inconnue'})`],
            ['Sous-classe', `${plain(character.char_subclass)}${subclass ? ` — source : ${subclass.source}` : ''}`],
            ['Niveau', d.level],
            ['Espèce', plain(character.char_species)],
            ['Historique', plain(character.char_background)],
            ['Destin héroïque', destiny?.value ? destiny.name : '—'],
            ['Dons', [1, 4, 8, 12, 16, 19].map(l => FEATS_DATA[character[`feat_${l}`]]?.name).filter(Boolean).join(', ') || '—']
        ])),

        card('Combat', table(['Statistique', 'Calculé par le moteur', 'Saisi dans la fiche'], [
            ['Bonus de maîtrise', signed(d.pb), ''],
            ['Classe d\'armure', `${d.armorClass.value} (${d.armorClass.source})`, plain(character.ac)],
            ['Initiative', signed(d.initiative), plain(character.initiative)],
            ['Perception passive', d.passivePerception, plain(character.passive_perception)],
            ['Points de vie', '', `${plain(character.hp_current)} / ${plain(character.hp_max)} (temp. ${plain(character.hp_temp)})`],
            ['Dé de vie', d.hitDie || '—', `${plain(character.hd_type)} — utilisés : ${plain(character.hd_current)}`],
            ['Épuisement', d.exhaustion.level ? `niveau ${d.exhaustion.level} : ${d.exhaustion.d20Penalty} aux d20` : 'aucun', ''],
            ['Ressource de classe', d.classResource.count ? `${d.classResource.label} × ${d.classResource.count}` : '—', '']
        ])),

        card('Caractéristiques et sauvegardes', table(['Carac.', 'Score', 'Mod.', 'Sauvegarde'], ABILITIES.map(a => [
            a.name, d.scores[a.id], signed(d.mods[a.id]),
            `${signed(d.saves[a.id].bonus)}${d.saves[a.id].proficient ? ' ●' : ''}`
        ]))),

        card('Compétences', table(['Compétence', 'Bonus', 'Maîtrise'], SKILLS.map(s => [
            s.name, signed(d.skills[s.id].bonus),
            d.skills[s.id].expertise ? 'Expertise' : d.skills[s.id].proficient ? 'Maîtrise' : ''
        ]))),

        card('Magie', table(['Statistique', 'Valeur'], [
            ['Caractéristique', d.spellcasting ? ABILITIES.find(a => a.id === d.spellcasting.ability).name : '—'],
            ['DD des sorts', d.spellcasting ? d.spellcasting.dc : '—'],
            ['Attaque des sorts', d.spellcasting ? signed(d.spellcasting.attack) : '—'],
            ['Emplacements', Object.entries(d.spellSlots).map(([lvl, n]) => `niv. ${lvl} × ${n}`).join(', ') || '—'],
            ['Sorts inscrits', character.dynamic_spells.filter(s => stripHTML(s.name)).length]
        ])),

        card('Armes (attaque et dégâts recalculés)', table(['Arme', 'Attaque', 'Dégâts', 'Propriétés'],
            character.dynamic_weapons.filter(w => stripHTML(w.name)).map(w => {
                const res = computeWeapon(w, d);
                return [plain(w.name), res ? res.attack.text : 'non rattachée au manuel', res ? res.damage.text : '', plain(w.prop)];
            })), true),

        card('Armures', table(['Armure', 'Type', 'CA', 'Équipée'],
            character.dynamic_armors.map(a => [plain(a.name), plain(a.type), plain(a.ca), a.equipped ? 'oui' : 'non']))),

        card('Sorts', table(['Niv.', 'Sort', 'Préparé'],
            character.dynamic_spells.filter(s => stripHTML(s.name)).map(s => [s.lvl, plain(s.name), s.prep ? '◆' : ''])))
    );
}

function load({ character, report }, raw, message) {
    lastRaw = raw;
    lastReport = report;
    store.replace(character);
    status.textContent = message;
}

// --- Actions ---

document.getElementById('file-input').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const text = await file.text();
        load(parseCharacterFile(text), JSON.parse(text), `Fichier « ${file.name} » chargé.`);
    } catch (e) {
        status.textContent = `⚠️ ${e.message}`;
    }
    event.target.value = '';
});

document.getElementById('btn-load-local').addEventListener('click', () => {
    const result = loadLocal();
    if (!result) {
        status.textContent = 'Aucune fiche enregistrée dans ce navigateur pour le moment.';
        return;
    }
    load(result, null, 'Fiche du navigateur chargée.');
});

document.getElementById('btn-save-local').addEventListener('click', () => {
    // Sur le site publié, ce navigateur contient la vraie fiche du joueur : ne jamais la remplacer
    if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(location.hostname)) {
        status.textContent = 'Page de développement : enregistrement disponible seulement en local.';
        return;
    }
    status.textContent = saveLocal(store.get())
        ? `Fiche « ${characterName(store.get()) || 'sans nom'} » enregistrée dans ce navigateur.`
        : '⚠️ Enregistrement impossible (stockage du navigateur indisponible).';
});

document.getElementById('btn-export').addEventListener('click', () => {
    const blob = new Blob([serializeCharacter(store.get())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = el('a', { href: url, download: exportFileName(store.get()) });
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status.textContent = `Export : ${exportFileName(store.get())}`;
});

document.getElementById('btn-theme').addEventListener('click', toggleTheme);

// --- Démarrage ---

initTheme();
store.subscribe(render);
render(store.get());
status.textContent = 'Fiche vierge affichée. Importez un fichier de Korgul pour le tester.';
