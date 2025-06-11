# CeeVee: Minimal Clipboard Manager - Product Requirements Document

## What CeeVee Does
CeeVee is a lightweight, keyboard-first clipboard manager for macOS that saves everything you copy and lets you access it instantly. No more losing that important text you copied 10 minutes ago.

## Design Ethos
**Minimal. Fast. Invisible.**
- Keyboard-first interaction (zero mouse dependency)
- Appears instantly, disappears immediately  
- Clean, distraction-free interface
- Works in background without thinking about it

## Core Features (Weekend Build Scope)

### 1. Automatic Clipboard Capture
- Monitors system clipboard continuously
- Saves all copied text automatically
- Stores last 50 items (configurable)
- Plain text only (no rich formatting for v1)

### 2. Instant Access
- **Global shortcut:** `Shift + Cmd + V`
- Floating window appears over current app
- Shows list of recent clipboard items
- Press `Esc` to dismiss

### 3. Keyboard Navigation
- `↑/↓` arrows to navigate list
- `Enter` to paste selected item
- `Cmd + 1-9` for quick paste (first 9 items)
- `Cmd + Delete` to remove selected item

### 4. Basic Search
- Start typing to filter clipboard history
- Real-time search as you type
- `Cmd + F` to focus search box

## User Flow
1. User copies text anywhere in macOS → CeeVee saves it automatically
2. User needs previous clipboard item → Press `Shift + Cmd + V`
3. CeeVee window appears → Navigate with arrows or type to search
4. Press `Enter` → Item pastes to active app, window disappears

## Interface Specifications

### Window Design
- **Size:** 400px wide × 300px tall (fixed)
- **Position:** Center of active screen
- **Style:** Floating panel with subtle shadow
- **Background:** System background blur + transparency

### List Items
- **Height:** 40px per item
- **Content:** First 60 characters of clipboard text
- **Selection:** Highlight current item clearly
- **Scrolling:** If more than 7 items visible

### Typography
- **Font:** SF Pro (system default)
- **Size:** 13pt for list items, 11pt for metadata
- **Color:** System text colors (adapts to dark/light mode)

## Technical Requirements

### Storage
- Local SQLite database in `~/Library/Application Support/CeeVee/`
- Simple schema: `id`, `content`, `timestamp`, `source_app`
- Auto-cleanup: Remove items older than 7 days

### System Integration
- NSPasteboard monitoring for clipboard changes
- Global hotkey registration (Carbon or modern equivalent)
- No special permissions required for basic functionality

### Performance
- < 50MB memory usage
- < 1% CPU when idle
- < 100ms response time for window appearance

## What We're NOT Building (v1)
- Rich text/image support
- Cloud sync
- Multiple selection
- Custom categories/tags
- Advanced search filters
- Preferences window (use sensible defaults)

## Success Metrics
- Window appears in < 100ms
- Zero crashes during normal operation
- Works seamlessly across all macOS apps
- User doesn't think about it until they need it

---

**Build Priority:** Core clipboard capture → Global shortcut → Basic UI → Search functionality

**Timeline:** 2-3 days for core features, polish on day 3