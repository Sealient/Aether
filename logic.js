/**
 * AETHER // PRESTIGE 
 * Core Logic Engine
 */

// ============================================================
// FIREBASE AUTHENTICATION
// Fill in your Firebase project config from:
// console.firebase.google.com → Project Settings → Your Apps
// ============================================================
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyD0Mcs52uZG4f6qPdeYGOhpYbLFq6j2anE",
    authDomain: "signups-e5d08.firebaseapp.com",
    projectId: "signups-e5d08",
    storageBucket: "signups-e5d08.firebasestorage.app",
    messagingSenderId: "430613621679",
    appId: "1:430613621679:web:8b45e2a9dcaa4998b7dd5a",
    measurementId: "G-3PG8M0RCVB"
};

// ============================================================
// EMAILJS  — free client-side email (200 emails/month free)
// Setup: https://www.emailjs.com
//   1. Create account & connect your Gmail / Outlook
//   2. Create an Email Template — use these variables:
//        {{to_name}}   {{to_email}}   {{order_ref}}
//        {{order_items}}   {{order_total}}
//   3. Paste your IDs below
// ============================================================
const EMAILJS_CONFIG = {
    publicKey: '8owMJfvNTD4m9CjkS',   // Account → General → Public Key
    serviceId: 'service_az5dzea',           // Email Services tab
    templateId: 'template_6cn963g'           // Email Templates tab
};

if (EMAILJS_CONFIG.publicKey && !EMAILJS_CONFIG.publicKey.startsWith('YOUR_')) {
    emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
}

// ============================================================
// STRIPE — real payment processing
// 1. Sign up free at https://stripe.com
// 2. Dashboard → Developers → API Keys
//    Paste pk_test_… (test) or pk_live_… (live) below
// 3. In Netlify: Site → Environment Variables → add
//      STRIPE_SECRET_KEY = sk_test_… (never put secret key here!)
// ============================================================
const STRIPE_CONFIG = {
    publishableKey: 'pk_test_51QzAXb2X1olQCjVK1ol0TDqtdw3Fh9TR1jRBKwZvht2aOREtOwosYkM9v57vnddMe96d4MDE2h0JU0Spsp0JUdkz001uWby7mz'
};

let stripe = null;
let stripeCard = null;
if (STRIPE_CONFIG.publishableKey && !STRIPE_CONFIG.publishableKey.startsWith('YOUR_')) {
    stripe = Stripe(STRIPE_CONFIG.publishableKey);
}

let auth = null;
let db = null;
try {
    const app = firebase.apps.length
        ? firebase.app()
        : firebase.initializeApp(FIREBASE_CONFIG);
    auth = app.auth();
    db = app.firestore();
} catch (e) {
    console.warn('Firebase init error:', e.message);
}

// 1. Data Architecture
const PRODUCTS = [
    // --- DRAWINGS SECTION ---
    {
        id: 'dr-1',
        name: 'Bunny Girl',
        price: 28.00,
        cat: 'Art',
        desc: 'Original traditional ink & graphite drawing on archival paper. Features dynamic character linework. Signed by the artist.',
        visual: 'url("images/drawing1.jpg")', // Path to your drawing image
        accentColor: '#9d00ff',
        stock: 'Original' // Since it's a drawing, there's only 1!
    },
    {
        id: 'dr-2',
        name: 'Seeing Through the Thin',
        price: 35,
        cat: 'Art',
        desc: 'An intense stare. This close up eye sketch was my 5th drawing. Trying to capture detail and emotion through dramatic lashes and shading.',
        visual: 'url("images/drawing2.jpg")',
        accentColor: '#ff0055',
        stock: 'Original'
    },
    {
        id: 'dr-3',
        name: 'Beauty within Chaos',
        price: 30.00,
        cat: 'Art',
        desc: 'An exploration of dramatic hair movement and raw expression. This 4th-ever archival piece captures the transition from learning to mastery.',
        visual: 'url("images/drawing3.jpg")', // Ensure this matches your file path
        accentColor: '#ff0055',
        stock: 'Original'
    },
    {
        id: 'dr-4',
        name: 'Demons in the Details',
        price: 40.00,
        cat: 'Art',
        desc: 'My 14th drawing ever and focused on capturing sharp horns, fluid hair, and a strong expression. Loved playing with the dark shading!',
        visual: 'url("images/drawing4.jpg")', // Ensure this matches your file path
        accentColor: '#ff0055',
        stock: 'Original'
    },
    // ... Repeat for 7 drawings total ...

    // --- POKEMON CARDS SECTION ---
    {
        id: 'pk-2',
        name: 'Krookodile EX // XY25',
        price: 10.00,
        cat: 'Collectibles',
        desc: 'XY Black Star Promo. Features the signature "Second Bite" and "Megaton Fang" moves. Holographic finish. Near Mint (NM).',
        visual: 'url("images/krookodile.jpg")', // Ensure this matches your filename
        accentColor: '#8b0000', // Deep Crimson to match the card's art
        stock: '1 Left'
    },
];

let state = {
    currentProduct: PRODUCTS[0],
    cart: [],
    currentSection: 'shop'
};

// 2. Initialization
window.onload = () => {
    renderRail(PRODUCTS);
    updateDisplay();

    // --- Cinematic Intro + Stagger Entrance ---
    setTimeout(() => {
        const curtain = document.getElementById('intro-curtain');
        if (curtain) {
            curtain.classList.add('dismissed');
            setTimeout(() => {
                curtain.remove();
                document.body.classList.add('ui-ready');
            }, 800);
        }
    }, 1900);

    // --- Ambient Particles ---
    (function initParticles() {
        const canvas = document.getElementById('particle-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);

        const pts = Array.from({ length: 28 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.1 + 0.3,
            vx: (Math.random() - 0.5) * 0.14,
            vy: (Math.random() - 0.5) * 0.14,
            o: Math.random() * 0.10 + 0.02
        }));

        (function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pts.forEach(p => {
                p.x = (p.x + p.vx + canvas.width) % canvas.width;
                p.y = (p.y + p.vy + canvas.height) % canvas.height;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${p.o})`;
                ctx.fill();
            });
            requestAnimationFrame(draw);
        })();
    })();

    // --- Custom Cursor ---
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    let ringX = window.innerWidth / 2, ringY = window.innerHeight / 2;
    let dotX = ringX, dotY = ringY;

    document.addEventListener('mousemove', e => {
        dotX = e.clientX;
        dotY = e.clientY;
        dot.style.left = dotX + 'px';
        dot.style.top = dotY + 'px';

        // Live spotlight
        const spotlight = document.getElementById('stage-spotlight');
        if (spotlight) {
            const xp = ((e.clientX / window.innerWidth) * 100).toFixed(1);
            const yp = ((e.clientY / window.innerHeight) * 100).toFixed(1);
            spotlight.style.background =
                `radial-gradient(circle at ${xp}% ${yp}%, #1f1f1f 0%, #030303 68%)`;
        }

        // Product display parallax
        const display = document.getElementById('main-display');
        if (display) {
            const xShift = ((e.clientX / window.innerWidth) - 0.5) * 14;
            const yShift = ((e.clientY / window.innerHeight) - 0.5) * 9;
            display.style.transform = `translate(${xShift}px, ${yShift}px)`;
        }
    });

    (function animateRing() {
        ringX += (dotX - ringX) * 0.11;
        ringY += (dotY - ringY) * 0.11;
        ring.style.left = ringX + 'px';
        ring.style.top = ringY + 'px';
        requestAnimationFrame(animateRing);
    })();

    document.addEventListener('mouseover', e => {
        const hoverable = e.target.closest('button, a, [onclick], .rail-item, .faq-item, input, label');
        document.body.classList.toggle('cursor-hovering', !!hoverable);
    });

    // --- Keyboard Shortcuts ---
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (document.getElementById('cart-sidebar').classList.contains('open')) toggleCart();
            else if (document.getElementById('auth-modal').classList.contains('open')) toggleAuth();
        }
        if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') &&
            document.getElementById('main-experience').style.display !== 'none') {
            const activeFilter = document.querySelector('.filter-opt.active');
            const filterCat = activeFilter ? activeFilter.innerText : 'Latest';
            const visible = filterCat === 'Latest'
                ? PRODUCTS
                : PRODUCTS.filter(p => p.cat === filterCat);
            const idx = visible.findIndex(p => p.id === state.currentProduct.id);
            const next = e.key === 'ArrowRight'
                ? visible[(idx + 1) % visible.length]
                : visible[(idx - 1 + visible.length) % visible.length];
            state.currentProduct = next;
            updateDisplay(true);
        }
    });

    // --- Firebase Auth State (persist login across page loads) ---
    if (auth) {
        auth.onAuthStateChanged(user => updateAuthUI(user));
    }
};

/**
 * SECTION NAVIGATION
 */
function showSection(sectionName) {
    const shopExperience = document.getElementById('main-experience');
    const contentOverlay = document.getElementById('content-overlay');

    // Close mobile nav
    const nav = document.querySelector('.central-nav');
    const ham = document.getElementById('hamburger');
    if (nav) nav.classList.remove('mobile-open');
    if (ham) ham.classList.remove('active');

    // Update nav active states
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.innerText.toLowerCase().includes(sectionName.toLowerCase()));
    });

    const currentEl = shopExperience.style.display !== 'none' ? shopExperience : contentOverlay;
    const isVisible = currentEl && currentEl.offsetParent !== null;

    const doSwitch = () => {
        if (sectionName === 'shop' || sectionName === 'collection') {
            contentOverlay.style.display = 'none';
            shopExperience.style.display = 'block';
            updateDisplay();
        } else {
            shopExperience.style.display = 'none';
            contentOverlay.style.display = 'flex';
            contentOverlay.innerHTML = getSectionHTML(sectionName);
            if (sectionName === 'account') loadOrders();
        }
    };

    if (isVisible) {
        currentEl.classList.add('section-exiting');
        setTimeout(() => { currentEl.classList.remove('section-exiting'); doSwitch(); }, 280);
    } else {
        doSwitch();
    }
}

function getSectionHTML(name) {
    if (name === 'about') return `
        <div class="about-content-fade">
            <span class="category-tag">Artist // Developer</span>
            <h2>Seally //<br>Creator</h2>
            <p class="description">
        Bridging the gap between traditional pencil artistry and 
        multi-platform development. From scripting for Roblox and GTA 
        to building mods and websites, I transform raw logic and 
        hand-drawn concepts into immersive digital experiences.
            </p>
            <button class="auth-close" onclick="showSection('shop')">Back to Shop</button>
        </div>`;

    if (name === 'studio') return `
        <div class="about-content-fade" style="max-width:900px;text-align:center;">
            <span class="category-tag">Seally &mdash; Creator</span>
            <h2>The<br>Studio</h2>
            <p class="description" style="margin:0 auto 40px;">
                Traditional pencil artist and multi-platform developer.
                I build for the web, for games, and for the page &mdash;
                whatever the medium, the craft comes first.
            </p>
            <div class="studio-grid">
                <div class="studio-card">
                    <span class="studio-card-number">01</span>
                    <h4>Traditional Art</h4>
                    <p>Pencil-on-paper illustration. Detailed, expressive work built without a single mouse click.</p>
                </div>
                <div class="studio-card">
                    <span class="studio-card-number">02</span>
                    <h4>Game Scripting</h4>
                    <p>Roblox UIs &amp; scripts, GTA mods, and game tooling &mdash; logic that makes worlds feel alive.</p>
                </div>
                <div class="studio-card">
                    <span class="studio-card-number">03</span>
                    <h4>Web &amp; Tools</h4>
                    <p>Websites, Discord themes, Tampermonkey QoL scripts &mdash; whatever needs building, gets built.</p>
                </div>
            </div>
            <a class="auth-close" href="https://sealient.github.io" target="_blank" rel="noopener" style="display:inline-block;margin-bottom:16px;">View Full Portfolio &rarr;</a>
            <br>
            <button class="auth-close" onclick="showSection('shop')">Back to Shop</button>
        </div>`;

    if (name === 'support') return `
        <div class="about-content-fade" style="max-width:700px;text-align:center;width:100%;">
            <span class="category-tag">Customer Care</span>
            <h2>Support</h2>
            <p class="description" style="margin:0 auto 0;">
                We stand behind every product.<br>Premium support for premium clients.
            </p>
            <div class="support-grid">
                <div class="faq-item" onclick="this.classList.toggle('open')">
                    <div class="faq-question"><span>What is your shipping policy?</span><span class="faq-icon">+</span></div>
                    <div class="faq-answer">All hardware orders ship within 3&ndash;5 business days via priority courier. Digital products are delivered instantly to your registered email.</div>
                </div>
                <div class="faq-item" onclick="this.classList.toggle('open')">
                    <div class="faq-question"><span>Do you offer returns?</span><span class="faq-icon">+</span></div>
                    <div class="faq-answer">Hardware items are eligible for a 30-day return window in original condition. Digital products are non-refundable once accessed.</div>
                </div>
                <div class="faq-item" onclick="this.classList.toggle('open')">
                    <div class="faq-question"><span>How do I access digital products?</span><span class="faq-icon">+</span></div>
                    <div class="faq-answer">Upon successful purchase, access credentials are delivered to your Aether account dashboard within minutes.</div>
                </div>
                <div class="faq-item" onclick="this.classList.toggle('open')">
                    <div class="faq-question"><span>Get in touch directly</span><span class="faq-icon">+</span></div>
                    <div class="faq-answer">Reach our team at support@aether.studio &mdash; guaranteed response within 24 hours.</div>
                </div>
            </div>
            <button class="auth-close" onclick="showSection('shop')">Back to Shop</button>
        </div>`;

    if (name === 'account') return `
        <div class="about-content-fade" style="max-width:720px;width:100%;text-align:left;">
            <span class="category-tag">My Account</span>
            <h2>Order<br>History</h2>
            <div id="orders-loading" class="orders-loading">Loading your orders&hellip;</div>
            <div id="orders-list"></div>
            <button class="auth-close" style="margin-top:28px" onclick="showSection('shop')">Back to Shop</button>
        </div>`;

    return '';
}

/**
 * SHOP ENGINE
 * Handles product switching and filtering
 */
function updateDisplay(animate = false) {
    const p = state.currentProduct;
    if (!p) return;

    const info = document.querySelector('.object-info');
    const display = document.getElementById('main-display');
    const glow = document.querySelector('.object-glow');

    const applyContent = () => {
        document.getElementById('obj-name').innerText = p.name;
        document.getElementById('obj-cat').innerText = p.cat;
        document.getElementById('obj-desc').innerText = p.desc;
        document.getElementById('obj-price').innerText = `$${p.price.toLocaleString()}`;

        if (display && p.visual) display.style.background = p.visual;
        if (glow && p.accentColor) glow.style.background = p.accentColor;

        const stockEl = document.getElementById('obj-stock');
        if (stockEl) {
            stockEl.innerText = p.stock || 'In Stock';
            stockEl.className = 'stock-badge' + (p.stock === 'Low Stock' ? ' low' : p.stock === 'Sold Out' ? ' out' : '');
        }

        document.querySelectorAll('.rail-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === p.id);
        });

        if (animate && info) {
            info.classList.remove('info-switching');
            info.classList.add('info-entering');
            setTimeout(() => info.classList.remove('info-entering'), 600);
        }
    };

    if (animate && info) {
        info.classList.add('info-switching');
        setTimeout(applyContent, 200);
    } else {
        applyContent();
    }
}

function setFilter(category, element) {
    // UI Visual Feedback for Top Nav
    document.querySelectorAll('.filter-opt').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');

    // Filtering logic
    const filtered = (category === 'All')
        ? PRODUCTS
        : PRODUCTS.filter(p => p.cat === category);

    renderRail(filtered);

    // Auto-select first item in new category if current item is hidden
    if (filtered.length > 0 && !filtered.find(p => p.id === state.currentProduct.id)) {
        state.currentProduct = filtered[0];
        updateDisplay();
    }
}

// Helper to render the dynamic category buttons
function initCategoryMenu() {
    const shelf = document.querySelector('.filter-shelf');
    const categories = ['All', ...new Set(PRODUCTS.map(p => p.cat))];

    shelf.innerHTML = categories.map(cat => `
        <button class="filter-opt ${cat === 'All' ? 'active' : ''}" 
                onclick="setFilter('${cat}', this)">
            ${cat}
        </button>
    `).join('');
}

function renderDynamicFilters() {
    const filterShelf = document.querySelector('.filter-shelf');
    // Extract unique categories from your product list
    const categories = ['All', ...new Set(PRODUCTS.map(p => p.cat))];

    filterShelf.innerHTML = categories.map(cat => `
        <button class="filter-opt ${cat === 'All' ? 'active' : ''}" 
                onclick="setFilter('${cat}', this)">
            ${cat.toUpperCase()}
        </button>
    `).join('');
}

function applyAdvancedFilters() {
    const cat = document.querySelector('.filter-opt.active').innerText;
    const maxPrice = document.getElementById('price-range').value;
    const sortBy = document.getElementById('sort-dropdown').value;

    // Update Slider Label
    document.getElementById('range-val').innerText = `$${maxPrice}`;

    let filtered = PRODUCTS.filter(p => {
        const matchesCat = (cat === 'ALL' || p.cat.toUpperCase() === cat);
        const matchesPrice = p.price <= maxPrice;
        return matchesCat && matchesPrice;
    });

    // Sorting
    if (sortBy === 'price-low') filtered.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') filtered.sort((a, b) => b.price - a.price);

    renderRail(filtered);

    // UI Snap
    if (filtered.length > 0 && !filtered.find(p => p.id === state.currentProduct.id)) {
        state.currentProduct = filtered[0];
        updateDisplay();
    }
}

// Call this once when the page loads
renderDynamicFilters();

function renderRail(items) {
    const rail = document.getElementById('selection-rail');
    rail.innerHTML = '';

    items.forEach(item => {
        const div = document.createElement('div');
        const isActive = state.currentProduct && state.currentProduct.id === item.id;

        div.className = `rail-item ${isActive ? 'active' : ''}`;
        div.dataset.id = item.id;

        div.onclick = () => {
            state.currentProduct = item;
            updateDisplay(true);
        };

        // We clean the visual string to ensure it uses single quotes internally
        const cleanVisual = item.visual.replace(/"/g, "'");

        div.innerHTML = `
            <div class="thumb-box" style="background-image: ${cleanVisual}; background-size: cover; background-position: center;"></div>
            <span class="thumb-label">${item.name}</span>
        `;
        rail.appendChild(div);
    });
}

/**
 * UI MODALS
 * Handles Cart Sidebar and Auth Modal
 */
function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('open');
    document.getElementById('cart-overlay').classList.toggle('active');
}

function toggleAuth() {
    document.getElementById('auth-modal').classList.toggle('open');
    document.getElementById('auth-overlay').classList.toggle('active');
}

function switchAuth(mode) {
    const content = document.querySelector('.auth-content');
    content.classList.add('switching');

    setTimeout(() => {
        const isLogin = mode === 'login';
        document.getElementById('tab-login').classList.toggle('active', isLogin);
        document.getElementById('tab-signup').classList.toggle('active', !isLogin);

        const indicator = document.getElementById('auth-tab-indicator');
        if (indicator) indicator.classList.toggle('right', !isLogin);

        document.getElementById('auth-title').innerText = isLogin ? 'Welcome Back' : 'Create Account';
        document.getElementById('auth-subtitle').innerText = isLogin
            ? 'Secure access to your Aether prestige account.'
            : 'Begin your journey with Aether Prestige.';
        document.getElementById('auth-submit').innerText = isLogin ? 'Continue' : 'Join Aether';

        const confirmGroup = document.getElementById('confirm-pass-group');
        confirmGroup.classList.toggle('visible', !isLogin);

        content.classList.remove('switching');
    }, 260);
}

/**
 * CART LOGIC  (qty-based)
 * state.cart = [ { product, qty }, ... ]
 */
function addToBag() {
    const existing = state.cart.find(i => i.product.id === state.currentProduct.id);
    if (existing) {
        existing.qty++;
    } else {
        state.cart.push({ product: state.currentProduct, qty: 1 });
    }
    renderCart();
    showToast(`${state.currentProduct.name} added`);

    // Confirm state on button
    const btn = document.querySelector('.buy-trigger');
    if (btn) {
        btn.innerText = '✓  Added';
        btn.classList.add('confirmed');
        setTimeout(() => { btn.innerText = 'Add to Cart'; btn.classList.remove('confirmed'); }, 1500);
    }

    // Badge pulse
    const bag = document.querySelector('.bag-status');
    if (bag) {
        bag.classList.remove('pulse');
        void bag.offsetWidth;
        bag.classList.add('pulse');
    }

    if (!document.getElementById('cart-sidebar').classList.contains('open')) {
        toggleCart();
    }
}

function updateQty(productId, delta) {
    const item = state.cart.find(i => i.product.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) state.cart = state.cart.filter(i => i.product.id !== productId);
    renderCart();
}

function renderCart() {
    const count = state.cart.reduce((s, i) => s + i.qty, 0);
    document.getElementById('bag-count').innerText = count;

    const list = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total');

    if (state.cart.length === 0) {
        list.innerHTML = `
            <div class="empty-cart-state">
                <p class="empty-msg">Your cart is empty.</p>
                <button class="auth-close" style="margin-top:16px" onclick="toggleCart()">Browse the Shop &rarr;</button>
            </div>`;
        totalEl.innerText = '$0';
        return;
    }

    list.innerHTML = state.cart.map(({ product: p, qty }) => `
        <div class="cart-item">
            <div class="cart-item-thumb" style="background: ${p.visual || 'var(--glass)'}"></div>
            <div class="cart-item-info">
                <h4>${p.name}</h4>
                <p>$${p.price.toLocaleString()}</p>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="updateQty('${p.id}', -1)">&#8722;</button>
                    <span class="qty-value">${qty}</span>
                    <button class="qty-btn" onclick="updateQty('${p.id}', 1)">&#43;</button>
                </div>
            </div>
        </div>
    `).join('');

    const total = state.cart.reduce((s, i) => s + i.product.price * i.qty, 0);
    totalEl.innerText = `$${total.toLocaleString()}`;
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('leaving');
        setTimeout(() => toast.remove(), 400);
    }, 2200);
}

function toggleMobileNav() {
    document.querySelector('.central-nav').classList.toggle('mobile-open');
    document.getElementById('hamburger').classList.toggle('active');
}

// ============================================================
// FIREBASE AUTH HANDLERS
// ============================================================
function updateAuthUI(user) {
    const grp = document.querySelector('.auth-group');
    if (!grp) return;
    if (user) {
        const name = (user.displayName || user.email.split('@')[0]);
        grp.innerHTML = `
            <span class="auth-user-name" onclick="showSection('account')" title="My Orders">${name}</span>
            <button class="auth-link signup" onclick="handleSignOut()">Sign Out</button>
        `;
    } else {
        grp.innerHTML = `
            <button class="auth-link" onclick="toggleAuth()">Login</button>
            <button class="auth-link signup" onclick="toggleAuth()">Sign Up</button>
        `;
    }
}

function handleAuthSubmit(e) {
    e.preventDefault();
    if (!auth) { showToast('Auth not configured — fill in FIREBASE_CONFIG'); return; }

    const email = document.querySelector('#auth-form input[type="email"]').value.trim();
    const password = document.querySelector('#auth-form input[type="password"]').value;
    const isLogin = document.getElementById('tab-login').classList.contains('active');
    const btn = document.getElementById('auth-submit');

    btn.disabled = true;
    btn.innerText = 'Please wait…';

    const op = isLogin
        ? auth.signInWithEmailAndPassword(email, password)
        : auth.createUserWithEmailAndPassword(email, password);

    op.then(cred => {
        updateAuthUI(cred.user);   // Update header immediately — don’t wait for listener
        toggleAuth();
        showToast(isLogin ? 'Welcome back' : 'Account created — welcome to Aether');
        btn.disabled = false;
        btn.innerText = isLogin ? 'Continue' : 'Join Aether';
    }).catch(err => {
        btn.disabled = false;
        btn.innerText = isLogin ? 'Continue' : 'Join Aether';
        const msgs = {
            'auth/user-not-found': 'No account found with that email.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-credential': 'Incorrect email or password.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password must be at least 6 characters.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
        };
        showToast(msgs[err.code] || 'Something went wrong. Please try again.');
    });
}

function handleSignOut() {
    if (auth) auth.signOut().then(() => { updateAuthUI(null); showToast('Signed out'); });
}

// ============================================================
// CHECKOUT ENGINE
// ============================================================
let coStep = 1;

function openCheckout() {
    if (state.cart.length === 0) { showToast('Your cart is empty'); return; }
    coStep = 1;
    populateReview();
    const total = state.cart.reduce((s, i) => s + i.product.price * i.qty, 0);
    const payAmt = document.getElementById('co-pay-amt');
    if (payAmt) payAmt.innerText = `$${total.toLocaleString()}`;
    const payBtn = document.getElementById('co-pay-btn');
    if (payBtn) {
        payBtn.innerHTML = total === 0
            ? 'Place Order &mdash; Free'
            : `Pay <span>$${total.toLocaleString()}</span>`;
    }
    showCoStep(1);
    document.getElementById('checkout-modal').classList.add('open');
    document.getElementById('checkout-overlay').classList.add('active');
    // Close cart sidebar first
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('active');
}

function closeCheckout() {
    document.getElementById('checkout-modal').classList.remove('open');
    document.getElementById('checkout-overlay').classList.remove('active');
}

function closeCheckoutAndClear() {
    state.cart = [];
    renderCart();
    closeCheckout();
}

function populateReview() {
    const list = document.getElementById('co-items');
    if (!list) return;
    list.innerHTML = state.cart.map(({ product: p, qty }) => `
        <div class="co-item-row">
            <div class="co-item-thumb" style="background:${p.visual}"></div>
            <div>
                <h5>${p.name}</h5>
                <span>Qty ${qty} &mdash; ${p.cat}</span>
            </div>
            <span class="co-item-price">$${(p.price * qty).toLocaleString()}</span>
        </div>
    `).join('');
    const total = state.cart.reduce((s, i) => s + i.product.price * i.qty, 0);
    document.getElementById('co-total-display').innerText = `$${total.toLocaleString()}`;
}

function checkoutStep(n) {
    showCoStep(n);
}

function showCoStep(n) {
    for (let i = 1; i <= 4; i++) {
        const panel = document.getElementById(`co-p${i}`);
        const prog = document.getElementById(`cop-${i}`);
        const line = document.getElementById(`copl-${i}`);
        if (panel) panel.classList.toggle('co-hidden', i !== n);
        if (prog) { prog.classList.toggle('active', i === n); prog.classList.toggle('done', i < n); }
        if (line) { line.classList.toggle('done', i < n); }
    }
    coStep = n;
    // Scroll modal body back to top
    const body = document.querySelector('.co-body');
    if (body) body.scrollTop = 0;
    // Pre-fill email from logged-in user
    if (n === 2 && auth && auth.currentUser) {
        const ef = document.getElementById('co-email');
        if (ef && !ef.value) ef.value = auth.currentUser.email;
    }
    // Mount Stripe card element when payment step becomes visible
    if (n === 3) setTimeout(mountStripeCard, 80);
}

// ============================================================
// CARD VALIDATION
// ============================================================
function luhn(num) {
    let sum = 0, alt = false;
    for (let i = num.length - 1; i >= 0; i--) {
        let n = parseInt(num[i], 10);
        if (alt) { n *= 2; if (n > 9) n -= 9; }
        sum += n; alt = !alt;
    }
    return sum % 10 === 0;
}

function detectCardType(num) {
    const n = num.replace(/\s/g, '');
    if (/^4/.test(n)) return 'VISA';
    if (/^(5[1-5]|2[2-7]\d{2})/.test(n)) return 'MC';
    if (/^3[47]/.test(n)) return 'AMEX';
    if (/^(6011|65|64[4-9])/.test(n)) return 'DISC';
    return '';
}

function onCardNumInput(el) {
    const raw = el.value.replace(/\D/g, '').substr(0, 16);
    const isAmex = /^3[47]/.test(raw);
    // Single space between groups so 16-digit cards fit in maxlength="19"
    el.value = isAmex
        ? raw.replace(/^(\d{4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '))
        : raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    const badge = document.getElementById('ctype-badge');
    if (badge) badge.innerText = detectCardType(raw);
}

function onExpiryInput(el) {
    const raw = el.value.replace(/\D/g, '').substr(0, 4);
    el.value = raw.length >= 3 ? raw.substr(0, 2) + ' / ' + raw.substr(2) : raw;
}

async function submitPayment() {
    const total = state.cart.reduce((s, i) => s + i.product.price * i.qty, 0);
    const isFree = total === 0;
    const email = (document.getElementById('co-email')?.value || '').trim();
    const firstName = document.getElementById('co-fname')?.value || 'Valued Customer';
    const lastName  = document.getElementById('co-lname')?.value || '';
    const name = `${firstName} ${lastName}`.trim();

    if (!email) { showToast('Please enter your email'); return; }

    const usingStripe = !!(stripe && stripeCard);

    // ── DEBUG ──────────────────────────────────────────────────────────────
    console.group('%c[Aether] submitPayment', 'color:#c9a96e;font-weight:bold');
    console.log('total        :', total);
    console.log('isFree       :', isFree);
    console.log('stripe obj   :', stripe);
    console.log('stripeCard   :', stripeCard);
    console.log('usingStripe  :', usingStripe);
    console.log('email        :', email);
    console.groupEnd();
    // ───────────────────────────────────────────────────────────────────────

    // Manual card validation (only when Stripe Element is not mounted)
    if (!isFree && !usingStripe) {
        const cnum = document.getElementById('co-cnum')?.value.replace(/\s/g, '') || '';
        const exp  = document.getElementById('co-exp')?.value || '';
        const cvv  = document.getElementById('co-cvv')?.value || '';
        if (!luhn(cnum)) { showToast('Invalid card number'); return; }
        const parts = exp.replace(/\s/g, '').split('/');
        const mm = parseInt(parts[0], 10);
        const yy = parseInt(parts[1], 10);
        const expYear = 2000 + (yy || 0);
        const now = new Date();
        if (!mm || !yy || expYear < now.getFullYear() ||
            (expYear === now.getFullYear() && mm < now.getMonth() + 1)) {
            showToast('Card expiry is invalid or in the past'); return;
        }
        if (!cvv || cvv.length < 3) { showToast('Invalid CVV'); return; }
    }

    const btn = document.getElementById('co-pay-btn');
    btn.disabled = true;
    btn.innerHTML = 'Processing...';
    btn.classList.add('processing');

    const ref = 'AE-' + Math.random().toString(36).substr(2, 8).toUpperCase();

    // ── Inner function: runs after payment is confirmed ──────────────────
    const completeOrder = async () => {
        document.getElementById('co-ref').innerText = ref;

        // Save order to Firestore
        const orderData = {
            ref,
            items: state.cart.map(i => ({
                name:  i.product.name,
                price: i.product.price,
                qty:   i.qty,
                cat:   i.product.cat
            })),
            total,
            email,
            name,
            address:   document.getElementById('co-addr')?.value || '',
            city:      document.getElementById('co-city')?.value || '',
            postCode:  document.getElementById('co-post')?.value || '',
            status:    'completed',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (db && auth?.currentUser) {
            try {
                await db.collection('users').doc(auth.currentUser.uid)
                    .collection('orders').doc(ref).set(orderData);
            } catch(e) { console.warn('Firestore save failed:', e.message); }
        }

        // Build items text for email
        const itemsText = state.cart
            .map(i => `${i.product.name} x${i.qty} — $${(i.product.price * i.qty).toLocaleString()}`)
            .join('\n');

        // mailto fallback (always available)
        const mailtoBody = [
            `Hi ${firstName},`, ``,
            `Your Aether order has been placed.`, ``,
            `Order Reference: ${ref}`, ``,
            `Items:`,
            ...state.cart.map(i => `  ${i.product.name} x${i.qty}  —  $${(i.product.price * i.qty).toLocaleString()}`),
            ``, `Total: $${total.toLocaleString()}`, ``,
            `Thank you for your order.`, `— Aether Prestige`
        ].join('\n');
        window._lastOrderMailto = `mailto:${email}?subject=Your+Aether+Order+%E2%80%94+${ref}&body=${encodeURIComponent(mailtoBody)}`;
        const mailBtn = document.getElementById('co-mailto-btn');
        if (mailBtn) { mailBtn.style.display = 'inline-block'; mailBtn.href = window._lastOrderMailto; }

        // Send confirmation email — 3-tier fallback
        if (email) {
            const emailPayload = {
                to_name:     firstName,
                to_email:    email,
                order_ref:   ref,
                order_items: itemsText,
                order_total: `$${total.toLocaleString()}`
            };
            fetch('/.netlify/functions/send-order-email', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(emailPayload)
            })
            .then(r => r.json())
            .then(json => {
                if (json.success) { showToast('Confirmation email sent ✓'); }
                else { throw new Error(json.error || 'Email function error'); }
            })
            .catch(() => {
                // Tier 2: EmailJS
                emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, emailPayload)
                    .then(() => showToast('Confirmation email sent ✓'))
                    .catch(() => { window.open(window._lastOrderMailto); });
            });
        }

        showCoStep(4);
        state.cart = [];
        renderCart();
    };
    // ─────────────────────────────────────────────────────────────────────

    // Free order — skip Stripe (Stripe minimum is $0.50)
    if (isFree) {
        setTimeout(completeOrder, 1200);
        return;
    }

    // Real charge via Stripe
    if (usingStripe) {
        try {
            let resp;
            try {
                console.log('[Aether] → fetching create-payment-intent, amount:', total);
                resp = await fetch('/.netlify/functions/create-payment-intent', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ amount: total, currency: 'usd', metadata: { ref, email } })
                });
                console.log('[Aether] ← function response status:', resp.status);
            } catch(fetchErr) {
                console.error('[Aether] fetch threw:', fetchErr);
                throw new Error('Could not reach the payment server. Disable any ad blocker for this site and try again.');
            }

            if (!resp.ok) {
                let errMsg = `Server error (${resp.status})`;
                try { const j = await resp.json(); console.error('[Aether] error body:', j); if (j.error) errMsg = j.error; } catch(_) {}
                throw new Error(errMsg);
            }

            const json = await resp.json();
            console.log('[Aether] function JSON:', json);
            if (json.error) throw new Error(json.error);
            if (!json.clientSecret) throw new Error('No client secret returned from payment server.');

            console.log('[Aether] → calling stripe.confirmCardPayment');
            const { error, paymentIntent } = await stripe.confirmCardPayment(json.clientSecret, {
                payment_method: { card: stripeCard, billing_details: { name, email } }
            });
            console.log('[Aether] ← confirmCardPayment result — error:', error, 'intent status:', paymentIntent?.status);

            if (error) {
                showToast(error.message);
                btn.classList.remove('processing');
                btn.disabled = false;
                btn.innerHTML = `Pay <span>$${total.toLocaleString()}</span>`;
                return;
            }

            if (paymentIntent.status === 'succeeded') await completeOrder();

        } catch(e) {
            console.error('Payment error:', e);
            showToast(e.message || 'Payment failed — please try again');
            btn.classList.remove('processing');
            btn.disabled = false;
            btn.innerHTML = `Pay <span>$${total.toLocaleString()}</span>`;
        }
    } else {
        // Stripe not yet configured — simulate only (no real charge)
        console.warn('[Aether] usingStripe=false — stripe:', !!stripe, 'stripeCard:', !!stripeCard, '— running simulated complete');
        setTimeout(completeOrder, 1800);
    }
}



// ============================================================
// STRIPE ELEMENTS — layers on top of manual fields when configured
// ============================================================
function mountStripeCard() {
    if (!stripe) return; // Manual fields are always visible as fallback

    const container = document.getElementById('stripe-card-element');
    if (!container) return;

    // Show Stripe wrap, hide manual fields
    const manualWrap = document.getElementById('manual-card-fields');
    const stripeWrap = document.getElementById('stripe-card-wrap');
    if (manualWrap) manualWrap.style.display = 'none';
    if (stripeWrap) stripeWrap.style.display = 'block';

    // Destroy existing element before remounting (prevents duplicates)
    if (stripeCard) { stripeCard.destroy(); stripeCard = null; }

    const elements = stripe.elements({
        fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap' }]
    });

    stripeCard = elements.create('card', {
        hidePostalCode: true,
        style: {
            base: {
                color: '#e8e8e8',
                fontFamily: '"Inter", system-ui, sans-serif',
                fontSize: '14px',
                fontSmoothing: 'antialiased',
                '::placeholder': { color: 'rgba(255,255,255,0.28)' },
                iconColor: 'rgba(255,255,255,0.45)'
            },
            invalid: { color: '#ff5555', iconColor: '#ff5555' }
        }
    });

    stripeCard.mount(container);
    stripeCard.on('change', e => {
        const err = document.getElementById('stripe-card-errors');
        if (err) err.innerText = e.error ? e.error.message : '';
    });
}

// ============================================================
// TRANSACTION HISTORY (Firestore)
// ============================================================
async function loadOrders() {
    const listEl = document.getElementById('orders-list');
    const loadingEl = document.getElementById('orders-loading');
    if (!listEl) return;

    if (!auth || !auth.currentUser) {
        if (loadingEl) loadingEl.style.display = 'none';
        listEl.innerHTML = `
            <div class="orders-empty">
                <p class="description" style="text-align:center;margin-bottom:20px">
                    Sign in to see your order history.
                </p>
                <button class="auth-close" onclick="toggleAuth()">Sign In &rarr;</button>
            </div>`;
        return;
    }

    if (!db) {
        if (loadingEl) loadingEl.style.display = 'none';
        listEl.innerHTML = `<p class="description" style="text-align:center">Firestore not initialised.</p>`;
        return;
    }

    try {
        const snap = await db.collection('users')
            .doc(auth.currentUser.uid)
            .collection('orders')
            .orderBy('timestamp', 'desc')
            .get();

        if (loadingEl) loadingEl.style.display = 'none';

        if (snap.empty) {
            listEl.innerHTML = `
                <div class="orders-empty">
                    <p class="description" style="text-align:center;margin-bottom:20px">
                        No orders yet &mdash; your purchases will appear here.
                    </p>
                    <button class="auth-close" onclick="showSection('shop')">Start Shopping &rarr;</button>
                </div>`;
            return;
        }

        listEl.innerHTML = snap.docs.map(doc => {
            const o = doc.data();
            const date = o.timestamp?.toDate
                ? o.timestamp.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : 'Recently';
            const lineItems = (o.items || []).map(i =>
                `<div class="order-item-line">
                    <span>${i.name} &times; ${i.qty}</span>
                    <span>$${(i.price * i.qty).toLocaleString()}</span>
                </div>`
            ).join('');

            return `
                <div class="order-card">
                    <div class="order-card-head">
                        <div>
                            <span class="order-ref">${o.ref || doc.id}</span>
                            <span class="order-date">${date}</span>
                        </div>
                        <span class="order-total-badge">$${(o.total || 0).toLocaleString()}</span>
                    </div>
                    <div class="order-items-detail">${lineItems}</div>
                    <div class="order-card-foot">
                        <span class="order-status-done">&#10003;&nbsp; Completed</span>
                        ${o.email ? `<span class="order-foot-email">${o.email}</span>` : ''}
                    </div>
                </div>`;
        }).join('');

    } catch (e) {
        if (loadingEl) loadingEl.style.display = 'none';
        listEl.innerHTML = `<p class="description" style="text-align:center">
            Could not load orders: ${e.message}
        </p>`;
    }
}