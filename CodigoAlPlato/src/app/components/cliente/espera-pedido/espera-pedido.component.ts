import { Component, inject, NgZone, signal } from '@angular/core';
import { faArrowLeft, faCheck, faUtensils, faBell, faFlagCheckered, faGamepad, faClipboardList, faBan } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { BarcodeScanningModalComponent } from '../../alta-cliente/barcode-scanning-modal.component';
import { ModalController, ViewDidLeave, ViewWillEnter } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/database.service';
import { Router, RouterLink } from '@angular/router';
import { LensFacing } from '@capacitor-mlkit/barcode-scanning';
import Swal from 'sweetalert2';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { pushService } from 'src/app/services/serviciosPush/push-notifications.service';
import { PedidoService } from 'src/app/services/pedido.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

@Component({
  selector: 'app-espera-pedido',
  templateUrl: './espera-pedido.component.html',
  styleUrls: ['./espera-pedido.component.scss'],
  imports: [FontAwesomeModule, RouterLink, CommonModule, IonicModule],
  standalone: true,
})
export class EsperaPedidoComponent implements ViewWillEnter, ViewDidLeave {

  faArrowLeft = faArrowLeft;
  faCheck = faCheck;
  faUtensils = faUtensils;
  faBell = faBell;
  faFlagCheckered = faFlagCheckered;
  faGamepad = faGamepad;
  faClipboardList = faClipboardList;
  faBan = faBan;

  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)

  isLoading: boolean = true;
  pasoActual: number = 0;
  mensajeEstado: string = 'Enviando pedido...';
  motivoRechazo: string = '';

  scanResult = '';
  subscription: Subscription | null = null;
  subscription4: Subscription | null = null;

  mostrarNotificacion = true;
  mostrarEncuesta: boolean = false;

  constructor(
    protected auth: AuthService,
    private modalController: ModalController,
    protected db: DatabaseService,
    protected router: Router,
    protected pushService: pushService,
    private pedidoService: PedidoService,
    private ngZone: NgZone
  ) { }
  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
  }

  ionViewWillEnter(): void {
    this.isLoading = true;
    this.mostrarNotificacion = true;


    setTimeout(() => { if (this.isLoading && this.pasoActual === 0) this.isLoading = false; }, 1000);

    const observable = this.db.traerTodosLosPedidos();

    this.subscription = observable.subscribe((pedidos: any) => {

      const miPedido = pedidos.find((p: any) =>
        this.auth.usuarioIngresado &&
        p.cliente === this.auth.usuarioIngresado.nombre &&
        p.estadoPedido !== 'pagado' &&
        p.estadoPedido !== 'finalizado'
      );

      if (miPedido) {

        const nuevoPaso = this.getPasoNumero(miPedido.estadoPedido);

        if (this.pasoActual > 0 && this.pasoActual !== nuevoPaso) {
          this.isLoading = true;

          setTimeout(() => {
            this.actualizarEstadoVisual(miPedido);
            this.isLoading = false;
          }, 500);

        } else {
          this.actualizarEstadoVisual(miPedido);
          if (this.isLoading && this.pasoActual > 0) this.isLoading = false;
        }

        if (miPedido.estadoPedido === 'cancelado') {
          this.manejarRechazo();
        }

      } else {
        this.pasoActual = 0;
        this.mensajeEstado = 'No tienes pedidos en curso.';
        this.isLoading = false;
      }
    });
  }

  ionViewDidLeave(): void {
    if (this.subscription) this.subscription.unsubscribe();
    if (this.subscription4) this.subscription4.unsubscribe();
  }

  getPasoNumero(estado: string): number {
    if (estado === 'cancelado') return -1;
    if (estado === 'porAceptar' || estado === 'pendiente') return 1;
    if (estado === 'enPreparacion') return 2;
    if (estado === 'porEntregar') return 2;
    if (estado === 'entregado') return 3;
    if (estado === 'consumiendo' || estado === 'cuentaSolicitada') return 4;
    return 0;
  }

  actualizarEstadoVisual(pedido: any) {
    const estado = pedido.estadoPedido;
    this.auth.usuarioIngresado.estadoPedido = estado;
    this.pasoActual = this.getPasoNumero(estado);

    if (this.pasoActual === -1) {
      this.mensajeEstado = 'Lo sentimos, tu pedido fue rechazado.';
      this.motivoRechazo = pedido.motivoRechazo || 'Sin motivo especificado.';
    }
    else if (this.pasoActual === 1) {
      this.mensajeEstado = 'El mozo confirmará tu pedido pronto.';
    }
    else if (this.pasoActual === 2) {
      this.mensajeEstado = '¡En la cocina! Preparando tus platos.';
      this.pedidoService.setMostrarInfo(true);
      this.pedidoService.setPedidoActual(pedido);
    }
    else if (this.pasoActual === 3) {
      this.mensajeEstado = '¡Pedido en la mesa! Disfruta.';
      this.mostrarEncuesta = true;
    }
    else if (this.pasoActual === 4) {
      this.mensajeEstado = 'Disfrutando la comida.';
      this.mostrarEncuesta = true;
    }
  }

  manejarRechazo() {
    const rol = this.auth.usuarioIngresado.tipoCliente;
    const obsNotif = this.db.traerNotificacion(rol);

    this.auth.usuarioIngresado.estadoMesa = '';
    this.db.ModificarObjeto(this.auth.usuarioIngresado, 'clientes')

    if (!this.subscription4) {
      this.subscription4 = obsNotif.subscribe((res: any[]) => {
        if (res && res.length > 0) {
          const notif = res[0];

          if (!notif.recibida && this.mostrarNotificacion) {

            this.pushService.send(
              notif.titulo,
              notif.cuerpo,
              '/listado-productos',
              true,
              '',
              'abrirListado'
            );

            this.db.actualizarNotificacion(rol, notif.id, { recibida: true });
            this.mostrarNotificacion = false;
          }
        }
      });
    }
  }

  irAlMenu() {
    this.router.navigate(['/listado-productos']);
  }

  async starScan() {
    const modal = await this.modalController.create({
      component: BarcodeScanningModalComponent,
      cssClass: 'barcode-scanning-modal',
      showBackdrop: false,
      componentProps: { formats: [], LensFacing: LensFacing.Back },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data) {
      this.isLoading = true;

      this.scanResult = data?.barcode?.displayValue;

      let mesaUsuario = this.auth.usuarioIngresado.estadoMesa.toString();
      if (!mesaUsuario.startsWith('mesa-')) mesaUsuario = 'mesa-' + mesaUsuario;

      if (this.scanResult === mesaUsuario) {

        if (this.auth.usuarioIngresado.estadoPedido === 'entregado') {

          this.auth.usuarioIngresado.estadoPedido = 'consumiendo';
          await this.db.ModificarObjeto(this.auth.usuarioIngresado, 'clientes');

          this.ngZone.run(() => this.pedidoService.setMostrarInfo(false));

          this.isLoading = false;

          Swal.fire({
            icon: 'success',
            title: this.diccionario[this.idioma()]['Acomer'],
            text: this.diccionario[this.idioma()]['Confirmastelarecepción'],
            timer: 1500,
            showConfirmButton: false,
            background: '#333', color: '#fff'
          }).then(() => {
            this.router.navigateByUrl('/cliente-recibe-pedido');
          });
        } else {
          this.isLoading = false;
          Swal.fire({
            title: this.diccionario[this.idioma()]['MesaCorrecta'],
            text: this.diccionario[this.idioma()]['Perotupedidoaúnnollega'],
            icon: 'info',
            background: '#333',
            color: '#fff'
          });
        }

      } else {
        this.isLoading = false;
        Swal.fire({
          title: this.diccionario[this.idioma()]['MesaIncorrecta'],
          text: `${this.diccionario[this.idioma()]['Estanoestumesaasignada']} (${this.auth.usuarioIngresado.estadoMesa}).`,
          icon: 'error',
          background: '#333', color: '#fff',
          confirmButtonColor: '#d33'
        });
      }
    }
  }
}