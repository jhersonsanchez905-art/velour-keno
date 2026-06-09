// ===== CONFIGURACIÓN =====
const API_BASE = '/api';

// ===== TOGGLE CONTRASEÑA =====
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// ===== FUERZA DE CONTRASEÑA =====
function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const fill = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    if (!fill || !label) return;

    const niveles = [
        { width: '0%',   color: '',          text: '' },
        { width: '25%',  color: '#E53E3E',   text: 'Muy débil' },
        { width: '50%',  color: '#DD6B20',   text: 'Débil' },
        { width: '75%',  color: '#C9A84C',   text: 'Aceptable' },
        { width: '90%',  color: '#38A169',   text: 'Fuerte' },
        { width: '100%', color: '#38A169',   text: 'Muy fuerte' },
    ];

    const nivel = niveles[Math.min(score, 5)];
    fill.style.width = nivel.width;
    fill.style.background = nivel.color;
    label.textContent = nivel.text;
}

// ===== MOSTRAR ERROR EN CAMPO =====
function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + 'Error');
    if (input) input.classList.add('error');
    if (error) error.textContent = message;
}

// ===== LIMPIAR ERRORES =====
function clearErrors() {
    document.querySelectorAll('.field-error')
        .forEach(el => el.textContent = '');
    document.querySelectorAll('input')
        .forEach(el => el.classList.remove('error', 'success'));
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) errorMsg.style.display = 'none';
}

// ===== MOSTRAR ERROR GLOBAL =====
function showGlobalError(message) {
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }
}

// ===== ESTADO DEL BOTÓN =====
function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    btn.disabled = loading;
    if (text) text.style.display = loading ? 'none' : 'inline';
    if (loader) loader.style.display = loading ? 'inline' : 'none';
}

// ===== GUARDAR TOKEN =====
function saveToken(token) {
    localStorage.setItem('velour_token', token);
}

// ===== OBTENER TOKEN =====
function getToken() {
    return localStorage.getItem('velour_token');
}

// ===== FORMULARIO LOGIN =====
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const usernameOrEmail = document.getElementById('usernameOrEmail').value.trim();
        const password = document.getElementById('password').value;

        // Validación básica frontend
        let valid = true;
        if (!usernameOrEmail) {
            showFieldError('usernameOrEmail', 'Este campo es obligatorio');
            valid = false;
        }
        if (!password) {
            showFieldError('password', 'Este campo es obligatorio');
            valid = false;
        }
        if (!valid) return;

        setLoading('loginBtn', true);

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernameOrEmail, password })
            });

            const data = await response.json();

            if (!response.ok) {
                showGlobalError(data.mensaje || 'Credenciales incorrectas');
                return;
            }

            // Guardar token y redirigir al juego
            saveToken(data.token);
            window.location.href = '/game.html';

        } catch (error) {
            showGlobalError('Error de conexión. Intenta de nuevo.');
        } finally {
            setLoading('loginBtn', false);
        }
    });
}

// ===== FORMULARIO REGISTRO =====
const registerForm = document.getElementById('registerForm');
if (registerForm) {

    // Validación en tiempo real de contraseña
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            checkPasswordStrength(passwordInput.value);
        });
    }

    // Validación en tiempo real de confirmar contraseña
    const confirmInput = document.getElementById('confirmPassword');
    if (confirmInput) {
        confirmInput.addEventListener('input', () => {
            const password = document.getElementById('password').value;
            if (confirmInput.value && confirmInput.value !== password) {
                showFieldError('confirmPassword', 'Las contraseñas no coinciden');
            } else {
                const error = document.getElementById('confirmPasswordError');
                if (error) error.textContent = '';
                confirmInput.classList.remove('error');
            }
        });
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validaciones frontend
        let valid = true;

        if (!username) {
            showFieldError('username', 'El username es obligatorio');
            valid = false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showFieldError('username', 'Solo letras, números y guión bajo');
            valid = false;
        }

        if (!email) {
            showFieldError('email', 'El email es obligatorio');
            valid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showFieldError('email', 'Email no válido');
            valid = false;
        }

        if (!password) {
            showFieldError('password', 'La contraseña es obligatoria');
            valid = false;
        } else if (password.length < 8) {
            showFieldError('password', 'Mínimo 8 caracteres');
            valid = false;
        } else if (!/(?=.*[A-Z])(?=.*\d)/.test(password)) {
            showFieldError('password', 'Debe tener al menos una mayúscula y un número');
            valid = false;
        }

        if (password !== confirmPassword) {
            showFieldError('confirmPassword', 'Las contraseñas no coinciden');
            valid = false;
        }

        if (!valid) return;

        setLoading('registerBtn', true);

        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, confirmPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                // Mostrar errores de validación del backend
                if (data.errores) {
                    Object.keys(data.errores).forEach(campo => {
                        showFieldError(campo, data.errores[campo]);
                    });
                } else {
                    showGlobalError(data.mensaje || 'Error al crear la cuenta');
                }
                return;
            }

            // Registro exitoso
            const successMsg = document.getElementById('successMsg');
            if (successMsg) {
                successMsg.textContent = '¡Cuenta creada! Redirigiendo...';
                successMsg.style.display = 'block';
            }

            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);

        } catch (error) {
            showGlobalError('Error de conexión. Intenta de nuevo.');
        } finally {
            setLoading('registerBtn', false);
        }
    });
}