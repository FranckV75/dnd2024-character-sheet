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
