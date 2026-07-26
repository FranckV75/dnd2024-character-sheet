# 🐉 Feuille de Personnage D&D 2024 — Premium Edition

Une application web interactive, fluide et élégante pour créer et gérer vos personnages selon les règles révisées de **Dungeons & Dragons 2024**.

![D&D 2024 Banner](https://img.shields.io/badge/D%26D-2024-red?style=for-the-badge&logo=dungeons-and-dragons)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-yellow?style=for-the-badge&logo=javascript)
![CSS3](https://img.shields.io/badge/CSS3-Premium-blue?style=for-the-badge&logo=css3)
![Tests](https://img.shields.io/badge/Tests-22%20passing-brightgreen?style=for-the-badge&logo=node.js)
![Supabase Cloud](https://img.shields.io/badge/Cloud-Supabase-emerald?style=for-the-badge&logo=supabase)

## ✨ Caractéristiques

- **Navigation Sémantique à 4 Onglets** 📑 :
  1. *Caractéristiques & Combat* : Caractéristiques, Vitalité, CA dynamique, Dés de vie, Attaques & Armes D&D 2024.
  2. *Aptitudes & Traits* : Dons D&D 2024 par palier d'ASI, Capacité de classe, Traits raciaux & Historique.
  3. *Compétences & Histoire* : Compétences avec maîtrise/expertise, Outils, Langues, Repos court/long & Niveau de fatigue D&D 2024.
  4. *Magie & Équipement* : Grimoire de sorts interactif avec chargement asynchrone, slots de sorts, Armures et Inventaire.
- **D&D 2024 Ready** ⚔️🛡️ : Base de données exhaustive de +70 dons, règles d'armes révisées (maîtrise, propriétés, munitions) et gestion de la fatigue (niveaux 0 à 6).
- **Synchronisation Cloud & Multi-Personnages** 👥 : Sauvegarde sur Supabase avec gestion de roster (créer, charger, copier ou réinitialiser plusieurs fiches).
- **Mode Impression PDF Haute Définition** 🖨️ : Export physique ou PDF formaté sur **exactement 4 pages** sans rognage ni coupure.
- **Ergonomie Tablette & Mode Verrouillé** 📱🔓 : Optimisé pour écrans tablettes (850px - 1100px) et Desktop. Mode verrouillage anti-erreur en cours de partie et mode cinéma.
- **Sécurité & Performance** 🛡️⚡ : Assainissement anti-XSS via DOMPurify, Row Level Security (RLS) Supabase, lazy-loading des sorts et images WebP optimisées.

## 🛠️ Stack Technique

- **HTML5 & CSS3** : Design sémantique, variables CSS, transitions fluides et responsive grid/flexbox.
- **Vanilla JS (ES6+)** : Architecture modulaire sans framework lourd.
- **Persistance** : LocalStorage hybride + Cloud Supabase (Client `@2.43.4` sécurisé).
- **Sécurité** : DOMPurify `3.1.5` pour l'assainissement du contenu riche.
- **Qualité & Tests** : Node.js Test Runner (22 tests unitaires pour `logic.js`), ESLint, Prettier & CI GitHub Actions.

## 🚀 Installation & Commandes

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/FranckV75/dnd2024-character-sheet.git
   cd dnd2024-character-sheet
   ```
2. Installez les dépendances de développement :
   ```bash
   npm install
   ```
3. Exécutez les commandes disponibles :
   - **Serveur de développement** :
     ```bash
     npm run dev
     ```
   - **Lancer les tests unitaires** :
     ```bash
     npm test
     ```
   - **Analyse statique (Linter)** :
     ```bash
     npm run lint
     ```

## 📜 Licence

Ce projet est sous licence ISC. Les règles D&D 2024 sont la propriété de Wizards of the Coast.

---
*Développé avec ❤️ pour l'Odyssée des Seigneurs Dragons & D&D 2024.*
