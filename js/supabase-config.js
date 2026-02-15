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
