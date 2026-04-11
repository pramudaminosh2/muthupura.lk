(function() {
  // ── CONFIG ──────────────────────────────
  const API_BASE = 'https://muthupura-lk.onrender.com';

  // ── NAV LINKS ───────────────────────────
  const navLinks = [
    { href: 'index.html',     label: 'Home' },
    { href: 'post.html',      label: 'Post Ad' },
    { href: 'dashboard.html', label: 'My Listings' },
    { href: 'about.html',     label: 'About Us' },
    { href: 'contact.html',   label: 'Contact Us' }
  ];

  // ── DETECT ACTIVE PAGE ──────────────────
  const currentPage = window.location.pathname
    .split('/').pop() || 'index.html';

  // ── BUILD NAV LINKS HTML ────────────────
  const linksHTML = navLinks.map(link => {
    const isActive = currentPage === link.href ||
      (currentPage === '' && link.href === 'index.html');
    return `<a href="${link.href}" 
               class="nav-link ${isActive ? 'nav-active' : ''}"
             >${link.label}</a>`;
  }).join('');

  // ── NAVBAR HTML ─────────────────────────
  const navbarHTML = `
    <nav class="navbar" id="main-navbar">
      <div class="nav-container">

        <!-- Logo -->
        <a href="index.html" class="nav-logo">
          <img src="logo.PNG" alt="Muthupura.lk" 
               class="nav-logo-img">
          <span class="nav-logo-text">Muthupura.lk</span>
        </a>

        <!-- Desktop Links -->
        <div class="nav-links" id="nav-links">
          ${linksHTML}
        </div>

        <!-- Right side -->
        <div class="nav-right" id="nav-right">
          <div id="nav-auth-area">
            <!-- Login button (default, replaced if logged in) -->
            <a href="login.html" class="nav-login-btn" 
               id="nav-login-btn">Login</a>
          </div>
          <a href="admin.html" class="nav-admin-link">Admin</a>
        </div>

        <!-- Hamburger -->
        <button class="hamburger" id="hamburger" 
                aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>

      </div>

      <!-- Mobile Menu -->
      <div class="mobile-menu" id="mobile-menu">
        ${navLinks.map(link => `
          <a href="${link.href}" class="mobile-nav-link 
            ${currentPage === link.href ? 'mobile-active' : ''}">
            ${link.label}
          </a>
        `).join('')}
        <div class="mobile-auth-area" id="mobile-auth-area">
          <a href="login.html" class="mobile-login-btn">Login</a>
        </div>
      </div>
    </nav>
  `;

  // ── NAVBAR CSS ──────────────────────────
  const navbarCSS = `
    <style id="navbar-styles">
    :root {
      --accent: #4f6ef7;
      --accent-rgb: 79, 110, 247;
      --navbar-height: 70px;
    }

    @media (max-width: 767px) {
      :root { --navbar-height: 60px; }
    }

    .navbar {
      position: fixed;
      top: 0; left: 0;
      width: 100%;
      height: var(--navbar-height);
      z-index: 9999;
      background: transparent;
      transition: background 0.35s ease,
                  box-shadow 0.35s ease,
                  backdrop-filter 0.35s ease;
    }

    .navbar.scrolled {
      background: rgba(4, 8, 28, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 1px 0 rgba(255,255,255,0.06),
                  0 4px 20px rgba(0,0,0,0.25);
    }

    .navbar.light-page {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 1px 0 rgba(0,0,0,0.08),
                  0 4px 16px rgba(0,0,0,0.06);
    }

    .navbar.light-page .nav-link,
    .navbar.light-page .nav-logo-text {
      color: #1e2a4a !important;
    }

    .navbar.light-page .nav-login-btn {
      color: var(--accent) !important;
      border-color: var(--accent) !important;
    }

    .navbar.light-page .hamburger span {
      background: #1e2a4a !important;
    }

    .nav-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .nav-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      flex-shrink: 0;
    }

    .nav-logo-img {
      height: 42px;
      width: auto;
      object-fit: contain;
    }

    .nav-logo-text {
      font-family: Poppins, sans-serif;
      font-size: 17px;
      font-weight: 800;
      color: white;
      letter-spacing: -0.3px;
      white-space: nowrap;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 1;
      justify-content: center;
    }

    .nav-link {
      font-family: Poppins, sans-serif;
      font-size: 14.5px;
      font-weight: 500;
      color: rgba(255,255,255,0.85);
      text-decoration: none;
      padding: 8px 14px;
      border-radius: 10px;
      position: relative;
      transition: color 0.22s ease,
                  background 0.22s ease;
      letter-spacing: 0.2px;
      white-space: nowrap;
    }

    .nav-link::after {
      content: '';
      position: absolute;
      bottom: 4px; left: 14px; right: 14px;
      height: 2px;
      background: var(--accent);
      border-radius: 2px;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .nav-link:hover {
      color: white;
      background: rgba(255,255,255,0.08);
    }

    .nav-link:hover::after,
    .nav-active::after {
      transform: scaleX(1);
    }

    .nav-active {
      color: white !important;
      font-weight: 600;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .nav-login-btn {
      font-family: Poppins, sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: white;
      text-decoration: none;
      padding: 8px 20px;
      border: 1.5px solid rgba(255,255,255,0.45);
      border-radius: 10px;
      transition: all 0.22s ease;
      white-space: nowrap;
    }

    .nav-login-btn:hover {
      background: rgba(255,255,255,0.12);
      border-color: rgba(255,255,255,0.75);
    }

    .nav-admin-link {
      font-family: Poppins, sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: rgba(255,255,255,0.50);
      text-decoration: none;
      transition: color 0.2s;
      white-space: nowrap;
    }

    .nav-admin-link:hover {
      color: rgba(255,255,255,0.80);
    }

    /* Hamburger */
    .hamburger {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      z-index: 10000;
      flex-shrink: 0;
    }

    .hamburger span {
      display: block;
      width: 24px;
      height: 2.5px;
      background: white;
      border-radius: 3px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    body.nav-open .hamburger span:nth-child(1) {
      transform: translateY(7.5px) rotate(45deg);
    }
    body.nav-open .hamburger span:nth-child(2) {
      opacity: 0;
      transform: scaleX(0);
    }
    body.nav-open .hamburger span:nth-child(3) {
      transform: translateY(-7.5px) rotate(-45deg);
    }

    /* Mobile menu */
    .mobile-menu {
      position: fixed;
      top: var(--navbar-height);
      left: 0;
      width: 100%;
      background: rgba(4, 8, 28, 0.97);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding: 12px 0 24px;
      z-index: 9998;
      transform: translateY(-110%);
      transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      visibility: hidden;
    }

    body.nav-open .mobile-menu {
      transform: translateY(0);
      visibility: visible;
    }

    .mobile-nav-link {
      display: block;
      padding: 13px 28px;
      font-family: Poppins, sans-serif;
      font-size: 15px;
      font-weight: 500;
      color: rgba(255,255,255,0.85);
      text-decoration: none;
      border-left: 3px solid transparent;
      transition: all 0.2s ease;
    }

    .mobile-nav-link:hover,
    .mobile-active {
      border-left-color: var(--accent);
      background: rgba(255,255,255,0.05);
      color: white;
      padding-left: 34px;
    }

    .mobile-auth-area {
      padding: 16px 28px 0;
      border-top: 1px solid rgba(255,255,255,0.08);
      margin-top: 12px;
    }

    .mobile-login-btn {
      display: inline-block;
      padding: 11px 28px;
      background: var(--accent);
      color: white;
      border-radius: 10px;
      font-family: Poppins, sans-serif;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .mobile-login-btn:hover { opacity: 0.88; }

    /* User avatar in navbar */
    .nav-user-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.10);
      border: 1.5px solid rgba(255,255,255,0.25);
      border-radius: 10px;
      padding: 6px 14px;
      color: white;
      font-family: Poppins, sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.22s ease;
    }
    .nav-user-btn:hover {
      background: rgba(255,255,255,0.18);
    }

    .nav-avatar {
      width: 26px; height: 26px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f6ef7, #8b5cf6);
      color: white;
      font-size: 11px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-user-menu {
      position: relative;
    }

    .nav-dropdown {
      display: none;
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      background: white;
      border-radius: 14px;
      padding: 8px;
      min-width: 190px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.15),
                  0 2px 8px rgba(0,0,0,0.08);
      z-index: 10001;
      border: 1px solid rgba(226,232,245,0.8);
    }

    .nav-dropdown.open { display: block; }

    .nav-dropdown a,
    .nav-dropdown button {
      display: block;
      width: 100%;
      padding: 10px 14px;
      font-family: Poppins, sans-serif;
      font-size: 13px;
      color: #374151;
      text-decoration: none;
      border-radius: 8px;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s;
      font-weight: 500;
    }

    .nav-dropdown a:hover,
    .nav-dropdown button:hover {
      background: #f8faff;
    }

    .nav-dropdown .logout-btn {
      color: #dc2626 !important;
      font-weight: 600 !important;
      border-top: 1px solid #f1f5f9;
      margin-top: 4px;
      padding-top: 14px;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .nav-logo-text { display: none; }
      .nav-link { font-size: 13.5px; padding: 8px 10px; }
    }

    @media (max-width: 768px) {
      .nav-links  { display: none; }
      .nav-right  { display: none; }
      .hamburger  { display: flex; }
    }
    </style>
  `;

  // ── INJECT INTO PAGE ────────────────────
  document.head.insertAdjacentHTML('beforeend', navbarCSS);
  document.body.insertAdjacentHTML('afterbegin', navbarHTML);

  // ── SCROLL BEHAVIOR ─────────────────────
  // Detect if page has a hero/dark header
  const hasHero = !document.body.dataset.lightNav && 
    document.querySelector('.hero-section, .hero, .auth-left, [data-dark-header]');

  const navbar = document.getElementById('main-navbar');

  function updateNavbar() {
    if (!hasHero) {
      navbar.classList.add('light-page');
      navbar.classList.remove('scrolled');
      return;
    }
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();

  // ── HAMBURGER ───────────────────────────
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
    });
  }

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.body.classList.remove('nav-open');
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.navbar') &&
        document.body.classList.contains('nav-open')) {
      document.body.classList.remove('nav-open');
    }
  });

  // ── AUTH STATE ──────────────────────────
  // Check localStorage for logged in user
  // Uses keys set by login.html: jwt_token, user_name, user_role
  function updateNavbarAuth() {
    const token = localStorage.getItem('jwt_token');
    const userName = localStorage.getItem('user_name');
    const authArea = document.getElementById('nav-auth-area');
    const mobileAuthArea = document.getElementById('mobile-auth-area');

    console.log('🔐 Navbar Auth State:', { hasToken: !!token, hasUserName: !!userName });

    if (!token || !userName || !authArea) {
      console.log('⚠️  No auth state found, keeping login button');
      return;
    }

    try {
      const name = userName || 'Account';
      const firstName = name.split(' ')[0];
      const initials = name.split(' ')
        .map(n => n[0] || '').join('')
        .toUpperCase().slice(0, 2) || 'U';

      console.log('✅ Updating navbar with user:', { name, firstName, initials });

      authArea.innerHTML = `
        <div class="nav-user-menu">
          <button class="nav-user-btn" id="nav-user-trigger">
            <span class="nav-avatar">${initials}</span>
            ${firstName}
          </button>
          <div class="nav-dropdown" id="nav-dropdown">
            <a href="dashboard.html">📋 My Listings</a>
            <a href="post.html">➕ Post Vehicle</a>
            <button class="logout-btn" 
                    onclick="window.navbarLogout()">
              🚪 Logout
            </button>
          </div>
        </div>
      `;

      // Toggle dropdown
      document.getElementById('nav-user-trigger')
        ?.addEventListener('click', (e) => {
          e.stopPropagation();
          document.getElementById('nav-dropdown')
            ?.classList.toggle('open');
        });

      // Update mobile auth area
      if (mobileAuthArea) {
        mobileAuthArea.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:8px">
            <a href="dashboard.html" class="mobile-nav-link"
               style="border-left:none;padding:10px 0">
               My Listings
            </a>
            <button onclick="window.navbarLogout()"
              style="background:none;border:none;
                     font-family:Poppins;font-size:15px;
                     color:#ef4444;padding:10px 0;
                     text-align:left;cursor:pointer;
                     font-weight:600;">
              Logout
            </button>
          </div>
        `;
      }

    } catch (e) {
      console.error('❌ Navbar auth error:', e);
    }
  }

  // Close dropdown on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-user-menu')) {
      document.getElementById('nav-dropdown')
        ?.classList.remove('open');
    }
  });

  // Global logout function
  window.navbarLogout = function() {
    console.log('🚪 LOGOUT - Clearing auth data');
    // Try Firebase signout if available
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().signOut().catch(() => {});
    }
    // Clear all auth keys used by login/register/navbar
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    console.log('✅ LOGOUT - Auth data cleared, redirecting to home');
    window.location.href = 'index.html';
  };

  // Run auth check
  updateNavbarAuth();

  // Listen for storage changes (e.g., login in another tab)
  window.addEventListener('storage', (e) => {
    if (e.key === 'jwt_token' || e.key === 'user_name') {
      console.log('📢 Storage changed, updating navbar...');
      updateNavbarAuth();
    }
  });

  // Page body padding for fixed navbar
  document.body.style.paddingTop = '0';

})();
