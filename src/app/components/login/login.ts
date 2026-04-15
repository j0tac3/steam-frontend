import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  // Objeto unificado para los campos del formulario
  datosUsuario = { name: '', email: '', password: '' };
  
  esModoLogin = true; // Controla qué formulario se ve
  cargando = false;
  mensajeError = '';

  // 1. Inyectamos ChangeDetectorRef aquí
  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  // MÉTODO PRINCIPAL (se dispara desde el botón del form)
  async procesarAuth() {
    if (this.cargando) return; // Evita doble clic si ya está cargando

    this.cargando = true;
    this.mensajeError = '';
    
    // 2. Avisamos a Angular de que hemos cambiado el estado a "Cargando"
    this.cdr.detectChanges(); 
    
    const endpoint = this.esModoLogin ? '/login' : '/register';
    const payload = this.esModoLogin 
      ? { email: this.datosUsuario.email, password: this.datosUsuario.password }
      : this.datosUsuario;

    try {
      const res: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}${endpoint}`, payload)
      );

      // Si llega aquí, todo ha ido bien
      localStorage.setItem('token', res.access_token);
      this.router.navigate(['/biblioteca']);

    } catch (error: any) {
      console.error('Error de Auth:', error);

      // 1. Si es un error de validación de Laravel (422)
      if (error.status === 422 && error.error?.errors) {
        // Aplanamos el array de errores y cogemos el primero
        const listaErrores = Object.values(error.error.errors).flat();
        this.mensajeError = listaErrores[0] as string;
      } 
      // 2. Si es un error de credenciales incorrectas (401)
      else if (error.status === 401) {
        this.mensajeError = 'Email o contraseña incorrectos';
      }
      // 3. Error genérico o de conexión
      else {
        this.mensajeError = error.error?.message || 'Error en la conexión con el servidor';
      }

    } finally {
      // 3. Quitamos el estado de carga y forzamos a Angular a despertar
      this.cargando = false; 
      this.cdr.detectChanges(); // ¡Esta línea es la que desbloquea tu botón visualmente!
    }
  }

  toggleModo() {
    this.esModoLogin = !this.esModoLogin;
    this.mensajeError = '';
    this.cargando = false;
    this.datosUsuario = { name: '', email: '', password: '' }; // Limpiamos el form al cambiar de modo
    this.cdr.detectChanges();
  }
}