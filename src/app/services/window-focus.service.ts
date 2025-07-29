import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class WindowFocusService {
  private platformId = inject(PLATFORM_ID);
  
  // Signal to track window focus state
  isWindowFocused = signal(true);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Listen for window focus/blur events
      window.addEventListener('focus', () => {
        this.isWindowFocused.set(true);
      });

      window.addEventListener('blur', () => {
        this.isWindowFocused.set(false);
      });

      // Set initial state
      this.isWindowFocused.set(document.hasFocus());
    }
  }

  /**
   * Check if window is currently focused
   */
  hasFocus(): boolean {
    return this.isWindowFocused();
  }
}
