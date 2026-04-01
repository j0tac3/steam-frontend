import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // Asegúrate de importar esto
import { Router } from '@angular/router'; // Importamos el Router

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  //private apiUrl = 'http://localhost:8000'; // Debe coincidir con tu Laravel
  private myAppUrl: string = environment.apiUrl;
  private router = inject(Router); // Inyectamos el router aquí

  getCsrfCookie(): Observable<any> {
    // Esto pide la galleta. Obligatorio withCredentials.
    return this.http.get(`${this.myAppUrl}/sanctum/csrf-cookie`);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.myAppUrl}/login`, credentials);
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.myAppUrl}/register`, userData);
  }

  logout(): void {
    // 1. Llamamos al backend para invalidar el Token
    this.http.post(`${this.myAppUrl}/logout`, {}).subscribe({
      next: () => this.finalizarSesionLocal(),
      error: () => this.finalizarSesionLocal() // Si falla (ej: token ya expirado), limpiamos igual
    });
  }

  private finalizarSesionLocal(): void {
    // 2. Borramos el token del almacenamiento local
    localStorage.removeItem('token');
    // 3. Mandamos al usuario de patitas al Login
    this.router.navigate(['/login']);
  }
  
}