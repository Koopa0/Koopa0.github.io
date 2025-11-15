import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import matter from 'gray-matter';

export interface PostMetadata {
  title: string;
  date: string;
  tags: string[];
  description?: string;
  slug: string;
}

export interface Post extends PostMetadata {
  content: string;
  readingTime: number; // in minutes
}

@Injectable({
  providedIn: 'root'
})
export class MarkdownService {
  private postsCache: Map<string, Post> = new Map();

  constructor(private http: HttpClient) {}

  /**
   * Load all posts metadata (for listing)
   */
  getAllPosts(): Observable<PostMetadata[]> {
    // In a real app, you'd have an index.json file listing all posts
    // For now, we'll return an empty array
    return of([]);
  }

  /**
   * Load a single post by slug
   */
  getPost(slug: string): Observable<Post | null> {
    // Check cache first
    if (this.postsCache.has(slug)) {
      return of(this.postsCache.get(slug)!);
    }

    return this.http.get(`/assets/posts/${slug}.md`, { responseType: 'text' }).pipe(
      map(markdown => this.parseMarkdown(markdown, slug)),
      catchError(error => {
        console.error(`Failed to load post: ${slug}`, error);
        return of(null);
      })
    );
  }

  /**
   * Parse markdown content with front matter
   */
  private parseMarkdown(markdown: string, slug: string): Post {
    const { data, content } = matter(markdown);

    const post: Post = {
      title: data['title'] || 'Untitled',
      date: data['date'] || new Date().toISOString(),
      tags: data['tags'] || [],
      description: data['description'] || '',
      slug,
      content,
      readingTime: this.calculateReadingTime(content)
    };

    // Cache the post
    this.postsCache.set(slug, post);

    return post;
  }

  /**
   * Calculate reading time based on content
   * Average reading speed: 200 words per minute
   */
  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime;
  }

  /**
   * Filter posts by tag
   */
  getPostsByTag(posts: PostMetadata[], tag: string): PostMetadata[] {
    return posts.filter(post => post.tags.includes(tag));
  }

  /**
   * Get all unique tags from posts
   */
  getAllTags(posts: PostMetadata[]): string[] {
    const tagsSet = new Set<string>();
    posts.forEach(post => {
      post.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }

  /**
   * Get related posts based on tags
   */
  getRelatedPosts(currentPost: PostMetadata, allPosts: PostMetadata[], limit: number = 3): PostMetadata[] {
    const scoredPosts = allPosts
      .filter(post => post.slug !== currentPost.slug)
      .map(post => {
        const commonTags = post.tags.filter(tag => currentPost.tags.includes(tag));
        return {
          post,
          score: commonTags.length
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredPosts.map(item => item.post);
  }

  /**
   * Extract table of contents from markdown content
   */
  extractTableOfContents(content: string): { level: number; title: string; id: string }[] {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const toc: { level: number; title: string; id: string }[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      toc.push({ level, title, id });
    }

    return toc;
  }
}
