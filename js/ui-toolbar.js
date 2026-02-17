/**
 * UI-TOOLBAR.JS
 * Système de toolbar, opacité, fond d'écran, et éditeur de style
 * Extrait de script.js lors du refactoring Option B
 */

// =============================================================================
// GESTION DE L'OPACITÉ ET DU FOND D'ÉCRAN
// =============================================================================

/**
 * Met à jour l'opacité des containers de la fiche
 * @param {number} val - Valeur d'opacité (0.2 à 1)
 */
function updateOpacity(val) {
    document.documentElement.style.setProperty('--sheet-opacity', val);
    const containers = document.querySelectorAll('.sheet-container');
    // Utiliser la bonne couleur de fond selon le thème actif
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const baseColor = isDark ? '20, 25, 40' : '255, 255, 255';
    containers.forEach(c => c.style.backgroundColor = `rgba(${baseColor}, ${val})`);
    localStorage.setItem('dd2024_opacity', val);
}

/**
 * Met à jour le zoom vertical de l'image de fond
 * Si zoom = 100% -> background-size: cover (comportement standard)
 * Si zoom != 100% -> background-size: <val>% auto (permet de dézoomer ou sur-zoomer)
 * @param {number} val - Zoom en pourcentage (20-200)
 */
function updateBgZoom(val) {
    if (parseInt(val) === 100) {
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundRepeat = 'no-repeat'; // Évite la répétition si on repasse à cover
    } else {
        // Mode manuel (dézoom ou zoom fort)
        document.body.style.backgroundSize = `${val}% auto`;

        // Si on dézoome (<100), on veut peut-être éviter la répétition ou centrer
        document.body.style.backgroundRepeat = 'no-repeat';
        // La position est déjà gérée par updateBgPosY (center Y%)
    }
    localStorage.setItem('dd2024_bg_zoom', val);
}

/**
 * Met à jour la position verticale de l'image de fond
 * @param {number} val - Position Y en pourcentage (0-100)
 */
function updateBgPosY(val) {
    // Center X is always maintained (50% or center)
    document.body.style.backgroundPosition = `center ${val}%`;
    localStorage.setItem('dd2024_bg_pos_y', val);
}

/**
 * Change l'image de fond via un input file
 * @param {HTMLInputElement} input - Input file contenant l'image
 */
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

// =============================================================================
// GESTION DU CLIC DROIT ET ÉDITEUR DE STYLE
// =============================================================================

/**
 * Associe les événements de clic droit aux éléments éditables
 */
function bindStyleEvents() {
    const targets = document.querySelectorAll('.rich-input, [id^="skill_val_"], .stat-mod, #spell_save_dc, #spell_atk_bonus, #pb_display, #str_save_val, #dex_save_val, #con_save_val, #int_save_val, #wis_save_val, #cha_save_val');
    targets.forEach(el => {
        el.removeEventListener('contextmenu', handleRightClick);
        el.addEventListener('contextmenu', handleRightClick);
    });
}

/**
 * Gère le clic droit pour afficher l'éditeur de style
 * @param {Event} e - Événement de clic droit
 */
function handleRightClick(e) {
    e.preventDefault();
    let x = e.pageX || (e.touches ? e.touches[0].pageX : 0);
    let y = e.pageY || (e.touches ? e.touches[0].pageY : 0);
    if (x === undefined) { x = e.clientX + window.scrollX; y = e.clientY + window.scrollY; }
    showStyleEditor(x, y, this);
}

// =============================================================================
// SYSTÈME DE DRAG DE LA TOOLBAR
// =============================================================================

/**
 * Configure le système de glisser-déposer pour la toolbar
 */
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

/**
 * Bascule l'état minimisé/maximisé de la toolbar
 * @param {Event} e - Événement de clic
 */
function toggleToolbar(e) {
    if (e.stopPropagation) e.stopPropagation();
    const t = document.getElementById('toolbar');
    if (t) {
        t.classList.toggle('minimized');
        const btn = document.getElementById('minimize-btn');
        if (btn) btn.innerHTML = t.classList.contains('minimized') ? '&#9744;' : '_';
    }
}

// =============================================================================
// ÉDITEUR DE STYLE (FORMATAGE DE TEXTE)
// =============================================================================

let currentEditElement = null;

/**
 * Affiche l'éditeur de style à une position donnée
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @param {HTMLElement} el - Élément cible pour le formatage
 */
function showStyleEditor(x, y, el) {
    currentEditElement = el;
    const ed = document.getElementById('style-editor');
    if (ed) {
        ed.style.left = x + 'px'; ed.style.top = y + 'px'; ed.style.display = 'block';
    }
}

/**
 * Applique une commande de formatage au texte sélectionné
 * @param {string} command - Commande execCommand (bold, italic, underline, etc.)
 * @param {string|null} value - Valeur optionnelle pour la commande
 */
function applyFormat(command, value = null) {
    if (!currentEditElement) return;
    currentEditElement.focus();
    document.execCommand(command, false, value);
    const ed = document.getElementById('style-editor');
    if (ed) ed.style.display = 'none';
    document.getElementById('sheet-form').dispatchEvent(new Event('input'));
}

/**
 * Applique une couleur au texte sélectionné
 * @param {string} color - Couleur en format CSS
 */
function applyColor(color) { applyFormat('foreColor', color); }

/**
 * Applique une taille de police au texte sélectionné
 * @param {string} size - Taille de police (1-7)
 */
function applyFontSize(size) { applyFormat('fontSize', size); }
