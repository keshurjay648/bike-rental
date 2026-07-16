// Authentication UI Enhancements
class AuthEnhancements {
    constructor() {
        this.init();
    }

    init() {
        this.setupPasswordToggle();
        this.setupSocialAuth();
        this.setupFormAnimations();
    }

    // Password visibility toggle
    setupPasswordToggle() {
        const passwordToggle = document.getElementById('passwordToggle');
        const passwordInput = document.getElementById('loginPassword');

        if (passwordToggle && passwordInput) {
            passwordToggle.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                // Update icon
                const icon = passwordToggle.querySelector('i');
                if (type === 'text') {
                    icon.classList.remove('ri-eye-line');
                    icon.classList.add('ri-eye-off-line');
                } else {
                    icon.classList.remove('ri-eye-off-line');
                    icon.classList.add('ri-eye-line');
                }
            });
        }
    }

    // Social authentication handlers
    setupSocialAuth() {
        const googleBtn = document.querySelector('.social-btn.google');
        const phoneBtn = document.querySelector('.social-btn.phone');

        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                this.showMessage('Google authentication coming soon!', false);
                // Add Google OAuth implementation here
            });
        }

        if (phoneBtn) {
            phoneBtn.addEventListener('click', () => {
                window.location.href = 'verify-otp.html';
            });
        }
    }

    // Form animations and interactions
    setupFormAnimations() {
        const form = document.getElementById('loginForm');
        if (!form) return; // not on login page

        const inputs = form.querySelectorAll('input');

        // Add focus animations
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });

            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.parentElement.classList.remove('focused');
                }
            });

            // Add input animation
            input.addEventListener('input', () => {
                if (input.value) {
                    input.parentElement.classList.add('has-value');
                } else {
                    input.parentElement.classList.remove('has-value');
                }
            });
        });

        // Add button loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            form.addEventListener('submit', () => {
                this.setButtonLoading(submitBtn, true);
            });
        }
    }

    // Set button loading state
    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.innerHTML = `
                <span>Logging in...</span>
                <i class="ri-loader-4-line animate-spin"></i>
            `;
        } else {
            button.disabled = false;
            button.innerHTML = `
                <span>Log In</span>
                <i class="ri-arrow-right-line"></i>
            `;
        }
    }

    // Show message helper
    showMessage(message, isError = false) {
        const messageEl = document.getElementById('loginMessage');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.style.color = isError ? '#ff4757' : '#4caf50';
            
            // Auto hide after 3 seconds
            setTimeout(() => {
                messageEl.textContent = '';
            }, 3000);
        }
    }

    // Add input validation feedback
    setupInputValidation() {
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');

        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                const email = emailInput.value.trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                
                if (email && !emailRegex.test(email)) {
                    this.showInputError(emailInput, 'Please enter a valid email address');
                } else {
                    this.clearInputError(emailInput);
                }
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('blur', () => {
                const password = passwordInput.value;
                
                if (password && password.length < 6) {
                    this.showInputError(passwordInput, 'Password must be at least 6 characters');
                } else {
                    this.clearInputError(passwordInput);
                }
            });
        }
    }

    // Show input error
    showInputError(input, message) {
        input.parentElement.classList.add('error');
        
        // Remove existing error message
        const existingError = input.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        input.parentElement.appendChild(errorEl);
    }

    // Clear input error
    clearInputError(input) {
        input.parentElement.classList.remove('error');
        const errorEl = input.parentElement.querySelector('.error-message');
        if (errorEl) {
            errorEl.remove();
        }
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    .animate-spin {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .form-group.focused label {
        color: #667eea;
        transform: translateY(-2px);
    }

    .form-group.has-value input {
        background: #fff;
    }

    .form-group.error input {
        border-color: #ff4757;
        background: #fff5f5;
    }

    .error-message {
        color: #ff4757;
        font-size: 0.8rem;
        margin-top: 0.25rem;
        animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .auth-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none !important;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authEnhancements = new AuthEnhancements();
});

// Export for use in other files
window.AuthEnhancements = AuthEnhancements;
