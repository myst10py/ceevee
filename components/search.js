// Search Input Component for CeeVee
// shadcn/ui-inspired search with command palette feel

import { cn } from './utils.js';

// Creates a search input with icon and clear button
export function createSearchInput() {
  const container = document.createElement('div');
  container.className = 'relative';
  
  container.innerHTML = `
    <div class="relative">
      <!-- Search Icon -->
      <svg 
        class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
        />
      </svg>
      
      <!-- Input Field -->
      <input
        id="search"
        type="text"
        placeholder="Search clipboard..."
        class="h-10 w-full rounded-lg border border-neutral-700 
               bg-neutral-800/50 pl-10 pr-10 text-sm text-neutral-100 
               placeholder:text-neutral-400 
               focus:border-blue-500 focus:outline-none focus:ring-2 
               focus:ring-blue-500/20"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
      />
      
      <!-- Clear Button (hidden by default) -->
      <button
        id="clear-search"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1
               text-neutral-400 opacity-0 transition-opacity
               hover:bg-neutral-700 hover:text-neutral-200"
        style="display: none;"
        aria-label="Clear search"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  `;
  
  // Add interactivity
  const input = container.querySelector('#search');
  const clearBtn = container.querySelector('#clear-search');
  
  // Show/hide clear button based on input content
  input.addEventListener('input', (e) => {
    if (e.target.value.trim()) {
      clearBtn.style.display = 'block';
      clearBtn.style.opacity = '1';
    } else {
      clearBtn.style.opacity = '0';
      setTimeout(() => {
        if (!input.value.trim()) {
          clearBtn.style.display = 'none';
        }
      }, 150);
    }
    
    // Dispatch custom search event
    container.dispatchEvent(new CustomEvent('search', {
      detail: { query: e.target.value.trim() }
    }));
  });
  
  // Clear button functionality
  clearBtn.addEventListener('click', () => {
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.focus();
  });
  
  // Escape key clears search when focused
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && input.value.trim()) {
      e.preventDefault();
      input.value = '';
      input.dispatchEvent(new Event('input'));
    }
  });
  
  // Public API
  container.getInput = () => input;
  container.getValue = () => input.value.trim();
  container.setValue = (value) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  container.focus = () => input.focus();
  container.clear = () => {
    input.value = '';
    input.dispatchEvent(new Event('input'));
  };
  
  return container;
}

// Alternative search input variant with different styling
export function createCommandPaletteSearch() {
  const container = document.createElement('div');
  container.className = cn(
    'relative flex items-center',
    'rounded-lg border border-neutral-700',
    'bg-neutral-800/50 backdrop-blur-sm',
    'focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
  );
  
  container.innerHTML = `
    <!-- Command icon -->
    <div class="flex items-center pl-3">
      <svg class="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
    
    <!-- Input -->
    <input
      type="text"
      placeholder="Type to search clipboard..."
      class="flex-1 bg-transparent py-2.5 pl-2 pr-4 text-sm text-neutral-100 
             placeholder:text-neutral-400 focus:outline-none"
      autocomplete="off"
      spellcheck="false"
    />
    
    <!-- Keyboard shortcut hint -->
    <div class="pr-3">
      <kbd class="hidden sm:inline-flex h-5 items-center gap-1 rounded 
                  border border-neutral-600 bg-neutral-700 px-1.5 
                  font-mono text-xs text-neutral-300">
        <span class="text-xs"></span>K
      </kbd>
    </div>
  `;
  
  const input = container.querySelector('input');
  
  // Add search functionality
  input.addEventListener('input', (e) => {
    container.dispatchEvent(new CustomEvent('search', {
      detail: { query: e.target.value.trim() }
    }));
  });
  
  // Public API
  container.getInput = () => input;
  container.getValue = () => input.value.trim();
  container.setValue = (value) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  container.focus = () => input.focus();
  
  return container;
}