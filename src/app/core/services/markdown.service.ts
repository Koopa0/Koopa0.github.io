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
  readingTime?: number;   // Reading time in minutes
  // Phase 1-3: Content classification
  category?: string;      // tutorial-series | tutorial | daily | note | project
  series?: string;        // Series identifier (e.g., 'golang-advanced')
  seriesOrder?: number;   // Order in series (1, 2, 3, ...)
}

export interface Post extends PostMetadata {
  content: string;
  readingTime: number; // in minutes
}

// Series information
export interface SeriesInfo {
  id: string;
  title: string;
  description: string;
  posts: PostMetadata[];
  totalPosts: number;
  lastUpdated: string;
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
    return this.http.get<PostMetadata[]>('/assets/posts/index.json').pipe(
      catchError(error => {
        console.error('Failed to load posts index:', error);
        return of([]);
      })
    );
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

    // Remove the first H1 heading from content (since we display title in header)
    // This regex removes the first H1, including any leading whitespace/newlines
    const contentWithoutH1 = content.replace(/^\s*#\s+.*?(\r?\n|$)/, '').trim();

    const post: Post = {
      title: data['title'] || 'Untitled',
      date: data['date'] || new Date().toISOString(),
      tags: data['tags'] || [],
      description: data['description'] || '',
      slug,
      content: contentWithoutH1,
      readingTime: this.calculateReadingTime(contentWithoutH1),
      // Phase 1-3: Parse classification fields
      category: data['category'],
      series: data['series'],
      seriesOrder: data['seriesOrder']
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

  /**
   * Phase 2: Get all series
   */
  getAllSeries(posts: PostMetadata[]): SeriesInfo[] {
    const seriesMap = new Map<string, PostMetadata[]>();

    // Group posts by series
    posts.forEach(post => {
      if (post.series) {
        if (!seriesMap.has(post.series)) {
          seriesMap.set(post.series, []);
        }
        seriesMap.get(post.series)!.push(post);
      }
    });

    // Convert to SeriesInfo array
    return Array.from(seriesMap.entries()).map(([seriesId, seriesPosts]) => {
      // Sort by seriesOrder
      const sortedPosts = seriesPosts.sort((a, b) =>
        (a.seriesOrder || 0) - (b.seriesOrder || 0)
      );

      // Find the latest update date
      const latestDate = sortedPosts.reduce((latest, post) => {
        return new Date(post.date) > new Date(latest) ? post.date : latest;
      }, sortedPosts[0].date);

      return {
        id: seriesId,
        title: this.getSeriesTitle(seriesId),
        description: this.getSeriesDescription(seriesId),
        posts: sortedPosts,
        totalPosts: sortedPosts.length,
        lastUpdated: latestDate
      };
    }).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  /**
   * Phase 2: Get series by ID
   */
  getSeriesById(posts: PostMetadata[], seriesId: string): SeriesInfo | null {
    const allSeries = this.getAllSeries(posts);
    return allSeries.find(s => s.id === seriesId) || null;
  }

  /**
   * Phase 2: Get next/previous post in series
   */
  getSeriesNavigation(currentPost: Post, allPosts: PostMetadata[]): {
    previous: PostMetadata | null;
    next: PostMetadata | null;
  } {
    if (!currentPost.series) {
      return { previous: null, next: null };
    }

    const series = this.getSeriesById(allPosts, currentPost.series);
    if (!series) {
      return { previous: null, next: null };
    }

    const currentIndex = series.posts.findIndex(p => p.slug === currentPost.slug);

    return {
      previous: currentIndex > 0 ? series.posts[currentIndex - 1] : null,
      next: currentIndex < series.posts.length - 1 ? series.posts[currentIndex + 1] : null
    };
  }

  /**
   * Phase 3: Filter posts by category
   */
  getPostsByCategory(posts: PostMetadata[], category: string): PostMetadata[] {
    return posts.filter(post => post.category === category);
  }

  /**
   * Helper: Get series title from ID
   */
  private getSeriesTitle(seriesId: string): string {
    const titles: Record<string, string> = {
      'golang-advanced': 'Golang 進階系列',
      'golang-concurrency': 'Golang 並發模式',
      'algorithm-basics': '演算法基礎',
      'data-structures': '資料結構深入解析'
    };
    return titles[seriesId] || seriesId;
  }

  /**
   * Helper: Get series description from ID
   */
  private getSeriesDescription(seriesId: string): string {
    const descriptions: Record<string, string> = {
      'golang-advanced': '深入探討 Golang 的進階特性與最佳實踐',
      'golang-concurrency': '從基礎到進階，完整掌握 Golang 並發編程',
      'algorithm-basics': '演算法基礎概念與常見問題解析',
      'data-structures': '常用資料結構的實現原理與應用場景'
    };
    return descriptions[seriesId] || '系列文章';
  }
}
