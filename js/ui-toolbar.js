// =============================================================================
// UI-TOOLBAR.JS - TOOLBAR, OPACITÉ & ÉDITEUR DE STYLE (MODULE ES6)
// =============================================================================

export function updateOpacity(val) {
    document.documentElement.style.setProperty('--sheet-opacity', val);
    const containers = document.querySelectorAll('.sheet-container');
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const baseColor = isDark ? '20, 25, 40' : '255, 255, 255';
    containers.forEach(c => c.style.backgroundColor = `rgba(${baseColor}, ${val})`);
    localStorage.setItem('dd2024_opacity', val);
}

export function changeBackground(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const bgData = e.target.result;
            document.body.style.backgroundImage = `url('${bgData}')`;
            try {
                localStorage.setItem('dd2024_bg', bgData);
            } catch (err) {
                if (typeof window.showModal === 'function') {
                    window.showModal("Attention : L'image est trop volumineuse pour être sauvegardée. Elle sera affichée pour cette session, mais disparaitra si vous rechargez la page.");
                }
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
    input.value = '';
}

export function updateBgZoom(val) {
    if (parseInt(val) === 100) {
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundRepeat = 'no-repeat';
    } else {
        document.body.style.backgroundSize = `${val}% auto`;
        document.body.style.backgroundRepeat = 'no-repeat';
    }
    localStorage.setItem('dd2024_bg_zoom', val);
}

export function updateBgPosY(val) {
    document.body.style.backgroundPosition = `center ${val}%`;
    localStorage.setItem('dd2024_bg_pos_y', val);
}

export function bindStyleEvents() {
    const targets = document.querySelectorAll('.rich-input, [id^="skill_val_"], .stat-mod, #spell_save_dc, #spell_atk_bonus, #pb_display, #str_save_val, #dex_save_val, #con_save_val, #int_save_val, #wis_save_val, #cha_save_val');
    targets.forEach(el => {
        el.removeEventListener('contextmenu', handleRightClick);
        el.addEventListener('contextmenu', handleRightClick);
    });
}

export function handleRightClick(e) {
    e.preventDefault();
    let x = e.pageX || (e.touches ? e.touches[0].pageX : 0);
    let y = e.pageY || (e.touches ? e.touches[0].pageY : 0);
    if (x === undefined) { x = e.clientX + window.scrollX; y = e.clientY + window.scrollY; }
    showStyleEditor(x, y, this);
}

export function setupDrag() {
    const toolbar = document.getElementById('toolbar');
    const header = document.getElementById('toolbar-header');
    if (!toolbar || !header) return;
    let isDragging = false; let startX, startY, initialLeft, initialTop;
    function getCoords(e) { return e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY }; }
    function start(e) {
        if (e.target.closest('.minimize-btn') || e.target.closest('button')) return;
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

    window.addEventListener('resize', () => {
        const r = toolbar.getBoundingClientRect();
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        if (r.right > winW) {
            toolbar.style.left = (winW - r.width - 20) + 'px';
        }
        if (r.bottom > winH) {
            toolbar.style.top = (winH - r.height - 20) + 'px';
        }
        if (r.left < 0) {
            toolbar.style.left = '20px';
        }
    });
}

export function toggleToolbar(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const t = document.getElementById('toolbar');
    if (t) {
        t.classList.toggle('minimized');
        const btn = document.getElementById('minimize-btn');
        if (btn) btn.innerHTML = t.classList.contains('minimized') ? '&#9744;' : '_';
    }
}

let currentEditElement = null;

export function showStyleEditor(x, y, el) {
    currentEditElement = el;
    const ed = document.getElementById('style-editor');
    if (ed) {
        ed.style.left = x + 'px'; ed.style.top = y + 'px'; ed.style.display = 'block';
    }
}

export function applyFormat(command, value = null) {
    if (!currentEditElement) return;
    currentEditElement.focus();
    document.execCommand(command, false, value);
    const ed = document.getElementById('style-editor');
    if (ed) ed.style.display = 'none';
    const sheetForm = document.getElementById('sheet-form');
    if (sheetForm) sheetForm.dispatchEvent(new Event('input'));
}

export function applyColor(color) { applyFormat('foreColor', color); }
export function applyFontSize(size) { applyFormat('fontSize', size); }

export function toggleCinemaMode() {
    const body = document.body;
    const btn = document.getElementById('cinema-btn');
    const toolbar = document.getElementById('toolbar');
    if (!body || !btn) return;

    body.classList.toggle('cinema-mode');

    if (body.classList.contains('cinema-mode')) {
        btn.innerHTML = '❌';
        btn.title = "Quitter le mode Cinéma";
        
        if (toolbar && !toolbar.classList.contains('minimized')) {
            toolbar.classList.add('minimized');
            const minBtn = document.getElementById('minimize-btn');
            if (minBtn) minBtn.innerHTML = '&#9744;';
        }
    } else {
        btn.innerHTML = '👁️';
        btn.title = "Mode Cinéma (Masquer l'interface)";
    }
}

window.updateOpacity = updateOpacity;
window.changeBackground = changeBackground;
window.updateBgZoom = updateBgZoom;
window.updateBgPosY = updateBgPosY;
window.bindStyleEvents = bindStyleEvents;
window.handleRightClick = handleRightClick;
window.setupDrag = setupDrag;
window.toggleToolbar = toggleToolbar;
window.showStyleEditor = showStyleEditor;
window.applyFormat = applyFormat;
window.applyColor = applyColor;
window.applyFontSize = applyFontSize;
window.toggleCinemaMode = toggleCinemaMode;
