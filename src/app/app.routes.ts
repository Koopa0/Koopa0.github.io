import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'blog',
    loadComponent: () => import('./features/blog/blog-list.component').then(m => m.BlogListComponent)
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./features/blog/blog-detail.component').then(m => m.BlogDetailComponent)
  },
  {
    path: 'tags',
    loadComponent: () => import('./features/tags/tags.component').then(m => m.TagsComponent)
  },
  {
    path: 'tags/:tag',
    loadComponent: () => import('./features/tags/tags.component').then(m => m.TagsComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
