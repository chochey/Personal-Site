// LocalStorage Keys
const STORAGE_KEYS = {
    SITES: 'pinnedSites',
    TODOS: 'todos',
    NOTES: 'notes'
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initTime();
    initGreeting();
    initPinnedSites();
    initTodos();
    initNotepad();
});

// ===== TIME & DATE =====
function initTime() {
    updateTime();
    setInterval(updateTime, 1000);
}

function updateTime() {
    const now = new Date();

    // Update time
    const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    document.getElementById('time').textContent = timeStr;

    // Update date
    const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('date').textContent = dateStr;
}

// ===== GREETING =====
function initGreeting() {
    const hour = new Date().getHours();
    let greeting;

    if (hour < 12) {
        greeting = 'Good Morning';
    } else if (hour < 18) {
        greeting = 'Good Afternoon';
    } else {
        greeting = 'Good Evening';
    }

    document.getElementById('greeting').textContent = greeting;
}

// ===== PINNED SITES =====
let pinnedSites = [];

function initPinnedSites() {
    loadSites();
    renderSites();

    document.getElementById('addSiteBtn').addEventListener('click', openSiteModal);
    document.getElementById('cancelSite').addEventListener('click', closeSiteModal);
    document.getElementById('saveSite').addEventListener('click', saveSite);

    // Close modal on outside click
    document.getElementById('siteModal').addEventListener('click', (e) => {
        if (e.target.id === 'siteModal') {
            closeSiteModal();
        }
    });

    // Add default sites if none exist
    if (pinnedSites.length === 0) {
        pinnedSites = [
            { name: 'Google', url: 'https://google.com', icon: '🔍' },
            { name: 'YouTube', url: 'https://youtube.com', icon: '📺' },
            { name: 'GitHub', url: 'https://github.com', icon: '💻' },
            { name: 'Gmail', url: 'https://gmail.com', icon: '📧' }
        ];
        saveSitesToStorage();
        renderSites();
    }
}

function loadSites() {
    const saved = localStorage.getItem(STORAGE_KEYS.SITES);
    pinnedSites = saved ? JSON.parse(saved) : [];
}

function saveSitesToStorage() {
    localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(pinnedSites));
}

function renderSites() {
    const grid = document.getElementById('sitesGrid');
    grid.innerHTML = '';

    pinnedSites.forEach((site, index) => {
        const siteEl = document.createElement('a');
        siteEl.className = 'site-item';
        siteEl.href = site.url;
        siteEl.target = '_blank';
        siteEl.rel = 'noopener noreferrer';

        siteEl.innerHTML = `
            <div class="site-icon">${site.icon}</div>
            <div class="site-name">${site.name}</div>
            <button class="delete-site" onclick="deleteSite(event, ${index})">×</button>
        `;

        grid.appendChild(siteEl);
    });
}

function openSiteModal() {
    document.getElementById('siteModal').classList.add('active');
    document.getElementById('siteName').value = '';
    document.getElementById('siteUrl').value = '';
    document.getElementById('siteName').focus();
}

function closeSiteModal() {
    document.getElementById('siteModal').classList.remove('active');
}

function saveSite() {
    const name = document.getElementById('siteName').value.trim();
    const url = document.getElementById('siteUrl').value.trim();

    if (!name || !url) {
        alert('Please fill in both fields');
        return;
    }

    // Add https:// if no protocol specified
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        finalUrl = 'https://' + url;
    }

    // Generate random emoji icon
    const emojis = ['🌐', '⭐', '🔗', '📱', '💼', '🎮', '🎵', '📚', '🛒', '✈️'];
    const icon = emojis[Math.floor(Math.random() * emojis.length)];

    pinnedSites.push({ name, url: finalUrl, icon });
    saveSitesToStorage();
    renderSites();
    closeSiteModal();
}

function deleteSite(event, index) {
    event.preventDefault();
    event.stopPropagation();

    if (confirm('Remove this site?')) {
        pinnedSites.splice(index, 1);
        saveSitesToStorage();
        renderSites();
    }
}

// ===== TODO LIST =====
let todos = [];

function initTodos() {
    loadTodos();
    renderTodos();

    document.getElementById('addTodoBtn').addEventListener('click', addTodo);
    document.getElementById('todoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
}

function loadTodos() {
    const saved = localStorage.getItem(STORAGE_KEYS.TODOS);
    todos = saved ? JSON.parse(saved) : [];
}

function saveTodosToStorage() {
    localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
}

function renderTodos() {
    const list = document.getElementById('todoList');
    list.innerHTML = '';

    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}
                   onchange="toggleTodo(${index})">
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <button class="todo-delete" onclick="deleteTodo(${index})">×</button>
        `;

        list.appendChild(li);
    });
}

function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();

    if (!text) return;

    todos.push({ text, completed: false, createdAt: Date.now() });
    saveTodosToStorage();
    renderTodos();
    input.value = '';
}

function toggleTodo(index) {
    todos[index].completed = !todos[index].completed;
    saveTodosToStorage();
    renderTodos();
}

function deleteTodo(index) {
    todos.splice(index, 1);
    saveTodosToStorage();
    renderTodos();
}

// ===== NOTEPAD =====
let saveTimeout;

function initNotepad() {
    const notepad = document.getElementById('notepad');
    const saveStatus = document.getElementById('saveStatus');

    // Load saved notes
    const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (saved) {
        notepad.value = saved;
    }

    // Auto-save on input
    notepad.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveStatus.textContent = 'Saving...';
        saveStatus.style.color = 'var(--warning)';

        saveTimeout = setTimeout(() => {
            localStorage.setItem(STORAGE_KEYS.NOTES, notepad.value);
            saveStatus.textContent = 'Auto-saved';
            saveStatus.style.color = 'var(--success)';
        }, 1000);
    });
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
