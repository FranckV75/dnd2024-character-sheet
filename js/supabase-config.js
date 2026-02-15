/**
 * SUPABASE-CONFIG.JS
 * Initialisation du client Supabase pour la synchronisation cloud.
 */

const SUPABASE_URL = 'https://yhblszojptpcyrmyogvo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TUhtpo9_mc6BRiIqHMmgQA_PanYvpe7';

// Création du client global
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✨ Supabase : Client initialisé');
