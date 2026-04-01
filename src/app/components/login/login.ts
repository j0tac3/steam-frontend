import { Component } from '@angular/core';
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

  constructor(private http: HttpClient, private router: Router) {}

  // MÉTODO PRINCIPAL (se dispara desde el botón del form)
  async procesarAuth() {
    this.cargando = true; // 1. Empezamos a cargar
    this.mensajeError = '';
    
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
      // 2. Si hay error, capturamos el mensaje para que el usuario sepa qué pasó
      console.error('Error de Auth:', error);
      
      // Intentamos sacar el mensaje de error del JSON que envía Laravel
      this.mensajeError = error.error?.message || 'Error en la conexión con el servidor';
      
      // Si Laravel nos dio un error de validación (ej: email ya existe), lo mostramos
      if (error.error?.error) {
        this.mensajeError = error.error.error; 
      }
    } finally {
      // 3. ¡ESTA ES LA CLAVE! 
      // Pase lo que pase (éxito o error), quitamos el estado de "PROCESANDO..."
      this.cargando = false; 
    }
  }

  toggleModo() {
    this.esModoLogin = !this.esModoLogin;
    this.mensajeError = '';
    this.cargando = false; // Por seguridad, si cambia de modo, desbloqueamos el botón
  }
}