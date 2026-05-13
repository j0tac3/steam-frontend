import { Component, input, output, signal, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { IconComponent } from '../icon/icon'; 

@Component({
  selector: 'app-game-filters',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './game-filters.html',
  styleUrl: './game-filters.scss'
})
export class GameFiltersComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  
  // 🚀 ESTADO Y PERSISTENCIA (Signals)
  public isExpanded = signal<boolean>(true);

  filtroTexto = input.required<string>();
  filtroEstado = input.required<string>();
  filtroPlataforma = input.required<string>();
  vistaActual = input.required<'cuadricula' | 'tablero'>();
  totalMostrados = input<number>(0);

  textoCambiado = output<string>();
  estadoCambiado = output<string>();
  plataformaCambiada = output<string>();
  vistaCambiada = output<'cuadricula' | 'tablero'>();

  opcionesPlataforma = [
    { id: 'todas',  nombre: 'Todas',   tipo: 'icon', valor: 'bi-grid-fill', color: '' },
    { id: 'PC',     nombre: 'PC',      tipo: 'dot',  valor: '',             color: '#d4d4d8' },
    { id: 'PlayStation', nombre: 'PlayStation', tipo: 'dot',  valor: '',    color: '#006FCD' },
    { id: 'Xbox',   nombre: 'Xbox',    tipo: 'dot',  valor: '',             color: '#107C10' },
    { id: 'Switch', nombre: 'Switch',  tipo: 'dot',  valor: '',             color: '#E60012' },
    { id: 'Mobile', nombre: 'Móvil',   tipo: 'dot',  valor: '',             color: '#F59E0B' }
  ];

  ngOnInit() {
    // 🚀 Leemos la preferencia previa o forzamos colapso en móvil
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('filtersPanelExpanded');
      if (stored !== null) {
        this.isExpanded.set(stored === 'true');
      } else if (window.innerWidth <= 768) {
        this.isExpanded.set(false);
      }
    }
  }

  togglePanel() {
    this.isExpanded.update(v => !v);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('filtersPanelExpanded', String(this.isExpanded()));
    }
  }

  onSelectPlataforma(id: string) {
    if (id === 'todas') {
      this.plataformaCambiada.emit('todas');
      return;
    }

    let seleccionadas = this.filtroPlataforma() === 'todas' ? [] : this.filtroPlataforma().split(',').filter(x => x);

    if (seleccionadas.includes(id)) {
      seleccionadas = seleccionadas.filter(item => item !== id);
    } else {
      seleccionadas.push(id);
    }

    const resultado = seleccionadas.length > 0 ? seleccionadas.join(',') : 'todas';
    this.plataformaCambiada.emit(resultado);
  }

  isActiva(id: string): boolean {
    const filtro = this.filtroPlataforma();
    if (id === 'todas') return filtro === 'todas';
    return filtro.split(',').includes(id);
  }

  limpiarBusqueda() {
    this.textoCambiado.emit('');
  }
}