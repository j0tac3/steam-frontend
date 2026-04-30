import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
// 🚀 1. Importamos el nuevo servicio de IGDB
import { IgdbDataService } from '../../services/igdb-data'; 
import { CardCleanComponent } from '../card-clean/card-clean';
import { CardListComponent } from '../card-list/card-list';
import { ModalV2Component } from '../modal-v2/modal-v2';

@Component({
  selector: 'app-vista-pruebas',
  standalone: true,
  imports: [CommonModule, 
            CardCleanComponent,
            CardListComponent,
            ModalV2Component
          ],
  templateUrl: './vista-pruebas.html',
  styleUrl: './vista-pruebas.scss'
})
export class VistaPruebasComponent {
  // Cambiamos a nuestro nuevo servicio[cite: 1]
  private igdbService = inject(IgdbDataService);
  
  // 🚀 2. Ahora guardamos un NUMBER (el ID), no el objeto entero[cite: 1]
  juegoSeleccionado = signal<number | null>(null);
  
  // 🚀 3. Hacemos una búsqueda por defecto (ej: 'halo') para rellenar la UI
  misJuegos = toSignal(this.igdbService.buscarJuegos('halo'), { initialValue: [] }); 
  
  tipoVista = signal<'clean' | 'list'>('clean');

  cambiarVista(tipo: 'clean' | 'list') {
    this.tipoVista.set(tipo);
  }

  // Recibimos el ID desde la tarjeta y lo guardamos
  abrirModal(gameId: number) {
    this.juegoSeleccionado.set(gameId);
  }
}