import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 class="text-4xl font-bold mb-8">{{ t('nav.about') }}</h1>

      <div class="prose dark:prose-invert max-w-none">
        @if (currentLang() === 'zh-TW') {
          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">👋 你好！</h2>
            <p class="text-lg leading-relaxed">
              我是 Koopa，一個熱愛技術的軟體工程師。這個部落格是我分享程式設計學習心得、
              演算法解題思路和系統架構經驗的地方。
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">💻 技術領域</h2>
            <ul class="list-disc list-inside space-y-2">
              <li>Golang & Rust 程式設計</li>
              <li>演算法與資料結構</li>
              <li>系統架構設計</li>
              <li>資料庫優化</li>
              <li>人工智慧應用</li>
            </ul>
          </section>

          <section>
            <h2 class="text-2xl font-semibold mb-4">📫 聯絡方式</h2>
            <p class="text-lg">
              如果你對我的文章有任何問題或建議，歡迎透過 GitHub Issues 與我討論！
            </p>
          </section>
        } @else {
          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">👋 Hello!</h2>
            <p class="text-lg leading-relaxed">
              I'm Koopa, a passionate software engineer. This blog is where I share my
              programming insights, algorithm problem-solving approaches, and system architecture experiences.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">💻 Tech Stack</h2>
            <ul class="list-disc list-inside space-y-2">
              <li>Golang & Rust Programming</li>
              <li>Algorithms & Data Structures</li>
              <li>System Architecture Design</li>
              <li>Database Optimization</li>
              <li>AI Applications</li>
            </ul>
          </section>

          <section>
            <h2 class="text-2xl font-semibold mb-4">📫 Contact</h2>
            <p class="text-lg">
              If you have any questions or suggestions about my posts, feel free to discuss via GitHub Issues!
            </p>
          </section>
        }
      </div>
    </div>
  `
})
export class AboutComponent {
  i18nService = inject(I18nService);
  currentLang = this.i18nService.currentLang;

  t(key: string): string {
    return this.i18nService.translate(key);
  }
}
