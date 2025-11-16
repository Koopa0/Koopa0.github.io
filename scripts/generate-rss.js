const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://koopa0.github.io';
const SITE_TITLE = 'Koopa Blog';
const SITE_DESCRIPTION = 'Software Engineering & Technology Blog';
const AUTHOR_NAME = 'Koopa';
const AUTHOR_EMAIL = 'your-email@example.com'; // Update this

// XML escape function to handle special characters
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function generateRSS() {
  // Read posts index
  const indexPath = path.join(__dirname, '../src/assets/posts/index.json');
  const posts = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

  // Sort posts by date (newest first)
  const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Get latest 20 posts for RSS
  const recentPosts = sortedPosts.slice(0, 20);

  const now = new Date().toUTCString();

  // Generate RSS XML
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>zh-TW</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>

${recentPosts.map(post => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <author>${escapeXml(AUTHOR_EMAIL)} (${escapeXml(AUTHOR_NAME)})</author>
      ${post.description ? `<description><![CDATA[${post.description}]]></description>` : ''}
      ${post.category ? `<category>${escapeXml(post.category)}</category>` : ''}
      ${post.tags ? post.tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n      ') : ''}
    </item>`).join('\n')}
  </channel>
</rss>`;

  // Write RSS file to public directory
  const outputPath = path.join(__dirname, '../public/feed.xml');
  fs.writeFileSync(outputPath, rss, 'utf-8');

  console.log(`✅ RSS feed generated successfully!`);
  console.log(`📝 Total posts: ${posts.length}`);
  console.log(`📰 RSS posts: ${recentPosts.length}`);
  console.log(`📍 Output: ${outputPath}`);
}

try {
  generateRSS();
} catch (error) {
  console.error('❌ Error generating RSS feed:', error);
  process.exit(1);
}
