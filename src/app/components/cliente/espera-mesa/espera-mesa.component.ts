import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faChair,
  faQrcode,
  faUtensils,
  faClipboardList,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from 'src/app/services/auth.service';
import { IonicModule, ModalController, ViewDidLeave } from '@ionic/angular';
import { BarcodeScanningModalComponent } from '../../alta-cliente/barcode-scanning-modal.component';
import { LensFacing } from '@capacitor-mlkit/barcode-scanning';
import Swal from 'sweetalert2';
import { DatabaseService } from 'src/app/services/database.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { pushService } from 'src/app/services/serviciosPush/push-notifications.service';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

@Component({
  selector: 'app-espera-mesa',
  templateUrl: './espera-mesa.component.html',
  styleUrls: ['./espera-mesa.component.scss'],
  imports: [RouterLink, FontAwesomeModule, CommonModule, IonicModule],
  standalone: true,
})
export class EsperaMesaComponent implements OnInit, ViewDidLeave {

  faArrowLeft = faArrowLeft;
  faCheck = faCheck;
  faChair = faChair;
  faQrcode = faQrcode;
  faUtensils = faUtensils;
  faClipboardList = faClipboardList;
  faClock = faClock;

  subscription4: Subscription | null = null;

  isLoading: boolean = true;
  pasoActual: number = 1;
  mensajeEstado: string = 'Buscando mesa...';
  mesaAsignada: any = null;

  scanResult = '';
  subscription: Subscription | null = null;

  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)
  constructor(
    protected auth: AuthService,
    private modalController: ModalController,
    protected db: DatabaseService,
    protected router: Router,
    private pushService: pushService
  ) { }

  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))

    this.isLoading = true;
    setTimeout(() => {

      if (this.isLoading && this.pasoActual === 1) this.isLoading = false;
    }, 1500);


    const estadoMesa = this.auth.usuarioIngresado.estadoMesa;
    if (estadoMesa === 'solicitada' || estadoMesa === 'sin-pedir') {
      this.pasoActual = 1;
      this.mensajeEstado = 'Estás en lista de espera.';
    } else if (String(estadoMesa).includes('mesa-') || !isNaN(Number(estadoMesa))) {
      this.pasoActual = 2;
      this.mensajeEstado = `¡Mesa asignada!`;
    }


    const observable = this.db.traerMesas();

    this.subscription = observable.subscribe((mesas: any[]) => {

      const mesaEncontrada = mesas.find((m: any) =>
        m.estado === 'ocupada' && m.ocupadaPor === this.auth.usuarioIngresado.nombre
      );

      if (mesaEncontrada) {
        if (this.pasoActual === 1) {

          this.isLoading = true;

          setTimeout(() => {
            this.mesaAsignada = mesaEncontrada;

            if (this.auth.usuarioIngresado.estadoMesa !== mesaEncontrada.numero) {
              this.auth.usuarioIngresado.estadoMesa = mesaEncontrada.numero;
            }

            this.pasoActual = 2;
            this.mensajeEstado = `¡Tu mesa es la #${mesaEncontrada.numero}!`;

            this.isLoading = false;

            Swal.fire({
              title: this.diccionario[this.idioma()]['MesaAsignada'],
              text: `${this.diccionario[this.idioma()]['PorfavordirígetealaMesa']} ${mesaEncontrada.numero}`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false,
              background: '#333',
              color: '#fff',
              toast: true,
              position: 'top'
            });

          }, 500);
        }
        else if (this.pasoActual === 2) {
          this.mesaAsignada = mesaEncontrada;
          this.isLoading = false;
        }

      } else {

        if (this.auth.usuarioIngresado.estadoMesa === 'solicitada') {
          this.pasoActual = 1;
          this.mensajeEstado = 'Aguarde al Maitre...';
          if (this.pasoActual === 1) this.isLoading = false;
        }
      }
    });

    if (this.subscription4) return;

    const observableClientes = this.db.traerNotificacion('cliente');
    this.subscription4 = observableClientes.subscribe((resultado) => {
      if (resultado.length > 0) {
        const ultimaNotificacion: any = resultado[0];

        if (this.auth.usuarioIngresado.tipoCliente === 'cliente' && this.pasoActual !== -1) {
          console.log(ultimaNotificacion);
          if (!ultimaNotificacion.recibida) {

            this.pushService.send(
              ultimaNotificacion.titulo,
              ultimaNotificacion.cuerpo,
              ''
            );
            this.db.actualizarNotificacion('cliente', ultimaNotificacion.id, { recibida: true });
          }
        }
      }
    });
  }

  ionViewDidLeave(): void {
    console.log('👋 Saliendo: Limpiando suscripciones...');
    if (this.subscription4) {
      this.subscription4.unsubscribe();
      this.subscription4 = null;
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
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

        this.pasoActual = 3;
        this.db.mesa = this.scanResult;

        this.isLoading = false;

        Swal.fire({
          icon: 'success',
          title: this.diccionario[this.idioma()]['MesaConfirmada'],
          text: this.diccionario[this.idioma()]['Accediendoalmenú'],
          timer: 1500,
          showConfirmButton: false,
          background: '#333',
          color: '#fff'
        }).then(() => {
          this.router.navigate(['/listado-productos']);
        });

      } else {
        this.isLoading = false;

        Swal.fire({
          title: this.diccionario[this.idioma()]['MesaIncorrecta'],
          text: `${this.diccionario[this.idioma()]['EstásescaneandootramesaTumesaesla']} ${this.auth.usuarioIngresado.estadoMesa}.`,
          icon: 'error',
          background: '#333',
          color: '#fff',
          confirmButtonColor: '#d33'
        });
      }
    }
  }

  verEncuestas() {
    this.router.navigateByUrl('/resultado-encuestas-cliente');
  }

  volver() {
    this.router.navigate(['/home']);
  }
}