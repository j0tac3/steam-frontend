import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-radar',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './radar.html',
  styleUrl: './radar.scss'
})
export class RadarComponent implements OnInit {
  private http = inject(HttpClient);
  
  // Señales reactivas para la interfaz
  juegosGratis = signal<any[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.buscarChollos();
  }

  buscarChollos() {
    this.cargando.set(true);
    
    // 1. Preparamos la URL original y la codificamos para que sea segura
    const targetUrl = encodeURIComponent('https://www.gamerpower.com/api/giveaways?platform=steam&type=game');
    
    // 2. Usamos el Proxy público para saltarnos el bloqueo de CORS
    const proxyUrl = `https://api.allorigins.win/raw?url=${targetUrl}`;

    this.http.get<any[]>(proxyUrl)
      .subscribe({
        next: (datos) => {
          this.juegosGratis.set(datos);
          this.cargando.set(false);
          this.error.set(null); // Limpiamos el error si funciona
        },
        error: (err) => {
          console.error('Error al buscar juegos:', err);
          this.error.set('No hemos podido conectar con el radar de ofertas.');
          this.cargando.set(false);
        }
      });
  }

  // Función para abrir la oferta en una pestaña nueva
  irAOferta(url: string) {
    window.open(url, '_blank');
  }
}