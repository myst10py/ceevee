/**
 * CeeVee Renderer - UI Logic and State Management
 * Handles the frontend user interface interactions
 */

// Component imports commented out for Phase 2 IPC testing
// TODO: Re-enable when component system is tested
// import { createClipboardItem } from './components/item.js';
// import { createSearchInput } from './components/search.js';
// import { createEmptyState, createSearchEmptyState, createLoadingState } from './components/empty.js';
// import { debounce, scrollIntoViewSmooth } from './components/utils.js';

// Simple implementations for Phase 2 testing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

class CeeVeeUI {
  constructor() {
    this.state = {
      clipboardItems: [],
      selectedIndex: 0,
      searchQuery: '',
      filteredItems: [],
      isSearching: false,
      isLoading: false
    };
    
    this.elements = {
      app: null,
      search: null,
      clipboardList: null,
      emptyState: null
    };
    
    // Debounced search function
    this.debouncedSearch = debounce(this.performSearch.bind(this), 150);
    
    this.init();
  }
  
  /**
   * Initialize the UI components and event listeners
   */
  async init() {
    this.cacheElements();
    this.setupEventListeners();
    await this.loadInitialData();
    this.render();
  }
  
  /**
   * Cache DOM elements for performance
   */
  cacheElements() {
    this.elements.app = document.getElementById('app');
    this.elements.search = document.getElementById('search');
    this.elements.clipboardList = document.getElementById('clipboard-list');
    this.elements.emptyState = document.getElementById('empty-state');
  }
  
  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Search input events
    this.elements.search.addEventListener('input', this.handleSearch.bind(this));
    this.elements.search.addEventListener('keydown', this.handleSearchKeydown.bind(this));
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
    
    // Window focus/blur events
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
    window.addEventListener('blur', this.handleWindowBlur.bind(this));
    
    // Clipboard updates listener
    this.setupClipboardListener();
  }
  
  /**
   * Set up clipboard updates listener
   */
  setupClipboardListener() {
    try {
      // Listen for clipboard updates from main process
      window.electronAPI.onClipboardUpdated(() => {
        console.log('Clipboard updated, refreshing items...');
        this.refreshClipboardItems();
      });
      
      console.log('Clipboard listener set up successfully');
    } catch (error) {
      console.error('Failed to set up clipboard listener:', error);
    }
  }
  
  /**
   * Refresh clipboard items from main process
   */
  async refreshClipboardItems() {
    try {
      const items = await window.electronAPI.getClipboardItems();
      
      // Transform the data format if needed
      this.state.clipboardItems = items.map(item => ({
        ...item,
        timestamp: item.timestamp * 1000, // Convert to milliseconds for consistency
        type: item.type || 'text' // Default to text type
      }));
      
      // Re-apply current search filter if active
      if (this.state.isSearching) {
        this.state.filteredItems = this.state.clipboardItems.filter(item =>
          item.content.toLowerCase().includes(this.state.searchQuery) ||
          (item.source_app && item.source_app.toLowerCase().includes(this.state.searchQuery))
        );
      } else {
        this.state.filteredItems = [...this.state.clipboardItems];
      }
      
      // Adjust selection if needed
      if (this.state.selectedIndex >= this.state.filteredItems.length) {
        this.state.selectedIndex = Math.max(0, this.state.filteredItems.length - 1);
      }
      
      this.render();
      console.log('Clipboard items refreshed:', this.state.clipboardItems.length, 'items');
    } catch (error) {
      console.error('Failed to refresh clipboard items:', error);
    }
  }
  
  /**
   * Load initial clipboard data from the main process
   * Using comprehensive real-world test data for Phase 2 development
   */
  async loadInitialData() {
    this.state.isLoading = true;
    this.render(); // Show loading state
    
    try {
      console.log('🔄 Loading clipboard items from main process...');
      
      // Get clipboard items from main process via IPC
      const items = await window.electronAPI.getClipboardItems();
      
      console.log('📥 Received', items.length, 'items from main process');
      console.log('Sample items:', items.slice(0, 3).map(item => ({
        id: item.id,
        content: item.content?.substring(0, 30) + '...',
        timestamp: item.timestamp
      })));
      
      // Transform the data format if needed (backend uses timestamp in seconds, convert to milliseconds)
      this.state.clipboardItems = items.map(item => ({
        ...item,
        timestamp: item.timestamp * 1000, // Convert to milliseconds for consistency
        type: item.type || 'text' // Default to text type
      }));
      
      this.state.filteredItems = [...this.state.clipboardItems];
      
      console.log('✅ Loaded', this.state.clipboardItems.length, 'clipboard items from backend');
      console.log('📋 FilteredItems length:', this.state.filteredItems.length);
      
    } catch (error) {
      console.error('❌ Failed to load clipboard items:', error);
      // Fallback to empty state
      this.state.clipboardItems = [];
      this.state.filteredItems = [];
    }
    
    this.state.isLoading = false;
    
    // Ensure first item is selected
    if (this.state.filteredItems.length > 0) {
      this.state.selectedIndex = 0;
    }
    
    // Render the final state
    this.render();
    
    // Ensure the first item is visible and scroll to top
    if (this.state.filteredItems.length > 0) {
      // First scroll the container to top
      this.elements.clipboardList.scrollTop = 0;
      // Then scroll to selected item (which should be the first one)
      setTimeout(() => this.scrollToSelected(), 10);
    }
  }
  
  /**
   * Handle search input changes
   */
  handleSearch(event) {
    const query = event.target.value.toLowerCase();
    this.state.searchQuery = query;
    this.state.isSearching = query.length > 0;
    
    // Use debounced search for performance
    this.debouncedSearch(query);
  }

  /**
   * Perform the actual search operation
   */
  performSearch(query) {
    console.log('🔍 Performing search for:', query);
    
    if (query.length === 0) {
      this.state.filteredItems = [...this.state.clipboardItems];
      console.log('🔍 Cleared search - showing all', this.state.filteredItems.length, 'items');
    } else {
      this.state.filteredItems = this.state.clipboardItems.filter(item =>
        item.content.toLowerCase().includes(query) ||
        (item.source_app && item.source_app.toLowerCase().includes(query))
      );
      console.log('🔍 Search results:', this.state.filteredItems.length, 'items match "' + query + '"');
    }
    
    // Reset selection when searching, but ensure it's valid
    this.state.selectedIndex = Math.min(0, this.state.filteredItems.length - 1);
    this.render();
  }
  

  /**
   * Handle search input keyboard events
   */
  handleSearchKeydown(event) {
    switch (event.key) {
      case 'Escape':
        if (this.state.searchQuery) {
          // Clear search
          this.elements.search.value = '';
          this.handleSearch({ target: { value: '' } });
        } else {
          // Close window
          this.closeWindow();
        }
        break;
      // Note: Arrow keys and Enter are handled by global handler
      // This prevents double-handling and skipping items
    }
  }
  
  /**
   * Handle global keyboard shortcuts
   */
  handleGlobalKeydown(event) {
    // Handle Cmd+1 through Cmd+9 for quick paste (works anywhere)
    if (event.metaKey && event.key >= '1' && event.key <= '9') {
      event.preventDefault();
      const index = parseInt(event.key) - 1;
      console.log('🔤 Quick paste shortcut:', `⌘${event.key}`, 'for index', index);
      this.pasteItemAtIndex(index);
      return;
    }
    
    // Handle Cmd+F to focus search
    if (event.metaKey && event.key === 'f') {
      event.preventDefault();
      console.log('🔍 Cmd+F pressed - focusing search');
      this.elements.search.focus();
      this.elements.search.select();
      return;
    }
    
    // Handle navigation keys (work when search is NOT focused OR when it's empty)
    const isSearchFocused = document.activeElement === this.elements.search;
    const searchIsEmpty = this.elements.search.value.length === 0;
    
    if (!isSearchFocused || searchIsEmpty) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          console.log('⬇️ Arrow down pressed');
          this.moveSelection(1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          console.log('⬆️ Arrow up pressed');
          this.moveSelection(-1);
          break;
        case 'Enter':
          event.preventDefault();
          console.log('⏎ Enter pressed - pasting selected item');
          this.pasteSelectedItem();
          break;
        case 'Escape':
          event.preventDefault();
          console.log('⎋ Escape pressed - closing window');
          this.closeWindow();
          break;
        case 'f':
          if (event.metaKey) {
            event.preventDefault();
            console.log('🔍 ⌘F pressed - focusing search');
            this.elements.search.focus();
            this.elements.search.select(); // Select all text for easier replacement
          }
          break;
        case 'Backspace':
          if (event.metaKey) {
            event.preventDefault();
            console.log('🗑️ ⌘Backspace pressed - deleting selected item');
            this.deleteSelectedItem();
          }
          break;
        case 'Tab':
          event.preventDefault();
          console.log('⇥ Tab pressed - moving selection down');
          this.moveSelection(1);
          break;
      }
    }
  }
  
  /**
   * Move selection up or down
   */
  moveSelection(direction) {
    if (this.state.filteredItems.length === 0) {
      console.log('⚠️ No items to navigate');
      return;
    }
    
    const maxIndex = this.state.filteredItems.length - 1;
    const oldIndex = this.state.selectedIndex;
    const newIndex = this.state.selectedIndex + direction;
    
    // Wrap around selection for better UX
    if (newIndex < 0) {
      this.state.selectedIndex = maxIndex;
    } else if (newIndex > maxIndex) {
      this.state.selectedIndex = 0;
    } else {
      this.state.selectedIndex = newIndex;
    }
    
    console.log(`📍 Selection moved from ${oldIndex} to ${this.state.selectedIndex} (${direction > 0 ? 'down' : 'up'}) of ${maxIndex + 1} items`);
    this.render();
    this.scrollToSelected();
  }
  
  /**
   * Scroll to ensure selected item is visible
   */
  scrollToSelected() {
    const selectedElement = this.elements.clipboardList.querySelector('.clipboard-item.selected');
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
      console.log('📍 Scrolled to selected item');
    } else {
      console.log('⚠️ No selected element found to scroll to');
    }
  }
  
  /**
   * Paste the currently selected item
   */
  pasteSelectedItem() {
    if (this.state.filteredItems.length > 0 && this.state.selectedIndex < this.state.filteredItems.length) {
      const item = this.state.filteredItems[this.state.selectedIndex];
      this.pasteItem(item);
    }
  }
  
  /**
   * Paste item at specific index
   */
  pasteItemAtIndex(index) {
    if (index < this.state.filteredItems.length) {
      const item = this.state.filteredItems[index];
      this.pasteItem(item);
    }
  }
  
  /**
   * Paste a clipboard item via IPC to main process
   */
  async pasteItem(item) {
    try {
      console.log('📋 Pasting item:', item.content.substring(0, 50) + '...');
      
      // Add visual feedback before pasting
      const itemElement = this.elements.clipboardList.querySelector(`[data-item-id="${item.id}"]`);
      if (itemElement) {
        itemElement.classList.add('item-pasting');
      }
      
      // Send IPC message to main process to paste item
      const result = await window.electronAPI.pasteItem(item.id);
      
      if (result && result.success) {
        console.log('✅ Successfully pasted item');
        // Window will be hidden by the main process after successful paste
      } else {
        console.error('❌ Failed to paste item:', result);
        this.showError('Failed to paste item. Please try again.');
      }
      
    } catch (error) {
      console.error('❌ Failed to paste item:', error);
      // Show error feedback to user
      this.showError('Failed to paste item. Please try again.');
    }
  }
  
  /**
   * Delete the currently selected item
   */
  deleteSelectedItem() {
    if (this.state.filteredItems.length > 0 && this.state.selectedIndex < this.state.filteredItems.length) {
      const item = this.state.filteredItems[this.state.selectedIndex];
      this.deleteItem(item);
    }
  }
  
  /**
   * Delete a clipboard item via IPC to main process
   */
  async deleteItem(item) {
    console.log('Deleting item:', item.content);
    
    // Add deletion animation
    const itemElement = this.elements.clipboardList.querySelector(`[data-item-id="${item.id}"]`);
    if (itemElement) {
      itemElement.classList.add('item-deleting');
      
      try {
        // Send IPC message to main process to delete item
        await window.electronAPI.deleteItem(item.id);
        
        setTimeout(() => {
          // Remove from state
          this.state.clipboardItems = this.state.clipboardItems.filter(i => i.id !== item.id);
          this.state.filteredItems = this.state.filteredItems.filter(i => i.id !== item.id);
          
          // Adjust selection
          if (this.state.selectedIndex >= this.state.filteredItems.length) {
            this.state.selectedIndex = Math.max(0, this.state.filteredItems.length - 1);
          }
          
          this.render();
        }, 200);
      } catch (error) {
        console.error('Failed to delete item:', error);
        // Remove deletion animation on error
        itemElement.classList.remove('item-deleting');
        this.showError('Failed to delete item. Please try again.');
      }
    }
  }
  
  /**
   * Close the window via IPC to main process
   */
  closeWindow() {
    this.elements.app.classList.add('window-exiting');
    setTimeout(() => {
      try {
        // Send IPC message to main process to hide window
        if (window.electronAPI && window.electronAPI.hideWindow) {
          window.electronAPI.hideWindow();
        } else {
          // Fallback: just hide the window directly
          window.close();
        }
      } catch (error) {
        console.error('Failed to close window:', error);
        // Fallback: just hide the window directly
        window.close();
      }
    }, 100);
  }
  
  /**
   * Show error message to user
   */
  showError(message) {
    // Create error notification element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium backdrop-blur-sm';
    errorDiv.textContent = message;
    
    // Add to DOM
    document.body.appendChild(errorDiv);
    
    // Animate in
    errorDiv.style.transform = 'translateX(100%)';
    errorDiv.style.transition = 'transform 0.3s ease-out';
    setTimeout(() => {
      errorDiv.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      errorDiv.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 300);
    }, 3000);
  }
  
  /**
   * Handle window focus
   */
  handleWindowFocus() {
    console.log('🔍 Window focused - enabling keyboard navigation');
    // Clear any existing search when window regains focus for fresh start
    if (this.elements.search.value.length > 0) {
      this.elements.search.value = '';
      this.handleSearch({ target: { value: '' } });
    }
    
    // Don't auto-focus search - let users navigate with keyboard first
    // Users can press Cmd+F to focus search when needed
    document.body.focus();
    
    // Ensure first item is selected for immediate keyboard navigation
    if (this.state.filteredItems.length > 0) {
      this.state.selectedIndex = 0;
      this.render();
      // Scroll to top to show the first item
      this.elements.clipboardList.scrollTop = 0;
      setTimeout(() => this.scrollToSelected(), 10);
    }
  }
  
  /**
   * Handle window blur
   */
  handleWindowBlur() {
    // Optional: Close window when it loses focus
    // this.closeWindow();
  }
  
  /**
   * Render the UI
   */
  render() {
    this.renderClipboardList();
    this.updateEmptyState();
  }
  
  /**
   * Render the clipboard items list using enhanced component system
   */
  renderClipboardList() {
    const listContainer = this.elements.clipboardList;
    
    // Show loading state if needed
    if (this.state.isLoading) {
      listContainer.innerHTML = '<div class="flex items-center justify-center h-full py-12"><div class="text-white/50">Loading...</div></div>';
      return;
    }
    
    // Clear ALL dynamic content when not loading (including loading HTML)
    const emptyState = listContainer.querySelector('#empty-state');
    listContainer.innerHTML = ''; // Clear everything including loading text
    
    // Restore the empty state element
    if (emptyState) {
      listContainer.appendChild(emptyState);
    }
    
    // Debug logging to understand what's happening
    console.log('🔍 Rendering clipboard list:');
    console.log('  - Total clipboard items:', this.state.clipboardItems.length);
    console.log('  - Filtered items:', this.state.filteredItems.length);
    console.log('  - Is searching:', this.state.isSearching);
    console.log('  - Search query:', this.state.searchQuery);
    
    if (this.state.filteredItems.length === 0) {
      console.log('⚠️ No filtered items to display');
      return;
    }
    
    // Hide empty state
    this.elements.emptyState.style.display = "none";
    
    // Create and append each item
    console.log('📋 Creating', this.state.filteredItems.length, 'clipboard items');
    this.state.filteredItems.forEach((item, index) => {
      console.log(`  - Item ${index}:`, item.content.substring(0, 50) + '...');
      const itemElement = this.createClipboardItemElement(item, index);
      listContainer.appendChild(itemElement);
    });
    
    console.log('✅ Finished rendering clipboard list');
  }
  
  /**
   * Create a clipboard item DOM element with enhanced visual design
   */
  createClipboardItemElement(item, index) {
    const itemDiv = document.createElement('div');
    const isSelected = index === this.state.selectedIndex;
    
    // Enhanced visual states using CSS custom properties
    itemDiv.className = `clipboard-item group relative transition-all duration-150 cursor-default focus:outline-none ${
      isSelected 
        ? 'selected' 
        : ''
    }`;
    itemDiv.setAttribute('data-item-id', item.id);
    itemDiv.setAttribute('tabindex', '0');
    itemDiv.setAttribute('role', 'option');
    itemDiv.setAttribute('aria-selected', isSelected.toString());
    
    // Main content container with proper layout
    const contentContainer = document.createElement('div');
    contentContainer.className = 'flex items-start justify-between gap-3 w-full';
    
    // Left side - content and metadata
    const leftContent = document.createElement('div');
    leftContent.className = 'flex-1 min-w-0'; // min-w-0 for proper truncation
    
    // Primary content with better typography
    const contentDiv = document.createElement('div');
    contentDiv.className = 'item-content mb-1';
    contentDiv.textContent = this.truncateText(item.content, 70);
    contentDiv.setAttribute('title', item.content); // Full content on hover
    
    // Enhanced metadata with better visual hierarchy
    const metaDiv = document.createElement('div');
    metaDiv.className = 'item-meta flex items-center gap-1';
    
    // Time badge with subtle styling
    const timeSpan = document.createElement('span');
    timeSpan.className = 'px-2 py-0.5 text-xs rounded-full bg-black/10 text-current';
    timeSpan.textContent = this.getRelativeTime(item.timestamp);
    metaDiv.appendChild(timeSpan);
    
    // Source app with icon-like styling if available
    if (item.source_app) {
      const appSpan = document.createElement('span');
      appSpan.className = 'px-2 py-0.5 text-xs rounded-full bg-black/5 text-current';
      appSpan.textContent = item.source_app;
      metaDiv.appendChild(appSpan);
    }
    
    // Assemble left content
    leftContent.appendChild(contentDiv);
    leftContent.appendChild(metaDiv);
    
    // Right side - keyboard shortcut badge
    const rightContent = document.createElement('div');
    rightContent.className = 'flex-shrink-0';
    
    // Enhanced keyboard shortcut design (for first 9 items)
    if (index < 9) {
      const shortcutBadge = document.createElement('div');
      shortcutBadge.className = 'shortcut flex items-center justify-center';
      
      const kbd = document.createElement('kbd');
      kbd.className = 'min-w-[20px] h-5 flex items-center justify-center text-xs font-mono font-medium rounded border transition-colors';
      kbd.textContent = `⌘${index + 1}`;
      
      shortcutBadge.appendChild(kbd);
      rightContent.appendChild(shortcutBadge);
    }
    
    // Assemble main container
    contentContainer.appendChild(leftContent);
    contentContainer.appendChild(rightContent);
    itemDiv.appendChild(contentContainer);
    
    // Enhanced interaction handlers
    itemDiv.addEventListener('click', (e) => {
      e.preventDefault();
      this.state.selectedIndex = index;
      this.render();
      this.pasteSelectedItem();
    });
    
    // Add hover effects and keyboard navigation support
    itemDiv.addEventListener('mouseenter', () => {
      if (!isSelected) {
        itemDiv.classList.add('hover');
      }
    });
    
    itemDiv.addEventListener('mouseleave', () => {
      itemDiv.classList.remove('hover');
    });
    
    // Add selection animation when selected
    if (isSelected) {
      // Add a subtle pulse effect when item becomes selected
      setTimeout(() => {
        itemDiv.classList.add('item-selecting');
        setTimeout(() => {
          itemDiv.classList.remove('item-selecting');
        }, 200);
      }, 10);
    }
    
    return itemDiv;
  }
  
  /**
   * Update empty state visibility
   */
  updateEmptyState() {
    if (this.state.filteredItems.length === 0) {
      this.elements.emptyState.style.display = 'flex';
      
      if (this.state.isSearching) {
        // Show "no results" message
        const title = this.elements.emptyState.querySelector('h3');
        const subtitle = this.elements.emptyState.querySelector('p');
        title.textContent = 'No items match your search';
        subtitle.textContent = 'Try a different search term';
      } else {
        // Show "empty clipboard" message
        const title = this.elements.emptyState.querySelector('h3');
        const subtitle = this.elements.emptyState.querySelector('p');
        title.textContent = 'Your clipboard is empty';
        subtitle.textContent = 'Copy something to get started';
      }
    } else {
      this.elements.emptyState.style.display = 'none';
    }
  }
  
  /**
   * Utility: Truncate text to specific length
   */
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  /**
   * Utility: Get relative time string
   */
  getRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }
  
  /**
   * Utility: Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * Update clipboard items from main process
   * This method will be called when new clipboard data is received
   */
  updateClipboardItems(items) {
    this.state.clipboardItems = items;
    
    // Re-apply current search filter if active
    if (this.state.isSearching) {
      this.state.filteredItems = this.state.clipboardItems.filter(item =>
        item.content.toLowerCase().includes(this.state.searchQuery) ||
        (item.source_app && item.source_app.toLowerCase().includes(this.state.searchQuery))
      );
    } else {
      this.state.filteredItems = [...this.state.clipboardItems];
    }
    
    // Adjust selection if needed
    if (this.state.selectedIndex >= this.state.filteredItems.length) {
      this.state.selectedIndex = Math.max(0, this.state.filteredItems.length - 1);
    }
    
    this.render();
  }
}

/**
 * Utility function for conditional class names
 */
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Initialize the UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.ceeVeeUI = new CeeVeeUI();
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CeeVeeUI;
}