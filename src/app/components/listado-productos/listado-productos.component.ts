import { IonicModule, ViewWillEnter, ViewDidLeave } from '@ionic/angular';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DeviceMotion, DeviceMotionAccelerationData } from '@ionic-native/device-motion/ngx';
import { Subject, interval, Subscription } from 'rxjs';
import {
  faArrowLeft,
  faRightFromBracket,
  faMobileScreen
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import { pushService } from 'src/app/services/serviciosPush/push-notifications.service';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

@Component({
  selector: 'app-listado-productos',
  templateUrl: './listado-productos.component.html',
  styleUrls: ['./listado-productos.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, FontAwesomeModule],
  providers: [DeviceMotion],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ListadoProductosComponent implements OnInit, ViewWillEnter, ViewDidLeave {

  faArrowLeft = faArrowLeft;
  faRightFromBracket = faRightFromBracket;
  faMobileScreen = faMobileScreen;
  productoSeleccionado: any | null = null;
  imagenModal: string | null = null;

  productsComida: any[] = [];
  productsBebida: any[] = [];
  productsPostres: any[] = [];
  productsComidaGeneral: any[] = [];
  productsBebidaGeneral: any[] = [];
  productsPostresGeneral: any[] = [];
  carrito: any[] = [];

  totalPrecio: number = 0;
  tiempoEstimado: number = 0;
  seleccionCarrito: boolean = false;
  isLoading: boolean = true;

  productoDestacado: any | null = null;
  fotoActualIndex: number = 1;
  cooldown: boolean = false;
  motionSub: Subscription | null = null;
  shakeCountDerech = 0;
  shakeCountIzq = 0;
  shakeWindowStart = 0;

  sensorFotosActivo: boolean = false;

  private subscriptionPush: Subscription | null = null;
  ultimoIdMostrado: string | null = null;
  spinnerSub: Subscription | null = null;

  isModalOpen: boolean = false;
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)
  constructor(
    protected router: Router,
    private auth: AuthService,
    private db: DatabaseService,
    private pushService: pushService,
    private deviceMotion: DeviceMotion
  ) { }

  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => {this.idioma.set(data[0])
            this.productsComida = this.transform(this.productsComidaGeneral,1)
      this.productsBebida = this.transform(this.productsBebidaGeneral,2)
      this.productsPostres = this.transform(this.productsPostresGeneral,3)
    })
    this.db.spinner$.subscribe((val) => this.isLoading = val);
    this.cargarProductos();
    
  }

  toggleSensorFotos() {
    this.sensorFotosActivo = !this.sensorFotosActivo;

    const estado = this.sensorFotosActivo ? 'ACTIVADO' : 'DESACTIVADO';
    console.log(`Sensor de movimiento: ${estado}`);
  }
transform(value: any, numero: number): any {
  // Protección por si la lista viene vacía
  if (!value) return value;

  let idioma: any = this.cambioIdioma.mensajeSource.value[0];
  idioma = String(idioma);
  
  let categoriaSeleccionada = "";

  // 1. TUS 3 IFs para decidir qué lista del diccionario usar
  if (numero === 1) {
    categoriaSeleccionada = "menu_comida";
  } else if (numero === 2) {
    categoriaSeleccionada = "menu_bebida";
  } else if (numero === 3) {
    categoriaSeleccionada = "menu_postre";
  }

  // Si no elegimos ninguna categoría válida, devolvemos la lista tal cual
  if (categoriaSeleccionada === "") return value;

  // 2. Recorremos y traducimos usando la categoría que ganamos en los IFs
  value.forEach((producto: any, i: any) => {
    // Recuperamos la traducción específica para ese índice
    const traduccion = DICCIONARIO[idioma][categoriaSeleccionada][i];

    // Verificamos que exista traducción para no romper el código
    if (traduccion) {
      producto.name = traduccion.nombre;
      producto.description = traduccion.descripcion;
    }
  });

  return value;
}
  cargarProductos() {
    this.isLoading = true;
    this.db.TraerObjeto('productos').subscribe((productos: any[]) => {

      const prods = productos.map(p => ({ ...p, cantidad: 0, fotoActiva: 1 }));
      console.log("LOS PRODUCTOS SON ESTE FORMATO "+prods)

      this.productsComidaGeneral = prods.filter(p => p.tipoProducto === 'comida');
      this.productsBebidaGeneral = prods.filter(p => p.tipoProducto === 'bebida');
      this.productsPostresGeneral = prods.filter(p => p.tipoProducto === 'postre');
      this.productsComida = this.transform(this.productsComidaGeneral,1)
      this.productsBebida = this.transform(this.productsBebidaGeneral,2)
      this.productsPostres = this.transform(this.productsPostresGeneral,3)


      if (this.productsComida.length > 0) {
        this.destacarProducto(this.productsComida[0]);
      }
      this.isLoading = false;
    });
  }

  ionViewWillEnter() {
    this.iniciarEscuchaPush();
    this.iniciarSensor();

  }

  modificarCantidad(producto: any, operacion: number) {
    if (producto.cantidad + operacion < 0) return;


    this.destacarProducto(producto);

    producto.cantidad += operacion;
    this.actualizarCarrito(producto);
  }

  actualizarCarrito(producto: any) {
    const index = this.carrito.findIndex(p => p.name === producto.name);
    if (producto.cantidad > 0) {
      if (index === -1) this.carrito.push(producto);
      else this.carrito[index] = producto;
    } else {
      if (index !== -1) this.carrito.splice(index, 1);
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

  destacarProducto(producto: any) {
    this.productoDestacado = producto;
    this.fotoActualIndex = producto.fotoActiva || 1;
  }

  iniciarSensor() {

    this.motionSub = interval(300).subscribe(() => {
      this.deviceMotion.getCurrentAcceleration().then(
        (acc: DeviceMotionAccelerationData) => this.procesarMovimiento(acc),
        (err) => console.log('Error sensor:', err)
      );
    });
  }

  procesarMovimiento(acc: DeviceMotionAccelerationData) {
    if (this.cooldown) return;

    const x = acc.x;
    const y = acc.y;

    // Umbrales
    console.log(x, 'soy x')
    console.log(y, 'soy y')

    const umbralFoto = 3;
    const umbralProdAr = 8;
    const umbralProdAb = 4;

    if (!this.isModalOpen || !this.productoDestacado) return;

    if (this.sensorFotosActivo) {


      if (x > umbralFoto) {
        this.cambiarFoto(-1);
        this.activarCooldown(900);
      } else if (x < -umbralFoto) {
        this.cambiarFoto(1);
        this.activarCooldown(900);
      }


    }

    if (x > 5) {
      this.shakeCountDerech++;
    } else if (x < -5) {
      this.shakeCountIzq++;
    }

    if (this.shakeCountDerech > 2 && this.shakeCountIzq > 2) {
      this.volverPrimerProducto();
      this.shakeCountDerech = 0;
      this.shakeCountIzq = 0;
      this.activarCooldown(2000);
    }
    if (y > umbralProdAr) {
      this.cambiarProductoDestacado(1);
      this.activarCooldown(1500);
    } else if (y < (umbralProdAb * -1)) {
      this.cambiarProductoDestacado(-1);
      this.activarCooldown(1500);
    }

  }

  activarCooldown(tiempo = 900) {
    this.cooldown = true;
    setTimeout(() => this.cooldown = false, tiempo);
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

  cambiarProductoDestacado(direccion: number) {
    let lista: any[] = [];
    let tipo = '';


    if (this.productsComida.includes(this.productoDestacado)) {
      lista = this.productsComida;
      tipo = 'comida';
    } else if (this.productsBebida.includes(this.productoDestacado)) {
      lista = this.productsBebida;
      tipo = 'bebida';
    } else if (this.productsPostres.includes(this.productoDestacado)) {
      lista = this.productsPostres;
      tipo = 'postre';
    }

    if (lista.length === 0) return;

    const index = lista.indexOf(this.productoDestacado);
    let nuevoIndex = index + direccion;


    if (nuevoIndex >= lista.length) nuevoIndex = 0;
    if (nuevoIndex < 0) nuevoIndex = lista.length - 1;

    this.destacarProducto(lista[nuevoIndex]);

    this.fotoActualIndex = 1;
    this.productoDestacado.fotoActiva = 1;

    const idElemento = `${tipo}-${nuevoIndex}`;
    this.scrollearAElemento(idElemento);
  }

  scrollearAElemento(id: string) {
    setTimeout(() => {
      const elemento = document.getElementById(id);
      if (elemento) {
        elemento.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    }, 100);
  }

  volverPrimerProducto() {
    if (this.productsComida.length > 0) this.destacarProducto(this.productsComida[0]);
    Swal.fire({
      title: this.diccionario[this.idioma()]['Resetpormovimiento'],
      toast: true,
      position: 'top-end',
      timer: 1500,
      showConfirmButton: false
    });
  }

  ionViewDidLeave() {
    if (this.subscriptionPush) this.subscriptionPush.unsubscribe();
    if (this.motionSub) this.motionSub.unsubscribe();


    if (this.spinnerSub) {
      this.spinnerSub.unsubscribe();
    }
  }

  iniciarEscuchaPush() {

    const rol = this.auth.usuarioIngresado.tipoCliente;
    const observable = this.db.traerNotificacion(rol);

    this.subscriptionPush = observable.subscribe((resultado: any[]) => {
      if (!resultado || resultado.length === 0) return;

      const ultimaNotificacion: any = resultado[0];
      const titulo = ultimaNotificacion.titulo ? ultimaNotificacion.titulo.toLowerCase() : '';

      if (!ultimaNotificacion.recibida && (titulo.includes('rechazado') || titulo.includes('cancelado'))) {
        console.log('Notificación de rechazo/cancelación detectada. Marcando como recibida en DB.');

        this.db.actualizarNotificacion(
          rol,
          ultimaNotificacion.id,
          { recibida: true }
        );


        return;
      }

      let debeMostrarPush = false;
      if (this.ultimoIdMostrado !== ultimaNotificacion.id) {
        this.ultimoIdMostrado = ultimaNotificacion.id;
        debeMostrarPush = true;
      }


      if (!ultimaNotificacion.recibida && debeMostrarPush) {

        this.pushService.send(
          ultimaNotificacion.titulo,
          ultimaNotificacion.cuerpo,
          '/chat',
          true,
          '',
          'abrirChat'
        );

        this.db.actualizarNotificacion(
          rol,
          ultimaNotificacion.id,
          { recibida: true }
        );
      }
    });
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

  agregarAlCarrito(): void {
    if (this.productoSeleccionado) {
      this.productoSeleccionado.cantidad += 1;

      const yaEnCarrito = this.carrito.find(p => p.name === this.productoSeleccionado.name);
      if (!yaEnCarrito) {
        this.carrito.push(this.productoSeleccionado);
      }

      this.totalPrecio += parseFloat(this.productoSeleccionado.precio);
      const tiempoProducto = parseInt(this.productoSeleccionado.tiempoEstimado);
      this.tiempoEstimado = this.carrito.length === 1
        ? tiempoProducto
        : Math.max(this.tiempoEstimado, tiempoProducto);

      this.cerrarDetalle();
    }
  }

  async guardarPedido() {
    if (this.carrito.length === 0) return;

    this.isLoading = true;


    if (!this.db.mesa) {
      Swal.fire(
        this.diccionario[this.idioma()]['Error'],
        this.diccionario[this.idioma()]['NosedetectóelnúmerodemesaEscaneaelQRnuevamente'],
        'error'
      );
      this.isLoading = false;
      return;
    }

    try {
      const str: any = this.db.mesa;
      const numero: any = str.match(/\d+/)[0];

      const pedido = {
        cliente: this.auth.usuarioIngresado.nombre,
        mesa: numero,
        total: this.totalPrecio,
        productos: this.carrito,
        estadoPedido: 'porAceptar',
        tiempoEstimado: this.tiempoEstimado,
        fecha: Date.now()
      };


      await this.db.enviarNotificacion('mesero', {
        titulo: 'Nuevo pedido',
        cuerpo: `Cliente realizó un pedido en la mesa ${numero}`,
        mesa: this.db.mesa,
      });

      await this.db.guardarObjeto(pedido, 'pedidos');

      this.auth.usuarioIngresado.tipoPedido = 'presencial';
      await this.db.ModificarObjeto(this.auth.usuarioIngresado, 'clientes');

      Swal.fire({
        title: this.diccionario[this.idioma()]['PedidoEnviado'],
        text: this.diccionario[this.idioma()]['Elmozoloconfirmarápronto'],
        icon: 'success',
        background: '#333',
        color: '#fff',
        confirmButtonColor: '#780000',
        heightAuto: false
      });

      this.cerrarCarrito();
      this.totalPrecio = 0;
      this.tiempoEstimado = 0;
      this.carrito.forEach(producto => producto.cantidad = 0);
      this.carrito = [];


      this.router.navigateByUrl('/cliente-espera-pedido');

    } catch (e) {
      console.error(e);
      Swal.fire(
        this.diccionario[this.idioma()]['Error'],
        this.diccionario[this.idioma()]['Hubounproblemaalguardarelpedido'],
        'error'
      );
    } finally {

      this.isLoading = false;
    }
  }

  viajarChat() {
    this.router.navigate(['/chat'], { queryParams: { mesa: this.db.mesa } });
  }

  backHome() {
    this.router.navigate(['/home']);
  }


  obtenerListaActual() {
    if (this.productsComida.includes(this.productoSeleccionado)) return this.productsComida;
    if (this.productsBebida.includes(this.productoSeleccionado)) return this.productsBebida;
    if (this.productsPostres.includes(this.productoSeleccionado)) return this.productsPostres;
    return null;
  }


  abrirModal(producto: any) {
    this.productoDestacado = producto;
    this.fotoActualIndex = 1;
    this.productoDestacado.fotoActiva = 1;
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.productoDestacado = null;
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