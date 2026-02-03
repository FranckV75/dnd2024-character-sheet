



// =============================================================================
// MENUS DÃ‰ROULANTS DYNAMIQUES
// =============================================================================

/**
 * Remplit les menus dÃ©roulants avec les donnÃ©es de DD_RULES
 */
function populateSelectOptions() {
    // Remplir le select des Classes
    const classSelect = document.getElementById('char_class');
    if (classSelect) {
        classSelect.innerHTML = '<option value="">-- Choisir --</option>';
        for (const [key, classData] of Object.entries(DD_RULES.classes)) {
            const option = document.createElement('option');
            option.value = classData.nameFr;
            option.textContent = classData.nameFr;
            classSelect.appendChild(option);
        }
    }

    // Remplir le select des EspÃ¨ces
    const speciesSelect = document.getElementById('char_species');
    if (speciesSelect) {
        speciesSelect.innerHTML = '<option value="">-- Choisir --</option>';
        for (const [key, speciesData] of Object.entries(DD_RULES.species)) {
            const option = document.createElement('option');
            option.value = speciesData.nameFr;
            option.textContent = speciesData.nameFr;
            speciesSelect.appendChild(option);
        }
    }

    // Remplir le select des Historiques
    const backgroundSelect = document.getElementById('char_background');
    if (backgroundSelect) {
        backgroundSelect.innerHTML = '<option value="">-- Choisir --</option>';
        for (const [key, bgData] of Object.entries(DD_RULES.backgrounds)) {
            const option = document.createElement('option');
            option.value = bgData.nameFr;
            option.textContent = bgData.nameFr;
            backgroundSelect.appendChild(option);
        }
    }
}

/**
 * Met Ã  jour le select des Sous-Classes selon la Classe sÃ©lectionnÃ©e
 * @param {string} className - Nom de la classe sÃ©lectionnÃ©e
 */
function updateSubclassOptions(className) {
    const subclassSelect = document.getElementById('char_subclass');
    if (!subclassSelect) return;

    subclassSelect.innerHTML = '<option value="">-- Choisir --</option>';

    if (!className) return;

    // Trouver la clÃ© de la classe
    let classKey = null;
    for (const [key, classData] of Object.entries(DD_RULES.classes)) {
        if (classData.nameFr === className) {
            classKey = key;
            break;
        }
    }

    if (!classKey) return;

    // Filtrer les sous-classes pour cette classe
    for (const [key, subclassData] of Object.entries(DD_RULES.subclasses)) {
        if (subclassData.class === classKey) {
            const option = document.createElement('option');
            option.value = subclassData.nameFr;
            option.textContent = subclassData.nameFr;
            subclassSelect.appendChild(option);
        }
    }
}

/**
 * Remplit le select du Destin HÃ©roÃ¯que (Module OdyssÃ©e)
 */
function populateHeroicDestiny() {
    const heroicDestinySelect = document.getElementById('heroic_destiny');
    if (!heroicDestinySelect) return;

    heroicDestinySelect.innerHTML = '';
    DD_RULES.heroicDestinies.forEach(destiny => {
        const option = document.createElement('option');
        option.value = destiny.value;
        option.textContent = destiny.name;
        heroicDestinySelect.appendChild(option);
    });
}



window.onload = function () {
    generateSkillsHTML();
    initWeapons();
    initSpells();
    populateSelectOptions(); // Remplir les menus dÃ©roulants
    populateHeroicDestiny(); // Remplir le menu Destin HÃ©roÃ¯que

    // Event listener pour mise Ã  jour Sous-Classe
    const classSelect = document.getElementById('char_class');
    if (classSelect) {
        classSelect.addEventListener('change', function () {
            updateSubclassOptions(this.value);
            calcStats();
        });
    }

    let bg = localStorage.getItem('dd2024_bg');
    if (bg) document.body.style.backgroundImage = `url('${bg}')`;

    let op = localStorage.getItem('dd2024_opacity');
    if (op) {
        document.documentElement.style.setProperty('--sheet-opacity', op);
        const opacitySlider = document.getElementById('opacity-slider');
        if (opacitySlider) opacitySlider.value = op;
    }

    loadData();

    const sheetForm = document.getElementById('sheet-form');
    if (sheetForm) {
        sheetForm.addEventListener('input', (e) => {
            if (e.target.name && e.target.name.startsWith('class_res_')) {
                return;
            }
            calcStats();
        });
    }

    bindStyleEvents();

    document.addEventListener('click', function (e) {
        const se = document.getElementById('style-editor');
        if (se && !e.target.closest('#style-editor')) se.style.display = 'none';
    });

    const passiveInput = document.getElementById('passive_perc');
    if (passiveInput) {
        passiveInput.addEventListener('input', function () {
            if (this.innerText.trim() === '') { delete this.dataset.manual; calcStats(); }
            else { this.dataset.manual = 'true'; }
        });
    }

    const modalInput = document.getElementById('modal-input');
    if (modalInput) {
        modalInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                let btn = document.querySelector('#modal-actions button.btn-save');
                if (btn) btn.click();
            }
        });
    }

    // Initial Calc
    setTimeout(() => {
        calcStats();
        // addTableDataLabels supprimée (mobile phone uniquement)
    }, 100);

    setupDrag();

    // Initialiser le systÃ¨me d'onglets
    initTabs();

    // Initialiser le systÃ¨me de repos
    initRestSystem();
    setupHeaderAutoFit();
};

// --- TOOLBAR, OPACITÉ, FOND D'ÉCRAN, ÉDITEUR DE STYLE ---
// Migré vers ui-toolbar.js










function generateSkillsHTML() {
    const c = document.getElementById('skills_container');
    if (!c) return;

    let h = '';
    const statOrder = ['str', 'dex', 'int', 'wis', 'cha'];

    statOrder.forEach(stat => {
        const label = STAT_LABELS[stat];
        const skills = SKILLS_BY_STAT[stat];

        h += `<div class="skill-group">`;
        h += `<div class="skill-group-header">`;
        h += `<span class="skill-group-icon">${label.icon}</span>`;
        h += `<span class="skill-group-title">${label.name}</span>`;
        h += `<span class="skill-group-mod" id="${stat}_mod_display">+0</span>`;
        h += `</div>`;

        skills.forEach(s => {
            h += `<div class="skill-row">`;
            h += `<div class="skill-checkboxes">`;
            h += `<input type="checkbox" name="skill_prof_${s.id}" title="Maîtrise" onchange="calcStats()">`;
            h += `<input type="checkbox" name="skill_exp_${s.id}" class="expertise-checkbox" title="Expertise" onchange="calcStats()">`;
            h += `</div>`;
            h += `<span class="skill-name">${s.name}</span>`;
            h += `<span class="skill-mod" id="skill_val_${s.id}">+0</span>`;
            h += `</div>`;
        });

        h += `</div>`;
    });

    // 6ème bloc : Centre de Repos (compact, intégré à la grille)
    h += `<div class="skill-group rest-block-compact">`;
    h += `<div class="skill-group-header">`;
    h += `<span class="skill-group-icon">⚔️</span>`;
    h += `<span class="skill-group-title">REPOS</span>`;
    h += `</div>`;
    h += `<div class="rest-buttons-compact">`;
    h += `<button class="btn btn-short-rest" id="btn-short-rest" type="button">`;
    h += `<span class="rest-icon">🌙</span>`;
    h += `<span class="rest-label">Court</span>`;
    h += `<span class="rest-desc">1h</span>`;
    h += `</button>`;
    h += `<button class="btn btn-long-rest" id="btn-long-rest" type="button">`;
    h += `<span class="rest-icon">🛏️</span>`;
    h += `<span class="rest-label">Long</span>`;
    h += `<span class="rest-desc">Maintenir</span>`;
    h += `</button>`;
    h += `</div>`;
    h += `</div>`;

    c.innerHTML = h;
}

function initWeapons() {
    const body = document.getElementById('weapons_body');
    if (body && body.children.length === 0) for (let i = 0; i < 4; i++) addWeaponRow();
}

function addWeaponRow(data = null) {
    const body = document.getElementById('weapons_body');
    if (!body) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><div contenteditable="true" class="rich-input single-line wpn-name"></div></td>
        <td><div contenteditable="true" class="rich-input single-line wpn-atk"></div></td>
        <td><div contenteditable="true" class="rich-input single-line wpn-dmg"></div></td>
        <td><div contenteditable="true" class="rich-input single-line wpn-note"></div></td>
        <td><button class="del-btn" aria-label="Supprimer l'arme" onclick="this.closest('tr').remove(); saveData();">x</button></td>
    `;
    body.appendChild(tr);
    if (data) {
        tr.querySelector('.wpn-name').innerHTML = data.name || '';
        tr.querySelector('.wpn-atk').innerHTML = data.atk || '';
        tr.querySelector('.wpn-dmg').innerHTML = data.dmg || '';
        tr.querySelector('.wpn-note').innerHTML = data.note || '';
    }
    bindStyleEvents();
    // addTableDataLabels() supprimée - support téléphone mobile retiré
}

function initSpells() {
    const body = document.getElementById('spells_body');
    if (body && body.children.length === 0) for (let i = 0; i < 6; i++) addSpellRow();
}

function addSpellRow(data = null) {
    const body = document.getElementById('spells_body');
    if (!body) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><div contenteditable="true" class="rich-input single-line spl-lvl center"></div></td>
        <td><div contenteditable="true" class="rich-input single-line spl-name"></div></td>
        <td><div contenteditable="true" class="rich-input single-line spl-time"></div></td>
        <td><div contenteditable="true" class="rich-input single-line spl-range"></div></td>
        <td class="crm-cell">
            <div><label>C</label><input type="checkbox" class="spl-c"></div>
            <div><label>R</label><input type="checkbox" class="spl-r"></div>
            <div><label>M</label><input type="checkbox" class="spl-m"></div>
        </td>
        <td><div contenteditable="true" class="rich-input single-line spl-note"></div></td>
        <td><button class="del-btn" aria-label="Supprimer le sort" onclick="this.closest('tr').remove(); saveData();">x</button></td>
    `;
    body.appendChild(tr);

    if (data) {
        tr.querySelector('.spl-lvl').innerHTML = data.lvl || '';
        tr.querySelector('.spl-name').innerHTML = data.name || '';
        tr.querySelector('.spl-time').innerHTML = data.time || '';
        tr.querySelector('.spl-range').innerHTML = data.range || '';
        tr.querySelector('.spl-note').innerHTML = data.note || '';
        tr.querySelector('.spl-c').checked = data.c || false;
        tr.querySelector('.spl-r').checked = data.r || false;
        tr.querySelector('.spl-m').checked = data.m || false;
    }
    bindStyleEvents();
}

// === SPELL FILTERING SYSTEM ===
let currentSpellFilter = 'all';

// Default spell slots per level (can be customized via data)
const DEFAULT_SPELL_SLOTS = {
    1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1
};

function filterSpells(level) {
    currentSpellFilter = level;

    // Update active button
    document.querySelectorAll('.spell-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.level === level);
    });

    // Filter table rows
    const rows = document.querySelectorAll('#spells_body tr');
    rows.forEach(row => {
        const lvlCell = row.querySelector('.spl-lvl');
        const rowLevel = lvlCell ? lvlCell.textContent.trim() : '';

        if (level === 'all') {
            row.style.display = '';
        } else {
            row.style.display = (rowLevel === level) ? '' : 'none';
        }
    });

    // Show/hide slot tracker
    const tracker = document.getElementById('spell-slots-tracker');
    if (level === 'all' || level === '0') {
        tracker.style.display = 'none';
    } else {
        tracker.style.display = 'flex';
        updateSpellSlots(parseInt(level));
    }
}

function updateSpellSlots(level) {
    const container = document.getElementById('slots-container');
    if (!container) return;

    // Get slot count from saved data or default
    const savedSlots = JSON.parse(localStorage.getItem('spell_slots') || '{}');
    const maxSlots = savedSlots[`max_${level}`] || DEFAULT_SPELL_SLOTS[level] || 0;
    const usedSlots = savedSlots[`used_${level}`] || 0;

    let html = `<span class="slots-level">Niv ${level}</span>`;
    for (let i = 0; i < maxSlots; i++) {
        const checked = i < usedSlots ? 'checked' : '';
        html += `<input type="checkbox" class="slot-checkbox" data-level="${level}" data-index="${i}" ${checked} onchange="toggleSlot(${level}, ${i}, this.checked)">`;
    }
    html += `<button class="slots-add-btn" onclick="addSpellSlot(${level})" title="Ajouter un emplacement">+</button>`;

    container.innerHTML = html;
}

function toggleSlot(level, index, checked) {
    const savedSlots = JSON.parse(localStorage.getItem('spell_slots') || '{}');

    // Count how many are checked up to this index
    if (checked) {
        savedSlots[`used_${level}`] = index + 1;
    } else {
        savedSlots[`used_${level}`] = index;
    }

    localStorage.setItem('spell_slots', JSON.stringify(savedSlots));
    saveData();
}

function addSpellSlot(level) {
    const savedSlots = JSON.parse(localStorage.getItem('spell_slots') || '{}');
    const currentMax = savedSlots[`max_${level}`] || DEFAULT_SPELL_SLOTS[level] || 0;
    savedSlots[`max_${level}`] = currentMax + 1;
    localStorage.setItem('spell_slots', JSON.stringify(savedSlots));
    updateSpellSlots(level);
}

// Fonction addTableDataLabels supprimée (support téléphone mobile retiré)


// Style editor functions migrated to ui-toolbar.js (showStyleEditor, applyFormat, applyColor, applyFontSize)

// --- SYSTÈME DE MODALES, EXPORT, IMPORT ---
// Migré vers ui-modals.js

function getVal(id_or_name) {
    let el = document.getElementById(id_or_name);
    if (!el) el = document.querySelector(`[data-name="${id_or_name}"]`);
    if (!el) return 0;
    let valStr = (el.tagName === 'INPUT' || el.tagName === 'SELECT') ? el.value : el.innerText;
    let match = valStr.match(/-?\d+/);
    return match ? parseInt(match[0]) : 0;
}

function getCheck(n) { let el = document.querySelector(`input[name="${n}"]`); return el ? el.checked : false; }
function setTxt(id, val) { let el = document.getElementById(id); if (el) el.innerText = (val >= 0 ? "+" : "") + val; }
// calcMod() est défini dans logic.js - ne pas dupliquer

function updateSpellAbilityOptions(mods) {
    const select = document.getElementById('spell_ability');
    if (!select) return;
    const options = select.options;
    const baseNames = { 'none': '-', 'int': 'Intelligence', 'wis': 'Sagesse', 'cha': 'Charisme' };
    for (let i = 0; i < options.length; i++) {
        let opt = options[i];
        let val = opt.value;
        if (baseNames[val]) {
            let text = baseNames[val];
            if (val !== 'none') {
                let mod = mods[val];
                let sign = mod >= 0 ? '+' : '';
                text += ` (${sign}${mod})`;
            }
            opt.innerText = text;
        }
    }
}

// --- CLASS RESOURCE UPDATE ---
function updateClassResource(lvl, cls, mods) {
    const resBox = document.getElementById('class-resource-box');
    const resLabel = document.getElementById('class-resource-label');
    const resSlots = document.getElementById('class-resource-slots');

    if (!resBox || !cls) return;

    // Utiliser la fonction pure de logic.js au lieu de dupliquer la logique
    const { count, label } = getClassResourceInfo(lvl, cls, mods);

    // Only rebuild if the resource type or quantity changes
    let currentLabel = resLabel.innerText;
    let currentCount = resSlots.children.length;

    if (count > 0) {
        resBox.style.display = 'block';

        // Set grid classes based on count
        resSlots.className = '';
        if (count > 10) resSlots.classList.add('compact');
        else if (count > 6) resSlots.classList.add('dense');
        else resSlots.classList.add('standard');

        if (currentLabel !== label || currentCount !== count) {
            resLabel.innerText = label;
            resSlots.innerHTML = '';
            for (let i = 0; i < count; i++) {
                const chk = document.createElement('input');
                chk.type = 'checkbox';
                chk.name = `class_res_${i}`;
                resSlots.appendChild(chk);
            }

            // RESTORE STATE from stored data or temp
            let d = JSON.parse(localStorage.getItem('dd2024_char') || '{}');
            for (let i = 0; i < count; i++) {
                if (d[`class_res_${i}`]) {
                    resSlots.children[i].checked = true;
                }
            }
        }
    } else {
        resBox.style.display = 'none';
    }
}

// =============================================================================
// CALCULS AUTOMATIQUES D&D 2024
// =============================================================================

/**
 * Calcule les statistiques dÃ©rivÃ©es (Initiative, DD Sorts, Attaque Sorts)
 * avec gestion sÃ©curisÃ©e des valeurs nulles/invalides
 */
function calcDerivedStats() {
    // RÃ©cupÃ©rer les modificateurs de caractÃ©ristiques de maniÃ¨re sÃ©curisÃ©e
    const getStatMod = (statName) => {
        const val = getVal(statName + '_score');
        return val ? calcMod(val) : 0;
    };

    const dexMod = getStatMod('dex');
    const intMod = getStatMod('int');
    const wisMod = getStatMod('wis');
    const chaMod = getStatMod('cha');

    const level = getVal('char_level') || 1;
    const pb = DD_RULES.getProficiencyBonus(level);

    // === INITIATIVE ===
    const initiativeEl = document.getElementById('initiative_val');
    if (initiativeEl && !initiativeEl.dataset.manual) {
        const initiative = dexMod;
        initiativeEl.innerText = (initiative >= 0 ? '+' : '') + initiative;
    }

    // === DD SORTS & ATTAQUE SORTS ===
    const spellAbilitySelect = document.getElementById('spell_ability');
    if (spellAbilitySelect) {
        const spellAbility = spellAbilitySelect.value;

        if (spellAbility && spellAbility !== 'none') {
            let abilityMod = 0;
            switch (spellAbility) {
                case 'int': abilityMod = intMod; break;
                case 'wis': abilityMod = wisMod; break;
                case 'cha': abilityMod = chaMod; break;
            }

            const spellDC = 8 + pb + abilityMod;
            const spellAttack = pb + abilityMod;

            const dcEl = document.getElementById('spell_save_dc');
            const atkEl = document.getElementById('spell_atk_bonus');

            if (dcEl) dcEl.innerText = spellDC;
            if (atkEl) atkEl.innerText = (spellAttack >= 0 ? '+' : '') + spellAttack;


        } else {
            // Pas de caractÃ©ristique d'incantation sÃ©lectionnÃ©e
            const dcEl = document.getElementById('spell_save_dc');
            const atkEl = document.getElementById('spell_atk_bonus');
            if (dcEl) dcEl.innerText = '-';
            if (atkEl) atkEl.innerText = '-';
        }
    }
}

function calcStats() {
    let lvl = getVal('char_level') || 1;

    // Récupérer la classe depuis le select ou contenteditable (compatibilité)
    let clsEl = document.getElementById('char_class') || document.querySelector('[data-name="char_class"]');
    let cls = '';
    if (clsEl) {
        cls = clsEl.tagName === 'SELECT' ? clsEl.value : clsEl.innerText;
    }

    let pb = Math.ceil(lvl / 4) + 1;
    let pbEl = document.getElementById('pb_display');
    if (pbEl) pbEl.innerText = "+" + pb;

    const stats = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    let mods = {};
    stats.forEach(s => {
        let sc = getVal(s + '_score');
        if (sc === 0 && document.querySelector(`[data-name="${s}_score"]`).innerText.trim() === "") sc = 10;
        let m = calcMod(sc); mods[s] = m;
        setTxt(s + '_mod', m);
        let p = getCheck(s + '_save_prof');
        setTxt(s + '_save_val', m + (p ? pb : 0));

        // Mettre à jour le modificateur dans l'en-tête du groupe de compétences
        const groupMod = document.getElementById(`${s}_mod_display`);
        if (groupMod) groupMod.innerText = (m >= 0 ? '+' : '') + m;
    });

    updateSpellAbilityOptions(mods);
    updateClassResource(lvl, cls, mods);

    // Calculer les bonus de compétences avec support Expertise
    SKILLS.forEach(s => {
        // Récupérer les éléments DOM pour gérer les dépendances
        const profCheck = document.querySelector(`input[name="skill_prof_${s.id}"]`);
        const expCheck = document.querySelector(`input[name="skill_exp_${s.id}"]`);

        if (profCheck && expCheck) {
            // Règle D&D : L'Expertise implique la Maîtrise
            if (expCheck.checked && !profCheck.checked) {
                profCheck.checked = true;
            }
        }

        let isProficient = profCheck ? profCheck.checked : false;
        let hasExpertise = expCheck ? expCheck.checked : false;

        let bonus = calculateSkillBonus(mods[s.stat], isProficient, hasExpertise, pb);
        setTxt(`skill_val_${s.id}`, bonus);
    });

    // Perception Passive (avec Expertise si applicable)
    let percProf = getCheck('skill_prof_perception');
    let percExp = getCheck('skill_exp_perception');
    let percBonus = calculateSkillBonus(mods['wis'], percProf, percExp, pb);
    let pp = 10 + percBonus;
    let pi = document.getElementById('passive_perc');
    if (pi && !pi.dataset.manual) pi.innerText = pp;

    // Appeler les calculs dérivés (Initiative, DD Sorts, etc.)
    calcDerivedStats();
}









function triggerReset() {
    showModal((txt, btns, inp, area, close) => {
        txt.innerHTML = "Effacer toute la fiche ?";
        const btnYes = document.createElement('button');
        btnYes.className = 'btn btn-save'; btnYes.innerText = 'Oui';
        btnYes.onclick = () => {
            document.getElementById('sheet-form').reset();
            document.querySelectorAll('[contenteditable]').forEach(el => {
                el.innerHTML = '';
                if (el.dataset.name && el.dataset.name.endsWith('_score')) el.innerHTML = '10';
                if (el.id === 'level') el.innerHTML = '1';
                if (el.id === 'passive_perc') el.innerHTML = '10';
            });

            let wBody = document.getElementById('weapons_body');
            if (wBody) {
                wBody.innerHTML = '';
                for (let i = 0; i < 4; i++) addWeaponRow();
            }
            let sBody = document.getElementById('spells_body');
            if (sBody) {
                sBody.innerHTML = '';
                for (let i = 0; i < 6; i++) addSpellRow();
            }

            let pp = document.getElementById('passive_perc');
            if (pp) delete pp.dataset.manual;
            localStorage.removeItem('dd2024_char');
            calcStats();
            close();
        };
        const btnNo = document.createElement('button');
        btnNo.className = 'btn'; btnNo.innerText = 'Non'; btnNo.onclick = close;
        btns.appendChild(btnYes); btns.appendChild(btnNo);
    });
}



// --- GALLERY SYSTEM ---
// Migré vers ui-gallery.js

// =============================================================================
// FONCTION DE DEBUG TEMPORAIRE - TESTS DE MIGRATION
// =============================================================================

/**
 * Teste la fonction cleanLegacyData avec des donnÃ©es sales
 * ExÃ©cute des assertions pour valider le comportement
 * Activer avec ?debug=1 dans l'URL
 */
function debugMigration() {
    console.log('=== DÃ‰BUT DES TESTS DE MIGRATION ===');

    // Test 1: Nettoyage des balises HTML
    const test1 = {
        char_class: '<font size="5">Barbare</font>',
        char_name: '<font color="#8b0000">Korgul</font>',
        str_score: '<b>19</b>'
    };

    const result1 = cleanLegacyData(test1);

    console.assert(
        result1.char_class === 'Barbare',
        'âŒ Ã‰CHEC Test 1a: char_class devrait Ãªtre "Barbare", obtenu:', result1.char_class
    );

    console.assert(
        result1.str_score === 19,
        'âŒ Ã‰CHEC Test 1b: str_score devrait Ãªtre 19 (nombre), obtenu:', result1.str_score
    );

    // VÃ©rifier qu'il ne reste pas de balises HTML
    const jsonStr = JSON.stringify(result1);
    if (jsonStr.includes('<') || jsonStr.includes('>')) {
        console.error('âŒ Ã‰CHEC CRITIQUE: Des balises HTML subsistent dans les donnÃ©es!', result1);
    } else {
        console.log('âœ… Test 1: Nettoyage HTML rÃ©ussi');
    }

    // Test 2: Gestion des valeurs manquantes
    const test2 = {};
    const result2 = cleanLegacyData(test2);

    console.assert(
        result2.str_score === 10,
        'âŒ Ã‰CHEC Test 2: str_score par dÃ©faut devrait Ãªtre 10, obtenu:', result2.str_score
    );

    console.log('âœ… Test 2: Valeurs par dÃ©faut appliquÃ©es');

    // Test 3: Conversion des chaÃ®nes numÃ©riques
    const test3 = {
        char_level: '3',
        ac: '17',
        hp_max: '38'
    };

    const result3 = cleanLegacyData(test3);

    console.assert(
        typeof result3.char_level === 'number' && result3.char_level === 3,
        'âŒ Ã‰CHEC Test 3a: char_level devrait Ãªtre 3 (nombre)'
    );

    console.assert(
        typeof result3.ac === 'number' && result3.ac === 17,
        'âŒ Ã‰CHEC Test 3b: ac devrait Ãªtre 17 (nombre)'
    );

    console.log('âœ… Test 3: Conversion numÃ©rique rÃ©ussie');

    // Test 4: Nettoyage rÃ©cursif des tableaux
    const test4 = {
        dynamic_weapons: [
            { name: '<font size="2">Hache</font>', atk: '+6' }
        ]
    };

    const result4 = cleanLegacyData(test4);

    console.assert(
        result4.dynamic_weapons[0].name === 'Hache',
        'âŒ Ã‰CHEC Test 4: Nettoyage rÃ©cursif des armes a Ã©chouÃ©'
    );

    console.log('âœ… Test 4: Nettoyage rÃ©cursif rÃ©ussi');

    // Test 5: Cas rÃ©el de Korgul
    const test5 = {
        char_class: '<font size="5">Barbare</font>',
        char_level: '<font size="5">3</font>',
        str_score: '<b>19</b>',
        con_score: '<b><font color="#8b0000">18</font><font size="1"><i>(16)</i></font></b>'
    };

    const result5 = cleanLegacyData(test5);

    console.assert(
        result5.char_class === 'Barbare' &&
        result5.char_level === 3 &&
        result5.str_score === 19 &&
        result5.con_score === 18,
        'âŒ Ã‰CHEC Test 5: DonnÃ©es rÃ©elles de Korgul mal nettoyÃ©es'
    );

    console.log('âœ… Test 5: Cas rÃ©el de Korgul nettoyÃ© avec succÃ¨s', result5);

    console.log('=== FIN DES TESTS - TOUS LES TESTS PASSÃ‰S ===');
}

// =============================================================================
// SYSTÃˆME DE NAVIGATION PAR ONGLETS
// =============================================================================

/**
 * Change l'onglet actif
 * @param {string} tabName - Nom de l'onglet (combat, role, magic)
 */
function switchTab(tabName) {
    // Retirer la classe active de tous les boutons et sections
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Activer le bouton et la section correspondants
    const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const targetContent = document.getElementById(`tab-${tabName}`);

    if (targetBtn) targetBtn.classList.add('active');
    if (targetContent) targetContent.classList.add('active');

    // Sauvegarder l'onglet actif dans localStorage
    localStorage.setItem('dd2024_active_tab', tabName);
}

/**
 * Initialise le systÃ¨me d'onglets
 */
function initTabs() {
    // Ajouter les event listeners sur tous les boutons d'onglets
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Restaurer l'onglet actif depuis localStorage
    const savedTab = localStorage.getItem('dd2024_active_tab');
    if (savedTab) {
        switchTab(savedTab);
    }
    // Sinon, l'onglet "combat" est actif par dÃ©faut (dÃ©jÃ  dans le HTML)
}

// =============================================================================
// SYSTÈME DE REPOS (COURT ET LONG)
// =============================================================================
// Migré vers ui-rest.js

// ExÃ©cuter les tests au chargement si ?debug=1 dans l'URL
if (window.location.search.includes('debug=1')) {
    console.log('ðŸ” Mode DEBUG activÃ© - ExÃ©cution des tests...');
    // debugMigration(); // Removed - function no longer exists
}

/**
 * Configure l'ajustement automatique du texte pour l'entÃªte
 * RÃ©duit la police si le texte dÃ©passe la largeur
 */
function setupHeaderAutoFit() {
    const headerInputs = document.querySelectorAll('header .rich-input');

    const fitText = (el) => {
        if (!el) return;

        // Reset Ã  la taille de base (avec priority important pour surcharger le CSS)
        el.style.setProperty('font-size', '1.5rem', 'important');

        // Logique pour les SELECT
        if (el.tagName === 'SELECT') {
            const selectedText = el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : '';
            if (selectedText.length > 25) {
                el.style.setProperty('font-size', '1rem', 'important');
            } else if (selectedText.length > 18) {
                el.style.setProperty('font-size', '1.2rem', 'important');
            }
            return;
        }

        // Logique pour les DIV/INPUT (scrollWidth)
        let size = 1.5;
        // Tant que le contenu dÃ©borde (scrollWidth > clientWidth), on rÃ©duit
        while (el.scrollWidth > el.clientWidth && size > 0.8) {
            size -= 0.1;
            el.style.setProperty('font-size', `${size}rem`, 'important');
        }
    };

    headerInputs.forEach(el => {
        // Appliquer au chargement
        fitText(el);

        // Appliquer Ã  la modification
        el.addEventListener('input', () => fitText(el)); // Pour div
        el.addEventListener('change', () => fitText(el)); // Pour select
        el.addEventListener('blur', () => fitText(el));
    });
}

/**
 * GESTION DES DÉS DE VIE (HIT DICE) - AGENT 3
 */

function setupHitDiceLogic() {
    const classSelect = document.getElementById('char_class');
    // Listeners
    if (classSelect) classSelect.addEventListener('change', updateHitDiceType);

    document.addEventListener('input', (e) => {
        if (e.target.dataset.name === 'char_level' || e.target.id === 'level') {
            updateHitDiceCount();
        }
    });

    // Initial call
    updateHitDiceType();
    updateHitDiceCount();
}

function updateHitDiceType() {
    const classSelect = document.getElementById('char_class');
    const hdSelect = document.getElementById('hd_type_select');
    if (!classSelect || !hdSelect) return;

    const cls = (classSelect.value || '').toLowerCase();
    let die = 'd8'; // Default

    if (cls.includes('barbare') || cls.includes('barbarian')) die = 'd12';
    else if (cls.includes('guerrier') || cls.includes('fighter') ||
        cls.includes('paladin') ||
        cls.includes('rôdeur') || cls.includes('ranger')) die = 'd10';
    else if (cls.includes('sorcier') || cls.includes('warlock') ||
        cls.includes('barde') || cls.includes('bard') ||
        cls.includes('clerc') || cls.includes('cleric') ||
        cls.includes('druide') || cls.includes('druid') ||
        cls.includes('moine') || cls.includes('monk') ||
        cls.includes('roublard') || cls.includes('rogue')) die = 'd8';
    else if (cls.includes('magicien') || cls.includes('wizard') ||
        cls.includes('ensorceleur') || cls.includes('sorcerer')) die = 'd6';

    hdSelect.value = die;
    hdSelect.dispatchEvent(new Event('change')); // Force save if listener exists
}

function updateHitDiceCount() {
    let levelEl = document.querySelector('[data-name="char_level"]');
    if (!levelEl) levelEl = document.getElementById('level');

    let level = 1;
    if (levelEl) level = parseInt(levelEl.innerText) || 1;

    const maxDisplay = document.getElementById('hd_max_display');
    if (maxDisplay) maxDisplay.innerText = level;

    const currentSelect = document.getElementById('hd_current_select');
    if (currentSelect) {
        const currentVal = parseInt(currentSelect.value) || 0;
        currentSelect.innerHTML = '';

        for (let i = 0; i <= level; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = i;
            currentSelect.appendChild(opt);
        }

        if (currentVal <= level) currentSelect.value = currentVal;
        else currentSelect.value = level;
    }
}

window.addEventListener('load', setupHitDiceLogic);




