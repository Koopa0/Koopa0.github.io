const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const POSTS_DIR = path.join(__dirname, '../public/assets/posts');
const OUTPUT_FILE = path.join(POSTS_DIR, 'index.json');

/**
 * 遞迴掃描目錄，找到所有 .md 檔案
 */
function scanDirectory(dir, basePath = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      // 遞迴掃描子目錄
      files = files.concat(scanDirectory(fullPath, relativePath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push({
        fullPath,
        relativePath
      });
    }
  }

  return files;
}

/**
 * 從檔案路徑提取分類資訊
 *
 * 路徑範例：
 * - Golang/golang-advanced-series/01-channel.md
 *   → category: "Golang", series: "golang-advanced-series", seriesOrder: 1
 * - Algorithm/lru-cache.md
 *   → category: "Algorithm", series: undefined
 */
function extractMetadataFromPath(relativePath) {
  const parts = relativePath.split(path.sep);
  const fileName = parts[parts.length - 1];

  // 移除 .md 後綴
  const fileNameWithoutExt = fileName.replace(/\.md$/, '');

  // 第一層資料夾 = 分類/標籤
  const category = parts.length > 1 ? parts[0] : null;

  // 第二層資料夾 = 系列（如果存在）
  const series = parts.length > 2 ? parts[1] : null;

  // 從檔名提取順序號碼 (例如: 01-channel.md → 1)
  const orderMatch = fileNameWithoutExt.match(/^(\d+)-/);
  const seriesOrder = orderMatch ? parseInt(orderMatch[1], 10) : undefined;

  // 生成 slug：移除數字前綴
  const slug = seriesOrder
    ? fileNameWithoutExt.replace(/^\d+-/, '')
    : fileNameWithoutExt;

  // 生成完整 slug（包含路徑資訊）
  const fullSlug = series
    ? `${category.toLowerCase()}/${series.toLowerCase()}/${slug}`
    : category
      ? `${category.toLowerCase()}/${slug}`
      : slug;

  return {
    category,
    series,
    seriesOrder,
    slug: fullSlug
  };
}

/**
 * 計算閱讀時間（分鐘）
 */
function calculateReadingTime(content) {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * 處理單個 Markdown 檔案
 */
function processMarkdownFile(file) {
  try {
    const fileContent = fs.readFileSync(file.fullPath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);

    // 從路徑提取資訊
    const pathMetadata = extractMetadataFromPath(file.relativePath);

    // 獲取檔案修改時間
    const stats = fs.statSync(file.fullPath);
    const fileModifiedTime = stats.mtime;

    // 合併 frontmatter 和路徑推導的資訊
    // frontmatter 優先級更高（可以覆寫）
    const post = {
      // 從路徑自動推導
      category: frontmatter.category || pathMetadata.category,
      series: frontmatter.series || pathMetadata.series,
      seriesOrder: frontmatter.seriesOrder || pathMetadata.seriesOrder,
      slug: frontmatter.slug || pathMetadata.slug,

      // 從 frontmatter 讀取
      title: frontmatter.title || 'Untitled',
      date: frontmatter.date || fileModifiedTime.toISOString().split('T')[0],
      description: frontmatter.description || '',

      // 標籤：自動從第一層資料夾推導（category 即為 tag）
      tags: pathMetadata.category ? [pathMetadata.category] : [],

      // 計算閱讀時間
      readingTime: frontmatter.readingTime || calculateReadingTime(content),

      // 檔案實際路徑（相對於 posts 目錄，供 Angular 載入使用）
      filePath: file.relativePath.replace(/\.md$/, ''),

      // 檔案修改時間（用於排序）
      _fileModifiedTime: fileModifiedTime.getTime()
    };

    return post;
  } catch (error) {
    console.error(`Error processing ${file.relativePath}:`, error.message);
    return null;
  }
}

/**
 * 主函數
 */
function generatePostsIndex() {
  console.log('🔍 掃描 Markdown 文章...');
  console.log(`📁 目錄: ${POSTS_DIR}`);

  // 掃描所有 .md 檔案
  const files = scanDirectory(POSTS_DIR);
  console.log(`📄 找到 ${files.length} 個 Markdown 文件`);

  // 處理每個檔案
  const posts = files
    .map(processMarkdownFile)
    .filter(post => post !== null);

  // 按檔案修改時間排序（最新的在前面）
  posts.sort((a, b) => b._fileModifiedTime - a._fileModifiedTime);

  // 移除內部使用的 _fileModifiedTime 欄位
  const finalPosts = posts.map(({ _fileModifiedTime, filePath, ...post }) => ({
    ...post,
    filePath // 保留 filePath 供 Angular 使用
  }));

  // 寫入 index.json
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalPosts, null, 2), 'utf-8');

  console.log('✅ Posts index 生成完成!');
  console.log(`📊 總共 ${finalPosts.length} 篇文章`);
  console.log(`📍 輸出: ${OUTPUT_FILE}`);

  // 顯示分類統計
  const categoryStats = {};
  const seriesStats = {};

  finalPosts.forEach(post => {
    if (post.category) {
      categoryStats[post.category] = (categoryStats[post.category] || 0) + 1;
    }
    if (post.series) {
      seriesStats[post.series] = (seriesStats[post.series] || 0) + 1;
    }
  });

  console.log('\n📋 分類統計:');
  Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(`   - ${category}: ${count} 篇`);
  });

  if (Object.keys(seriesStats).length > 0) {
    console.log('\n📚 系列統計:');
    Object.entries(seriesStats).forEach(([series, count]) => {
      console.log(`   - ${series}: ${count} 篇`);
    });
  }
}

// 執行
try {
  generatePostsIndex();
} catch (error) {
  console.error('❌ 生成失敗:', error);
  process.exit(1);
}
