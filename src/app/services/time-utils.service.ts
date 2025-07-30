import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimeUtilsService {

  /**
   * Formats a timestamp into a human-readable relative time string
   * @param timestamp - The timestamp to format
   * @returns A formatted time string (e.g., "now", "5m ago", "2h ago", "yesterday", "Dec 25")
   */
  formatMessageTime(timestamp: Date | string): string {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      if (days === 1) {
        return 'yesterday';
      } else if (days < 7) {
        return `${days}d ago`;
      } else {
        return messageDate.toLocaleDateString();
      }
    }
  }

  /**
   * Formats a timestamp for display in conversation list (shorter format)
   * @param timestamp - The timestamp to format
   * @returns A formatted time string optimized for list display
   */
  formatConversationTime(timestamp: Date | string): string {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      if (days === 1) {
        return 'yesterday';
      } else if (days < 7) {
        return `${days}d`;
      } else {
        // For older messages, show date in short format
        return messageDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    }
  }

  /**
   * Formats a timestamp into a full date and time string
   * @param timestamp - The timestamp to format
   * @returns A full date and time string
   */
  formatFullDateTime(timestamp: Date | string): string {
    const messageDate = new Date(timestamp);
    return messageDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Checks if a timestamp is from today
   * @param timestamp - The timestamp to check
   * @returns True if the timestamp is from today
   */
  isToday(timestamp: Date | string): boolean {
    const now = new Date();
    const messageDate = new Date(timestamp);
    return now.toDateString() === messageDate.toDateString();
  }

  /**
   * Checks if a timestamp is from yesterday
   * @param timestamp - The timestamp to check
   * @returns True if the timestamp is from yesterday
   */
  isYesterday(timestamp: Date | string): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(timestamp);
    return yesterday.toDateString() === messageDate.toDateString();
  }

  /**
   * Formats a timestamp into a "time ago" format (e.g., "2 minutes ago", "1 hour ago")
   * @param timestamp - The timestamp to format
   * @returns A formatted "time ago" string
   */
  getTimeAgo(timestamp: Date | string): string {
    const now = new Date();
    const targetDate = new Date(timestamp);
    
    if (isNaN(targetDate.getTime())) {
      return '';
    }

    const diffInMs = now.getTime() - targetDate.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);

    if (diffInSeconds < 0) {
      return 'just now';
    }

    if (diffInSeconds < 60) {
      return 'just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return diffInWeeks === 1 ? '1 week ago' : `${diffInWeeks} weeks ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
  }
}
