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
    console.log('🔍 Supabase : Vérification de la session...');
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) console.error('❌ Supabase Auth Error:', error.message);
    updateUIForUser(user);
}
// On attend un petit peu que storage.js soit chargé avant de checker l'user
setTimeout(checkUser, 500);

async function updateUIForUser(user) {
    window.currentUser = user;
    console.log('👤 Utilisateur actuel :', user ? user.email : 'Non connecté');

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

console.log('✨ Supabase : Instance client connectée et prête');

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
