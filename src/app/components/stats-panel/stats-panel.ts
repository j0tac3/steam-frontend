import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-panel.html',
  styleUrl: './stats-panel.scss'
})
export class StatsPanelComponent {
  // Entradas de datos (tus señales actuales)
  total = input<number>(0);
  pendientes = input<number>(0);
  jugando = input<number>(0);
  completados = input<number>(0);
  abandonados = input<number>(0);
  filtroActual = input<string>('todos');

  // Nuevo: Emitimos un evento cuando hacen clic en una categoría
  filtroSeleccionado = output<string>();

  // Función para calcular el ancho de cada segmento de la barra
  calcularPorcentaje(valor: number): string {
    if (this.total() === 0) return '0%';
    return `${(valor / this.total()) * 100}%`;
  }
}