/**
 * NAVBAR SYSTEM - EXACT replica of contact.html navbar behavior
 * Handles authentication, menu toggles, scroll effects, and UI updates
 * 
 * This is the definitive navbar controller matching contact.html exactly
 */

// Utility function to get elements
const getEl = (id) => document.getElementById(id);

// Global logout function
window.performLogout = function() {
    console.log('🚪 Logout initiated');
    const keysToRemove = ['token', 'jwt_token', 'user_name', 'user_role', 'user', 'userName'];
    keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log(`✅ Removed: ${key}`);
        }
    });
    window.location.href = 'contact.html';
};

/**
 * Extract and verify JWT token payload
 * EXACT match with contact.html's getTokenPayload function
 */
function getTokenPayload() {
    const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        return JSON.parse(atob(parts[1]));
    } catch (e) { return null; }
}

/**
 * Update navigation - EXACT match with contact.html's updateNavigation function
 * Handles all auth state, visibility, and button text changes
 */
async function updateNavigation() {
    try {
        let payload = getTokenPayload();
        const authLink = getEl('auth-link'), adminLink = getEl('admin-link'), myListings = getEl('mylistings-link');
        const userGreeting = getEl('user-greeting'), authLinkMobile = getEl('auth-link-mobile');
        const adminLinkMobile = getEl('admin-link-mobile'), myListingsMobile = getEl('mylistings-link-mobile');

        if (!payload || (payload.exp && Date.now() >= payload.exp * 1000)) {
            // Clear all auth keys on token expiry
            ['token', 'jwt_token', 'user_name', 'user_role', 'user', 'userName'].forEach(key => {
                localStorage.removeItem(key);
            });
            if (userGreeting) userGreeting.style.display = 'none';
            payload = null;
        }

        // Check both role field and is_admin field
        const isUserAdmin = payload?.role === 'admin' || payload?.is_admin === true;
        if (adminLink) adminLink.style.display = isUserAdmin ? 'inline-block' : 'none';
        if (adminLinkMobile) adminLinkMobile.style.display = isUserAdmin ? 'block' : 'none';

        if (payload) {
            if (myListings) myListings.style.display = 'block';
            if (myListingsMobile) myListingsMobile.style.display = 'block';
            const displayName = payload.name || localStorage.getItem('userName') || payload.email || '';
            if (userGreeting) {
                // Show only first name to prevent overflow on mobile
                const firstName = displayName ? displayName.split(' ')[0] : 'User';
                userGreeting.textContent = `Hi, ${firstName}`;
                userGreeting.classList.add('show');
            }
            // Hide brand text on mobile when logged in
            const brandText = document.querySelector('.navbar-brand-text');
            if (brandText) {
                brandText.classList.add('hide-on-mobile-logged-in');
            }
            if (authLink) {
                authLink.textContent = 'Logout';
                authLink.classList.remove('nav-login-btn');
                authLink.classList.add('nav-logout-btn');
                authLink.href = '#';
                authLink.onclick = (e) => {
                    e.preventDefault();
                    window.performLogout();
                };
            }
            if (authLinkMobile) {
                authLinkMobile.textContent = 'Logout';
                authLinkMobile.classList.remove('nav-login-btn');
                authLinkMobile.classList.add('nav-logout-btn');
                authLinkMobile.href = '#';
                authLinkMobile.onclick = (e) => {
                    e.preventDefault();
                    window.performLogout();
                };
            }
        } else {
            if (myListings) myListings.style.display = 'none';
            if (myListingsMobile) myListingsMobile.style.display = 'none';
            if (userGreeting) userGreeting.classList.remove('show');
            // Show brand text on mobile when not logged in
            const brandText = document.querySelector('.navbar-brand-text');
            if (brandText) {
                brandText.classList.remove('hide-on-mobile-logged-in');
            }
            if (authLink) { authLink.textContent = 'Login'; authLink.classList.add('nav-login-btn'); authLink.classList.remove('nav-logout-btn'); authLink.href = 'login.html'; authLink.onclick = null; }
            if (authLinkMobile) { authLinkMobile.textContent = 'Login'; authLinkMobile.classList.add('nav-login-btn'); authLinkMobile.classList.remove('nav-logout-btn'); authLinkMobile.href = 'login.html'; authLinkMobile.onclick = null; }
        }
    } catch (err) { console.error('Navigation update error:', err); }
}

/**
 * Setup navbar scroll effect - EXACT match with contact.html
 * Adds blur effect on scroll
 */
function setupNavbarScroll() {
    const navbar = getEl('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 0) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });
}

/**
 * Setup hamburger menu - EXACT match with contact.html
 * Handles menu toggle and link clicks
 */
function setupHamburgerMenu() {
    const hamburger = getEl('hamburger-btn'), mobileMenu = getEl('mobile-menu');
    if (!hamburger || !mobileMenu) {
        console.warn('⚠️ Hamburger or mobile menu not found');
        return;
    }
    
    // Click handler for hamburger button
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🍔 Hamburger clicked, toggling menu');
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });
    
    // Close menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            console.log('📎 Menu link clicked, closing menu');
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });
    
    // Close menu when clicking outside (on mobile)
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
        }
    });
    
    console.log('✅ Hamburger menu setup complete');
}



/**
 * Initialize on DOM load - EXACT match with contact.html
 */
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    setupNavbarScroll();
    setupHamburgerMenu();
});


