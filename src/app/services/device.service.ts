import { Injectable, signal, computed, HostListener } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private screenWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // Computed properties for responsive breakpoints
  isMobile = computed(() => this.screenWidth() < 768);
  isTablet = computed(() => this.screenWidth() >= 768 && this.screenWidth() < 1024);
  isDesktop = computed(() => this.screenWidth() >= 1024);
  isMobileOrTablet = computed(() => this.isMobile() || this.isTablet());

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for window resize
      window.addEventListener('resize', this.onResize.bind(this));
    }
  }

  private onResize(event: Event) {
    if (event.target && 'innerWidth' in event.target) {
      this.screenWidth.set((event.target as Window).innerWidth);
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize.bind(this));
    }
  }
}
