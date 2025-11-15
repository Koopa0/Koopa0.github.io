import { Component, ElementRef, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Code Block Copy Button Component
 *
 * Automatically attaches copy buttons to all <pre> code blocks
 * Josh Comeau inspired design with smooth animations
 */
@Component({
  selector: 'app-code-block-copy-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- This component injects copy buttons via ngOnInit -->
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class CodeBlockCopyButtonComponent implements OnInit {
  private elementRef = ElementRef;

  ngOnInit() {
    // Wait for the DOM to be ready
    setTimeout(() => {
      this.attachCopyButtons();
    }, 100);
  }

  private attachCopyButtons() {
    const preElements = document.querySelectorAll('pre');

    preElements.forEach((pre) => {
      // Skip if button already exists
      if (pre.querySelector('.copy-button')) return;

      // Create container for positioning
      const container = document.createElement('div');
      container.style.position = 'relative';

      // Wrap the pre element
      pre.parentNode?.insertBefore(container, pre);
      container.appendChild(pre);

      // Create copy button
      const button = document.createElement('button');
      button.className = 'copy-button';
      button.innerHTML = `
        <svg class="copy-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <svg class="check-icon hidden" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span class="button-text">Copy</span>
      `;

      // Add styles
      this.styleButton(button);

      // Add click handler
      button.addEventListener('click', () => this.copyCode(pre, button));

      // Append button to container
      container.appendChild(button);
    });
  }

  private styleButton(button: HTMLButtonElement) {
    Object.assign(button.style, {
      position: 'absolute',
      top: '0.75rem',
      right: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'rgb(156, 163, 175)',
      backgroundColor: 'rgba(31, 41, 55, 0.8)',
      border: '1px solid rgba(75, 85, 99, 0.5)',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backdropFilter: 'blur(4px)',
      zIndex: '10',
    });

    button.addEventListener('mouseenter', () => {
      button.style.color = 'rgb(255, 255, 255)';
      button.style.backgroundColor = 'rgba(31, 41, 55, 0.95)';
      button.style.borderColor = 'rgba(59, 130, 246, 0.5)';
      button.style.transform = 'scale(1.05)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.color = 'rgb(156, 163, 175)';
      button.style.backgroundColor = 'rgba(31, 41, 55, 0.8)';
      button.style.borderColor = 'rgba(75, 85, 99, 0.5)';
      button.style.transform = 'scale(1)';
    });
  }

  private async copyCode(pre: Element, button: HTMLButtonElement) {
    const code = pre.querySelector('code');
    if (!code) return;

    const text = code.textContent || '';

    try {
      await navigator.clipboard.writeText(text);

      // Show success state
      const copyIcon = button.querySelector('.copy-icon') as HTMLElement;
      const checkIcon = button.querySelector('.check-icon') as HTMLElement;
      const buttonText = button.querySelector('.button-text') as HTMLElement;

      if (copyIcon && checkIcon && buttonText) {
        copyIcon.classList.add('hidden');
        checkIcon.classList.remove('hidden');
        buttonText.textContent = 'Copied!';
        button.style.color = 'rgb(34, 197, 94)';
        button.style.borderColor = 'rgba(34, 197, 94, 0.5)';

        // Reset after 2 seconds
        setTimeout(() => {
          copyIcon.classList.remove('hidden');
          checkIcon.classList.add('hidden');
          buttonText.textContent = 'Copy';
          button.style.color = 'rgb(156, 163, 175)';
          button.style.borderColor = 'rgba(75, 85, 99, 0.5)';
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }
}
