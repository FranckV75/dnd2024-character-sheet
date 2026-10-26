// =============================================================================
// ACCOUNT.JS - Compte en ligne : connexion, « Mes personnages », questions de synchronisation
//
// Toutes les décisions (quoi envoyer, quoi charger, quand demander) sont prises par
// js/cloud/controller.js (testé sans navigateur). Ce module affiche la barre de
// compte, les fenêtres de connexion et pose les questions du contrôleur.
// Fermer une question sans répondre = l'option la plus prudente (rien n'est écrasé).
// =============================================================================

import { el, icon, setIconLabel } from './dom.js';
import { openModal, confirmModal } from './modal.js';
import { getClient } from '../cloud/client.js';
import { createCloudSync, SYNC_KEY } from '../cloud/controller.js';
import { friendlyError, newerVersion } from '../cloud/sync.js';

const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } }
};

const formatDate = (iso) => {
    const date = new Date(iso || '');
    return Number.isNaN(date.getTime()) ? 'date inconnue' : date.toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

/** Les deux versions comparées (en ligne / ce navigateur), précédées d'une icône dorée ;
 *  la plus récente (plus de 5 s d'écart) est signalée */
const versionsList = (cloudUpdatedAt, localSavedAt) => {
    const newer = newerVersion(cloudUpdatedAt, localSavedAt);
    const line = (iconName, label, iso, isNewer) => el('li', {}, icon(iconName),
        el('span', { text: `${label} : ${formatDate(iso)}` }),
        isNewer ? el('strong', { class: 'account-newer', text: '(plus récente)' }) : null);
    return el('ul', { class: 'account-versions' },
        line('cloud', 'Version en ligne', cloudUpdatedAt, newer === 'cloud'),
        line('scroll', 'Version de ce navigateur', localSavedAt, newer === 'local'));
};

/**
 * Pose une question avec des boutons ; la promesse renvoie la valeur du bouton choisi,
 * ou null si la fenêtre est fermée autrement (Échap, clic à côté).
 */
function choose(title, body, buttons) {
    return new Promise((resolve) => {
        let answer = null;
        openModal({
            title,
            body,
            actions: buttons.map(b => ({
                label: b.label, primary: b.primary, danger: b.danger,
                onClick: () => { answer = b.value ?? null; }
            })),
            onClose: () => resolve(answer)
        });
    });
}

/** Questions posées par le contrôleur de synchronisation */
const QUESTIONS = {
    exists: ({ name, cloudUpdatedAt, localSavedAt }) => {
        // Version en ligne plus récente (cas habituel d'un 2ᵉ appareil au premier lancement de la
        // nouvelle version) : l'ouvrir est le choix proposé par défaut (bouton principal, focus)
        const cloudNewer = newerVersion(cloudUpdatedAt, localSavedAt) === 'cloud';
        return choose('☁️ Ce personnage existe déjà en ligne', [
            el('p', { text: `Votre compte contient déjà « ${name} », différent de la fiche ouverte dans ce navigateur.` }),
            versionsList(cloudUpdatedAt, localSavedAt),
            cloudNewer ? el('p', { text: 'La version en ligne est la plus récente : c\'est probablement celle que vous avez utilisée en dernier, sur un autre appareil.' }) : null,
            el('p', { text: 'Que voulez-vous faire ?' }),
            el('ul', {},
                el('li', { text: 'Ouvrir la version en ligne : la fiche de ce navigateur sera remplacée.' }),
                el('li', { text: 'Remplacer la version en ligne : celle de votre compte sera perdue.' }),
                el('li', { text: 'Ne rien faire : la fiche reste dans ce navigateur seulement (pensez à l\'exporter).' }))
        ], [
            { label: 'Ne rien faire' },
            { label: '☁️ Ouvrir la version en ligne', value: 'open', primary: cloudNewer },
            { label: '⚠️ Remplacer la version en ligne', value: 'replace', danger: true }
        ]);
    },

    conflict: ({ name, cloudUpdatedAt, localSavedAt, legacy }) => choose(legacy ? '⚠️ Modifié par l\'ancienne version de la fiche' : '⚔️ Deux versions différentes', [
        el('p', {
            text: legacy
                ? `« ${name} » vient d'être enregistré en ligne par l'ancienne version de la fiche (un onglet ou un appareil resté ouvert depuis la mise à jour). Elle ne connaît pas les bonus de combat actifs ni les emplacements de sorts utilisés, et a pu remettre des valeurs plus anciennes.`
                : `« ${name} » a été modifié sur un autre appareil (ou dans un autre onglet), et aussi dans ce navigateur.`
        }),
        versionsList(cloudUpdatedAt, localSavedAt),
        legacy ? el('p', { text: 'Rechargez ou fermez la fiche sur vos autres appareils et onglets, puis choisissez la version à garder.' }) : null,
        el('p', { class: 'muted', text: 'La version que vous ne gardez pas sera perdue. En cas de doute, choisissez « Décider plus tard » et exportez cette fiche d\'abord.' })
    ], [
        { label: 'Décider plus tard' },
        { label: '☁️ Garder la version en ligne', value: 'cloud' },
        { label: '💾 Garder celle de ce navigateur', value: 'local' }
    ]),

    missing: ({ name }) => choose('☁️ Personnage introuvable en ligne', [
        el('p', { text: `« ${name} » n'existe plus dans votre compte (supprimé depuis un autre appareil ?).` }),
        el('p', { text: 'La fiche reste ouverte dans ce navigateur.' })
    ], [
        { label: 'La garder dans ce navigateur seulement' },
        { label: '☁️ La remettre dans mon compte', value: 'recreate', primary: true }
    ]),

    rename: ({ oldName, newName }) => choose('✏️ Changement de nom', [
        el('p', { text: `Le personnage « ${oldName} » s'appelle maintenant « ${newName} ». Que faire dans votre compte ?` })
    ], [
        { label: 'Annuler (garder l\'ancien nom)' },
        { label: `📋 Créer une copie « ${newName} »`, value: 'copy' },
        { label: `✏️ Renommer « ${oldName} »`, value: 'rename', primary: true }
    ]),

    'rename-taken': ({ oldName, newName }) => choose('✏️ Nom déjà utilisé', [
        el('p', { text: `Votre compte contient déjà un personnage nommé « ${newName} ». Le nom « ${oldName} » est remis pour ne rien écraser.` }),
        el('p', { class: 'muted', text: 'Choisissez un autre nom, ou supprimez d\'abord l\'autre personnage dans « Mes personnages ».' })
    ], [{ label: 'Compris', primary: true }]),

    'replace-unsynced': ({ name, target }) => choose('⚠️ Fiche non enregistrée en ligne', [
        el('p', { text: `La fiche ouverte (« ${name} ») n'est pas à jour dans votre compte. Ouvrir « ${target} » la remplacera dans ce navigateur.` }),
        el('p', { class: 'muted', text: 'Pour la conserver, annulez puis utilisez « Exporter » ou « Enregistrer en ligne ».' })
    ], [
        { label: 'Annuler' },
        { label: `Ouvrir « ${target} » quand même`, value: 'confirm', danger: true }
    ])
};

/**
 * Lien reçu par e-mail (mot de passe oublié, confirmation) expiré ou déjà utilisé : Supabase
 * renvoie sur la fiche avec « #error=…&error_description=… ». L'adresse est nettoyée AVANT la
 * création du client : la bibliothèque ne voit pas l'erreur et ne ferme pas la session ouverte.
 * @returns {boolean} true si un tel lien vient d'être ouvert
 */
function takeEmailLinkError() {
    const hash = window.location.hash || '';
    if (!/(^#|&)(error|error_code|error_description)=/.test(hash)) return false;
    try {
        history.replaceState(history.state, '', window.location.pathname + window.location.search);
    } catch {
        // Adresse laissée telle quelle
    }
    return true;
}

/**
 * @param {{ store: Object, setStatus: (message: string) => void, saveWithCharacter: Function, saveNow: Function }} ctx
 */
export function initAccount({ store, setStatus, saveWithCharacter, saveNow }) {
    const host = document.getElementById('account-controls');
    if (!host) return;
    const linkFailed = takeEmailLinkError();
    const client = getClient();
    if (linkFailed) {
        openModal({
            title: '⚠️ Lien expiré ou déjà utilisé',
            body: [
                el('p', { text: 'Le lien reçu par e-mail ne fonctionne plus : il a expiré ou il a déjà servi.' }),
                el('p', { text: 'Pour choisir un nouveau mot de passe : « Se connecter », saisissez votre e-mail, puis « Mot de passe oublié ? ». Utilisez ensuite le lien du dernier e-mail reçu.' })
            ],
            actions: [{ label: 'Compris', primary: true }]
        });
    }

    const sync = createCloudSync({
        client, store, storage,
        // Le suivi de synchronisation est enregistré avec la fiche, au même moment (main.js)
        persist: saveNow,
        ui: { ask: (kind, data) => (QUESTIONS[kind] ? QUESTIONS[kind](data) : Promise.resolve(null)), status: setStatus }
    });
    saveWithCharacter(SYNC_KEY, () => JSON.stringify(sync.getBase()));

    // ------------------------------------------------------------------ Barre
    const statusLabel = el('span', { class: 'account-status', role: 'status' });
    const loginButton = el('button', { type: 'button', class: 'btn', 'aria-haspopup': 'dialog' });
    const listButton = el('button', {
        type: 'button', class: 'btn', 'aria-haspopup': 'dialog',
        on: { click: () => openCharactersModal() }
    });
    setIconLabel(listButton, 'users', 'Mes personnages');
    const reattachButton = el('button', {
        type: 'button', class: 'btn', hidden: true,
        title: 'Ajouter cette fiche à votre compte (sans rien écraser)',
        on: { click: () => sync.reattach() }
    });
    setIconLabel(reattachButton, 'cloud', 'Enregistrer en ligne');
    // L'état du compte se range avec celui de l'enregistrement, à droite de la barre
    const statusHost = document.getElementById('account-status-host');
    statusHost?.replaceChildren(statusLabel);
    host.replaceChildren(...(statusHost ? [] : [statusLabel]), loginButton, reattachButton, listButton);

    function renderBar(state = sync.getState()) {
        loginButton.disabled = !state.available;
        listButton.disabled = !state.available;
        reattachButton.hidden = !(state.user && state.detached);
        if (!state.available) {
            statusLabel.textContent = 'En ligne indisponible';
            statusLabel.title = 'La sauvegarde en ligne n\'a pas pu se charger (pas de connexion Internet ?). La fiche reste enregistrée dans ce navigateur.';
            setIconLabel(loginButton, 'user', 'Se connecter');
            return;
        }
        if (!state.user) {
            statusLabel.textContent = 'Non connecté — fiche enregistrée dans ce navigateur';
            statusLabel.title = 'Non connecté : la fiche est enregistrée seulement dans ce navigateur.';
            setIconLabel(loginButton, 'user', 'Se connecter');
            return;
        }
        const who = (state.user.email || '').split('@')[0].slice(0, 16);
        let syncLabel = state.name ? `fiche « ${state.name} » à jour en ligne` : 'fiche à jour';
        let hint = '';
        if (state.pending) syncLabel = 'une question attend votre réponse';
        else if (state.detached) {
            syncLabel = 'fiche ouverte gardée dans ce navigateur seulement';
            hint = 'Cette fiche n\'est pas enregistrée dans votre compte (par exemple après l\'avoir supprimée de « Mes personnages », ou après avoir choisi « Ne rien faire »). « Enregistrer en ligne » l\'ajoute à votre compte ; « Mes personnages » ouvre un autre personnage.';
        } else if (state.lastError || state.needsCheck) {
            syncLabel = 'synchronisation en échec, nouvel essai automatique';
        } else if (state.dirty) syncLabel = 'enregistrement en ligne…';
        statusLabel.textContent = `Connecté (${who}) — ${syncLabel}`;
        statusLabel.title = [statusLabel.textContent, `Compte : ${state.user.email}`, hint, state.lastError].filter(Boolean).join('\n');
        setIconLabel(loginButton, 'logout', 'Déconnexion');
    }
    sync.onChange(renderBar);
    renderBar();

    loginButton.addEventListener('click', () => (sync.getState().user ? signOut() : openLoginModal()));

    async function signOut() {
        await sync.flush();
        try {
            // Ce navigateur seulement : les autres appareils du joueur restent connectés
            await client.auth.signOut({ scope: 'local' });
        } catch {
            // Déconnexion locale malgré une erreur réseau
        }
        sync.setUser(null);
        setStatus('Déconnecté. La fiche reste enregistrée dans ce navigateur.');
    }

    // ------------------------------------------------------------------ Connexion
    function authInput(type, id, autocomplete, label) {
        return el('label', { class: 'account-field' },
            el('span', { class: 'label', text: label }),
            el('input', {
                type, id, name: type === 'email' ? 'email' : 'password', autocomplete,
                required: true, class: 'input account-input', minlength: type === 'password' ? '6' : null
            }));
    }

    async function rememberCredentials(form) {
        try {
            if (window.PasswordCredential && navigator.credentials) {
                await navigator.credentials.store(new window.PasswordCredential(form));
            }
        } catch {
            // Refus de l'utilisateur ou navigateur non compatible
        }
    }

    function openLoginModal() {
        const message = el('p', { class: 'account-message', role: 'alert' });
        const show = (text, isError = true) => {
            message.textContent = text;
            message.classList.toggle('is-error', isError);
        };
        const emailField = authInput('email', 'auth-email', 'username', 'E-mail');
        const passwordField = authInput('password', 'auth-password', 'current-password', 'Mot de passe');
        const email = emailField.querySelector('input');
        const password = passwordField.querySelector('input');
        let close = () => {};

        const form = el('form', { class: 'account-form', method: 'post', action: '#', autocomplete: 'on' },
            emailField, passwordField,
            el('div', { class: 'account-row' },
                el('button', { type: 'submit', class: 'btn btn-primary', text: 'Connexion' }),
                el('button', { type: 'button', class: 'btn', text: 'Créer un compte', on: { click: () => signUp() } })),
            el('button', { type: 'button', class: 'account-link', text: 'Mot de passe oublié ?', on: { click: () => resetPassword() } }),
            message);

        async function signIn() {
            try {
                show('Connexion…', false);
                const { error } = await client.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
                if (error) throw error;
                await rememberCredentials(form);
                close();
                setStatus('Connecté.');
            } catch (error) {
                show(/invalid login credentials/i.test(error?.message || '')
                    ? 'E-mail ou mot de passe incorrect. En cas d\'oubli, utilisez « Mot de passe oublié ? ».'
                    : `Erreur : ${friendlyError(error)}`);
            }
        }

        async function signUp() {
            if (!form.reportValidity()) return;
            password.autocomplete = 'new-password';
            try {
                show('Création du compte…', false);
                const { data, error } = await client.auth.signUp({ email: email.value.trim(), password: password.value });
                if (error) throw error;
                await rememberCredentials(form);
                if (data?.session) {
                    close();
                    setStatus('Compte créé et connecté.');
                } else {
                    show('Compte créé. Si un e-mail de confirmation vous est envoyé, cliquez sur son lien, puis connectez-vous.', false);
                }
            } catch (error) {
                show(`Erreur : ${friendlyError(error)}`);
            } finally {
                password.autocomplete = 'current-password';
            }
        }

        async function resetPassword() {
            const address = email.value.trim();
            if (!address) {
                show('Saisissez d\'abord votre e-mail ci-dessus, puis cliquez à nouveau sur « Mot de passe oublié ? ».', false);
                email.focus();
                return;
            }
            try {
                const redirectTo = window.location.origin + window.location.pathname;
                const { error } = await client.auth.resetPasswordForEmail(address, { redirectTo });
                if (error) throw error;
                show(`Si un compte existe pour ${address}, un e-mail de réinitialisation vient d'être envoyé. Pensez à vérifier les courriers indésirables.`, false);
            } catch (error) {
                show(`Erreur : ${friendlyError(error)}`);
            }
        }

        // « Connexion » = envoi du formulaire : signal attendu par les navigateurs
        // pour proposer d'enregistrer le mot de passe
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            signIn();
        });

        close = openModal({
            title: '👤 Votre compte en ligne',
            body: [
                el('p', { class: 'muted', text: 'Connectez-vous pour retrouver vos personnages sur tous vos appareils. Si c\'est votre première fois, utilisez « Créer un compte ».' }),
                form
            ],
            actions: [{ label: 'Annuler' }]
        });
    }

    function openNewPasswordModal() {
        const message = el('p', { class: 'account-message', role: 'alert' });
        const field = authInput('password', 'auth-new-password', 'new-password', 'Nouveau mot de passe (6 caractères minimum)');
        const input = field.querySelector('input');
        let close = () => {};
        const form = el('form', { class: 'account-form', method: 'post', action: '#' },
            field,
            el('button', { type: 'submit', class: 'btn btn-primary', text: 'Enregistrer' }),
            message);
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                const { error } = await client.auth.updateUser({ password: input.value });
                if (error) throw error;
                await rememberCredentials(form);
                close();
                setStatus('✅ Mot de passe modifié.');
            } catch (error) {
                message.textContent = `Erreur : ${friendlyError(error)}`;
                message.classList.add('is-error');
            }
        });
        close = openModal({ title: '🔑 Choisissez un nouveau mot de passe', body: form, actions: [{ label: 'Plus tard' }] });
    }

    // ------------------------------------------------------------------ Mes personnages
    function openCharactersModal() {
        const list = el('ul', { class: 'account-list', 'aria-busy': 'true' }, el('li', { class: 'muted', text: 'Chargement…' }));
        let close = () => {};

        async function refresh() {
            const { user, name: openName } = sync.getState();
            if (!user) {
                list.replaceChildren(el('li', { class: 'muted', text: 'Connectez-vous pour retrouver vos personnages enregistrés en ligne. Sans connexion, la fiche est enregistrée dans ce navigateur seulement.' }));
                list.setAttribute('aria-busy', 'false');
                return;
            }
            try {
                const rows = await sync.list();
                list.replaceChildren(...(rows.length ? rows.map(row => {
                    const isOpen = row.name === openName;
                    return el('li', { class: isOpen ? 'account-item is-current' : 'account-item' },
                        el('div', { class: 'account-item-text' },
                            el('strong', { text: row.name }),
                            el('span', { class: 'muted', text: `${isOpen ? 'Fiche ouverte · ' : ''}modifiée le ${formatDate(row.updated_at)}` })),
                        el('div', { class: 'account-item-actions' },
                            el('button', {
                                type: 'button', class: 'btn', disabled: isOpen,
                                'aria-label': `Ouvrir ${row.name}`,
                                on: { click: () => { close(); sync.open(row.name); } }
                            }, icon('book'), el('span', { class: 'btn-label', text: 'Ouvrir' })),
                            el('button', {
                                type: 'button', class: 'btn btn-danger btn-square',
                                'aria-label': `Supprimer ${row.name} de mon compte`,
                                title: 'Supprimer de mon compte',
                                on: { click: () => removeCharacter(row.name) }
                            }, icon('trash'))));
                }) : [el('li', { class: 'muted', text: 'Aucun personnage enregistré en ligne pour le moment.' })]));
            } catch (error) {
                list.replaceChildren(el('li', { class: 'account-message is-error' }, icon('warning'), el('span', { text: error.message })));
            }
            list.setAttribute('aria-busy', 'false');
        }

        async function removeCharacter(name) {
            const ok = await confirmModal({
                title: 'Supprimer de mon compte ?',
                message: `« ${name} » sera supprimé définitivement de votre compte en ligne. La fiche ouverte dans ce navigateur n'est pas effacée.`,
                confirmLabel: 'Supprimer définitivement',
                danger: true
            });
            if (!ok) return;
            await sync.remove(name);
            refresh();
        }

        close = openModal({
            title: '👥 Mes personnages',
            wide: true,
            body: [list, el('p', { class: 'muted', text: 'Pour créer un nouveau personnage : « Nouvelle fiche » dans la barre Gestion.' })],
            actions: [{ label: 'Fermer' }]
        });
        refresh();
    }

    // ------------------------------------------------------------------ Événements
    // Champ Nom : pendant la saisie, aucun renommage ni création sous un nom à moitié tapé
    const nameField = document.getElementById('f-char_name');
    nameField?.addEventListener('focus', () => sync.setNameEditing(true));
    nameField?.addEventListener('blur', () => sync.setNameEditing(false));
    nameField?.addEventListener('change', () => sync.nameCommitted());

    window.addEventListener('pagehide', () => { sync.flush(); });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') sync.flush();
        else if (sync.getState().user) sync.check();
    });
    window.addEventListener('online', () => {
        if (sync.getState().user) sync.check();
    });

    if (client) {
        // Pas d'appel Supabase directement dans le gestionnaire (recommandation de la bibliothèque)
        client.auth.onAuthStateChange((event, session) => {
            setTimeout(() => {
                if (event === 'PASSWORD_RECOVERY') openNewPasswordModal();
                sync.setUser(session?.user ?? null);
            }, 0);
        });
    }
}
