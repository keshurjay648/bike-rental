// Authentication UI Management
class AuthUI {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
    }

    // Get current user from localStorage
    getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Check authentication status
    checkAuthStatus() {
        this.currentUser = this.getCurrentUser();
        this.updateUI();
    }

    // Update UI based on authentication status
    updateUI() {
        const signupBtn = document.getElementById('signup-btn');
        const mobileSignupBtn = document.getElementById('mobile-signup-btn');
        const userProfile = document.getElementById('user-profile');
        const mobileUserProfile = document.getElementById('mobile-user-profile');
        const userName = document.getElementById('user-name');
        const mobileUserName = document.getElementById('mobile-user-name');

        if (this.currentUser) {
            // User is logged in - hide signup buttons, show profiles
            if (signupBtn) signupBtn.classList.add('hidden');
            if (mobileSignupBtn) mobileSignupBtn.classList.add('hidden');
            if (userProfile) userProfile.classList.remove('hidden');
            if (mobileUserProfile) mobileUserProfile.classList.remove('hidden');
            
            // Update user names
            const displayName = this.currentUser.name || 'User';
            if (userName) userName.textContent = displayName;
            if (mobileUserName) mobileUserName.textContent = displayName;
        } else {
            // User is not logged in - show signup buttons, hide profiles
            if (signupBtn) signupBtn.classList.remove('hidden');
            if (mobileSignupBtn) mobileSignupBtn.classList.remove('hidden');
            if (userProfile) userProfile.classList.add('hidden');
            if (mobileUserProfile) mobileUserProfile.classList.add('hidden');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Profile dropdown toggle
        const profileBtn = document.getElementById('profile-btn');
        const profileMenu = document.getElementById('profile-menu');
        
        if (profileBtn && profileMenu) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileMenu.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
                    profileMenu.classList.remove('show');
                }
            });
        }

        // Logout functionality
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Mobile profile link
        const mobileProfileLink = document.querySelector('.mobile-profile-link');
        if (mobileProfileLink) {
            mobileProfileLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'profile.html';
            });
        }
    }

    // Logout user
    logout() {
        // Clear localStorage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        
        // Update UI
        this.currentUser = null;
        this.updateUI();
        
        // Redirect to home
        window.location.href = 'index.html';
    }

    // Update user data
    updateUser(userData) {
        localStorage.setItem('currentUser', JSON.stringify(userData));
        this.currentUser = userData;
        this.updateUI();
    }
}

// Initialize Auth UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authUI = new AuthUI();
});

// Export for use in other files
window.AuthUI = AuthUI;
