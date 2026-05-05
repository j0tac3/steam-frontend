import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  template: `
    <div class="skeleton-card shimmer-base">
      <!-- Placeholder del botón FAB (Añadir) -->
      <div class="skeleton-fab"></div>
      
      <!-- Placeholder del texto inferior -->
      <div class="skeleton-info">
        <div class="skeleton-title"></div>
        <div class="skeleton-title short"></div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    /* La tarjeta base calcada de la nueva card-clean (Aspect Ratio 2:3) */
    .skeleton-card {
      position: relative;
      width: 100%;
      aspect-ratio: 2 / 3;
      border-radius: 12px;
      background-color: #1a1a1a;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    /* Placeholder del botón FAB en la esquina superior derecha */
    .skeleton-fab {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
    }

    /* Contenedor de la información en la base */
    .skeleton-info {
      position: absolute;
      bottom: 15px;
      left: 0;
      width: 100%;
      padding: 0 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* Líneas de texto fantasma */
    .skeleton-title {
      height: 12px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.08);
      width: 85%;
    }

    /* Segunda línea más corta para simular texto real */
    .skeleton-title.short {
      width: 50%;
    }

    /* Animación de barrido (Shimmer effect) global */
    @keyframes shimmer {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: calc(200px + 100%) 0;
      }
    }

    /* Aplicamos el efecto de luz atravesando la tarjeta */
    .shimmer-base {
      background-image: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0,
        rgba(255, 255, 255, 0.03) 20%,
        rgba(255, 255, 255, 0.08) 60%,
        rgba(255, 255, 255, 0)
      );
      background-size: 200px 100%;
      background-repeat: no-repeat;
      animation: shimmer 1.5s infinite linear;
    }
  `]
})
export class SkeletonCardComponent {}