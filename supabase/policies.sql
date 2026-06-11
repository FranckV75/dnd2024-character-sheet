-- =============================================================================
-- Politiques de sécurité RLS pour la table 'characters'
-- À appliquer dans le SQL Editor de la console Supabase.
-- Projet : Feuille de Personnage D&D 2024
-- Date : 11/06/2026 (Story B — Sécuriser et documenter Supabase)
-- =============================================================================

-- 1. Activer la sécurité au niveau des lignes (RLS)
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- 2. Politique de lecture (SELECT)
-- Un utilisateur connecté ne peut lire que ses propres personnages.
CREATE POLICY "Les utilisateurs peuvent lire leurs propres personnages"
ON characters FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Politique d'insertion (INSERT)
-- Un utilisateur connecté ne peut ajouter des personnages que pour son propre ID.
CREATE POLICY "Les utilisateurs peuvent créer leurs propres personnages"
ON characters FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Politique de mise à jour (UPDATE)
-- Un utilisateur connecté ne peut modifier que ses propres personnages.
CREATE POLICY "Les utilisateurs peuvent modifier leurs propres personnages"
ON characters FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Politique de suppression (DELETE)
-- Un utilisateur connecté ne peut supprimer que ses propres personnages.
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres personnages"
ON characters FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
