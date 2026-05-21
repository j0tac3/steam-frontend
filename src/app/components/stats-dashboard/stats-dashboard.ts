import { Component, OnInit, AfterViewInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GameService } from '../../services/game.service';
import { IconComponent } from '../icon/icon';
import Chart from 'chart.js/auto'; // Importación directa de Chart.js

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './stats-dashboard.html',
  styleUrls: ['./stats-dashboard.scss']
})
export class StatsDashboard implements OnInit, AfterViewInit {
  private gameService = inject(GameService);

  public loading = signal<boolean>(true);
  public totalGames = signal<number>(0);

  // Guardamos las referencias de los gráficos para destruirlos si recargamos
  private statusChart: Chart | null = null;
  private platformsChart: Chart | null = null;
  private genresChart: Chart | null = null;

  ngOnInit() {
    this.cargarEstadisticas();
  }

  ngAfterViewInit() {
    // Aquí los canvas ya existen en el DOM, pero esperamos a que lleguen los datos
  }

  cargarEstadisticas() {
    this.gameService.getAdvancedStats().subscribe({
      next: (res: any) => {
        this.totalGames.set(res.total_games);
        this.loading.set(false);

        // Damos un pequeño respiro a Angular para que pinte los canvas tras quitar el loading
        setTimeout(() => {
          this.renderStatusChart(res.status);
          this.renderPlatformsChart(res.platforms);
          this.renderGenresChart(res.genres);
        }, 100);
      }
    });
  }

  // ==========================================
  // 🎨 1. GRÁFICO DE ESTADOS (DOUGHNUT)
  // ==========================================
  renderStatusChart(statusData: any) {
    const canvas = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.statusChart) this.statusChart.destroy();

    this.statusChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Completados', 'Jugando', 'Pendientes', 'Abandonados'],
        datasets: [{
          data: [
            statusData.completado || 0, 
            statusData.jugando || 0, 
            statusData.pendiente || 0, 
            statusData.abandonado || 0
          ],
          backgroundColor: [
            'rgba(25, 135, 84, 0.8)',  // Completado (Verde)
            'rgba(13, 110, 253, 0.8)', // Jugando (Azul)
            'rgba(255, 193, 7, 0.8)',  // Pendiente (Amarillo)
            'rgba(220, 53, 69, 0.8)'   // Abandonado (Rojo)
          ],
          borderColor: '#121419',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { color: '#e5e5e5' } } }
      }
    });
  }

  // ==========================================
  // 🎨 2. GRÁFICO DE PLATAFORMAS (POLAR AREA)
  // ==========================================
  // ==========================================
  // 🎨 2. GRÁFICO DE PLATAFORMAS (POLAR AREA - COLOR MAPPING)
  // ==========================================
  renderPlatformsChart(platformsData: any) {
    const canvas = document.getElementById('platformsChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.platformsChart) this.platformsChart.destroy();

    // 🚀 Extraemos las familias reales que vienen de la BBDD (ej: ['pc', 'playstation', 'xbox'])
    const keys = Object.keys(platformsData);
    const platformLabels = keys.map(p => p.toUpperCase());
    const platformValues = Object.values(platformsData) as number[];

    // 🎨 Diccionario de colores oficiales por marca (RGBA al 75% de opacidad)
    const colorMap: { [key: string]: string } = {
      'playstation': 'rgba(0, 112, 204, 0.75)', // Azul PlayStation
      'xbox': 'rgba(16, 124, 16, 0.75)',        // Verde Xbox
      'pc': 'rgba(240, 240, 240, 0.75)',        // Blanco/Gris claro PC
      'nintendo': 'rgba(230, 0, 18, 0.75)',      // Rojo Nintendo
      'mobile': 'rgba(14, 165, 233, 0.75)',      // Cian Móvil
      'other': 'rgba(108, 117, 125, 0.75)'       // Gris Genérico
    };

    // Asignamos el color dinámicamente según la plataforma presente
    const backgroundColors = keys.map(key => colorMap[key.toLowerCase()] || colorMap['other']);

    this.platformsChart = new Chart(canvas, {
      type: 'polarArea',
      data: {
        labels: platformLabels,
        datasets: [{
          data: platformValues,
          backgroundColor: backgroundColors,
          borderColor: '#121419', // Borde oscuro que casa con tu fondo para separar las porciones
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { 
              color: '#e5e5e5', 
              padding: 15, 
              font: { weight: 600 } // 🚀 CORREGIDO: Número puro sin comillas
            }
          }
        },
        scales: {
          r: {
            // Ajustamos la rejilla de fondo para que sea visible pero elegante
            grid: { color: 'rgba(255, 255, 255, 0.15)' },
            angleLines: { color: 'rgba(255, 255, 255, 0.15)' },
            ticks: {
              display: false // Oculta los números de escala feos (1, 2, 3...) del fondo
            }
          }
        }
      }
    });
  }

  // ==========================================
  // 🎨 3. GRÁFICO DE GÉNEROS (BARRAS HORIZONTALES)
  // ==========================================
  renderGenresChart(genresData: any) {
    const canvas = document.getElementById('genresChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.genresChart) this.genresChart.destroy();

    this.genresChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: Object.keys(genresData),
        datasets: [{
          label: 'Juegos',
          data: Object.values(genresData) as number[],
          backgroundColor: 'rgba(111, 66, 193, 0.8)', // Morado
          borderColor: '#9d7dfa',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y', // Hace que las barras sean horizontales
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
          y: { grid: { display: false }, ticks: { color: '#e5e5e5' } }
        }
      }
    });
  }
}