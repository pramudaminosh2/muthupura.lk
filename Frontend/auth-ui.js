/**
 * Authentication UI Manager
 * Handles login state display without navbar.js
 * 
 * Uses localStorage:
 * - jwt_token: JWT authentication token
 * - user_role: User role ('user' or 'admin')
 * - user_name: User display name
 */

document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // 1. GET AUTH STATE FROM LOCALSTORAGE
    // ============================================
    const token = localStorage.getItem('jwt_token');
    const role = localStorage.getItem('user_role');
    const name = localStorage.getItem('user_name');

    const isLoggedIn = !!token && !!role && !!name;

    console.log('🔐 Auth UI initialized:', { isLoggedIn, role, name: name?.substring(0, 10) });

    // ============================================
    // 2. SELECT ALL ELEMENTS TO UPDATE
    // ============================================
    const userGreeting = document.getElementById('user-greeting');
    const authLink = document.getElementById('auth-link');
    const adminLink = document.getElementById('admin-link');
    const myListingsLink = document.getElementById('mylistings-link');

    // Mobile versions
    const authLinkMobile = document.getElementById('auth-link-mobile');
    const adminLinkMobile = document.getElementById('admin-link-mobile');
    const myListingsLinkMobile = document.getElementById('mylistings-link-mobile');

    // NOTE: Navbar admin links are now handled by navbar.js directly

    // ============================================
    // 3. HELPER FUNCTION: LOGOUT
    // ============================================
    function performLogout() {
        console.log('🚪 Logging out...');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        
        // Force redirect with cache bust query param
        window.location.href = 'index.html?logout=' + Date.now();
        
        // Fallback: hard refresh
        setTimeout(() => {
            window.location.reload(true);
        }, 500);
    }

    // ============================================
    // 4. UPDATE UI BASED ON LOGIN STATE
    // ============================================
    if (isLoggedIn) {
        // ===== USER IS LOGGED IN =====
        
        // A. Show user greeting with smooth fade-in (first name only)
        if (userGreeting) {
            const firstName = name.split(' ')[0];
            userGreeting.textContent = `Hi, ${firstName}`;
            userGreeting.style.display = 'inline-block';
            userGreeting.style.opacity = '0';
            userGreeting.style.transition = 'opacity 0.3s ease-in-out';
            
            // Trigger fade-in
            setTimeout(() => {
                userGreeting.style.opacity = '1';
            }, 10);
        }

        // B. Replace Login button with Logout button
        if (authLink) {
            authLink.textContent = 'Logout';
            authLink.href = '#';
            authLink.classList.add('logout-btn');
            authLink.style.opacity = '0';
            
            authLink.addEventListener('click', (e) => {
                e.preventDefault();
                performLogout();
            });

            // Fade in logout button
            setTimeout(() => {
                authLink.style.opacity = '1';
            }, 10);
        }

        // C. Mobile logout button
        if (authLinkMobile) {
            authLinkMobile.textContent = 'Logout';
            authLinkMobile.href = '#';
            authLinkMobile.classList.add('mobile-menu-logout');
            
            authLinkMobile.addEventListener('click', (e) => {
                e.preventDefault();
                performLogout();
            });
        }

        // D. Show My Listings link (desktop)
        if (myListingsLink) {
            myListingsLink.style.display = 'inline-block';
            myListingsLink.style.opacity = '0';
            myListingsLink.style.transition = 'opacity 0.3s ease-in-out';
            
            setTimeout(() => {
                myListingsLink.style.opacity = '1';
            }, 50);
        }

        // E. Show My Listings link (mobile)
        if (myListingsLinkMobile) {
            myListingsLinkMobile.style.display = 'block';
            myListingsLinkMobile.style.opacity = '0';
            myListingsLinkMobile.style.transition = 'opacity 0.3s ease-in-out';
            
            setTimeout(() => {
                myListingsLinkMobile.style.opacity = '1';
            }, 50);
        }

        // F. Show Admin link if user is admin
        if (role === 'admin') {
            if (adminLink) {
                adminLink.style.display = 'inline-block';
                adminLink.style.opacity = '0';
                adminLink.style.transition = 'opacity 0.3s ease-in-out';
                
                setTimeout(() => {
                    adminLink.style.opacity = '1';
                }, 100);
            }

            if (adminLinkMobile) {
                adminLinkMobile.style.display = 'block';
                adminLinkMobile.style.opacity = '0';
                adminLinkMobile.style.transition = 'opacity 0.3s ease-in-out';
                
                setTimeout(() => {
                    adminLinkMobile.style.opacity = '1';
                }, 100);
            }

            console.log('👑 Admin mode enabled');
        } else {
            // Hide admin links for non-admins
            if (adminLink) adminLink.style.display = 'none';
            if (adminLinkMobile) adminLinkMobile.style.display = 'none';
        }

    } else {
        // ===== USER IS NOT LOGGED IN =====
        
        // A. Ensure login button is visible
        if (authLink) {
            authLink.textContent = 'Login';
            authLink.href = 'login.html';
            authLink.classList.remove('logout-btn');
            authLink.style.opacity = '1';
        }

        // B. Mobile login button
        if (authLinkMobile) {
            authLinkMobile.textContent = 'Login';
            authLinkMobile.href = 'login.html';
            authLinkMobile.classList.remove('mobile-menu-logout');
            // CRITICAL: Ensure mobile menu auth button is visible in the menu
            authLinkMobile.style.display = 'block';
        }

        // C. Hide admin buttons
        if (adminLink) adminLink.style.display = 'none';
        if (adminLinkMobile) adminLinkMobile.style.display = 'none';

        // D. Hide user greeting
        if (userGreeting) {
            userGreeting.style.display = 'none';
        }

        // D. Hide My Listings (both desktop and mobile)
        if (myListingsLink) myListingsLink.style.display = 'none';
        if (myListingsLinkMobile) myListingsLinkMobile.style.display = 'none';

        console.log('👤 Anonymous user state');
    }

    // ============================================
    // 5. SET ACTIVE NAV LINK
    // ============================================
    function setActiveNavLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        document.querySelectorAll('.nav-link[data-page], .mobile-menu-link[data-page]').forEach(link => {
            if (link.getAttribute('data-page') === currentPage.replace('.html', '')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    setActiveNavLink();

    // ============================================
    // 6. SMOOTH NAVBAR SCROLL EFFECT
    // ============================================
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // ============================================
    // 7. MOBILE MENU TOGGLE - REMOVED (navbar.js handles this)
    // ============================================
    // Hamburger setup is now handled exclusively by navbar.js
    // to avoid conflicts and duplicate event listeners


    // ============================================
    // 8. LOGOUT BUTTON STYLES (Dynamic CSS)
    // ============================================
    const style = document.createElement('style');
    style.textContent = `
        .logout-btn {
            background: linear-gradient(135deg, #ef4444, #dc2626) !important;
            border-color: #dc2626 !important;
            color: #ffffff !important;
        }

        .logout-btn:hover {
            box-shadow: 0 8px 24px rgba(220, 38, 38, 0.35) !important;
            background: linear-gradient(135deg, #dc2626, #b91c1c) !important;
        }

        .mobile-menu-logout {
            background: rgba(239, 68, 68, 0.15);
            border-left-color: #ef4444;
            color: #ef4444;
            font-weight: 600;
        }

        .mobile-menu-logout:hover {
            background: rgba(239, 68, 68, 0.25);
        }

        /* Fade in animation for auth elements */
        @keyframes fadeInSmooth {
            from {
                opacity: 0;
                transform: translateY(-5px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .user-greeting {
            animation: fadeInSmooth 0.4s ease-in-out;
        }
    `;
    document.head.appendChild(style);

    console.log('✅ Auth UI setup complete');
});

/**
 * USAGE:
 * 
 * 1. On login (login.html or after login request):
 *    localStorage.setItem('jwt_token', token);
 *    localStorage.setItem('user_role', role);
 *    localStorage.setItem('user_name', name);
 *    window.location.href = 'index.html';
 * 
 * 2. On any page, add this script before closing body:
 *    <script src="auth-ui.js"></script>
 * 
 * 3. Logout is handled automatically by clicking "Logout" button
 */

