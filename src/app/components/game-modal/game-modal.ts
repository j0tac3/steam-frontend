import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-modal.html',
  styleUrl: './game-modal.scss'
})
export class GameModalComponent {
  @Input() juegoDetalle: any = null;
  @Input() cargandoDetalle: boolean = false;
  @Input() esBiblioteca: boolean = false;

  @Output() guardar = new EventEmitter<any>();

  // ✅ SOLUCIÓN LIMPIA: Captura el cierre sea cual sea el método (botón, X, Esc, clic fuera)
  @HostListener('hide.bs.modal')
  onModalHide() {
    this.cerrarLimpio();
  }

  onGuardar() {
    this.guardar.emit(this.juegoDetalle);
  }

  cerrarLimpio() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }
}