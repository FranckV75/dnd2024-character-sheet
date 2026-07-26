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

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
            if (_initialLoadDone) return;
            _initialLoadDone = true;
        }

        if (event === 'SIGNED_OUT') {
            _initialLoadDone = false;
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
export function openAuthModal() {
    const content = `
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">
            <input type="email" id="auth-email" placeholder="Email" class="std-input">
            <input type="password" id="auth-pwd" placeholder="Mot de passe" class="std-input">
            <div style="display:flex; gap:10px; margin-top:10px;">
                <button class="btn" onclick="window.handleAuthAction('signin')">Connexion</button>
                <button class="btn btn-save" onclick="window.handleAuthAction('signup')">Créer un compte</button>
            </div>
            <p style="font-size:0.7rem; color:#666; margin-top:5px;">Si c'est votre première fois, cliquez sur 'Créer un compte'.</p>
        </div>
    `;

    if (typeof window.showModal === 'function') window.showModal('Accès au Grimoire Cloud');
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        const authWrapper = document.getElementById('auth-wrapper') || document.createElement('div');
        authWrapper.id = 'auth-wrapper';
        authWrapper.innerHTML = content;
        modalContent.appendChild(authWrapper);
    }
}

export async function handleAuthAction(type) {
    const email = document.getElementById('auth-email')?.value;
    const pwd = document.getElementById('auth-pwd')?.value;

    if (!email || !pwd) {
        if (typeof window.showModal === 'function') window.showModal('Veuillez remplir email et mot de passe.');
        return;
    }

    try {
        if (type === 'signup') {
            const { error } = await sb.auth.signUp({ email, password: pwd });
            if (error) throw error;
            if (typeof window.showModal === 'function') window.showModal('Compte créé ! Vous pouvez maintenant vous connecter.');
        } else {
            const { error, data } = await sb.auth.signInWithPassword({ email, password: pwd });
            if (error) throw error;
            updateUIForUser(data.user);
            const modal = document.getElementById('custom-modal');
            if (modal) modal.style.display = 'none';
            if (typeof window.showModal === 'function') window.showModal('Connexion réussie !');
        }
    } catch (err) {
        if (typeof window.showModal === 'function') showModal('Erreur: ' + (err.message || '').replace(/<[^>]*>/g, ''));
    }
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
