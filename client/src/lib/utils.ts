import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function linkify(text: string): string {
  if (!text) return "";
  
  const escapeHtml = (str: string) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };
  
  // Find URLs in the original text and build segments
  const urlPattern = /(\b(https?:\/\/|www\.)[^\s<]+)/gi;
  const segments: Array<{ type: 'text' | 'url'; content: string }> = [];
  let lastIndex = 0;
  let match;
  
  while ((match = urlPattern.exec(text)) !== null) {
    // Add text before URL (escaped)
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: escapeHtml(text.substring(lastIndex, match.index))
      });
    }
    
    // Add URL (will be converted to anchor)
    segments.push({
      type: 'url',
      content: match[0]
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text (escaped)
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: escapeHtml(text.substring(lastIndex))
    });
  }
  
  // Build final HTML from segments
  return segments.map(segment => {
    if (segment.type === 'text') {
      return segment.content;
    } else {
      // Create anchor using DOM APIs for safe attribute handling
      const url = segment.content;
      const href = url.startsWith("http") ? url : `https://${url}`;
      
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.className = 'text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300';
      anchor.textContent = url;
      
      return anchor.outerHTML;
    }
  }).join('');
}
