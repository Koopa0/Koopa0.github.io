import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Post } from './markdown.service';

/**
 * SEO Service
 *
 * 管理頁面的 Meta Tags 和 Schema.org structured data，提升 SEO 表現
 *
 * 功能：
 * - 設置頁面標題和描述
 * - Open Graph (Facebook/LinkedIn)
 * - Twitter Cards
 * - Schema.org JSON-LD
 */
@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private meta = inject(Meta);
  private titleService = inject(Title);

  private readonly siteUrl = 'https://koopa0.github.io';
  private readonly siteName = 'Koopa 技術部落格';
  private readonly defaultDescription = '分享軟體開發、系統架構、演算法和技術實踐的部落格';
  private readonly defaultImage = `${this.siteUrl}/assets/og-image.png`;

  /**
   * 設置首頁 SEO
   */
  setHomePage(lang: 'zh-TW' | 'en-US' = 'zh-TW'): void {
    const title = lang === 'zh-TW' ? 'Koopa 技術部落格' : 'Koopa Tech Blog';
    const description = lang === 'zh-TW'
      ? '分享軟體開發、系統架構、演算法和技術實踐的部落格'
      : 'A blog about software development, system architecture, algorithms and technical practices';

    this.setMetaTags({
      title,
      description,
      url: this.siteUrl,
      type: 'website'
    });
  }

  /**
   * 設置文章頁面 SEO
   */
  setArticle(post: Post): void {
    const url = `${this.siteUrl}/blog/${post.slug}`;
    const title = `${post.title} | ${this.siteName}`;

    this.setMetaTags({
      title,
      description: post.description || this.defaultDescription,
      url,
      type: 'article',
      image: this.defaultImage,
      keywords: post.tags.join(', '),
      publishedTime: post.date,
      author: 'Koopa'
    });

    // 添加 Schema.org Article
    this.setArticleSchema(post);
  }

  /**
   * 設置基本 Meta Tags
   */
  private setMetaTags(config: {
    title: string;
    description: string;
    url: string;
    type: 'website' | 'article';
    image?: string;
    keywords?: string;
    publishedTime?: string;
    author?: string;
  }): void {
    // 設置頁面標題
    this.titleService.setTitle(config.title);

    // 基本 Meta Tags
    this.meta.updateTag({ name: 'description', content: config.description });
    if (config.keywords) {
      this.meta.updateTag({ name: 'keywords', content: config.keywords });
    }
    if (config.author) {
      this.meta.updateTag({ name: 'author', content: config.author });
    }

    // Open Graph (Facebook, LinkedIn)
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:url', content: config.url });
    this.meta.updateTag({ property: 'og:type', content: config.type });
    this.meta.updateTag({ property: 'og:site_name', content: this.siteName });
    if (config.image) {
      this.meta.updateTag({ property: 'og:image', content: config.image });
      this.meta.updateTag({ property: 'og:image:width', content: '1200' });
      this.meta.updateTag({ property: 'og:image:height', content: '630' });
    }
    if (config.publishedTime) {
      this.meta.updateTag({ property: 'article:published_time', content: config.publishedTime });
    }

    // Twitter Cards
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    if (config.image) {
      this.meta.updateTag({ name: 'twitter:image', content: config.image });
    }

    // 額外的 SEO tags
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ name: 'googlebot', content: 'index, follow' });
    this.meta.updateTag({ httpEquiv: 'Content-Language', content: 'zh-TW' });
  }

  /**
   * 設置 Schema.org Article JSON-LD
   */
  private setArticleSchema(post: Post): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description || this.defaultDescription,
      url: `${this.siteUrl}/blog/${post.slug}`,
      datePublished: post.date,
      dateModified: post.date,
      author: {
        '@type': 'Person',
        name: 'Koopa',
        url: this.siteUrl
      },
      publisher: {
        '@type': 'Organization',
        name: this.siteName,
        logo: {
          '@type': 'ImageObject',
          url: `${this.siteUrl}/assets/logo.png`
        }
      },
      image: this.defaultImage,
      keywords: post.tags.join(', '),
      articleSection: post.category || 'Technology',
      wordCount: post.content.split(/\s+/).length,
      timeRequired: `PT${post.readingTime}M`
    };

    this.addJsonLdSchema(schema);
  }

  /**
   * 設置 Schema.org BreadcrumbList
   */
  setBreadcrumbSchema(items: Array<{ name: string; url: string }>): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `${this.siteUrl}${item.url}`
      }))
    };

    this.addJsonLdSchema(schema);
  }

  /**
   * 添加 JSON-LD Schema 到頁面
   */
  private addJsonLdSchema(schema: any): void {
    // 移除舊的 schema
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // 添加新的 schema
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  /**
   * 重置 Meta Tags 到預設值
   */
  resetMetaTags(): void {
    this.setHomePage();
  }
}
