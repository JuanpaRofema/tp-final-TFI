import { Component, inject, signal, OnInit } from '@angular/core';
import { CambioIdioma } from '../../../servicios/cambio-idioma';
import { DICCIONARIO } from '../../traducciones/diccionario';
import * as L from 'leaflet';
import { RouterLink } from "@angular/router";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements OnInit {
  idioma_actual = signal('es');
  ultimaUbicacionAceptada: any;
  diccionario = DICCIONARIO;
  servicio = inject(CambioIdioma);
  coordenadas = [-34.6037, -58.3816];

  ngOnInit() {
    this.servicio.idiomaActual$.subscribe(data => {
      console.log("Productos - Idioma desde el servicio:", data);
      this.idioma_actual.set(data[0]);
      this.ultimaUbicacionAceptada = data[1];
    });
  }

  modificarIdioma() {
    this.servicio.cambiarIdiomaManual(this.coordenadas);
  }

  HabilitarGeolocalizador() {
    this.servicio.cambiarIdiomaAutomatico();
  }

  async abrirMapaEnModal() {
    Swal.fire({
      title: '' + this.diccionario[this.idioma_actual()]["seleccionar"],
      html: '<div id="map-modal" style="height: 400px; width: 100%;"></div>',
      width: '800px',
      showConfirmButton: true,
      confirmButtonText: '' + this.diccionario[this.idioma_actual()]["confirmar"],

      didOpen: () => {
        console.log("El modal de Productos se abrió, inicializando mapa...");

        // FIX: Definimos el ícono trayéndolo de internet para evitar el error 404
        const iconoDefault = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          shadowSize: [41, 41]
        });

        const mapModal = L.map('map-modal').setView([10, -58], 3);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(mapModal);

        let marcadorSeleccionado: L.Marker | null = null;

        mapModal.on('click', (e: any) => {
          const { lat, lng } = e.latlng;

          // Si ya existe un marcador, lo movemos. Si no, lo creamos con el icono de internet.
          if (marcadorSeleccionado) {
            marcadorSeleccionado.setLatLng([lat, lng]);
          } else {
            marcadorSeleccionado = L.marker([lat, lng], { icon: iconoDefault }).addTo(mapModal);
          }

          this.coordenadas = [lat, lng];
          console.log("Coordenadas capturadas en Productos:", this.coordenadas);
        });

        // Forzamos el redibujado para que no se vea cortado el mapa
        setTimeout(() => {
          mapModal.invalidateSize();
        }, 100);
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.modificarIdioma();

        if (this.ultimaUbicacionAceptada) {
          Swal.fire({
            title: this.diccionario[this.idioma_actual()]["exito_titulo"],
            text: this.diccionario[this.idioma_actual()]["exito_desc"] + ", " + this.diccionario[this.idioma_actual()]["cambio"] + " " + this.diccionario[this.idioma_actual()]["nombre_idioma"],
            icon: 'success',
            confirmButtonText: this.diccionario[this.idioma_actual()]["OK"]
          });
        }
        else {
          Swal.fire({
            title: this.diccionario[this.idioma_actual()]["error_titulo"],
            text: this.diccionario[this.idioma_actual()]["error_desc"],
            icon: 'error',
            confirmButtonText: this.diccionario[this.idioma_actual()]["OK"]
          });
        }
      }
    });
  }
}