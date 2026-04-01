import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Recuperamos el Token que guardamos en el login (localStorage)
  const token = localStorage.getItem('token');

  // 2. Clonamos la petición para aplicar la nueva estrategia
  const authReq = req.clone({
    setHeaders: {
      // Si el token existe, lo enviamos. Laravel Sanctum lo validará.
      Authorization: token ? `Bearer ${token}` : ''
    },
    // 3. ¡CRUCIAL! Cambiamos true por false. 
    // Esto desactiva el envío de cookies y permite que el CORS funcione con '*'
    withCredentials: false 
  });

  // 4. Enviamos la petición limpia y segura
  return next(authReq);
};