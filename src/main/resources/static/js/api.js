/**
 * Módulo API para Velour Keno
 * Maneja todas las peticiones HTTP al backend de Spring Boot,
 * gestión de tokens JWT y utilidades de autenticación.
 */

// ==========================================
// CONFIGURACIÓN
// ==========================================

/**
 * URL base para las peticiones a la API.
 */
const API_BASE = '/api';

// ==========================================
// GESTIÓN DE TOKEN JWT (localStorage)
// ==========================================

const TOKEN_KEY = 'velour_token';

/**
 * Obtiene el token JWT almacenado.
 * @returns {string|null} El token JWT o null si no existe.
 */
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Guarda el token JWT en el localStorage.
 * @param {string} token - El token JWT a guardar.
 */
function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Elimina el token JWT del localStorage.
 */
function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

/**
 * Verifica si el usuario está autenticado (tiene un token).
 * @returns {boolean} true si hay un token, false en caso contrario.
 */
function isAuthenticated() {
    return !!getToken();
}

// ==========================================
// FUNCIONES DE PETICIÓN HTTP
// ==========================================

/**
 * Realiza peticiones autenticadas al backend.
 * 
 * @param {string} endpoint - El endpoint de la API (e.g., '/juegos').
 * @param {string} [method='GET'] - Método HTTP (GET, POST, PUT, DELETE, etc.).
 * @param {object} [body=null] - El cuerpo de la petición para POST/PUT.
 * @returns {Promise<object>} Una promesa con los datos de la respuesta JSON.
 * @throws {object} Lanza un objeto con status y data en caso de error.
 */
async function apiFetch(endpoint, method = 'GET', body = null) {
    const url = `${API_BASE}${endpoint}`;

    // Configurar headers
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    // Agregar header Authorization
    const token = getToken();
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    // Configurar la petición
    const options = {
        method: method,
        headers: headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);

        // Manejar errores de autorización
        if (response.status === 401 || response.status === 403) {
            removeToken();
            window.location.href = '/login.html';
            return; // No es necesario el return, pero evita que siga ejecutando codigo.
        }

        // Manejar respuestas no exitosas
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = {
                status: response.status,
                data: errorData
            };
            throw error;
        }

        // Si la respuesta está vacía (204 No Content), no se intenta parsear a JSON
        if (response.status === 204) {
            return {};
        }

        // Parsear y retornar el JSON
        return await response.json();

    } catch (networkError) {
        // Si el error ya fue procesado y lanzado manualmente, no lo tocamos
        if (networkError.status) {
            throw networkError;
        }

        // Error de red (fetch falló)
        console.error('Error de conexión:', networkError);
        throw {
            status: 0,
            data: { mensaje: 'Error de conexión'}
        };
    }
}

// ==========================================
// FUNCIONES DE AUTENTICACIÓN Y UTILIDADES
// ==========================================

/**
 * Obtiene los datos del usuario autenticado actualmente.
 * @returns {Promise<object>} Los datos del usuario.
 */
function getCurrentUser() {
    return apiFetch('/auth/me');
}

/**
 * Verifica si el usuario está autenticado y obtiene sus datos. 
 * Si no está autenticado o la obtención de datos falla, redirige a la página de inicio de sesión.
 * @returns {Promise<object|null>} Los datos del usuario o null si no está autenticado o falla.
 */
async function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return null;
    }

    try {
        const user = await getCurrentUser();
        return user;
    } catch (error) {
        console.error('Error al obtener usuario o sesión expirada:', error);
        window.location.href = '/login.html';
        return null;
    }
}

/**
 * Cierra la sesión del usuario, elimina el token y redirige a la página de inicio de sesión.
 */
function logout() {
    removeToken();
    window.location.href = '/login.html';
}
