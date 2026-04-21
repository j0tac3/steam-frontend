import { Component, input, output, signal, inject, AfterViewInit, Renderer2 } from '@angular/core'; // Añadido Renderer2
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-game-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-modal.html',
  styleUrl: './game-modal.scss'
})
export class GameModalComponent implements AfterViewInit {
  private sanitizer = inject(DomSanitizer);
  private renderer = inject(Renderer2); // Inyectamos el renderer

  juegoDetalle = input<any>(null);
  cargandoDetalle = input<boolean>(false);
  esBiblioteca = input<boolean>(false);
  guardarDiario = output<any>();
  
  activeTab = signal<'info' | 'diario'>('info');

  ngAfterViewInit() {
    const modalElement = document.getElementById('modalDetalles');
    
    if (modalElement) {
      // Usamos el evento de Bootstrap cuando empieza a ocultarse
      this.renderer.listen(modalElement, 'hide.bs.modal', () => {
        // 1. Quitamos el foco del elemento actual
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }

        // 2. En lugar de selectRootElement, usamos el DOM nativo 
        // para devolver el foco al body sin borrar su contenido
        setTimeout(() => {
          document.body.focus();
        }, 100);
      });

      // 3. Limpieza extra para asegurar que el scroll de la página vuelva a funcionar
      this.renderer.listen(modalElement, 'hidden.bs.modal', () => {
        this.renderer.removeClass(document.body, 'modal-open');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          this.renderer.removeChild(document.body, backdrop);
        }
      });
    }
  }

  // ... resto de tus métodos (setRating, getSafeHtml, etc.) se mantienen igual
  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  setRating(valor: number) {
    const juego = this.juegoDetalle();
    if (juego) {
      juego.personal_rating = valor * 2;
    }
  }

  getStarArray(): boolean[] {
    const rating = this.juegoDetalle()?.personal_rating || 0;
    const count = Math.round(rating / 2);
    return Array(5).fill(false).map((_, i) => i < count);
  }

  onGuardar() {
    this.guardarDiario.emit(this.juegoDetalle());
  }
}