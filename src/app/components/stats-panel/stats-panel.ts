import { Component, input, output, effect } from '@angular/core';
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
  chart: any;

  total = input<number>(0);
  pendientes = input<number>(0);
  jugando = input<number>(0);
  completados = input<number>(0);
  abandonados = input<number>(0);
  filtroActual = input<string>('todos');

  filtroSeleccionado = output<string>();

  constructor() {
    // Angular Signals: Escuchamos los cambios en los datos para animar el gráfico automáticamente
    effect(() => {
      const datos = [this.completados(), this.jugando(), this.pendientes(), this.abandonados()];
      if (this.chart) {
        this.chart.data.datasets[0].data = datos;
        this.chart.update();
      } else {
        // Le damos un pequeño tiempo a Angular para que pinte el HTML antes de buscar el <canvas>
        setTimeout(() => this.crearGrafico(), 100);
      }
    });
  }

  crearGrafico() {
    const ctx = document.getElementById('donutChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completados', 'Jugando', 'Pendientes', 'Abandonados'],
        datasets: [{
          data: [this.completados(), this.jugando(), this.pendientes(), this.abandonados()],
          backgroundColor: ['#198754', '#0d6efd', '#ffc107', '#dc3545'], // Colores Bootstrap
          borderWidth: 0, // Sin bordes para encajar con el Glassmorphism
          hoverOffset: 10 // Al pasar el ratón, el trozo sobresale un poco
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%', // Grosor del donut (cuanto mayor, más fino)
        plugins: {
          legend: { display: false }, // Ocultamos la leyenda (usamos tus botones debajo)
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 12,
            bodyFont: { size: 14, weight: 'bold' }
          }
        }
      }
    });
  }

  calcularPorcentaje(valor: number): string {
    if (this.total() === 0) return '0%';
    return `${(valor / this.total()) * 100}%`;
  }
}