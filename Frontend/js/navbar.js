/**
 * NAVBAR SYSTEM - EXACT replica of contact.html navbar behavior
 * Handles authentication, menu toggles, scroll effects, and UI updates
 * 
 * This is the definitive navbar controller matching contact.html exactly
 */

// Utility function to get elements - only define once
if (!window.getEl) {
    window.getEl = (id) => document.getElementById(id);
}

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
    console.log('🚪 All auth data cleared');
    console.log('⏭️  Redirecting to index.html...');
    
    // Force hard reload to clear caches and get fresh index.html
    window.location.href = 'index.html?logout=' + Date.now();
    setTimeout(() => {
        // Fallback: hard refresh after 500ms
        window.location.reload(true);
    }, 500);
};

/**
 * Extract and verify JWT token payload
 * EXACT match with contact.html's getTokenPayload function
 */
function getTokenPayload() {
    const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
    
    if (!token) {
        console.log('⚠️  No token found in localStorage');
        return null;
    }
    
    console.log('🔐 Token found, attempting to decode...');
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('❌ Invalid token format (not 3 parts)');
            return null;
        }
        const payload = JSON.parse(atob(parts[1]));
        console.log('✅ Token decoded successfully:', {
            name: payload.name || 'N/A',
            email: payload.email || 'N/A',
            role: payload.role || 'N/A',
            exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'N/A'
        });
        return payload;
    } catch (e) { 
        console.error('❌ Failed to decode token:', e.message);
        return null; 
    }
}

/**
 * Update navigation - EXACT match with contact.html's updateNavigation function
 * Handles all auth state, visibility, and button text changes
 */
async function updateNavigation() {
    try {
        console.log('🔄 updateNavigation() started');
        
        let payload = getTokenPayload();
        console.log('📦 Token payload:', payload ? {name: payload.name, role: payload.role, exp: payload.exp} : 'null');
        
        const authLink = window.getEl('auth-link'), adminLink = window.getEl('admin-link'), myListings = window.getEl('mylistings-link');
        const userGreeting = window.getEl('user-greeting'), authLinkMobile = window.getEl('auth-link-mobile');
        const adminLinkMobile = window.getEl('admin-link-mobile'), myListingsMobile = window.getEl('mylistings-link-mobile');

        console.log('🔍 DOM Elements found:', {
            authLink: !!authLink,
            adminLink: !!adminLink,
            authLinkMobile: !!authLinkMobile,
            adminLinkMobile: !!adminLinkMobile
        });

        if (!payload || (payload.exp && Date.now() >= payload.exp * 1000)) {
            console.log('⚠️  Token invalid or expired - clearing auth');
            // Clear all auth keys on token expiry
            ['token', 'jwt_token', 'user_name', 'user_role', 'user', 'userName'].forEach(key => {
                localStorage.removeItem(key);
            });
            if (userGreeting) userGreeting.style.display = 'none';
            payload = null;
        }

        // Check both role field and is_admin field - ONLY show admin link if BOTH logged in AND admin
        const isUserAdmin = payload && (payload.role === 'admin' || payload.is_admin === true);
        console.log('👑 Admin status:', { isUserAdmin, role: payload?.role, is_admin: payload?.is_admin });
        
        if (adminLink) {
            const shouldShow = isUserAdmin ? 'inline-block' : 'none';
            adminLink.style.display = shouldShow;
            console.log(`✅ Desktop admin link: ${shouldShow}`);
        }
        
        if (adminLinkMobile) {
            if (isUserAdmin) {
                adminLinkMobile.classList.add('admin-visible');
                adminLinkMobile.style.display = 'block';
                console.log(`✅ Mobile admin link: SHOW (added admin-visible class)`);
            } else {
                adminLinkMobile.classList.remove('admin-visible');
                adminLinkMobile.style.display = 'none';
                console.log(`✅ Mobile admin link: HIDE (removed admin-visible class)`);
            }
        }

        if (payload) {
            console.log('✅ User is logged in');
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
                console.log('✅ Desktop auth link: Logout');
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
                console.log('✅ Mobile auth link: Logout');
            }
        } else {
            console.log('❌ User is NOT logged in');
            if (myListings) myListings.style.display = 'none';
            if (myListingsMobile) myListingsMobile.style.display = 'none';
            if (userGreeting) userGreeting.classList.remove('show');
            // Show brand text on mobile when not logged in
            const brandText = document.querySelector('.navbar-brand-text');
            if (brandText) {
                brandText.classList.remove('hide-on-mobile-logged-in');
            }
            if (authLink) { 
                authLink.textContent = 'Login'; 
                authLink.classList.add('nav-login-btn'); 
                authLink.classList.remove('nav-logout-btn'); 
                authLink.href = 'login.html'; 
                authLink.onclick = null;
                console.log('✅ Desktop auth link: Login');
            }
            if (authLinkMobile) { 
                authLinkMobile.textContent = 'Login'; 
                authLinkMobile.classList.add('nav-login-btn'); 
                authLinkMobile.classList.remove('nav-logout-btn'); 
                authLinkMobile.href = 'login.html'; 
                authLinkMobile.onclick = null;
                // CRITICAL: Ensure mobile login button displays in nav
                authLinkMobile.style.display = 'block';
                console.log('✅ Mobile auth link: Login (display: block)');
            }
        }
        console.log('✅ updateNavigation() completed successfully');
    } catch (err) { 
        console.error('❌ Navigation update error:', err);
        console.error('Stack:', err.stack);
    }
}

/**
 * Setup navbar scroll effect - EXACT match with contact.html
 * Adds blur effect on scroll
 */
function setupNavbarScroll() {
    const navbar = window.getEl('navbar');
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
    const hamburger = window.getEl('hamburger-btn'), mobileMenu = window.getEl('mobile-menu');
    if (!hamburger || !mobileMenu) {
        console.warn('⚠️  Hamburger or mobile menu not found');
        console.log('Debug:', {hamburger: !!hamburger, mobileMenu: !!mobileMenu});
        return;
    }
    
    console.log('🍔 Hamburger menu setup starting...');
    
    // Click handler for hamburger button - CRITICAL: Ensure it runs
    hamburger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🍔 Hamburger clicked, toggling menu');
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        console.log('Menu state:', {hamburger_active: hamburger.classList.contains('active'), menu_active: mobileMenu.classList.contains('active')});
    });
    
    // Close menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            console.log('📎 Menu link clicked:', this.textContent, '- closing menu');
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });
    
    // Close menu when clicking outside (on mobile)
    document.addEventListener('click', function(e) {
        if (hamburger && mobileMenu && !hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
            if (hamburger.classList.contains('active')) {
                console.log('👆 Click outside - closing menu');
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
            }
        }
    });
    
    console.log('✅ Hamburger menu setup complete');
}



/**
 * Initialize on DOM load - EXACT match with contact.html
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOMContentLoaded event fired');
    console.log('✅ Calling updateNavigation()...');
    updateNavigation();
    console.log('✅ Calling setupNavbarScroll()...');
    setupNavbarScroll();
    console.log('✅ Calling setupHamburgerMenu()...');
    setupHamburgerMenu();
    
    // Listen for storage changes (login/logout from other tabs)
    window.addEventListener('storage', () => {
        console.log('📢 Storage changed detected, updating navigation...');
        updateNavigation();
    });
    
    console.log('✅ All navbar initialization complete');
});


