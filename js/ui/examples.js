// =============================================================================
// EXAMPLES.JS (interface) - Fenêtre « Essayer un personnage d'exemple » (barre Gestion)
//
// Propose les personnages fictifs de js/data/examples.js à un nouveau joueur. Ouvrir un exemple
// REMPLACE la fiche ouverte, avec les mêmes protections que « Nouvelle fiche » et « Importer » :
//  - la fenêtre dit d'abord ce qui arrive à la fiche ouverte, et rien ne change avant le choix ;
//  - la fiche remplacée est gardée dans « Revenir à… » (store.beforeReplace, main.js), et la
//    fenêtre conseille de l'exporter d'abord, comme « Nouvelle fiche » et « Importer » : cette
//    liste ne garde que les derniers états de l'appareil. Les états de l'exemple n'en font jamais
//    sortir le dernier état de la fiche du joueur (js/state/snapshots.js) ;
//  - l'exemple n'est lié à aucun personnage en ligne et n'est pas envoyé au compte
//    (source « example », js/cloud/controller.js) : aucun personnage en ligne n'est modifié.
// Bouton masqué fiche verrouillée (edit-only), comme « Nouvelle fiche » et « Importer ».
// Mise en forme : css/help.css.
// =============================================================================

import { el, icon } from './dom.js';
import { openModal } from './modal.js';
import { listExamples, exampleCharacter, EXAMPLE_SOURCE } from '../state/examples.js';
import { isBlankCharacter } from '../cloud/controller.js';
import { characterName } from '../state/persistence.js';

/** Infobulle du bouton de la barre (souris) ; au toucher, la fenêtre le dit en toutes lettres */
export const EXAMPLES_TITLE = "Ouvrir un personnage fictif prêt à jouer, pour découvrir la fiche (la fiche ouverte est gardée dans « Revenir à… »)";

/** Ce qui arrive à la fiche ouverte, dit avant tout choix */
function replacementNote(character) {
    if (isBlankCharacter(character)) return 'La fiche ouverte est vierge : rien ne sera perdu.';
    const name = characterName(character);
    return `La fiche ouverte (${name ? `« ${name} »` : 'sans nom'}) sera remplacée par l'exemple choisi. `
        + 'Elle sera gardée parmi les derniers états de cet appareil (« Revenir à… »). '
        + 'Pour la conserver durablement, exportez-la d\'abord : « Annuler », puis « Exporter ».';
}

/**
 * @param {{ store: Object, setStatus: (message: string) => void }} ctx
 */
export function openExamples({ store, setStatus }) {
    let close = () => {};

    const open = (example) => {
        const character = exampleCharacter(example.id);
        if (!character) return;
        const hadContent = !isBlankCharacter(store.get());
        store.replace(character, { source: EXAMPLE_SOURCE });
        close();
        setStatus(hadContent
            ? `Exemple « ${example.title} » ouvert ; l'ancienne fiche est dans « Revenir à… ».`
            : `Exemple « ${example.title} » ouvert.`);
    };

    const cards = listExamples().map((example) => el('li', { class: 'example-card' },
        el('div', { class: 'example-text' },
            el('strong', { class: 'example-name', text: example.title }),
            el('span', { class: 'example-kind', text: example.subtitle }),
            el('span', { class: 'example-pitch', text: example.pitch })),
        el('button', {
            type: 'button', class: 'btn btn-primary example-open',
            'aria-label': `Ouvrir l'exemple ${example.title}`,
            on: { click: () => open(example) }
        }, icon('book'), el('span', { class: 'btn-label', text: 'Ouvrir cet exemple' }))));

    close = openModal({
        title: 'Essayer un personnage d\'exemple',
        icon: 'user',
        wide: true,
        focusField: false,
        body: [
            el('p', { text: 'Deux personnages fictifs, prêts à jouer : ouvrez-en un pour découvrir la fiche sans rien préparer. Vous pouvez tout modifier, c\'est fait pour essayer.' }),
            el('p', { class: 'example-warning' }, icon('warning'), el('span', { text: replacementNote(store.get()) })),
            el('ul', { class: 'example-list' }, cards),
            el('p', {
                class: 'toolbar-modal-note',
                text: 'Vos personnages enregistrés en ligne ne sont pas modifiés : l\'exemple reste dans ce navigateur. Connecté, le bouton « Enregistrer en ligne » l\'ajoute à votre compte si vous voulez le garder.'
            })
        ],
        actions: [{ label: 'Annuler' }]
    });
}
