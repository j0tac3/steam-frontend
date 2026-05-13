import { Component, input, output, effect, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  // 🚀 1. Atrapamos el canvas de forma segura (nativa de Angular)
  donutCanvas = viewChild<ElementRef<HTMLCanvasElement>>('donutCanvas');
  chart: any;

  total = input<number>(0);
  pendientes = input<number>(0);
  jugando = input<number>(0);
  completados = input<number>(0);
  abandonados = input<number>(0);
  filtroActual = input<string>('todos');

  filtroSeleccionado = output<string>();

  constructor() {
    // 🚀 2. EFFECT INTELIGENTE: Reacciona tanto a los datos como al DOM
    effect(() => {
      const canvas = this.donutCanvas()?.nativeElement;
      const datos = [this.completados(), this.jugando(), this.pendientes(), this.abandonados()];
      
      // Si Angular aún no ha dibujado el <canvas> en pantalla, no hacemos nada
      if (!canvas) return;

      if (this.chart) {
        // Si ya existe, actualizamos suavemente
        this.chart.data.datasets[0].data = datos;
        this.chart.update();
      } else {
        // Si el canvas está listo pero el gráfico no, lo creamos
        this.crearGrafico(canvas, datos);
      }
    });
  }

  crearGrafico(canvas: HTMLCanvasElement, datos: number[]) {
    // Escudo: Limpia basura previa de Chart.js si se recarga la vista
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Completados', 'Jugando', 'Pendientes', 'Abandonados'],
        datasets: [{
          data: datos,
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'], 
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
            bodyFont: { size: 14, weight: 'bold' },
            boxPadding: 6,
            usePointStyle: true 
          }
        },
        animation: { animateScale: true, animateRotate: true }
      }
    });
  }

  calcularPorcentaje(valor: number): string {
    if (this.total() === 0) return '0%';
    return `${(valor / this.total()) * 100}%`;
  }
}