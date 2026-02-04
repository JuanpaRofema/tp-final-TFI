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
              this.pushService.send(
                ultimaNotificacion.titulo,
                ultimaNotificacion.cuerpo,
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
              this.pushService.send(
                ultimaNotificacion.titulo,
                ultimaNotificacion.cuerpo,
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
                this.pushService.send(
                  'El pedido está listo',
                  `Ya puede llevar el pedido a la mesa ${ultimaNotificacion.mesa}`,
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
                this.pushService.send(
                  ultimaNotificacion.titulo,
                  ultimaNotificacion.cuerpo,
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
              this.pushService.send(
                ultimaNotificacion.titulo,
                ultimaNotificacion.cuerpo,
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

          this.pushService.send(
            ultimaNotificacion.titulo,
            ultimaNotificacion.cuerpo,
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

            this.pushService.send(
              ultimaNotificacion.titulo,
              ultimaNotificacion.cuerpo,
              '',
              true,
              '',
              'entregarCuentaDelivery'
            );
          }

          else {
            console.log('--- NOTIFICACION GENERICA ---');
            this.pushService.send(
              ultimaNotificacion.titulo,
              ultimaNotificacion.cuerpo,
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

          this.pushService.send(
            ultimaNotificacion.titulo,
            ultimaNotificacion.cuerpo,
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

          this.pushService.send(
            ultimaNotificacion.titulo,
            ultimaNotificacion.cuerpo,
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
          ) {
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
          titulo: this.diccionario[this.idioma()]['Clienteesperamesa'],
          cuerpo: `${this.diccionario[this.idioma()]['Asigneunamesaalcliente']} ${this.auth.usuarioIngresado.nombre}`,
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
            if (resp.isConfirmed) {
              if (this.pedido) {
                console.log(this.pedido)
                this.pedido.estadoPedido = 'cuentaEntregada';
                this.db.ModificarObjeto(this.pedido, 'delivery')
              }
            }
          });

        }
        else {

          this.mesas.forEach((m: any) => {

            if (m.estado === 'ocupada' && m.ocupadaPor === this.cliente.nombre) {
              this.mesa = m;
            }
          });

          let numMesa = this.db.mesa;

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

              if (this.cliente && this.cliente.estadoPedido) {
                this.cliente.estadoPedido = 'cuentaEntregada';
                this.db.ModificarObjeto(this.cliente, 'clientes');
              }

              if (this.mesa) {
                this.mesa.estado = 'desocupada';
                this.mesa.ocupadaPor = '';
                this.db.ModificarObjeto(this.mesa, 'mesas');
              }

              if (this.pedido) {
                this.pedido.estadoPedido = 'cuentaEntregada';
                this.db.ModificarObjeto(this.pedido, 'pedidos');
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
