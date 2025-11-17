# Personal Homepage Dashboard

A dark-themed browser homepage with productivity features including todo list, pinned websites, and notepad.

## Features

- **Dark Theme** - Easy on the eyes with a modern, sleek design
- **Live Clock & Date** - Always know what time it is
- **Dynamic Greeting** - Changes based on time of day
- **Pinned Websites** - Quick access to your favorite sites
- **Todo List** - Keep track of tasks with persistent storage
- **Notepad** - Auto-saving notepad for quick notes
- **Local Storage** - All data saved locally in your browser

## Setup as Browser Homepage

### Chrome/Edge
1. Open `index.html` in your browser
2. Copy the file path from the address bar (e.g., `file:///home/user/Personal-Site/index.html`)
3. Go to Settings → Appearance → "Show home button"
4. Set "On startup" to "Open a specific page or set of pages"
5. Paste the file path

### Firefox
1. Open `index.html` in your browser
2. Click the Settings menu (≡) → Settings
3. Go to "Home" section
4. Set "Homepage and new windows" to "Custom URLs"
5. Paste the file path (e.g., `file:///home/user/Personal-Site/index.html`)

### Safari
1. Open `index.html` in your browser
2. Safari → Preferences → General
3. Set "Homepage" to the file path

## How to Use

### Pinned Websites
- Click the **+** button to add a new website
- Click on any site card to visit it
- Hover over a card and click **×** to remove it
- Default sites (Google, YouTube, GitHub, Gmail) are pre-loaded

### Todo List
- Type your task and click "Add" or press Enter
- Check the box to mark tasks complete
- Click **×** to delete a task
- All todos are saved automatically

### Notepad
- Start typing anywhere in the notepad
- Notes auto-save after 1 second of inactivity
- Perfect for quick thoughts and reminders

## Local Development

Simply open `index.html` in your browser. No build process required!

## Data Storage

All data is stored in your browser's localStorage:
- Pinned sites
- Todo items
- Notepad content

Data persists across browser sessions but is specific to each browser/profile.

## Customization

Edit `styles.css` to customize colors and appearance. Key CSS variables:
- `--bg-primary`: Main background color
- `--bg-secondary`: Card background color
- `--accent-primary`: Primary accent color (buttons, links)
- `--text-primary`: Main text color

## Tech Stack

- Pure HTML/CSS/JavaScript
- No frameworks or dependencies
- LocalStorage for data persistence
- Responsive design for all screen sizes
