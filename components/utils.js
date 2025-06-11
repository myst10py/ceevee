// Base Component Utilities for CeeVee
// Adapted from shadcn/ui patterns for vanilla JavaScript

// Class name utility (like shadcn's cn function)
export function cn(...inputs) {
  const classes = inputs.filter(Boolean).join(' ');
  return classes;
}

// Keyboard navigation helper
export function handleKeyboardNavigation(e, items, currentIndex, callbacks) {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      callbacks.onSelect(Math.min(currentIndex + 1, items.length - 1));
      break;
    case 'ArrowUp':
      e.preventDefault();
      callbacks.onSelect(Math.max(currentIndex - 1, 0));
      break;
    case 'Enter':
      e.preventDefault();
      callbacks.onEnter(items[currentIndex]);
      break;
    case 'Delete':
      if (e.metaKey) {
        e.preventDefault();
        callbacks.onDelete(items[currentIndex]);
      }
      break;
  }
}

// Text truncation helper
export function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// HTML escaping helper
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Relative time formatting helper
export function formatRelativeTime(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

// Element creation helper with shadcn-style class application
export function createElement(tag, className, attributes = {}) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  
  Object.keys(attributes).forEach(key => {
    if (key === 'textContent' || key === 'innerHTML') {
      element[key] = attributes[key];
    } else {
      element.setAttribute(key, attributes[key]);
    }
  });
  
  return element;
}

// Smooth scroll helper for list navigation
export function scrollIntoViewSmooth(element, container) {
  if (!element || !container) return;
  
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  const isVisible = (
    elementRect.top >= containerRect.top &&
    elementRect.bottom <= containerRect.bottom
  );
  
  if (!isVisible) {
    element.scrollIntoView({ 
      block: 'nearest', 
      behavior: 'smooth' 
    });
  }
}

// Debounce helper for search functionality
export function debounce(func, wait) {
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

// Theme detection helper
export function getTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Focus management helper
export function trapFocus(container) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  });
}

// Search highlighting helper
export function highlightSearchTerms(text, searchTerms, highlightClass = 'bg-yellow-200 text-yellow-900') {
  if (!searchTerms || searchTerms.length === 0) {
    return escapeHtml(text);
  }
  
  // Escape HTML first
  let highlighted = escapeHtml(text);
  
  // Create a regex for all search terms (case insensitive)
  const termsArray = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
  const validTerms = termsArray.filter(term => term && term.trim().length > 0);
  
  if (validTerms.length === 0) {
    return highlighted;
  }
  
  // Sort terms by length (longest first) to avoid partial replacements
  validTerms.sort((a, b) => b.length - a.length);
  
  validTerms.forEach(term => {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    highlighted = highlighted.replace(regex, `<mark class="${highlightClass}">$1</mark>`);
  });
  
  return highlighted;
}

// Performance helper for large datasets
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Animation helper
export function animate(element, className, duration = 300) {
  return new Promise((resolve) => {
    element.classList.add(className);
    
    const onAnimationEnd = () => {
      element.classList.remove(className);
      element.removeEventListener('animationend', onAnimationEnd);
      resolve();
    };
    
    element.addEventListener('animationend', onAnimationEnd);
    
    // Fallback timeout
    setTimeout(() => {
      element.classList.remove(className);
      element.removeEventListener('animationend', onAnimationEnd);
      resolve();
    }, duration);
  });
}

// Check if element is in viewport
export function isInViewport(element, container) {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  return (
    elementRect.top >= containerRect.top &&
    elementRect.left >= containerRect.left &&
    elementRect.bottom <= containerRect.bottom &&
    elementRect.right <= containerRect.right
  );
}