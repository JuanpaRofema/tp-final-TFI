import { IonicModule, ViewDidEnter, ViewDidLeave, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, AfterViewInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLinkActive } from '@angular/router';
import {
  faArrowLeft,
  faRightFromBracket,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Auth } from '@angular/fire/auth';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { pushService } from 'src/app/services/serviciosPush/push-notifications.service';
import firebase from 'firebase/compat/app';
import { GoogleMapsModule } from '@angular/google-maps';
import { CambioIdioma } from 'src/app/services/cambio-idioma';
import { DICCIONARIO } from 'src/assets/diccionario';


@Component({
  selector: 'app-delivery',
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, FontAwesomeModule, GoogleMapsModule, RouterLinkActive],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DeliveryComponent implements ViewWillEnter, ViewDidLeave {
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)
  clientePoneDireccion: boolean = true;
  isLoading: boolean = true;
  faArrowLeft = faArrowLeft;
  faRightFromBracket = faRightFromBracket;
  faMapMarkerAlt = faMapMarkerAlt;
  productoSeleccionado: any | null = null;
  seleccionCarrito: boolean = false;
  carrito: any[] = [];
  totalPrecio: number = 0;
  tiempoEstimado: number = 0;
  imagenModal: string | null = null;
  // cantidad:number = 0;
  productsComida: any[] = [];
  productsBebida: any[] = [];
  productsPostres: any[] = [];
  subscription4: Subscription | null = null;
  mostrarNotificacion = true;
  direccionActual: string = '';

  productoDestacado: any | null = null;
  isModalOpen: boolean = false;
  fotoActualIndex: number = 1;


  constructor(
    protected router: Router,
    private auth: AuthService,
    private db: DatabaseService,
    private pushService: pushService
  ) {


  }
  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
  }
  ionViewWillEnter(): void {

    this.isLoading = true;

    this.direccionActual = this.db.direccion || 'Toca para elegir ubicación 📍';

    this.db.TraerObjeto('productos').subscribe((productos: any[]) => {

      const prods = productos.map(p => ({
        ...p,
        cantidad: 0,
        fotoActiva: 1   // 🔥 ESTO ES CLAVE
      }));

      this.productsComida = prods.filter(p => p.tipoProducto === 'comida');
      this.productsBebida = prods.filter(p => p.tipoProducto === 'bebida');
      this.productsPostres = prods.filter(p => p.tipoProducto === 'postre');

      this.isLoading = false;
    });

    const observableClientes = this.db.traerNotificacion('cliente');
    this.subscription4 = observableClientes.subscribe((resultado) => {
      if (resultado.length > 0) {
        const ultimaNotificacion: any = resultado[0];
        console.log(ultimaNotificacion);
        if (this.auth.usuarioIngresado.tipoCliente === 'cliente') {
          if (!ultimaNotificacion.recibida) {
            this.pushService.send(
              ultimaNotificacion.titulo,
              ultimaNotificacion.cuerpo,
              '/chat-delivery'
            );

            this.db.actualizarNotificacion('cliente', ultimaNotificacion.id, { recibida: true });
          }
        }
      }
    });

  }

  ionViewDidLeave(): void {
    console.log('👋 Saliendo de EsperaPedido: Limpiando todo...');

    if (this.subscription4) {
      this.subscription4.unsubscribe();
      this.subscription4 = null;
    }
  }



  cerrarModal() {
    this.isModalOpen = false;
    this.productoDestacado = null;
  }

  abrirModal(producto: any) {
    this.productoDestacado = producto;
    console.log(this.productoDestacado)
    this.fotoActualIndex = 1;
    this.productoDestacado.fotoActiva = 1;
    this.isModalOpen = true;
  }

  cambiarFoto(direccion: number) {
    let nuevaFoto = this.fotoActualIndex + direccion;


    if (nuevaFoto > 3) nuevaFoto = 1;
    if (nuevaFoto < 1) nuevaFoto = 3;


    if (nuevaFoto === 2 && !this.productoDestacado.image2) nuevaFoto = 1;
    if (nuevaFoto === 3 && !this.productoDestacado.image3) nuevaFoto = 1;

    this.fotoActualIndex = nuevaFoto;
    this.productoDestacado.fotoActiva = nuevaFoto;
  }


  modificarCantidad(producto: any, operacion: number) {

    if (producto.cantidad + operacion < 0) return;

    producto.cantidad += operacion;
    this.actualizarCarrito(producto);
  }

  actualizarCarrito(producto: any) {

    const index = this.carrito.findIndex(p => p.name === producto.name);

    if (producto.cantidad > 0) {
      if (index === -1) {

        this.carrito.push(producto);
      } else {

        this.carrito[index] = producto;
      }
    } else {

      if (index !== -1) {
        this.carrito.splice(index, 1);
      }
    }

    this.calcularTotales();
  }

  calcularTotales() {
    this.totalPrecio = this.carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);


    if (this.carrito.length > 0) {
      this.tiempoEstimado = Math.max(...this.carrito.map(p => parseInt(p.tiempoEstimado || 0)));
    } else {
      this.tiempoEstimado = 0;
    }
  }

  abrirMapa() {
    this.router.navigateByUrl('/map-direccion');
  }



  mostrarDetalle(producto: any): void {
    this.productoSeleccionado = producto;
  }

  cerrarDetalle(): void {
    this.productoSeleccionado = null;
  }

  mostrarDetalleCarrito() {
    if (this.carrito.length !== 0) this.seleccionCarrito = true;
  }

  cerrarCarrito(): void {
    this.seleccionCarrito = false;
  }

  viajarChat() {
    this.router.navigate(['/chat-delivery']);
  }

  backHome() {
    this.router.navigate(['/home']);
  }

  agregarAlCarrito(): void {
    if (this.productoSeleccionado) {
      this.productoSeleccionado.cantidad += 1;

      const yaEnCarrito = this.carrito.find(p => p.name === this.productoSeleccionado.name);
      if (!yaEnCarrito) {
        this.carrito.push(this.productoSeleccionado);
      }

      this.totalPrecio += parseFloat(
        this.productoSeleccionado.precio
      );

      const tiempoProducto = parseInt(this.productoSeleccionado.tiempoEstimado);
      this.tiempoEstimado =
        this.carrito.length === 1
          ? tiempoProducto
          : Math.max(this.tiempoEstimado, tiempoProducto);

      console.log(this.productoSeleccionado.cantidad)
      this.cerrarDetalle();

    }
  }

  async guardarPedido() {
    if (this.carrito.length === 0) {
      Swal.fire(
        this.diccionario[this.idioma()]['Carritovacío'],
        this.diccionario[this.idioma()]['Agregáproductosantesdepedir'],
        'warning'
      );
      return;
    }

    if (!this.db.direccion) {
      Swal.fire(
        this.diccionario[this.idioma()]['Faltadirección'],
        this.diccionario[this.idioma()]['Porfavorseleccionátuubicaciónenelmapaarriba'],
        'warning'
      );
      return;
    }
    this.isLoading = true;

    const pedido = {
      cliente: this.auth.usuarioIngresado.nombre,
      total: this.totalPrecio,
      productos: this.carrito,
      estadoDelivery: 'pendiente',
      estadoPedido: 'porAceptar',
      tiempoEstimado: this.tiempoEstimado,
      longitud: this.db.longitud,
      latitud: this.db.latitud,
      direccion: this.db.direccion,
      nombre: this.auth.usuarioIngresado.nombre,
      apellido: this.auth.usuarioIngresado.apellido,
      foto: this.auth.usuarioIngresado.foto,
      fecha: new Date().getTime(),
      dni: this.auth.usuarioIngresado.dni,
      mostrarSwal: false
    };

    try {
      this.db.guardarObjeto(pedido, 'delivery')
      await this.db.enviarNotificacion('dueño', {
        titulo: this.diccionario[this.idioma()]['Nuevopedido'],
        cuerpo: this.diccionario[this.idioma()]['Clienterealizoundelivery'],
      });

      await this.db.enviarNotificacion('supervisor', {
        titulo: this.diccionario[this.idioma()]['Nuevopedido'],
        cuerpo: this.diccionario[this.idioma()]['Clienterealizoundelivery'],
      });

      this.auth.usuarioIngresado.tipoPedido = 'delivery';
      this.auth.usuarioIngresado.direccion = this.db.direccion
      this.db.ModificarObjeto(this.auth.usuarioIngresado, 'clientes')
      Swal.fire({
        title: this.diccionario[this.idioma()]['PedidoEnviado'],
        text: `${this.diccionario[this.idioma()]['Tiempoaprox']} ${this.tiempoEstimado} ${this.diccionario[this.idioma()]['minEsperálaconfirmación']}`,
        icon: 'success',
        confirmButtonColor: '#780000',
        background: '#333',
        color: '#fff'
      });

      this.cerrarCarrito();
      this.router.navigateByUrl('/cliente-espera-delivery');
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
    this.totalPrecio = 0;
    this.tiempoEstimado = 0;
    this.carrito.forEach(producto => {
      producto.cantidad = 0
    });
    this.carrito = [];
  }

  abrirModalImagen(imagen: string): void {
    this.imagenModal = imagen;
  }

  cerrarModalImagen(): void {
    this.imagenModal = null;
  }

  cambiarFotoCard(producto: any, direccion: number) {
    if (!producto.image2) return;

    if (direccion === 1) {
      producto.fotoActiva = producto.fotoActiva === 3 ? 1 : producto.fotoActiva + 1;
    } else {
      producto.fotoActiva = producto.fotoActiva === 1 ? 3 : producto.fotoActiva - 1;
    }

  }


}
