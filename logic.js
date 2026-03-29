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
    apiKey:            "YOUR_API_KEY",
    authDomain:        "YOUR_PROJECT.firebaseapp.com",
    projectId:         "YOUR_PROJECT_ID",
    storageBucket:     "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId:             "YOUR_APP_ID"
};

let auth = null;
try {
    if (FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY') {
        firebase.initializeApp(FIREBASE_CONFIG);
        auth = firebase.auth();
    }
} catch(e) {
    console.warn('Firebase init error:', e.message);
}

// 1. Data Architecture
const PRODUCTS = [
    { 
        id: '1', 
        name: 'Obsidian Core', 
        price: 1200, 
        cat: 'Hardware', 
        desc: 'Our flagship hardware interface. Hand-crafted from aerospace-grade materials with seamless haptic integration.',
        visual: 'radial-gradient(ellipse at 25% 75%, #2d0050 0%, #080808 55%), radial-gradient(ellipse at 75% 15%, #1a0033 0%, transparent 55%)',
        accentColor: '#9d00ff',
        stock: 'In Stock'
    },
    { 
        id: '2', 
        name: 'Neural Link', 
        price: 450, 
        cat: 'Digital', 
        desc: 'High-speed data transfer module designed for low-latency neural processing environments.',
        visual: 'radial-gradient(ellipse at 70% 30%, #001a3d 0%, #080808 55%), radial-gradient(ellipse at 20% 75%, #00264d 0%, transparent 55%)',
        accentColor: '#0077ff',
        stock: 'Low Stock'
    },
    { 
        id: '3', 
        name: 'Void Interface', 
        price: 890, 
        cat: 'Hardware', 
        desc: 'Minimalist control surface featuring ultra-responsive tactile feedback and glass-top finish.',
        visual: 'radial-gradient(ellipse at 50% 50%, #181818 0%, #080808 70%), radial-gradient(ellipse at 80% 80%, #222 0%, transparent 40%)',
        accentColor: '#cccccc',
        stock: 'In Stock'
    },
    { 
        id: '4', 
        name: 'Asset Pack 01', 
        price: 120, 
        cat: 'Digital', 
        desc: 'A curated collection of digital textures and shaders for high-end visual production.',
        visual: 'radial-gradient(ellipse at 40% 60%, #001a0d 0%, #080808 55%), radial-gradient(ellipse at 75% 20%, #003319 0%, transparent 55%)',
        accentColor: '#00cc66',
        stock: 'In Stock'
    }
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
                p.x = (p.x + p.vx + canvas.width)  % canvas.width;
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
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    let ringX = window.innerWidth / 2, ringY = window.innerHeight / 2;
    let dotX  = ringX, dotY = ringY;

    document.addEventListener('mousemove', e => {
        dotX = e.clientX;
        dotY = e.clientY;
        dot.style.left = dotX + 'px';
        dot.style.top  = dotY + 'px';

        // Live spotlight
        const spotlight = document.getElementById('stage-spotlight');
        if (spotlight) {
            const xp = ((e.clientX / window.innerWidth)  * 100).toFixed(1);
            const yp = ((e.clientY / window.innerHeight) * 100).toFixed(1);
            spotlight.style.background =
                `radial-gradient(circle at ${xp}% ${yp}%, #1f1f1f 0%, #030303 68%)`;
        }

        // Product display parallax
        const display = document.getElementById('main-display');
        if (display) {
            const xShift = ((e.clientX / window.innerWidth)  - 0.5) * 14;
            const yShift = ((e.clientY / window.innerHeight) - 0.5) * 9;
            display.style.transform = `translate(${xShift}px, ${yShift}px)`;
        }
    });

    (function animateRing() {
        ringX += (dotX - ringX) * 0.11;
        ringY += (dotY - ringY) * 0.11;
        ring.style.left = ringX + 'px';
        ring.style.top  = ringY + 'px';
        requestAnimationFrame(animateRing);
    })();

    document.addEventListener('mouseover', e => {
        const hoverable = e.target.closest('button, a, [onclick], .rail-item, .faq-item, input, label');
        document.body.classList.toggle('cursor-hovering', !!hoverable);
    });

    // --- Keyboard Shortcuts ---
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (document.getElementById('cart-sidebar').classList.contains('open'))  toggleCart();
            else if (document.getElementById('auth-modal').classList.contains('open')) toggleAuth();
        }
        if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') &&
             document.getElementById('main-experience').style.display !== 'none') {
            const activeFilter = document.querySelector('.filter-opt.active');
            const filterCat = activeFilter ? activeFilter.innerText : 'Latest';
            const visible = filterCat === 'Latest'
                ? PRODUCTS
                : PRODUCTS.filter(p => p.cat === filterCat);
            const idx  = visible.findIndex(p => p.id === state.currentProduct.id);
            const next = e.key === 'ArrowRight'
                ? visible[(idx + 1) % visible.length]
                : visible[(idx - 1 + visible.length) % visible.length];
            state.currentProduct = next;
            updateDisplay(true);
        }
    });
};

/**
 * SECTION NAVIGATION
 */
function showSection(sectionName) {
    const shopExperience = document.getElementById('main-experience');
    const contentOverlay  = document.getElementById('content-overlay');

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
    const isVisible  = currentEl && currentEl.offsetParent !== null;

    const doSwitch = () => {
        if (sectionName === 'shop' || sectionName === 'collection') {
            contentOverlay.style.display = 'none';
            shopExperience.style.display = 'block';
            updateDisplay();
        } else {
            shopExperience.style.display = 'none';
            contentOverlay.style.display = 'flex';
            contentOverlay.innerHTML = getSectionHTML(sectionName);
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

    return '';
}

/**
 * SHOP ENGINE
 * Handles product switching and filtering
 */
function updateDisplay(animate = false) {
    const p = state.currentProduct;
    if (!p) return;

    const info    = document.querySelector('.object-info');
    const display = document.getElementById('main-display');
    const glow    = document.querySelector('.object-glow');

    const applyContent = () => {
        document.getElementById('obj-name').innerText  = p.name;
        document.getElementById('obj-cat').innerText   = p.cat;
        document.getElementById('obj-desc').innerText  = p.desc;
        document.getElementById('obj-price').innerText = `$${p.price.toLocaleString()}`;

        if (display && p.visual)      display.style.background = p.visual;
        if (glow    && p.accentColor) glow.style.background    = p.accentColor;

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
    // UI Visual Feedback
    document.querySelectorAll('.filter-opt').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');

    const filtered = (category === 'All') 
        ? PRODUCTS 
        : PRODUCTS.filter(p => p.cat === category);

    renderRail(filtered);

    // If current product isn't in filtered list, snap to first available
    if (filtered.length > 0 && !filtered.find(p => p.id === state.currentProduct.id)) {
        state.currentProduct = filtered[0];
        updateDisplay();
    }
}

function renderRail(items) {
    const rail = document.getElementById('selection-rail');
    rail.innerHTML = '';

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = `rail-item ${state.currentProduct.id === item.id ? 'active' : ''}`;
        div.dataset.id = item.id;
        div.onclick = () => {
            state.currentProduct = item;
            updateDisplay(true);
        };
        div.innerHTML = `
            <div class="thumb-box" style="background: ${item.visual || ''}; background-size: cover;"></div>
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

    const list    = document.getElementById('cart-items-list');
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
function handleAuthSubmit(e) {
    e.preventDefault();
    if (!auth) { showToast('Auth not configured — fill in FIREBASE_CONFIG'); return; }

    const email    = document.querySelector('#auth-form input[type="email"]').value.trim();
    const password = document.querySelector('#auth-form input[type="password"]').value;
    const isLogin  = document.getElementById('tab-login').classList.contains('active');
    const btn      = document.getElementById('auth-submit');

    btn.disabled = true;
    btn.innerText = 'Please wait...';

    const op = isLogin
        ? auth.signInWithEmailAndPassword(email, password)
        : auth.createUserWithEmailAndPassword(email, password);

    op.then(() => {
        toggleAuth();
        showToast(isLogin ? 'Welcome back' : 'Account created — welcome to Aether');
        btn.disabled = false;
        btn.innerText = isLogin ? 'Continue' : 'Join Aether';
    }).catch(err => {
        btn.disabled = false;
        btn.innerText = isLogin ? 'Continue' : 'Join Aether';
        const msgs = {
            'auth/user-not-found':       'No account found with that email.',
            'auth/wrong-password':       'Incorrect password. Please try again.',
            'auth/invalid-credential':   'Incorrect email or password.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password':        'Password must be at least 6 characters.',
            'auth/invalid-email':        'Please enter a valid email address.',
            'auth/too-many-requests':    'Too many attempts. Please try again later.',
        };
        showToast(msgs[err.code] || 'Something went wrong. Please try again.');
    });
}

function handleSignOut() {
    if (auth) auth.signOut().then(() => showToast('Signed out'));
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
        const prog  = document.getElementById(`cop-${i}`);
        const line  = document.getElementById(`copl-${i}`);
        if (panel) panel.classList.toggle('co-hidden', i !== n);
        if (prog)  { prog.classList.toggle('active', i === n); prog.classList.toggle('done', i < n); }
        if (line)  { line.classList.toggle('done', i < n); }
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
    if (/^4/.test(n))                      return 'VISA';
    if (/^(5[1-5]|2[2-7]\d{2})/.test(n)) return 'MC';
    if (/^3[47]/.test(n))                  return 'AMEX';
    if (/^(6011|65|64[4-9])/.test(n))     return 'DISC';
    return '';
}

function onCardNumInput(el) {
    const raw   = el.value.replace(/\D/g, '').substr(0, 16);
    const isAmex = /^3[47]/.test(raw);
    el.value = isAmex
        ? raw.replace(/^(\d{4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join('  '))
        : raw.replace(/(\d{4})(?=\d)/g, '$1  ');
    const badge = document.getElementById('ctype-badge');
    if (badge) badge.innerText = detectCardType(raw);
}

function onExpiryInput(el) {
    const raw = el.value.replace(/\D/g, '').substr(0, 4);
    el.value  = raw.length >= 3 ? raw.substr(0, 2) + ' / ' + raw.substr(2) : raw;
}

function submitPayment() {
    const num  = document.getElementById('co-cnum').value.replace(/\s/g, '');
    const exp  = document.getElementById('co-exp').value;
    const cvv  = document.getElementById('co-cvv').value;
    const name = document.getElementById('co-cname').value.trim();

    // Luhn check
    if (num.length < 13 || !luhn(num)) { showToast('Invalid card number'); return; }

    // Expiry check
    const parts = exp.replace(/\s/g, '').split('/');
    const mm = parseInt(parts[0], 10);
    const yy = parseInt(parts[1], 10);
    const expDate = new Date(2000 + yy, mm);
    if (!mm || !yy || mm > 12 || expDate <= new Date()) { showToast('Card expired or invalid expiry'); return; }

    // CVV check
    if (cvv.length < 3) { showToast('Invalid CVV'); return; }

    // Name check
    if (!name) { showToast('Please enter the name on your card'); return; }

    const btn = document.getElementById('co-pay-btn');
    btn.classList.add('processing');
    btn.innerHTML = '<span style="letter-spacing:2px">Processing&hellip;</span>';

    setTimeout(() => {
        btn.classList.remove('processing');
        const total = state.cart.reduce((s, i) => s + i.product.price * i.qty, 0);
        btn.innerHTML = `Pay <span>$${total.toLocaleString()}</span>`;

        // ── TO GO LIVE: send to your backend ─────────────────────────────────
        // POST /api/charge  →  { cardNum, expiry, cvv, name, amount, cart }
        // Your backend creates a Stripe PaymentIntent and confirms the charge.
        // Stripe test card: 4242 4242 4242 4242  exp: any future  cvv: any 3 digits
        // ─────────────────────────────────────────────────────────────────────

        document.getElementById('co-ref').innerText =
            'AE-' + Math.random().toString(36).substr(2, 8).toUpperCase();
        showCoStep(4);
    }, 2500);
}