import { Injectable } from '@angular/core';
import { TiptapContent } from '../models';

/**
 * Markdown ↔ Tiptap Converter Service
 *
 * Converts between Obsidian-style Markdown and Tiptap JSON format
 * Supports:
 * - Headings, paragraphs, lists
 * - Bold, italic, code, strikethrough
 * - Links (both markdown and wikilinks)
 * - Code blocks
 * - Blockquotes
 * - Tables (basic)
 */

interface TiptapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
  text?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MarkdownConverterService {

  /**
   * Convert Markdown to Tiptap JSON format
   */
  markdownToTiptap(markdown: string): TiptapContent {
    const lines = markdown.split('\n');
    const content: TiptapNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Empty line
      if (line.trim() === '') {
        i++;
        continue;
      }

      // Heading
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        content.push({
          type: 'heading',
          attrs: { level },
          content: this.parseInlineContent(text)
        });
        i++;
        continue;
      }

      // Code block
      if (line.startsWith('```')) {
        const language = line.substring(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        content.push({
          type: 'codeBlock',
          attrs: language ? { language } : {},
          content: [{ type: 'text', text: codeLines.join('\n') }]
        });
        i++; // Skip closing ```
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].startsWith('> ')) {
          quoteLines.push(lines[i].substring(2));
          i++;
        }
        content.push({
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: this.parseInlineContent(quoteLines.join(' '))
            }
          ]
        });
        continue;
      }

      // Unordered list
      if (line.match(/^[\-\*\+]\s+/)) {
        const listItems: TiptapNode[] = [];
        while (i < lines.length && lines[i].match(/^[\-\*\+]\s+/)) {
          const itemText = lines[i].replace(/^[\-\*\+]\s+/, '');
          listItems.push({
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: this.parseInlineContent(itemText)
              }
            ]
          });
          i++;
        }
        content.push({
          type: 'bulletList',
          content: listItems
        });
        continue;
      }

      // Ordered list
      if (line.match(/^\d+\.\s+/)) {
        const listItems: TiptapNode[] = [];
        while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
          const itemText = lines[i].replace(/^\d+\.\s+/, '');
          listItems.push({
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: this.parseInlineContent(itemText)
              }
            ]
          });
          i++;
        }
        content.push({
          type: 'orderedList',
          content: listItems
        });
        continue;
      }

      // Horizontal rule
      if (line.match(/^(\-{3,}|\*{3,}|_{3,})$/)) {
        content.push({ type: 'horizontalRule' });
        i++;
        continue;
      }

      // Default: paragraph
      content.push({
        type: 'paragraph',
        content: this.parseInlineContent(line)
      });
      i++;
    }

    return {
      type: 'doc',
      content
    } as TiptapContent;
  }

  /**
   * Parse inline content (bold, italic, links, etc.)
   */
  private parseInlineContent(text: string): TiptapNode[] {
    const nodes: TiptapNode[] = [];
    let currentIndex = 0;

    // Regex patterns for inline formatting
    const patterns = [
      { regex: /\*\*(.+?)\*\*/g, mark: 'bold' },
      { regex: /__(.+?)__/g, mark: 'bold' },
      { regex: /\*(.+?)\*/g, mark: 'italic' },
      { regex: /_(.+?)_/g, mark: 'italic' },
      { regex: /~~(.+?)~~/g, mark: 'strike' },
      { regex: /`(.+?)`/g, mark: 'code' },
      { regex: /\[\[(.+?)\]\]/g, mark: 'wikilink' },
      { regex: /\[(.+?)\]\((.+?)\)/g, mark: 'link' }
    ];

    // Find all matches
    const matches: Array<{ start: number; end: number; mark: string; text: string; url?: string }> = [];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        if (pattern.mark === 'link') {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            mark: pattern.mark,
            text: match[1],
            url: match[2]
          });
        } else if (pattern.mark === 'wikilink') {
          // Convert [[Page Name]] or [[Page Name|Display Text]] to link
          const linkContent = match[1];
          const parts = linkContent.split('|');
          const pageName = parts[0].trim();
          const displayText = parts[1]?.trim() || pageName;

          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            mark: 'link',
            text: displayText,
            url: `/workspace/pages/${this.slugify(pageName)}`
          });
        } else {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            mark: pattern.mark,
            text: match[1]
          });
        }
      }
    }

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Build nodes
    for (const match of matches) {
      // Add plain text before this match
      if (match.start > currentIndex) {
        const plainText = text.substring(currentIndex, match.start);
        if (plainText) {
          nodes.push({ type: 'text', text: plainText });
        }
      }

      // Add marked text
      if (match.mark === 'link') {
        nodes.push({
          type: 'text',
          text: match.text,
          marks: [{ type: 'link', attrs: { href: match.url } }]
        });
      } else {
        nodes.push({
          type: 'text',
          text: match.text,
          marks: [{ type: match.mark }]
        });
      }

      currentIndex = match.end;
    }

    // Add remaining plain text
    if (currentIndex < text.length) {
      const plainText = text.substring(currentIndex);
      if (plainText) {
        nodes.push({ type: 'text', text: plainText });
      }
    }

    // If no matches, return plain text
    if (nodes.length === 0 && text.trim()) {
      nodes.push({ type: 'text', text });
    }

    return nodes;
  }

  /**
   * Convert Tiptap JSON to Markdown
   */
  tiptapToMarkdown(content: TiptapContent): string {
    if (!content.content || content.content.length === 0) {
      return '';
    }

    const lines: string[] = [];

    for (const node of content.content as any[]) {
      const markdown = this.nodeToMarkdown(node);
      if (markdown) {
        lines.push(markdown);
      }
    }

    return lines.join('\n\n');
  }

  /**
   * Convert a single Tiptap node to Markdown
   */
  private nodeToMarkdown(node: any, depth = 0): string {
    switch (node.type) {
      case 'heading':
        const level = node.attrs?.level || 1;
        const headingText = this.inlineContentToMarkdown(node.content);
        return '#'.repeat(level) + ' ' + headingText;

      case 'paragraph':
        return this.inlineContentToMarkdown(node.content);

      case 'codeBlock':
        const language = node.attrs?.language || '';
        const code = node.content?.[0]?.text || '';
        return '```' + language + '\n' + code + '\n```';

      case 'blockquote':
        const quoteContent = node.content?.map((n: any) => this.nodeToMarkdown(n)).join('\n') || '';
        return quoteContent.split('\n').map((line: string) => '> ' + line).join('\n');

      case 'bulletList':
        return node.content?.map((item: any) => {
          const itemContent = item.content?.[0] ? this.nodeToMarkdown(item.content[0]) : '';
          return '- ' + itemContent;
        }).join('\n') || '';

      case 'orderedList':
        return node.content?.map((item: any, index: number) => {
          const itemContent = item.content?.[0] ? this.nodeToMarkdown(item.content[0]) : '';
          return `${index + 1}. ${itemContent}`;
        }).join('\n') || '';

      case 'horizontalRule':
        return '---';

      case 'table':
        // Basic table support
        return '[Table content - not yet fully supported]';

      default:
        return '';
    }
  }

  /**
   * Convert inline content to Markdown
   */
  private inlineContentToMarkdown(content: any[]): string {
    if (!content || content.length === 0) {
      return '';
    }

    let markdown = '';

    for (const node of content) {
      if (node.type === 'text') {
        let text = node.text || '';

        // Apply marks
        if (node.marks && node.marks.length > 0) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case 'bold':
                text = `**${text}**`;
                break;
              case 'italic':
                text = `*${text}*`;
                break;
              case 'code':
                text = `\`${text}\``;
                break;
              case 'strike':
                text = `~~${text}~~`;
                break;
              case 'link':
                const href = mark.attrs?.href || '';
                text = `[${text}](${href})`;
                break;
            }
          }
        }

        markdown += text;
      }
    }

    return markdown;
  }

  /**
   * Convert page title to slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
