import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { TiptapContent } from '../../../core/models';

/**
 * Tiptap Rich Text Editor Component
 *
 * Features:
 * - Block-based editing (Notion-like)
 * - Formatting toolbar
 * - Code blocks with syntax highlighting
 * - Tables, images, links
 * - Placeholder support
 */
@Component({
  selector: 'app-tiptap-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tiptap-editor-wrapper">
      <!-- Toolbar -->
      @if (editor) {
        <div class="toolbar sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-2 flex flex-wrap gap-1">
          <!-- Text Formatting -->
          <div class="toolbar-group flex gap-1">
            <button
              (click)="editor.chain().focus().toggleBold().run()"
              [class.active]="editor.isActive('bold')"
              class="toolbar-btn"
              title="Bold (Cmd+B)"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"/></svg>
              <span class="font-bold">B</span>
            </button>
            <button
              (click)="editor.chain().focus().toggleItalic().run()"
              [class.active]="editor.isActive('italic')"
              class="toolbar-btn"
              title="Italic (Cmd+I)"
            >
              <span class="italic">I</span>
            </button>
            <button
              (click)="editor.chain().focus().toggleCode().run()"
              [class.active]="editor.isActive('code')"
              class="toolbar-btn"
              title="Inline Code"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
            </button>
            <button
              (click)="editor.chain().focus().toggleStrike().run()"
              [class.active]="editor.isActive('strike')"
              class="toolbar-btn"
              title="Strikethrough"
            >
              <span class="line-through">S</span>
            </button>
          </div>

          <div class="toolbar-divider"></div>

          <!-- Headings -->
          <div class="toolbar-group flex gap-1">
            <button
              (click)="editor.chain().focus().toggleHeading({ level: 1 }).run()"
              [class.active]="editor.isActive('heading', { level: 1 })"
              class="toolbar-btn"
              title="Heading 1"
            >
              H1
            </button>
            <button
              (click)="editor.chain().focus().toggleHeading({ level: 2 }).run()"
              [class.active]="editor.isActive('heading', { level: 2 })"
              class="toolbar-btn"
              title="Heading 2"
            >
              H2
            </button>
            <button
              (click)="editor.chain().focus().toggleHeading({ level: 3 }).run()"
              [class.active]="editor.isActive('heading', { level: 3 })"
              class="toolbar-btn"
              title="Heading 3"
            >
              H3
            </button>
          </div>

          <div class="toolbar-divider"></div>

          <!-- Lists -->
          <div class="toolbar-group flex gap-1">
            <button
              (click)="editor.chain().focus().toggleBulletList().run()"
              [class.active]="editor.isActive('bulletList')"
              class="toolbar-btn"
              title="Bullet List"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <button
              (click)="editor.chain().focus().toggleOrderedList().run()"
              [class.active]="editor.isActive('orderedList')"
              class="toolbar-btn"
              title="Numbered List"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/></svg>
            </button>
            <button
              (click)="editor.chain().focus().toggleBlockquote().run()"
              [class.active]="editor.isActive('blockquote')"
              class="toolbar-btn"
              title="Blockquote"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.5 3v9H4v-9h3.5zM9 3v9h3.5V3H9zM3 14h14v3H3v-3z"/></svg>
            </button>
          </div>

          <div class="toolbar-divider"></div>

          <!-- Code & Table -->
          <div class="toolbar-group flex gap-1">
            <button
              (click)="editor.chain().focus().toggleCodeBlock().run()"
              [class.active]="editor.isActive('codeBlock')"
              class="toolbar-btn"
              title="Code Block"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </button>
            <button
              (click)="insertTable()"
              class="toolbar-btn"
              title="Insert Table"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </button>
            <button
              (click)="setLink()"
              [class.active]="editor.isActive('link')"
              class="toolbar-btn"
              title="Insert Link"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
            </button>
          </div>

          <div class="toolbar-divider"></div>

          <!-- Undo/Redo -->
          <div class="toolbar-group flex gap-1">
            <button
              (click)="editor.chain().focus().undo().run()"
              [disabled]="!editor.can().undo()"
              class="toolbar-btn"
              title="Undo (Cmd+Z)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
            </button>
            <button
              (click)="editor.chain().focus().redo().run()"
              [disabled]="!editor.can().redo()"
              class="toolbar-btn"
              title="Redo (Cmd+Shift+Z)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"/></svg>
            </button>
          </div>
        </div>
      }

      <!-- Editor Content -->
      <div #editorElement class="editor-content"></div>
    </div>
  `,
  styles: [`
    .tiptap-editor-wrapper {
      @apply border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900;
    }

    .toolbar {
      @apply flex-wrap;
    }

    .toolbar-group {
      @apply bg-gray-50 dark:bg-gray-800 rounded px-1;
    }

    .toolbar-btn {
      @apply px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
    }

    .toolbar-btn.active {
      @apply bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400;
    }

    .toolbar-divider {
      @apply w-px bg-gray-300 dark:bg-gray-700 mx-2;
    }

    :host ::ng-deep .ProseMirror {
      @apply p-6 min-h-[400px] focus:outline-none;
    }

    :host ::ng-deep .ProseMirror h1 {
      @apply text-4xl font-bold mt-6 mb-4;
    }

    :host ::ng-deep .ProseMirror h2 {
      @apply text-3xl font-bold mt-5 mb-3;
    }

    :host ::ng-deep .ProseMirror h3 {
      @apply text-2xl font-bold mt-4 mb-2;
    }

    :host ::ng-deep .ProseMirror p {
      @apply mb-4;
    }

    :host ::ng-deep .ProseMirror ul,
    :host ::ng-deep .ProseMirror ol {
      @apply pl-6 mb-4;
    }

    :host ::ng-deep .ProseMirror ul {
      @apply list-disc;
    }

    :host ::ng-deep .ProseMirror ol {
      @apply list-decimal;
    }

    :host ::ng-deep .ProseMirror li {
      @apply mb-2;
    }

    :host ::ng-deep .ProseMirror code {
      @apply bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono;
    }

    :host ::ng-deep .ProseMirror pre {
      @apply bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto;
    }

    :host ::ng-deep .ProseMirror pre code {
      @apply bg-transparent p-0;
    }

    :host ::ng-deep .ProseMirror blockquote {
      @apply border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-4;
    }

    :host ::ng-deep .ProseMirror table {
      @apply border-collapse w-full mb-4;
    }

    :host ::ng-deep .ProseMirror th,
    :host ::ng-deep .ProseMirror td {
      @apply border border-gray-300 dark:border-gray-700 px-4 py-2;
    }

    :host ::ng-deep .ProseMirror th {
      @apply bg-gray-100 dark:bg-gray-800 font-bold;
    }

    :host ::ng-deep .ProseMirror a {
      @apply text-blue-600 dark:text-blue-400 underline;
    }

    :host ::ng-deep .ProseMirror img {
      @apply max-w-full h-auto rounded-lg;
    }

    :host ::ng-deep .ProseMirror p.is-editor-empty:first-child::before {
      @apply text-gray-400 float-left h-0 pointer-events-none;
      content: attr(data-placeholder);
    }
  `]
})
export class TiptapEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() content: TiptapContent | null = null;
  @Input() placeholder = 'Start writing...';
  @Output() contentChange = new EventEmitter<TiptapContent>();

  @ViewChild('editorElement', { static: false }) editorElement!: ElementRef;

  editor: Editor | null = null;
  private lowlight = createLowlight(common);

  constructor() {
    // React to content changes from parent
    effect(() => {
      if (this.editor && this.content) {
        const currentContent = this.editor.getJSON();
        if (JSON.stringify(currentContent) !== JSON.stringify(this.content)) {
          this.editor.commands.setContent(this.content);
        }
      }
    });
  }

  ngOnInit() {
    // Editor will be initialized in ngAfterViewInit
  }

  ngAfterViewInit() {
    this.initEditor();
  }

  ngOnDestroy() {
    this.editor?.destroy();
  }

  private initEditor() {
    this.editor = new Editor({
      element: this.editorElement.nativeElement,
      extensions: [
        StarterKit.configure({
          codeBlock: false, // We'll use CodeBlockLowlight instead
        }),
        Link.configure({
          openOnClick: false,
        }),
        Image,
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        Placeholder.configure({
          placeholder: this.placeholder,
        }),
        CodeBlockLowlight.configure({
          lowlight: this.lowlight,
        }),
      ],
      content: this.content || { type: 'doc', content: [] },
      onUpdate: ({ editor }) => {
        const json = editor.getJSON() as TiptapContent;
        this.contentChange.emit(json);
      },
    });
  }

  insertTable() {
    this.editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }

  setLink() {
    const previousUrl = this.editor?.getAttributes('link')['href'];
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      this.editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    this.editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }
}
