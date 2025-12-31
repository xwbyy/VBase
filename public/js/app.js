// VBase App JavaScript

// Global overrides for native browser functions
window.alert = function(msg) {
    if (typeof showToast === 'function') showToast(msg, 'info');
    else console.log('Alert:', msg);
};

// Global state for UI components
let toastContainer;
let dialogOverlay;

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
    // Create toast container if not exists
    if (!document.querySelector('.toast-container')) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    } else {
        toastContainer = document.querySelector('.toast-container');
    }

    // Create loading overlay if not exists
    if (!document.getElementById('globalLoadingOverlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'globalLoadingOverlay';
        overlay.innerHTML = `
            <div class="loader"></div>
            <div class="loading-text">PLEASE WAIT...</div>
        `;
        document.body.appendChild(overlay);
    }

    // Create Dialog Overlay if not exists
    if (!document.getElementById('globalDialogOverlay')) {
        dialogOverlay = document.createElement('div');
        dialogOverlay.className = 'dialog-overlay';
        dialogOverlay.id = 'globalDialogOverlay';
        dialogOverlay.innerHTML = `
            <div class="dialog-box">
                <div class="dialog-title" id="dialogTitle">Title</div>
                <div class="dialog-message" id="dialogMessage">Message content here.</div>
                <div class="dialog-actions" id="dialogActions"></div>
            </div>
        `;
        document.body.appendChild(dialogOverlay);
    } else {
        dialogOverlay = document.getElementById('globalDialogOverlay');
    }

    // Sidebar overlay click
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    sidebarOverlay?.addEventListener('click', closeSidebar);

    // Close sidebar when clicking a link
    const navLinks = document.querySelectorAll('.sidebar-nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', closeSidebar);
    });
    
    console.log('VBase UI Initialized');
});

/**
 * Modern iOS Style Dialog
 * @param {string} title 
 * @param {string} message 
 * @param {Array} buttons [{text, type, onClick}]
 */
function showDialog(title, message, buttons = []) {
    const titleEl = document.getElementById('dialogTitle');
    const msgEl = document.getElementById('dialogMessage');
    const actionsEl = document.getElementById('dialogActions');
    
    titleEl.textContent = title;
    msgEl.textContent = message;
    actionsEl.innerHTML = '';
    
    if (buttons.length === 0) {
        buttons = [{ text: 'OK', onClick: hideDialog }];
    }
    
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = `dialog-btn ${btn.type === 'danger' ? 'dialog-btn-danger' : ''} ${btn.type === 'cancel' ? 'dialog-btn-cancel' : ''}`;
        button.textContent = btn.text;
        button.onclick = () => {
            if (btn.onClick) btn.onClick();
            hideDialog();
        };
        actionsEl.appendChild(button);
    });
    
    dialogOverlay.classList.add('active');
}

function hideDialog() {
    dialogOverlay.classList.remove('active');
}

// Override native confirm for specific cases
window.confirmDialog = (message, title = 'Confirm') => {
    return new Promise((resolve) => {
        showDialog(title, message, [
            { text: 'Cancel', type: 'cancel', onClick: () => resolve(false) },
            { text: 'Continue', onClick: () => resolve(true) }
        ]);
    });
};

// Toast function
function showToast(message, type = 'info', title = '') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || 'ℹ'}</div>
        <div class="toast-content">
            ${title ? `<div class="toast-title">${title}</div>` : ''}
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Loading state
function showLoading(show = true) {
    const overlay = document.getElementById('globalLoadingOverlay');
    if (show) {
        overlay?.classList.add('active');
    } else {
        overlay?.classList.remove('active');
    }
}

// Translations
const translations = {
    en: {
        dashboard: 'Dashboard',
        databases: 'Databases',
        apiTools: 'API Tools',
        documentation: 'Documentation',
        settings: 'Settings',
        logout: 'Logout',
        login: 'Login',
        register: 'Register',
        main: 'Main',
        developer: 'Developer',
        account: 'Account',
        currentPlan: 'Current Plan',
        requestsUsed: 'Requests Used',
        yourDatabases: 'Your Databases',
        apiKey: 'API Key',
        quickActions: 'Quick Actions',
        createDatabase: 'Create Database',
        welcome: 'Welcome Back',
        signIn: 'Sign In',
        createAccount: 'Create Account',
        logoutConfirm: 'Are you sure you want to logout?',
        quickTemplates: 'Quick Templates',
        templateDesc: 'Use these pre-made structures for your app.',
        responseFormat: 'Response Format',
        builderTitle: 'Request Builder',
        serverRes: 'Server Response',
        playgroundTitle: 'API Playground',
        playgroundDesc: 'Build, test, and master your database integration.'
    },
    id: {
        dashboard: 'Dasbor',
        databases: 'Database',
        apiTools: 'Alat API',
        documentation: 'Dokumentasi',
        settings: 'Pengaturan',
        logout: 'Keluar',
        login: 'Masuk',
        register: 'Daftar',
        main: 'Utama',
        developer: 'Pengembang',
        account: 'Akun',
        currentPlan: 'Paket Saat Ini',
        requestsUsed: 'Permintaan Digunakan',
        yourDatabases: 'Database Anda',
        apiKey: 'Kunci API',
        quickActions: 'Aksi Cepat',
        createDatabase: 'Buat Database',
        welcome: 'Selamat Datang Kembali',
        signIn: 'Masuk',
        createAccount: 'Buat Akun',
        logoutConfirm: 'Apakah Anda yakin ingin keluar?',
        quickTemplates: 'Templat Cepat',
        templateDesc: 'Gunakan struktur siap pakai ini untuk aplikasi Anda.',
        responseFormat: 'Format Respon',
        builderTitle: 'Pembuat Permintaan',
        serverRes: 'Respon Server',
        playgroundTitle: 'Arena API',
        playgroundDesc: 'Bangun, uji, dan kuasai integrasi database Anda.'
    }
};

function t(key) {
    return translations[currentLang]?.[key] || translations['en']?.[key] || key;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    location.reload();
}

function toggleLanguage() {
    const newLang = currentLang === 'en' ? 'id' : 'en';
    setLanguage(newLang);
}

// Template population for API Tools
function fillTemplate(templateKey) {
    const templates = {
        userReg: {
            username: "vynaa_dev",
            email: "dev@vbase.app",
            password_hash: "argon2id$v=19$m=65536,t=3,p=4$...",
            role: "user",
            created_at: new Date().toISOString()
        },
        product: {
            sku: "PRD-999",
            name: "Cloud Enterprise License",
            price: 299.00,
            currency: "USD",
            features: ["unlimited_db", "priority_support", "99.9%_uptime"]
        },
        analytics: {
            event: "page_view",
            path: "/dashboard",
            browser: "Chrome/120.0.0",
            duration_ms: 4500,
            ip_address: "192.168.1.1"
        }
    };

    const bodyArea = document.getElementById('queryBody') || document.getElementById('testerBody');
    if (bodyArea && templates[templateKey]) {
        bodyArea.value = JSON.stringify(templates[templateKey], null, 2);
        showToast('Template applied', 'success');
    }
}

// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar?.classList.toggle('mobile-open');
    overlay?.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar?.classList.remove('mobile-open');
    overlay?.classList.remove('active');
}

// Apply translations to data-t elements
function applyTranslations() {
    document.querySelectorAll('[data-t]').forEach(el => {
        const key = el.getAttribute('data-t');
        if (translations[currentLang]?.[key]) {
            el.textContent = translations[currentLang][key];
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
});

// Logout function
async function logout() {
    const confirmed = await window.confirmDialog(t('logoutConfirm'), 'Logout');
    if (confirmed) {
        showLoading(true);
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (err) {
            console.error('Logout failed:', err);
            showLoading(false);
            showToast('Logout failed', 'error');
        }
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(currentLang === 'id' ? 'Disalin ke clipboard!' : 'Copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('Copy failed', 'error');
    });
}

// Login function
async function login(event) {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;
    const btn = event.target.querySelector('button');
    
    showLoading(true);
    btn.disabled = true;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 500);
        } else {
            showToast(data.error, 'error', 'Login Failed');
            btn.disabled = false;
            showLoading(false);
        }
    } catch (err) {
        showToast('Network error occurred', 'error');
        btn.disabled = false;
        showLoading(false);
    }
}
