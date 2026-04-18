import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-panel.html',
  styleUrl: './stats-panel.scss'
})
export class StatsPanelComponent {
  @Input() total: number = 0;
  @Input() pendientes: number = 0;
  @Input() jugando: number = 0;
  @Input() completados: number = 0;
  @Input() abandonados: number = 0;
}