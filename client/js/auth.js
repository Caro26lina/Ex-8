const API_BASE = 'http://localhost:5000/api';

// Auth functions
class Auth {
    static async register(userData) {
        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Network error' };
        }
    }

    static async login(credentials) {
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error' };
        }
    }

    static async getCurrentUser() {
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            return data.success ? data.user : null;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    }

    static logout() {
        localStorage.removeItem('token');
        App.updateUI();
        showSection('home');
        showMessage('Logged out successfully', 'success');
    }

    static isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    static getToken() {
        return localStorage.getItem('token');
    }
}