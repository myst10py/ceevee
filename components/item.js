// Clipboard Item Component for CeeVee
// Beautiful list item with shadcn/ui styling

import { cn, truncateText, escapeHtml, formatRelativeTime, highlightSearchTerms, animate } from './utils.js';

// Creates a clipboard item with content, metadata, and keyboard shortcuts
export function createClipboardItem(data, index, isSelected = false, searchQuery = '') {
  const { id, content, timestamp, source_app } = data;
  
  const item = document.createElement('div');
  item.dataset.id = id;
  item.dataset.index = index;
  
  item.className = cn(
    // Base styles
    'group relative flex flex-col gap-1 rounded-lg px-3 py-2.5',
    'transition-all duration-150 cursor-default',
    'border border-transparent',
    
    // Background states
    isSelected 
      ? 'bg-blue-500/20 border-blue-500/50' 
      : 'bg-neutral-800/50 hover:bg-neutral-700/50',
    
    // Focus styles
    'focus:outline-none focus:ring-2 focus:ring-blue-500/50'
  );
  
  // Detect content type for better presentation
  const contentType = detectContentType(content);
  const displayContent = formatContentForDisplay(content, contentType);
  
  item.setAttribute('tabindex', '0');
  item.setAttribute('role', 'option');
  item.setAttribute('aria-selected', isSelected);
  item.setAttribute('aria-label', `${contentType} clipboard item: ${truncateText(content, 50)}`);
  item.setAttribute('aria-describedby', `item-meta-${id}`);
  item.setAttribute('aria-posinset', index + 1);
  
  // Apply search highlighting if there's a search query
  const highlightedContent = searchQuery 
    ? highlightSearchTerms(displayContent, searchQuery, 'bg-yellow-400/30 text-yellow-200 rounded px-0.5')
    : escapeHtml(displayContent);
  
  // Keyboard shortcut badge (only for first 9 items)
  const shortcutBadge = index < 9 ? `
    <div class="absolute right-2 top-1/2 -translate-y-1/2 
                opacity-0 group-hover:opacity-100 group-focus:opacity-100 
                transition-opacity duration-200">
      <kbd class="inline-flex h-5 items-center gap-1 rounded 
                  border border-neutral-600 bg-neutral-700 px-1.5 
                  font-mono text-xs text-neutral-300">
        <span class="text-xs"></span>${index + 1}
      </kbd>
    </div>
  ` : '';
  
  item.innerHTML = `
    <!-- Main Content -->
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 pr-8">
        ${getContentTypeIcon(contentType)}
        <p class="text-sm font-medium text-neutral-100 line-clamp-2 mt-1">
          ${highlightedContent}
        </p>
      </div>
      ${shortcutBadge}
    </div>
    
    <!-- Metadata -->
    <div id="item-meta-${id}" class="flex items-center gap-2 text-xs text-neutral-400" role="group" aria-label="Item metadata">
      <time class="tabular-nums" datetime="${new Date(timestamp).toISOString()}" aria-label="Copied ${formatRelativeTime(timestamp)}">
        ${formatRelativeTime(timestamp)}
      </time>
      ${source_app ? `
        <span aria-hidden="true">"</span>
        <span class="truncate flex items-center gap-1" aria-label="Source application: ${source_app}">
          ${getAppIcon(source_app)}
          ${searchQuery ? highlightSearchTerms(source_app, searchQuery, 'bg-yellow-400/30 text-yellow-200 rounded px-0.5') : escapeHtml(source_app)}
        </span>
      ` : ''}
      <span aria-hidden="true">"</span>
      <span class="text-xs opacity-75" aria-label="Content size: ${getContentSizeInfo(content)}">
        ${getContentSizeInfo(content)}
      </span>
    </div>
  `;
  
  // Add click handler
  item.addEventListener('click', () => {
    item.dispatchEvent(new CustomEvent('item-select', {
      detail: { item: data, index },
      bubbles: true
    }));
  });
  
  // Add double-click for immediate paste
  item.addEventListener('dblclick', () => {
    item.dispatchEvent(new CustomEvent('item-paste', {
      detail: { item: data, index },
      bubbles: true
    }));
  });
  
  // Add keyboard handlers
  item.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        item.dispatchEvent(new CustomEvent('item-paste', {
          detail: { item: data, index },
          bubbles: true
        }));
        break;
      case 'Delete':
      case 'Backspace':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          item.dispatchEvent(new CustomEvent('item-delete', {
            detail: { item: data, index },
            bubbles: true
          }));
        }
        break;
    }
  });
  
  // Public API
  item.getData = () => data;
  item.getIndex = () => index;
  item.setSelected = async (selected) => {
    if (selected) {
      item.classList.remove('bg-neutral-800/50', 'hover:bg-neutral-700/50');
      item.classList.add('bg-blue-500/20', 'border-blue-500/50');
      // Add selection animation
      await animate(item, 'item-selecting');
    } else {
      item.classList.remove('bg-blue-500/20', 'border-blue-500/50');
      item.classList.add('bg-neutral-800/50', 'hover:bg-neutral-700/50');
    }
    item.setAttribute('aria-selected', selected);
  };
  
  item.delete = async () => {
    await animate(item, 'item-deleting');
    item.remove();
  };
  
  item.highlight = (query) => {
    const contentElement = item.querySelector('p');
    const appElement = item.querySelector('.truncate span:last-child');
    
    if (contentElement) {
      const displayContent = formatContentForDisplay(content, detectContentType(content));
      const highlightedContent = query 
        ? highlightSearchTerms(displayContent, query, 'bg-yellow-400/30 text-yellow-200 rounded px-0.5')
        : escapeHtml(displayContent);
      contentElement.innerHTML = highlightedContent;
    }
    
    if (appElement && source_app) {
      const highlightedApp = query 
        ? highlightSearchTerms(source_app, query, 'bg-yellow-400/30 text-yellow-200 rounded px-0.5')
        : escapeHtml(source_app);
      appElement.innerHTML = getAppIcon(source_app) + highlightedApp;
    }
  };
  
  return item;
}

// Detect the type of content for better presentation
function detectContentType(content) {
  const trimmed = content.trim();
  
  // Handle empty content
  if (!trimmed) {
    return 'text';
  }
  
  // URL detection - improved to handle more URL formats including Unicode domains
  if (/^https?:\/\//.test(trimmed) || 
      /^www\.[\w\-\.]+/.test(trimmed) ||
      /^[\w\-\.]+\.(com|org|net|edu|gov|mil|int|co|io|ly|me|tv|dev|app|site|tech)[\w\/\?\&\=\-\.\%\#]*$/i.test(trimmed)) {
    return 'url';
  }
  
  // Email detection - improved to handle Unicode characters
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(trimmed)) {
    return 'email';
  }
  
  // Phone number detection - enhanced for international formats
  const phoneOnly = trimmed.replace(/[\s\-\(\)\+\.]/g, '');
  if (/^[\+]?[\d]{7,15}$/.test(phoneOnly) && 
      /[\(\)\-\+\s\.]/.test(trimmed)) {
    return 'phone';
  }
  
  // Enhanced code detection
  if (isCodeContent(trimmed)) {
    return 'code';
  }
  
  // JSON detection - improved error handling
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON, might be code or structured text
      if (trimmed.includes('{') && trimmed.includes('}')) {
        return 'code'; // Likely code with curly braces
      }
    }
  }
  
  // File path detection - enhanced for various OS formats
  if (/^([\/~]|[A-Za-z]:[\\\/])/.test(trimmed) ||
      /^\.\.?[\/\\]/.test(trimmed) ||
      /[\/\\][^\/\\]*\.[a-zA-Z0-9]{1,10}$/.test(trimmed)) {
    return 'filepath';
  }
  
  // Terminal command detection
  if (isTerminalCommand(trimmed)) {
    return 'command';
  }
  
  // Markdown detection
  if (isMarkdownContent(trimmed)) {
    return 'markdown';
  }
  
  // Very long single-line text (likely URL or encoded data)
  if (trimmed.length > 200 && !trimmed.includes('\n') && !trimmed.includes(' ')) {
    return 'data';
  }
  
  // Default to text
  return 'text';
}

// Helper function to detect code content
function isCodeContent(content) {
  // Programming language keywords and patterns
  const codePatterns = [
    // JavaScript/TypeScript
    /^(function|const|let|var|class|import|export|interface|type|async|await)\s/,
    // Python
    /^(def |class |import |from |if __name__|print\()/,
    // CSS
    /^[.#]?[\w\-]+\s*\{/,
    /^@(media|import|keyframes)/,
    // HTML
    /^<[a-zA-Z][^>]*>/,
    // Shell/Terminal
    /^(sudo |npm |git |cd |ls |mkdir |rm |cp |mv)\s/,
    // Common code symbols
    /^\s*(\/\/|\/\*|\*\/|#|<!--)/,
    // Assignment patterns
    /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*[=:]\s*[^=]/,
    // Function calls
    /^[a-zA-Z_$][a-zA-Z0-9_$]*\(/,
  ];
  
  // Check for indentation (tabs or multiple spaces)
  if (/^\s{2,}/.test(content) || content.includes('\t')) {
    return true;
  }
  
  // Check for semicolon-terminated lines
  if (content.includes(';') && /;\s*\n/.test(content)) {
    return true;
  }
  
  // Check patterns
  return codePatterns.some(pattern => pattern.test(content));
}

// Helper function to detect terminal commands
function isTerminalCommand(content) {
  const commandPatterns = [
    /^(sudo|npm|git|cd|ls|mkdir|rm|cp|mv|curl|wget|ssh|scp|rsync|find|grep|awk|sed|sort|uniq|head|tail|cat|less|more|vim|nano|emacs|python|node|java|gcc|make|cmake|docker|kubectl|helm|terraform)\s/,
    /^[a-zA-Z_][a-zA-Z0-9_]*\s+--?[a-zA-Z]/,
    /\s--?[a-zA-Z][a-zA-Z0-9\-]*(\s|=|$)/
  ];
  
  return commandPatterns.some(pattern => pattern.test(content));
}

// Helper function to detect markdown content
function isMarkdownContent(content) {
  const markdownPatterns = [
    /^#{1,6}\s/, // Headers
    /^\*\*.*\*\*/, // Bold
    /^\*.*\*/, // Italic
    /^```/, // Code blocks
    /^`.*`/, // Inline code
    /^\[.*\]\(.*\)/, // Links
    /^!\[.*\]\(.*\)/, // Images
    /^[-*+]\s/, // Lists
    /^\d+\.\s/, // Numbered lists
    /^>\s/, // Blockquotes
  ];
  
  return markdownPatterns.some(pattern => pattern.test(content)) ||
         content.includes('```') ||
         (content.includes('**') && content.includes('**'));
}

// Format content based on its type
function formatContentForDisplay(content, type) {
  const maxLength = 100;
  
  switch (type) {
    case 'url':
      try {
        const url = new URL(content.trim());
        const domain = url.hostname.replace('www.', '');
        const path = url.pathname === '/' ? '' : url.pathname;
        const search = url.search ? '...' : '';
        return `${domain}${path}${search}`;
      } catch {
        // Handle non-standard URLs
        if (content.startsWith('www.')) {
          return content.substring(4);
        }
        return truncateText(content, maxLength);
      }
    
    case 'code':
    case 'json':
    case 'command':
      // Preserve some formatting for code, normalize whitespace
      const normalized = content.replace(/\s+/g, ' ').trim();
      return normalized.length > maxLength 
        ? normalized.substring(0, maxLength) + '...'
        : normalized;
    
    case 'markdown':
      // Remove markdown syntax for display
      let cleaned = content
        .replace(/^#{1,6}\s/, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/`(.*?)`/g, '$1') // Remove inline code
        .replace(/```[\s\S]*?```/g, '[code block]') // Replace code blocks
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Extract link text
        .replace(/^[-*+]\s/gm, '• ') // Convert list items
        .replace(/^\d+\.\s/gm, '• ') // Convert numbered lists
        .replace(/^>\s/gm, ''); // Remove blockquotes
      
      return truncateText(cleaned.trim(), maxLength);
    
    case 'email':
    case 'phone':
      // Don't truncate emails or phone numbers, but ensure they fit
      return content.trim().length > maxLength 
        ? content.trim().substring(0, maxLength) + '...'
        : content.trim();
    
    case 'filepath':
      // Show filename and parent directory for long paths
      const parts = content.trim().split(/[\/\\]/);
      if (parts.length > 2 && content.length > maxLength) {
        const filename = parts[parts.length - 1];
        const parent = parts[parts.length - 2];
        return `.../${parent}/${filename}`;
      }
      return truncateText(content, maxLength);
    
    case 'data':
      // Show first and last few characters for encoded data
      if (content.length > maxLength) {
        const start = content.substring(0, 20);
        const end = content.substring(content.length - 20);
        return `${start}...${end}`;
      }
      return content;
    
    default:
      return truncateText(content, maxLength);
  }
}

// Get icon for content type
function getContentTypeIcon(type) {
  const iconClass = "inline-block w-3 h-3 mr-1 opacity-60";
  
  switch (type) {
    case 'url':
      return `<svg class="${iconClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>`;
    
    case 'email':
      return `<svg class="${iconClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>`;
    
    case 'phone':
      return `<svg class="${iconClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>`;
    
    case 'code':
      return `<svg class="${iconClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>`;
    
    case 'json':
      return `<svg class="${iconClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>`;
    
    case 'filepath':
      return `<svg class="${iconClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>`;
    
    case 'command':
      return `<svg class="${iconClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>`;
    
    case 'markdown':
      return `<svg class="${iconClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>`;
    
    case 'data':
      return `<svg class="${iconClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>`;
    
    default:
      return `<svg class="${iconClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>`;
  }
}

// Get icon for source app
function getAppIcon(appName) {
  // Simple app icon mapping - in a real app, you might use actual app icons
  const iconClass = "inline-block w-3 h-3 opacity-60";
  
  switch (appName.toLowerCase()) {
    case 'safari':
    case 'chrome':
    case 'firefox':
      return `<svg class="${iconClass}" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clip-rule="evenodd" />
      </svg>`;
    
    case 'terminal':
    case 'iterm':
      return `<svg class="${iconClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>`;
    
    default:
      return '';
  }
}

// Get content size information
function getContentSizeInfo(content) {
  const chars = content.length;
  const words = content.trim().split(/\s+/).length;
  const lines = content.split('\n').length;
  
  if (lines > 1) {
    return `${lines} lines`;
  } else if (words > 20) {
    return `${words} words`;
  } else {
    return `${chars} chars`;
  }
}