import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <!-- Gradient Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-dark-bg-primary dark:to-gray-900 -z-10"></div>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- Header -->
        <div class="mb-16 animate-slideUp">
          <h1 class="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            {{ t('nav.about') }}
          </h1>
          <div class="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>

        <div class="space-y-12 animate-slideUp" style="animation-delay: 0.1s;">
          @if (currentLang() === 'zh-TW') {
            <!-- Introduction -->
            <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-card dark:shadow-card-dark">
              <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">你好！</h2>
              <p class="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                我是 Koopa，一個熱愛技術的軟體工程師。這個部落格是我分享程式設計學習心得、
                演算法解題思路和系統架構經驗的地方。
              </p>
            </section>

            <!-- Tech Stack -->
            <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-card dark:shadow-card-dark">
              <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">技術領域</h2>
              <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <li class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div class="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  Golang & Rust 程式設計
                </li>
                <li class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div class="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  演算法與資料結構
                </li>
                <li class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div class="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  系統架構設計
                </li>
                <li class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div class="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  資料庫優化
                </li>
                <li class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div class="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  人工智慧應用
                </li>
              </ul>
            </section>

            <!-- Social Links -->
            <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-card dark:shadow-card-dark">
              <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">聯絡方式</h2>
              <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
                如果你對我的文章有任何問題或建議，歡迎透過以下方式與我聯繫：
              </p>
              <div class="flex flex-wrap gap-4">
                <a
                  href="https://github.com/Koopa0"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-700 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>GitHub</span>
                </a>

                <a
                  href="https://x.com/Koopa012426"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>Twitter / X</span>
                </a>

                <a
                  href="https://www.linkedin.com/in/koopa-chen-70a4651ba/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </div>
            </section>
          } @else {
            <!-- Introduction -->
            <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-card dark:shadow-card-dark">
              <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Hello!</h2>
              <p class="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                I'm Koopa, a passionate software engineer. This blog is where I share my
                programming insights, algorithm problem-solving approaches, and system architecture experiences.
              </p>
            </section>

            <!-- Tech Stack -->
            <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-card dark:shadow-card-dark">
              <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Tech Stack</h2>
              <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <li class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div class="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  Golang & Rust Programming
                </li>
                <li class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div class="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  Algorithms & Data Structures
                </li>
                <li class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div class="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  System Architecture Design
                </li>
                <li class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div class="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  Database Optimization
                </li>
                <li class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div class="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  AI Applications
                </li>
              </ul>
            </section>

            <!-- Social Links -->
            <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-card dark:shadow-card-dark">
              <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Connect With Me</h2>
              <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
                If you have any questions or suggestions about my posts, feel free to reach out:
              </p>
              <div class="flex flex-wrap gap-4">
                <a
                  href="https://github.com/Koopa0"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-700 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>GitHub</span>
                </a>

                <a
                  href="https://x.com/Koopa012426"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>Twitter / X</span>
                </a>

                <a
                  href="https://www.linkedin.com/in/koopa-chen-70a4651ba/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </div>
            </section>
          }
        </div>
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
