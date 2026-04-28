import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon'; 

@Component({
  selector: 'app-game-filters',
  standalone: true,
  imports: [CommonModule, 
            IconComponent],
  templateUrl: './game-filters.html',
  styleUrl: './game-filters.scss'
})
export class GameFiltersComponent {
  filtroTexto = input.required<string>();
  filtroEstado = input.required<string>();
  filtroPlataforma = input.required<string>(); // 🟢 NUEVO
  
  totalMostrados = input<number>(0);

  textoCambiado = output<string>();
  estadoCambiado = output<string>();
  plataformaCambiada = output<string>(); // 🟢 NUEVO

  limpiarBusqueda() {
    this.textoCambiado.emit('');
  }
}