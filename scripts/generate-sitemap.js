const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://koopa0.github.io';

/**
 * Generate sitemap.xml for SEO
 *
 * 包含的頁面：
 * - 首頁
 * - 部落格列表頁
 * - 所有文章頁面
 * - 標籤頁面
 * - 關於頁面
 */
function generateSitemap() {
  // Read posts index
  const indexPath = path.join(__dirname, '../public/assets/posts/index.json');
  const posts = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

  // Sort posts by date (newest first)
  const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Get all unique tags
  const tags = new Set();
  posts.forEach(post => {
    if (post.tags) {
      post.tags.forEach(tag => tags.add(tag));
    }
  });

  const now = new Date().toISOString();

  // Static pages
  const staticPages = [
    { url: '', changefreq: 'daily', priority: '1.0' },
    { url: '/blog', changefreq: 'daily', priority: '0.9' },
    { url: '/tags', changefreq: 'weekly', priority: '0.7' },
    { url: '/about', changefreq: 'monthly', priority: '0.5' }
  ];

  // Generate URL entries
  const urlEntries = [
    // Static pages
    ...staticPages.map(page => `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`),

    // Blog posts
    ...sortedPosts.map(post => `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${post.date || now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`),

    // Tag pages
    ...Array.from(tags).map(tag => `  <url>
    <loc>${SITE_URL}/tags/${tag.toLowerCase()}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`)
  ];

  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries.join('\n')}
</urlset>`;

  // Write sitemap to public directory
  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, sitemap, 'utf-8');

  console.log('✅ Sitemap generated successfully!');
  console.log(`📝 Total URLs: ${urlEntries.length}`);
  console.log(`   - Static pages: ${staticPages.length}`);
  console.log(`   - Blog posts: ${sortedPosts.length}`);
  console.log(`   - Tag pages: ${tags.size}`);
  console.log(`📍 Output: ${outputPath}`);
}

try {
  generateSitemap();
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}
