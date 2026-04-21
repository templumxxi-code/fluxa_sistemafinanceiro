function login(email, password) {
    return fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Credenciais inválidas');
        }
        return response.json();
    })
    .then(data => {
        // Salvar token e dados do usuário
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
            token: data.token,
            user: data.user,
            isAuthenticated: true
        }));
        return data;
    });
}

function redirectToDashboard() {
    window.location.href = '/';
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(message) {
    const errorElement = document.getElementById('loginError');
    if (!errorElement) return;
    errorElement.textContent = message;
    errorElement.classList.toggle('visible', !!message);
}

document.addEventListener('DOMContentLoaded', () => {
    if (isAuthenticated()) {
        redirectToDashboard();
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        showError('');

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!validateEmail(email)) {
            showError('Por favor, informe um e-mail válido.');
            emailInput.focus();
            return;
        }

        if (password.length < 8) {
            showError('A senha deve ter no mínimo 8 caracteres.');
            passwordInput.focus();
            return;
        }

        login(email, password).then(() => {
            redirectToDashboard();
        }).catch(error => {
            console.error('Erro no login:', error);
            showError('E-mail ou senha incorretos.');
        });
    });

    document.getElementById('forgotPasswordLink').addEventListener('click', (event) => {
        event.preventDefault();
        showError('Recuperação de senha é feita pelo Administrador central.');
    });

    document.getElementById('createAccountLink').addEventListener('click', (event) => {
        event.preventDefault();
        showError('O cadastro de novos acessos é realizado apenas pelo Administrador central.');
    });
});
