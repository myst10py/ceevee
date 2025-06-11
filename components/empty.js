// Empty State Component for CeeVee
// Clean empty state with shadcn/ui aesthetics

import { escapeHtml } from './utils.js';

// Creates an empty state for no items or no search results
export function createEmptyState(searchQuery = '') {
  const container = document.createElement('div');
  container.className = 'flex h-full items-center justify-center p-8';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  
  const isSearching = searchQuery.length > 0;
  const hasQuery = searchQuery.trim().length > 0;
  
  container.innerHTML = `
    <div class="text-center max-w-xs">
      <!-- Icon -->
      <div class="mx-auto mb-4 h-12 w-12 rounded-full bg-neutral-800 
                  flex items-center justify-center">
        ${isSearching ? `
          <!-- Search icon for no results -->
          <svg class="h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" 
               stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        ` : `
          <!-- Clipboard icon for empty clipboard -->
          <svg class="h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" 
               stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        `}
      </div>
      
      <!-- Title -->
      <h3 class="mb-2 text-sm font-medium text-neutral-300">
        ${isSearching ? 'No results found' : 'Your clipboard is empty'}
      </h3>
      
      <!-- Description -->
      <p class="text-xs text-neutral-500 leading-relaxed">
        ${isSearching 
          ? (hasQuery 
            ? `No items match "${escapeHtml(searchQuery.trim())}"` 
            : 'Start typing to search your clipboard history')
          : 'Copy something to get started'}
      </p>
      
      ${isSearching && hasQuery ? `
        <!-- Search suggestions -->
        <div class="mt-4 space-y-2">
          <p class="text-xs text-neutral-600 font-medium">Try searching for:</p>
          <div class="flex flex-wrap gap-1 justify-center">
            <span class="inline-flex items-center px-2 py-1 rounded-md bg-neutral-800 
                         text-xs text-neutral-400 border border-neutral-700">
              URLs
            </span>
            <span class="inline-flex items-center px-2 py-1 rounded-md bg-neutral-800 
                         text-xs text-neutral-400 border border-neutral-700">
              Code
            </span>
            <span class="inline-flex items-center px-2 py-1 rounded-md bg-neutral-800 
                         text-xs text-neutral-400 border border-neutral-700">
              Text
            </span>
          </div>
        </div>
      ` : ''}
      
      ${!isSearching ? `
        <!-- Getting started tips -->
        <div class="mt-6 space-y-3">
          <div class="flex items-center justify-center gap-2 text-xs text-neutral-600">
            <kbd class="inline-flex h-5 items-center gap-1 rounded 
                      border border-neutral-600 bg-neutral-700 px-1.5 
                      font-mono text-xs text-neutral-400">
              <span class="text-xs"></span>C
            </kbd>
            <span>to copy</span>
          </div>
          <div class="flex items-center justify-center gap-2 text-xs text-neutral-600">
            <kbd class="inline-flex h-5 items-center gap-1 rounded 
                      border border-neutral-600 bg-neutral-700 px-1.5 
                      font-mono text-xs text-neutral-400">
              <span class="text-xs">ç</span>V
            </kbd>
            <span>to open CeeVee</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  return container;
}

// Alternative empty state for specific contexts
export function createSearchEmptyState(query, totalItems = 0) {
  const container = document.createElement('div');
  container.className = 'flex h-full items-center justify-center p-8';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  
  container.innerHTML = `
    <div class="text-center max-w-sm">
      <!-- Magnifying glass with X -->
      <div class="mx-auto mb-4 h-12 w-12 rounded-full bg-neutral-800 
                  flex items-center justify-center relative">
        <svg class="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" 
             stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <div class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500/20 
                    flex items-center justify-center">
          <svg class="h-2.5 w-2.5 text-red-400" fill="none" viewBox="0 0 24 24" 
               stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
      
      <h3 class="mb-2 text-sm font-medium text-neutral-300">
        No matches for "${escapeHtml(query)}"
      </h3>
      
      <p class="text-xs text-neutral-500 mb-4">
        ${totalItems > 0 
          ? `Searched through ${totalItems} clipboard items` 
          : 'Your clipboard history is empty'}
      </p>
      
      <!-- Search tips -->
      <div class="space-y-2">
        <p class="text-xs text-neutral-600 font-medium">Search tips:</p>
        <ul class="text-xs text-neutral-600 space-y-1">
          <li>" Try different keywords</li>
          <li>" Check your spelling</li>
          <li>" Use fewer words</li>
        </ul>
      </div>
    </div>
  `;
  
  return container;
}

// Empty state for when clipboard service is unavailable
export function createErrorEmptyState(error = '') {
  const container = document.createElement('div');
  container.className = 'flex h-full items-center justify-center p-8';
  container.setAttribute('role', 'alert');
  container.setAttribute('aria-live', 'assertive');
  
  container.innerHTML = `
    <div class="text-center max-w-xs">
      <!-- Warning icon -->
      <div class="mx-auto mb-4 h-12 w-12 rounded-full bg-red-500/20 
                  flex items-center justify-center">
        <svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" 
             stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.088 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h3 class="mb-2 text-sm font-medium text-red-300">
        Clipboard unavailable
      </h3>
      
      <p class="text-xs text-neutral-500 mb-4">
        ${error || 'Unable to access clipboard history'}
      </p>
      
      <!-- Retry suggestion -->
      <div class="space-y-2">
        <p class="text-xs text-neutral-600">Try:</p>
        <ul class="text-xs text-neutral-600 space-y-1 text-left">
          <li>" Restarting CeeVee</li>
          <li>" Checking permissions</li>
          <li>" Copying something new</li>
        </ul>
      </div>
    </div>
  `;
  
  return container;
}

// Loading state (for when clipboard is being loaded)
export function createLoadingState() {
  const container = document.createElement('div');
  container.className = 'flex h-full items-center justify-center p-8';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-label', 'Loading clipboard history');
  
  container.innerHTML = `
    <div class="text-center">
      <!-- Spinning clipboard icon -->
      <div class="mx-auto mb-4 h-12 w-12 rounded-full bg-neutral-800 
                  flex items-center justify-center">
        <svg class="h-6 w-6 text-neutral-500 animate-spin" fill="none" 
             viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      
      <p class="text-sm text-neutral-400">
        Loading clipboard history...
      </p>
    </div>
  `;
  
  return container;
}