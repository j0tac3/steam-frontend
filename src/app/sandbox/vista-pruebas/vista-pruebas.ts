import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms'; // 🚀 Importante
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

import { IgdbDataService } from '../../services/igdb-data';
import { CardCleanComponent } from '../card-clean/card-clean';
import { ModalV2Component } from '../modal-v2/modal-v2';

@Component({
  selector: 'app-vista-pruebas',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, // 🚀 Añadimos esto
    CardCleanComponent,
    ModalV2Component
  ],
  templateUrl: './vista-pruebas.html',
  styleUrl: './vista-pruebas.scss'
})
export class VistaPruebasComponent {
  private igdbService = inject(IgdbDataService);
  
  // 🚀 1. Control para el input del buscador
  buscador = new FormControl('', { nonNullable: true });
  
  juegoSeleccionado = signal<number | null>(null);
  tipoVista = signal<'clean' | 'list'>('clean');

  // 🚀 2. "Magia Reactiva": El Signal se actualiza solo cuando escribes
  misJuegos = toSignal(
    this.buscador.valueChanges.pipe(
      debounceTime(400), // Espera 400ms tras dejar de escribir
      distinctUntilChanged(), // Solo busca si el texto ha cambiado realmente
      switchMap(termino => {
        if (termino.length < 3) return of([]); // No busca si hay menos de 3 letras
        return this.igdbService.buscarJuegos(termino); // Llama a Laravel
      })
    ),
    { initialValue: [] }
  );

  cambiarVista(tipo: 'clean' | 'list') {
    this.tipoVista.set(tipo);
  }

  abrirModal(gameId: number) {
    this.juegoSeleccionado.set(gameId);
  }
}