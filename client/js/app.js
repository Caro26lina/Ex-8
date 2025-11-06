// Main App functionality
class App {
    static init() {
        this.setupEventListeners();
        this.updateUI();
        loadCompetitions();
    }

    static setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', this.handleLogin);
        
        // Register form
        document.getElementById('register-form').addEventListener('submit', this.handleRegister);
        
        // Create competition form - FIXED: Use the standalone function
        document.getElementById('create-competition-form').addEventListener('submit', handleCreateCompetition);
    }

    static async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const result = await Auth.login({ email, password });

        if (result.success) {
            localStorage.setItem('token', result.token);
            this.updateUI();
            showSection('competitions');
            showMessage('Login successful!', 'success');
            document.getElementById('login-form').reset();
        } else {
            showMessage(result.message || 'Login failed', 'error');
        }
    }

    static async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        const result = await Auth.register({ username, email, password });

        if (result.success) {
            localStorage.setItem('token', result.token);
            this.updateUI();
            showSection('competitions');
            showMessage('Registration successful!', 'success');
            document.getElementById('register-form').reset();
        } else {
            const errorMsg = result.errors ? result.errors[0].msg : result.message;
            showMessage(errorMsg || 'Registration failed', 'error');
        }
    }

    static async updateUI() {
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const createCompetitionBtn = document.getElementById('create-competition-btn');

        if (Auth.isAuthenticated()) {
            const user = await Auth.getCurrentUser();
            authButtons.classList.add('hidden');
            userMenu.classList.remove('hidden');
            createCompetitionBtn.classList.remove('hidden');
            
            if (user) {
                document.getElementById('user-greeting').textContent = `Hello, ${user.username}`;
            }
        } else {
            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');
            createCompetitionBtn.classList.add('hidden');
        }
    }
}

// Competition Creation Function - STANDALONE (not in App class)
async function handleCreateCompetition(e) {
    e.preventDefault();
    
    if (!Auth.isAuthenticated()) {
        showMessage('Please login to create competitions', 'error');
        showSection('login');
        return;
    }
    
    const competitionData = {
        title: document.getElementById('competition-title').value,
        description: document.getElementById('competition-description').value,
        category: document.getElementById('competition-category').value,
        startDate: document.getElementById('competition-start-date').value,
        endDate: document.getElementById('competition-end-date').value
    };

    // Validate required fields
    if (!competitionData.title || !competitionData.description || !competitionData.category) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }

    console.log('Creating competition:', competitionData);

    // Show loading state
    const submitBtn = document.querySelector('#create-competition-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    submitBtn.disabled = true;

    const result = await Competitions.create(competitionData);

    // Restore button state
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;

    if (result.success) {
        showMessage('Competition created successfully!', 'success');
        document.getElementById('create-competition-form').reset();
        showSection('competitions');
        loadCompetitions(); // Refresh the competitions list
    } else {
        showMessage(result.message || 'Failed to create competition', 'error');
    }
}

// Show Create Competition Form
function showCreateCompetitionForm() {
    if (!Auth.isAuthenticated()) {
        showMessage('Please login to create competitions', 'error');
        showSection('login');
        return;
    }
    
    // Show the create competition section
    showSection('create-competition-section');
    
    // Set default dates
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    document.getElementById('competition-start-date').value = today.toISOString().split('T')[0];
    document.getElementById('competition-end-date').value = nextWeek.toISOString().split('T')[0];
    
    // Focus on title field
    document.getElementById('competition-title').focus();
}

// Utility functions
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show target section
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    // Update active nav link if it exists
    const navLink = document.querySelector(`.nav-link[onclick="showSection('${sectionName}')"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
}

function showMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
        ${message}
    `;
    
    container.appendChild(messageEl);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 5000);
}

function logout() {
    Auth.logout();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    
    // Add input names to form fields for better FormData collection
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.querySelector('input[type="text"]').name = 'username';
        registerForm.querySelector('input[type="email"]').name = 'email';
        registerForm.querySelector('input[type="password"]').name = 'password';
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.querySelector('input[type="email"]').name = 'email';
        loginForm.querySelector('input[type="password"]').name = 'password';
    }
    
    // Test backend connection on startup
    testBackend();
});

// Test backend connection
async function testBackend() {
    try {
        const response = await fetch('http://localhost:5000/');
        const data = await response.json();
        console.log('✅ Backend connected:', data);
    } catch (error) {
        console.error('❌ Backend connection failed:', error);
        showMessage('❌ Backend connection failed. Make sure server is running on port 5000', 'error');
    }
}