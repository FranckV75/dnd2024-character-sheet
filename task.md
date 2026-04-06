# v2.4.0 — Refonte Structurelle Majeure

## Story 1 : Navigation 4 Onglets
- [x] Ajouter bouton "✥ Aptitudes & Traits" en 2ème position (`data-tab="traits"`)
- [x] Créer le conteneur `<div id="tab-traits">`
- [x] Vérifier que `initTabs`/`switchTab` gèrent 4 onglets sans modification

## Story 2 : Déplacements de Blocs (HTML pur)
- [x] Déplacer "Traits & Dons" (Onglet 1 → Onglet 2)
- [x] Déplacer "Capacités de Classe" (Onglet 1 → Onglet 2)
- [x] Retirer le bloc Repos de `generateSkillsHTML()` et le placer en HTML statique dans l'Onglet 1
- [x] Déplacer "Outils" et "Langues" (Onglet 1 → Onglet 3, à la place du Repos)
- [x] Supprimer le bloc texte "Armes" redondant dans "Entraînements & Maîtrises"
- [x] Vérifier la persistance (les `data-name` existants doivent continuer à fonctionner)

## Story 3 : Construction de l'Onglet 2 (Aptitudes & Traits)
- [x] Scinder "Traits & Dons" en 2 sous-blocs (Traits + Dons avec 6 emplacements)
- [x] Scinder "Capacités de Classe" en 2 sous-blocs (Capacités + Compagnons/Familiers)
- [x] Ajouter le bloc "Synergie entre les joueurs"
- [x] Ajouter le bloc "Alignement" (1 ligne, texte centré) au-dessus de "Traits de Personnage"
- [x] Persistance OK : les champs `data-name` sont collectés automatiquement par `getFormData()`

## Story 4 : Refonte du Bloc Armes (Onglet 1)
- [x] Renommer "Armes & Sorts Mineurs" → "Armes"
- [x] Ajouter les colonnes de combat : Propriétés, Maîtrise, Munitions (au lieu de Poids/Prix réservés à l'inventaire)
- [x] Menu déroulant auto-complétion dynamique depuis `dd_rules.js` (Armes D&D 2024)
- [x] Système de munitions géré via la colonne libre (format texte, ex: `15/20`)
- [ ] Filtres par catégorie (Courantes, Guerre, CàC, Distance) - *Optionnel/Reporté car l'autocomplétion est globale*
- [x] Réorganiser la zone supérieure (CA, Initiative, PV, Vitesse, etc.) pour meilleur alignement
- [x] Adapter `dynamic_weapons` dans `storage.js` pour sauvegarder Propriétés, Maîtrise et Munitions

## Story 5 : Bloc Armures & Boucliers + Fatigue (Onglet 1)
- [x] Remplacer les checkboxes armures par un tableau détaillé (CA, Force, Discrétion, Poids, Prix, Équipé)
- [x] Menu déroulant armures du manuel
- [x] Ajouter Fatigue D&D 2024 (input 0-6) dans le bloc Repos
- [x] Étendre `storage.js` (`dynamic_armors`, `fatigue_level`)

## Story 6 : Base de Données Équipement & Dons
- [x] Créer `js/equipment-data.js` (armes + armures depuis AideDD/Manuel p212-219)
- [x] Créer `js/feats-data.js` (dons depuis le Manuel)
- [x] Connecter les menus déroulants des Stories 3, 4, 5 aux nouvelles données
- [x] Charger les nouveaux scripts dans `index.html`
## Story 7 : Refonte des Dons (Feats) D&D 2024
- [x] Mettre à jour `feats-data.js` pour inclure la description complète et l'ASI de tous les dons par niveau.
- [x] Dans `index.html`, créer les 6 blocs (1 pour chaque niveau de don : 0/1, 4, 8, 12, 16, 19).
- [x] Connecter chaque bloc à un menu déroulant dynamique triant par "Origine", "Général" ou "Épique" basé sur `feats-data.js`.
- [x] Afficher la description du don sélectionné dans le HTML (`<div class="feat-desc-box">`).

## Story 8 : Correctifs Variés
- [x] Corriger le menu déroulant de la sous-classe dans l'en-tête (Désynchronisation entre `script.js` et la nouvelle structure de `dd_rules.js`)

## Story 9 : Résolution des bugs de sauvegarde
- [x] Corriger la sauvegarde des Dons (les menus déroulants sont oubliés par la boucle de sauvegarde)
- [x] Vérifier et corriger la sauvegarde des Armes (vérification passée avec succès : autosauvegarde fonctionnelle en cas de frappe directe)

## Story 10 : Optimisations du Grimoire
- [x] Remplacer la case à cocher "Préparé" par un champ libre (numérique/textuel)
- [x] Gérer la rétrocompatibilité des sauvegardes existantes (si coché = 1)
