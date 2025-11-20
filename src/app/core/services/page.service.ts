import { Injectable, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import {
  Page,
  PageListResponse,
  CreatePageRequest,
  UpdatePageRequest,
  PublishPageRequest
} from '../models/page.model';

@Injectable({
  providedIn: 'root'
})
export class PageService {
  private api = inject(ApiService);

  // Local state for caching
  private pagesCache = signal<Page[]>([]);
  private loadingSignal = signal(false);

  // Public readonly signals
  readonly pages = this.pagesCache.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  /**
   * Get all pages
   */
  getAll(): Observable<PageListResponse> {
    return this.api.get<PageListResponse>('pages');
  }

  /**
   * Get all pages (async version with caching)
   */
  async getAllAsync(): Promise<Page[]> {
    this.loadingSignal.set(true);
    try {
      const response = await firstValueFrom(this.getAll());
      this.pagesCache.set(response.pages);
      return response.pages;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Get a single page by ID
   */
  getById(id: string): Observable<Page> {
    return this.api.get<Page>(`pages/${id}`);
  }

  /**
   * Get a single page by ID (async version)
   */
  async getByIdAsync(id: string): Promise<Page> {
    this.loadingSignal.set(true);
    try {
      return await firstValueFrom(this.getById(id));
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Create a new page
   */
  create(data: CreatePageRequest): Observable<Page> {
    return this.api.post<Page>('pages', data);
  }

  /**
   * Create a new page (async version)
   */
  async createAsync(data: CreatePageRequest): Promise<Page> {
    this.loadingSignal.set(true);
    try {
      const newPage = await firstValueFrom(this.create(data));
      // Add to cache
      this.pagesCache.update(pages => [newPage, ...pages]);
      return newPage;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Update an existing page
   */
  update(id: string, data: UpdatePageRequest): Observable<Page> {
    return this.api.patch<Page>(`pages/${id}`, data);
  }

  /**
   * Update an existing page (async version)
   */
  async updateAsync(id: string, data: UpdatePageRequest): Promise<Page> {
    this.loadingSignal.set(true);
    try {
      const updatedPage = await firstValueFrom(this.update(id, data));
      // Update cache
      this.pagesCache.update(pages =>
        pages.map(p => p.id === id ? updatedPage : p)
      );
      return updatedPage;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Delete a page
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`pages/${id}`);
  }

  /**
   * Delete a page (async version)
   */
  async deleteAsync(id: string): Promise<void> {
    this.loadingSignal.set(true);
    try {
      await firstValueFrom(this.delete(id));
      // Remove from cache
      this.pagesCache.update(pages => pages.filter(p => p.id !== id));
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Publish a page to the blog
   */
  publish(id: string, data: PublishPageRequest): Observable<any> {
    return this.api.post(`pages/${id}/publish`, data);
  }

  /**
   * Publish a page to the blog (async version)
   */
  async publishAsync(id: string, data: PublishPageRequest): Promise<any> {
    this.loadingSignal.set(true);
    try {
      const result = await firstValueFrom(this.publish(id, data));
      // Update cache to reflect published status
      this.pagesCache.update(pages =>
        pages.map(p => p.id === id
          ? { ...p, publishStatus: 'published', publishedSlug: data.slug }
          : p
        )
      );
      return result;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Search pages by query
   */
  search(query: string): Observable<PageListResponse> {
    return this.api.get<PageListResponse>('pages/search', { params: { q: query } });
  }

  /**
   * Search pages by query (async version)
   */
  async searchAsync(query: string): Promise<Page[]> {
    this.loadingSignal.set(true);
    try {
      const response = await firstValueFrom(this.search(query));
      return response.pages;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Get pages by tag
   */
  getByTag(tag: string): Observable<PageListResponse> {
    return this.api.get<PageListResponse>('pages', { params: { tag } });
  }

  /**
   * Get pages by tag (async version)
   */
  async getByTagAsync(tag: string): Promise<Page[]> {
    this.loadingSignal.set(true);
    try {
      const response = await firstValueFrom(this.getByTag(tag));
      return response.pages;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.pagesCache.set([]);
  }
}
