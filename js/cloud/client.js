// =============================================================================
// CLIENT.JS - Client Supabase (projet partagé avec la v3)
//
// La bibliothèque est chargée par index.html (script CDN avec empreinte SRI),
// qui définit l'objet global `supabase` de la bibliothèque. La clé ci-dessous
// est la clé PUBLIQUE du projet (déjà publique dans la v3) : la sécurité des
// données repose sur les règles RLS (supabase/policies.sql).
// =============================================================================

export const SUPABASE_URL = 'https://yhblszojptpcyrmyogvo.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_TUhtpo9_mc6BRiIqHMmgQA_PanYvpe7';

let client;

/**
 * @returns {Object|null} Client Supabase, ou null si la bibliothèque n'a pas pu se charger (hors ligne)
 */
export function getClient() {
    if (client === undefined) {
        const lib = globalThis.supabase;
        client = lib?.createClient ? lib.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
    }
    return client;
}
