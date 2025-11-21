import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import mermaid from 'mermaid';

/**
 * Mermaid Diagram Component
 *
 * Renders Mermaid diagrams from code syntax
 * Supports: flowcharts, sequence diagrams, class diagrams, etc.
 */
@Component({
  selector: 'app-mermaid-diagram',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mermaid-wrapper">
      @if (error()) {
        <div class="error-message bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-sm text-red-800 dark:text-red-200">
            <strong>Mermaid Error:</strong> {{ error() }}
          </p>
          <details class="mt-2">
            <summary class="cursor-pointer text-xs text-red-600 dark:text-red-400">Show diagram code</summary>
            <pre class="mt-2 text-xs bg-red-100 dark:bg-red-900/30 p-2 rounded overflow-x-auto">{{ diagramCode }}</pre>
          </details>
        </div>
      } @else {
        <div #mermaidElement class="mermaid-diagram"></div>
      }
    </div>
  `,
  styles: [`
    .mermaid-wrapper {
      @apply my-4;
    }

    :host ::ng-deep .mermaid-diagram {
      @apply flex justify-center items-center p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800;
    }

    :host ::ng-deep .mermaid-diagram svg {
      @apply max-w-full h-auto;
    }

    .error-message {
      @apply font-mono;
    }
  `]
})
export class MermaidDiagramComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() diagramCode = '';
  @Input() theme: 'default' | 'dark' | 'forest' | 'neutral' = 'default';

  @ViewChild('mermaidElement', { static: false }) mermaidElement?: ElementRef;

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private diagramId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

  error = signal('');

  ngOnInit() {
    if (this.isBrowser) {
      this.initializeMermaid();
    }
  }

  ngAfterViewInit() {
    if (this.isBrowser && this.mermaidElement) {
      this.renderDiagram();
    }
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  private initializeMermaid() {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: this.theme,
        securityLevel: 'loose',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
      });
    } catch (err) {
      console.error('Failed to initialize Mermaid:', err);
      this.error.set('Failed to initialize diagram renderer');
    }
  }

  private async renderDiagram() {
    if (!this.mermaidElement || !this.diagramCode.trim()) {
      return;
    }

    try {
      this.error.set('');

      // Render the diagram
      const { svg } = await mermaid.render(this.diagramId, this.diagramCode);

      // Insert the SVG into the element
      if (this.mermaidElement?.nativeElement) {
        this.mermaidElement.nativeElement.innerHTML = svg;
      }
    } catch (err: any) {
      console.error('Failed to render Mermaid diagram:', err);
      this.error.set(err.message || 'Failed to render diagram');
    }
  }

  /**
   * Re-render the diagram (useful when code or theme changes)
   */
  async refresh() {
    if (this.isBrowser) {
      await this.renderDiagram();
    }
  }
}
