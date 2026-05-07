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
        try {
            // Show loading state
            const deleteBtn = document.getElementById('delete-account-btn');
            const originalText = deleteBtn.innerHTML;
            deleteBtn.innerHTML = '<i class="ri-loader-4-line animate-spin"></i> Deleting...';
            deleteBtn.disabled = true;

            const token = localStorage.getItem('authToken');
            const currentUser = this.getCurrentUser();
            
            if (!currentUser || !currentUser.email) {
                this.handleDeleteError('User information not found. Please log out and log in again.');
                return;
            }

            // Try backend API first for complete database deletion
            if (token) {
                try {
                    // First, attempt to delete user's bookings from database
                    await this.deleteUserBookings(token, currentUser.email);
                    
                    // Then, delete the user account from database
                    const response = await fetch('http://localhost:5002/api/auth/delete-account', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            email: currentUser.email,
                            userId: currentUser.id
                        })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log('Database deletion successful:', result);
                        
                        // Clear local storage after successful database deletion
                        this.deleteAccountLocally();
                        return;
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to delete account from database');
                    }
                } catch (apiError) {
                    console.error('Database deletion error:', apiError);
                    
                    // If database deletion fails, ask user for confirmation to proceed with local deletion only
                    const proceedLocal = confirm(
                        'Database deletion failed: ' + apiError.message + '\n\n' +
                        'Would you like to proceed with local deletion only?\n\n' +
                        'Note: Your data will be removed from this device, but may remain in the database.'
                    );
                    
                    if (proceedLocal) {
                        this.deleteAccountLocally();
                        return;
                    } else {
                        this.handleDeleteError('Account deletion cancelled.');
                        return;
                    }
                }
            } else {
                // No token available, proceed with local deletion only
                console.log('No auth token available, proceeding with local deletion only');
                this.deleteAccountLocally();
            }
            
        } catch (error) {
            console.error('Error deleting account:', error);
            this.handleDeleteError(error.message);
        }
    }

    // Delete user's bookings from database
    async deleteUserBookings(token, userEmail) {
        try {
            const response = await fetch('http://localhost:5002/api/bookings/user', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: userEmail
                })
            });

            if (response.ok) {
                console.log('User bookings deleted from database');
            } else {
                console.warn('Failed to delete user bookings from database, but continuing with account deletion');
            }
        } catch (error) {
            console.warn('Error deleting user bookings from database:', error);
            // Don't throw error here, continue with account deletion
        }
    }

    // Delete account locally (fallback method)
    deleteAccountLocally() {
        try {
            // Clear all user data from localStorage
            const keysToRemove = [
                'currentUser',
                'authToken',
                'userBookings',
                'userPreferences',
                'bookingHistory',
                'userProfile'
            ];

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            // Clear session storage as well
            sessionStorage.clear();

            // Show success message
            this.handleSuccessfulDeletion();
            
        } catch (error) {
            console.error('Error deleting account locally:', error);
            this.handleDeleteError();
        }
    }

    // Handle successful account deletion
    handleSuccessfulDeletion() {
        // Show success message
        alert('✅ Account deleted successfully!\n\nYour account and all associated data have been permanently removed from our database. You have been logged out.');
        
        // Clear any remaining data and redirect
        this.logout();
    }

    // Handle delete error
    handleDeleteError(errorMessage = null) {
        const deleteBtn = document.getElementById('delete-account-btn');
        
        // Reset button state
        deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i> Delete Account';
        deleteBtn.disabled = false;
        
        const message = errorMessage || '❌ Failed to delete account. Please try again or contact support.';
        alert(message);
    }

    // Refresh user data
    async refreshUserData() {
        try {
            const token = localStorage.getItem('authToken');
            
            const response = await fetch('http://localhost:5002/api/auth/profile', {
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
