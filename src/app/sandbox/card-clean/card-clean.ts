import { Component, Output, EventEmitter, input } from '@angular/core';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-card-clean',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-clean.html',
  styleUrls: ['./card-clean.scss']
})
export class CardCleanComponent {
  // Entradas estrictas y directas
  gameId = input.required<string>(); // Usaremos el external_id aquí
  title = input.required<string>();
  imageUrl = input.required<string>(); // Ya no necesitamos que sea undefined
  showAddButton = input<boolean>(false);
  
  @Output() clicked = new EventEmitter<string>();
  @Output() addClicked = new EventEmitter<string>();

  verDetalle() {
    this.clicked.emit(this.gameId());
  }

  onAddClick(event: Event) {
    event.stopPropagation(); 
    this.addClicked.emit(this.gameId());
  }
}