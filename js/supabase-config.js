/**
 * SUPABASE-CONFIG.JS
 * Initialisation du client Supabase pour la synchronisation cloud.
 */

const SUPABASE_URL = 'https://yhblszojptpcyrmyogvo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TUhtpo9_mc6BRiIqHMmgQA_PanYvpe7';

// Créer le client Supabase à partir de la librairie CDN, puis exposer sous window.sb
// (window.sb évite d'écraser window.supabase qui contient la librairie elle-même)
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.sb = sb;

// Etat de l'utilisateur (Global pour être accessible partout)
window.currentUser = null;

// Flag pour éviter le double-chargement (INITIAL_SESSION + SIGNED_IN)
let _initialLoadDone = false;

// Écoute réactive de l'état d'authentification Supabase
// Remplace l'ancien setTimeout(checkUser, 500) — plus fiable et instantané.
sb.auth.onAuthStateChange((event, session) => {
    const user = session?.user ?? null;

    // Éviter le double-appel de loadData au démarrage
    // (onAuthStateChange émet INITIAL_SESSION puis potentiellement SIGNED_IN)
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (_initialLoadDone) return;
        _initialLoadDone = true;
    }

    // Réinitialiser le flag lors d'une déconnexion
    if (event === 'SIGNED_OUT') {
        _initialLoadDone = false;
    }

    updateUIForUser(user);
});

async function updateUIForUser(user) {
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
        if (typeof loadData === 'function') {
            loadData();
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

async function signOut() {
    await sb.auth.signOut();
    updateUIForUser(null);
    showModal('Déconnecté !');
}


/**
 * AUTHENTIFICATION UI
 */

function openAuthModal() {
    const content = `
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">
            <input type="email" id="auth-email" placeholder="Email" class="std-input">
            <input type="password" id="auth-pwd" placeholder="Mot de passe" class="std-input">
            <div style="display:flex; gap:10px; margin-top:10px;">
                <button class="btn" onclick="handleAuthAction('signin')">Connexion</button>
                <button class="btn btn-save" onclick="handleAuthAction('signup')">Créer un compte</button>
            </div>
            <p style="font-size:0.7rem; color:#666; margin-top:5px;">Si c'est votre première fois, cliquez sur 'Créer un compte'.</p>
        </div>
    `;

    showModal('Accès au Grimoire Cloud');
    const modalContent = document.querySelector('.modal-content');
    const authWrapper = document.getElementById('auth-wrapper') || document.createElement('div');
    authWrapper.id = 'auth-wrapper';
    authWrapper.innerHTML = content;
    modalContent.appendChild(authWrapper);
}

async function handleAuthAction(type) {
    const email = document.getElementById('auth-email').value;
    const pwd = document.getElementById('auth-pwd').value;

    if (!email || !pwd) {
        showModal('Veuillez remplir email et mot de passe.');
        return;
    }

    try {
        if (type === 'signup') {
            const { error } = await sb.auth.signUp({ email, password: pwd });
            if (error) throw error;
            showModal('Compte créé ! Vous pouvez maintenant vous connecter.');
        } else {
            const { error, data } = await sb.auth.signInWithPassword({ email, password: pwd });
            if (error) throw error;
            updateUIForUser(data.user);
            const modal = document.getElementById('custom-modal');
            if (modal) modal.style.display = 'none';
            showModal('Connexion réussie !');
        }
    } catch (err) {
        showModal('Erreur: ' + (err.message || '').replace(/<[^>]*>/g, ''));
    }
}

// =============================================================================
// GESTION MULTI-PERSONNAGES (Cloud)
// =============================================================================

/**
 * Récupère la liste de tous les personnages de l'utilisateur connecté
 * @returns {Array} - Tableau de {name, updated_at}
 */
async function fetchCharacters() {
    if (!window.currentUser) return [];
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

/**
 * Supprimer un personnage du Cloud
 * @param {string} charName - Nom du personnage à supprimer
 */
async function deleteCharacter(charName) {
    if (!window.currentUser || !charName) return;
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

/**
 * Renomme un personnage dans le Cloud (séquence delete + insert)
 * @param {string} oldName - Ancien nom
 * @param {string} newName - Nouveau nom
 * @param {Object} data    - Données actuelles du personnage
 */
async function renameCharacter(oldName, newName, data) {
    if (!window.currentUser || !newName) return;
    try {
        // 1. D'abord : créer/mettre à jour sous le nouveau nom
        const { error } = await sb
            .from('characters')
            .upsert({
                name: newName,
                data: data,
                user_id: window.currentUser.id,
                updated_at: new Date()
            }, { onConflict: 'name, user_id' });
        if (error) throw error;

        // 2. Seulement après succès : supprimer l'ancien
        if (oldName !== newName) {
            await deleteCharacter(oldName);
        }
    } catch (err) {
        console.warn('❌ renameCharacter:', err.message);
        if (typeof showModal === 'function') {
            showModal('⚠️ Le renommage a échoué. Votre personnage est intact sous son ancien nom.');
        }
    }
}
