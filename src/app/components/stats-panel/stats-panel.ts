import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon'; 

@Component({
  selector: 'app-stats-panel',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './stats-panel.html',
  styleUrl: './stats-panel.scss'
})
export class StatsPanelComponent {
  total = input<number>(0);
  pendientes = input<number>(0);
  jugando = input<number>(0);
  completados = input<number>(0);
  abandonados = input<number>(0);
  filtroActual = input<string>('todos');

  filtroSeleccionado = output<string>();

  calcularPorcentaje(valor: number): string {
    if (this.total() === 0) return '0%';
    return `${(valor / this.total()) * 100}%`;
  }
}