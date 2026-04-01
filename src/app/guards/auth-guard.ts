import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    return true; // Hay token, puedes pasar
  } else {
    router.navigate(['/login']); // No hay token, fuera
    return false;
  }
};