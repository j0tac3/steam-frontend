import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { authGuard } from './guards/auth-guard';
import { BibliotecaComponent } from './components/biblioteca/biblioteca';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'biblioteca', 
    component: BibliotecaComponent, 
    canActivate: [authGuard] 
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' } // Por si el usuario escribe cualquier cosa
];