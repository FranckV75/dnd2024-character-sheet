/**
 * SUPABASE-CONFIG.JS
 * Initialisation du client Supabase pour la synchronisation cloud.
 */

const SUPABASE_URL = 'https://yhblszojptpcyrmyogvo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TUhtpo9_mc6BRiIqHMmgQA_PanYvpe7';

// On utilise window.supabase pour accéder à la librairie chargée par le CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabase = supabaseClient;

// Etat de l'utilisateur (Global pour être accessible partout)
window.currentUser = null;

// Initialisation au chargement
async function checkUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) console.error('❌ Supabase Auth Error:', error.message);
    updateUIForUser(user);
}
// On attend un petit peu que storage.js soit chargé avant de checker l'user
setTimeout(checkUser, 500);

async function updateUIForUser(user) {
    window.currentUser = user;

    const authStatus = document.getElementById('auth-status');
    const authBtn = document.getElementById('auth-btn');
    if (user) {
        if (authStatus) {
            const shortName = user.email.split('@')[0].toUpperCase().substring(0, 10);
            authStatus.innerHTML = '<span style="color:#2ec27e">✥</span> ' + shortName;
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
    await supabase.auth.signOut();
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
            const { error } = await supabase.auth.signUp({ email, password: pwd });
            if (error) throw error;
            showModal('Compte créé ! Vous pouvez maintenant vous connecter.');
        } else {
            const { error, data } = await supabase.auth.signInWithPassword({ email, password: pwd });
            if (error) throw error;
            updateUIForUser(data.user);
            const modal = document.getElementById('custom-modal');
            if (modal) modal.style.display = 'none';
            showModal('Connexion réussie !');
        }
    } catch (err) {
        showModal('Erreur: ' + err.message);
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
        const { data, error } = await supabase
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
        const { error } = await supabase
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
    await deleteCharacter(oldName);
    if (!window.currentUser || !newName) return;
    try {
        const { error } = await supabase
            .from('characters')
            .upsert({
                name: newName,
                data: data,
                user_id: window.currentUser.id,
                updated_at: new Date()
            }, { onConflict: 'name, user_id' });
        if (error) throw error;
    } catch (err) {
        console.warn('❌ renameCharacter:', err.message);
    }
}
