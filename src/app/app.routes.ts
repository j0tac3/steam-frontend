import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { authGuard } from './guards/auth-guard';
import { BibliotecaComponent } from './components/biblioteca/biblioteca';
import { VistaPruebasComponent } from './sandbox/vista-pruebas/vista-pruebas';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  
  { 
    path: 'biblioteca', 
    component: BibliotecaComponent, 
    canActivate: [authGuard] 
  },
  
  // 🚀 El Sandbox ahora está protegido y ANTES del comodín
  { 
    path: 'sandbox', 
    component: VistaPruebasComponent,
    canActivate: [authGuard] 
  },

  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  { path: '**', redirectTo: '/login' } 
];