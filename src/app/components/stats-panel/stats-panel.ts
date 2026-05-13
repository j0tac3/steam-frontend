import { Component, input, output, signal, effect, afterNextRender, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { IconComponent } from '../icon/icon'; 
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-stats-panel',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './stats-panel.html',
  styleUrl: './stats-panel.scss'
})
export class StatsPanelComponent {
  private platformId = inject(PLATFORM_ID);
  public chart: any;

  // 🚀 ESTADO Y PERSISTENCIA CON SIGNALS
  public isExpanded = signal<boolean>(true);

  // Inputs nativos de Angular 18
  total = input<number>(0);
  pendientes = input<number>(0);
  jugando = input<number>(0);
  completados = input<number>(0);
  abandonados = input<number>(0);
  filtroActual = input<string>('todos');

  filtroSeleccionado = output<string>();

  constructor() {
    // 🚀 LÓGICA DE CARGA INICIAL (Browser only)
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('statsPanelExpanded');
      if (stored !== null) {
        this.isExpanded.set(stored === 'true');
      } else if (window.innerWidth <= 768) {
        this.isExpanded.set(false); // Colapsado en móvil por defecto
      }
    }

    // 🚀 INICIALIZACIÓN SEGURA DEL GRÁFICO (Angular 18 AfterNextRender)
    // Esto sustituye a AfterViewInit y ViewChild
    afterNextRender(() => {
      this.crearGrafico();
    });

    // 🚀 ACTUALIZACIÓN REACTIVA CON EFFECTS
    effect(() => {
      const datos = [this.completados(), this.jugando(), this.pendientes(), this.abandonados()];
      if (this.chart) {
        this.chart.data.datasets[0].data = datos;
        this.chart.update();
      }
    });
  }

  togglePanel() {
    this.isExpanded.update(v => !v);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('statsPanelExpanded', String(this.isExpanded()));
    }
  }

  crearGrafico() {
    const canvas = document.getElementById('donutChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Escudo Chart.js
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Completados', 'Jugando', 'Pendientes', 'Abandonados'],
        datasets: [{
          data: [this.completados(), this.jugando(), this.pendientes(), this.abandonados()],
          
          /* 🎨 1. Colores en formato RGBA (Translúcidos al 60%) */
          backgroundColor: [
            'rgba(16, 185, 129, 0.9)', // Verde
            'rgba(59, 130, 246, 0.9)', // Azul
            'rgba(245, 158, 11, 0.9)', // Amarillo
            'rgba(239, 68, 68, 0.9)'   // Rojo
          ],
          
          /* 🌟 2. NUEVA PROPIEDAD: Colores 100% sólidos al hacer Hover */
          hoverBackgroundColor: [
            'rgba(16, 185, 129, 1)', 
            'rgba(59, 130, 246, 1)', 
            'rgba(245, 158, 11, 1)', 
            'rgba(239, 68, 68, 1)'
          ],

          borderColor: '#121419', 
          borderWidth: 3, 
          hoverOffset: 8 
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%', 
        plugins: {
          legend: { display: false }, 
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.85)',
            padding: 12,
            bodyFont: { weight: 'bold' },
            usePointStyle: true 
          }
        },
        animation: { animateScale: true, animateRotate: true }
      }
    });
  }

  // 🎢 4. Pulido de la "Barra Fantasma" (KPIs)
  calcularPorcentaje(valor: number): string {
    // Si no hay juegos en total, o en esa categoría hay 0, devolvemos 0% exacto
    if (this.total() === 0 || valor === 0) return '0%';
    
    // Si hay al menos 1 juego, usamos max() de CSS para garantizar que el "chorrito de luz" mida mínimo 6px
    return `max(6px, ${(valor / this.total()) * 100}%)`;
  }
}