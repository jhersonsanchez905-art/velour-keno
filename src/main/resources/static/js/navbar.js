/**
 * Módulo de navegación para Velour Keno
 * Renderiza la barra de navegación dinámica, maneja recarga de
 * créditos, menú de perfil y actualización de saldo en vivo.
 *
 * Dependencias: api.js, utils.js
 */

// ==========================================
// RENDERIZAR NAVBAR
// ==========================================

/**
 * Renderiza la barra de navegación con los datos del usuario autenticado.
 * @param {'jugar'|'historial'|'estadisticas'|'paytable'|'ayuda'} activePage - Página activa.
 */
async function renderNavbar(activePage) {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    const navHtml = `
    <nav class="navbar">
      <a class="nav-logo">
        <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="50,10 84.6,30 84.6,70 50,90 15.4,70 15.4,30" fill="none" stroke="#6B0F1A" stroke-width="4"/>
          <polygon points="50,22 74.2,36 74.2,64 50,78 25.8,64 25.8,36" fill="none" stroke="#C9A84C" stroke-width="3"/>
          <circle cx="50" cy="50" r="8" fill="#6B0F1A"/>
          <circle cx="50" cy="50" r="3" fill="#C9A84C"/>
        </svg>
        <span class="nav-logo-text">VELOUR</span>
      </a>
      <ul class="nav-links">
        <li><a href="/game.html" class="nav-link${activePage === 'jugar' ? ' active' : ''}">JUGAR</a></li>
        <li class="nav-separator"></li>
        <li><a href="/history.html" class="nav-link${activePage === 'historial' ? ' active' : ''}">HISTORIAL</a></li>
        <li class="nav-separator"></li>
        <li><a href="#" class="nav-link${activePage === 'estadisticas' ? ' active' : ''}">ESTADÍSTICAS</a></li>
        <li class="nav-separator"></li>
        <li><a href="/game.html" onclick="sessionStorage.setItem('openModal','paytableModal')" class="nav-link${activePage === 'paytable' ? ' active' : ''}">PAYTABLE</a></li>
        <li class="nav-separator"></li>
        <li><a href="/game.html" onclick="sessionStorage.setItem('openModal','howToPlayModal')" class="nav-link${activePage === 'ayuda' ? ' active' : ''}">¿CÓMO JUGAR?</a></li>
      </ul>
      <div class="nav-right">
        <button class="nav-recharge" onclick="openRechargeModal()">+ Créditos</button>
        <div class="nav-balance">
          <span class="nav-balance-label">SALDO</span>
          <span id="navBalance">${formatCredits(user.balance)}</span>
        </div>
        <div class="nav-avatar" title="${user.username}" onclick="toggleProfileMenu()">${getInitials(user.username)}</div>
      </div>
    </nav>
    `;

    document.body.insertAdjacentHTML('afterbegin', navHtml);
}

// ==========================================
// ACTUALIZAR SALDO
// ==========================================

/**
 * Actualiza el saldo mostrado en la barra de navegación.
 * @param {number} newBalance - Nuevo saldo a mostrar.
 */
function updateNavBalance(newBalance) {
    const el = document.getElementById('navBalance');
    if (el) el.textContent = formatCredits(newBalance);
}

// ==========================================
// MODAL DE RECARGA
// ==========================================

const RECARGA_OPCIONES = [500, 1000, 5000, 10000];

/**
 * Abre el modal de recarga de créditos con los paquetes disponibles.
 */
function openRechargeModal() {
    const existing = document.getElementById('rechargeModal');
    if (existing) return;

    const modal = document.createElement('div');
    modal.id = 'rechargeModal';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.7);
        display: flex; align-items: center; justify-content: center;
        z-index: 2000;
    `;

    const buttonsHtml = RECARGA_OPCIONES.map(amount =>
        `<button style="
            background:#1A1A1A; border:1px solid #2A2A2A; color:#C9A84C;
            font-family:Georgia,serif; font-size:18px; font-weight:700;
            height:64px; width:100%; border-radius:12px; cursor:pointer;
            transition:border-color 0.2s ease;
        "
        onmouseover="this.style.borderColor='#C9A84C'"
        onmouseout="this.style.borderColor='#2A2A2A'"
        onclick="rechargeCredits(${amount})">${formatCredits(amount)}</button>`
    ).join('');

    modal.innerHTML = `
        <div style="
            background:#111111; border:1px solid #2A2A2A; border-radius:16px;
            padding:32px; max-width:400px; width:90%;
        ">
            <h2 style="color:#F5F0EB; font-size:20px; font-weight:400; margin:0 0 4px; text-align:center;">
                Recargar Créditos
            </h2>
            <p style="color:#8A7A75; font-size:13px; margin:0 0 24px; text-align:center;">
                Selecciona un paquete de créditos gratuitos
            </p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
                ${buttonsHtml}
            </div>
            <button onclick="closeRechargeModal()" style="
                width:100%; padding:12px; background:transparent; border:1px solid #2A2A2A;
                color:#8A7A75; font-size:13px; border-radius:12px; cursor:pointer;
                transition:color 0.2s ease;
            "
            onmouseover="this.style.color='#F5F0EB'"
            onmouseout="this.style.color='#8A7A75'">
                Cancelar
            </button>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Cierra el modal de recarga de créditos.
 */
function closeRechargeModal() {
    const modal = document.getElementById('rechargeModal');
    if (modal) modal.remove();
}

/**
 * Envía una solicitud de recarga de créditos al backend.
 * @param {number} amount - Cantidad de créditos a recargar.
 */
async function rechargeCredits(amount) {
    try {
        const data = await apiFetch('/user/recharge', 'POST', { amount });
        updateNavBalance(data.balance);
        closeRechargeModal();
        showToast(`¡Recargaste ${formatCredits(amount)}!`, 'success');
    } catch (error) {
        showToast('Error al recargar créditos', 'error');
    }
}

// ==========================================
// MENÚ DESPLEGABLE DEL PERFIL
// ==========================================

/**
 * Abre o cierra el menú desplegable del perfil de usuario.
 */
function toggleProfileMenu() {
    const existing = document.getElementById('profileMenu');
    if (existing) {
        existing.remove();
        return;
    }

    const menu = document.createElement('div');
    menu.id = 'profileMenu';
    menu.innerHTML = `
        <a href="/profile.html" style="display:block; padding:10px 16px; color:#F5F0EB; font-size:13px; text-decoration:none;">Mi Perfil</a>
        <a href="/history.html" style="display:block; padding:10px 16px; color:#F5F0EB; font-size:13px; text-decoration:none;">Historial</a>
        <hr style="border:none; border-top:1px solid #2A2A2A; margin:4px 0;">
        <a href="#" onclick="logout()" style="display:block; padding:10px 16px; color:#E53E3E; font-size:13px; text-decoration:none;">Cerrar sesión</a>
    `;

    document.body.appendChild(menu);

    // Cerrar al hacer clic fuera después de 100ms
    setTimeout(() => {
        function handleClickOutside(e) {
            const currentMenu = document.getElementById('profileMenu');
            if (currentMenu && !currentMenu.contains(e.target) && !e.target.closest('.nav-avatar')) {
                currentMenu.remove();
                document.removeEventListener('click', handleClickOutside);
            }
        }
        document.addEventListener('click', handleClickOutside);
    }, 100);
}
