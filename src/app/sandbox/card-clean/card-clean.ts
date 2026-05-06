import { Component, Output, EventEmitter, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-card-clean',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-clean.html',
  styleUrls: ['./card-clean.scss']
})
export class CardCleanComponent {
  gameId = input.required<string>();
  title = input.required<string>();
  imageUrl = input.required<string>(); 
  showAddButton = input<boolean>(false);
  status = input<string>();
  context = input<'search' | 'library'>('search'); 
  
  @Output() clicked = new EventEmitter<string>();
  @Output() addClicked = new EventEmitter<string>();
  
  // 🚀 AHORA ENVIAMOS LAS COORDENADAS AL PADRE
  @Output() completeClicked = new EventEmitter<{clientX: number, clientY: number}>();
  @Output() optionsClicked = new EventEmitter<string>();

  // 🚀 SIGNALS PARA LA COREOGRAFÍA VISUAL
  isPopping = signal<boolean>(false);
  isLeaving = signal<boolean>(false);

  verDetalle() {
    this.clicked.emit(this.gameId());
  }

  onAddClick(event: Event) {
    event.stopPropagation(); 
    this.addClicked.emit(this.gameId());
  }

  onOptionsClick(event: Event) {
    event.stopPropagation();
    this.optionsClicked.emit(this.gameId());
  }

  onCompleteClick(event: MouseEvent) {
    event.stopPropagation();
    
    // 0.0s - Activamos el Latido visual del trofeo
    this.isPopping.set(true);
    setTimeout(() => this.isPopping.set(false), 300);

    // Activamos la animación CSS de Despedida (que dura 0.8s)
    this.isLeaving.set(true);

    // Pasamos el relevo a Biblioteca con las coordenadas del ratón
    this.completeClicked.emit({
      clientX: event.clientX,
      clientY: event.clientY
    });
  }
}