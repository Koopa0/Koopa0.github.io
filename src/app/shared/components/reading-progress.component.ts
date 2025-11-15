import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reading Progress Bar Component
 *
 * Shows a progress bar at the top of the page indicating how much
 * of the article has been read. Inspired by Medium and Josh Comeau.
 */
@Component({
  selector: 'app-reading-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-50">
      <div
        class="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 transition-all duration-150 ease-out shadow-lg shadow-blue-500/50"
        [style.width.%]="progress()"
      ></div>
    </div>
  `
})
export class ReadingProgressComponent {
  progress = signal(0);

  @HostListener('window:scroll')
  onScroll() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Calculate progress percentage
    const scrollableHeight = documentHeight - windowHeight;
    const scrolled = (scrollTop / scrollableHeight) * 100;

    this.progress.set(Math.min(Math.max(scrolled, 0), 100));
  }
}
