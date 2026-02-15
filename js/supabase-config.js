/**
 * SUPABASE-CONFIG.JS
 * Initialisation du client Supabase pour la synchronisation cloud.
 */

const SUPABASE_URL = 'https://yhblszojptpcyrmyogvo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TUhtpo9_mc6BRiIqHMmgQA_PanYvpe7';

// On utilise window.supabase pour accéder à la librairie chargée par le CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabase = supabaseClient;

// Etat de l'utilisateur
let currentUser = null;

// Initialisation au chargement
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    updateUIForUser(user);
}
checkUser();

async function updateUIForUser(user) {
    currentUser = user;
    const authStatus = document.getElementById('auth-status');
    const authBtn = document.getElementById('auth-btn');
    if (user) {
        authStatus.textContent = 'Connecté';
        authStatus.style.color = '#27ae60';
        authBtn.textContent = '👤 Déconnexion';
        authBtn.onclick = signOut;
        loadData(); // Recharger les données du cloud pour cet utilisateur
    } else {
        authStatus.textContent = 'Hors-ligne';
        authStatus.style.color = '#8b4513';
        authBtn.textContent = '👤 Se connecter';
        authBtn.onclick = openAuthModal;
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

    showModal('Accès au Grimoire Cloud', null, true);
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
        alert('Veuillez remplir email et mot de passe.');
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
        alert('Erreur: ' + err.message);
    }
}
