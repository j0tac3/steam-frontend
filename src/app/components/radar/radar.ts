import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// ⚠️ IMPORTANTE: Ajusta estas rutas a donde tengas tu servicio e interfaz
import { SteamService } from '../../services/steam'; 
import { SteamDeal } from '../../models/deal';

@Component({
  selector: 'app-radar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './radar.html',
  styleUrl: './radar.scss'
})
export class RadarComponent implements OnInit {
  private gameService = inject(SteamService);
  
  // Señales reactivas tipadas con nuestra nueva interfaz
  ofertas = signal<SteamDeal[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.buscarChollos();
  }

  buscarChollos() {
    this.cargando.set(true);
    
    this.gameService.getRadarOfertas().subscribe({
      next: (datos: any) => {
        // 🛡️ COMPROBACIÓN DE SEGURIDAD
        // Verificamos si lo que llega es realmente una lista (Array)
        if (Array.isArray(datos)) {
          this.ofertas.set(datos);
          this.error.set(null);
        } else {
          // Si Laravel nos manda el objeto de error {error: '...'}, lo capturamos aquí
          this.error.set(datos.error || 'El radar está recalibrándose.');
          this.ofertas.set([]); // IMPORTANTE: Vaciamos la lista para que el @for no explote
        }
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error crítico en el radar:', err);
        this.error.set('No hemos podido conectar con el servidor de ofertas.');
        this.ofertas.set([]); // Seguridad ante todo
        this.cargando.set(false);
      }
    });
  }

  // Convertimos el string "85.0000" en un simple "85" para el HTML
  formatearDescuento(savings: string): string {
    return Math.round(parseFloat(savings)).toString();
  }

  // Llevamos al usuario directamente a la tienda de Steam de forma segura
  irAOferta(steamAppID: string) {
    window.open(`https://store.steampowered.com/app/${steamAppID}`, '_blank');
  }
}