import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Obsidian Integration Service
 *
 * Handles import/export operations for Obsidian markdown files
 * Phase 1 MVP: ZIP import with frontmatter and wikilink conversion
 */

export interface ObsidianImportRequest {
  file: File; // ZIP file containing markdown files
  targetFolderId?: string;
  preserveStructure?: boolean; // Preserve folder structure
}

export interface ObsidianImportResult {
  success: boolean;
  importedPages: number;
  skippedFiles: number;
  errors: string[];
  pageIds: string[];
}

export interface ObsidianExportOptions {
  pageIds?: string[]; // If not provided, export all pages
  includeAttachments?: boolean;
  format?: 'zip' | 'folder';
}

export interface ParsedMarkdownFile {
  filename: string;
  title: string;
  frontmatter: Record<string, any>;
  content: string; // Raw markdown content
  wikilinks: string[]; // Extracted [[wikilinks]]
  tags: string[]; // Extracted #tags and frontmatter tags
}

@Injectable({
  providedIn: 'root'
})
export class ObsidianService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/obsidian`;

  /**
   * Import Obsidian vault from ZIP file
   */
  async importFromZip(request: ObsidianImportRequest): Promise<ObsidianImportResult> {
    // In mock mode, we'll parse the ZIP client-side
    if (environment.useMockApi) {
      return this.mockImportFromZip(request);
    }

    const formData = new FormData();
    formData.append('file', request.file);
    if (request.targetFolderId) {
      formData.append('targetFolderId', request.targetFolderId);
    }
    if (request.preserveStructure !== undefined) {
      formData.append('preserveStructure', String(request.preserveStructure));
    }

    return firstValueFrom(
      this.http.post<ObsidianImportResult>(`${this.apiUrl}/import`, formData)
    );
  }

  /**
   * Export pages to Obsidian-compatible format
   */
  async exportToZip(options: ObsidianExportOptions = {}): Promise<Blob> {
    if (environment.useMockApi) {
      return this.mockExportToZip(options);
    }

    return firstValueFrom(
      this.http.post(`${this.apiUrl}/export`, options, {
        responseType: 'blob'
      })
    );
  }

  /**
   * Parse a single markdown file (client-side)
   */
  async parseMarkdownFile(filename: string, content: string): Promise<ParsedMarkdownFile> {
    const frontmatter = this.extractFrontmatter(content);
    const contentWithoutFrontmatter = this.removeFrontmatter(content);
    const wikilinks = this.extractWikilinks(contentWithoutFrontmatter);
    const tags = this.extractTags(contentWithoutFrontmatter, frontmatter);

    // Extract title from frontmatter or filename
    let title = frontmatter['title'] || frontmatter['Title'] || filename.replace('.md', '');

    return {
      filename,
      title,
      frontmatter,
      content: contentWithoutFrontmatter,
      wikilinks,
      tags
    };
  }

  /**
   * Extract frontmatter from markdown content
   */
  private extractFrontmatter(content: string): Record<string, any> {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return {};
    }

    const frontmatterText = match[1];
    const frontmatter: Record<string, any> = {};

    // Simple YAML parsing (key: value)
    const lines = frontmatterText.split('\n');
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex).trim();
      let value: any = line.substring(colonIndex + 1).trim();

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Parse arrays [tag1, tag2]
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value
          .slice(1, -1)
          .split(',')
          .map((v: string) => v.trim().replace(/['"]/g, ''))
          .filter((v: string) => v);
      }

      // Parse booleans
      if (value === 'true') value = true;
      if (value === 'false') value = false;

      frontmatter[key] = value;
    }

    return frontmatter;
  }

  /**
   * Remove frontmatter from markdown content
   */
  private removeFrontmatter(content: string): string {
    return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
  }

  /**
   * Extract wikilinks [[page name]] from markdown
   */
  private extractWikilinks(content: string): string[] {
    const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
    const wikilinks: string[] = [];
    let match;

    while ((match = wikilinkRegex.exec(content)) !== null) {
      // Handle [[Page Name|Display Text]] and [[Page Name]]
      const linkContent = match[1];
      const pageName = linkContent.split('|')[0].trim();
      wikilinks.push(pageName);
    }

    return [...new Set(wikilinks)]; // Remove duplicates
  }

  /**
   * Extract tags from markdown content and frontmatter
   */
  private extractTags(content: string, frontmatter: Record<string, any>): string[] {
    const tags: string[] = [];

    // From frontmatter
    if (frontmatter['tags']) {
      if (Array.isArray(frontmatter['tags'])) {
        tags.push(...frontmatter['tags']);
      } else if (typeof frontmatter['tags'] === 'string') {
        tags.push(...frontmatter['tags'].split(',').map((t: string) => t.trim()));
      }
    }

    // From content (#tag syntax)
    const tagRegex = /#([a-zA-Z0-9_-]+)/g;
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Mock import implementation (client-side ZIP parsing)
   */
  private async mockImportFromZip(request: ObsidianImportRequest): Promise<ObsidianImportResult> {
    const result: ObsidianImportResult = {
      success: false,
      importedPages: 0,
      skippedFiles: 0,
      errors: [],
      pageIds: []
    };

    try {
      // This would require JSZip library
      // For now, return a mock success response
      result.success = true;
      result.importedPages = 5;
      result.skippedFiles = 1;
      result.pageIds = ['mock_page_1', 'mock_page_2', 'mock_page_3', 'mock_page_4', 'mock_page_5'];
      result.errors = ['Skipped: binary-file.png (not a markdown file)'];

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message || 'Failed to parse ZIP file');
    }

    return result;
  }

  /**
   * Mock export implementation
   */
  private async mockExportToZip(options: ObsidianExportOptions): Promise<Blob> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create a mock ZIP file (just a text file for demo)
    const mockContent = `Mock Obsidian Export\n\nPages exported: ${options.pageIds?.length || 'all'}\nInclude attachments: ${options.includeAttachments || false}`;
    return new Blob([mockContent], { type: 'application/zip' });
  }
}
