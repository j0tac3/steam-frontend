import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop'; // 🚀 1. Importamos esta magia de Angular
import { SteamService } from '../../services/steam';
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
  private gameService = inject(SteamService);
  juegoSeleccionado = signal<any | null>(null);
  
  // 🚀 2. Convertimos el Observable en una Signal. 
  // initialValue: [] evita errores mientras llegan los datos del servidor.
  misJuegos = toSignal(this.gameService.getMyGames(), { initialValue: [] }); 

  // Tipo de vista: 'clean' o 'list'
  tipoVista = signal<'clean' | 'list'>('clean');

  cambiarVista(tipo: 'clean' | 'list') {
    this.tipoVista.set(tipo);
  }


abrirModal(juego: any) {
  this.juegoSeleccionado.set(juego);
}
}