import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes (Blog)
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
    loadComponent: () => import('./features/tags/tag-posts.component').then(m => m.TagPostsComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'series',
    loadComponent: () => import('./features/series/series-list.component').then(m => m.SeriesListComponent)
  },
  {
    path: 'series/:id',
    loadComponent: () => import('./features/series/series-detail.component').then(m => m.SeriesDetailComponent)
  },

  // Auth routes (only for guests)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
  },

  // Workspace routes (protected, will be added later)
  // {
  //   path: 'workspace',
  //   canActivate: [authGuard],
  //   children: [...]
  // },

  // 404
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
