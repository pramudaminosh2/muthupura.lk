# Premium Hero Section for Muthupura.lk

## Installation Instructions

Replace the existing hero section in your `index.html` (lines 1475-1507) with the HTML code below. Then add the CSS styles to your `<style>` tag in the `<head>`.

---

## HTML CODE

```html
<!-- Premium Hero Section -->
<div class="hero-wrapper">
    <section class="premium-hero">
        <div class="hero-background">
            <div class="hero-overlay"></div>
            <img src="https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=1600&h=900&fit=crop" alt="Vehicle Showcase" class="hero-bg-image">
        </div>
        
        <div class="hero-container">
            <div class="hero-content-block">
                <!-- Main Headline -->
                <h1 class="hero-title">Find Your Perfect Vehicle</h1>
                
                <!-- Subheadline -->
                <p class="hero-subtitle">Sri Lanka's trusted marketplace to buy, sell & lease vehicles with confidence</p>
                
                <!-- CTA Buttons -->
                <div class="hero-buttons">
                    <a href="#vehicles-section" class="hero-btn hero-btn-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                            <path d="M19 12H5M12 19l-7-7 7-7"></path>
                        </svg>
                        Browse Vehicles
                    </a>
                    <a href="post.html" class="hero-btn hero-btn-secondary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                            <path d="M12 5v14M5 12h14"></path>
                        </svg>
                        Post Your Ad
                    </a>
                </div>
                
                <!-- Stats Bar -->
                <div class="hero-stats-bar">
                    <div class="stat-item">
                        <div class="stat-number">500+</div>
                        <div class="stat-label">Vehicles Listed</div>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <div class="stat-number">1000+</div>
                        <div class="stat-label">Happy Users</div>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <div class="stat-number">Trusted</div>
                        <div class="stat-label">Since 2026</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Scroll Indicator -->
        <div class="scroll-indicator">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M19 12l-7 7-7-7"></path>
            </svg>
        </div>
    </section>
</div>

<!-- Quick Filters - Existing Section Kept Below -->
```

---

## CSS CODE

Add this to your `<style>` tag in the `<head>` section:

```css
/* ===== PREMIUM HERO SECTION ===== */
.hero-wrapper {
    width: 100%;
    padding: 0;
    margin: 0;
    margin-top: 70px;
}

.premium-hero {
    position: relative;
    width: 100%;
    height: 100vh;
    max-height: 800px;
    min-height: 600px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding-bottom: 60px;
}

/* Hero Background with Image & Overlay */
.hero-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
}

.hero-bg-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}

.hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        135deg,
        rgba(15, 23, 42, 0.85) 0%,
        rgba(30, 41, 59, 0.75) 50%,
        rgba(58, 111, 248, 0.4) 100%
    );
    z-index: 1;
    backdrop-filter: blur(2px);
}

/* Hero Container & Content */
.hero-container {
    position: relative;
    z-index: 2;
    max-width: 1200px;
    width: 100%;
    padding: 0 24px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

.hero-content-block {
    text-align: center;
    animation: heroFadeInUp 0.8s ease both;
    max-width: 700px;
}

@keyframes heroFadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Hero Title */
.hero-title {
    font-family: 'Poppins', sans-serif;
    font-size: clamp(2.5rem, 8vw, 4rem);
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 20px 0;
    line-height: 1.2;
    letter-spacing: -0.8px;
    text-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    animation: heroFadeInUp 0.8s ease both 0.1s backwards;
}

/* Hero Subtitle */
.hero-subtitle {
    font-family: 'Inter', sans-serif;
    font-size: clamp(1rem, 2.5vw, 1.25rem);
    color: rgba(255, 255, 255, 0.92);
    margin: 0 0 40px 0;
    font-weight: 400;
    line-height: 1.6;
    letter-spacing: 0.2px;
    text-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    animation: heroFadeInUp 0.8s ease both 0.2s backwards;
}

/* CTA Buttons Container */
.hero-buttons {
    display: flex;
    gap: 20px;
    justify-content: center;
    align-items: center;
    margin-bottom: 50px;
    flex-wrap: wrap;
    animation: heroFadeInUp 0.8s ease both 0.3s backwards;
}

/* Hero Buttons Styling */
.hero-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px 36px;
    border-radius: 14px;
    font-family: 'Poppins', sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    border: none;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;
    letter-spacing: 0.3px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    min-width: 200px;
}

.hero-btn-primary {
    background: linear-gradient(135deg, #3a6ff8 0%, #2d5ae8 100%);
    color: #ffffff;
    border: 2px solid transparent;
}

.hero-btn-primary:hover {
    background: linear-gradient(135deg, #2d5ae8 0%, #1f49d0 100%);
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(58, 111, 248, 0.35);
}

.hero-btn-primary:active {
    transform: translateY(-2px);
}

.hero-btn-secondary {
    background: transparent;
    color: #ffffff;
    border: 2.2px solid rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
}

.hero-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.9);
    color: #ffffff;
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(255, 255, 255, 0.15);
}

.hero-btn-secondary:active {
    transform: translateY(-2px);
}

.btn-icon {
    width: 20px;
    height: 20px;
}

/* Stats Bar - Glassmorphism */
.hero-stats-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(142, 82, 248, 0.08) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.4px solid rgba(255, 255, 255, 0.25);
    border-radius: 24px;
    padding: 28px 32px;
    max-width: 500px;
    margin: 0 auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.3);
    animation: heroFadeInUp 0.8s ease both 0.4s backwards;
}

.stat-item {
    flex: 1;
    text-align: center;
    padding: 0 24px;
}

.stat-number {
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 6px;
    letter-spacing: -0.3px;
}

.stat-label {
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
    letter-spacing: 0.2px;
}

.stat-divider {
    width: 1px;
    height: 50px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0) 100%);
}

/* Scroll Indicator */
.scroll-indicator {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 3;
    animation: bounce 2.5s infinite;
    cursor: pointer;
}

.scroll-indicator svg {
    width: 28px;
    height: 28px;
    color: rgba(255, 255, 255, 0.7);
    stroke: rgba(255, 255, 255, 0.7);
}

.scroll-indicator:hover svg {
    color: rgba(255, 255, 255, 0.95);
    stroke: rgba(255, 255, 255, 0.95);
}

@keyframes bounce {
    0%, 100% {
        transform: translateX(-50%) translateY(0);
        opacity: 0.8;
    }
    50% {
        transform: translateX(-50%) translateY(12px);
        opacity: 1;
    }
}

/* Responsive Design */
@media (max-width: 900px) {
    .premium-hero {
        max-height: 700px;
        min-height: 550px;
    }

    .hero-buttons {
        flex-direction: column;
        width: 100%;
        gap: 16px;
    }

    .hero-btn {
        width: 100%;
        min-width: unset;
        padding: 14px 28px;
        font-size: 1rem;
    }

    .hero-stats-bar {
        padding: 20px 24px;
        gap: 0;
    }

    .stat-item {
        padding: 0 16px;
    }

    .stat-number {
        font-size: 1.3rem;
    }

    .stat-label {
        font-size: 0.85rem;
    }

    .stat-divider {
        height: 40px;
    }
}

@media (max-width: 640px) {
    .hero-wrapper {
        margin-top: 70px;
    }

    .premium-hero {
        max-height: 600px;
        min-height: 500px;
        padding-bottom: 40px;
    }

    .hero-content-block {
        padding: 0 16px;
    }

    .hero-title {
        font-size: clamp(1.8rem, 7vw, 2.5rem);
        margin-bottom: 16px;
    }

    .hero-subtitle {
        font-size: clamp(0.95rem, 2vw, 1.1rem);
        margin-bottom: 32px;
    }

    .hero-buttons {
        margin-bottom: 36px;
    }

    .hero-btn {
        padding: 12px 24px;
        font-size: 0.95rem;
        gap: 8px;
    }

    .btn-icon {
        width: 18px;
        height: 18px;
    }

    .hero-stats-bar {
        flex-direction: column;
        gap: 16px;
        padding: 20px;
        max-width: 100%;
    }

    .stat-item {
        padding: 8px 0;
    }

    .stat-divider {
        width: 80%;
        height: 1px;
        margin: 0 auto;
    }

    .scroll-indicator {
        bottom: 16px;
    }
}
```

---

## How to Integrate

1. **Open your `index.html` file**
2. **Find and replace** the existing hero section (the one with `<div class="hero-wrapper">` and the search form) with the HTML code above
3. **Add the CSS** to the `<style>` section in your `<head>`
4. **The Quick Filters section and vehicle listings will appear below** the hero automatically

---

## Features Included

✅ **Premium Design**: Dark gradient overlay with vehicle background image from Unsplash  
✅ **Glassmorphism Stats Bar**: Frosted glass effect with 3 trust signals  
✅ **Responsive**: Works perfectly on mobile (500px), tablet (640px+), and desktop  
✅ **Smooth Animations**: Fade-in cascading animations for title, subtitle, buttons, and stats  
✅ **CTA Buttons**: Primary (filled) and secondary (outlined) with hover effects  
✅ **Scroll Indicator**: Bouncing chevron to indicate more content below  
✅ **Modern Typography**: Uses Poppins & Inter (already in your setup)  
✅ **Accessibility**: Proper semantic HTML and SVG icons  

---

## Customization Tips

**Change Background Image:**
```html
<!-- In the HTML, replace the src in this line: -->
<img src="https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=1600&h=900&fit=crop" alt="Vehicle Showcase" class="hero-bg-image">

<!-- With any other image URL: -->
<img src="YOUR_IMAGE_URL_HERE" alt="Vehicle Showcase" class="hero-bg-image">
```

**Change Colors:**
- Primary button: Modify `#3a6ff8` in `.hero-btn-primary`
- Secondary button: Works with transparent + border (modify `rgba(255, 255, 255, 0.6)`)
- Overlay gradient: Adjust values in `.hero-overlay` gradient

**Modify Stats:**
- Change the numbers and labels in the HTML stats section

**Adjust Heights:**
- Change `max-height: 800px` and `min-height: 600px` in `.premium-hero`
