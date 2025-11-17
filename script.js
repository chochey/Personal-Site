// LocalStorage Keys
const STORAGE_KEYS = {
    SITES: 'pinnedSites',
    TODOS: 'todos',
    NOTES: 'notes',
    WIDGETS: 'widgetStates',
    SETTINGS: 'userSettings',
    WEATHER: 'weatherData',
    HABITS: 'habits',
    STICKY_NOTES: 'stickyNotes',
    LAYOUTS: 'widgetLayouts',
    POMODORO: 'pomodoroSettings'
};

// Widget state
let widgetStates = {};
let widgetCounter = 1;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initSettings();
    initTime();
    initGreeting();
    initWidgets();
    initWidgetBar();
    initPinnedSites();
    initTodos();
    initNotepad();
    initSearch();
    initKeyboardShortcuts();
    initDarkMode();
    initHeaderControls();
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
function recreateWidget(widgetId, state) {
    // Determine widget type from widgetId (e.g., "pomodoro-1" -> "pomodoro")
    const type = widgetId.split('-')[0];

    // Skip if this is a default widget (sites, todos, notepad)
    if (type === 'sites' || type === 'todos' || type === 'notepad') {
        return;
    }

    const dashboard = document.querySelector('.dashboard');
    const widgetTemplates = {
        'weather': {
            icon: '🌤️',
            title: 'Weather',
            content: `
                <div id="weather-${widgetId}" class="weather-container">
                    <div class="weather-setup">
                        <p>Enter your city to get weather:</p>
                        <input type="text" id="weatherCity-${widgetId}" placeholder="City name" class="input">
                        <button class="btn btn-primary" onclick="fetchWeatherForWidget('${widgetId}')">Get Weather</button>
                    </div>
                </div>
            `,
            hasAddBtn: false
        },
        'pomodoro': {
            icon: '⏱️',
            title: 'Pomodoro Timer',
            content: `
                <div id="pomodoro-${widgetId}" class="pomodoro-container">
                    <div class="pomodoro-display">
                        <div class="pomodoro-time" id="pomodoroTime-${widgetId}">25:00</div>
                        <div class="pomodoro-label" id="pomodoroLabel-${widgetId}">Focus Time</div>
                    </div>
                    <div class="pomodoro-progress">
                        <svg class="pomodoro-ring" width="200" height="200">
                            <circle class="pomodoro-ring-bg" cx="100" cy="100" r="90"></circle>
                            <circle class="pomodoro-ring-progress" id="pomodoroRing-${widgetId}" cx="100" cy="100" r="90"></circle>
                        </svg>
                    </div>
                    <div class="pomodoro-controls">
                        <button class="btn btn-primary" id="pomodoroStart-${widgetId}">Start</button>
                        <button class="btn btn-secondary" id="pomodoroReset-${widgetId}">Reset</button>
                    </div>
                    <div class="pomodoro-settings">
                        <label>Focus: <input type="number" id="pomodoroFocus-${widgetId}" value="25" min="1" max="60" class="pomodoro-input"> min</label>
                        <label>Break: <input type="number" id="pomodoroBreak-${widgetId}" value="5" min="1" max="30" class="pomodoro-input"> min</label>
                    </div>
                </div>
            `,
            hasAddBtn: false
        },
        'habits': {
            icon: '✨',
            title: 'Habits Tracker',
            content: `
                <div id="habits-${widgetId}" class="habits-container">
                    <div class="habits-input-container">
                        <input type="text" id="habitInput-${widgetId}" placeholder="Add a new habit..." class="input">
                        <button class="btn btn-primary" onclick="addHabit('${widgetId}')">Add</button>
                    </div>
                    <div class="habits-list" id="habitsList-${widgetId}"></div>
                </div>
            `,
            hasAddBtn: false
        },
        'stickynotes': {
            icon: '📋',
            title: 'Note',
            content: `
                <div class="stickynote-single" id="stickynote-${widgetId}">
                    <textarea
                        class="stickynote-content"
                        id="stickynoteContent-${widgetId}"
                        placeholder="Type your note here..."
                    ></textarea>
                </div>
            `,
            hasAddBtn: false,
            isStickyNote: true
        }
    };

    const template = widgetTemplates[type];
    if (!template) return;

    const widget = document.createElement('section');
    widget.className = 'widget';
    widget.id = `widget-${widgetId}`;
    widget.dataset.widgetId = widgetId;
    widget.style.left = (state.x || 50) + 'px';
    widget.style.top = (state.y || 50) + 'px';

    if (state.width) widget.style.width = state.width + 'px';
    if (state.height) widget.style.height = state.height + 'px';

    widget.innerHTML = `
        <div class="widget-header">
            <span class="widget-drag-handle">⋮⋮</span>
            <h2>${template.icon} ${state.customName || template.title}</h2>
            <div class="widget-controls">
                ${template.hasAddBtn ? '<button class="btn-add" id="addBtn-' + widgetId + '" title="Add">+</button>' : ''}
                ${template.hasSaveStatus ? '<span class="auto-save" id="saveStatus-' + widgetId + '">Auto-saved</span>' : ''}
                ${template.isStickyNote ? '<button class="widget-btn" id="colorBtn-' + widgetId + '" title="Change color">🎨</button>' : ''}
                <button class="widget-btn widget-minimize" title="Minimize">−</button>
                <button class="widget-btn widget-close" title="Close">×</button>
            </div>
        </div>
        <div class="widget-content">
            ${template.content}
        </div>
        <div class="widget-resize-handle"></div>
    `;

    // Apply sticky note styling
    if (template.isStickyNote) {
        const color = state.stickyNoteData?.color || 'yellow';
        widget.classList.add('widget-stickynote', `widget-stickynote-${color}`);
    }

    // Apply state classes
    if (state.minimized) widget.classList.add('minimized');
    if (state.closed) widget.classList.add('closed');

    dashboard.appendChild(widget);

    // Setup widget functionality
    setupWidgetDragging(widget, widgetId);
    setupWidgetControls(widget, widgetId);
    setupWidgetResize(widget, widgetId);

    // Initialize widget-specific functionality
    if (type === 'pomodoro') {
        initPomodoroWidget(widgetId);
    } else if (type === 'habits') {
        initHabitsWidget(widgetId);
    } else if (type === 'stickynotes') {
        initSingleStickyNote(widgetId, widget);
    }
}

function initWidgets() {
    loadWidgetStates();

    // Recreate dynamically created widgets from storage
    Object.keys(widgetStates).forEach(widgetId => {
        // Check if widget exists in DOM
        if (!document.getElementById(`widget-${widgetId}`)) {
            // Recreate the widget
            recreateWidget(widgetId, widgetStates[widgetId]);
        }
    });

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

        // Setup widget controls (minimize, close, rename)
        setupWidgetControls(widget, widgetId);

        // Setup drag handlers
        setupWidgetDragging(widget, widgetId);

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
        },
        'weather': {
            icon: '🌤️',
            title: 'Weather',
            content: `
                <div id="weather-${newWidgetId}" class="weather-container">
                    <div class="weather-setup">
                        <p>Enter your city to get weather:</p>
                        <input type="text" id="weatherCity-${newWidgetId}" placeholder="City name" class="input">
                        <button class="btn btn-primary" onclick="fetchWeatherForWidget('${newWidgetId}')">Get Weather</button>
                    </div>
                </div>
            `,
            hasAddBtn: false
        },
        'pomodoro': {
            icon: '⏱️',
            title: 'Pomodoro Timer',
            content: `
                <div id="pomodoro-${newWidgetId}" class="pomodoro-container">
                    <div class="pomodoro-display">
                        <div class="pomodoro-time" id="pomodoroTime-${newWidgetId}">25:00</div>
                        <div class="pomodoro-label" id="pomodoroLabel-${newWidgetId}">Focus Time</div>
                    </div>
                    <div class="pomodoro-progress">
                        <svg class="pomodoro-ring" width="200" height="200">
                            <circle class="pomodoro-ring-bg" cx="100" cy="100" r="90"></circle>
                            <circle class="pomodoro-ring-progress" id="pomodoroRing-${newWidgetId}" cx="100" cy="100" r="90"></circle>
                        </svg>
                    </div>
                    <div class="pomodoro-controls">
                        <button class="btn btn-primary" id="pomodoroStart-${newWidgetId}">Start</button>
                        <button class="btn btn-secondary" id="pomodoroReset-${newWidgetId}">Reset</button>
                    </div>
                    <div class="pomodoro-settings">
                        <label>Focus: <input type="number" id="pomodoroFocus-${newWidgetId}" value="25" min="1" max="60" class="pomodoro-input"> min</label>
                        <label>Break: <input type="number" id="pomodoroBreak-${newWidgetId}" value="5" min="1" max="30" class="pomodoro-input"> min</label>
                    </div>
                </div>
            `,
            hasAddBtn: false
        },
        'habits': {
            icon: '✨',
            title: 'Habits Tracker',
            content: `
                <div id="habits-${newWidgetId}" class="habits-container">
                    <div class="habits-input-container">
                        <input type="text" id="habitInput-${newWidgetId}" placeholder="Add a new habit..." class="input">
                        <button class="btn btn-primary" onclick="addHabit('${newWidgetId}')">Add</button>
                    </div>
                    <div class="habits-list" id="habitsList-${newWidgetId}"></div>
                </div>
            `,
            hasAddBtn: false
        },
        'stickynotes': {
            icon: '📋',
            title: 'Note',
            content: `
                <div class="stickynote-single" id="stickynote-${newWidgetId}">
                    <textarea
                        class="stickynote-content"
                        id="stickynoteContent-${newWidgetId}"
                        placeholder="Type your note here..."
                    ></textarea>
                </div>
            `,
            hasAddBtn: false,
            isStickyNote: true
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
                ${template.isStickyNote ? '<button class="widget-btn" id="colorBtn-' + newWidgetId + '" title="Change color">🎨</button>' : ''}
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

    // Apply sticky note styling
    if (template.isStickyNote) {
        widget.classList.add('widget-stickynote', 'widget-stickynote-yellow');
    }

    // Initialize the new widget
    const widgetId = newWidgetId;
    setupWidgetDragging(widget, widgetId);
    setupWidgetControls(widget, widgetId);
    setupWidgetResize(widget, widgetId);

    // Initialize widget-specific functionality
    if (type === 'notepad') {
        initNotepadWidget(newWidgetId);
    } else if (type === 'pomodoro') {
        initPomodoroWidget(newWidgetId);
    } else if (type === 'habits') {
        initHabitsWidget(newWidgetId);
    } else if (type === 'stickynotes') {
        initSingleStickyNote(newWidgetId, widget);
    }

    // Close the new widget menu
    document.getElementById('newWidgetMenu').classList.remove('active');

    // Save the widget state
    const initialState = { x: 50, y: 50, closed: false, minimized: false };
    if (type === 'stickynotes') {
        initialState.stickyNoteData = { content: '', color: 'yellow' };
    }
    saveWidgetState(widgetId, initialState);
    updateWidgetBar();
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
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMinimize(widgetId);
        });
    }

    const closeBtn = widget.querySelector('.widget-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeWidget(widgetId);
        });
    }

    // Add double-click to rename widget
    const titleElement = widget.querySelector('h2');
    if (titleElement) {
        titleElement.style.cursor = 'pointer';
        titleElement.title = 'Double-click to rename';
        titleElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            renameWidget(widgetId);
        });
    }
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

        const newWidth = Math.max(300, startWidth + dx);
        const newHeight = Math.max(250, startHeight + dy);

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

    if (pinnedSites.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📌</div>
                <div class="empty-state-text">No pinned sites yet</div>
                <div class="empty-state-hint">Press 'L' or click + to add one</div>
            </div>
        `;
        return;
    }

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
    updateTodoStats();

    document.getElementById('addTodoBtn').addEventListener('click', addTodo);
    document.getElementById('todoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    // Auto-focus on input
    document.getElementById('todoInput').focus();
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

    if (todos.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✓</div>
                <div class="empty-state-text">No todos yet</div>
                <div class="empty-state-hint">Press 'N' or click Add to create one</div>
            </div>
        `;
        return;
    }

    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.draggable = true;
        li.dataset.index = index;

        const priorityBadge = todo.priority && todo.priority !== 'none'
            ? `<span class="todo-priority priority-${todo.priority}">${todo.priority}</span>`
            : '';

        const dueDateBadge = todo.dueDate
            ? `<span class="todo-due-date" title="Due date">${formatDueDate(todo.dueDate)}</span>`
            : '';

        const tagsBadges = todo.tags && todo.tags.length > 0
            ? todo.tags.map(tag => `<span class="todo-tag">${escapeHtml(tag)}</span>`).join('')
            : '';

        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}
                   onchange="toggleTodo(${index})">
            ${priorityBadge}
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <div class="todo-meta">
                ${dueDateBadge}
                ${tagsBadges}
            </div>
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

    updateTodoStats();
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
    const priority = document.getElementById('todoPriority').value;
    const dueDate = document.getElementById('todoDueDate').value;
    const tagsInput = document.getElementById('todoTags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

    if (!text) return;

    todos.push({
        text,
        completed: false,
        priority: priority,
        dueDate: dueDate || null,
        tags: tags,
        createdAt: Date.now()
    });
    saveTodosToStorage();
    renderTodos();
    input.value = '';
    document.getElementById('todoPriority').value = 'none';
    document.getElementById('todoDueDate').value = '';
    document.getElementById('todoTags').value = '';
    input.focus();
}

function updateTodoStats() {
    const completedCount = todos.filter(t => t.completed).length;
    const totalCount = todos.length;
    const statsEl = document.getElementById('todoStats');

    if (statsEl) {
        statsEl.querySelector('.todo-count').textContent = `${completedCount}/${totalCount} completed`;
    }
}

function toggleTodo(index) {
    todos[index].completed = !todos[index].completed;
    saveTodosToStorage();
    renderTodos();
    updateTodoStats();
}

function deleteTodo(index) {
    if (confirm('Delete this todo?')) {
        todos.splice(index, 1);
        saveTodosToStorage();
        renderTodos();
        updateTodoStats();
    }
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
        // Ignore if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }

        // Ctrl+K or Cmd+K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
        }

        // N for new todo
        if (e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            const todoWidget = document.getElementById('widget-todos');
            if (todoWidget && !todoWidget.classList.contains('closed') && !todoWidget.classList.contains('minimized')) {
                const input = document.getElementById('todoInput');
                input.focus();
            }
        }

        // L for new link
        if (e.key === 'l' || e.key === 'L') {
            e.preventDefault();
            openSiteModal();
        }

        // ? for keyboard shortcuts
        if (e.key === '?') {
            e.preventDefault();
            document.getElementById('shortcutsPanel').classList.toggle('active');
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            closeSearch();
            document.getElementById('newWidgetMenu').classList.remove('active');
            document.getElementById('settingsPanel').classList.remove('active');
            document.getElementById('shortcutsPanel').classList.remove('active');
            closeSiteModal();
        }
    });
}

// ===== SETTINGS MANAGEMENT =====
let userSettings = {
    darkMode: true,
    accentColor: '#4a9eff',
    gridSnap: false,
    soundEffects: true,
    backgroundStyle: 'default'
};

function initSettings() {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
        userSettings = { ...userSettings, ...JSON.parse(saved) };
    }
    applySettings();
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(userSettings));
}

function applySettings() {
    // Apply dark mode
    if (!userSettings.darkMode) {
        document.body.classList.add('light-mode');
    }

    // Apply accent color
    document.documentElement.style.setProperty('--accent-primary', userSettings.accentColor);
    document.documentElement.style.setProperty('--accent-hover', adjustColorBrightness(userSettings.accentColor, -20));

    // Apply background gradient
    if (userSettings.backgroundStyle) {
        applyBackgroundGradient(userSettings.backgroundStyle);
    }
}

function adjustColorBrightness(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

// ===== DARK MODE =====
function initDarkMode() {
    const darkModeBtn = document.getElementById('darkModeBtn');

    // Set initial icon
    updateDarkModeIcon();

    darkModeBtn.addEventListener('click', () => {
        userSettings.darkMode = !userSettings.darkMode;
        document.body.classList.toggle('light-mode');
        updateDarkModeIcon();
        saveSettings();
    });
}

function updateDarkModeIcon() {
    const darkModeBtn = document.getElementById('darkModeBtn');
    darkModeBtn.textContent = userSettings.darkMode ? '🌙' : '☀️';
}

// ===== HEADER CONTROLS =====
function initHeaderControls() {
    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');

    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsPanel.classList.toggle('active');
        document.getElementById('shortcutsPanel').classList.remove('active');
    });

    // Help button
    const helpBtn = document.getElementById('helpBtn');
    const shortcutsPanel = document.getElementById('shortcutsPanel');

    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        shortcutsPanel.classList.toggle('active');
        settingsPanel.classList.remove('active');
    });

    // Accent color picker
    const colorPicker = document.getElementById('accentColorPicker');
    colorPicker.value = userSettings.accentColor;

    colorPicker.addEventListener('change', (e) => {
        userSettings.accentColor = e.target.value;
        applySettings();
        saveSettings();
    });

    // Reset color button
    document.getElementById('resetColorBtn').addEventListener('click', () => {
        userSettings.accentColor = '#4a9eff';
        colorPicker.value = userSettings.accentColor;
        applySettings();
        saveSettings();
    });

    // Background style selector
    const backgroundStyle = document.getElementById('backgroundStyle');
    backgroundStyle.value = userSettings.backgroundStyle || 'default';
    backgroundStyle.addEventListener('change', (e) => {
        userSettings.backgroundStyle = e.target.value;
        applySettings();
        saveSettings();
    });

    // Sound effects toggle
    const soundEffects = document.getElementById('soundEffects');
    soundEffects.checked = userSettings.soundEffects !== false;
    soundEffects.addEventListener('change', (e) => {
        userSettings.soundEffects = e.target.checked;
        saveSettings();
    });

    // Widget layout buttons
    document.getElementById('saveLayoutBtn').addEventListener('click', saveWidgetLayout);
    document.getElementById('loadLayoutBtn').addEventListener('click', loadWidgetLayout);

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportData);

    // Import button
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', importData);

    // Close panels when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsPanel.contains(e.target) && e.target !== settingsBtn) {
            settingsPanel.classList.remove('active');
        }
        if (!shortcutsPanel.contains(e.target) && e.target !== helpBtn) {
            shortcutsPanel.classList.remove('active');
        }
    });
}

// ===== EXPORT/IMPORT =====
function exportData() {
    const data = {
        sites: localStorage.getItem(STORAGE_KEYS.SITES),
        todos: localStorage.getItem(STORAGE_KEYS.TODOS),
        notes: localStorage.getItem(STORAGE_KEYS.NOTES),
        widgets: localStorage.getItem(STORAGE_KEYS.WIDGETS),
        settings: localStorage.getItem(STORAGE_KEYS.SETTINGS),
        weather: localStorage.getItem(STORAGE_KEYS.WEATHER),
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);

            if (confirm('Import data? This will overwrite your current dashboard.')) {
                if (data.sites) localStorage.setItem(STORAGE_KEYS.SITES, data.sites);
                if (data.todos) localStorage.setItem(STORAGE_KEYS.TODOS, data.todos);
                if (data.notes) localStorage.setItem(STORAGE_KEYS.NOTES, data.notes);
                if (data.widgets) localStorage.setItem(STORAGE_KEYS.WIDGETS, data.widgets);
                if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, data.settings);
                if (data.weather) localStorage.setItem(STORAGE_KEYS.WEATHER, data.weather);

                alert('Data imported successfully! Reloading...');
                location.reload();
            }
        } catch (error) {
            alert('Error importing data. Please check the file format.');
        }
    };
    reader.readAsText(file);

    // Reset file input
    e.target.value = '';
}



// ===== WEATHER WIDGET =====
async function fetchWeatherForWidget(widgetId) {
    const city = document.getElementById(`weatherCity-${widgetId}`).value.trim();
    const container = document.getElementById(`weather-${widgetId}`);

    if (!city) {
        alert("Please enter a city name");
        return;
    }

    container.innerHTML = `<div class="loading"><div class="loading-spinner"></div></div>`;

    try {
        // Using OpenWeatherMap API (free tier)
        // Note: You would need an API key for this to work
        // For demo purposes, using a mock response
        const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);

        if (!response.ok) throw new Error("City not found");

        const data = await response.json();
        const current = data.current_condition[0];

        const iconMap = {
            "Sunny": "☀️", "Clear": "🌙", "Partly cloudy": "⛅",
            "Cloudy": "☁️", "Overcast": "☁️", "Mist": "🌫️",
            "Fog": "🌫️", "Light rain": "🌧️", "Rain": "🌧️",
            "Heavy rain": "🌧️", "Snow": "❄️", "Thunderstorm": "⛈️"
        };

        const icon = iconMap[current.weatherDesc[0].value] || "🌤️";

        container.innerHTML = `
            <div class="weather-location">${city}</div>
            <div class="weather-main">
                <div class="weather-icon">${icon}</div>
                <div class="weather-temp">${current.temp_C}°C</div>
            </div>
            <div class="weather-description">${current.weatherDesc[0].value}</div>
            <div class="weather-details">
                <div class="weather-detail">
                    <div class="weather-detail-label">Feels Like</div>
                    <div class="weather-detail-value">${current.FeelsLikeC}°C</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Humidity</div>
                    <div class="weather-detail-value">${current.humidity}%</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Wind</div>
                    <div class="weather-detail-value">${current.windspeedKmph} km/h</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Pressure</div>
                    <div class="weather-detail-value">${current.pressure} mb</div>
                </div>
            </div>
        `;

        // Save city to localStorage
        localStorage.setItem(`weather-city-${widgetId}`, city);
    } catch (error) {
        container.innerHTML = `
            <div class="weather-setup">
                <p>Enter your city to get weather:</p>
                <input type="text" id="weatherCity-${widgetId}" placeholder="City name" class="input" value="${city}">
                <button class="btn btn-primary" onclick="fetchWeatherForWidget('${widgetId}')">Get Weather</button>
                <div class="weather-error">Unable to fetch weather. Please try again.</div>
            </div>
        `;
    }
}

// Auto-focus on site modal
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
    setTimeout(() => {
        document.getElementById('siteName').focus();
    }, 100);
}

// ===== UTILITY FUNCTIONS FOR NEW FEATURES =====

// Format due date for display
function formatDueDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if overdue
    if (date < today && date.toDateString() !== today.toDateString()) {
        return '🔴 ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    if (date.toDateString() === today.toDateString()) {
        return '⚠️ Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
        return '🟡 Tomorrow';
    }
    return '📅 ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Sound effect player
function playSound(type) {
    const soundSettings = userSettings.soundEffects !== false;
    if (!soundSettings) return;

    // Create audio context for simple beep sounds
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch(type) {
            case 'click':
                oscillator.frequency.value = 800;
                gainNode.gain.value = 0.1;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.05);
                break;
            case 'complete':
                oscillator.frequency.value = 1000;
                gainNode.gain.value = 0.15;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'alert':
                oscillator.frequency.value = 600;
                gainNode.gain.value = 0.2;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
        }
    } catch (e) {
        // Silently fail if audio context not supported
    }
}

// ===== POMODORO WIDGET =====
const pomodoroTimers = {};

function initPomodoroWidget(widgetId) {
    const timerState = {
        minutes: 25,
        seconds: 0,
        isRunning: false,
        isBreak: false,
        intervalId: null,
        focusTime: 25,
        breakTime: 5
    };

    pomodoroTimers[widgetId] = timerState;

    const startBtn = document.getElementById(`pomodoroStart-${widgetId}`);
    const resetBtn = document.getElementById(`pomodoroReset-${widgetId}`);
    const focusInput = document.getElementById(`pomodoroFocus-${widgetId}`);
    const breakInput = document.getElementById(`pomodoroBreak-${widgetId}`);

    startBtn.addEventListener('click', () => togglePomodoro(widgetId));
    resetBtn.addEventListener('click', () => resetPomodoro(widgetId));

    focusInput.addEventListener('change', () => {
        timerState.focusTime = parseInt(focusInput.value);
        if (!timerState.isRunning && !timerState.isBreak) {
            timerState.minutes = timerState.focusTime;
            timerState.seconds = 0;
            updatePomodoroDisplay(widgetId);
        }
    });

    breakInput.addEventListener('change', () => {
        timerState.breakTime = parseInt(breakInput.value);
    });

    updatePomodoroDisplay(widgetId);
}

function togglePomodoro(widgetId) {
    const state = pomodoroTimers[widgetId];
    const startBtn = document.getElementById(`pomodoroStart-${widgetId}`);

    if (state.isRunning) {
        // Pause
        clearInterval(state.intervalId);
        state.isRunning = false;
        startBtn.textContent = 'Start';
        playSound('click');
    } else {
        // Start
        state.isRunning = true;
        startBtn.textContent = 'Pause';
        playSound('click');

        state.intervalId = setInterval(() => {
            if (state.seconds === 0) {
                if (state.minutes === 0) {
                    // Timer complete
                    clearInterval(state.intervalId);
                    state.isRunning = false;
                    startBtn.textContent = 'Start';
                    playSound('alert');

                    // Switch between focus and break
                    if (state.isBreak) {
                        state.isBreak = false;
                        state.minutes = state.focusTime;
                        document.getElementById(`pomodoroLabel-${widgetId}`).textContent = 'Focus Time';
                    } else {
                        state.isBreak = true;
                        state.minutes = state.breakTime;
                        document.getElementById(`pomodoroLabel-${widgetId}`).textContent = 'Break Time';
                    }
                    state.seconds = 0;
                    updatePomodoroDisplay(widgetId);
                    return;
                }
                state.minutes--;
                state.seconds = 59;
            } else {
                state.seconds--;
            }
            updatePomodoroDisplay(widgetId);
        }, 1000);
    }
}

function resetPomodoro(widgetId) {
    const state = pomodoroTimers[widgetId];
    const startBtn = document.getElementById(`pomodoroStart-${widgetId}`);

    clearInterval(state.intervalId);
    state.isRunning = false;
    state.isBreak = false;
    state.minutes = state.focusTime;
    state.seconds = 0;
    startBtn.textContent = 'Start';
    document.getElementById(`pomodoroLabel-${widgetId}`).textContent = 'Focus Time';
    updatePomodoroDisplay(widgetId);
    playSound('click');
}

function updatePomodoroDisplay(widgetId) {
    const state = pomodoroTimers[widgetId];
    const timeDisplay = document.getElementById(`pomodoroTime-${widgetId}`);
    const ring = document.getElementById(`pomodoroRing-${widgetId}`);

    const mins = String(state.minutes).padStart(2, '0');
    const secs = String(state.seconds).padStart(2, '0');
    timeDisplay.textContent = `${mins}:${secs}`;

    // Update progress ring
    const totalSeconds = (state.isBreak ? state.breakTime : state.focusTime) * 60;
    const currentSeconds = state.minutes * 60 + state.seconds;
    const progress = ((totalSeconds - currentSeconds) / totalSeconds) * 100;

    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (progress / 100) * circumference;
    ring.style.strokeDasharray = `${circumference} ${circumference}`;
    ring.style.strokeDashoffset = offset;
}

// ===== HABITS TRACKER WIDGET =====
const habitsData = {};

function initHabitsWidget(widgetId) {
    const saved = localStorage.getItem(`${STORAGE_KEYS.HABITS}-${widgetId}`);
    habitsData[widgetId] = saved ? JSON.parse(saved) : [];

    renderHabits(widgetId);
}

function addHabit(widgetId) {
    const input = document.getElementById(`habitInput-${widgetId}`);
    const habitName = input.value.trim();

    if (!habitName) return;

    habitsData[widgetId].push({
        name: habitName,
        history: {},
        streak: 0,
        createdAt: Date.now()
    });

    saveHabits(widgetId);
    renderHabits(widgetId);
    input.value = '';
}

function toggleHabitDay(widgetId, habitIndex) {
    const today = new Date().toISOString().split('T')[0];
    const habit = habitsData[widgetId][habitIndex];

    if (habit.history[today]) {
        delete habit.history[today];
    } else {
        habit.history[today] = true;
    }

    // Calculate streak
    habit.streak = calculateStreak(habit.history);

    saveHabits(widgetId);
    renderHabits(widgetId);
}

function calculateStreak(history) {
    let streak = 0;
    let currentDate = new Date();

    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (history[dateStr]) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

function deleteHabit(widgetId, habitIndex) {
    if (confirm('Delete this habit?')) {
        habitsData[widgetId].splice(habitIndex, 1);
        saveHabits(widgetId);
        renderHabits(widgetId);
    }
}

function renderHabits(widgetId) {
    const container = document.getElementById(`habitsList-${widgetId}`);
    const habits = habitsData[widgetId];

    if (!habits || habits.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-text">No habits yet</div></div>';
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    container.innerHTML = habits.map((habit, index) => `
        <div class="habit-item">
            <div class="habit-header">
                <div class="habit-name">${escapeHtml(habit.name)}</div>
                <div class="habit-streak">${habit.streak > 0 ? `🔥 ${habit.streak} day${habit.streak > 1 ? 's' : ''}` : ''}</div>
                <button class="habit-delete" onclick="deleteHabit('${widgetId}', ${index})">×</button>
            </div>
            <div class="habit-check">
                <label class="habit-checkbox-label">
                    <input type="checkbox"
                           ${habit.history[today] ? 'checked' : ''}
                           onchange="toggleHabitDay('${widgetId}', ${index})">
                    <span>Today</span>
                </label>
            </div>
        </div>
    `).join('');
}

function saveHabits(widgetId) {
    localStorage.setItem(`${STORAGE_KEYS.HABITS}-${widgetId}`, JSON.stringify(habitsData[widgetId]));
}

// ===== SINGLE STICKY NOTE WIDGET =====
function initSingleStickyNote(widgetId, widget) {
    const state = widgetStates[widgetId];
    const noteData = state?.stickyNoteData || { content: '', color: 'yellow' };

    // Apply saved color
    widget.className = widget.className.replace(/widget-stickynote-\w+/, '');
    widget.classList.add(`widget-stickynote-${noteData.color}`);

    // Set saved values
    const contentInput = document.getElementById(`stickynoteContent-${widgetId}`);

    if (contentInput) contentInput.value = noteData.content || '';

    // Setup content textarea
    if (contentInput) {
        contentInput.addEventListener('input', () => {
            saveStickyNoteData(widgetId, contentInput.value);
        });
        // Focus on creation
        setTimeout(() => contentInput.focus(), 100);
    }

    // Setup color button
    const colorBtn = document.getElementById(`colorBtn-${widgetId}`);
    if (colorBtn) {
        colorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showColorPicker(widgetId, widget, colorBtn);
        });
    }
}

function saveStickyNoteData(widgetId, content) {
    const state = widgetStates[widgetId] || {};
    const currentColor = state.stickyNoteData?.color || 'yellow';

    state.stickyNoteData = {
        content: content,
        color: currentColor
    };

    saveWidgetState(widgetId, state);
}

function showColorPicker(widgetId, widget, colorBtn) {
    // Remove any existing color picker
    const existingPicker = document.querySelector('.color-picker-menu');
    if (existingPicker) {
        existingPicker.remove();
        return; // Toggle off if clicking again
    }

    const colors = [
        { name: 'yellow', label: 'Yellow' },
        { name: 'blue', label: 'Blue' },
        { name: 'green', label: 'Green' },
        { name: 'pink', label: 'Pink' },
        { name: 'purple', label: 'Purple' },
        { name: 'orange', label: 'Orange' },
        { name: 'dark-blue', label: 'Dark Blue' },
        { name: 'dark-green', label: 'Dark Green' },
        { name: 'dark-purple', label: 'Dark Purple' },
        { name: 'dark-gray', label: 'Dark Gray' }
    ];

    // Create color picker menu
    const picker = document.createElement('div');
    picker.className = 'color-picker-menu';

    colors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.className = `color-option color-option-${color.name}`;
        colorOption.title = color.label;
        colorOption.addEventListener('click', () => {
            selectStickyNoteColor(widgetId, widget, color.name);
            picker.remove();
        });
        picker.appendChild(colorOption);
    });

    // Position near the button
    const rect = colorBtn.getBoundingClientRect();
    picker.style.position = 'absolute';
    picker.style.top = (rect.bottom + 5) + 'px';
    picker.style.left = rect.left + 'px';

    document.body.appendChild(picker);

    // Close when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeColorPicker(e) {
            if (!picker.contains(e.target) && e.target !== colorBtn) {
                picker.remove();
                document.removeEventListener('click', closeColorPicker);
            }
        });
    }, 0);
}

function selectStickyNoteColor(widgetId, widget, color) {
    const state = widgetStates[widgetId];

    // Update widget styling
    widget.className = widget.className.replace(/widget-stickynote-[\w-]+/g, '');
    widget.classList.add('widget-stickynote', `widget-stickynote-${color}`);

    // Save color
    if (state.stickyNoteData) {
        state.stickyNoteData.color = color;
    } else {
        state.stickyNoteData = { content: '', color: color };
    }

    saveWidgetState(widgetId, state);
}

// ===== BACKGROUND GRADIENTS =====
function applyBackgroundGradient(style) {
    const gradients = {
        'default': 'linear-gradient(135deg, var(--bg-primary) 0%, #1a1a2e 100%)',
        'purple': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'ocean': 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)',
        'sunset': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'forest': 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
        'midnight': 'linear-gradient(135deg, #232526 0%, #414345 100%)'
    };

    // For light mode, use lighter versions
    if (!userSettings.darkMode) {
        const lightGradients = {
            'default': 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
            'purple': 'linear-gradient(135deg, #a8b4f5 0%, #c4a3d8 100%)',
            'ocean': 'linear-gradient(135deg, #7a85d9 0%, #8ef7ff 100%)',
            'sunset': 'linear-gradient(135deg, #fdb6cc 0%, #fff4a3 100%)',
            'forest': 'linear-gradient(135deg, #6ba3b0 0%, #b8ddc4 100%)',
            'midnight': 'linear-gradient(135deg, #9a9a9a 0%, #c4c4c4 100%)'
        };
        document.body.style.background = lightGradients[style] || lightGradients['default'];
    } else {
        document.body.style.background = gradients[style] || gradients['default'];
    }
}

// ===== WIDGET LAYOUTS =====
function saveWidgetLayout() {
    const layoutName = prompt('Enter a name for this layout:');
    if (!layoutName) return;

    const layouts = JSON.parse(localStorage.getItem(STORAGE_KEYS.LAYOUTS) || '{}');
    layouts[layoutName] = {
        widgets: widgetStates,
        timestamp: Date.now()
    };

    localStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(layouts));
    alert(`Layout "${layoutName}" saved!`);
}

function loadWidgetLayout() {
    const layouts = JSON.parse(localStorage.getItem(STORAGE_KEYS.LAYOUTS) || '{}');
    const layoutNames = Object.keys(layouts);

    if (layoutNames.length === 0) {
        alert('No saved layouts found!');
        return;
    }

    let options = 'Available layouts:\n';
    layoutNames.forEach((name, i) => {
        options += `${i + 1}. ${name}\n`;
    });

    const choice = prompt(options + '\nEnter layout name to load:');
    if (!choice || !layouts[choice]) {
        alert('Layout not found!');
        return;
    }

    if (confirm(`Load layout "${choice}"? This will reset current widget positions.`)) {
        widgetStates = layouts[choice].widgets;
        localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(widgetStates));
        location.reload();
    }
}

