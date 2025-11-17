// LocalStorage Keys
const STORAGE_KEYS = {
    SITES: 'pinnedSites',
    TODOS: 'todos',
    NOTES: 'notes',
    WIDGETS: 'widgetStates'
};

// Widget state
let widgetStates = {};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initTime();
    initGreeting();
    initWidgets();
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

    // Update time with seconds
    const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
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

// ===== WIDGET MANAGEMENT =====
function initWidgets() {
    loadWidgetStates();

    const widgets = document.querySelectorAll('.widget');

    widgets.forEach(widget => {
        const widgetId = widget.dataset.widgetId;
        const state = widgetStates[widgetId] || {};

        // Apply saved position
        if (state.x && state.y) {
            widget.style.left = state.x + 'px';
            widget.style.top = state.y + 'px';
        }

        // Apply saved state (minimized/closed)
        if (state.minimized) {
            widget.classList.add('minimized');
        }
        if (state.closed) {
            widget.classList.add('closed');
        }

        // Setup drag handlers
        const handle = widget.querySelector('.widget-drag-handle');
        const header = widget.querySelector('.widget-header');

        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        const dragStart = (e) => {
            // Don't drag if clicking on buttons or inputs
            if (e.target.closest('button, input, select, textarea')) return;

            if (e.type === 'touchstart') {
                initialX = e.touches[0].clientX - (parseInt(widget.style.left) || widget.offsetLeft);
                initialY = e.touches[0].clientY - (parseInt(widget.style.top) || widget.offsetTop);
            } else {
                initialX = e.clientX - (parseInt(widget.style.left) || widget.offsetLeft);
                initialY = e.clientY - (parseInt(widget.style.top) || widget.offsetTop);
            }

            isDragging = true;
            widget.classList.add('dragging');
        };

        const drag = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            widget.style.left = currentX + 'px';
            widget.style.top = currentY + 'px';
        };

        const dragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            widget.classList.remove('dragging');

            // Save position
            saveWidgetState(widgetId, {
                x: parseInt(widget.style.left) || widget.offsetLeft,
                y: parseInt(widget.style.top) || widget.offsetTop
            });
        };

        header.addEventListener('mousedown', dragStart);
        header.addEventListener('touchstart', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);

        // Setup minimize button
        const minimizeBtn = widget.querySelector('.widget-minimize');
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMinimize(widgetId);
        });

        // Setup close button
        const closeBtn = widget.querySelector('.widget-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeWidget(widgetId);
        });
    });

    // Setup widget menu
    const menuBtn = document.getElementById('widgetMenuBtn');
    const menu = document.getElementById('widgetMenu');

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('active');
        updateWidgetMenu();
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && e.target !== menuBtn) {
            menu.classList.remove('active');
        }
    });

    updateWidgetMenu();
}

function loadWidgetStates() {
    const saved = localStorage.getItem(STORAGE_KEYS.WIDGETS);
    widgetStates = saved ? JSON.parse(saved) : {};
}

function saveWidgetState(widgetId, updates) {
    widgetStates[widgetId] = { ...widgetStates[widgetId], ...updates };
    localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(widgetStates));
}

function toggleMinimize(widgetId) {
    const widget = document.getElementById(`widget-${widgetId}`);
    const isMinimized = widget.classList.toggle('minimized');

    saveWidgetState(widgetId, { minimized: isMinimized });
}

function closeWidget(widgetId) {
    const widget = document.getElementById(`widget-${widgetId}`);
    widget.classList.add('closed');

    saveWidgetState(widgetId, { closed: true });
    updateWidgetMenu();
}

function restoreWidget(widgetId) {
    const widget = document.getElementById(`widget-${widgetId}`);
    widget.classList.remove('closed');
    widget.classList.remove('minimized');

    saveWidgetState(widgetId, { closed: false, minimized: false });
    updateWidgetMenu();
}

function updateWidgetMenu() {
    const menuList = document.getElementById('widgetMenuList');
    const closedWidgets = Object.entries(widgetStates).filter(([id, state]) => state.closed);

    if (closedWidgets.length === 0) {
        menuList.innerHTML = '<p class="no-widgets">All widgets are visible</p>';
        return;
    }

    const widgetNames = {
        'sites': '📌 Pinned Sites',
        'todos': '✓ Todo List',
        'notepad': '📝 Notepad'
    };

    menuList.innerHTML = closedWidgets.map(([id]) => `
        <button class="widget-restore-btn" onclick="restoreWidget('${id}')">
            ${widgetNames[id] || id}
        </button>
    `).join('');
}

// ===== PINNED SITES =====
let pinnedSites = [];
let editingIndex = null;

function initPinnedSites() {
    loadSites();
    renderSites();

    document.getElementById('addSiteBtn').addEventListener('click', () => openSiteModal());
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
            { name: 'Google', url: 'https://google.com' },
            { name: 'YouTube', url: 'https://youtube.com' },
            { name: 'GitHub', url: 'https://github.com' },
            { name: 'Gmail', url: 'https://gmail.com' }
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
        const siteEl = document.createElement('div');
        siteEl.className = 'site-item';

        // Extract domain for favicon
        const faviconUrl = getFaviconUrl(site.url);

        siteEl.innerHTML = `
            <a href="${site.url}" target="_blank" rel="noopener noreferrer" class="site-link">
                <img src="${faviconUrl}" alt="${site.name}" class="site-icon" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌐</text></svg>'">
                <div class="site-name">${escapeHtml(site.name)}</div>
            </a>
            <button class="edit-site" onclick="editSite(event, ${index})" title="Edit">✎</button>
            <button class="delete-site" onclick="deleteSite(event, ${index})" title="Delete">×</button>
        `;

        grid.appendChild(siteEl);
    });
}

function getFaviconUrl(url) {
    try {
        const domain = new URL(url).hostname;
        // Use Google's favicon service
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (e) {
        return 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌐</text></svg>';
    }
}

function openSiteModal(index = null) {
    editingIndex = index;
    const modal = document.getElementById('siteModal');
    const title = modal.querySelector('h3');

    if (index !== null) {
        // Editing existing site
        title.textContent = 'Edit Website';
        document.getElementById('siteName').value = pinnedSites[index].name;
        document.getElementById('siteUrl').value = pinnedSites[index].url;
    } else {
        // Adding new site
        title.textContent = 'Add Website';
        document.getElementById('siteName').value = '';
        document.getElementById('siteUrl').value = '';
    }

    modal.classList.add('active');
    document.getElementById('siteName').focus();
}

function closeSiteModal() {
    document.getElementById('siteModal').classList.remove('active');
    editingIndex = null;
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

    if (editingIndex !== null) {
        // Update existing site
        pinnedSites[editingIndex] = { name, url: finalUrl };
    } else {
        // Add new site
        pinnedSites.push({ name, url: finalUrl });
    }

    saveSitesToStorage();
    renderSites();
    closeSiteModal();
}

function editSite(event, index) {
    event.preventDefault();
    event.stopPropagation();
    openSiteModal(index);
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
        notepad.innerHTML = saved;
    }

    // Auto-save on input
    notepad.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveStatus.textContent = 'Saving...';
        saveStatus.style.color = 'var(--warning)';

        saveTimeout = setTimeout(() => {
            localStorage.setItem(STORAGE_KEYS.NOTES, notepad.innerHTML);
            saveStatus.textContent = 'Auto-saved';
            saveStatus.style.color = 'var(--success)';
        }, 1000);
    });

    // Prevent paste with formatting (optional - you can remove this if you want to keep formatting when pasting)
    notepad.addEventListener('paste', (e) => {
        // Allow default paste behavior to keep formatting
    });
}

// Format document with execCommand
function formatDoc(command, value = null) {
    document.execCommand(command, false, value);
    document.getElementById('notepad').focus();
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
