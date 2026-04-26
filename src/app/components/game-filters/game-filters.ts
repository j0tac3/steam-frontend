import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-filters.html',
  styleUrl: './game-filters.scss'
})
export class GameFiltersComponent {
  // Entradas: Recibimos el estado actual desde la biblioteca
  filtroTexto = input.required<string>();
  filtroEstado = input.required<string>();
  
  totalMostrados = input<number>(0);

  // Salidas: Avisamos a la biblioteca cuando el usuario cambie algo
  textoCambiado = output<string>();
  estadoCambiado = output<string>();

  // NUEVO: Función para resetear la búsqueda
  limpiarBusqueda() {
    this.textoCambiado.emit('');
  }
}