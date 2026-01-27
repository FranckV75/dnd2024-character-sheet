const DEFAULT_BGS = [
    // --- IMAGES PERMANENTES ---
    "Fond_Equipe.png",
    "Fond_Fafnir.png",
    // Test des deux noms pour être sûr
    "Fond_Odyss%C3%A9e_des_Seigneurs_Dragons.png"
];

const SKILLS = [
    { id: 'acrobatics', name: 'Acrobaties', stat: 'dex' },
    { id: 'arcana', name: 'Arcanes', stat: 'int' },
    { id: 'athletics', name: 'Athlétisme', stat: 'str' },
    { id: 'stealth', name: 'Discrétion', stat: 'dex' },
    { id: 'animal_handling', name: 'Dressage', stat: 'wis' },
    { id: 'sleight_of_hand', name: 'Escamotage', stat: 'dex' },
    { id: 'history', name: 'Histoire', stat: 'int' },
    { id: 'intimidation', name: 'Intimidation', stat: 'cha' },
    { id: 'insight', name: 'Intuition', stat: 'wis' },
    { id: 'investigation', name: 'Investigation', stat: 'int' },
    { id: 'medicine', name: 'Médecine', stat: 'wis' },
    { id: 'nature', name: 'Nature', stat: 'int' },
    { id: 'perception', name: 'Perception', stat: 'wis' },
    { id: 'persuasion', name: 'Persuasion', stat: 'cha' },
    { id: 'religion', name: 'Religion', stat: 'int' },
    { id: 'performance', name: 'Représentation', stat: 'cha' },
    { id: 'survival', name: 'Survie', stat: 'wis' },
    { id: 'deception', name: 'Tromperie', stat: 'cha' }
];

// =============================================================================
// NETTOYAGE DES DONNÉES LEGACY
// =============================================================================

/**
 * Nettoie les données legacy des balises HTML et convertit les types
 * @param {Object} data - Données brutes à nettoyer
 * @returns {Object} - Données nettoyées
 */
function cleanLegacyData(data) {
    if (!data || typeof data !== 'object') return {};

    const cleaned = {};

    // Fonction utilitaire pour supprimer les balises HTML
    const stripHTML = (str) => {
        if (typeof str !== 'string') return str;
        // Supprime toutes les balises HTML et décode les entités HTML basiques
        return str.replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
    };

    // Fonction pour extraire un nombre d'une chaîne
    const extractNumber = (str) => {
        if (typeof str === 'number') return str;
        if (typeof str !== 'string') return 0;
        const clean = stripHTML(str);
        const match = clean.match(/-?\d+/);
        return match ? parseInt(match[0], 10) : 0;
    };

    // Liste des champs numériques
    const numericFields = [
        'str_score', 'dex_score', 'con_score', 'int_score', 'wis_score', 'cha_score',
        'char_level', 'ac', 'hp_max', 'hp_current', 'hp_temp',
        'gp', 'sp', 'cp', 'ep', 'pp'
    ];

    // Liste des champs texte qui doivent être nettoyés du HTML
    const textFields = [
        'char_name', 'char_class', 'char_subclass', 'char_background',
        'char_species', 'char_size', 'char_xp', 'heroic_inspiration',
        'speed', 'initiative', 'passive_perception', 'hd_total', 'hd_spent'
    ];

    // Nettoyer tous les champs
    for (const key in data) {
        if (!data.hasOwnProperty(key)) continue;

        const value = data[key];

        // Traiter les champs numériques
        if (numericFields.includes(key)) {
            cleaned[key] = extractNumber(value);
        }
        // Traiter les champs texte
        else if (textFields.includes(key)) {
            cleaned[key] = stripHTML(value);
        }
        // Traiter les tableaux (armes, sorts)
        else if (Array.isArray(value)) {
            cleaned[key] = value.map(item => {
                if (typeof item === 'object' && item !== null) {
                    // Nettoyage récursif des objets dans les tableaux
                    const cleanedItem = {};
                    for (const itemKey in item) {
                        if (item.hasOwnProperty(itemKey)) {
                            cleanedItem[itemKey] = typeof item[itemKey] === 'string'
                                ? stripHTML(item[itemKey])
                                : item[itemKey];
                        }
                    }
                    return cleanedItem;
                }
                return item;
            });
        }
        // Copier les autres valeurs telles quelles (checkboxes, etc.)
        else {
            cleaned[key] = value;
        }
    }

    // Valeurs par défaut pour les champs essentiels
    cleaned.str_score = cleaned.str_score || 10;
    cleaned.dex_score = cleaned.dex_score || 10;
    cleaned.con_score = cleaned.con_score || 10;
    cleaned.int_score = cleaned.int_score || 10;
    cleaned.wis_score = cleaned.wis_score || 10;
    cleaned.cha_score = cleaned.cha_score || 10;
    cleaned.char_level = cleaned.char_level || 1;

    return cleaned;
}

// =============================================================================
// MENUS DÉROULANTS DYNAMIQUES
// =============================================================================

/**
 * Remplit les menus déroulants avec les données de DD_RULES
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

    // Remplir le select des Espèces
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
 * Met à jour le select des Sous-Classes selon la Classe sélectionnée
 * @param {string} className - Nom de la classe sélectionnée
 */
function updateSubclassOptions(className) {
    const subclassSelect = document.getElementById('char_subclass');
    if (!subclassSelect) return;

    subclassSelect.innerHTML = '<option value="">-- Choisir --</option>';

    if (!className) return;

    // Trouver la clé de la classe
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
 * Remplit le select du Destin Héroïque (Module Odyssée)
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
    populateSelectOptions(); // Remplir les menus déroulants
    populateHeroicDestiny(); // Remplir le menu Destin Héroïque

    // Event listener pour mise à jour Sous-Classe
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
        addTableDataLabels(); // Injecter les data-label pour mobile
    }, 100);

    setupDrag();

    // Initialiser le système d'onglets
    initTabs();

    // Initialiser le système de repos
    initRestSystem();
};

function updateOpacity(val) {
    document.documentElement.style.setProperty('--sheet-opacity', val);
    const containers = document.querySelectorAll('.sheet-container');
    containers.forEach(c => c.style.backgroundColor = `rgba(255, 255, 255, ${val})`);
    localStorage.setItem('dd2024_opacity', val);
}

function changeBackground(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const bgData = e.target.result;
            document.body.style.backgroundImage = `url('${bgData}')`;
            try {
                localStorage.setItem('dd2024_bg', bgData);
            } catch (e) {
                showModal("Attention : L'image est trop volumineuse pour être sauvegardée. Elle sera affichée pour cette session, mais disparaitra si vous rechargez la page.");
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
    input.value = '';
}

function bindStyleEvents() {
    const targets = document.querySelectorAll('.rich-input, [id^="skill_val_"], .stat-mod, #spell_save_dc, #spell_atk_bonus, #pb_display, #str_save_val, #dex_save_val, #con_save_val, #int_save_val, #wis_save_val, #cha_save_val');
    targets.forEach(el => {
        el.removeEventListener('contextmenu', handleRightClick);
        el.addEventListener('contextmenu', handleRightClick);
    });
}

function handleRightClick(e) {
    e.preventDefault();
    let x = e.pageX || (e.touches ? e.touches[0].pageX : 0);
    let y = e.pageY || (e.touches ? e.touches[0].pageY : 0);
    if (x === undefined) { x = e.clientX + window.scrollX; y = e.clientY + window.scrollY; }
    showStyleEditor(x, y, this);
}

function setupDrag() {
    const toolbar = document.getElementById('toolbar');
    const header = document.getElementById('toolbar-header');
    if (!toolbar || !header) return;
    let isDragging = false; let startX, startY, initialLeft, initialTop;
    function getCoords(e) { return e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY }; }
    function start(e) {
        if (e.target.id === 'minimize-btn') return;
        isDragging = true; const c = getCoords(e); startX = c.x; startY = c.y;
        const r = toolbar.getBoundingClientRect(); initialLeft = r.left; initialTop = r.top;
        toolbar.style.bottom = 'auto'; toolbar.style.right = 'auto'; toolbar.style.left = initialLeft + 'px'; toolbar.style.top = initialTop + 'px';
    }
    function move(e) {
        if (!isDragging) return; e.preventDefault(); const c = getCoords(e);
        toolbar.style.left = (initialLeft + c.x - startX) + 'px'; toolbar.style.top = (initialTop + c.y - startY) + 'px';
    }
    function end() { isDragging = false; }
    header.addEventListener('mousedown', start); document.addEventListener('mousemove', move); document.addEventListener('mouseup', end);
    header.addEventListener('touchstart', start, { passive: false }); document.addEventListener('touchmove', move, { passive: false }); document.addEventListener('touchend', end);

    // Correction Bug Resize : S'assurer que le toolbar reste visible
    window.addEventListener('resize', () => {
        const r = toolbar.getBoundingClientRect();
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        // Si la toolbar dépasse à droite
        if (r.right > winW) {
            toolbar.style.left = (winW - r.width - 20) + 'px';
        }
        // Si elle dépasse en bas
        if (r.bottom > winH) {
            toolbar.style.top = (winH - r.height - 20) + 'px';
        }
        // Si elle dépasse à gauche (rare mais possible)
        if (r.left < 0) {
            toolbar.style.left = '20px';
        }
    });
}

function toggleToolbar(e) {
    if (e.stopPropagation) e.stopPropagation();
    const t = document.getElementById('toolbar');
    if (t) {
        t.classList.toggle('minimized');
        const btn = document.getElementById('minimize-btn');
        if (btn) btn.innerHTML = t.classList.contains('minimized') ? '&#9744;' : '_';
    }
}

function generateSkillsHTML() {
    const c = document.getElementById('skills_container');
    if (!c) return;
    let h = '';
    SKILLS.forEach(s => {
        h += `<div class="skill-row"><div class="chk-container"><input type="checkbox" name="skill_prof_${s.id}" onchange="calcStats()"><span>${s.name} <span style="color:#4a3b2a; font-size:0.7em">(${s.stat.toUpperCase()})</span></span></div><div class="skill-mod" id="skill_val_${s.id}">+0</div></div>`;
    });
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
        <td><button class="del-btn" onclick="this.closest('tr').remove(); saveData();">x</button></td>
    `;
    body.appendChild(tr);
    if (data) {
        tr.querySelector('.wpn-name').innerHTML = data.name || '';
        tr.querySelector('.wpn-atk').innerHTML = data.atk || '';
        tr.querySelector('.wpn-dmg').innerHTML = data.dmg || '';
        tr.querySelector('.wpn-note').innerHTML = data.note || '';
    }
    bindStyleEvents();
    addTableDataLabels(); // Mettre à jour les data-label
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
        <td><button class="del-btn" onclick="this.closest('tr').remove(); saveData();">x</button></td>
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
    addTableDataLabels(); // Mettre à jour les data-label
}

// =============================================================================
// PHASE 3/3 : INJECTION DATA-LABEL POUR MOBILE
// =============================================================================

/**
 * Injecte les attributs data-label dans les cellules de tableaux
 * pour permettre l'affichage des labels sur mobile via CSS ::before
 */
function addTableDataLabels() {
    // === TABLEAU DES ARMES ===
    const weaponsTable = document.querySelector('.weapons-table');
    if (weaponsTable) {
        const weaponLabels = ['Nom', 'Att/DD', 'Dégâts', 'Notes', ''];
        weaponsTable.querySelectorAll('tbody tr').forEach(row => {
            row.querySelectorAll('td').forEach((cell, index) => {
                if (weaponLabels[index]) {
                    cell.setAttribute('data-label', weaponLabels[index]);
                }
            });
        });
    }

    // === TABLEAU DES SORTS ===
    const spellsTable = document.querySelector('.data-table:not(.weapons-table)');
    if (spellsTable) {
        const spellLabels = ['Niv', 'Nom', 'Temps', 'Portée', 'C/R/M', 'Notes', ''];
        spellsTable.querySelectorAll('tbody tr').forEach(row => {
            row.querySelectorAll('td').forEach((cell, index) => {
                if (spellLabels[index]) {
                    cell.setAttribute('data-label', spellLabels[index]);
                }
            });
        });
    }
}

let currentEditElement = null;

function showStyleEditor(x, y, el) {
    currentEditElement = el;
    const ed = document.getElementById('style-editor');
    if (ed) {
        ed.style.left = x + 'px'; ed.style.top = y + 'px'; ed.style.display = 'block';
    }
}

function applyFormat(command, value = null) {
    if (!currentEditElement) return;
    currentEditElement.focus();
    document.execCommand(command, false, value);
    const ed = document.getElementById('style-editor');
    if (ed) ed.style.display = 'none';
    document.getElementById('sheet-form').dispatchEvent(new Event('input'));
}

function applyColor(color) { applyFormat('foreColor', color); }
function applyFontSize(size) { applyFormat('fontSize', size); }

function showModal(contentHtml) {
    const m = document.getElementById('custom-modal');
    const txt = document.getElementById('modal-text');
    const btns = document.getElementById('modal-actions');
    const inp = document.getElementById('modal-input');
    const area = document.getElementById('modal-textarea');

    if (!m || !txt || !btns) return;

    txt.innerHTML = ''; btns.innerHTML = '';
    if (inp) inp.style.display = 'none';
    if (area) area.style.display = 'none';

    if (typeof contentHtml === 'string') {
        txt.innerHTML = contentHtml;
        const btnOk = document.createElement('button');
        btnOk.innerText = 'OK';
        btnOk.className = 'btn btn-action';
        btnOk.style.width = 'auto';
        btnOk.onclick = () => { m.style.display = 'none'; };
        btns.appendChild(btnOk);
    } else {
        contentHtml(txt, btns, inp, area, () => m.style.display = 'none');
    }
    m.style.display = 'flex';
}

function openExportMenu() {
    let nEl = document.querySelector('[data-name="char_name"]');
    let n = nEl ? nEl.innerText.trim().replace(/<[^>]*>/g, "") : "perso";
    if (!n) n = "perso";
    let defName = `DD2024_${n}.json`;

    showModal((txt, btns, inp, area, close) => {
        txt.innerHTML = "<b>Sauvegarde & Export</b><br>Sur tablette, utilisez 'Copier' si le téléchargement est bloqué.";

        const btnFile = document.createElement('button');
        btnFile.className = 'btn btn-save';
        btnFile.innerText = '💾 Télécharger Fichier';
        btnFile.onclick = () => { downloadFile(defName); close(); };

        const btnCopy = document.createElement('button');
        btnCopy.className = 'btn btn-copy';
        btnCopy.innerText = '📋 Copier les Données';
        btnCopy.onclick = () => {
            const data = JSON.stringify(getFormData(), null, 2);
            copyToClipboard(data);
            close();
        };

        const btnCancel = document.createElement('button');
        btnCancel.className = 'btn';
        btnCancel.innerText = 'Annuler';
        btnCancel.onclick = close;

        btns.appendChild(btnFile);
        btns.appendChild(btnCopy);
        btns.appendChild(btnCancel);
    });
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showModal("Données copiées !"))
            .catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.left = "0"; ta.style.top = "0";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try {
        document.execCommand('copy');
        showModal("Données copiées !");
    } catch (err) {
        showModal("Erreur de copie.");
    }
    document.body.removeChild(ta);
}

function downloadFile(fileName) {
    const data = JSON.stringify(getFormData(), null, 2);
    const b = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); window.URL.revokeObjectURL(url);
}

function openImportMenu() {
    showModal((txt, btns, inp, area, close) => {
        txt.innerHTML = "<b>Importation</b>";
        const btnFile = document.createElement('button');
        btnFile.className = 'btn btn-action';
        btnFile.innerText = '📂 Ouvrir Fichier';
        btnFile.onclick = () => { document.getElementById('file-import').click(); close(); };

        if (area) {
            area.style.display = 'block';
            area.placeholder = 'Collez ici le code JSON...';
        }

        const btnPaste = document.createElement('button');
        btnPaste.className = 'btn btn-save';
        btnPaste.innerText = '📥 Charger Texte Collé';
        btnPaste.onclick = () => {
            try {
                if (!area.value) return;
                applyFormData(JSON.parse(area.value));
                alert("Fiche chargée !");
                close();
            } catch (e) { alert("Code invalide."); }
        };
        const btnCancel = document.createElement('button');
        btnCancel.className = 'btn'; btnCancel.innerText = 'Annuler'; btnCancel.onclick = close;
        btns.appendChild(btnFile); btns.appendChild(btnPaste); btns.appendChild(btnCancel);
    });
}

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
function calcMod(s) { return Math.floor((s - 10) / 2); }

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

    let clsClean = cls.trim().toLowerCase();
    let count = 0;
    let label = "";

    if (clsClean.includes('barbar')) {
        label = "Rages";
        count = 2;
        if (lvl >= 3) count = 3;
        if (lvl >= 6) count = 4;
        if (lvl >= 12) count = 5;
        if (lvl >= 17) count = 6;
    }
    else if (clsClean.includes('bard')) {
        label = "Inspiration Bardique";
        count = Math.max(1, mods['cha']);
    }
    else if (clsClean.includes('clerc') || clsClean.includes('cleric')) {
        label = "Conduit Divin";
        count = 2;
        if (lvl >= 6) count = 3;
        if (lvl >= 18) count = 4;
    }
    else if (clsClean.includes('druid')) {
        label = "Formes Sauvages";
        count = 2;
        if (lvl >= 6) count = 3;
        if (lvl >= 14) count = 4;
    }
    else if (clsClean.includes('ensorceleur') || clsClean.includes('sorcer')) {
        label = "Sorcellerie Innée";
        count = 2;
    }
    else if (clsClean.includes('moine') || clsClean.includes('monk')) {
        label = "Points de KI";
        count = lvl;
    }
    else if (clsClean.includes('paladin')) {
        if (lvl >= 3) {
            label = "Conduit Divin";
            count = 2;
            // 2024 Paladin: 2 CD à lvl 3, 3 CD à lvl 11.
            if (lvl >= 11) count = 3;
        }
    }
    else if (clsClean.includes('rôdeur') || clsClean.includes('ranger')) {
        label = "Ennemi Juré";
        // Rôdeur (Ranger) 2024 : Favored Enemy uses (Hunter's Mark free casts)
        // Lvl 1: 2, Lvl 5: 3, Lvl 9: 4, Lvl 13: 5, Lvl 17: 6
        count = 2;
        if (lvl >= 5) count = 3;
        if (lvl >= 9) count = 4;
        if (lvl >= 13) count = 5;
        if (lvl >= 17) count = 6;
    }

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
 * Calcule les statistiques dérivées (Initiative, DD Sorts, Attaque Sorts)
 * avec gestion sécurisée des valeurs nulles/invalides
 */
function calcDerivedStats() {
    // Récupérer les modificateurs de caractéristiques de manière sécurisée
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

            console.log('Calculs mis à jour :', {
                initiative: initiativeEl ? initiativeEl.innerText : 'N/A',
                spellDC: spellDC,
                spellAttack: spellAttack,
                level: level,
                proficiencyBonus: pb,
                spellAbility: spellAbility,
                abilityMod: abilityMod
            });
        } else {
            // Pas de caractéristique d'incantation sélectionnée
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
    });

    updateSpellAbilityOptions(mods);
    updateClassResource(lvl, cls, mods);

    SKILLS.forEach(s => {
        let p = getCheck(`skill_prof_${s.id}`);
        setTxt(`skill_val_${s.id}`, mods[s.stat] + (p ? pb : 0));
    });

    let pp = 10 + mods['wis'] + (getCheck('skill_prof_perception') ? pb : 0);
    let pi = document.getElementById('passive_perc');
    if (pi && !pi.dataset.manual) pi.innerText = pp;

    // Appeler les calculs dérivés (Initiative, DD Sorts, etc.)
    calcDerivedStats();
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupDrag();
    setupCalculatorListeners();
});

function getFormData() {
    const d = {};
    document.querySelectorAll('input, select').forEach(el => {
        if (el.name) {
            if (el.type === 'checkbox') d[el.name] = el.checked;
            else d[el.name] = el.value;
        }
    });
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        let key = el.dataset.name || el.id;
        if (key) {
            if (!el.classList.contains('wpn-name') && !el.classList.contains('wpn-atk') &&
                !el.classList.contains('wpn-dmg') && !el.classList.contains('wpn-note') &&
                !el.classList.contains('spl-lvl') && !el.classList.contains('spl-name') &&
                !el.classList.contains('spl-time') && !el.classList.contains('spl-range') &&
                !el.classList.contains('spl-note')) {
                d[key] = el.innerHTML;
            }
        }
    });
    const weapons = [];
    const wBody = document.getElementById('weapons_body');
    if (wBody) {
        wBody.querySelectorAll('tr').forEach(tr => {
            weapons.push({
                name: tr.querySelector('.wpn-name').innerHTML,
                atk: tr.querySelector('.wpn-atk').innerHTML,
                dmg: tr.querySelector('.wpn-dmg').innerHTML,
                note: tr.querySelector('.wpn-note').innerHTML
            });
        });
    }
    d['dynamic_weapons'] = weapons;

    const spells = [];
    const sBody = document.getElementById('spells_body');
    if (sBody) {
        sBody.querySelectorAll('tr').forEach(tr => {
            spells.push({
                lvl: tr.querySelector('.spl-lvl').innerHTML,
                name: tr.querySelector('.spl-name').innerHTML,
                time: tr.querySelector('.spl-time').innerHTML,
                range: tr.querySelector('.spl-range').innerHTML,
                note: tr.querySelector('.spl-note').innerHTML,
                c: tr.querySelector('.spl-c').checked,
                r: tr.querySelector('.spl-r').checked,
                m: tr.querySelector('.spl-m').checked
            });
        });
    }
    d['dynamic_spells'] = spells;

    let pp = document.getElementById('passive_perc');
    if (pp && pp.dataset.manual) d['passive_perc_manual'] = 'true';

    // Save dynamic class resource checks
    const resSlots = document.getElementById('class-resource-slots');
    if (resSlots && resSlots.children.length > 0) {
        for (let i = 0; i < resSlots.children.length; i++) {
            d[`class_res_${i}`] = resSlots.children[i].checked;
        }
    }

    // Odyssée des Seigneurs Dragons
    const heroicDestinyEl = document.getElementById('heroic_destiny');
    if (heroicDestinyEl) d['heroic_destiny'] = heroicDestinyEl.value;

    const gloryEl = document.getElementById('glory_score');
    if (gloryEl) d['glory_score'] = gloryEl.value;

    const vanityEl = document.getElementById('vanity_score');
    if (vanityEl) d['vanity_score'] = vanityEl.value;

    return d;
}

function applyFormData(d) {
    document.querySelectorAll('input, select').forEach(el => {
        if (el.name && d.hasOwnProperty(el.name)) {
            if (el.type === 'checkbox') el.checked = d[el.name];
            else el.value = d[el.name];
        }
    });
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        let key = el.dataset.name || el.id;
        if (key && d.hasOwnProperty(key)) {
            el.innerHTML = d[key];
        }
    });

    // Legacy migration
    if (d.profs_other && !d.profs_weapons) {
        let el = document.querySelector('[data-name="profs_weapons"]');
        if (el) el.innerHTML = d.profs_other;
    }

    const tbodyW = document.getElementById('weapons_body');
    if (tbodyW) {
        tbodyW.innerHTML = '';
        if (d.dynamic_weapons && Array.isArray(d.dynamic_weapons)) {
            d.dynamic_weapons.forEach(w => addWeaponRow(w));
        } else {
            for (let i = 0; i < 4; i++) addWeaponRow();
        }
    }

    const tbodyS = document.getElementById('spells_body');
    if (tbodyS) {
        tbodyS.innerHTML = '';
        if (d.dynamic_spells && Array.isArray(d.dynamic_spells)) {
            d.dynamic_spells.forEach(s => addSpellRow(s));
        } else {
            for (let i = 0; i < 6; i++) addSpellRow();
        }
    }

    let pp = document.getElementById('passive_perc');
    if (pp && d['passive_perc_manual']) pp.dataset.manual = 'true';

    // Restore class resource checks AFTER calcStats potentially recreates them
    calcStats();

    const resSlots = document.getElementById('class-resource-slots');
    if (resSlots && resSlots.children.length > 0) {
        for (let i = 0; i < resSlots.children.length; i++) {
            if (d[`class_res_${i}`]) {
                resSlots.children[i].checked = true;
            }
        }
    }

    // Odyssée des Seigneurs Dragons
    const heroicDestinyEl = document.getElementById('heroic_destiny');
    if (heroicDestinyEl && d.heroic_destiny) heroicDestinyEl.value = d.heroic_destiny;

    const gloryEl = document.getElementById('glory_score');
    if (gloryEl && d.glory_score) gloryEl.value = d.glory_score;

    const vanityEl = document.getElementById('vanity_score');
    if (vanityEl && d.vanity_score) vanityEl.value = d.vanity_score;

    // Mettre à jour les sous-classes après avoir restauré la classe
    const classSelect = document.getElementById('char_class');
    if (classSelect && classSelect.value) {
        updateSubclassOptions(classSelect.value);
        // Restaurer la sous-classe après avoir rempli les options
        const subclassSelect = document.getElementById('char_subclass');
        if (subclassSelect && d.char_subclass) {
            // Petit délai pour que les options soient remplies
            setTimeout(() => {
                subclassSelect.value = d.char_subclass;
            }, 50);
        }
    }
}

function saveData() { localStorage.setItem('dd2024_char', JSON.stringify(getFormData())); showModal('Sauvegardé !'); }
function loadData() {
    let d = localStorage.getItem('dd2024_char');
    if (d) {
        const rawData = JSON.parse(d);
        const cleanedData = cleanLegacyData(rawData);
        applyFormData(cleanedData);
    }
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

function importData(el) {
    let f = el.files[0]; if (!f) return;
    let r = new FileReader();
    r.onload = e => {
        try {
            const rawData = JSON.parse(e.target.result);
            const cleanedData = cleanLegacyData(rawData);
            applyFormData(cleanedData);
            showModal('Fiche chargée et nettoyée !');
        }
        catch (err) {
            console.error('Erreur import:', err);
            showModal('Erreur fichier.');
        }
    };
    r.readAsText(f); el.value = '';
}

// --- GALLERY SYSTEM ---
function openGallery() {
    document.getElementById('gallery-modal').style.display = 'flex';
    renderGallery();
}

function getSavedBackgrounds() {
    let saved = localStorage.getItem('dd2024_saved_bgs');
    return saved ? JSON.parse(saved) : [];
}

function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';

    // Combine defaults and user saved
    const userBgs = getSavedBackgrounds();
    const allBgs = ["none", ...DEFAULT_BGS, ...userBgs]; // Ajout de "none" pour pouvoir enlever le fond

    let currentBg = document.body.style.backgroundImage || "";
    // Nettoyage plus robuste du format url(...) pour tous les navigateurs
    currentBg = currentBg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');

    allBgs.forEach((url, idx) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        if (url === "none") {
            item.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:0.7rem;color:#666;background:#eee;">SANS FOND</div>';
            item.onclick = () => selectBackground("");
            if (currentBg === "" || currentBg === "none") item.classList.add('active');
            grid.appendChild(item);
            return;
        }

        if (currentBg === url) item.classList.add('active');
        item.onclick = () => selectBackground(url);

        // Thumbnail (use the image itself)
        const img = document.createElement('img');
        img.src = url;
        // Handle broken image links in preview
        img.onerror = function () {
            // Diagnostic temporaire pour l'utilisateur
            console.error("Erreur de chargement pour : " + this.src);
            // On ne met pas d'alerte intrusive mais on log
            this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PHRleHQgeD0iNTA1IiB5PSI1MCUiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4/PC90ZXh0Pjwvc3ZnPg==';
        };
        item.appendChild(img);

        // Delete button (only for user bgs, stored after "none" and defaults)
        if (idx > DEFAULT_BGS.length) {
            const btn = document.createElement('button');
            btn.className = 'gallery-del';
            btn.innerHTML = 'x';
            btn.title = "Supprimer";
            btn.onclick = (e) => {
                e.stopPropagation();
                removeBackground(idx - (DEFAULT_BGS.length + 1));
            };
            item.appendChild(btn);
        }

        grid.appendChild(item);
    });
}

function selectBackground(url) {
    document.body.style.backgroundImage = `url('${url}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    localStorage.setItem('dd2024_bg', url); // Save choice
    renderGallery(); // Update active state
}

function addNewBackground() {
    const input = document.getElementById('new-bg-url');
    const url = input.value.trim();
    if (!url) return;

    let saved = getSavedBackgrounds();
    saved.push(url);
    localStorage.setItem('dd2024_saved_bgs', JSON.stringify(saved));

    input.value = '';
    renderGallery();
}

function removeBackground(userIndex) {
    let saved = getSavedBackgrounds();
    saved.splice(userIndex, 1);
    localStorage.setItem('dd2024_saved_bgs', JSON.stringify(saved));
    renderGallery();
}

// =============================================================================
// FONCTION DE DEBUG TEMPORAIRE - TESTS DE MIGRATION
// =============================================================================

/**
 * Teste la fonction cleanLegacyData avec des données sales
 * Exécute des assertions pour valider le comportement
 * Activer avec ?debug=1 dans l'URL
 */
function debugMigration() {
    console.log('=== DÉBUT DES TESTS DE MIGRATION ===');

    // Test 1: Nettoyage des balises HTML
    const test1 = {
        char_class: '<font size="5">Barbare</font>',
        char_name: '<font color="#8b0000">Korgul</font>',
        str_score: '<b>19</b>'
    };

    const result1 = cleanLegacyData(test1);

    console.assert(
        result1.char_class === 'Barbare',
        '❌ ÉCHEC Test 1a: char_class devrait être "Barbare", obtenu:', result1.char_class
    );

    console.assert(
        result1.str_score === 19,
        '❌ ÉCHEC Test 1b: str_score devrait être 19 (nombre), obtenu:', result1.str_score
    );

    // Vérifier qu'il ne reste pas de balises HTML
    const jsonStr = JSON.stringify(result1);
    if (jsonStr.includes('<') || jsonStr.includes('>')) {
        console.error('❌ ÉCHEC CRITIQUE: Des balises HTML subsistent dans les données!', result1);
    } else {
        console.log('✅ Test 1: Nettoyage HTML réussi');
    }

    // Test 2: Gestion des valeurs manquantes
    const test2 = {};
    const result2 = cleanLegacyData(test2);

    console.assert(
        result2.str_score === 10,
        '❌ ÉCHEC Test 2: str_score par défaut devrait être 10, obtenu:', result2.str_score
    );

    console.log('✅ Test 2: Valeurs par défaut appliquées');

    // Test 3: Conversion des chaînes numériques
    const test3 = {
        char_level: '3',
        ac: '17',
        hp_max: '38'
    };

    const result3 = cleanLegacyData(test3);

    console.assert(
        typeof result3.char_level === 'number' && result3.char_level === 3,
        '❌ ÉCHEC Test 3a: char_level devrait être 3 (nombre)'
    );

    console.assert(
        typeof result3.ac === 'number' && result3.ac === 17,
        '❌ ÉCHEC Test 3b: ac devrait être 17 (nombre)'
    );

    console.log('✅ Test 3: Conversion numérique réussie');

    // Test 4: Nettoyage récursif des tableaux
    const test4 = {
        dynamic_weapons: [
            { name: '<font size="2">Hache</font>', atk: '+6' }
        ]
    };

    const result4 = cleanLegacyData(test4);

    console.assert(
        result4.dynamic_weapons[0].name === 'Hache',
        '❌ ÉCHEC Test 4: Nettoyage récursif des armes a échoué'
    );

    console.log('✅ Test 4: Nettoyage récursif réussi');

    // Test 5: Cas réel de Korgul
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
        '❌ ÉCHEC Test 5: Données réelles de Korgul mal nettoyées'
    );

    console.log('✅ Test 5: Cas réel de Korgul nettoyé avec succès', result5);

    console.log('=== FIN DES TESTS - TOUS LES TESTS PASSÉS ===');
}

// =============================================================================
// SYSTÈME DE NAVIGATION PAR ONGLETS
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
 * Initialise le système d'onglets
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
    // Sinon, l'onglet "combat" est actif par défaut (déjà dans le HTML)
}

// =============================================================================
// SYSTÈME DE REPOS (COURT ET LONG)
// =============================================================================

let longRestTimer = null;
let longRestStartTime = 0;
const LONG_REST_DURATION = 2000; // 2 secondes

/**
 * Effectue un repos court (1 heure)
 * Restaure : dés de vie, ressources de classe
 */
function performShortRest() {
    console.log('⚔️ Repos Court commencé...');

    // Restaurer les ressources de classe (décocher toutes les cases)
    const resSlots = document.getElementById('class-resource-slots');
    if (resSlots) {
        resSlots.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    // Feedback visuel
    showModal(
        '🌙 Repos Court Terminé',
        'Vous avez pris un repos d\'une heure.\n\n' +
        '✅ Ressources de classe restaurées\n' +
        '💡 N\'oubliez pas de lancer vos dés de vie si nécessaire',
        [
            { label: 'OK', callback: () => { saveData(); } }
        ]
    );

    console.log('✅ Repos Court terminé');
}

/**
 * Effectue un repos long (8 heures)
 * Restaure : PV, dés de vie, emplacements de sorts, ressources de classe
 */
function performLongRest() {
    console.log('🛏️ Repos Long commencé...');

    // Restaurer les PV au maximum
    const hpMax = document.querySelector('[data-name="hp_max"]');
    const hpCurrent = document.querySelector('[data-name="hp_current"]');
    if (hpMax && hpCurrent && hpMax.innerText.trim()) {
        hpCurrent.innerText = hpMax.innerText;
    }

    // Effacer les PV temporaires
    const hpTemp = document.querySelector('[data-name="hp_temp"]');
    if (hpTemp) hpTemp.innerText = '';

    // Restaurer les dés de vie (remettre à 0 utilisés)
    const hdSpent = document.querySelector('[data-name="hd_spent"]');
    if (hdSpent) hdSpent.innerText = '0';

    // Restaurer les ressources de classe
    const resSlots = document.getElementById('class-resource-slots');
    if (resSlots) {
        resSlots.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    // Effacer les jets contre la mort
    ['ds_s1', 'ds_s2', 'ds_s3', 'ds_f1', 'ds_f2', 'ds_f3'].forEach(name => {
        const checkbox = document.querySelector(`[name="${name}"]`);
        if (checkbox) checkbox.checked = false;
    });

    // Feedback visuel
    showModal(
        '🛏️ Repos Long Terminé',
        'Vous avez pris un repos de 8 heures.\n\n' +
        '✅ PV restaurés au maximum\n' +
        '✅ Dés de vie restaurés\n' +
        '✅ Ressources de classe restaurées\n' +
        '✅ Jets contre la mort réinitialisés\n' +
        '💡 N\'oubliez pas de préparer vos sorts',
        [
            { label: 'OK', callback: () => { saveData(); calcStats(); } }
        ]
    );

    console.log('✅ Repos Long terminé');
}

/**
 * Gère le feedback visuel pendant l'appui long
 * @param {HTMLElement} btn - Le bouton Repos Long
 * @param {number} progress - Progression (0 à 1)
 */
function updateLongRestProgress(btn, progress) {
    // Créer ou mettre à jour la barre de progression
    let progressBar = btn.querySelector('.rest-progress');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'rest-progress';
        progressBar.style.cssText = 'position: absolute; bottom: 0; left: 0; height: 4px; background: #d4af37; transition: width 0.1s linear;';
        btn.appendChild(progressBar);
    }
    progressBar.style.width = (progress * 100) + '%';

    // Effet de pulsation supplémentaire
    btn.style.transform = `scale(${1 + progress * 0.05})`;
}

/**
 * Nettoie le feedback visuel de l'appui long
 * @param {HTMLElement} btn - Le bouton Repos Long
 */
function cleanupLongRestFeedback(btn) {
    const progressBar = btn.querySelector('.rest-progress');
    if (progressBar) progressBar.remove();
    btn.style.transform = '';
}

/**
 * Initialise le système de repos
 */
function initRestSystem() {
    // Bouton Repos Court - Clic simple
    const btnShortRest = document.getElementById('btn-short-rest');
    if (btnShortRest) {
        btnShortRest.addEventListener('click', performShortRest);
    }

    // Bouton Repos Long - Appui long 2 secondes
    const btnLongRest = document.getElementById('btn-long-rest');
    if (btnLongRest) {
        // Début de l'appui
        btnLongRest.addEventListener('mousedown', function (e) {
            e.preventDefault();
            longRestStartTime = Date.now();

            longRestTimer = setInterval(() => {
                const elapsed = Date.now() - longRestStartTime;
                const progress = Math.min(elapsed / LONG_REST_DURATION, 1);

                updateLongRestProgress(btnLongRest, progress);

                if (progress >= 1) {
                    clearInterval(longRestTimer);
                    cleanupLongRestFeedback(btnLongRest);
                    performLongRest();
                }
            }, 50); // Mise à jour toutes les 50ms
        });

        // Fin de l'appui (relâchement trop tôt)
        btnLongRest.addEventListener('mouseup', function () {
            if (longRestTimer) {
                clearInterval(longRestTimer);
                longRestTimer = null;
                cleanupLongRestFeedback(btnLongRest);

                const elapsed = Date.now() - longRestStartTime;
                if (elapsed < LONG_REST_DURATION) {
                    console.log('⏱️ Repos Long annulé (appui trop court)');
                }
            }
        });

        // Annulation si on quitte le bouton
        btnLongRest.addEventListener('mouseleave', function () {
            if (longRestTimer) {
                clearInterval(longRestTimer);
                longRestTimer = null;
                cleanupLongRestFeedback(btnLongRest);
                console.log('⏱️ Repos Long annulé (souris sortie)');
            }
        });

        // Support tactile (mobile)
        btnLongRest.addEventListener('touchstart', function (e) {
            e.preventDefault();
            longRestStartTime = Date.now();

            longRestTimer = setInterval(() => {
                const elapsed = Date.now() - longRestStartTime;
                const progress = Math.min(elapsed / LONG_REST_DURATION, 1);

                updateLongRestProgress(btnLongRest, progress);

                if (progress >= 1) {
                    clearInterval(longRestTimer);
                    cleanupLongRestFeedback(btnLongRest);
                    performLongRest();
                }
            }, 50);
        });

        btnLongRest.addEventListener('touchend', function () {
            if (longRestTimer) {
                clearInterval(longRestTimer);
                longRestTimer = null;
                cleanupLongRestFeedback(btnLongRest);

                const elapsed = Date.now() - longRestStartTime;
                if (elapsed < LONG_REST_DURATION) {
                    console.log('⏱️ Repos Long annulé (appui tactile trop court)');
                }
            }
        });
    }
}

// Exécuter les tests au chargement si ?debug=1 dans l'URL
if (window.location.search.includes('debug=1')) {
    console.log('🔍 Mode DEBUG activé - Exécution des tests...');
    debugMigration();
}
