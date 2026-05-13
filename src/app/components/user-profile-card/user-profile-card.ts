import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-profile-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile-card.html',
  styleUrl: './user-profile-card.scss'
})
export class UserProfileCardComponent {
  // 📥 Entradas (Inputs de Angular 18)
  usuario = input.required<{
    avatar: string;
    username: string;
    badge: string;
    juegosTotales: number;
    juegosCompletados: number;
    favoritosCount: number;
    topJuegos: { id: string, cover_url: string, title: string }[];
  }>();

  isPublic = input<boolean>(false); // Viene de la BBDD
  
  // 📤 Salidas (Outputs de Angular 18)
  privacyToggled = output<boolean>();
  shareClicked = output<string>();

  // 📊 Cálculo de Telemetría
  tasaFinalizacion = computed(() => {
    const data = this.usuario();
    if (!data || data.juegosTotales === 0) return 0;
    return Math.round((data.juegosCompletados / data.juegosTotales) * 100);
  });

  // 🎢 Estado del Efecto Tilt 3D
  tiltStyle = signal<string>('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');

  // Acción del Toggle
  onTogglePrivacy(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.privacyToggled.emit(isChecked);
  }

  // Acción de Compartir
  compartirPerfil() {
    this.shareClicked.emit(this.usuario().username);
  }

  // 🚀 Lógica Nativa del Efecto Tilt (Sin librerías externas)
  onMouseMove(event: MouseEvent) {
    // Desactivar en móviles para evitar bugs táctiles
    if (window.innerWidth <= 768) return;

    const card = event.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    
    // Coordenadas relativas al centro de la tarjeta
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calcular grados de inclinación (Max 10 grados para que sea elegante)
    const rotateX = ((y - centerY) / centerY) * -10; 
    const rotateY = ((x - centerX) / centerX) * 10;

    this.tiltStyle.set(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  }

  onMouseLeave() {
    // Restaurar a posición original con suavidad
    this.tiltStyle.set('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  }
}