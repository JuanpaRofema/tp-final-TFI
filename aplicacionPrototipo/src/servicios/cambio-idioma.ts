import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as turf from '@turf/turf';
import { DATOS_PAISES } from '../assets/custom.geo';
import { Geolocation } from '@capacitor/geolocation';
import { App } from '@capacitor/app';

@Injectable({
  providedIn: 'root',
})
export class CambioIdioma {
  private mensajeSource = new BehaviorSubject<any>(['es', false]);
  idiomaActual$ = this.mensajeSource.asObservable();
  lecturaAutomatica = true
  ultimaCordenada = [-34.6037, -58.3816]
  enCelular = true

  private appActiva = true;
  public tienePermisos = false;


  constructor() {
    console.log("Servicio iniciado");
    this.detectarYConfigurar();
    this.configurarListenerEstadoApp();
  }

  private configurarListenerEstadoApp() {
    App.addListener('appStateChange', async ({ isActive }) => {
      this.appActiva = isActive;
      if (isActive) {
        await this.evaluarPermisosActuales();
      }
    });
  }

  async detectarYConfigurar() {
    // 1. EVALUACIÓN INICIAL DE PERMISOS
    this.tienePermisos = await this.evaluarPermisosActuales();

    // Si no los tiene al inicio, intentamos pedirlos una vez
    if (!this.tienePermisos) {
      this.tienePermisos = await this.solicitarPermisosNuevamente();
    }

    // 2. INTERVALO DE 1 SEGUNDO (Con triple peaje)
    setInterval(async () => {
      console.log("NOS METIMOS AL SET INTERVAL")
      // <--- MODIFICADO: Ahora chequeamos tienePermisos antes de disparar el GPS
      if (this.lecturaAutomatica && this.appActiva && this.tienePermisos) {
        try {
          let lat: number;
          let lon: number;

          if (this.enCelular) {
            const pos = await Geolocation.getCurrentPosition({
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 10000
            });
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
          } else {
            const posWeb: any = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            lat = posWeb.coords.latitude;
            lon = posWeb.coords.longitude;
          }

          let idiomaNuevo = this.procesarUbicacion(lat, lon);
          this.mensajeSource.next(idiomaNuevo);
          console.log("el idioma nuevo es " + idiomaNuevo)

        } catch (error) {
          console.warn("Bucle: Error de lectura. Posible GPS apagado.");
          console.error("Error detallado:", error);
          console.log("estamos en celular " + this.enCelular)
        }
      }
    }, 1500);
  }

  // --- MÉTODOS DE PERMISOS (Actualizan la flag tienePermisos) ---

  async evaluarPermisosActuales(): Promise<boolean> {
    try {
      const check = await Geolocation.checkPermissions();
      const granted = check.location === 'granted';
      this.tienePermisos = granted; // Sincronizamos la flag
      return granted;
    } catch (e) {
      // Caso PC / Navegador
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        const granted = result.state === 'granted';
        this.tienePermisos = granted;
        return granted;
      }
      return false;
    }
  }

  async solicitarPermisosNuevamente(): Promise<boolean> {
    let concedido = false;
    try {
      const status = await Geolocation.requestPermissions();
      concedido = status.location === "granted";
      this.enCelular = true;
    } catch (error) {
      // Intento PC
      if (navigator.geolocation) {
        concedido = await new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 5000 }
          );
        });
        this.enCelular = false;
      }
    }

    this.tienePermisos = concedido; // <--- IMPORTANTE: Actualizamos la flag para activar el bucle
    return concedido;
  }

  // --- TU LÓGICA DE PROCESAMIENTO (SIN CAMBIOS) ---
  verificarSiPuntoEstaEnPais(puntoLon: any, puntoLat: any) {
    const puntoBusqueda = turf.point([puntoLon, puntoLat]);
    let paisEncontrado = ""
    for (let pais of (DATOS_PAISES as any).features) {
      const estaAdentro = turf.booleanPointInPolygon(puntoBusqueda, pais as any);
      if (estaAdentro) {
        paisEncontrado = pais.properties.iso_a2 === "-99" ? pais.properties.iso_a2_eh : pais.properties.iso_a2;
        return paisEncontrado;
      }
    }
    return paisEncontrado;
  }

  procesarUbicacion(lat: number, lon: number) {

    let paisEncontrado = this.verificarSiPuntoEstaEnPais(lon, lat);

// 21 Países: Hispanos de América, España y Guinea Ecuatorial
const paisesES = [
  'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'ES', 'GQ', 
  'GT', 'HN', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE'
];

// 9 Países/Territorios: Portugal, Brasil, Angola, Mozambique, etc.
const paisesPT = [
  'PT', 'BR', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL', 'MO'
];

// 5 Países: Alemania, Austria, Suiza, Liechtenstein y Luxemburgo
const paisesDE = [
  'DE', 'AT', 'CH', 'LI', 'LU'
];

// 24 Países: Francia, Bélgica y naciones de la Francofonía (África/América)
const paisesFR = [
  'FR', 'BE', 'MC', 'SN', 'GN', 'CI', 'BF', 'NE', 'TD', 'ML', 
  'CG', 'CD', 'BI', 'RW', 'DJ', 'KM', 'MG', 'GA', 'CF', 'TG', 
  'BJ', 'HT', 'VU', 'CM'
];

// 11 Países: Rusia y esfera de influencia ex-soviética
const paisesRU = [
  'RU', 'BY', 'KZ', 'KG', 'TJ', 'UZ', 'TM', 'AM', 'AZ', 'GE', 'MD'
];

// 19 Países: EE.UU., Reino Unido, Canadá, Oceanía y Anglósfera
const paisesEN = [
  'US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'ZA', 'JM', 'BS', 'TT', 
  'BB', 'SG', 'PH', 'IN', 'NG', 'GH', 'KE', 'UG', 'ZW'
];

    // 3. Verificamos con IF/ELSE IF (la forma "normal")
    if (paisesPT.includes(paisEncontrado)) {
      return ['pt', true];
    }
    else if (paisesEN.includes(paisEncontrado)) {
      return ['en', true];
    }
    else if (paisesDE.includes(paisEncontrado)) {
      return ['de', true];
    }
    else if (paisesFR.includes(paisEncontrado)) {
      return ['fr', true];
    }
    else if (paisesRU.includes(paisEncontrado)) {
      return ['ru', true];
    }
    else if (paisesES.includes(paisEncontrado)) {
      return ['es', true];
    }

    return ['es', false];
  }

  cambiarIdiomaManual(coordenadas: any) {
    this.lecturaAutomatica = false
    let idiomaNuevo = this.procesarUbicacion(coordenadas[0], coordenadas[1])
    this.mensajeSource.next(idiomaNuevo);
  }

  cambiarIdiomaAutomatico() {
    this.lecturaAutomatica = true
  }
}