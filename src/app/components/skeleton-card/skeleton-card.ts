import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  template: `
    <div class="skeleton-wrapper">
      <div class="skeleton-img shimmer"></div>
      
      <div class="skeleton-content">
        <div class="skeleton-title shimmer"></div>
        <div class="skeleton-btn shimmer"></div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    /* Animación de barrido (Shimmer effect) */
    @keyframes shimmer {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: calc(200px + 100%) 0;
      }
    }

    .shimmer {
      /* Usa las variables CSS que creamos antes para el Modo Oscuro */
      background: rgba(255, 255, 255, 0.05);
      background-image: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0,
        rgba(255, 255, 255, 0.08) 20%,
        rgba(255, 255, 255, 0.15) 60%,
        rgba(255, 255, 255, 0)
      );
      background-size: 200px 100%;
      background-repeat: no-repeat;
      animation: shimmer 1.5s infinite linear;
    }

    .skeleton-wrapper {
      background: var(--glass-bg-panel, rgba(25, 25, 30, 0.4));
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.05));
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 320px; /* Altura aproximada de tus tarjetas */
    }

    .skeleton-img {
      width: 100%;
      height: 220px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.02);
    }

    .skeleton-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex-grow: 1;
      justify-content: space-between;
    }

    .skeleton-title {
      height: 20px;
      width: 80%;
      border-radius: 4px;
    }

    .skeleton-btn {
      height: 36px;
      width: 100%;
      border-radius: 6px;
      margin-top: auto;
    }
  `]
})
export class SkeletonCardComponent {}