import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, inject, ViewChild, ElementRef, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Importante para *ngIf
import Swal from 'sweetalert2';
import { DatabaseService } from 'src/app/services/database.service';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faSearch, faMapMarkerAlt, faLocationArrow } from '@fortawesome/free-solid-svg-icons';
import * as L from 'leaflet';
import { CambioIdioma } from 'src/app/services/cambio-idioma';
import { DICCIONARIO } from 'src/assets/diccionario';


delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/marker-icon-2x.png',
  iconUrl: 'assets/marker-icon.png',
  shadowUrl: 'assets/marker-shadow.png',
});

@Component({
  selector: 'app-map-direccion-pedido',
  templateUrl: './map-direccion-pedido.component.html',
  styleUrls: ['./map-direccion-pedido.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MapDireccionPedidoComponent implements AfterViewInit {
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)
  faArrowLeft = faArrowLeft;
  faSearch = faSearch;
  faMapMarkerAlt = faMapMarkerAlt;
  faLocationArrow = faLocationArrow;

  db = inject(DatabaseService);
  router = inject(Router);

  map!: L.Map;
  marker!: L.Marker;

  coordenadaSeleccionada: { lat: number; lng: number } | null = null;
  direccion: string = '';
  buscando: boolean = false;

  ngAfterViewInit() {
    this.initMap();
  }
  ngOnInit(){
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
  }

  initMap() {
    const centro = L.latLng(-34.6037, -58.3816);

    this.map = L.map('map', {
      center: centro,
      zoom: 13,
      zoomControl: false
    });


    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap, © CartoDB',
      maxZoom: 19
    }).addTo(this.map);



    this.map.on('click', async (e: L.LeafletMouseEvent) => {

      this.marcarUbicacion(e.latlng);


      this.direccion = "Buscando nombre de la calle...";


      await this.obtenerDireccion(e.latlng.lat, e.latlng.lng);
    });


    setTimeout(() => { this.map.invalidateSize(); }, 500);
  }

  marcarUbicacion(latLng: L.LatLng) {
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    this.marker = L.marker(latLng).addTo(this.map);


    this.map.flyTo(latLng, 16, { duration: 1.5 });

    this.coordenadaSeleccionada = {
      lat: latLng.lat,
      lng: latLng.lng
    };
  }

  async buscarDireccion() {
    if (!this.direccion.trim()) return;

    this.buscando = true;

    try {
      const response = await fetch(
        `https://servidor-local.onrender.com/buscar?q=${encodeURIComponent(this.direccion)}`
      );

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latLng = L.latLng(parseFloat(lat), parseFloat(lon));

        this.marcarUbicacion(latLng);



      } else {
        this.mostrarError('Dirección no encontrada');
      }

    } catch (error) {
      console.error('Error:', error);
      this.mostrarError('Error de conexión');
    } finally {
      this.buscando = false;
    }
  }

  confirmarUbicacion() {
    if (!this.coordenadaSeleccionada) return;

    this.db.latitud = this.coordenadaSeleccionada.lat;
    this.db.longitud = this.coordenadaSeleccionada.lng;

    this.db.direccion = this.direccion || 'Ubicación Mapa';

    Swal.fire({
      title: this.diccionario[this.idioma()]['UbicaciónGuardada'],
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      background: '#333',
      color: '#fff'
    });

    this.router.navigate(['/delivery']);
  }

  volver() {
    this.router.navigate(['/delivery']);
  }

  mostrarError(msg: string) {
    Swal.fire({
      text: msg,
      icon: 'error',
      toast: true,
      position: 'top',
      background: '#d84f45',
      color: '#fff',
      showConfirmButton: false,
      timer: 2000
    });
  }

  async obtenerDireccion(lat: number, lng: number) {
    try {
      const response = await fetch(
        `https://servidor-local.onrender.com/reverse?lat=${lat}&lon=${lng}`
      );

      const data = await response.json();
      console.log("Datos recibidos:", data);

      if (data && data.display_name) {
        const calle = data.address.road || '';
        const altura = data.address.house_number || '';
        const barrio = data.address.neighbourhood || data.address.suburb || '';

        if (calle) {
          this.direccion = `${calle} ${altura}${barrio ? ', ' + barrio : ''}`;
        } else {
          this.direccion = data.display_name.split(',').slice(0, 3).join(',');
        }
      } else {
        this.direccion = "Ubicación sin nombre exacto";
      }

    } catch (error) {
      console.error('Error obteniendo dirección:', error);
      this.direccion = "Error de conexión con el servidor";
    }
  }
}