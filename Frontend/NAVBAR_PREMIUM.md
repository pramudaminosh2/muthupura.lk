# Premium Glassmorphism Navbar - Muthupura.lk

## Installation Instructions

This navbar will **replace** your existing navbar section in `index.html`. 

### Step 1: Replace the HTML

Find and remove your current navbar HTML (the `<nav class="navbar">` and `<div class="mobile-menu">` sections).

Paste this HTML code at the top of your `<body>` tag (right after `<div id="loader"></div>`):

---

## HTML CODE

```html
<!-- Premium Glassmorphism Navbar -->
<nav class="premium-navbar" id="navbar">
    <div class="navbar-container">
        <!-- Left: Logo -->
        <div class="navbar-left">
            <a href="index.html" class="navbar-logo">
                <img src="logo.PNG" alt="Muthupura.lk" class="navbar-logo-img">
                <span class="navbar-brand-text">Muthupura.lk</span>
            </a>
        </div>

        <!-- Center: Nav Links -->
        <div class="navbar-center" id="navbar-center">
            <a href="index.html" class="nav-link" data-page="home">Home</a>
            <a href="post.html" class="nav-link" data-page="post">Post Ad</a>
            <a href="dashboard.html" class="nav-link" id="mylistings-link" data-page="dashboard" style="display:none;">My Listings</a>
            <a href="about.html" class="nav-link" data-page="about">About Us</a>
            <a href="contact.html" class="nav-link" data-page="contact">Contact Us</a>
        </div>

        <!-- Right: Auth Links -->
        <div class="navbar-right">
            <span id="user-greeting" class="user-greeting" style="display:none;"></span>
            <a href="login.html" class="nav-link-auth" id="auth-link">Login</a>
            <a href="admin.html" class="nav-link-admin" id="admin-link" style="display:none;">Admin</a>
        </div>

        <!-- Hamburger Menu (Mobile) -->
        <button class="hamburger-menu" id="hamburger-btn" aria-label="Toggle menu">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        </button>
    </div>
</nav>

<!-- Mobile Menu Dropdown -->
<div class="mobile-menu-dropdown" id="mobile-menu">
    <a href="index.html" class="mobile-menu-link" data-page="home">Home</a>
    <a href="post.html" class="mobile-menu-link" data-page="post">Post Ad</a>
    <a href="dashboard.html" class="mobile-menu-link" id="mylistings-link-mobile" data-page="dashboard" style="display:none;">My Listings</a>
    <a href="about.html" class="mobile-menu-link" data-page="about">About Us</a>
    <a href="contact.html" class="mobile-menu-link" data-page="contact">Contact Us</a>
    <div class="mobile-menu-divider"></div>
    <a href="login.html" class="mobile-menu-link mobile-menu-auth" id="auth-link-mobile">Login</a>
    <a href="admin.html" class="mobile-menu-link mobile-menu-admin" id="admin-link-mobile" style="display:none;">Admin</a>
</div>
```

---

## CSS CODE

### Step 2: Replace Navbar CSS

Find your existing navbar CSS (look for `.navbar {` and `.mobile-menu {` styles) and **replace them entirely** with this:

```css
/* ===== CSS VARIABLES ===== */
:root {
    --navbar-accent: #3a6ff8;
    --navbar-text: #1f2f4f;
    --navbar-text-light: rgba(31, 47, 79, 0.8);
    --navbar-bg-dark: rgba(15, 23, 42, 0.8);
    --navbar-blur: 20px;
}

/* ===== PREMIUM NAVBAR ===== */
.premium-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 70px;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-bottom: 1px solid transparent;
    box-shadow: none;
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    padding: 0;
}

/* Navbar Scrolled State - Glassmorphism Activated */
.premium-navbar.scrolled {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
    backdrop-filter: blur(var(--navbar-blur));
    -webkit-backdrop-filter: blur(var(--navbar-blur));
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.navbar-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 32px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 40px;
}

/* ===== LOGO ===== */
.navbar-left {
    flex-shrink: 0;
    animation: slideInDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0s backwards;
}

.navbar-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    transition: all 0.3s ease;
}

.navbar-logo-img {
    height: 40px;
    width: auto;
    transition: all 0.3s ease;
    filter: drop-shadow(0 4px 12px rgba(58, 111, 248, 0.15));
}

.navbar-logo:hover .navbar-logo-img {
    filter: drop-shadow(0 6px 20px rgba(58, 111, 248, 0.25));
    transform: translateY(-2px);
}

.navbar-brand-text {
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--navbar-text);
    letter-spacing: -0.3px;
    transition: all 0.3s ease;
}

.navbar-logo:hover .navbar-brand-text {
    color: var(--navbar-accent);
}

/* ===== CENTER NAV LINKS ===== */
.navbar-center {
    display: flex;
    align-items: center;
    gap: 40px;
    flex-grow: 1;
    justify-content: center;
}

.nav-link {
    position: relative;
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--navbar-text);
    text-decoration: none;
    padding: 8px 0;
    transition: color 0.3s ease;
    letter-spacing: 0.2px;
    animation: slideInDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

.nav-link:nth-child(1) { animation-delay: 0.1s; }
.nav-link:nth-child(2) { animation-delay: 0.15s; }
.nav-link:nth-child(3) { animation-delay: 0.2s; }
.nav-link:nth-child(4) { animation-delay: 0.25s; }
.nav-link:nth-child(5) { animation-delay: 0.3s; }

/* Animated Underline Effect */
.nav-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2.5px;
    background: linear-gradient(90deg, var(--navbar-accent), #8e52f8);
    border-radius: 2px;
    transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nav-link:hover {
    color: var(--navbar-accent);
}

.nav-link:hover::after {
    width: 100%;
}

/* Active Link Style */
.nav-link.active {
    color: var(--navbar-accent);
}

.nav-link.active::after {
    width: 100%;
    height: 3px;
}

/* ===== RIGHT AUTH SECTION ===== */
.navbar-right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
    animation: slideInDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.35s backwards;
}

.user-greeting {
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    color: var(--navbar-text);
    padding: 8px 14px;
    border-radius: 8px;
    background: rgba(58, 111, 248, 0.08);
    white-space: nowrap;
    font-weight: 500;
    letter-spacing: 0.2px;
}

/* Login Button - Outlined Ghost Style */
.nav-link-auth {
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--navbar-accent);
    text-decoration: none;
    padding: 10px 20px;
    border: 2px solid var(--navbar-accent);
    border-radius: 10px;
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    background: transparent;
    cursor: pointer;
    letter-spacing: 0.3px;
}

.nav-link-auth:hover {
    background: var(--navbar-accent);
    color: #ffffff;
    box-shadow: 0 8px 20px rgba(58, 111, 248, 0.25);
    transform: translateY(-2px);
}

.nav-link-auth:active {
    transform: translateY(0);
}

/* Admin Link - Subtle Text */
.nav-link-admin {
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba(31, 47, 79, 0.6);
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.3s ease;
    letter-spacing: 0.2px;
}

.nav-link-admin:hover {
    background: rgba(58, 111, 248, 0.08);
    color: var(--navbar-accent);
}

/* ===== HAMBURGER MENU (MOBILE) ===== */
.hamburger-menu {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    transition: all 0.3s ease;
    margin-right: -8px;
}

.hamburger-line {
    width: 24px;
    height: 2.5px;
    background: var(--navbar-text);
    border-radius: 2px;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hamburger-menu.active .hamburger-line:nth-child(1) {
    transform: rotate(45deg) translate(10px, 10px);
}

.hamburger-menu.active .hamburger-line:nth-child(2) {
    opacity: 0;
    transform: translateX(-10px);
}

.hamburger-menu.active .hamburger-line:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -7px);
}

/* ===== MOBILE MENU DROPDOWN ===== */
.mobile-menu-dropdown {
    display: none;
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    max-height: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%);
    backdrop-filter: blur(var(--navbar-blur));
    -webkit-backdrop-filter: blur(var(--navbar-blur));
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
    flex-direction: column;
    gap: 0;
    z-index: 999;
    animation: slideDownMenu 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.mobile-menu-dropdown.active {
    display: flex;
    max-height: 400px;
}

@keyframes slideDownMenu {
    from {
        max-height: 0;
        opacity: 0;
    }
    to {
        max-height: 400px;
        opacity: 1;
    }
}

.mobile-menu-link {
    display: block;
    padding: 14px 24px;
    text-decoration: none;
    color: var(--navbar-text);
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.3s ease;
    border-left: 3px solid transparent;
    letter-spacing: 0.2px;
}

.mobile-menu-link:hover {
    background: rgba(58, 111, 248, 0.1);
    color: var(--navbar-accent);
    border-left-color: var(--navbar-accent);
    padding-left: 28px);
}

.mobile-menu-link.active {
    background: rgba(58, 111, 248, 0.12);
    color: var(--navbar-accent);
    border-left-color: var(--navbar-accent);
    font-weight: 600;
}

.mobile-menu-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    margin: 8px 0;
}

.mobile-menu-auth {
    border: 2px solid var(--navbar-accent);
    color: var(--navbar-accent);
    margin: 12px 12px;
    border-radius: 10px;
    text-align: center;
    background: transparent;
}

.mobile-menu-auth:hover {
    background: var(--navbar-accent);
    color: #ffffff;
}

.mobile-menu-admin {
    font-size: 0.85rem;
    color: rgba(31, 47, 79, 0.6);
    padding: 10px 24px;
}

.mobile-menu-admin:hover {
    background: rgba(58, 111, 248, 0.08);
    color: var(--navbar-accent);
    border-left-color: transparent;
}

/* ===== ANIMATIONS ===== */
@keyframes slideInDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 768px) {
    .navbar-container {
        padding: 0 16px;
        gap: 16px;
    }

    .navbar-center {
        display: none;
    }

    .hamburger-menu {
        display: flex;
    }

    .navbar-right {
        gap: 12px;
    }

    .user-greeting {
        display: none;
    }

    .nav-link-auth {
        padding: 8px 16px;
        font-size: 0.9rem;
    }

    .nav-link-admin {
        display: none;
    }
}

@media (max-width: 640px) {
    .navbar-container {
        padding: 0 12px;
    }

    .navbar-brand-text {
        font-size: 0.95rem;
    }

    .navbar-logo-img {
        height: 36px;
    }

    .nav-link-auth {
        padding: 7px 14px;
        font-size: 0.85rem;
    }
}
```

---

## JAVASCRIPT CODE

### Step 3: Add JavaScript for Scroll Detection & Hamburger Toggle

Add this JavaScript **before the closing `</body>` tag** or in a `<script>` tag at the end of your HTML:

```javascript
// ===== PREMIUM NAVBAR - SCROLL DETECTION & INTERACTIONS =====

document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.getElementById('navbar');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
    
    // ===== SCROLL DETECTION =====
    let lastScrollY = 0;
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        if (scrollY > 0) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScrollY = scrollY;
    }, { passive: true });
    
    // ===== HAMBURGER TOGGLE =====
    hamburgerBtn.addEventListener('click', () => {
        hamburgerBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });
    
    // Close mobile menu when a link is clicked
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburgerBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });
    
    // ===== ACTIVE PAGE DETECTION =====
    function setActivePage() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // Desktop nav
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Mobile nav
        mobileMenuLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    setActivePage();
    
    // Close mobile menu when user clicks outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.premium-navbar') && !e.target.closest('.mobile-menu-dropdown')) {
            hamburgerBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
        }
    });
});
```

---

## Summary of Features

✅ **Glassmorphism Design**
- Transparent at top, frosted glass on scroll
- Backdrop blur effect (20px)
- Subtle borders and inset highlights

✅ **Scroll-Aware Navbar**
- Smooth transition from transparent to glassmorphic
- Only activates blur on scroll for better performance

✅ **Premium Animations**
- Logo glow on hover with drop shadow
- Animated underline that slides from left to right on nav links
- Hamburger morphs into X when menu opens
- Menu slides down smoothly with backdrop blur

✅ **Responsive Design**
- Desktop: Full horizontal navbar with centered links
- Tablet/Mobile: Hamburger menu with slide-down dropdown
- Touch-friendly spacing and sizing

✅ **Active Page Detection**
- Automatically highlights current page link
- Works on desktop and mobile menus
- Uses data attributes and pathname detection

✅ **Completely Customizable**
- CSS variables for easy color changes
- Adjust blur amount, timing, spacing easily
- Pure vanilla JS (no dependencies)

---

## Customization Tips

**Change accent color:**
```css
:root {
    --navbar-accent: #3a6ff8; /* Change this value */
}
```

**Adjust blur intensity:**
```css
--navbar-blur: 20px; /* Increase or decrease */
```

**Modify animation speed:**
In CSS, find `transition:` properties and adjust the `0.35s` and `0.4s` values.

**Change navbar height:**
Find `.premium-navbar { height: 70px; }` and modify accordingly.

---

## Installation Checklist

- [ ] Replace entire navbar HTML section
- [ ] Replace all navbar CSS (search for `.navbar {` in your styles)
- [ ] Add the JavaScript code before closing `</body>`
- [ ] Test scroll behavior (navbar should become frosted on scroll)
- [ ] Test hamburger menu on mobile (< 768px)
- [ ] Test active page highlighting
- [ ] Verify all links work correctly
- [ ] Check logo glow effect on hover
- [ ] Test underline animation on nav link hover
