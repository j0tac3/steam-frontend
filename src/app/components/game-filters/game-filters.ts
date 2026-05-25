import { Component, input, output, signal, computed, inject, PLATFORM_ID, OnInit, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { IconComponent } from '../icon/icon'; 
import { GameService } from '../../services/game.service'; // 🚀 Importamos el servicio

@Component({
  selector: 'app-game-filters',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './game-filters.html',
  styleUrl: './game-filters.scss'
})
export class GameFiltersComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private gameService = inject(GameService); // 🚀 Inyectamos el servicio
  
  public isExpanded = signal<boolean>(true);

  filtroTexto = input.required<string>();
  filtroEstado = input.required<string>();
  filtroPlataforma = input.required<string>();
  vistaActual = input.required<'cuadricula' | 'tablero'>();
  totalMostrados = input<number>(0);
  refreshTrigger = input<number>(0);

  textoCambiado = output<string>();
  estadoCambiado = output<string>();
  plataformaCambiada = output<string>();
  vistaCambiada = output<'cuadricula' | 'tablero'>();

  platformSummaryText = computed(() => {
    const plat = this.filtroPlataforma();
    if (plat === 'todas' || !plat) return '';
    const arr = plat.split(',').filter(x => x);
    return arr.length === 1 ? arr[0] : `${arr.length} plat.`;
  });

  // 🚀 1. Empezamos solo con la opción "Todas"
  opcionesPlataforma: any[] = [
    { id: 'todas', nombre: 'Todas', tipo: 'icon', valor: 'bi-grid-fill', color: '' }
  ];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('filtersPanelExpanded');
      if (stored !== null) {
        this.isExpanded.set(stored === 'true');
      } else if (window.innerWidth <= 768) {
        this.isExpanded.set(false);
      }
    }
  }

  constructor() {
    // 🚀 MAGIA DE ANGULAR 18: Se ejecuta solo cada vez que refreshTrigger cambia
    effect(() => {
      if (this.refreshTrigger()) {
        this.cargarPlataformasDesdeBBDD();
      }
    });
  }

  // 🚀 Ahora es un método público que el padre puede invocar
  public cargarPlataformasDesdeBBDD() {
    this.gameService.getUserPlatforms().subscribe({
      next: (platformsFromDB) => {
        const mappedPlatforms = platformsFromDB.map(p => this.mapearPlataforma(p));
        this.opcionesPlataforma = [
          { id: 'todas', nombre: 'Todas', tipo: 'icon', valor: 'bi-grid-fill', color: '' },
          ...mappedPlatforms
        ];
      },
      error: (err) => console.error('Error cargando plataformas', err)
    });
  }

  // 🎨 Diccionario visual: Asigna colores y nombres cortos según lo que venga de la BBDD
  private mapearPlataforma(dbPlatform: any) {
    const name = dbPlatform.name.toLowerCase();
    let visualData = { nombre: dbPlatform.name, tipo: 'dot', valor: '', color: '#9ca3af' }; // Default gris

    if (name.includes('pc') || name.includes('windows') || name.includes('mac')) {
      visualData = { nombre: 'PC', tipo: 'dot', valor: '', color: '#d4d4d8' };
    } else if (name.includes('playstation') || name.includes('ps4') || name.includes('ps5')) {
      visualData = { nombre: 'PlayStation', tipo: 'dot', valor: '', color: '#006FCD' };
    } else if (name.includes('xbox')) {
      visualData = { nombre: 'Xbox', tipo: 'dot', valor: '', color: '#107C10' };
    } else if (name.includes('switch') || name.includes('nintendo')) {
      visualData = { nombre: 'Nintendo', tipo: 'dot', valor: '', color: '#E60012' };
    } else if (name.includes('android') || name.includes('ios') || name.includes('mobile')) {
      visualData = { nombre: 'Móvil', tipo: 'dot', valor: '', color: '#F59E0B' };
    }

    return {
      id: String(dbPlatform.id), // Importante: el ID real de la BBDD
      ...visualData
    };
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