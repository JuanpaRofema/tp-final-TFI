import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Component, OnInit } from '@angular/core';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { BarcodeScanningModalComponent } from '../../alta-cliente/barcode-scanning-modal.component';
import { ModalController } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/database.service';
import { Router, RouterLink } from '@angular/router';
import { EncuestasService } from 'src/app/services/encuestas.service';
import { LensFacing } from '@capacitor-mlkit/barcode-scanning';
import Swal from 'sweetalert2';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-recibe-pedido',
  templateUrl: './recibe-pedido.component.html',
  styleUrls: ['./recibe-pedido.component.scss'],
  imports: [FontAwesomeModule, RouterLink],
  standalone: true,
})
export class RecibePedidoComponent {
  faArrowLeft = faArrowLeft;
  scanResult = '';
  subscription: Subscription | null = null;
  subscriptionPedido: Subscription | null = null;

  mostrarEncuesta: boolean = false;
  mostrarCuenta: boolean = false;
  pedido:any


  constructor(
    protected auth: AuthService,
    private modalController: ModalController,
    protected db: DatabaseService,
    protected router: Router,
    protected encuestas: EncuestasService
  ) {
    const observablePedido  = this.db.traerPedidos();
    this.subscriptionPedido = observablePedido.subscribe((pedido) =>{
      this.pedido = pedido;
    });

  }

  async starScan() {
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
      this.scanResult = data?.barcode?.displayValue;

      if (this.scanResult === `mesa-${this.auth.usuarioIngresado.estadoMesa}`) {
      } else if (
        this.scanResult !== `mesa-${this.auth.usuarioIngresado.estadoMesa}`
      ) {
        Swal.fire({
          heightAuto: false,
          title: `Esta no es la mesa asignada, su mesa es: ${this.auth.usuarioIngresado.estadoMesa}`,
          background: '#333',
          color: '#fff',
          confirmButtonColor: '#780000',
          confirmButtonText: 'Aceptar',
        });
      }
    }
  }

  verificarAcceso() {
    if (this.auth.usuarioIngresado.encuestaCompletada) {
      Swal.fire({
        heightAuto: false,
        title: `Ya completó la encuesta`,
        background: '#333',
        color: '#fff',
        cancelButtonColor: '#bf813f',
        confirmButtonColor: '#780000',
        showCancelButton: true,
        cancelButtonText: 'Ver resultados',
        confirmButtonText: 'Aceptar',
      }).then((resp) => {
        console.log(resp);
        if (resp.isDismissed) {
          this.router.navigateByUrl('/resultado-encuestas-cliente');
        }
      });
    } else {
      this.mostrarCuenta = true;
      this.router.navigateByUrl('encuesta-cliente');
    }
  }

  pedirCuenta() {
    let pedidoCliente
    this.pedido.forEach((p: any )=> {
      if(p.cliente === this.auth.usuarioIngresado.nombre){
        pedidoCliente = p
      }
    });
    this.auth.usuarioIngresado.estadoPedido = 'cuentaSolicitada';
    this.db.ModificarObjeto(this.auth.usuarioIngresado, 'clientes');
      this.db.enviarNotificacion('mesero', {
                    titulo: 'Cuenta solicitada',
                    cuerpo: `La mesa ${this.auth.usuarioIngresado.estadoMesa} solicitó la cuenta`,
                    mesa: this.auth.usuarioIngresado.estadoMesa,
                    noRedirigir: true,
                    cliente: this.auth.usuarioIngresado,
                    pedido: pedidoCliente
                  })
      .then((resp) => {
        this.router.navigateByUrl('/pedir-cuenta');
      });
  }
}
