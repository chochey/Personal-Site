// LocalStorage Keys
const STORAGE_KEYS = {
    SITES: 'pinnedSites',
    TODOS: 'todos',
    NOTES: 'notes',
    WIDGETS: 'widgetStates',
    BACKGROUND: 'backgroundSettings'
};

// Widget state
let widgetStates = {};
let widgetCounter = 1;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initTime();
    initGreeting();
    initWidgets();
    initWidgetBar();
    initPinnedSites();
    initTodos();
    initNotepad();
    initSearch();
    initKeyboardShortcuts();
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

        // Apply saved size
        if (state.width && state.height) {
            widget.style.width = state.width + 'px';
            widget.style.height = state.height + 'px';
        }

        // Apply saved custom name
        if (state.customName) {
            const titleElement = widget.querySelector('h2');
            titleElement.textContent = state.customName;
        }

        // Apply saved state (minimized/closed)
        if (state.minimized) {
            widget.classList.add('minimized');
        }
        if (state.closed) {
            widget.classList.add('closed');
        }

        // Add double-click to rename widget
        const titleElement = widget.querySelector('h2');
        titleElement.style.cursor = 'pointer';
        titleElement.title = 'Double-click to rename';
        titleElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            renameWidget(widgetId);
        });

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

        // Setup resize handle
        setupWidgetResize(widget, widgetId);
    });
}

function loadWidgetStates() {
    const saved = localStorage.getItem(STORAGE_KEYS.WIDGETS);
    widgetStates = saved ? JSON.parse(saved) : {};
}

function saveWidgetState(widgetId, updates) {
    widgetStates[widgetId] = { ...widgetStates[widgetId], ...updates };
    localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(widgetStates));
}

function renameWidget(widgetId) {
    const widget = document.getElementById(`widget-${widgetId}`);
    const titleElement = widget.querySelector('h2');
    const currentTitle = titleElement.textContent;

    const newName = prompt('Enter new widget name:', currentTitle);

    if (newName && newName.trim() !== '' && newName !== currentTitle) {
        titleElement.textContent = newName.trim();
        saveWidgetState(widgetId, { customName: newName.trim() });
        updateWidgetBar();
    }
}

function toggleMinimize(widgetId) {
    const widget = document.getElementById(`widget-${widgetId}`);
    const isMinimized = widget.classList.toggle('minimized');

    saveWidgetState(widgetId, { minimized: isMinimized });
    updateWidgetBar();
}

function restoreFromBar(widgetId) {
    const widget = document.getElementById(`widget-${widgetId}`);
    widget.classList.remove('minimized');

    saveWidgetState(widgetId, { minimized: false });
    updateWidgetBar();
}

function closeWidget(widgetId) {
    const widget = document.getElementById(`widget-${widgetId}`);
    const widgetName = widget.querySelector('h2').textContent;

    if (!confirm(`Close "${widgetName}"?`)) {
        return;
    }

    widget.classList.add('closed');
    saveWidgetState(widgetId, { closed: true });
    updateWidgetBar();
}

function restoreWidget(widgetId) {
    const widget = document.getElementById(`widget-${widgetId}`);
    widget.classList.remove('closed');
    widget.classList.remove('minimized');

    saveWidgetState(widgetId, { closed: false, minimized: false });
}

// ===== WIDGET BAR =====
function initWidgetBar() {
    const newWidgetBtn = document.getElementById('newWidgetBtn');
    const newWidgetMenu = document.getElementById('newWidgetMenu');

    newWidgetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        newWidgetMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!newWidgetMenu.contains(e.target) && e.target !== newWidgetBtn) {
            newWidgetMenu.classList.remove('active');
        }
    });

    updateWidgetBar();
}

function updateWidgetBar() {
    const barItems = document.getElementById('widgetBarItems');
    const widgets = document.querySelectorAll('.widget');

    const minimizedWidgets = Array.from(widgets).filter(w => w.classList.contains('minimized') && !w.classList.contains('closed'));

    if (minimizedWidgets.length === 0) {
        barItems.innerHTML = '';
        return;
    }

    barItems.innerHTML = minimizedWidgets.map(widget => {
        const widgetId = widget.dataset.widgetId;
        const title = widget.querySelector('h2').textContent;

        return `
            <button class="widget-bar-btn minimized-widget-btn" onclick="restoreFromBar('${widgetId}')" title="${title}">
                ${title.split(' ')[0]}
            </button>
        `;
    }).join('');
}

function createNewWidget(type) {
    const dashboard = document.querySelector('.dashboard');
    const newWidgetId = `${type}-${widgetCounter++}`;

    const widgetTemplates = {
        'sites': {
            icon: '📌',
            title: 'Pinned Sites',
            content: '<div class="sites-grid" id="sitesGrid-' + newWidgetId + '"></div>',
            hasAddBtn: true
        },
        'todos': {
            icon: '✓',
            title: 'Todo List',
            content: `
                <div class="todo-input-container">
                    <input type="text" id="todoInput-${newWidgetId}" placeholder="Add a new task..." class="input">
                    <button class="btn btn-primary" onclick="addTodoToWidget('${newWidgetId}')">Add</button>
                </div>
                <ul class="todo-list" id="todoList-${newWidgetId}"></ul>
            `,
            hasAddBtn: false
        },
        'notepad': {
            icon: '📝',
            title: 'Notepad',
            content: `
                <div class="editor-toolbar">
                    <div class="toolbar-group">
                        <button class="toolbar-btn" onclick="formatDoc('bold')" title="Bold (Ctrl+B)"><b>B</b></button>
                        <button class="toolbar-btn" onclick="formatDoc('italic')" title="Italic (Ctrl+I)"><i>I</i></button>
                        <button class="toolbar-btn" onclick="formatDoc('underline')" title="Underline (Ctrl+U)"><u>U</u></button>
                        <button class="toolbar-btn" onclick="formatDoc('strikeThrough')" title="Strikethrough"><s>S</s></button>
                    </div>
                    <div class="toolbar-group">
                        <select class="toolbar-select" onchange="formatDoc('fontSize', this.value); this.selectedIndex=0;" title="Font Size">
                            <option value="" selected disabled>Size</option>
                            <option value="1">Small</option>
                            <option value="3">Normal</option>
                            <option value="5">Large</option>
                            <option value="7">Extra Large</option>
                        </select>
                        <select class="toolbar-select" onchange="formatDoc('formatBlock', this.value); this.selectedIndex=0;" title="Text Style">
                            <option value="" selected disabled>Style</option>
                            <option value="p">Paragraph</option>
                            <option value="h1">Heading 1</option>
                            <option value="h2">Heading 2</option>
                            <option value="h3">Heading 3</option>
                        </select>
                    </div>
                    <div class="toolbar-group">
                        <button class="toolbar-btn" onclick="formatDoc('insertUnorderedList')" title="Bullet List">• List</button>
                        <button class="toolbar-btn" onclick="formatDoc('insertOrderedList')" title="Numbered List">1. List</button>
                    </div>
                    <div class="toolbar-group">
                        <button class="toolbar-btn" onclick="formatDoc('justifyLeft')" title="Align Left">⬅</button>
                        <button class="toolbar-btn" onclick="formatDoc('justifyCenter')" title="Align Center">↔</button>
                        <button class="toolbar-btn" onclick="formatDoc('justifyRight')" title="Align Right">➡</button>
                    </div>
                    <div class="toolbar-group">
                        <button class="toolbar-btn" onclick="formatDoc('removeFormat')" title="Clear Formatting">Clear</button>
                    </div>
                </div>
                <div id="notepad-${newWidgetId}" class="notepad" contenteditable="true" data-placeholder="Start typing your notes here..."></div>
            `,
            hasAddBtn: false,
            hasSaveStatus: true
        }
    };

    const template = widgetTemplates[type];
    if (!template) return;

    const widget = document.createElement('section');
    widget.className = 'widget';
    widget.id = `widget-${newWidgetId}`;
    widget.dataset.widgetId = newWidgetId;
    widget.style.left = '50px';
    widget.style.top = '50px';

    widget.innerHTML = `
        <div class="widget-header">
            <span class="widget-drag-handle">⋮⋮</span>
            <h2>${template.icon} ${template.title}</h2>
            <div class="widget-controls">
                ${template.hasAddBtn ? '<button class="btn-add" id="addBtn-' + newWidgetId + '" title="Add">+</button>' : ''}
                ${template.hasSaveStatus ? '<span class="auto-save" id="saveStatus-' + newWidgetId + '">Auto-saved</span>' : ''}
                <button class="widget-btn widget-minimize" title="Minimize">−</button>
                <button class="widget-btn widget-close" title="Close">×</button>
            </div>
        </div>
        <div class="widget-content">
            ${template.content}
        </div>
        <div class="widget-resize-handle"></div>
    `;

    dashboard.appendChild(widget);

    // Initialize the new widget
    const widgetId = newWidgetId;
    setupWidgetDragging(widget, widgetId);
    setupWidgetControls(widget, widgetId);
    setupWidgetResize(widget, widgetId);

    // Initialize widget-specific functionality
    if (type === 'notepad') {
        initNotepadWidget(newWidgetId);
    }

    // Close the new widget menu
    document.getElementById('newWidgetMenu').classList.remove('active');

    // Save the widget state
    saveWidgetState(widgetId, { x: 50, y: 50, closed: false, minimized: false });
}

function setupWidgetDragging(widget, widgetId) {
    const header = widget.querySelector('.widget-header');
    let isDragging = false;
    let currentX, currentY, initialX, initialY;

    const dragStart = (e) => {
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
}

function setupWidgetControls(widget, widgetId) {
    const minimizeBtn = widget.querySelector('.widget-minimize');
    minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMinimize(widgetId);
    });

    const closeBtn = widget.querySelector('.widget-close');
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeWidget(widgetId);
    });

    // Add double-click to rename widget
    const titleElement = widget.querySelector('h2');
    titleElement.style.cursor = 'pointer';
    titleElement.title = 'Double-click to rename';
    titleElement.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        renameWidget(widgetId);
    });
}

function setupWidgetResize(widget, widgetId) {
    const resizeHandle = widget.querySelector('.widget-resize-handle');
    if (!resizeHandle) return;

    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    const resizeStart = (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = widget.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;

        widget.classList.add('resizing');
        e.preventDefault();
        e.stopPropagation();
    };

    const resize = (e) => {
        if (!isResizing) return;
        e.preventDefault();

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const newWidth = Math.max(250, startWidth + dx);
        const newHeight = Math.max(200, startHeight + dy);

        widget.style.width = newWidth + 'px';
        widget.style.height = newHeight + 'px';
    };

    const resizeEnd = () => {
        if (!isResizing) return;
        isResizing = false;
        widget.classList.remove('resizing');

        // Save size
        const rect = widget.getBoundingClientRect();
        saveWidgetState(widgetId, {
            width: rect.width,
            height: rect.height
        });
    };

    resizeHandle.addEventListener('mousedown', resizeStart);
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', resizeEnd);
}

function initNotepadWidget(widgetId) {
    const notepad = document.getElementById(`notepad-${widgetId}`);
    const saveStatus = document.getElementById(`saveStatus-${widgetId}`);
    let saveTimeout;

    // Load saved notes
    const saved = localStorage.getItem(`notes-${widgetId}`);
    if (saved) {
        notepad.innerHTML = saved;
    }

    // Auto-save on input
    notepad.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveStatus.textContent = 'Saving...';
        saveStatus.style.color = 'var(--warning)';

        saveTimeout = setTimeout(() => {
            localStorage.setItem(`notes-${widgetId}`, notepad.innerHTML);
            saveStatus.textContent = 'Auto-saved';
            saveStatus.style.color = 'var(--success)';
        }, 1000);
    });

    // Update toolbar button states on selection change
    notepad.addEventListener('mouseup', updateToolbarState);
    notepad.addEventListener('keyup', updateToolbarState);
    notepad.addEventListener('focus', updateToolbarState);
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
        siteEl.draggable = true;
        siteEl.dataset.index = index;

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

        // Drag event listeners
        siteEl.addEventListener('dragstart', handleSiteDragStart);
        siteEl.addEventListener('dragover', handleSiteDragOver);
        siteEl.addEventListener('drop', handleSiteDrop);
        siteEl.addEventListener('dragend', handleSiteDragEnd);
        siteEl.addEventListener('dragenter', handleSiteDragEnter);
        siteEl.addEventListener('dragleave', handleSiteDragLeave);

        grid.appendChild(siteEl);
    });
}

let draggedSiteIndex = null;

function handleSiteDragStart(e) {
    // Only allow dragging from the site icon/image, not from the text link or buttons
    if (e.target.classList.contains('site-name') ||
        e.target.tagName === 'BUTTON' ||
        e.target.closest('button')) {
        e.preventDefault();
        return;
    }

    draggedSiteIndex = parseInt(e.currentTarget.dataset.index);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleSiteDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleSiteDragEnter(e) {
    const siteItem = e.target.closest('.site-item');
    if (siteItem) {
        siteItem.classList.add('drag-over');
    }
}

function handleSiteDragLeave(e) {
    const siteItem = e.target.closest('.site-item');
    if (siteItem && !siteItem.contains(e.relatedTarget)) {
        siteItem.classList.remove('drag-over');
    }
}

function handleSiteDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const dropTarget = e.target.closest('.site-item');
    if (!dropTarget) return;

    const dropIndex = parseInt(dropTarget.dataset.index);

    if (draggedSiteIndex !== null && draggedSiteIndex !== dropIndex) {
        // Reorder the array
        const draggedItem = pinnedSites[draggedSiteIndex];
        pinnedSites.splice(draggedSiteIndex, 1);
        pinnedSites.splice(dropIndex, 0, draggedItem);

        saveSitesToStorage();
        renderSites();
    }

    return false;
}

function handleSiteDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.site-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    draggedSiteIndex = null;
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
        li.draggable = true;
        li.dataset.index = index;

        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}
                   onchange="toggleTodo(${index})">
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <button class="todo-delete" onclick="deleteTodo(${index})">×</button>
        `;

        // Drag event listeners
        li.addEventListener('dragstart', handleTodoDragStart);
        li.addEventListener('dragover', handleTodoDragOver);
        li.addEventListener('drop', handleTodoDrop);
        li.addEventListener('dragend', handleTodoDragEnd);
        li.addEventListener('dragenter', handleTodoDragEnter);
        li.addEventListener('dragleave', handleTodoDragLeave);

        list.appendChild(li);
    });
}

let draggedTodoIndex = null;

function handleTodoDragStart(e) {
    draggedTodoIndex = parseInt(e.target.dataset.index);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleTodoDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleTodoDragEnter(e) {
    if (e.target.classList.contains('todo-item')) {
        e.target.classList.add('drag-over');
    }
}

function handleTodoDragLeave(e) {
    if (e.target.classList.contains('todo-item')) {
        e.target.classList.remove('drag-over');
    }
}

function handleTodoDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const dropIndex = parseInt(e.target.closest('.todo-item').dataset.index);

    if (draggedTodoIndex !== null && draggedTodoIndex !== dropIndex) {
        // Reorder the array
        const draggedItem = todos[draggedTodoIndex];
        todos.splice(draggedTodoIndex, 1);
        todos.splice(dropIndex, 0, draggedItem);

        saveTodosToStorage();
        renderTodos();
    }

    return false;
}

function handleTodoDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    draggedTodoIndex = null;
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

    // Update toolbar button states on selection change
    notepad.addEventListener('mouseup', updateToolbarState);
    notepad.addEventListener('keyup', updateToolbarState);
    notepad.addEventListener('focus', updateToolbarState);

    // Prevent paste with formatting (optional - you can remove this if you want to keep formatting when pasting)
    notepad.addEventListener('paste', (e) => {
        // Allow default paste behavior to keep formatting
    });
}

// Update toolbar button active states based on current selection
function updateToolbarState() {
    const commands = ['bold', 'italic', 'underline', 'strikeThrough'];

    commands.forEach(command => {
        const button = document.querySelector(`[onclick="formatDoc('${command}')"]`);
        if (button) {
            if (document.queryCommandState(command)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
    });
}

// Format document with execCommand
function formatDoc(command, value = null) {
    document.execCommand(command, false, value);
    document.getElementById('notepad').focus();
    updateToolbarState();
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== QUICK SEARCH =====
function initSearch() {
    const searchModal = document.getElementById('searchModal');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
            searchResults.innerHTML = '';
            return;
        }

        const results = [];

        // Search pinned sites
        pinnedSites.forEach((site, index) => {
            if (site.name.toLowerCase().includes(query) || site.url.toLowerCase().includes(query)) {
                results.push({
                    type: 'site',
                    icon: '📌',
                    title: site.name,
                    subtitle: site.url,
                    action: () => window.open(site.url, '_blank')
                });
            }
        });

        // Search todos
        todos.forEach((todo, index) => {
            if (todo.text.toLowerCase().includes(query)) {
                results.push({
                    type: 'todo',
                    icon: '✓',
                    title: todo.text,
                    subtitle: todo.completed ? 'Completed' : 'Pending',
                    action: () => {
                        const todoWidget = document.getElementById('widget-todos');
                        if (todoWidget.classList.contains('closed')) {
                            restoreWidget('todos');
                        }
                        if (todoWidget.classList.contains('minimized')) {
                            restoreFromBar('todos');
                        }
                        closeSearch();
                    }
                });
            }
        });

        // Search notepad content
        const notepad = document.getElementById('notepad');
        const notepadText = notepad.textContent.toLowerCase();
        if (notepadText.includes(query)) {
            results.push({
                type: 'note',
                icon: '📝',
                title: 'Notepad',
                subtitle: 'Found in notepad content',
                action: () => {
                    const notepadWidget = document.getElementById('widget-notepad');
                    if (notepadWidget.classList.contains('closed')) {
                        restoreWidget('notepad');
                    }
                    if (notepadWidget.classList.contains('minimized')) {
                        restoreFromBar('notepad');
                    }
                    closeSearch();
                }
            });
        }

        renderSearchResults(results);
    });

    // Close on outside click
    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) {
            closeSearch();
        }
    });
}

function renderSearchResults(results) {
    const searchResults = document.getElementById('searchResults');

    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
        return;
    }

    searchResults.innerHTML = results.map(result => `
        <div class="search-result-item" data-type="${result.type}">
            <div class="search-result-icon">${result.icon}</div>
            <div class="search-result-content">
                <div class="search-result-title">${escapeHtml(result.title)}</div>
                <div class="search-result-subtitle">${escapeHtml(result.subtitle)}</div>
            </div>
        </div>
    `).join('');

    // Add click handlers
    const items = searchResults.querySelectorAll('.search-result-item');
    items.forEach((item, index) => {
        item.addEventListener('click', () => {
            results[index].action();
        });
    });
}

function openSearch() {
    const searchModal = document.getElementById('searchModal');
    const searchInput = document.getElementById('searchInput');
    searchModal.classList.add('active');
    searchInput.value = '';
    searchInput.focus();
    document.getElementById('searchResults').innerHTML = '';
}

function closeSearch() {
    document.getElementById('searchModal').classList.remove('active');
}

// ===== KEYBOARD SHORTCUTS =====
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+K or Cmd+K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            closeSearch();
            document.getElementById('newWidgetMenu').classList.remove('active');
            closeSiteModal();
        }
    });
}

