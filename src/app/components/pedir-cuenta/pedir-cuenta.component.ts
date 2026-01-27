import { Component, inject, OnInit, signal } from '@angular/core';
import { LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import { BarcodeScanningModalComponent } from '../alta-cliente/barcode-scanning-modal.component';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faReceipt, faQrcode, faSpinner, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { ModalController, Platform, IonicModule } from '@ionic/angular';
import { pushService } from 'src/app/services/serviciosPush/push-notifications.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CambioIdioma } from 'src/app/services/cambio-idioma';
import { DICCIONARIO } from 'src/assets/diccionario';

@Component({
  selector: 'app-pedir-cuenta',
  templateUrl: './pedir-cuenta.component.html',
  styleUrls: ['./pedir-cuenta.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, RouterLink, CommonModule, FormsModule, IonicModule],
})
export class PedirCuentaComponent implements OnInit {
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)

  faArrowLeft = faArrowLeft;
  faReceipt = faReceipt;
  faQrcode = faQrcode;
  faSpinner = faSpinner;
  faCheckCircle = faCheckCircle;

  subscription: Subscription | null = null;

  isLoading: boolean = true;
  esperandoCuenta: boolean = true;

  propinaString: string = '$0';
  propinaNumber: number = 0;
  productosEntregados: any[] = [];
  totalPrecio: number = 0;
  descuento: number = 0;
  fechaActual: Date = new Date();

  pedidoActivo: any = null;

  constructor(
    protected auth: AuthService,
    protected router: Router,
    private modalController: ModalController,
    protected db: DatabaseService,
    protected pushService: pushService
  ) { }

  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
    this.cargarDatos();
  }

  cargarDatos() {
    this.isLoading = true;
    const esDelivery = this.auth.usuarioIngresado.tipoPedido === 'delivery';
    const observable = esDelivery ? this.db.traerDelivery() : this.db.traerPedidos();

    this.subscription = observable.subscribe((lista: any[]) => {


      const pedidoEncontrado = lista.find(p =>
        (esDelivery ? p.nombre : p.cliente) === this.auth.usuarioIngresado.nombre &&
        (p.estadoPedido === 'cuentaSolicitada' || p.estadoPedido === 'cuentaEntregada')
      );

      if (pedidoEncontrado) {
        this.pedidoActivo = pedidoEncontrado;
        this.productosEntregados = pedidoEncontrado.productos || [];


        if (pedidoEncontrado.estadoPedido === 'cuentaSolicitada') {
          this.esperandoCuenta = true;
        } else if (pedidoEncontrado.estadoPedido === 'cuentaEntregada') {
          this.esperandoCuenta = false;
        }
      }

      this.isLoading = false;
    });
  }

  sacarSubTotal() {
    let total = 0;
    this.productosEntregados.forEach((p: any) => {
      total += (parseFloat(p.precio) * (p.cantidad || 1));
    });
    return total;
  }

  sacarTotal() {
    let subtotal = this.sacarSubTotal();
    let descuentoMonto = 0;

    if (this.auth.usuarioIngresado.descuento > 0) {
      descuentoMonto = subtotal * this.auth.usuarioIngresado.descuento
    }

    this.descuento = descuentoMonto;
    this.totalPrecio = subtotal - descuentoMonto + this.propinaNumber;
    return this.totalPrecio;
  }

  async escanearPropina() {
    const modal = await this.modalController.create({
      component: BarcodeScanningModalComponent,
      cssClass: 'barcode-scanning-modal',
      showBackdrop: false,
      componentProps: { formats: [], LensFacing: LensFacing.Back },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data?.barcode?.displayValue) {
      const valor = data.barcode.displayValue;

      if (valor.startsWith('propina-')) {
        const porcentaje = parseInt(valor.split('-')[1]);
        if ([5, 10, 15, 20].includes(porcentaje)) {
          const subtotal = this.sacarSubTotal();
          this.propinaNumber = subtotal * (porcentaje / 100);
          this.propinaString = `$${this.propinaNumber.toFixed(0)}`;

          Swal.fire({
            icon: 'success',
            title: this.diccionario[this.idioma()]['PropinaAgregada'],
            text: `${this.diccionario[this.idioma()]['Seagregóun']} ${porcentaje}% ($${this.propinaNumber})`,
            heightAuto: false,
            background: '#333',
            color: '#fff'
          });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: this.diccionario[this.idioma()]['QRIncorrecto'],
          text: this.diccionario[this.idioma()]['Escaneeuncódigodepropinaválido']
        });
      }
    }
  }

  guardarCuenta() {
    this.isLoading = true;

    const cuenta = {
      cliente: this.auth.usuarioIngresado.nombre,
      email: this.auth.usuarioIngresado.email,
      productos: this.productosEntregados,
      subTotal: this.sacarSubTotal(),
      descuento: this.descuento,
      propina: this.propinaNumber,
      total: this.sacarTotal(),
      tipoCliente: this.auth.usuarioIngresado.tipoCliente,
      tipoPedido: this.auth.usuarioIngresado.tipoPedido,
      mesa: this.pedidoActivo.mesa || 0,
      estadoCuenta: 'haConfirmar',
      fecha: new Date().getTime()
    };


    this.db.guardarObjeto(cuenta, 'cuenta').then(() => {

      this.pedidoActivo.estadoPedido = 'cuentaPagada';
      const coleccion = this.auth.usuarioIngresado.tipoPedido === 'delivery' ? 'delivery' : 'pedidos';
      this.db.ModificarObjeto(this.pedidoActivo, coleccion);

      this.db.enviarNotificacion('dueño', {
        titulo: 'Pago Recibido',
        cuerpo: `Cliente ${cuenta.cliente} abonó $${cuenta.total}`
      });
      this.db.enviarNotificacion('mesero', {
        titulo: 'Pago Recibido',
        cuerpo: `Cliente ${cuenta.cliente} abonó $${cuenta.total}`
      });


      this.isLoading = false;
      Swal.fire({
        icon: 'success',
        title: this.diccionario[this.idioma()]['PagoExitoso'],
        text: this.diccionario[this.idioma()]['Graciasporsuvisita'],
        background: '#333',
        color: '#fff'
      }).then(() => {

        this.router.navigate(['/home']);
      });
    });
  }
}