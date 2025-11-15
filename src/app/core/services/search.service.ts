import { Injectable } from '@angular/core';
import Fuse from 'fuse.js';
import { PostMetadata } from './markdown.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private fuse: Fuse<PostMetadata> | null = null;

  /**
   * Initialize search index with posts
   */
  initializeIndex(posts: PostMetadata[]): void {
    const options = {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'description', weight: 0.2 },
        { name: 'tags', weight: 0.1 }
      ],
      threshold: 0.3, // Lower = more strict matching
      includeScore: true,
      minMatchCharLength: 2
    };

    this.fuse = new Fuse(posts, options);
  }

  /**
   * Search posts by query
   */
  search(query: string): PostMetadata[] {
    if (!this.fuse || !query.trim()) {
      return [];
    }

    const results = this.fuse.search(query);
    return results.map(result => result.item);
  }

  /**
   * Check if search is initialized
   */
  isInitialized(): boolean {
    return this.fuse !== null;
  }
}
