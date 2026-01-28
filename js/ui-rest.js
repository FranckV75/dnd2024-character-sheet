// =============================================================================
// UI-REST.JS - SYSTÈME DE REPOS (COURT ET LONG)
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
    let progressBar = btn.querySelector('.rest-progress');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'rest-progress';
        progressBar.style.cssText = 'position: absolute; bottom: 0; left: 0; height: 4px; background: #d4af37; transition: width 0.1s linear;';
        btn.appendChild(progressBar);
    }
    progressBar.style.width = (progress * 100) + '%';
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
            }, 50);
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
