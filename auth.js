// Arquivo compartilhado de autenticação
const AUTH_STORAGE_KEY = 'fluxaAuth';

function getAuthState() {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    return storedAuth ? JSON.parse(storedAuth) : { isAuthenticated: false, user: null };
}

function isAuthenticated() {
    const auth = getAuthState();
    return auth.isAuthenticated && auth.token;
}

function getToken() {
    const auth = getAuthState();
    return auth.token;
}

function getCurrentUser() {
    const auth = getAuthState();
    return auth.user;
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

function requireAdmin() {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        alert('Acesso negado. Apenas administradores.');
        return false;
    }
    return true;
}

function apiRequest(url, options = {}) {
    const token = getToken();
    if (!token) {
        throw new Error('Não autenticado');
    }

    return fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
}

function clearAuthState() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}

function logout() {
    clearAuthState();
    window.location.href = '/login';
}
