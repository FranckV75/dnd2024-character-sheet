/**
 * SUPABASE-CONFIG.JS (MODULE ES6)
 * Initialisation du client Supabase pour la synchronisation cloud.
 */

const SUPABASE_URL = 'https://yhblszojptpcyrmyogvo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TUhtpo9_mc6BRiIqHMmgQA_PanYvpe7';

// Créer le client Supabase à partir de la librairie CDN, puis exposer sous window.sb
export const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
window.sb = sb;

// Etat de l'utilisateur (Global pour être accessible partout)
window.currentUser = null;

// Flag pour éviter le double-chargement (INITIAL_SESSION + SIGNED_IN)
let _initialLoadDone = false;

// Écoute réactive de l'état d'authentification Supabase
if (sb) {
    sb.auth.onAuthStateChange((event, session) => {
        const user = session?.user ?? null;

        // Une session initiale vide ne doit pas bloquer la connexion qui suit
        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && user) {
            if (_initialLoadDone) return;
            _initialLoadDone = true;
        }

        if (event === 'SIGNED_OUT') {
            _initialLoadDone = false;
        }

        // Arrivée depuis le lien « mot de passe oublié » reçu par e-mail
        if (event === 'PASSWORD_RECOVERY') {
            setTimeout(openNewPasswordModal, 300);
        }

        updateUIForUser(user);
    });
}

export async function updateUIForUser(user) {
    window.currentUser = user;

    const authStatus = document.getElementById('auth-status');
    const authBtn = document.getElementById('auth-btn');
    if (user) {
        if (authStatus) {
            const shortName = user.email.split('@')[0].toUpperCase().substring(0, 10);
            authStatus.textContent = '✥ ' + shortName;
        }
        if (authBtn) {
            authBtn.textContent = '👤 Déconnexion';
            authBtn.onclick = signOut;
        }
        if (typeof window.loadData === 'function') {
            window.loadData();
        }
    } else {
        if (authStatus) {
            authStatus.textContent = 'HORS-LIGNE';
            authStatus.style.color = '#8b4513';
        }
        if (authBtn) {
            authBtn.textContent = '👤 Se connecter';
            authBtn.onclick = openAuthModal;
        }
    }
}

export async function signOut() {
    if (sb) await sb.auth.signOut();
    updateUIForUser(null);
    if (typeof window.showModal === 'function') window.showModal('Déconnecté !');
}

/**
 * AUTHENTIFICATION UI
 */
/**
 * Crée un champ de saisie du formulaire de connexion.
 * Les attributs name/autocomplete permettent au navigateur (Chrome, Safari/iCloud...)
 * de proposer d'enregistrer puis de préremplir l'identifiant et le mot de passe.
 */
function createAuthInput(type, id, autocomplete, placeholder) {
    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = type === 'email' ? 'email' : 'password';
    input.autocomplete = autocomplete;
    input.placeholder = placeholder;
    input.required = true;
    input.className = 'std-input';
    input.style.cssText = 'width:100%; box-sizing:border-box;';
    return input;
}

function showAuthMessage(message) {
    if (typeof window.showModal === 'function') window.showModal(message);
}

/**
 * Propose au navigateur de mémoriser l'identifiant (Chrome / Edge, API Credential Management).
 * Safari et Firefox s'appuient sur l'envoi du formulaire et les attributs autocomplete.
 */
async function rememberCredentials(form) {
    try {
        if (window.PasswordCredential && navigator.credentials) {
            await navigator.credentials.store(new window.PasswordCredential(form));
        }
    } catch (e) {
        // Refus de l'utilisateur ou navigateur non compatible : rien à faire
    }
}

/**
 * AUTHENTIFICATION UI
 */
export function openAuthModal() {
    if (typeof window.showModal !== 'function') return;

    window.showModal((txt, btns, inp, area, close) => {
        const title = document.createElement('b');
        title.textContent = 'Accès au Grimoire Cloud';
        txt.appendChild(title);

        const form = document.createElement('form');
        form.id = 'auth-form';
        form.method = 'post';
        form.action = '#';
        form.autocomplete = 'on';
        form.style.cssText = 'display:flex; flex-direction:column; gap:10px; margin-top:16px;';

        const emailInput = createAuthInput('email', 'auth-email', 'username', 'Email');
        const pwdInput = createAuthInput('password', 'auth-pwd', 'current-password', 'Mot de passe');

        const row = document.createElement('div');
        row.style.cssText = 'display:flex; gap:10px; flex-wrap:wrap; margin-top:6px;';

        const btnSignin = document.createElement('button');
        btnSignin.type = 'submit';
        btnSignin.className = 'btn';
        btnSignin.textContent = 'Connexion';

        const btnSignup = document.createElement('button');
        btnSignup.type = 'button';
        btnSignup.className = 'btn btn-save';
        btnSignup.textContent = 'Créer un compte';

        const btnForgot = document.createElement('button');
        btnForgot.type = 'button';
        btnForgot.className = 'btn';
        btnForgot.style.cssText = 'background:none; border:none; box-shadow:none; text-decoration:underline; padding:0; font-size:0.75rem; align-self:flex-start; cursor:pointer;';
        btnForgot.textContent = 'Mot de passe oublié ?';

        const hint = document.createElement('p');
        hint.style.cssText = 'font-size:0.7rem; opacity:0.75; margin:0;';
        hint.textContent = "Si c'est votre première fois, cliquez sur « Créer un compte ». Votre navigateur pourra ensuite retenir votre mot de passe.";

        row.append(btnSignin, btnSignup);
        form.append(emailInput, pwdInput, row, btnForgot, hint);
        txt.appendChild(form);

        const btnCancel = document.createElement('button');
        btnCancel.type = 'button';
        btnCancel.className = 'btn';
        btnCancel.textContent = 'Annuler';
        btnCancel.addEventListener('click', close);
        btns.appendChild(btnCancel);

        // « Connexion » = envoi du formulaire : c'est ce signal qui déclenche
        // la proposition d'enregistrement du mot de passe par le navigateur
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            pwdInput.autocomplete = 'current-password';
            handleAuthAction('signin', form);
        });

        btnSignup.addEventListener('click', () => {
            if (!form.reportValidity()) return;
            pwdInput.autocomplete = 'new-password';
            handleAuthAction('signup', form);
        });

        btnForgot.addEventListener('click', () => {
            const email = emailInput.value.trim();
            if (!email) {
                hint.textContent = '➜ Saisissez votre email ci-dessus, puis cliquez sur « Mot de passe oublié ? » : vous recevrez un lien pour en choisir un nouveau.';
                emailInput.focus();
                return;
            }
            sendPasswordReset(email);
        });

        setTimeout(() => emailInput.focus(), 80);
    });
}

export async function handleAuthAction(type, form = document.getElementById('auth-form')) {
    const email = document.getElementById('auth-email')?.value.trim();
    const pwd = document.getElementById('auth-pwd')?.value;

    if (!email || !pwd) {
        showAuthMessage('Veuillez remplir email et mot de passe.');
        return;
    }
    if (!sb) {
        showAuthMessage('Le service de sauvegarde en ligne est indisponible pour le moment.');
        return;
    }

    try {
        if (type === 'signup') {
            const { error } = await sb.auth.signUp({ email, password: pwd });
            if (error) throw error;
            if (form) await rememberCredentials(form);
            showAuthMessage('Compte créé ! Vous pouvez maintenant vous connecter.');
        } else {
            const { error, data } = await sb.auth.signInWithPassword({ email, password: pwd });
            if (error) throw error;
            if (form) await rememberCredentials(form);
            updateUIForUser(data.user);
            showAuthMessage('Connexion réussie !');
        }
    } catch (err) {
        const message = (err.message || '').replace(/<[^>]*>/g, '');
        if (/invalid login credentials/i.test(message)) {
            showAuthMessage('Email ou mot de passe incorrect. En cas d\'oubli, utilisez « Mot de passe oublié ? ».');
        } else {
            showAuthMessage('Erreur : ' + message);
        }
    }
}

/**
 * Envoie l'e-mail de réinitialisation du mot de passe.
 * Le lien ramène sur la fiche, qui propose alors de choisir un nouveau mot de passe.
 */
export async function sendPasswordReset(email) {
    if (!email) {
        showAuthMessage('Saisissez d\'abord votre email dans le champ prévu, puis cliquez à nouveau sur « Mot de passe oublié ? ».');
        return;
    }
    if (!sb) {
        showAuthMessage('Le service de sauvegarde en ligne est indisponible pour le moment.');
        return;
    }
    try {
        const redirectTo = window.location.origin + window.location.pathname;
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        showAuthMessage('📧 Si un compte existe pour ' + email + ', un e-mail de réinitialisation vient d\'être envoyé. Pensez à vérifier vos courriers indésirables.');
    } catch (err) {
        showAuthMessage('Erreur : ' + (err.message || '').replace(/<[^>]*>/g, ''));
    }
}

/**
 * Fenêtre « Choisir un nouveau mot de passe » (après le lien reçu par e-mail).
 */
function openNewPasswordModal() {
    if (typeof window.showModal !== 'function') return;

    window.showModal((txt, btns, inp, area, close) => {
        const title = document.createElement('b');
        title.textContent = 'Choisissez un nouveau mot de passe';
        txt.appendChild(title);

        const form = document.createElement('form');
        form.method = 'post';
        form.action = '#';
        form.style.cssText = 'display:flex; flex-direction:column; gap:10px; margin-top:16px;';

        const pwdInput = createAuthInput('password', 'auth-new-pwd', 'new-password', 'Nouveau mot de passe (6 caractères min.)');
        pwdInput.minLength = 6;

        const btnSave = document.createElement('button');
        btnSave.type = 'submit';
        btnSave.className = 'btn btn-save';
        btnSave.textContent = 'Enregistrer';

        form.append(pwdInput, btnSave);
        txt.appendChild(form);

        const btnCancel = document.createElement('button');
        btnCancel.type = 'button';
        btnCancel.className = 'btn';
        btnCancel.textContent = 'Plus tard';
        btnCancel.addEventListener('click', close);
        btns.appendChild(btnCancel);

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                const { error } = await sb.auth.updateUser({ password: pwdInput.value });
                if (error) throw error;
                await rememberCredentials(form);
                showAuthMessage('✅ Mot de passe modifié. Votre navigateur peut maintenant le retenir.');
            } catch (err) {
                showAuthMessage('Erreur : ' + (err.message || '').replace(/<[^>]*>/g, ''));
            }
        });

        setTimeout(() => pwdInput.focus(), 80);
    });
}

// GESTION MULTI-PERSONNAGES (Cloud)

export async function fetchCharacters() {
    if (!window.currentUser || !sb) return [];
    try {
        const { data, error } = await sb
            .from('characters')
            .select('name, updated_at')
            .eq('user_id', window.currentUser.id)
            .order('updated_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.warn('❌ fetchCharacters:', err.message);
        return [];
    }
}

export async function deleteCharacter(charName) {
    if (!window.currentUser || !charName || !sb) return;
    try {
        const { error } = await sb
            .from('characters')
            .delete()
            .eq('user_id', window.currentUser.id)
            .eq('name', charName);
        if (error) throw error;
    } catch (err) {
        console.warn('❌ deleteCharacter:', err.message);
    }
}

export async function renameCharacter(oldName, newName, data) {
    if (!window.currentUser || !newName || !sb) return;
    try {
        const { error } = await sb
            .from('characters')
            .upsert({
                name: newName,
                data: data,
                user_id: window.currentUser.id,
                updated_at: new Date()
            }, { onConflict: 'name, user_id' });
        if (error) throw error;

        if (oldName !== newName) {
            await deleteCharacter(oldName);
        }
    } catch (err) {
        console.warn('❌ renameCharacter:', err.message);
        if (typeof window.showModal === 'function') {
            window.showModal('⚠️ Le renommage a échoué. Votre personnage est intact sous son ancien nom.');
        }
    }
}

// Bindings globaux window pour HTML handlers
window.updateUIForUser = updateUIForUser;
window.signOut = signOut;
window.openAuthModal = openAuthModal;
window.handleAuthAction = handleAuthAction;
window.fetchCharacters = fetchCharacters;
window.deleteCharacter = deleteCharacter;
window.renameCharacter = renameCharacter;
