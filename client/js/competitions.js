// Competitions functions
class Competitions {
    static async getAll() {
        try {
            const response = await fetch(`${API_BASE}/competitions`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get competitions error:', error);
            return { success: false, message: 'Failed to load competitions' };
        }
    }

    static async create(competitionData) {
        const token = Auth.getToken();
        if (!token) {
            return { success: false, message: 'Not authenticated' };
        }

        try {
            const response = await fetch(`${API_BASE}/competitions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(competitionData)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Create competition error:', error);
            return { success: false, message: 'Network error' };
        }
    }
}

// Competition UI functions
function loadCompetitions() {
    const container = document.getElementById('competitions-list');
    
    // Show loading state
    container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem;">
            <div class="spinner" style="margin: 0 auto;"></div>
            <p style="margin-top: 1rem; color: var(--gray);">Loading competitions...</p>
        </div>
    `;

    Competitions.getAll().then(result => {
        if (!result.success || !result.data) {
            container.innerHTML = `
                <div class="card" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                    <h3>Failed to Load Competitions</h3>
                    <p>Please try refreshing the page</p>
                    <button class="btn btn-primary" onclick="loadCompetitions()" style="margin-top: 1rem;">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
            return;
        }

        if (result.data.length === 0) {
            container.innerHTML = `
                <div class="card" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-trophy" style="font-size: 4rem; color: var(--gray); margin-bottom: 1rem;"></i>
                    <h3>No Competitions Yet</h3>
                    <p style="color: var(--gray); margin-bottom: 2rem;">Be the first to create an amazing competition!</p>
                    <button class="btn btn-primary" onclick="showCreateCompetitionForm()">
                        <i class="fas fa-plus"></i> Create First Competition
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = result.data.map(competition => `
            <div class="card competition-card">
                <div class="competition-badge badge-${competition.status || 'active'}">
                    ${(competition.status || 'active').toUpperCase()}
                </div>
                <h3>${competition.title}</h3>
                <p style="color: var(--gray); line-height: 1.5; margin-bottom: 1.5rem;">${competition.description}</p>
                <div class="competition-meta">
                    <div class="meta-item">
                        <span class="meta-label">Category</span>
                        <span class="meta-value" style="text-transform: capitalize; color: var(--primary);">
                            <i class="fas fa-tag"></i> ${competition.category}
                        </span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Status</span>
                        <span class="meta-value" style="text-transform: capitalize;">
                            <i class="fas fa-circle" style="color: ${
                                competition.status === 'active' ? 'var(--success)' : 
                                competition.status === 'upcoming' ? 'var(--warning)' : 
                                competition.status === 'completed' ? 'var(--gray)' : 'var(--success)'
                            }"></i> ${competition.status || 'active'}
                        </span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Ends</span>
                        <span class="meta-value">
                            <i class="fas fa-calendar"></i> ${new Date(competition.endDate).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    });
}

// FIXED: This function now properly shows the create competition form
function showCreateCompetitionForm() {
    console.log('🎯 Create Competition button clicked!');
    
    if (!Auth.isAuthenticated()) {
        showMessage('Please login to create competitions', 'error');
        showSection('login');
        return;
    }
    
    console.log('✅ User is authenticated, showing create competition form');
    
    // Show the create competition section
    showSection('create-competition-section');
    
    // Set default dates
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    document.getElementById('competition-title').value = '';
    document.getElementById('competition-description').value = '';
    document.getElementById('competition-category').value = '';
    document.getElementById('competition-start-date').value = today.toISOString().split('T')[0];
    document.getElementById('competition-end-date').value = nextWeek.toISOString().split('T')[0];
    
    // Focus on title field
    setTimeout(() => {
        document.getElementById('competition-title').focus();
    }, 100);
}

// Handle competition form submission
async function handleCreateCompetition(e) {
    e.preventDefault();
    console.log('🎯 Competition form submitted!');
    
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

    console.log('📝 Creating competition:', competitionData);

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
        showMessage('🎉 Competition created successfully!', 'success');
        document.getElementById('create-competition-form').reset();
        showSection('competitions');
        loadCompetitions(); // Refresh the competitions list
    } else {
        showMessage(result.message || 'Failed to create competition', 'error');
    }
}