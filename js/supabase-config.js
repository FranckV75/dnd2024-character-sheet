/**
 * SUPABASE-CONFIG.JS
 * Initialisation du client Supabase pour la synchronisation cloud.
 */

const SUPABASE_URL = 'https://yhblszojptpcyrmyogvo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TUhtpo9_mc6BRiIqHMmgQA_PanYvpe7';

// On utilise window.supabase pour accéder à la librairie chargée par le CDN
// et on crée notre instance client.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// On remplace le nom global 'supabase' par notre instance connectée
// pour que storage.js puisse l'utiliser directement.
window.supabase = supabaseClient;

console.log('✨ Supabase : Instance client connectée et prête');
