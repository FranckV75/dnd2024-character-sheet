// =============================================================================
// REPOSITORY.JS - Accès à la table Supabase « characters » (même table que la v3)
//
// Colonnes : user_id (propriétaire), name (nom du personnage), data (fiche JSON),
// updated_at. Une fiche est identifiée par (name, user_id), clé unique. Les règles
// RLS (supabase/policies.sql) garantissent qu'un joueur ne voit que ses fiches.
//
// Écritures sûres :
//  - insertCharacter ne fait que CRÉER (refus si le nom existe déjà) ;
//  - updateIfUnchanged ne remplace que si la version en ligne est toujours celle
//    connue (même updated_at) : une modification faite ailleurs n'est jamais écrasée.
// Le client est passé en paramètre : les tests utilisent un faux client.
// Les erreurs sont levées telles quelles (voir friendlyError dans sync.js).
// =============================================================================

import { friendlyError } from './sync.js';

const TABLE = 'characters';

function fail(action, error) {
    throw new Error(`${action} : ${friendlyError(error)}`);
}

const isUniqueViolation = (error) => error?.code === '23505' || error?.status === 409 || /duplicate key/i.test(error?.message || '');

/**
 * Liste des personnages en ligne, du plus récent au plus ancien.
 * @returns {Promise<Array<{name: string, updated_at: string}>>}
 */
export async function listCharacters(client, userId) {
    const { data, error } = await client.from(TABLE)
        .select('name, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
    if (error) fail('Lecture de la liste des personnages', error);
    return data || [];
}

/**
 * Une fiche en ligne : par son nom, ou la plus récente si name est vide.
 * @returns {Promise<{name: string, data: Object, updated_at: string} | null>}
 */
export async function fetchCharacter(client, userId, name = '') {
    let query = client.from(TABLE).select('name, data, updated_at').eq('user_id', userId);
    query = name ? query.eq('name', name) : query.order('updated_at', { ascending: false });
    const { data, error } = await query.limit(1);
    if (error) fail('Lecture du personnage', error);
    return data?.[0] || null;
}

/**
 * Crée une fiche en ligne. Ne remplace jamais une fiche existante.
 * @returns {Promise<{ ok: true, updatedAt: string } | { conflict: true }>}
 */
export async function insertCharacter(client, userId, name, character, now = new Date()) {
    const updatedAt = now.toISOString();
    const { data, error } = await client.from(TABLE)
        .insert({ name, data: character, user_id: userId, updated_at: updatedAt })
        .select('updated_at');
    if (error) {
        if (isUniqueViolation(error)) return { conflict: true };
        fail('Création en ligne', error);
    }
    // Valeur réellement enregistrée par la base (format ou précision pouvant différer)
    return { ok: true, updatedAt: data?.[0]?.updated_at || updatedAt };
}

/**
 * Remplace la fiche en ligne seulement si elle est toujours à la version connue.
 * @returns {Promise<string|null>} Nouvelle date updated_at, ou null si la version en ligne
 *          a changé (ou n'existe plus) : rien n'a été écrit.
 */
export async function updateIfUnchanged(client, userId, name, character, knownUpdatedAt, now = new Date()) {
    const updatedAt = now.toISOString();
    const { data, error } = await client.from(TABLE)
        .update({ data: character, updated_at: updatedAt })
        .eq('user_id', userId)
        .eq('name', name)
        .eq('updated_at', knownUpdatedAt)
        .select('updated_at');
    if (error) fail('Enregistrement en ligne', error);
    return data && data.length ? (data[0].updated_at || updatedAt) : null;
}

export async function deleteCharacter(client, userId, name) {
    const { error } = await client.from(TABLE).delete().eq('user_id', userId).eq('name', name);
    if (error) fail('Suppression du personnage', error);
}

/**
 * Supprime seulement si la fiche en ligne est toujours à la version connue.
 * @returns {Promise<boolean>} true si supprimée, false si elle a changé entre-temps (conservée)
 */
export async function deleteIfUnchanged(client, userId, name, knownUpdatedAt) {
    const { data, error } = await client.from(TABLE).delete()
        .eq('user_id', userId).eq('name', name).eq('updated_at', knownUpdatedAt)
        .select('name');
    if (error) fail('Suppression du personnage', error);
    return Boolean(data && data.length);
}
