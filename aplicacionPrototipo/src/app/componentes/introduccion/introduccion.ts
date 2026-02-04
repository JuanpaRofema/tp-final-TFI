import { Component, inject, signal, OnInit, AfterViewInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CambioIdioma } from '../../../servicios/cambio-idioma';
import { DICCIONARIO } from '../../traducciones/diccionario';
import * as L from 'leaflet';
import { RouterLink, RouterOutlet } from "@angular/router";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-introduccion',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './introduccion.html',
  styleUrl: './introduccion.css',
})
export class Introduccion implements OnInit {
  idioma = new FormControl('');
  idioma_actual = signal('es');
  ultimaUbicacionAceptada: any
  diccionario = DICCIONARIO;
  servicio = inject(CambioIdioma);
  coordenadas = [-34.6037, -58.3816]

  ngOnInit() {
    this.servicio.idiomaActual$.subscribe(data => {
      console.log("Idioma desde el servicio:", data);
      this.idioma_actual.set(data[0]);
      this.ultimaUbicacionAceptada = data[1]
    });
  }

  modificarIdioma() {
    this.servicio.cambiarIdiomaManual(this.coordenadas)
  }

  async HabilitarGeolocalizador() {
    if (this.servicio.tienePermisos) {
      this.servicio.cambiarIdiomaAutomatico()
    }
    else {
      Swal.fire({
        title: this.diccionario[this.idioma_actual()]["geo_error_titulo"],
        text: this.diccionario[this.idioma_actual()]["geo_error_desc"],
        icon: 'warning',
        confirmButtonText: this.diccionario[this.idioma_actual()]["OK"],
        confirmButtonColor: '#3085d6'
      });
    }
  }

  abrirMapaEnModal() {
    Swal.fire({
      title: '' + this.diccionario[this.idioma_actual()]["seleccionar"],
      html: '<div id="map-modal" style="height: 400px; width: 100%;"></div>',
      width: '800px',
      showConfirmButton: true,
      confirmButtonText: '' + this.diccionario[this.idioma_actual()]["confirmar"],

      didOpen: () => {
        console.log("El modal se abrió, inicializando mapa...");

        // CONFIGURACIÓN DE ICONO (Traído de internet para evitar 404)
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

        // Variable para controlar el marcador único
        let marcadorSeleccionado: L.Marker | null = null;

        mapModal.on('click', (e: any) => {
          const { lat, lng } = e.latlng;

          // Lógica de marcador: si existe lo mueve, si no lo crea (sin Popups)
          if (marcadorSeleccionado) {
            marcadorSeleccionado.setLatLng([lat, lng]);
          } else {
            marcadorSeleccionado = L.marker([lat, lng], { icon: iconoDefault }).addTo(mapModal);
          }

          this.coordenadas = [lat, lng];
          console.log("Coordenadas capturadas en modal:", this.coordenadas);
        });

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