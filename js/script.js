



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
 * Met à jour le select des Sous-Classes selon la Classe sélectionnée
 * @param {string} className - Nom de la classe sélectionnée
 */
function updateSubclassOptions(className) {
    const subclassSelect = document.getElementById('char_subclass');
    if (!subclassSelect) return;

    subclassSelect.innerHTML = '<option value="">-- Choisir --</option>';

    if (!className) return;

    for (const [key, classData] of Object.entries(DD_RULES.classes)) {
        if (classData.nameFr === className && classData.subclasses) {
            classData.subclasses.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub;
                option.textContent = sub;
                subclassSelect.appendChild(option);
            });
            break;
        }
    }
}

/**
 * Initialise les selects de Dons (Feats)
 */
function initFeatSelects() {
    if (typeof FEATS_DATA === 'undefined') return;

    const featSelects = document.querySelectorAll('.feat-select');

    // Trier les dons par Type puis par Ordre Alphabétique
    const featsArray = Object.keys(FEATS_DATA).map(key => ({
        id: key,
        ...FEATS_DATA[key]
    })).sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.name.localeCompare(b.name);
    });

    featSelects.forEach(select => {
        // Sauvegarder la valeur sélectionnée si elle existe
        const currentValue = select.value;
        select.innerHTML = '<option value="">-- Choisir un don --</option>';

        let currentOptGroup = null;

        featsArray.forEach(feat => {
            if (!currentOptGroup || currentOptGroup.label !== `Dons ${feat.type}`) {
                currentOptGroup = document.createElement('optgroup');
                currentOptGroup.label = `Dons ${feat.type}`;
                select.appendChild(currentOptGroup);
            }

            const option = document.createElement('option');
            option.value = feat.id;
            option.textContent = feat.name;
            currentOptGroup.appendChild(option);
        });

        if (currentValue) select.value = currentValue;

        // Gérer le changement
        select.addEventListener('change', function () {
            const container = this.closest('.feat-container');
            const asiSpan = container.querySelector('.feat-asi');
            const descBox = container.querySelector('.feat-desc-box');

            const featId = this.value;
            if (featId && FEATS_DATA[featId]) {
                const feat = FEATS_DATA[featId];
                asiSpan.textContent = feat.asi === "Aucune" ? "" : feat.asi;
                descBox.innerHTML = `<strong>Prérequis:</strong> ${feat.prereq}<br/>${feat.desc}`;
                descBox.style.display = "block";
            } else {
                asiSpan.textContent = "";
                descBox.innerHTML = "";
                descBox.style.display = "none";
            }
            saveData();
        });
    });
}

/**
 * Remplit le select du Destin Hhroéque (Module Odysséee)
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

/**
 * Met à jour le Palier de Renommée en fonction des points (Odyssée)
 */
function updatePalier() {
    const gloryInput = document.getElementById('glory_score');
    const vanityInput = document.getElementById('vanity_score');
    if (!gloryInput || !vanityInput) return;

    const pts = parseInt(gloryInput.value) || 0;
    let palier = "Inconnu";

    if (pts >= 19) palier = "Divin";
    else if (pts >= 15) palier = "Culte";
    else if (pts >= 11) palier = "Idolâtré";
    else if (pts >= 6) palier = "Reconnaissance urbaine";
    else if (pts >= 1) palier = "Célébrité locale";

    vanityInput.value = palier;
}

/**
 * Initialise l'effet "Premium Lazy Reveal" sur les panneaux principaux
 */
function initPremiumReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optionnel : ne plus observer une fois visible
                // observer.unobserve(entry.target); 
            }
        });
    }, {
        threshold: 0.1, // Déclencher quand 10% de l'élément est visible
        rootMargin: "0px 0px -50px 0px"
    });

    const boxes = document.querySelectorAll('.box, .tab-content > div');
    boxes.forEach(box => {
        box.classList.add('premium-reveal');
        observer.observe(box);
    });
}

/**
 * Initialise les Tooltips Premium "Parchemin"
 */
function initPremiumTooltips() {
    let tooltip = document.getElementById('premium-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'premium-tooltip';
        document.body.appendChild(tooltip);
    }

    const elementsWithTitle = document.querySelectorAll('[title]');
    elementsWithTitle.forEach(el => {
        const titleText = el.getAttribute('title');
        if (!titleText) return;

        el.setAttribute('data-premium-title', titleText);
        el.removeAttribute('title'); // Retire le tooltip par défaut natif

        el.addEventListener('mouseenter', (e) => {
            tooltip.textContent = el.getAttribute('data-premium-title');
            tooltip.classList.add('visible');
            positionTooltip(e, tooltip);
        });

        el.addEventListener('mousemove', (e) => {
            positionTooltip(e, tooltip);
        });

        el.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
        });
    });

    function positionTooltip(e, tooltipEl) {
        let x = e.clientX + 15;
        let y = e.clientY + 15;
        // Ajustement si le tooltip sort de l'écran (bas rudimentaire)
        const rect = tooltipEl.getBoundingClientRect();
        if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 10;
        if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 10;

        tooltipEl.style.left = x + 'px';
        tooltipEl.style.top = y + 'px';
    }
}

window.onload = function () {
    generateSkillsHTML();
    initWeapons();
    initSpells();
    populateSelectOptions(); // Remplir les menus déroulants
    populateHeroicDestiny(); // Remplir le menu Destin Héroïque
    initFeatSelects(); // Initialiser les listes déroulantes de Dons
    updatePalier(); // Initialiser le Palier Odyssée au chargement
    initPremiumReveal(); // Initialiser le fade-in au scroll
    initPremiumTooltips(); // Tooltips custom sur éléments title


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

    let zoom = localStorage.getItem('dd2024_bg_zoom');
    if (zoom && typeof updateBgZoom === 'function') {
        updateBgZoom(zoom);
        const zSlider = document.getElementById('bg-zoom');
        if (zSlider) zSlider.value = zoom;
    }

    let posY = localStorage.getItem('dd2024_bg_pos_y');
    if (posY && typeof updateBgPosY === 'function') {
        updateBgPosY(posY);
        const ySlider = document.getElementById('bg-pos-y');
        if (ySlider) ySlider.value = posY;
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
        updateSpellCount();
    }, 100);

    setupDrag();

    // Initialiser le systÃ¨me d'onglets
    initTabs();

    // Initialiser le système de repos
    initRestSystem();
    // Initialiser l'affichage de la Fatigue D&D 2024
    initFatigueDisplay();
    // Initialiser l'autocomplétion des Dons D&D 2024
    initFeatsAutocomplete();
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
        <td style="position: relative;"><div contenteditable="true" class="rich-input single-line wpn-name"></div></td>
        <td><div contenteditable="true" class="rich-input single-line wpn-atk"></div></td>
        <td><div contenteditable="true" class="rich-input single-line wpn-dmg"></div></td>
        <td><div contenteditable="true" class="rich-input single-line wpn-prop"></div></td>
        <td><div contenteditable="true" class="rich-input single-line wpn-prof"></div></td>
        <td><div contenteditable="true" class="rich-input single-line wpn-ammo"></div></td>
        <td><div contenteditable="true" class="rich-input single-line wpn-note"></div></td>
        <td><button class="del-btn" aria-label="Supprimer l'arme" onclick="this.closest('tr').remove(); saveData();">x</button></td>
    `;
    body.appendChild(tr);
    if (data) {
        tr.querySelector('.wpn-name').innerHTML = data.name || '';
        tr.querySelector('.wpn-atk').innerHTML = data.atk || '';
        tr.querySelector('.wpn-dmg').innerHTML = data.dmg || '';
        tr.querySelector('.wpn-prop').innerHTML = data.prop || '';
        tr.querySelector('.wpn-prof').innerHTML = data.prof || '';
        tr.querySelector('.wpn-ammo').innerHTML = data.ammo || '';
        tr.querySelector('.wpn-note').innerHTML = data.note || '';

        // Assigner la catégorie: soit depuis la sauvegarde, soit devinée depuis DD_RULES
        if (data.category) {
            tr.dataset.category = data.category;
        } else if (typeof DD_RULES !== 'undefined' && DD_RULES.weapons) {
            let cleanName = (data.name || '').trim().toLowerCase();
            // Retirer les pluriels "s", les suffixes (1), etc. pour maximiser les chances de match
            cleanName = cleanName.replace(/\(\d+\)/g, '').trim();
            if (cleanName.endsWith('s') && cleanName.length > 3) cleanName = cleanName.slice(0, -1);

            const foundWeapon = DD_RULES.weapons.find(w => {
                const wName = w.name.toLowerCase();
                return cleanName.includes(wName) || wName.includes(cleanName);
            });

            if (foundWeapon && foundWeapon.category) {
                tr.dataset.category = foundWeapon.category;
            } else {
                tr.dataset.category = '';
            }
        }
    }

    // Autocomplétion Armes D&D 2024
    if (typeof DD_RULES !== 'undefined' && DD_RULES.weapons) {
        setupWeaponAutocomplete(tr.querySelector('.wpn-name'), tr);
    }

    bindStyleEvents();
}

/**
 * Filtre les armes affichées dans le tableau selon leur catégorie
 */
function filterWeapons(btn, filter) {
    // Gérer l'état actif des boutons
    document.querySelectorAll('#weapon-filters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const rows = document.querySelectorAll('#weapons_body tr');
    rows.forEach(row => {
        if (filter === 'all') {
            row.style.display = '';
            return;
        }

        const category = (row.dataset.category || '').toLowerCase();

        // Logique de filtrage en fonction des mots-clés de catégorie (injectés par setupWeaponAutocomplete)
        let show = false;

        // Filtres par maîtrise (Courante / Guerre)
        if (filter === 'courante' && category.includes('courante')) show = true;
        if (filter === 'guerre' && category.includes('guerre')) show = true;

        // Pour CàC et Distance, on regarde les propriétés de l'arme
        const props = (row.querySelector('.wpn-prop').innerText || '').toLowerCase();
        const isRanged = props.includes('munitions') || props.includes('lancer');

        if (filter === 'cac' && !isRanged) show = true;
        if (filter === 'distance' && isRanged) show = true;

        row.style.display = show ? '' : 'none';

        // Exemption : toujours afficher les lignes complètement vides (pour pouvoir en ajouter des nouvelles facilement sous un filtre)
        const name = row.querySelector('.wpn-name').innerText.trim();
        if (name === '') row.style.display = '';
    });
}

// =============================================================================
// ARMURES — Tableau dynamique (Story 5)
// =============================================================================

const FATIGUE_DESCRIPTIONS = [
    '',
    '-2 aux tests de d20 ; vitesse -1,5 m',
    '-4 aux tests de d20 ; vitesse -3 m',
    '-6 aux tests de d20 ; vitesse -4,5 m',
    '-8 aux tests de d20 ; vitesse -6 m',
    '-10 aux tests de d20 ; vitesse -7,5 m',
    '⚠️ MORT'
];

function initFatigueDisplay() {
    const input = document.getElementById('fatigue_level');
    const desc = document.getElementById('fatigue-description');
    if (!input || !desc) return;

    const update = () => {
        const val = Math.max(0, Math.min(6, parseInt(input.value) || 0));
        desc.textContent = FATIGUE_DESCRIPTIONS[val] || '';
        desc.style.color = val >= 5 ? 'var(--danger-color, #e74c3c)' : (val >= 3 ? 'var(--warning-color, #e67e22)' : '');
    };
    input.addEventListener('input', update);
    input.addEventListener('change', () => { saveData(); });
    update();
}

function addArmorRow(data = null) {
    const body = document.getElementById('armors_body');
    if (!body) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><div contenteditable="true" class="rich-input single-line armor-name"></div></td>
        <td><div contenteditable="true" class="rich-input single-line armor-ca"></div></td>
        <td><div contenteditable="true" class="rich-input single-line armor-str"></div></td>
        <td style="text-align:center;"><input type="checkbox" class="armor-stealth" aria-label="Désavantage Discrétion"></td>
        <td><div contenteditable="true" class="rich-input single-line armor-weight"></div></td>
        <td><div contenteditable="true" class="rich-input single-line armor-price"></div></td>
        <td><div contenteditable="true" class="rich-input single-line armor-comment"></div></td>
        <td style="text-align:center;"><input type="checkbox" class="armor-equipped" aria-label="Armure équipée"></td>
        <td><button class="del-btn" aria-label="Supprimer l'armure" onclick="this.closest('tr').remove(); saveData();">x</button></td>
    `;
    body.appendChild(tr);
    if (data) {
        tr.querySelector('.armor-name').innerHTML = data.name || '';
        tr.querySelector('.armor-ca').innerHTML = data.ca || '';
        tr.querySelector('.armor-str').innerHTML = data.str || '';
        tr.querySelector('.armor-stealth').checked = data.stealth || false;
        tr.querySelector('.armor-weight').innerHTML = data.weight || '';
        tr.querySelector('.armor-price').innerHTML = data.price || '';
        tr.querySelector('.armor-comment').innerHTML = data.comment || '';
        tr.querySelector('.armor-equipped').checked = data.equipped || false;
    }
    // Sauvegarde auto au changement des checkboxes
    tr.querySelector('.armor-stealth').addEventListener('change', saveData);
    tr.querySelector('.armor-equipped').addEventListener('change', saveData);

    // Autocomplétion Armures D&D 2024
    if (typeof EQUIPMENT_DATA !== 'undefined' && EQUIPMENT_DATA.armors) {
        setupArmorAutocomplete(tr.querySelector('.armor-name'), tr);
    }

    bindStyleEvents();
}


let armorAutocompleteContainer = null;


function setupArmorAutocomplete(input, tr) {
    if (!armorAutocompleteContainer) {
        armorAutocompleteContainer = document.createElement('div');
        armorAutocompleteContainer.id = 'armor-autocomplete';
        armorAutocompleteContainer.style.position = 'absolute';
        armorAutocompleteContainer.style.zIndex = '99999';
        armorAutocompleteContainer.style.backgroundColor = 'var(--bg-color, #2a2a2a)';
        armorAutocompleteContainer.style.border = '1px solid var(--primary-border, #ccc)';
        armorAutocompleteContainer.style.maxHeight = '200px';
        armorAutocompleteContainer.style.overflowY = 'auto';
        armorAutocompleteContainer.style.display = 'none';
        armorAutocompleteContainer.style.boxShadow = '0 4px 6px rgba(0,0,0,0.5)';
        armorAutocompleteContainer.style.minWidth = '200px';
        document.body.appendChild(armorAutocompleteContainer);

        document.addEventListener('click', function (e) {
            if (armorAutocompleteContainer.style.display !== 'none' && e.target !== input && !armorAutocompleteContainer.contains(e.target)) {
                armorAutocompleteContainer.style.display = 'none';
            }
        });
    }

    input.addEventListener('input', function () {
        let val = this.innerText.trim();
        armorAutocompleteContainer.innerHTML = '';

        if (!val || typeof EQUIPMENT_DATA === 'undefined' || !EQUIPMENT_DATA.armors) {
            armorAutocompleteContainer.style.display = 'none';
            return;
        }

        const q = val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let matches = EQUIPMENT_DATA.armors.filter(a => {
            const aName = a.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return aName.includes(q);
        });

        if (matches.length === 0) {
            armorAutocompleteContainer.style.display = 'none';
            return;
        }

        const rect = input.getBoundingClientRect();
        armorAutocompleteContainer.style.left = (rect.left + window.scrollX) + 'px';
        armorAutocompleteContainer.style.top = (rect.bottom + window.scrollY + 2) + 'px';
        armorAutocompleteContainer.style.display = 'block';

        matches.forEach(a => {
            let item = document.createElement('div');
            item.innerHTML = a.name + ` <span style="font-size:0.7em; color:var(--text-muted)">(${a.type})</span>`;
            item.style.padding = '8px';
            item.style.cursor = 'pointer';
            item.style.borderBottom = '1px solid var(--table-border, #444)';
            item.className = 'autocomplete-item';

            item.addEventListener('mousedown', function (e) { e.preventDefault(); });
            item.addEventListener('click', function () {
                input.innerText = a.name;
                tr.querySelector('.armor-ca').innerText = a.ca || '';
                tr.querySelector('.armor-str').innerText = a.str || '';
                tr.querySelector('.armor-stealth').checked = a.stealth || false;
                tr.querySelector('.armor-weight').innerText = a.weight || '';
                tr.querySelector('.armor-price').innerText = a.price || '';

                armorAutocompleteContainer.style.display = 'none';
                saveData();
                bindStyleEvents();
            });
            armorAutocompleteContainer.appendChild(item);
        });
    });
}

let weaponAutocompleteContainer = null;


function setupWeaponAutocomplete(input, tr) {
    if (!weaponAutocompleteContainer) {
        weaponAutocompleteContainer = document.createElement('div');
        weaponAutocompleteContainer.id = 'weapon-autocomplete';
        weaponAutocompleteContainer.style.position = 'absolute';
        weaponAutocompleteContainer.style.zIndex = '99999';
        weaponAutocompleteContainer.style.backgroundColor = 'var(--bg-color, #2a2a2a)';
        weaponAutocompleteContainer.style.border = '1px solid var(--primary-border, #ccc)';
        weaponAutocompleteContainer.style.maxHeight = '200px';
        weaponAutocompleteContainer.style.overflowY = 'auto';
        weaponAutocompleteContainer.style.display = 'none';
        weaponAutocompleteContainer.style.boxShadow = '0 4px 6px rgba(0,0,0,0.5)';
        weaponAutocompleteContainer.style.minWidth = '200px';
        document.body.appendChild(weaponAutocompleteContainer);

        // Clic à l'extérieur pour fermer
        document.addEventListener('click', function (e) {
            if (weaponAutocompleteContainer.style.display !== 'none' && e.target !== input && !weaponAutocompleteContainer.contains(e.target)) {
                weaponAutocompleteContainer.style.display = 'none';
            }
        });
    }

    input.addEventListener('focus', function () {
        // Optionnel : ne rien faire au focus, attendre l'input
    });

    input.addEventListener('input', function () {
        let val = this.innerText.trim();
        weaponAutocompleteContainer.innerHTML = '';

        if (!val || typeof DD_RULES === 'undefined' || !DD_RULES.weapons) {
            weaponAutocompleteContainer.style.display = 'none';
            return;
        }

        const q = val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let matches = DD_RULES.weapons.filter(w => {
            const wName = w.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return wName.includes(q);
        });

        if (matches.length === 0) {
            weaponAutocompleteContainer.style.display = 'none';
            return;
        }

        // Positionnement absolu par rapport à l'input
        const rect = input.getBoundingClientRect();
        weaponAutocompleteContainer.style.left = (rect.left + window.scrollX) + 'px';
        weaponAutocompleteContainer.style.top = (rect.bottom + window.scrollY + 2) + 'px';
        weaponAutocompleteContainer.style.display = 'block';

        matches.forEach(w => {
            let item = document.createElement('div');
            item.innerHTML = w.name;
            item.style.padding = '8px';
            item.style.cursor = 'pointer';
            item.style.borderBottom = '1px solid var(--primary-border, #444)';
            item.style.color = 'var(--text-color, #e0d0b0)';

            item.addEventListener('mouseover', () => item.style.backgroundColor = 'var(--accent-color, #555)');
            item.addEventListener('mouseout', () => item.style.backgroundColor = '');

            item.addEventListener('click', function () {
                input.innerHTML = w.name;
                tr.querySelector('.wpn-atk').innerHTML = w.atk;
                tr.querySelector('.wpn-dmg').innerHTML = w.dmg;
                tr.querySelector('.wpn-prop').innerHTML = w.prop;
                tr.querySelector('.wpn-prof').innerHTML = w.prof;
                tr.dataset.category = w.category || ''; // Injection pour le filtrage
                // ammo n'est pas rempli automatiquement pour que l'utilisateur gère (ex: 15/20)
                weaponAutocompleteContainer.style.display = 'none';
                saveData();

                // Réappliquer le filtre actif si nécessaire
                const activeFilter = document.querySelector('#weapon-filters .filter-btn.active');
                if (activeFilter) {
                    filterWeapons(activeFilter, activeFilter.dataset.filter);
                }
            });
            weaponAutocompleteContainer.appendChild(item);
        });
    });
}

// === SPELL AUTOCOMPLETE SYSTEM ===

/**
 * Mapping des noms français de classes vers les slugs anglais utilisés dans SPELLS_DATA
 */
const CLASS_NAME_TO_SLUG = {};
if (typeof DD_RULES !== 'undefined') {
    for (const [slug, data] of Object.entries(DD_RULES.classes)) {
        CLASS_NAME_TO_SLUG[data.nameFr] = slug;
    }
}

/**
 * Retourne le slug anglais de la classe sélectionnée dans le filtre de sorts.
 * Lit depuis #spell-class-filter (dropdown dédié dans la barre de sorts).
 * Retourne null si "Toutes les classes" est sélectionné.
 */
function getCurrentClassSlug() {
    const filter = document.getElementById('spell-class-filter');
    if (!filter || !filter.value) return null;
    return filter.value; // Déjà un slug anglais (bard, cleric, wizard, etc.)
}

/**
 * Synchronise le filtre de classe des sorts avec la classe du personnage.
 * Appelé au changement de char_class pour pré-sélectionner la classe correspondante,
 * mais uniquement si le filtre est sur "Toutes les classes" (pas d'override utilisateur).
 */
function syncSpellClassFilter() {
    const classSelect = document.getElementById('char_class');
    const spellFilter = document.getElementById('spell-class-filter');
    if (!classSelect || !spellFilter) return;

    const classSlug = CLASS_NAME_TO_SLUG[classSelect.value];
    // Seulement pré-sélectionner si le filtre est sur "Toutes" et que la classe est un lanceur
    if (spellFilter.value === '' && classSlug) {
        const casterType = DD_RULES.casterType[classSlug];
        if (casterType) {
            spellFilter.value = classSlug;
        }
    }
}

/**
 * Filtre SPELLS_DATA selon la classe et le texte saisi
 * @param {string} query - Texte tapé par l'utilisateur
 * @param {string|null} classSlug - Slug de la classe (ou null pour toutes)
 * @returns {Array} - Sorts correspondants (max 15)
 */
function getSpellSuggestions(query, classSlug) {
    if (typeof SPELLS_DATA === 'undefined' || !query || query.length < 2) return [];
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return SPELLS_DATA
        .filter(spell => {
            // Filtre par classe si applicable
            if (classSlug && !spell.classes.includes(classSlug)) return false;
            // Filtre par nom (FR ou VO), insensible aux accents
            const nameFr = spell.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const nameVo = spell.vo.toLowerCase();
            return nameFr.includes(q) || nameVo.includes(q);
        })
        .sort((a, b) => {
            // Priorité aux résultats qui commencent par la query
            const aStarts = a.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').startsWith(q);
            const bStarts = b.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').startsWith(q);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return a.name.localeCompare(b.name, 'fr');
        })
        .slice(0, 15);
}

/**
 * Applique un badge d'école coloré à un élément <span>
 */
function setSchoolBadge(el, schoolName) {
    if (!el || !schoolName) return;
    el.textContent = schoolName;
    const slug = schoolName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    el.className = 'spl-school badge-school badge-' + slug;
}

/**
 * Applique les données d'un sort à la ligne du tableau
 */
function applySpellToRow(tr, spell) {
    if (!tr || !spell) return;
    const lvlSelect = tr.querySelector('.spl-lvl');
    if (lvlSelect) lvlSelect.value = String(spell.level);
    const timeEl = tr.querySelector('.spl-time');
    if (timeEl) timeEl.textContent = spell.castTime || '';
    const rangeEl = tr.querySelector('.spl-range');
    if (rangeEl) rangeEl.textContent = spell.range || '';
    // Concentration / Ritual / Material (C/R/M)
    const cBox = tr.querySelector('.spl-c');
    if (cBox) cBox.checked = !!spell.concentration;
    const rBox = tr.querySelector('.spl-r');
    if (rBox) rBox.checked = !!spell.ritual;
    const mBox = tr.querySelector('.spl-m');
    if (mBox) mBox.checked = spell.components ? spell.components.includes('M') : false;
    // École (badge coloré)
    const schoolEl = tr.querySelector('.spl-school');
    if (schoolEl && spell.school) setSchoolBadge(schoolEl, spell.school);
    // VO dans les notes si vide
    const noteEl = tr.querySelector('.spl-note');
    if (noteEl && !noteEl.textContent.trim()) {
        noteEl.textContent = spell.vo || '';
    }
    saveData();
}

// === SPELL SORTING SYSTEM ===
let currentSpellSort = { col: null, dir: 'asc' };

/**
 * Trie les lignes de sorts par colonne (nom, niveau, école)
 */
function sortSpells(col) {
    const body = document.getElementById('spells_body');
    if (!body) return;

    // Toggle direction
    if (currentSpellSort.col === col) {
        currentSpellSort.dir = currentSpellSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        currentSpellSort.col = col;
        currentSpellSort.dir = 'asc';
    }

    const rows = Array.from(body.querySelectorAll('tr'));

    // Séparer lignes vides (à la fin) et remplies (à trier)
    const filled = rows.filter(r => !isSpellRowEmpty(r));
    const empty = rows.filter(r => isSpellRowEmpty(r));

    filled.sort((a, b) => {
        let va, vb;
        switch (col) {
            case 'lvl':
                va = parseInt(a.querySelector('.spl-lvl')?.value || '0');
                vb = parseInt(b.querySelector('.spl-lvl')?.value || '0');
                break;
            case 'name':
                va = (a.querySelector('.spl-name')?.textContent || '').toLowerCase();
                vb = (b.querySelector('.spl-name')?.textContent || '').toLowerCase();
                break;
            case 'school':
                va = (a.querySelector('.spl-school')?.textContent || '').toLowerCase();
                vb = (b.querySelector('.spl-school')?.textContent || '').toLowerCase();
                break;
            default:
                return 0;
        }
        let cmp = col === 'lvl' ? va - vb : va.localeCompare(vb, 'fr');
        return currentSpellSort.dir === 'desc' ? -cmp : cmp;
    });

    // Réinsérer dans l'ordre
    [...filled, ...empty].forEach(r => body.appendChild(r));

    // Mettre à jour les icônes de tri
    document.querySelectorAll('.sort-icon').forEach(icon => {
        if (icon.dataset.col === col) {
            icon.textContent = currentSpellSort.dir === 'asc' ? '▲' : '▼';
        } else {
            icon.textContent = '';
        }
    });

    saveData();
}

/**
 * Crée le dropdown d'autocomplétion pour un champ de nom de sort
 */
function initSpellAutocomplete(nameEl) {
    if (!nameEl) return;
    // Créer le conteneur du dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'spell-autocomplete-dropdown';
    dropdown.style.display = 'none';
    nameEl.parentElement.style.position = 'relative';
    nameEl.parentElement.appendChild(dropdown);

    let selectedIndex = -1;
    let currentSuggestions = [];

    function showSuggestions(suggestions) {
        currentSuggestions = suggestions;
        selectedIndex = -1;
        if (suggestions.length === 0) {
            dropdown.style.display = 'none';
            return;
        }
        const classSlug = getCurrentClassSlug();
        dropdown.innerHTML = suggestions.map((spell, i) => {
            const levelLabel = spell.level === 0 ? 'Sort m.' : `Niv.${spell.level}`;
            const schoolClass = spell.school.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return `<div class="spell-suggestion" data-index="${i}">
                <span class="spell-sug-name">${spell.name}</span>
                <span class="spell-sug-meta">
                    <span class="spell-sug-level">${levelLabel}</span>
                    <span class="spell-sug-school badge-${schoolClass}">${spell.school}</span>
                </span>
            </div>`;
        }).join('');
        dropdown.style.display = 'block';

        // Click handlers
        dropdown.querySelectorAll('.spell-suggestion').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const idx = parseInt(item.dataset.index);
                selectSuggestion(idx);
            });
        });
    }

    function selectSuggestion(idx) {
        if (idx < 0 || idx >= currentSuggestions.length) return;
        const spell = currentSuggestions[idx];
        // Handle names with | (alternatives)
        const displayName = spell.name.includes('|') ? spell.name.split('|')[0].trim() : spell.name;
        nameEl.textContent = displayName;
        dropdown.style.display = 'none';
        // Auto-fill the row
        const tr = nameEl.closest('tr');
        applySpellToRow(tr, spell);
    }

    function highlightItem(idx) {
        dropdown.querySelectorAll('.spell-suggestion').forEach(el => el.classList.remove('highlighted'));
        if (idx >= 0 && idx < currentSuggestions.length) {
            const el = dropdown.querySelector(`[data-index="${idx}"]`);
            if (el) {
                el.classList.add('highlighted');
                el.scrollIntoView({ block: 'nearest' });
            }
        }
    }

    // Input handler
    nameEl.addEventListener('input', () => {
        const query = nameEl.textContent.trim();
        const classSlug = getCurrentClassSlug();
        const suggestions = getSpellSuggestions(query, classSlug);
        showSuggestions(suggestions);
    });

    // Keyboard navigation
    nameEl.addEventListener('keydown', (e) => {
        if (dropdown.style.display === 'none') return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, currentSuggestions.length - 1);
            highlightItem(selectedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            highlightItem(selectedIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0) {
                selectSuggestion(selectedIndex);
            } else if (currentSuggestions.length === 1) {
                selectSuggestion(0);
            }
            dropdown.style.display = 'none';
        } else if (e.key === 'Escape') {
            dropdown.style.display = 'none';
        }
    });

    // Hide on blur
    nameEl.addEventListener('blur', () => {
        setTimeout(() => { dropdown.style.display = 'none'; }, 150);
    });
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
        <td class="prep-cell"><input type="checkbox" class="spl-prep" onchange="saveData()" title="Préparé"></td>
        <td>
            <select class="spl-lvl std-input" onchange="saveData()">
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
            </select>
        </td>
        <td><div contenteditable="true" class="rich-input single-line spl-name" spellcheck="false"></div></td>
        <td class="school-cell"><span class="spl-school"></span></td>
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
        // Clean legacy HTML from level value
        const cleanLvl = String(data.lvl || '0').replace(/<[^>]*>/g, '').trim();
        tr.querySelector('.spl-lvl').value = cleanLvl || '0';
        tr.querySelector('.spl-name').innerHTML = data.name || '';
        tr.querySelector('.spl-time').innerHTML = data.time || '';
        tr.querySelector('.spl-range').innerHTML = data.range || '';
        tr.querySelector('.spl-note').innerHTML = data.note || '';
        tr.querySelector('.spl-c').checked = data.c || false;
        tr.querySelector('.spl-r').checked = data.r || false;
        tr.querySelector('.spl-m').checked = data.m || false;
        // New fields (backward compatible)
        if (data.prep !== undefined) tr.querySelector('.spl-prep').checked = data.prep;
        if (data.school) setSchoolBadge(tr.querySelector('.spl-school'), data.school);
    }
    // Attach autocomplete to spell name field
    initSpellAutocomplete(tr.querySelector('.spl-name'));
    bindStyleEvents();
}

// === SPELL FILTERING SYSTEM (Multi-select) ===
let activeSpellFilters = new Set(); // Vide = tous les niveaux

/**
 * Retourne les emplacements par défaut pour la classe et le niveau actuels.
 * Utilise DD_RULES.getSpellSlots() pour le calcul officiel D&D 2024.
 * Fallback sur des valeurs standards si les règles ne sont pas chargées.
 */
function getDefaultSpellSlots() {
    if (typeof DD_RULES === 'undefined' || !DD_RULES.getSpellSlots) {
        return { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 };
    }
    const classSelect = document.getElementById('char_class');
    const cls = classSelect ? classSelect.value : '';
    const lvl = getVal('char_level') || 1;
    const slots = DD_RULES.getSpellSlots(cls, lvl);
    // Si la classe n'est pas un lanceur, retourner des slots vides
    return Object.keys(slots).length > 0 ? slots : {};
}

/**
 * Détermine si une ligne de sort est "vide" (aucun contenu saisi)
 */
function isSpellRowEmpty(row) {
    const nameEl = row.querySelector('.spl-name');
    const name = nameEl ? nameEl.textContent.trim() : '';
    const timeEl = row.querySelector('.spl-time');
    const time = timeEl ? timeEl.textContent.trim() : '';
    const rangeEl = row.querySelector('.spl-range');
    const range = rangeEl ? rangeEl.textContent.trim() : '';
    return name === '' && time === '' && range === '';
}

/**
 * Met à jour le compteur de sorts visibles
 */
function updateSpellCount() {
    const counter = document.getElementById('spell-count');
    if (!counter) return;
    const rows = document.querySelectorAll('#spells_body tr');
    let total = 0;
    let visible = 0;
    rows.forEach(row => {
        if (!isSpellRowEmpty(row)) {
            total++;
            if (row.style.display !== 'none') visible++;
        }
    });
    if (activeSpellFilters.size === 0) {
        counter.textContent = `${total} sort${total > 1 ? 's' : ''}`;
    } else {
        counter.textContent = `${visible} / ${total} sort${total > 1 ? 's' : ''}`;
    }
}

/**
 * Filtre les sorts par niveau avec multi-sélection (toggle)
 * - Cliquer "Tous" réinitialise la sélection
 * - Cliquer un niveau l'ajoute/retire du filtre actif
 * - Les lignes vides restent toujours visibles
 */
function filterSpells(level) {
    if (level === 'all') {
        activeSpellFilters.clear();
    } else {
        // Toggle : ajouter ou retirer le niveau
        if (activeSpellFilters.has(level)) {
            activeSpellFilters.delete(level);
        } else {
            activeSpellFilters.add(level);
        }
    }

    // Si plus aucun filtre actif, revenir au mode "Tous"
    const showAll = activeSpellFilters.size === 0;

    // Update active buttons (multi-select)
    document.querySelectorAll('.spell-filter-btn').forEach(btn => {
        const btnLevel = btn.dataset.level;
        if (btnLevel === 'all') {
            btn.classList.toggle('active', showAll);
        } else {
            btn.classList.toggle('active', activeSpellFilters.has(btnLevel));
        }
    });

    // Filter table rows — lignes vides toujours visibles
    const rows = document.querySelectorAll('#spells_body tr');
    rows.forEach(row => {
        if (showAll) {
            row.style.display = '';
            return;
        }

        // Les lignes vides restent toujours visibles
        if (isSpellRowEmpty(row)) {
            row.style.display = '';
            return;
        }

        const lvlCell = row.querySelector('.spl-lvl');
        const rowLevel = lvlCell ? (lvlCell.tagName === 'SELECT' ? lvlCell.value : lvlCell.textContent.trim()) : '';
        row.style.display = activeSpellFilters.has(rowLevel) ? '' : 'none';
    });

    // Show/hide slot tracker
    const tracker = document.getElementById('spell-slots-tracker');
    if (showAll || (activeSpellFilters.size === 1 && activeSpellFilters.has('0'))) {
        tracker.style.display = 'none';
    } else {
        tracker.style.display = 'flex';
        // Afficher les slots pour tous les niveaux sélectionnés (hors 0)
        const levelsForSlots = [...activeSpellFilters].filter(l => l !== '0').map(Number);
        if (levelsForSlots.length > 0) {
            updateSpellSlots(levelsForSlots);
        } else {
            tracker.style.display = 'none';
        }
    }

    // Mettre à jour le compteur
    updateSpellCount();
}

/**
 * Met à jour l'affichage des emplacements de sorts.
 * Supporte un seul niveau (number) ou plusieurs (array).
 */
function updateSpellSlots(levels) {
    const container = document.getElementById('slots-container');
    if (!container) return;

    // Normaliser : accepter un nombre ou un tableau
    if (!Array.isArray(levels)) levels = [levels];

    const savedSlots = JSON.parse(localStorage.getItem('spell_slots') || '{}');
    let html = '';

    levels.forEach(level => {
        const defaultSlots = getDefaultSpellSlots();
        const maxSlots = savedSlots[`max_${level}`] !== undefined ? savedSlots[`max_${level}`] : (defaultSlots[level] || 0);
        const usedSlots = savedSlots[`used_${level}`] || 0;

        html += `<span class="slots-level">Niv ${level}</span>`;
        for (let i = 0; i < maxSlots; i++) {
            const checked = i < usedSlots ? 'checked' : '';
            html += `<input type="checkbox" class="slot-checkbox" data-level="${level}" data-index="${i}" ${checked} onchange="toggleSlot(${level}, ${i}, this.checked)">`;
        }
        html += `<button class="slots-remove-btn" onclick="removeSpellSlot(${level})" title="Retirer un emplacement">-</button>`;
        html += `<button class="slots-add-btn" onclick="addSpellSlot(${level})" title="Ajouter un emplacement">+</button>`;

        // Séparateur entre niveaux
        if (levels.length > 1) html += `<span class="slots-separator">│</span>`;
    });

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
    const defaultSlots = getDefaultSpellSlots();
    const currentMax = savedSlots[`max_${level}`] !== undefined ? savedSlots[`max_${level}`] : (defaultSlots[level] || 0);
    savedSlots[`max_${level}`] = currentMax + 1;
    localStorage.setItem('spell_slots', JSON.stringify(savedSlots));

    // Refresh correctly (keep multi-select view if active)
    refreshSpellSlots(level);
}

function removeSpellSlot(level) {
    const savedSlots = JSON.parse(localStorage.getItem('spell_slots') || '{}');
    const defaultSlots = getDefaultSpellSlots();
    const currentMax = savedSlots[`max_${level}`] !== undefined ? savedSlots[`max_${level}`] : (defaultSlots[level] || 0);

    if (currentMax > 0) {
        savedSlots[`max_${level}`] = currentMax - 1;

        // Ensure used slots don't exceed new max
        const used = savedSlots[`used_${level}`] || 0;
        if (used > savedSlots[`max_${level}`]) {
            savedSlots[`used_${level}`] = savedSlots[`max_${level}`];
        }

        localStorage.setItem('spell_slots', JSON.stringify(savedSlots));
        refreshSpellSlots(level);
    }
}

function refreshSpellSlots(fallbackLevel) {
    if (typeof activeSpellFilters !== 'undefined' && activeSpellFilters.size > 0) {
        const levelsForSlots = [...activeSpellFilters].filter(l => l !== '0').map(Number);
        if (levelsForSlots.length > 0) {
            updateSpellSlots(levelsForSlots);
            return;
        }
    }
    updateSpellSlots(fallbackLevel);
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
    syncSpellClassFilter();

    // Mettre à jour les emplacements de sorts si un filtre de niveau est actif
    if (typeof activeSpellFilters !== 'undefined' && activeSpellFilters.size > 0) {
        const levelsForSlots = [...activeSpellFilters].filter(l => l !== '0').map(Number);
        if (levelsForSlots.length > 0) {
            updateSpellSlots(levelsForSlots);
        }
    }

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




