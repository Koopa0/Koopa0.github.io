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

  // Workspace routes (protected)
  {
    path: 'workspace',
    canActivate: [authGuard],
    loadComponent: () => import('./features/workspace/workspace-layout.component').then(m => m.WorkspaceLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/workspace/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'pages',
        loadComponent: () => import('./features/workspace/pages/page-list.component').then(m => m.PageListComponent)
      },
      {
        path: 'pages/:id',
        loadComponent: () => import('./features/workspace/pages/page-editor.component').then(m => m.PageEditorComponent),
        // Disable prerendering for dynamic routes
        data: { prerender: false }
      },
      {
        path: 'ai-chat',
        loadComponent: () => import('./features/workspace/ai-chat/ai-chat.component').then(m => m.AiChatComponent)
      },
      {
        path: 'obsidian-import',
        loadComponent: () => import('./features/workspace/obsidian/obsidian-import.component').then(m => m.ObsidianImportComponent)
      }
      // TODO: Add these routes when components are created
      // {
      //   path: 'learning-paths',
      //   loadComponent: () => import('./features/workspace/learning-paths/learning-path-list.component').then(m => m.LearningPathListComponent)
      // },
      // {
      //   path: 'learning-paths/:id',
      //   loadComponent: () => import('./features/workspace/learning-paths/learning-path-detail.component').then(m => m.LearningPathDetailComponent)
      // },
      // {
      //   path: 'settings',
      //   loadComponent: () => import('./features/workspace/settings/settings.component').then(m => m.SettingsComponent)
      // }
    ]
  },

  // 404
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
