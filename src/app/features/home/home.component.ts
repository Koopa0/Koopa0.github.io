import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <!-- Hero Section -->
      <section class="text-center py-20 fade-in">
        <h1 class="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
          {{ t('blog.title') }}
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
          {{ t('blog.subtitle') }}
        </p>
        <div class="flex justify-center gap-4">
          <a
            routerLink="/blog"
            class="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            {{ t('blog.allPosts') }}
          </a>
          <a
            routerLink="/tags"
            class="px-8 py-3 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
          >
            {{ t('tags.allTags') }}
          </a>
        </div>
      </section>

      <!-- Tech Tags Section -->
      <section class="py-12">
        <h2 class="text-3xl font-bold mb-8 text-center">技術主題 / Tech Topics</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          @for (tag of techTags; track tag.name) {
            <a
              [routerLink]="['/tags', tag.name.toLowerCase()]"
              class="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 p-6 text-center transition-all hover:shadow-lg"
            >
              <div class="text-3xl mb-2">{{ tag.icon }}</div>
              <h3 class="font-medium group-hover:text-blue-500 transition-colors">
                {{ tag.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ currentLang() === 'zh-TW' ? tag.zhDesc : tag.enDesc }}
              </p>
            </a>
          }
        </div>
      </section>

      <!-- About Section -->
      <section class="py-12 text-center">
        <div class="max-w-2xl mx-auto">
          <h2 class="text-3xl font-bold mb-4">關於我 / About Me</h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
            {{ currentLang() === 'zh-TW'
              ? '我是一個熱愛技術的開發者，專注於系統架構、演算法優化與現代化程式設計。在這裡分享我的學習心得與實戰經驗。'
              : 'I am a passionate developer focused on system architecture, algorithm optimization, and modern programming. Here I share my learning notes and practical experience.'
            }}
          </p>
          <a
            routerLink="/about"
            class="inline-block px-6 py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
          >
            {{ t('nav.about') }}
          </a>
        </div>
      </section>
    </div>
  `
})
export class HomeComponent implements OnInit {
  i18nService = inject(I18nService);
  currentLang = this.i18nService.currentLang;

  techTags = [
    { name: 'Golang', icon: '🐹', zhDesc: 'Go 程式設計', enDesc: 'Go Programming' },
    { name: 'Rust', icon: '🦀', zhDesc: '系統程式語言', enDesc: 'Systems Language' },
    { name: 'Algorithm', icon: '🧮', zhDesc: '演算法與資料結構', enDesc: 'Algorithms & DS' },
    { name: 'System', icon: '🏗️', zhDesc: '系統架構設計', enDesc: 'System Design' },
    { name: 'SQL', icon: '💾', zhDesc: '資料庫查詢', enDesc: 'Database Queries' },
    { name: 'AI', icon: '🤖', zhDesc: '人工智慧', enDesc: 'Artificial Intelligence' },
    { name: 'Google', icon: '🔍', zhDesc: 'Google 技術', enDesc: 'Google Tech' }
  ];

  ngOnInit() {
    // Future: Load recent posts
  }

  t(key: string): string {
    return this.i18nService.translate(key);
  }
}
