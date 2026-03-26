import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as turf from '@turf/turf';
import { DATOS_PAISES } from '../../assets/geoJsonPaises';
import { Geolocation } from '@capacitor/geolocation';
import { App } from '@capacitor/app';

@Injectable({
  providedIn: 'root',
})
export class CambioIdioma {
  public mensajeSource = new BehaviorSubject<any>(['es', true]);
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
    setInterval(() => {
  console.clear();
  console.log("--- Consola limpia (Mantenimiento automático) ---");
}, 1000000000); // 30.000 ms = 30 segundos
    // 2. INTERVALO DE 1 SEGUNDO (Con triple peaje)
    setInterval(async () => {
      //console.log("NOS METIMOS AL SET INTERVAL")
      // <--- MODIFICADO: Ahora chequeamos tienePermisos antes de disparar el GPS
      if (this.lecturaAutomatica && this.appActiva && this.tienePermisos) {
        try {
          let lat: number;
          let lon: number;

          if (this.enCelular) {
            try {
              const pos = await Geolocation.getCurrentPosition({
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 10000
            });
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
            } catch (error) {
              lat = -34.83
              lon = -58
            }
            
          } else {
            const posWeb: any = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            lat = posWeb.coords.latitude;
            lon = posWeb.coords.longitude;
          }
         // console.log(lat, lon)
          let idiomaNuevo = this.procesarUbicacion(lat, lon);
          if(this.lecturaAutomatica) {
            this.mensajeSource.next(idiomaNuevo);
          }
          
         // console.log("el idioma nuevo es " + idiomaNuevo)

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

    const paisesES = ['AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'ES', 'GQ', 'GT', 'HN', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE'];
    const paisesEN = ['AU', 'BS', 'BB', 'BZ', 'CA', 'GB', 'GH', 'GY', 'IE', 'JM', 'KE', 'LR', 'NG', 'NZ', 'PH', 'SG', 'TT', 'US', 'ZA'];
    const paisesPT = ['AO', 'BR', 'CV', 'GW', 'MO', 'MZ', 'PT', 'ST', 'TL'];
    const paisesDE = ['AT', 'CH', 'DE', 'LI', 'LU'];
    const paisesFR = ['BE', 'CD', 'CF', 'CG', 'CI', 'CM', 'FR', 'GA', 'GN', 'HT', 'MC', 'MG', 'ML', 'NE', 'SN', 'TD', 'TG', 'VU'];
    const paisesRU = ['BY', 'KG', 'KZ', 'RU', 'TJ', 'UZ'];

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
    
    // --- INICIO DEL PARCHE DE NORMALIZACIÓN ---
    // 1. Longitud (coordenadas[1]): Da la vuelta al mundo (360)
    while (coordenadas[1] > 180 || coordenadas[1] < -180) {
      if (coordenadas[1] > 180) {
        coordenadas[1] = coordenadas[1] - 360;
      }
      if (coordenadas[1] < -180) {
        coordenadas[1] = coordenadas[1] + 360;
      }
    }

    // 2. Latitud (coordenadas[0]): Se frena en los polos (90)
    if (coordenadas[0] > 90) {
      coordenadas[0] = 90;
    }
    if (coordenadas[0] < -90) {
      coordenadas[0] = -90;
    }
    // --- FIN DEL PARCHE ---

    let idiomaNuevo = this.procesarUbicacion(coordenadas[0], coordenadas[1])
    this.mensajeSource.next(idiomaNuevo);
    //console.log("el idioma nuevo es: " + idiomaNuevo)
    return idiomaNuevo
  }

  cambiarIdiomaAutomatico() {
    this.lecturaAutomatica = true
  }
  modificarLasPush(push: any) {
  try {
    let idioma = this.mensajeSource.value[0]; 
    console.log("aca el servicio en la funcion modficar las push, los datos de la push a la entrada son:")
    console.log("en el titulo tenemos:",push.titulo,"en el cuerpo tenemos:",push.cuerpo)
    if (idioma == 'es') {
      // --- Lógica para ESPAÑOL (normalizada) ---
      console.log("NOS METIMOS A ESPAÑOL, LOS DATOS DE LAS PUCH SON ESTOS:", push.titulo,"EN EL CUERPO ESTA:", push.cuerpo)

  if (push.titulo.toLowerCase() === 'nuevas bebidas') {
    let match = push.cuerpo.match(/\d+/);
    let numero = match ? match[0] : "?";
    return ['Nuevas Bebidas', `Mesa ${numero} está esperando bebidas.`];
  }

  if (push.titulo == 'Nuevo Empleado') {
    let palabra = push.cuerpo.match(/Se registró un (.*)/);
    palabra[1] = palabra[1].toLowerCase();
    if (palabra[1] == "cocinero.") return ["Nuevo Empleado", "Se registró un cocinero."];
    else if (palabra[1] == "maitre.") return ["Nuevo Empleado", "Se registró un maître."];
    else if (palabra[1] == "mesero.") return ["Nuevo Empleado", "Se registró un mesero."];
  }

  if (push.titulo == "Nuevo cliente") return ["Nuevo Cliente", "Se registró un nuevo cliente."];

  if (push.titulo == "Bar Finalizado") {
    let mesa = push.cuerpo.match(/Mesa (\d+): Bebidas listas\./);
    return ["Bar Finalizado", `Mesa ${mesa[1]}: Bebidas listas.`];
  }

  if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("barra y cocina")) {
    let persona = push.cuerpo.match(/El pedido de (.*) está listo en barra y cocina\./);
    return ["Pedido Listo", `El pedido de ${persona[1]} está listo en barra y cocina.`];
  }

  if (push.titulo == 'Pedido Listo para Entregar' && !push.cuerpo.includes("barra y cocina")) {
    let persona = push.cuerpo.match(/El pedido de (.*) está listo\./);
    return ["Pedido Listo", `El pedido de ${persona[1]} está listo.`];
  }

  if (push.titulo == 'Nuevo mensaje' && !push.cuerpo.includes("Mesero")) {
    let numero = push.cuerpo.match(/Cliente consultó en la mesa (.*)/);
    return ["Nuevo Mensaje", `Cliente consultó en la mesa ${numero[1]}`];
  }

  if (push.titulo == 'Nuevo mensaje' && push.cuerpo.includes("Mesero")) {
    let numero = push.cuerpo.match(/Mesero respondió en mesa (.*)/);
    return ["Nuevo Mensaje", `Mesero respondió en mesa ${numero[1]}.`];
  }

  if (push.titulo == 'Mensaje del Cliente') return ["Mensaje del Cliente", push.cuerpo];

  if (push.titulo == 'Mensaje del Repartidor') return ["Mensaje del Repartidor", push.cuerpo];

  if (push.titulo == 'Cuenta solicitada' && push.cuerpo.includes("La mesa")) {
    let variable = push.cuerpo.match(/La mesa (.*) solicitó la cuenta/);
    return ['Cuenta Solicitada', `La mesa ${variable[1]} solicitó la cuenta.`];
  }

  if (push.titulo == 'Cuenta solicitada' && push.cuerpo.includes("El cliente")) {
    let variable = push.cuerpo.match(/El cliente (.*) solicitó la cuenta/);
    return ['Cuenta Solicitada', `El cliente ${variable[1]} solicitó la cuenta.`];
  }

  if (push.titulo == 'Cocina finalizado') return ["Cocina Finalizada", "Comidas listas para ser servidas."];

  if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("cocina y barra")) {
    let persona = push.cuerpo.match(/El pedido de (.*) está listo en cocina y barra\./);
    return ['Pedido Listo', `El pedido de ${persona[1]} está listo en cocina y barra.`];
  }

  if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("está listo.")) {
    let persona = push.cuerpo.match(/El pedido de (.*) está listo\./);
    return ['Pedido Listo', `El pedido de ${persona[1]} está listo.`];
  }

  if (push.titulo == '¡Pedido Listo!') {
    let persona = push.cuerpo.match(/Tienes un pedido nuevo para retirar y entregar a (.*)\./);
    return ['¡Pedido Listo!', `Tienes un pedido nuevo para retirar y entregar a ${persona[1]}.`];
  }

  if (push.titulo == 'Cuenta Confirmada') {
    if (push.cuerpo.includes("delivery")) return ['Pago Confirmado', 'El delivery fue pagado y completado.'];
    let mesa = push.cuerpo.match(/La mesa (.*) cerró la cuenta\./);
    return ['Cuenta Confirmada', `La mesa ${mesa[1]} cerró la cuenta.`];
  }

  if (push.titulo == 'Factura Disponible') return ['Factura Disponible', 'Descarga tu factura aquí.'];

  if (push.titulo == 'Pedido Rechazado') {
    let motivo = push.cuerpo.match(/Motivo: (.*)\. Por favor modifique su pedido\./);
    return ['Pedido Rechazado', `Motivo: ${motivo[1]}. Por favor modifique su pedido.`];
  }

  if (push.titulo == 'Cliente espera mesa') {
    let cliente = push.cuerpo.match(/Asigne una mesa al cliente (.*)/);
    return ['Cliente Esperando Mesa', `Asigne una mesa al cliente ${cliente[1]}.`];
  }

  if (push.titulo == 'Mesa asignada') {
    let mesa = push.cuerpo.match(/Se le asigno la mesa (.*)/);
    return ['Mesa Asignada', `Se le asignó la mesa ${mesa[1]}.`];
  }

  if (push.titulo == '¡Pedido en Camino!') {
    let repartidor = push.cuerpo.match(/(.*) está llevando tu pedido\./);
    return ['¡Pedido en Camino!', `${repartidor[1]} está llevando tu pedido.`];
  }

  if (push.titulo == 'Nuevo pedido') {
    let numero = push.cuerpo.match(/Cliente realizó un pedido en la mesa (.*)/);
    return ['Nuevo Pedido', `Cliente realizó un pedido en la mesa ${numero[1]}.`];
  }

  if (push.titulo.toLowerCase() === 'nuevo pedido' && push.cuerpo.includes('espera comida')) {
    let match = push.cuerpo.match(/\d+/);
    let numero = match ? match[0] : "?";
    return ['Nuevo Pedido', `Mesa ${numero} está esperando comida.`];
  }

  if (push.titulo == '¡Pedido Entregado!') return ['¡Pedido Entregado!', 'Gracias por elegirnos. ¡Buen provecho!'];

  if (push.titulo == 'Pago Recibido') {
    let variable = push.cuerpo.match(/Cliente (.*) abonó \$(.*)/);
    return ['Pago Recibido', `Cliente ${variable[1]} abonó $${variable[2]}.`];
  }

  if (push.titulo == 'Cuenta confirmada') {
    let variable = push.cuerpo.match(/(.*) pidió una reserva para el (.*)/);
    return ['Reserva Confirmada', `${variable[1]} pidió una reserva para el ${variable[2]}.`];
  }
    } 

    else if (idioma === 'en') {
      if (push.titulo.toLowerCase() === 'nuevas bebidas') {
  let match = push.cuerpo.match(/\d+/);
  let numero = match ? match[0] : "?";
  return ['New Drinks', `Table ${numero} is waiting for drinks.`];
}
      if (push.titulo == 'Nuevo Empleado') {
        let palabra = push.cuerpo.match(/Se registró un (.*)/);
        palabra[1] = palabra[1].toLowerCase();
        if (palabra[1] == "cocinero.") return ["New Employee", "A cook was registered."];
        else if (palabra[1] == "maitre.") return ["New Employee", "A maître d' was registered."];
        else if (palabra[1] == "mesero.") return ["New Employee", "A waiter was registered."];
      }
      if (push.titulo == "Nuevo cliente") return ["New Customer", "A new customer was registered"];
      if (push.titulo == "Bar Finalizado") {
        let mesa = push.cuerpo.match(/Mesa (\d+): Bebidas listas\./);
        return ["Bar Order Ready", `Table ${mesa[1]}: Drinks ready.`];
      }
      if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("barra y cocina")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo en barra y cocina\./);
        return ["Order Ready", `The order for ${persona[1]} is ready at the bar and kitchen.`];
      }
      if (push.titulo == 'Pedido Listo para Entregar' && !push.cuerpo.includes("barra y cocina")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo\./);
        return ["Order Ready", `The order for ${persona[1]} is ready.`];
      }
      if (push.titulo == 'Nuevo mensaje' && !push.cuerpo.includes("Mesero")) {
        let numero = push.cuerpo.match(/Cliente consultó en la mesa (.*)/);
        return ["New Message", `Customer asked at table ${numero[1]}`];
      }
      if (push.titulo == 'Nuevo mensaje' && push.cuerpo.includes("Mesero")) {
        let numero = push.cuerpo.match(/Mesero respondió en mesa (.*)/);
        return ["New Message", `Waiter replied at table ${numero[1]}.`];
      }
      if (push.titulo == 'Mensaje del Cliente') return ["Client's new message", push.cuerpo];
      if (push.titulo == 'Mensaje del Repartidor') return ['Message from the Delivery Driver', push.cuerpo];
      if (push.titulo == 'Cuenta solicitada' && push.cuerpo.includes("La mesa")) {
        let variable = push.cuerpo.match(/La mesa (.*) solicitó la cuenta/);
        return ['Bill Requested', `The table ${variable[1]} requested the bill.`];
      }
      if (push.titulo == 'Cuenta solicitada' && push.cuerpo.includes("El cliente")) {
        let variable = push.cuerpo.match(/El cliente (.*) solicitó la cuenta/);
        return ['Bill Requested', `Customer ${variable[1]} requested the bill.`];
      }
      if (push.titulo == 'Cocina finalizado') return ["Kitchen Finished", "Meals ready to be served."];
      if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("cocina y barra")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo en cocina y barra\./);
        return ['Order Ready', `The order for ${persona[1]} is ready at the kitchen and bar.`];
      }
      if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("está listo.")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo\./);
        return ['Order Ready', `The order for ${persona[1]} is ready.`];
      }
      if (push.titulo == '¡Pedido Listo!') {
        let persona = push.cuerpo.match(/Tienes un pedido nuevo para retirar y entregar a (.*)\./);
        return ['Order Ready!', `You have a new order to pick up and deliver to ${persona[1]}.`];
      }
      if (push.titulo == 'Cuenta Confirmada') {
        if (push.cuerpo.includes("delivery")) return ['Payment Confirmed', 'The delivery has been paid and completed.'];
        let mesa = push.cuerpo.match(/La mesa (.*) cerró la cuenta\./);
        return ['Bill Confirmed', `Table ${mesa[1]} closed the bill.`];
      }
      if (push.titulo == 'Factura Disponible') return ['Invoice Available', 'Download your invoice here.'];
      if (push.titulo == 'Pedido Rechazado') {
        let motivo = push.cuerpo.match(/Motivo: (.*)\. Por favor modifique su pedido\./);
        return ['Order Rejected', `Reason: ${motivo[1]}. Please modify your order.`];
      }
      if (push.titulo == 'Cliente espera mesa') {
        let cliente = push.cuerpo.match(/Asigne una mesa al cliente (.*)/);
        return ['Customer Waiting for Table', `Assign a table to customer ${cliente[1]}.`];
      }
      if (push.titulo == 'Mesa asignada') {
        let mesa = push.cuerpo.match(/Se le asigno la mesa (.*)/);
        return ['Table Assigned', `Table ${mesa[1]} has been assigned to you.`];
      }
      if (push.titulo == '¡Pedido en Camino!') {
        let repartidor = push.cuerpo.match(/(.*) está llevando tu pedido\./);
        return ['Order on the Way!', `${repartidor[1]} is delivering your order.`];
      }
      if (push.titulo == 'Nuevo pedido') {
        let numero = push.cuerpo.match(/Cliente realizó un pedido en la mesa (.*)/);
        return ['New Order', `Customer placed an order at table ${numero[1]}.`];
      }
      if (push.titulo.toLowerCase() === 'nuevo pedido' && push.cuerpo.includes('espera comida')) {
        let match = push.cuerpo.match(/\d+/);
        let numero = match ? match[0] : "?";
        return ['New Order', `Table ${numero} is waiting for food.`];
      }
      if (push.titulo == '¡Pedido Entregado!') return ['Order Delivered!', 'Thank you for choosing us. Enjoy your meal!'];
      if (push.titulo == 'Pago Recibido') {
        let variable = push.cuerpo.match(/Cliente (.*) abonó \$(.*)/);
        return ['Payment Received', `Customer ${variable[1]} paid $${variable[2]}.`];
      }
      if (push.titulo == 'Cuenta confirmada') {
        let variable = push.cuerpo.match(/(.*) pidió una reserva para el (.*)/);
        return ['Reservation Confirmed', `${variable[1]} requested a reservation for ${variable[2]}.`];
      }
    } 

    else if (idioma === 'pt') {
      // --- Lógica para PORTUGUÉS ---
      if (push.titulo == 'Nuevo Empleado') {
        let palabra = push.cuerpo.match(/Se registró un (.*)/);
        palabra[1] = palabra[1].toLowerCase();
        if (palabra[1] == "cocinero.") return ["Novo Funcionário", "Um cozinheiro foi registrado."];
        else if (palabra[1] == "maitre.") return ["Novo Funcionário", "Um maître foi registrado."];
        else if (palabra[1] == "mesero.") return ["Novo Funcionário", "Um garçom foi registrado."];
      }
      if (push.titulo == "Nuevo cliente") return ["Novo Cliente", "Um novo cliente foi registrado"];
      if (push.titulo == "Bar Finalizado") {
        let mesa = push.cuerpo.match(/Mesa (\d+): Bebidas listas\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Bar Finalizado", `Mesa ${mesa[1]}: Bebidas prontas.`];
      }
      if (push.titulo.toLowerCase() === 'nuevas bebidas') {
  let match = push.cuerpo.match(/\d+/);
  let numero = match ? match[0] : "?";
  return ['Novas Bebidas', `A mesa ${numero} aguarda bebidas.`];
}
      if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("barra y cocina")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo en barra y cocina\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Pedido Pronto", `O pedido de ${persona[1]} está pronto no bar e na cozinha.`];
      }
      if (push.titulo == 'Pedido Listo para Entregar' && !push.cuerpo.includes("barra y cocina")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Pedido Pronto", `O pedido de ${persona[1]} está pronto.`];
      }
      if (push.titulo == 'Nuevo mensaje' && !push.cuerpo.includes("Mesero")) {
        let numero = push.cuerpo.match(/Cliente consultó en la mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Nova Mensagem", `O cliente consultou na mesa ${numero[1]}`];
      }
      if (push.titulo == 'Nuevo mensaje' && push.cuerpo.includes("Mesero")) {
        let numero = push.cuerpo.match(/Mesero respondió en mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Nova Mensagem", `O garçom respondeu na mesa ${numero[1]}.`];
      }
      if (push.titulo == 'Mensaje del Cliente') return ["Nova mensagem do cliente", push.cuerpo];
      if (push.titulo == 'Mensaje del Repartidor') return ['Mensagem do Entregador', push.cuerpo];
      if (push.titulo == 'Cuenta solicitada' && push.cuerpo.includes("La mesa")) {
        let variable = push.cuerpo.match(/La mesa (.*) solicitó la cuenta/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Conta Solicitada', `A mesa ${variable[1]} solicitou a conta.`];
      }
      if (push.titulo == 'Cuenta solicitada' && push.cuerpo.includes("El cliente")) {
        let variable = push.cuerpo.match(/El cliente (.*) solicitó la cuenta/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Conta Solicitada', `O cliente ${variable[1]} solicitou a conta.`];
      }
      if (push.titulo == 'Cocina finalizado') return ["Cozinha Finalizada", "Refeições prontas para serem enviadas."];
      if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("cocina y barra")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo en cocina y barra\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Pedido Pronto', `O pedido de ${persona[1]} está pronto na cozinha e no bar.`];
      }
      if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("está listo.")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Pedido Pronto', `O pedido de ${persona[1]} está pronto.`];
      }
      if (push.titulo == '¡Pedido Listo!') {
        let persona = push.cuerpo.match(/Tienes un pedido nuevo para retirar y entregar a (.*)\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Pedido Pronto!', `Você tem um novo pedido para retirar e entregar a ${persona[1]}.`];
      }
      if (push.titulo == 'Cuenta Confirmada') {
        if (push.cuerpo.includes("delivery")) return ['Pagamento Confirmado', 'O delivery foi cobrado e finalizado.'];
        let mesa = push.cuerpo.match(/La mesa (.*) cerró la cuenta\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Conta Confirmada', `A mesa ${mesa[1]} fechou a conta.`];
      }
      if (push.titulo == 'Factura Disponible') return ['Fatura Disponível', 'Baixe sua fatura aqui.'];
      if (push.titulo == 'Pedido Rechazado') {
        let motivo = push.cuerpo.match(/Motivo: (.*)\. Por favor modifique su pedido\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Pedido Rejeitado', `Motivo: ${motivo[1]}. Por favor, modifique seu pedido.`];
      }
      if (push.titulo == 'Cliente espera mesa') {
        let cliente = push.cuerpo.match(/Asigne una mesa al cliente (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Cliente Esperando Mesa', `Atribua uma mesa ao cliente ${cliente[1]}.`];
      }
      if (push.titulo == 'Mesa asignada') {
        let mesa = push.cuerpo.match(/Se le asigno la mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Mesa Atribuída', `A mesa ${mesa[1]} foi atribuída a você.`];
      }
      if (push.titulo == '¡Pedido en Camino!') {
        let repartidor = push.cuerpo.match(/(.*) está llevando tu pedido\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Pedido a Caminho!', `${repartidor[1]} está levando seu pedido.`];
      }
      if (push.titulo == 'Nuevo pedido') {
        let numero = push.cuerpo.match(/Cliente realizó un pedido en la mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Novo Pedido', `O cliente fez um pedido na mesa ${numero[1]}.`];
      }
      if (push.titulo.toLowerCase() === 'nuevo pedido' && push.cuerpo.includes('espera comida')) {
        let match = push.cuerpo.match(/\d+/);
        let numero = match ? match[0] : "?";
        return ['Novo Pedido', `A mesa ${numero} aguarda comida.`];
      }
      if (push.titulo == '¡Pedido Entregado!') return ['Pedido Entregue!', 'Obrigado por nos escolher. Aproveite sua refeição!'];
      if (push.titulo == 'Pago Recibido') {
        let variable = push.cuerpo.match(/Cliente (.*) abonó \$(.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Pagamento Recebido', `O cliente ${variable[1]} pagou $${variable[2]}.`];
      }
      if (push.titulo == 'Cuenta confirmada') {
        let variable = push.cuerpo.match(/(.*) pidió una reserva para el (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Reserva Confirmada', `${variable[1]} solicitou uma reserva para ${variable[2]}.`];
      }
    } 

    else if (idioma === 'ru') {
      // --- Lógica para RUSO ---
      if (push.titulo == 'Nuevo Empleado') {
        let palabra = push.cuerpo.match(/Se registró un (.*)/);
        palabra[1] = palabra[1].toLowerCase();
        if (palabra[1] == "cocinero.") return ["Новый сотрудник", "Был зарегистрирован повар."];
        else if (palabra[1] == "maitre.") return ["Новый сотрудник", "Был зарегистрирован метрдотель."];
        else if (palabra[1] == "mesero.") return ["Новый сотрудник", "Был зарегистрирован официант."];
      }
      if (push.titulo == "Nuevo cliente") return ["Новый клиент", "Был зарегистрирован новый клиент"];
      if (push.titulo == "Bar Finalizado") {
        let mesa = push.cuerpo.match(/Mesa (\d+): Bebidas listas\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Бар завершен", `Стол ${mesa[1]}: Напитки готовы.`];
      }
      if (push.titulo.toLowerCase() === 'nuevas bebidas') {
  let match = push.cuerpo.match(/\d+/);
  let numero = match ? match[0] : "?";
  return ['Новые напитки', `Стол ${numero} ждет напитки.`];
}
      if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("barra y cocina")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo en barra y cocina\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Заказ готов", `Заказ для ${persona[1]} готов в баре и на кухне.`];
      }
      if (push.titulo == 'Pedido Listo para Entregar' && !push.cuerpo.includes("barra y cocina")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Заказ готов", `Заказ для ${persona[1]} готов.`];
      }
      if (push.titulo == 'Nuevo mensaje' && !push.cuerpo.includes("Mesero")) {
        let numero = push.cuerpo.match(/Cliente consultó en la mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Новое сообщение", `Клиент задал вопрос за столом ${numero[1]}`];
      }
      if (push.titulo == 'Nuevo mensaje' && push.cuerpo.includes("Mesero")) {
        let numero = push.cuerpo.match(/Mesero respondió en mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Новое сообщение", `Официант ответил за столом ${numero[1]}.`];
      }
      if (push.titulo == 'Mensaje del Cliente') return ["Новое сообщение клиента", push.cuerpo];
      if (push.titulo == 'Mensaje del Repartidor') return ['Сообщение от курьера', push.cuerpo];
      if (push.titulo == 'Cuenta solicitada' && push.cuerpo.includes("La mesa")) {
        let variable = push.cuerpo.match(/La mesa (.*) solicitó la cuenta/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Запрошен счет', `За столом ${variable[1]} попросили счет.`];
      }
      if (push.titulo == 'Cuenta solicitada' && push.cuerpo.includes("El cliente")) {
        let variable = push.cuerpo.match(/El cliente (.*) solicitó la cuenta/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Запрошен счет', `Клиент ${variable[1]} попросил счет.`];
      }
      if (push.titulo == 'Cocina finalizado') return ["Кухня завершена", "Блюда готовы к отправке."];
      if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("cocina y barra")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo en cocina y barra\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Заказ готов', `Заказ для ${persona[1]} готов на кухне и в баре.`];
      }
      if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("está listo.")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Заказ готов', `Заказ для ${persona[1]} готов.`];
      }
      if (push.titulo == '¡Pedido Listo!') {
        let persona = push.cuerpo.match(/Tienes un pedido nuevo para retirar y entregar a (.*)\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Заказ готов!', `У вас новый заказ для получения и доставки клиенту ${persona[1]}.`];
      }
      if (push.titulo == 'Cuenta Confirmada') {
        if (push.cuerpo.includes("delivery")) return ['Оплата подтверждена', 'Доставка оплачена и завершена.'];
        let mesa = push.cuerpo.match(/La mesa (.*) cerró la cuenta\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Счет подтвержден', `Стол ${mesa[1]} закрыл счет.`];
      }
      if (push.titulo == 'Factura Disponible') return ['Счет доступен', 'Загрузите ваш счет здесь.'];
      if (push.titulo == 'Pedido Rechazado') {
        let motivo = push.cuerpo.match(/Motivo: (.*)\. Por favor modifique su pedido\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Заказ отклонен', `Причина: ${motivo[1]}. Пожалуйста, измените ваш заказ.`];
      }
      if (push.titulo == 'Cliente espera mesa') {
        let cliente = push.cuerpo.match(/Asigne una mesa al cliente (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Клиент ждет стол', `Назначьте стол клиенту ${cliente[1]}.`];
      }
      if (push.titulo == 'Mesa asignada') {
        let mesa = push.cuerpo.match(/Se le asigno la mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Стол назначен', `Вам назначен стол №${mesa[1]}.`];
      }
      if (push.titulo == '¡Pedido en Camino!') {
        let repartidor = push.cuerpo.match(/(.*) está llevando tu pedido\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Заказ в пути!', `${repartidor[1]} везет ваш заказ.`];
      }
      if (push.titulo == 'Nuevo pedido') {
        let numero = push.cuerpo.match(/Cliente realizó un pedido en la mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Новый заказ', `Клиент сделал заказ за столом ${numero[1]}.`];
      }
      if (push.titulo.toLowerCase() === 'nuevo pedido' && push.cuerpo.includes('espera comida')) {
        let match = push.cuerpo.match(/\d+/);
        let numero = match ? match[0] : "?";
        return ['Новый заказ', `Стол ${numero} ждет еду.`];
      }
      if (push.titulo == '¡Pedido Entregado!') return ['Заказ доставлен!', 'Спасибо, что выбрали нас. Приятного аппетита!'];
      if (push.titulo == 'Pago Recibido') {
        let variable = push.cuerpo.match(/Cliente (.*) abonó \$(.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Оплата получена', `Клиент ${variable[1]} оплатил $${variable[2]}.`];
      }
      if (push.titulo == 'Cuenta confirmada') {
        let variable = push.cuerpo.match(/(.*) pidió una reserva para el (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Бронирование подтверждено', `${variable[1]} запросил бронирование на ${variable[2]}.`];
      }
    } 

    else if (idioma === 'de') {
      // --- Lógica para ALEMÁN ---
      if (push.titulo == 'Nuevo Empleado') {
        let palabra = push.cuerpo.match(/Se registró un (.*)/);
        palabra[1] = palabra[1].toLowerCase();
        if (palabra[1] == "cocinero.") return ["Neuer Mitarbeiter", "Ein Koch wurde registriert."];
        else if (palabra[1] == "maitre.") return ["Neuer Mitarbeiter", "Ein Oberkellner wurde registriert."];
        else if (palabra[1] == "mesero.") return ["Neuer Mitarbeiter", "Ein Kellner wurde registriert."];
      }
      if (push.titulo == "Nuevo cliente") return ["Neuer Kunde", "Ein neuer Kunde wurde registriert"];
      if (push.titulo == "Bar Finalizado") {
        let mesa = push.cuerpo.match(/Mesa (\d+): Bebidas listas\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Bar fertig", `Tisch ${mesa[1]}: Getränke sind bereit.`];
      }
      if (push.titulo.toLowerCase() === 'nuevas bebidas') {
  let match = push.cuerpo.match(/\d+/);
  let numero = match ? match[0] : "?";
  return ['Neue Getränke', `Tisch ${numero} wartet auf Getränke.`];
}
      if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("barra y cocina")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo en barra y cocina\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Bestellung bereit", `Die Bestellung für ${persona[1]} ist an der Bar und in der Küche bereit.`];
      }
      if (push.titulo == 'Pedido Listo para Entregar' && !push.cuerpo.includes("barra y cocina")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Bestellung bereit", `Die Bestellung für ${persona[1]} ist fertig.`];
      }
      if (push.titulo == 'Nuevo mensaje' && !push.cuerpo.includes("Mesero")) {
        let numero = push.cuerpo.match(/Cliente consultó en la mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Neue Nachricht", `Ein Kunde hat an Tisch ${numero[1]} angefragt.`];
      }
      if (push.titulo == 'Nuevo mensaje' && push.cuerpo.includes("Mesero")) {
        let numero = push.cuerpo.match(/Mesero respondió en mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Neue Nachricht", `Der Kellner hat an Tisch ${numero[1]} geantwortet.`];
      }
      if (push.titulo == 'Mensaje del Cliente') return ["Neue Nachricht vom Kunden", push.cuerpo];
      if (push.titulo == 'Mensaje del Repartidor') return ['Nachricht vom Lieferanten', push.cuerpo];
      if (push.titulo == 'Cuenta solicitada' && push.cuerpo.includes("La mesa")) {
        let variable = push.cuerpo.match(/La mesa (.*) solicitó la cuenta/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Rechnung angefordert', `Tisch ${variable[1]} hat die Rechnung angefordert.`];
      }
      if (push.titulo == 'Cuenta solicitada' && push.cuerpo.includes("El cliente")) {
        let variable = push.cuerpo.match(/El cliente (.*) solicitó la cuenta/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Rechnung angefordert', `Kunde ${variable[1]} hat die Rechnung angefordert.`];
      }
      if (push.titulo == 'Cocina finalizado') return ["Küche fertig", "Speisen sind bereit zum Versenden."];
      if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("cocina y barra")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo en cocina y barra\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Bestellung bereit', `Die Bestellung für ${persona[1]} ist in der Küche und an der Bar bereit.`];
      }
      if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("está listo.")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Bestellung bereit', `Die Bestellung für ${persona[1]} ist fertig.`];
      }
      if (push.titulo == '¡Pedido Listo!') {
        let persona = push.cuerpo.match(/Tienes un pedido nuevo para retirar y entregar a (.*)\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Bestellung bereit!', `Du hast eine neue Bestellung zum Abholen und Liefern an ${persona[1]}.`];
      }
      if (push.titulo == 'Cuenta Confirmada') {
        if (push.cuerpo.includes("delivery")) return ['Zahlung bestätigt', 'Die Lieferung wurde bezahlt und abgeschlossen.'];
        let mesa = push.cuerpo.match(/La mesa (.*) cerró la cuenta\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Rechnung bestätigt', `Tisch ${mesa[1]} hat die Rechnung beglichen.`];
      }
      if (push.titulo == 'Factura Disponible') return ['Rechnung verfügbar', 'Lade deine Rechnung hier herunter.'];
      if (push.titulo == 'Pedido Rechazado') {
        let motivo = push.cuerpo.match(/Motivo: (.*)\. Por favor modifique su pedido\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Bestellung abgelehnt', `Grund: ${motivo[1]}. Bitte ändern Sie Ihre Bestellung.`];
      }
      if (push.titulo == 'Cliente espera mesa') {
        let cliente = push.cuerpo.match(/Asigne una mesa al cliente (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Kunde wartet auf Tisch', `Weisen Sie dem Kunden ${cliente[1]} einen Tisch zu.`];
      }
      if (push.titulo == 'Mesa asignada') {
        let mesa = push.cuerpo.match(/Se le asigno la mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Tisch zugewiesen', `Tisch ${mesa[1]} wurde Ihnen zugewiesen.`];
      }
      if (push.titulo == '¡Pedido en Camino!') {
        let repartidor = push.cuerpo.match(/(.*) está llevando tu pedido\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Bestellung unterwegs!', `${repartidor[1]} bringt gerade Ihre Bestellung.`];
      }
      if (push.titulo == 'Nuevo pedido') {
        let numero = push.cuerpo.match(/Cliente realizó un pedido en la mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Neue Bestellung', `Ein Kunde hat an Tisch ${numero[1]} bestellt.`];
      }
      if (push.titulo.toLowerCase() === 'nuevo pedido' && push.cuerpo.includes('espera comida')) {
        let match = push.cuerpo.match(/\d+/);
        let numero = match ? match[0] : "?";
        return ['Neue Bestellung', `Tisch ${numero} wartet auf Essen.`];
      }
      if (push.titulo == '¡Pedido Entregado!') return ['Bestellung geliefert!', 'Vielen Dank, dass Sie uns gewählt haben. Guten Appetit!'];
      if (push.titulo == 'Pago Recibido') {
        let variable = push.cuerpo.match(/Cliente (.*) abonó \$(.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Zahlung erhalten', `Kunde ${variable[1]} hat $${variable[2]} bezahlt.`];
      }
      if (push.titulo == 'Cuenta confirmada') {
        let variable = push.cuerpo.match(/(.*) pidió una reserva para el (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Reservierung bestätigt', `${variable[1]} hat eine Reservierung für ${variable[2]} angefragt.`];
      }
    } 

    else if (idioma === 'fr') {
      // --- Lógica para FRANCÉS ---
      if (push.titulo == 'Nuevo Empleado') {
        let palabra = push.cuerpo.match(/Se registró un (.*)/);
        palabra[1] = palabra[1].toLowerCase();
        if (palabra[1] == "cocinero.") return ["Nouvel Employé", "Un cuisinier a été enregistré."];
        else if (palabra[1] == "maitre.") return ["Nouvel Employé", "Un maître d'hôtel a été enregistré."];
        else if (palabra[1] == "mesero.") return ["Nouvel Employé", "Un serveur a été enregistré."];
      }
      if (push.titulo == "Nuevo cliente") return ["Nouveau Client", "Un nouveau client a été enregistré"];
      if (push.titulo == "Bar Finalizado") {
        let mesa = push.cuerpo.match(/Mesa (\d+): Bebidas listas\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Bar Terminé", `Table ${mesa[1]}: Boissons prêtes.`];
      }
      if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("barra y cocina")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo en barra y cocina\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Commande Prête", `La commande de ${persona[1]} est prête au bar et en cuisine.`];
      }
      if (push.titulo.toLowerCase() === 'nuevas bebidas') {
  let match = push.cuerpo.match(/\d+/);
  let numero = match ? match[0] : "?";
  return ['Nouvelles Boissons', `La table ${numero} attend des boissons.`];
}
      if (push.titulo == 'Pedido Listo para Entregar' && !push.cuerpo.includes("barra y cocina")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Commande Prête", `La commande de ${persona[1]} est prête.`];
      }
      if (push.titulo == 'Nuevo mensaje' && !push.cuerpo.includes("Mesero")) {
        let numero = push.cuerpo.match(/Cliente consultó en la mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Nouveau Message", `Un client a consulté à la table ${numero[1]}`];
      }
      if (push.titulo == 'Nuevo mensaje' && push.cuerpo.includes("Mesero")) {
        let numero = push.cuerpo.match(/Mesero respondió en mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ["Nouveau Message", `Le serveur a répondu à la table ${numero[1]}.`];
      }
      if (push.titulo == 'Mensaje del Cliente') return ["Nouveau message du client", push.cuerpo];
      if (push.titulo == 'Mensaje del Repartidor') return ['Message du Livreur', push.cuerpo];
      if (push.titulo == 'Cuenta solicitada' && push.cuerpo.includes("La mesa")) {
        let variable = push.cuerpo.match(/La mesa (.*) solicitó la cuenta/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Addition Demandée', `La table ${variable[1]} a demandé l'addition.`];
      }
      if (push.titulo == 'Cuenta solicitada' && push.cuerpo.includes("El cliente")) {
        let variable = push.cuerpo.match(/El cliente (.*) solicitó la cuenta/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Addition Demandée', `Le client ${variable[1]} a demandé l'addition.`];
      }
      if (push.titulo == 'Cocina finalizado') return ["Cuisine Terminée", "Plats prêts à être envoyés."];
      if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("cocina y barra")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo en cocina y barra\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Commande Prête', `La commande de ${persona[1]} est prête en cuisine et au bar.`];
      }
      if (push.titulo == 'Pedido Listo para Entregar' && push.cuerpo.includes("está listo.")) {
        let persona = push.cuerpo.match(/El pedido de (.*) está listo\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Commande Prête', `La commande de ${persona[1]} est prête.`];
      }
      if (push.titulo == '¡Pedido Listo!') {
        let persona = push.cuerpo.match(/Tienes un pedido nuevo para retirar y entregar a (.*)\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Commande Prête !', `Vous avez une nouvelle commande à récupérer et à livrer à ${persona[1]}.`];
      }
      if (push.titulo == 'Cuenta Confirmada') {
        if (push.cuerpo.includes("delivery")) return ['Paiement Confirmé', 'La livraison a été payée et terminée.'];
        let mesa = push.cuerpo.match(/La mesa (.*) cerró la cuenta\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Addition Confirmée', `La table ${mesa[1]} a réglé l'addition.`];
      }
      if (push.titulo == 'Factura Disponible') return ['Facture Disponible', 'Téléchargez votre facture ici.'];
      if (push.titulo == 'Pedido Rechazado') {
        let motivo = push.cuerpo.match(/Motivo: (.*)\. Por favor modifique su pedido\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Commande Refusée', `Motif: ${motivo[1]}. Veuillez modifier votre commande.`];
      }
      if (push.titulo == 'Cliente espera mesa') {
        let cliente = push.cuerpo.match(/Asigne una mesa al cliente (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Client en Attente', `Assignez une table au client ${cliente[1]}.`];
      }
      if (push.titulo == 'Mesa asignada') {
        let mesa = push.cuerpo.match(/Se le asigno la mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Table Assignée', `La table ${mesa[1]} vous a été assignée.`];
      }
      if (push.titulo == '¡Pedido en Camino!') {
        let repartidor = push.cuerpo.match(/(.*) está llevando tu pedido\./);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Commande en Route !', `${repartidor[1]} livre votre commande.`];
      }
      if (push.titulo == 'Nuevo pedido') {
        let numero = push.cuerpo.match(/Cliente realizó un pedido en la mesa (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Nouvelle Commande', `Un client a passé une commande à la table ${numero[1]}.`];
      }
      if (push.titulo.toLowerCase() === 'nuevo pedido' && push.cuerpo.includes('espera comida')) {
        let match = push.cuerpo.match(/\d+/);
        let numero = match ? match[0] : "?";
        return ['Nouvelle Commande', `La table ${numero} attend son repas.`];
      }
      if (push.titulo == '¡Pedido Entregado!')  return ['Commande Livrée !', 'Merci de nous avoir choisis. Bon appétit !']
      ;
      if (push.titulo == 'Pago Recibido') {
        let variable = push.cuerpo.match(/Cliente (.*) abonó \$(.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Paiement Reçu', `Le client ${variable[1]} a payé $${variable[2]}.`];
      }
      if (push.titulo == 'Cuenta confirmada') {
        let variable = push.cuerpo.match(/(.*) pidió una reserva para el (.*)/);
        console.log("FUNCIONE, DEVOLVI SIN ERRORES")
        return ['Réservation Confirmée', `${variable[1]} a demandé une réservation pour le ${variable[2]}.`];
      }
    }
    
    // Si no entra en ningún idioma o no matchea, devolvemos el original
    console.log("DEVOLVI ERROR ERROR NORMAL")
    return ["ERROR", "ERROR"];
    

  } catch (e) {
    console.log("DEVOLVI ERROR ERROR EN EL CATCH")
    return ["ERROR", "ERROR"];
  }
}
}