/**
 * NAVBAR SYSTEM - Universal navbar loader and controller
 * Handles authentication, menu toggles, scroll effects, and UI updates
 * 
 * Usage: Include in all pages with:
 * <link rel="stylesheet" href="styles/navbar.css">
 * <script src="js/navbar.js" defer></script>
 * <div id="navbar-container"></div>
 */

// Cache for navbar HTML to avoid repeated fetches
let navbarCache = null;

/**
 * Load and inject navbar HTML into the page
 * Caches the navbar to avoid repeated network requests
 */
async function loadNavbar() {
    try {
        // Use cached navbar if available
        if (navbarCache) {
            console.log('✅ Using cached navbar');
            document.getElementById('navbar-container').innerHTML = navbarCache;
            initNavbar();
            return;
        }

        // Fetch navbar if not cached
        const response = await fetch('components/navbar.html');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        navbarCache = await response.text();
        console.log('✅ Navbar loaded and cached');
        
        document.getElementById('navbar-container').innerHTML = navbarCache;
        initNavbar();
    } catch (error) {
        console.error('❌ Failed to load navbar:', error);
        // Fallback: Create minimal navbar if fetch fails
        createFallbackNavbar();
    }
}

/**
 * Creates fallback navbar if fetch fails
 * Ensures site remains functional
 */
function createFallbackNavbar() {
    const container = document.getElementById('navbar-container');
    if (!container) return;
    
    container.innerHTML = `
        <nav class="premium-navbar">
            <div class="navbar-container">
                <div class="navbar-left">
                    <a href="/" class="navbar-logo">
                        <img src="logo.PNG" alt="Logo" class="navbar-logo-img" style="height:45px;">
                        <span class="navbar-brand-text">Muthupura.lk</span>
                    </a>
                </div>
                <div class="navbar-right">
                    <a href="login.html" class="nav-link-auth" id="auth-link">Login</a>
                </div>
            </div>
        </nav>
    `;
    console.warn('⚠️  Using fallback navbar');
}

/**
 * Initialize navbar after HTML is loaded
 * Sets up event listeners and auth state
 */
function initNavbar() {
    setupScrollEffect();
    setupHamburgerMenu();
    updateNavbarAuthUI();
    setActiveLink();
}

/**
 * Scroll effect for navbar
 * Adds blur/shadow on scroll
 */
function setupScrollEffect() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 0) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/**
 * Hamburger menu toggle functionality
 */
function setupHamburgerMenu() {
    const hamburger = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (!hamburger || !mobileMenu) return;
    
    // Toggle menu on hamburger click
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });
    
    // Close menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });
}

/**
 * Extract and verify JWT token payload
 * Returns token payload or null if invalid
 */
function getTokenPayload() {
    const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
    if (!token) return null;
    
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(atob(parts[1]));
        
        // Check token expiration
        if (payload.exp && Date.now() >= payload.exp * 1000) {
            // Token expired, clear localStorage
            clearAuthStorage();
            return null;
        }
        
        return payload;
    } catch (error) {
        console.error('❌ Invalid token:', error);
        return null;
    }
}

/**
 * Clear all authentication-related localStorage keys
 */
function clearAuthStorage() {
    const keysToRemove = ['token', 'jwt_token', 'user_name', 'user_role', 'user', 'userName'];
    keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
        }
    });
}

/**
 * Logout function
 * Clears auth data and redirects to home
 */
window.performLogout = function() {
    console.log('🚪 Logging out...');
    clearAuthStorage();
    console.log('✅ Auth data cleared');
    window.location.href = 'index.html';
};

/**
 * Update navbar UI based on authentication state
 * Shows/hides login, logout, user greeting, admin links, etc.
 */
async function updateNavbarAuthUI() {
    try {
        const payload = getTokenPayload();
        
        // Get navbar elements
        const authLink = document.getElementById('auth-link');
        const authLinkMobile = document.getElementById('auth-link-mobile');
        const adminLink = document.getElementById('admin-link');
        const adminLinkMobile = document.getElementById('admin-link-mobile');
        const myListingsLink = document.getElementById('mylistings-link');
        const myListingsLinkMobile = document.getElementById('mylistings-link-mobile');
        const userGreeting = document.getElementById('user-greeting');
        
        // Check if user is admin
        const isUserAdmin = payload?.role === 'admin' || payload?.is_admin === true;
        
        if (payload) {
            // ===== USER IS LOGGED IN =====
            console.log('✅ User is authenticated:', { name: payload.name, role: payload.role });
            
            // Show My Listings
            if (myListingsLink) myListingsLink.style.display = 'block';
            if (myListingsLinkMobile) myListingsLinkMobile.style.display = 'block';
            
            // Show User Greeting (desktop only)
            if (userGreeting) {
                const displayName = payload.name || localStorage.getItem('user_name') || 'User';
                userGreeting.textContent = `Hi, ${displayName}`;
                userGreeting.style.display = 'inline-block';
            }
            
            // Show Admin Links if admin
            if (isUserAdmin) {
                if (adminLink) adminLink.style.display = 'inline-block';
                if (adminLinkMobile) adminLinkMobile.style.display = 'block';
                console.log('👑 Admin mode enabled');
            } else {
                if (adminLink) adminLink.style.display = 'none';
                if (adminLinkMobile) adminLinkMobile.style.display = 'none';
            }
            
            // Convert Login button to Logout button
            if (authLink) {
                authLink.textContent = 'Logout';
                authLink.classList.add('logout-btn');
                authLink.classList.remove('nav-login-btn');
                authLink.href = '#';
                authLink.onclick = (e) => {
                    e.preventDefault();
                    performLogout();
                };
                authLink.style.display = 'inline-block';
            }
            
            // Mobile logout button
            if (authLinkMobile) {
                authLinkMobile.textContent = 'Logout';
                authLinkMobile.classList.add('logout-btn');
                authLinkMobile.classList.remove('nav-login-btn');
                authLinkMobile.href = '#';
                authLinkMobile.onclick = (e) => {
                    e.preventDefault();
                    performLogout();
                };
            }
            
        } else {
            // ===== USER IS NOT LOGGED IN =====
            console.log('👤 User is anonymous');
            
            // Hide My Listings
            if (myListingsLink) myListingsLink.style.display = 'none';
            if (myListingsLinkMobile) myListingsLinkMobile.style.display = 'none';
            
            // Hide User Greeting
            if (userGreeting) userGreeting.style.display = 'none';
            
            // Hide Admin Links
            if (adminLink) adminLink.style.display = 'none';
            if (adminLinkMobile) adminLinkMobile.style.display = 'none';
            
            // Show Login button
            if (authLink) {
                authLink.textContent = 'Login';
                authLink.classList.remove('logout-btn');
                authLink.classList.add('nav-login-btn');
                authLink.href = 'login.html';
                authLink.onclick = null;
                authLink.style.display = 'inline-block';
            }
            
            // Mobile login button
            if (authLinkMobile) {
                authLinkMobile.textContent = 'Login';
                authLinkMobile.classList.remove('logout-btn');
                authLinkMobile.classList.add('nav-login-btn');
                authLinkMobile.href = 'login.html';
                authLinkMobile.onclick = null;
            }
        }
    } catch (error) {
        console.error('❌ Error updating navbar UI:', error);
    }
}

/**
 * Set active navigation link based on current page
 */
function setActiveLink() {
    try {
        // Get current page from URL
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const pageName = currentPage.replace('.html', '') || 'home';
        
        // Remove active class from all links
        document.querySelectorAll('.nav-link[data-page], .mobile-menu-link[data-page]').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current page link
        document.querySelectorAll(`[data-page="${pageName}"], [data-page="home"]`).forEach(link => {
            if (
                (pageName === 'home' && currentPage === 'index.html') ||
                (pageName === currentPage.replace('.html', ''))
            ) {
                link.classList.add('active');
            }
        });
    } catch (error) {
        console.error('❌ Error setting active link:', error);
    }
}

/**
 * Initialize navbar when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('navbar-container');
    if (container) {
        loadNavbar();
    } else {
        console.warn('⚠️  navbar-container element not found');
    }
});

/**
 * Handle logout from anywhere in the app
 */
window.logout = performLogout;

/**
 * Force navbar UI update (useful after login/logout)
 */
window.refreshNavbar = updateNavbarAuthUI;
