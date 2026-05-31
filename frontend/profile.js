// Profile Page Management
class ProfileManager {
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
        
        if (!this.currentUser) {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
            return;
        }

        this.updateProfileUI();
    }

    // Update profile UI with user data
    updateProfileUI() {
        // Update profile name
        const profileName = document.getElementById('profile-name');
        const userName = document.getElementById('user-name');
        const userFullName = document.getElementById('user-full-name');
        const userEmail = document.getElementById('user-email');
        const userPhone = document.getElementById('user-phone');
        const memberSince = document.getElementById('member-since');

        if (profileName) profileName.textContent = this.currentUser.name || 'User';
        if (userName) userName.textContent = this.currentUser.name || 'User';
        if (userFullName) userFullName.textContent = this.currentUser.name || 'Not provided';
        if (userEmail) userEmail.textContent = this.currentUser.email || 'Not provided';
        if (userPhone) userPhone.textContent = this.currentUser.phone || 'Not provided';

        // Update member since date
        if (memberSince) {
            const createdAt = this.currentUser.created_at;
            if (createdAt) {
                const date = new Date(createdAt);
                memberSince.textContent = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } else {
                memberSince.textContent = 'Unknown';
            }
        }

        // Update phone verification status
        this.updatePhoneVerificationStatus();
    }

    // Update phone verification status
    updatePhoneVerificationStatus() {
        const phoneVerifiedBadge = document.getElementById('phone-verified-badge');
        const phoneUnverifiedBadge = document.getElementById('phone-unverified-badge');
        const verifyPhoneBtn = document.getElementById('verify-phone-btn');

        if (this.currentUser.phoneVerified) {
            if (phoneVerifiedBadge) phoneVerifiedBadge.style.display = 'inline-block';
            if (phoneUnverifiedBadge) phoneUnverifiedBadge.style.display = 'none';
            if (verifyPhoneBtn) verifyPhoneBtn.style.display = 'none';
        } else {
            if (phoneVerifiedBadge) phoneVerifiedBadge.style.display = 'none';
            if (phoneUnverifiedBadge) phoneUnverifiedBadge.style.display = 'inline-block';
            if (verifyPhoneBtn) verifyPhoneBtn.style.display = 'block';
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

        // Verify phone button
        const verifyPhoneBtn = document.getElementById('verify-phone-btn');
        if (verifyPhoneBtn) {
            verifyPhoneBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'verify-otp.html';
            });
        }

        // Delete account button
        const deleteAccountBtn = document.getElementById('delete-account-btn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.confirmDeleteAccount();
            });
        }
    }

    // Logout user
    logout() {
        // Clear localStorage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        
        // Redirect to home
        window.location.href = 'index.html';
    }

    // Confirm account deletion
    confirmDeleteAccount() {
        // Create custom confirmation dialog
        const confirmation = confirm(
            '⚠️ WARNING: This action cannot be undone!\n\n' +
            'Are you sure you want to permanently delete your account?\n\n' +
            'This will:\n' +
            '• Remove all your personal information\n' +
            '• Delete your booking history\n' +
            '• Cancel any active reservations\n' +
            '• Log you out immediately\n\n' +
            'Type "DELETE" to confirm:'
        );
        
        if (confirmation) {
            // Double confirmation with text input
            const deleteConfirmation = prompt('Type "DELETE" to confirm account deletion:');
            
            if (deleteConfirmation === 'DELETE') {
                this.deleteAccount();
            } else if (deleteConfirmation !== null) {
                alert('Account deletion cancelled. You must type "DELETE" exactly as shown.');
            }
        }
    }

    // Delete account
    async deleteAccount() {
        const deleteBtn = document.getElementById('delete-account-btn');
        const originalHTML = deleteBtn.innerHTML;

        // Show loading state
        deleteBtn.innerHTML = '<i class="ri-loader-4-line"></i> Deleting...';
        deleteBtn.disabled = true;

        try {
            const token = localStorage.getItem('authToken');

            if (!token) {
                throw new Error('No auth token found. Please log in again.');
            }

            const response = await fetch('http://localhost:5003/api/auth/delete-account', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete account.');
            }

            // Wipe local storage and redirect
            ['currentUser', 'authToken', 'userBookings', 'userPreferences',
             'bookingHistory', 'userProfile'].forEach(k => localStorage.removeItem(k));
            sessionStorage.clear();

            if (window.showToast) showToast('Account deleted successfully. Goodbye!', 'success');
            else alert('✅ Account deleted successfully. You have been logged out.');
            setTimeout(() => { window.location.href = 'index.html'; }, 1800);

        } catch (error) {
            console.error('Delete account error:', error);
            deleteBtn.innerHTML = originalHTML;
            deleteBtn.disabled = false;
            if (window.showToast) showToast(error.message || 'Failed to delete account. Please try again.', 'error');
            else alert('❌ ' + (error.message || 'Failed to delete account. Please try again.'));
        }
    }

    // Refresh user data
    async refreshUserData() {
        try {
            const token = localStorage.getItem('authToken');
            
            const response = await fetch('http://localhost:5003/api/auth/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.user) {
                    localStorage.setItem('currentUser', JSON.stringify(data.data.user));
                    this.currentUser = data.data.user;
                    this.updateProfileUI();
                }
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    }
}

// Initialize Profile Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});

// Export for use in other files
window.ProfileManager = ProfileManager;
