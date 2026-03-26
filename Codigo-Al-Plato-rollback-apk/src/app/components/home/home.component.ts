import { Component, inject, OnInit, signal } from '@angular/core';
import {
  IonicModule,
  ModalController,
  Platform,
  IonIcon,
} from '@ionic/angular';
import { Subscription, Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BarcodeScanner, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { BarcodeScanningModalComponent } from '../alta-cliente/barcode-scanning-modal.component';
import Swal from 'sweetalert2';
import { DatabaseService } from 'src/app/services/database.service';
import { Router, RouterLink } from '@angular/router';
import { EncuestasService } from 'src/app/services/encuestas.service';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import firebase from 'firebase/compat/app';
import { pushService } from 'src/app/services/serviciosPush/push-notifications.service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ViewWillEnter, ViewDidLeave } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { CambioIdioma } from 'src/app/services/cambio-idioma';
import { DICCIONARIO } from 'src/assets/diccionario';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, RouterLink, CommonModule, IonicModule],
})
export class HomeComponent implements ViewWillEnter, ViewDidLeave {
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)
  isLoading: boolean = true;

  faRightFromBracket = faRightFromBracket;
  faComent = faComment;

  scanResult = '';
  subscription: Subscription | null = null;
  subscription2: Subscription | null = null;
  subscription3: Subscription | null = null;
  subscription4: Subscription | null = null;
  subscription5: Subscription | null = null;
  subscription6: Subscription | null = null;
  subscription7: Subscription | null = null;
  subscription8: Subscription | null = null;
  mesas: any = null;
  mesa: any;
  clientes: any;
  cliente: any;
  pedido: any;

  mostrarNotificacion = true;

  constructor(
    protected auth: AuthService,
    protected router: Router,
    private modalController: ModalController,
    protected platform: Platform,
    protected db: DatabaseService,
    protected pushService: pushService
  ) {
    if (this.platform.is('capacitor')) {
      BarcodeScanner.isSupported().then();
      BarcodeScanner.checkPermissions().then();
      BarcodeScanner.removeAllListeners();
    }

    this.escucharClickNotificacion();
  }
  ngOnInit() {
    console.clear()
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
  }

  ionViewWillEnter() {
    console.log('Entrando al Home: Activando escuchas 📡');
    this.isLoading = true;

    setTimeout(() => {
      this.isLoading = false;
    }, 1300);

    this.iniciarSuscripciones();
  }


  ionViewDidLeave() {
    console.log('Saliendo del Home: Apagando escuchas 🔇');
    this.cancelarSuscripciones();
  }

  iniciarSuscripciones() {
    if (this.auth.usuarioIngresado.tipoCliente === 'chef') {
      const observableChef = this.db.traerNotificacion('chef');

      this.subscription3 = observableChef.subscribe((resultado) => {
        if (resultado.length > 0) {
          const ultimaNotificacion: any = resultado[0];
          console.log(ultimaNotificacion);

          if (!ultimaNotificacion.recibida) {
            if (this.mostrarNotificacion) {
              console.log('LLEGO UNA NOTIFICACION');
              let res = this.cambioIdioma.modificarLasPush(ultimaNotificacion)
              console.log("HERMANO, LO QUE LAS PUSH TIENEN ES ESTO, TITULO: ", ultimaNotificacion.titulo, "EL CONTENIDO: ", ultimaNotificacion.cuerpo)
              this.pushService.send(
                res[0],
                res[1],
                ''
              );
              this.mostrarNotificacion = false;
            }
            ultimaNotificacion.recibida = true;
            this.db.actualizarNotificacion(
              'chef',
              ultimaNotificacion.id,
              { recibida: true }
            );
          } else {

            this.mostrarNotificacion = true;
          }
        }
      });
    }

    if (this.auth.usuarioIngresado.tipoCliente === 'bartender') {
      const observableBartender = this.db.traerNotificacion('bartender');

      this.subscription4 = observableBartender.subscribe((resultado: any[]) => {
        if (resultado.length > 0) {
          const ultimaNotificacion: any = resultado[0];
          console.log(ultimaNotificacion);

          if (!ultimaNotificacion.recibida) {
            if (this.mostrarNotificacion) {
              console.log('LLEGO UNA NOTIFICACION');
              let res1 = this.cambioIdioma.modificarLasPush(ultimaNotificacion)
              console.log("HERMANO, LO QUE LAS PUSH TIENEN ES ESTO, TITULO: ", ultimaNotificacion.titulo, "EL CONTENIDO: ", ultimaNotificacion.cuerpo)
              this.pushService.send(
                res1[0],
                res1[1],
                ''
              );

              this.mostrarNotificacion = false;
            }
            this.db.actualizarNotificacion(
              'bartender',
              ultimaNotificacion.id,
              { recibida: true }
            );
          } else {
            this.mostrarNotificacion = true;
          }
        }
      });
    }

    if (this.auth.usuarioIngresado.tipoCliente === 'mesero') {
      const observableMesero = this.db.traerNotificacion('mesero');

      this.subscription2 = observableMesero.subscribe((resultado: any[]) => {
        if (resultado.length === 0) return;

        const ultimaNotificacion: any = resultado[0];
        console.log(ultimaNotificacion);

        if (!ultimaNotificacion.recibida) {


          if (ultimaNotificacion.pedidoEnProduccion) {
            if (ultimaNotificacion.cocinaFinalizada && ultimaNotificacion.barFinalizado) {
              if (this.mostrarNotificacion) {
                console.log('LLEGO UNA NOTIFICACION - Pedido listo');
                let res2 = this.cambioIdioma.modificarLasPush(ultimaNotificacion)
                console.log("HERMANO, LO QUE LAS PUSH TIENEN ES ESTO, TITULO: ", ultimaNotificacion.titulo, "EL CONTENIDO: ", ultimaNotificacion.cuerpo)
                this.pushService.send(
                  res2[0],
                  res2[1],
                  ''
                );
                this.mostrarNotificacion = false;
              }
            }

          } else {

            if (ultimaNotificacion.noRedirigir) {
              if (this.mostrarNotificacion) {
                this.mostrarNotificacion = false;
                console.log('LLEGO UNA NOTIFICACION - Sin redirigir');
                let res3 = this.cambioIdioma.modificarLasPush(ultimaNotificacion)
                console.log("HERMANO, LO QUE LAS PUSH TIENEN ES ESTO, TITULO: ", ultimaNotificacion.titulo, "EL CONTENIDO: ", ultimaNotificacion.cuerpo)
                this.pushService.send(
                  res3[0],
                  res3[1],
                  '',
                  false,
                  ultimaNotificacion.mesa
                );

                this.db.mesa = ultimaNotificacion.mesa;
                this.cliente = ultimaNotificacion.cliente;
                this.pedido = ultimaNotificacion.pedido;
              }
            }


            if (this.mostrarNotificacion) {
              console.log('LLEGO UNA NOTIFICACION - Chat');
              let res4 = this.cambioIdioma.modificarLasPush(ultimaNotificacion)
              console.log("HERMANO, LO QUE LAS PUSH TIENEN ES ESTO, TITULO: ", ultimaNotificacion.titulo, "EL CONTENIDO: ", ultimaNotificacion.cuerpo)
              this.pushService.send(
                res4[0],
                res4[1],
                '/chat',
                true,
                '',
                'abrirChat'
              );

              this.db.mesa = ultimaNotificacion.mesa;
              this.mostrarNotificacion = false;
            }
          }
          this.db.actualizarNotificacion(
            'mesero',
            ultimaNotificacion.id,
            { recibida: true }
          );
          this.mostrarNotificacion = true;
        }
      });
    }

    if (this.auth.usuarioIngresado.tipoCliente === 'maitre') {
      const observableMaitre = this.db.traerNotificacion('maitre');

      this.subscription5 = observableMaitre.subscribe((resultado: any[]) => {
        if (resultado.length === 0) return;

        const ultimaNotificacion: any = resultado[0];
        console.log(ultimaNotificacion);

        if (!ultimaNotificacion.recibida && this.mostrarNotificacion) {
          console.log('LLEGO UNA NOTIFICACION - Maitre');
          let res5 = this.cambioIdioma.modificarLasPush(ultimaNotificacion)
          console.log("HERMANO, LO QUE LAS PUSH TIENEN ES ESTO, TITULO: ", ultimaNotificacion.titulo, "EL CONTENIDO: ", ultimaNotificacion.cuerpo)
          this.pushService.send(
            res5[0],
            res5[1],
            ''
          );


          this.db.actualizarNotificacion(
            'maitre',
            ultimaNotificacion.id,
            { recibida: true }
          );

          this.mostrarNotificacion = false;
        }
      });
    }

    if (this.auth.usuarioIngresado.tipoCliente === 'delivery') {
      const observableDelivery = this.db.traerNotificacion('delivery');

      this.subscription7 = observableDelivery.subscribe((resultado: any[]) => {
        if (resultado.length === 0) return;

        const ultimaNotificacion: any = resultado[0];
        console.log('Notificación recibida:', ultimaNotificacion);

        if (!ultimaNotificacion.recibida && this.mostrarNotificacion) {


          if (ultimaNotificacion.titulo === 'Cuenta solicitada') {
            console.log('--- ES UNA SOLICITUD DE CUENTA ---');


            this.cliente = ultimaNotificacion.cliente;
            this.pedido = ultimaNotificacion.pedido;
            let res6 = this.cambioIdioma.modificarLasPush(ultimaNotificacion)
            console.log("HERMANO, LO QUE LAS PUSH TIENEN ES ESTO, TITULO: ", ultimaNotificacion.titulo, "EL CONTENIDO: ", ultimaNotificacion.cuerpo)
            this.pushService.send(
              res6[0],
              res6[1],
              '',
              true,
              '',
              'entregarCuentaDelivery'
            );
          }

          else {
            console.log('--- NOTIFICACION GENERICA ---');
            let res7 = this.cambioIdioma.modificarLasPush(ultimaNotificacion)
            console.log("HERMANO, LO QUE LAS PUSH TIENEN ES ESTO, TITULO: ", ultimaNotificacion.titulo, "EL CONTENIDO: ", ultimaNotificacion.cuerpo)
            this.pushService.send(
              res7[0],
              res7[1],
              '',
              true
            );
          }


          this.db.actualizarNotificacion(
            'delivery',
            ultimaNotificacion.id,
            { recibida: true }
          );

          this.mostrarNotificacion = false;
        }
      });
    }

    if (this.auth.usuarioIngresado.tipoCliente === 'dueño' ||
      this.auth.usuarioIngresado.tipoCliente === 'supervisor') {

      const rol = this.auth.usuarioIngresado.tipoCliente;
      const observableRol = this.db.traerNotificacion(rol);

      this.subscription5 = observableRol.subscribe((resultado: any[]) => {
        if (!resultado || resultado.length === 0) return;

        const ultimaNotificacion: any = resultado[0];
        console.log(ultimaNotificacion);

        if (!ultimaNotificacion.recibida && this.mostrarNotificacion) {
          console.log('LLEGO UNA NOTIFICACION -', rol);
          let res= this.cambioIdioma.modificarLasPush(ultimaNotificacion)
          console.log("HERMANO, LO QUE LAS PUSH TIENEN ES ESTO, TITULO: ", ultimaNotificacion.titulo, "EL CONTENIDO: ", ultimaNotificacion.cuerpo)
          this.pushService.send(
            res[0] ,
            res[1] ,
            ''
          );


          this.db.actualizarNotificacion(
            rol,
            ultimaNotificacion.id,
            { recibida: true }
          );

          this.mostrarNotificacion = false;
        }
      });
    }

    const observableAnonimo = this.db.traerNotificacion('anonimo');
    this.subscription8 = observableAnonimo.subscribe((resultado: any[]) => {
      if (!resultado || resultado.length === 0) return;

      const ultimaNotificacion: any = resultado[0];
      console.log(ultimaNotificacion);

      if (this.auth.usuarioIngresado.tipoCliente === 'anonimo') {
        if (!ultimaNotificacion.recibida && this.mostrarNotificacion) {
          console.log('LLEGO UNA NOTIFICACION');
          let res8 = this.cambioIdioma.modificarLasPush(ultimaNotificacion)
          console.log("HERMANO, LO QUE LAS PUSH TIENEN ES ESTO, TITULO: ", ultimaNotificacion.titulo, "EL CONTENIDO: ", ultimaNotificacion.cuerpo)
          this.pushService.send(
            res8[0],
            res8[1],
            ultimaNotificacion.pdfUrl,
            true,
            '',
            'abrirPdf'
          );


          this.db.actualizarNotificacion(
            'anonimo',
            ultimaNotificacion.id,
            { recibida: true }
          );

          this.mostrarNotificacion = false;
        }
      }
    });

    const observableMesa = this.db.traerMesas();
    this.subscription6 = observableMesa.subscribe((mesas) => {
      this.mesas = mesas.filter((doc: any) => doc.estado === 'ocupada');
    });

    const observableCuentas = this.db.traerCuenta();

    if (this.auth.usuarioIngresado.tipoCliente === 'cliente') {
      this.subscription = observableCuentas.subscribe((cuentas) => {
        cuentas.forEach((c: any) => {
          if (
            c.cliente === this.auth.usuarioIngresado.nombre &&
            c.estadoCuenta === 'cuentaConfirmada'
            && !c.notificado
          ) {
            c.notificado = true;
            this.db.ModificarObjeto(c,"cuenta")
            Swal.fire({
              title: this.diccionario[this.idioma()]['Pagoexitoso'],
              text: this.diccionario[this.idioma()]['SupagoseregistróconéxitoVuelvapronto'],
              icon: 'success',
              confirmButtonText: this.diccionario[this.idioma()]['Aceptar'],
              confirmButtonColor: '#780000',
              background: '#333',
              heightAuto: false,
            });
          }
        });
      });
    }

  }

  cancelarSuscripciones() {
    if (this.subscription) this.subscription.unsubscribe();
    if (this.subscription2) this.subscription2.unsubscribe();
    if (this.subscription3) this.subscription3.unsubscribe();
    if (this.subscription4) this.subscription4.unsubscribe();
    if (this.subscription5) this.subscription5.unsubscribe();
    if (this.subscription6) this.subscription6.unsubscribe();
    if (this.subscription7) this.subscription7.unsubscribe();
    if (this.subscription8) this.subscription8.unsubscribe();
  }

  cerrarSesion() {
    this.auth.CerrarSesion();
    this.router.navigateByUrl('/login');
  }

  async starScan() {
    console.log(this.auth.usuarioIngresado);
    const modal = await this.modalController.create({
      component: BarcodeScanningModalComponent,
      cssClass: 'barcode-scanning-modal',
      showBackdrop: false,
      componentProps: {
        formats: [],
        LensFacing: LensFacing.Back,
      },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      this.isLoading = true;
      this.scanResult = data?.barcode?.displayValue;

      if (
        this.scanResult === 'mesa-1' ||
        this.scanResult === 'mesa-2' ||
        this.scanResult === 'mesa-3' ||
        this.scanResult === 'mesa-4' ||
        this.scanResult === 'mesa-5' ||
        this.scanResult === 'mesa-6' ||
        this.scanResult === 'mesa-7' ||
        this.scanResult === 'mesa-8' ||
        this.scanResult === 'mesa-9' ||
        this.scanResult === 'mesa-10'
      ) {
        if (this.auth.usuarioIngresado.tipoCliente === 'mesero') {
          this.db.mesa = this.scanResult;
          this.router.navigate(['/chat'], {
            queryParams: { mesa: this.scanResult },
          });
        } else {
          this.mesas.forEach((m: any) => {
            if (m.estado === 'ocupada' && m.estadoReserva === 'aprobada' && m.ocupadaPor === this.auth.usuarioIngresado.id && m.reservadaPor === this.auth.usuarioIngresado.id) {
              this.mesa = m;
              console.log('hola')
            }
          });
          console.log("DEBUG reserva:", this.auth.usuarioIngresado.fechaReserva);
          const ahora = new Date();

          const fechaReserva = this.auth.usuarioIngresado.fechaReserva.toDate();
          const fechaLimite = new Date(fechaReserva.getTime() + 45 * 60000);

          const mismaMesa = this.scanResult === `mesa-${this.auth.usuarioIngresado.estadoMesa}`;
          const aprobada = this.auth.usuarioIngresado.estadoReserva === 'aprobada';

          console.log(mismaMesa, aprobada)

          console.log(ahora, fechaReserva, fechaLimite)

          if (aprobada && mismaMesa) {

            if (ahora >= fechaLimite) {
              Swal.fire({
                title: this.diccionario[this.idioma()]['Reservavencida'],
                text: this.diccionario[this.idioma()]['Tureservaexpiróluegode45minutos'],
                icon: 'error',
                background: '#333',
                color: '#fff',
                confirmButtonColor: '#780000'
              }).then((resp) => {
                if (resp.isConfirmed) {
                  this.isLoading = false;
                  this.auth.usuarioIngresado.fechaReserva = '';
                  this.auth.usuarioIngresado.estadoReserva = '';
                  this.auth.usuarioIngresado.estadoMesa = '';
                  this.auth.usuarioIngresado.tipoMesa = ''
                  this.db.ModificarObjeto(this.auth.usuarioIngresado, 'clientes');
                  console.log(this.mesa)
                  this.mesa.estado = 'desocupada';
                  this.mesa.estadoReserva = '';
                  this.mesa.fechaReserva = '';
                  this.mesa.ocupadaPor = '';
                  this.mesa.reservadaPor = '';
                  this.db.ModificarObjeto(this.mesa, 'mesas')
                }
              });
              return
            }

            if (ahora < fechaReserva) {
              Swal.fire({
                title: this.diccionario[this.idioma()]['Accesonopermitido'],
                text: `${this.diccionario[this.idioma()]['Todavíanoeslahoradetureserva']} (${fechaReserva.toLocaleString()}).`,
                icon: 'warning',
                background: '#333',
                color: '#fff',
                confirmButtonColor: '#780000'
              });
              this.isLoading = false;
              return;
            }


            this.db.mesa = this.scanResult;
            this.isLoading = false;
            this.router.navigate(['/listado-productos']);
            return;

          } else if (this.scanResult != `mesa-${this.auth.usuarioIngresado.estadoMesa}`) {
            Swal.fire({
              heightAuto: false,
              title: this.diccionario[this.idioma()]['Estanoeslamesaquereservaste'],
              background: '#333',
              color: '#fff',
              confirmButtonColor: '#780000',
              confirmButtonText: this.diccionario[this.idioma()]['Aceptar'],
            });
            this.isLoading = false;
          }

          else if (this.auth.usuarioIngresado.estadoMesa === 'sin-pedir') {
            Swal.fire({
              heightAuto: false,
              title: this.diccionario[this.idioma()]['Debesolicitarmesaprimero'],
              background: '#333',
              color: '#fff',
              confirmButtonColor: '#780000',
              confirmButtonText: this.diccionario[this.idioma()]['Aceptar'],
            });
            this.isLoading = false;
          }
        }
      } else if (this.scanResult === 'mover-a-espera-cliente') {
        this.auth.usuarioIngresado.estadoMesa = 'solicitada';
        if (this.auth.usuarioIngresado.tipoCliente === 'anonimo') {
          this.db.ModificarObjeto(this.auth.usuarioIngresado, 'clientes');
        } else {
          this.db.ModificarObjeto(
            this.auth.usuarioIngresado,
            'clientes'
          );
        }

        await this.db.enviarNotificacion('maitre', {
          titulo: 'Cliente espera mesa',
          cuerpo: `Asigne una mesa al cliente ${this.auth.usuarioIngresado.nombre}`,
        });

        this.router.navigateByUrl('/cliente-espera-mesa');
      } else if (this.scanResult === 'lista-espera&#10;') {
        this.router.navigate(['/ver-grafico'])
      }
    }
    this.isLoading = false;
  }

  escucharClickNotificacion() {
  LocalNotifications.addListener(
    'localNotificationActionPerformed',
    (notification) => {
      
      // --- CASO 1: DELIVERY ---
      if (notification.actionId === 'entregarCuentaDelivery') {
        Swal.fire({
          title: this.diccionario[this.idioma()]['CobrarDelivery'],
          text: `${this.diccionario[this.idioma()]['Elcliente']} ${this.cliente} ${this.diccionario[this.idioma()]['solicitalacuentaConfirmarentregadecuenta']}`,
          icon: 'info',
          background: '#333',
          color: '#fff',
          confirmButtonText: this.diccionario[this.idioma()]['EntregarCuenta'],
          confirmButtonColor: '#780000',
          showCancelButton: true,
          cancelButtonText: this.diccionario[this.idioma()]['Cancelar'],
          heightAuto: false,
        }).then((resp) => {
          if (resp.isConfirmed && this.pedido) {
            // Lógica reparada: busca el objeto real y evita bucles
            const sub = this.db.traerDelivery().subscribe((lista: any[]) => {
              const idPedido = this.pedido?.id || this.pedido;
              const pedidoReal = lista.find((p: any) => p.id === idPedido);

              if (pedidoReal) {
                this.db.ModificarObjeto({
                  ...pedidoReal,
                  estadoPedido: 'cuentaEntregada',
                  fechaCuentaEntregada: new Date()
                }, 'delivery');
                console.log('✅ Pedido de delivery actualizado');
              }
              sub.unsubscribe(); 
            });
          }
        });
      } 
      
      // --- CASO 2: GENERAL (MESERO / SALÓN) ---
      else {
        const esDelivery = this.auth.usuarioIngresado.tipoCliente === 'delivery';

        if (!esDelivery && this.mesas && this.cliente) {
          const nombreCliente = typeof this.cliente === 'string' ? this.cliente : this.cliente.nombre;
          this.mesa = this.mesas.find((m: any) => m.ocupadaPor === nombreCliente);
        }

        let numMesa = this.db.mesa; 
        if(this.auth.usuarioIngresado.tipoCliente === 'cliente') {

        }
        else {
          Swal.fire({
          title: this.diccionario[this.idioma()]['Enviarcuenta'],
          text: `${this.diccionario[this.idioma()]['Lamesa']} ${numMesa} ${this.diccionario[this.idioma()]['estásolicitandolacuenta']}`,
          icon: 'info',
          background: '#333',
          color: '#fff',
          confirmButtonText: this.diccionario[this.idioma()]['Enviar'],
          confirmButtonColor: '#780000',
          heightAuto: false,
        }).then((resp) => {
          if (resp.isConfirmed) {
            
            // Lógica reparada: Verifica que cliente sea objeto antes de modificar
            if (this.cliente && typeof this.cliente === 'object') {
                this.cliente.estadoPedido = 'cuentaEntregada';
                this.db.ModificarObjeto(this.cliente, 'clientes');
            }

            // Lógica reparada: Desocupa la mesa solo si existe y no es delivery
            if (!esDelivery && this.mesa) {
                this.mesa.estado = 'desocupada';
                this.mesa.ocupadaPor = '';
                this.db.ModificarObjeto(this.mesa, 'mesas');
            }
            
            // Lógica reparada: El corazón del arreglo para los pedidos
            if (this.pedido) {
                const coleccion = esDelivery ? 'delivery' : 'pedidos';
                
                // Si el pedido es objeto, lo pisamos directo
                if (typeof this.pedido === 'object') {
                    this.pedido.estadoPedido = 'cuentaEntregada';
                    this.db.ModificarObjeto(this.pedido, coleccion);
                } else {
                    // Si el pedido es un string (ID), lo buscamos en la base de datos primero
                    const obs = esDelivery ? this.db.traerDelivery() : this.db.traerPedidos();
                    const sub = obs.subscribe((lista: any[]) => {
                        const pedidoReal = lista.find((p: any) => p.id === this.pedido);
                        if (pedidoReal) {
                            pedidoReal.estadoPedido = 'cuentaEntregada';
                            this.db.ModificarObjeto(pedidoReal, coleccion);
                        }
                        sub.unsubscribe(); // Desuscribimos para no hacer bucle infinito
                    });
                }
            }

            Swal.fire({
              title: this.diccionario[this.idioma()]['Cuentaenviada'],
              text: `${this.diccionario[this.idioma()]['Lamesa']} ${numMesa} ${this.diccionario[this.idioma()]['recibirásucuenta']}`,
              icon: 'success',
              confirmButtonText: this.diccionario[this.idioma()]['Aceptar'],
              confirmButtonColor: '#780000',
              heightAuto: false,
              background: '#333',
              color: '#fff',
            });
          }
        });
        }
        
      }
    }
  );
}

  ngAfterViewInit() {
    const container = document.getElementById('snapContainer');

    if (!container) return;

    let bloqueado = false;

    container.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault(); // ⛔ bloquea scroll libre del navegador

      if (bloqueado) return;
      bloqueado = true;

      const direccion = Math.sign(e.deltaY); // 1 baja, -1 sube
      const altura = container.clientHeight;

      container.scrollBy({
        top: direccion * altura,
        behavior: 'smooth'
      });

      setTimeout(() => {
        bloqueado = false;
      }, 650); // tiempo del snap
    }, { passive: false });
  }




  enviarCuenta() {
    this.mesas.forEach((m: any) => {
      if (m.estado === 'ocupada' && m.ocupadaPor === this.cliente.nombre) {
        this.mesa = m;
      }
    });

    console.log(this.mesa);
    console.log(this.cliente);
    console.log(this.pedido);
    let numMesa = this.db.mesa;
    Swal.fire({
      title: this.diccionario[this.idioma()]['Enviarcuenta'],
      text: `${this.diccionario[this.idioma()]['Lamesa']} ${numMesa} ${this.diccionario[this.idioma()]['estásolicitandolacuenta']}`,
      icon: 'info',
      confirmButtonText: this.diccionario[this.idioma()]['Enviar'],
      confirmButtonColor: '#780000',
      heightAuto: false,
    }).then((resp) => {
      if (resp.isConfirmed) {
        this.cliente.estadoPedido = 'cuentaEntregada';
        this.db.ModificarObjeto(this.cliente, 'clientes');
        this.mesa.estado = 'desocupada';
        this.mesa.ocupadaPor = '';
        this.db.ModificarObjeto(this.mesa, 'mesas');
        this.db.descuento = 0;
        this.pedido.estadoPedido = 'cuentaEntregada';
        this.db.ModificarObjeto(this.pedido, 'pedidos');
        Swal.fire({
          title: this.diccionario[this.idioma()]['Cuentaenviada'],
          text: `${this.diccionario[this.idioma()]['Lamesa']} ${numMesa} ${this.diccionario[this.idioma()]['recibirásucuenta']}`,
          icon: 'success',
          confirmButtonText: this.diccionario[this.idioma()]['Aceptar'],
          confirmButtonColor: '#780000',
          heightAuto: false,
        });
      }
    });
  }
}
