/**
 * Utilidades generales para Velour Keno
 * Funciones de formato, fecha, notificaciones y más.
 */

// ==========================================
// FORMATEO DE CRÉDITOS
// ==========================================

/**
 * Convierte un número al formato de créditos del casino.
 * Ejemplo: 1000 → "1.000 ✦"
 *
 * @param {number|null|undefined} amount - Cantidad a formatear.
 * @returns {string} Créditos formateados con el símbolo ✦.
 */
function formatCredits(amount) {
    if (amount == null || isNaN(amount)) return '0 ✦';
    return Number(amount).toLocaleString('es-CO') + ' ✦';
}

// ==========================================
// FORMATEO DE FECHAS
// ==========================================

/**
 * Convierte un string ISO a formato local legible.
 * Ejemplo: "2026-06-03T08:45:00Z" → "3/06/2026 08:45"
 *
 * @param {string|null} isoDate - Fecha en formato ISO.
 * @returns {string} Fecha formateada o "-" si es nula.
 */
function formatDate(isoDate) {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// ==========================================
// TIEMPO RELATIVO
// ==========================================

/**
 * Retorna una representación relativa del tiempo transcurrido.
 * "Hace un momento", "Hace 5 min", "Hace 2h"
 *
 * @param {string|null} isoDate - Fecha en formato ISO.
 * @returns {string} Texto relativo o fecha formateada.
 */
function timeAgo(isoDate) {
    if (!isoDate) return '-';

    const now = Date.now();
    const date = new Date(isoDate);
    const diffMs = now - date.getTime();

    if (diffMs < 0) return formatDate(isoDate);

    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return 'Hace un momento';

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Hace ${diffMin} min`;

    const diffHor = Math.floor(diffMin / 60);
    if (diffHor < 24) return `Hace ${diffHor}h`;

    return formatDate(isoDate);
}

// ==========================================
// NOTIFICACIONES TOAST
// ==========================================

/**
 * Muestra una notificación flotante en la esquina inferior derecha.
 * Se auto-destruye después de 3 segundos con fade out.
 *
 * @param {string} message - Mensaje a mostrar.
 * @param {'info'|'success'|'error'|'warning'} [type='info'] - Tipo de toast.
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Activar transición de entrada en el siguiente frame
    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });

    // Auto-remover después de 3 segundos con fade out
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        }, { once: true });
        // Fallback por si transitionend no se dispara
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 400);
    }, 3000);
}

// ==========================================
// INICIALES DE USUARIO
// ==========================================

/**
 * Obtiene las primeras 2 iniciales en mayúsculas de un nombre.
 * "Jherson Sánchez" → "JS"
 *
 * @param {string|null|undefined} name - Nombre completo.
 * @returns {string} Iniciales o "??" si es nulo.
 */
function getInitials(name) {
    if (!name || typeof name !== 'string') return '??';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '??';
    return parts
        .slice(0, 2)
        .map(p => p.charAt(0).toUpperCase())
        .join('');
}

// ==========================================
// FORMATEO DE TEMPORIZADOR
// ==========================================

/**
 * Formatea segundos a formato MM:SS.
 * 210 → "3:30", 65 → "1:05", 9 → "0:09"
 *
 * @param {number} seconds - Total de segundos.
 * @returns {string} Tiempo en formato MM:SS.
 */
function formatTimer(seconds) {
    if (seconds == null || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

// ==========================================
// DEBOUNCE
// ==========================================

/**
 * Crea una versión con debounce de la función dada.
 *
 * @param {Function} func - Función a ejecutar con debounce.
 * @param {number} [wait=300] - Milisegundos de espera.
 * @returns {Function} Función con debounce.
 */
function debounce(func, wait = 300) {
    let timeoutId = null;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), wait);
    };
}
