# Audit QA — Feuille de Personnage D&D 2024 (V3.1.0)

## Score de stabilité : **2 / 10** 🔴 (bloqué par SyntaxError)

> [!CAUTION]
> L'application est actuellement non fonctionnelle au chargement. `js/script.js` contient une erreur de syntaxe. Comme il constitue l'unique point d'entrée déclaré avec `type="module"`, aucun module JavaScript ne s'exécute : ni calculs, ni changement d'onglets, ni sauvegarde, ni bascule de thème, ni barre d'outils, ni système de repos. La page affiche uniquement le squelette HTML statique.

---

## 1. Bugs critiques bloquants

### 🔴 C1 — `SyntaxError` dans `script.js` (lignes 2045-2046)
Dans `js/script.js`, la déclaration de fonction est dupliquée :
```javascript
function switchTab(tabName) {
function switchTab(tabName) { // Ligne 2046 dupliquée
```
- `node --check js/script.js` échoue avec `SyntaxError: Unexpected end of input`.
- Aucun import (`store.js`, `logic.js`, etc.) n'est exécuté par le navigateur.
- Tous les autres fichiers `js/*.js` sont syntaxiquement valides (`node --check` OK).

### 🔴 C2 — Handlers inline non exposés sur `window` (ES Modules)
En modules ES, le scope global `window` ne contient pas automatiquement les fonctions. Les attributs HTML `onclick`/`onchange` échouent en `ReferenceError` :
- `triggerReset` (`index.html:94`)
- `toggleSpellTooltips` (`index.html:780`)
- `sortSpells` (`index.html:799-805`)
- `updatePrepCell` (`script.js:1373`)
- `toggleSlot` / `addSpellSlot` / `removeSpellSlot` (`script.js:1626-1629`)
- `closeCalcModal` / `submitCalc` (`index.html:872-873`, fonctions orphelines sans définition JS).

### 🟠 C3 — « Nouvelle fiche » ne réinitialise pas le nom du personnage actif
Dans `js/script.js:2021` : `try { _activeCharName = null; } catch(e) {}`.  
La variable `_activeCharName` est privée dans `js/storage.js:30`. Le reset échoue silencieusement. La prochaine sauvegarde risque d'écraser l'ancien personnage dans le stockage/cloud.

---

## 2. Tests unitaires
- `node --test tests/logic.test.js` : **22/22 tests valides ✅**.
- Le moteur de calcul pur dans `logic.js` est robuste et conforme aux règles D&D 2024.

---

## 3. Ergonomie & Responsive (Tablettes 850px-1100px)
- **850px** : Barre d'outils tronquée ("GALI FON", "EXPC AU FORI JSON"), débordement des titres de caractéristiques (`CONSTITUTION`, `INTELLIGENCE`), cases à cocher déformées en ovales (manque `aspect-ratio: 1`).
- **1024px** : Volet latéral « Gestion » ouvert par défaut masquant le tableau des armes.
- **Thème sombre** : Règle `header .rich-input, header select { color: #2a1b0a !important; }` (`style.css:451`) sans surcharge sombre (risque texte sombre sur fond sombre).
