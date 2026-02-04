import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DatabaseService } from 'src/app/services/database.service';
import { AuthService } from 'src/app/services/auth.service';
import { PedidoService } from 'src/app/services/pedido.service';
import { Subscription } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faCommentDots, faFlagCheckered, faMapMarkerAlt, faUser, faBoxOpen, faMotorcycle } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import * as L from 'leaflet';
import { pushService } from 'src/app/services/serviciosPush/push-notifications.service';
import { ViewDidLeave } from '@ionic/angular';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';


delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/marker-icon-2x.png',
  iconUrl: 'assets/marker-icon.png',
  shadowUrl: 'assets/marker-shadow.png',
});

@Component({
  selector: 'app-mapa-delivery',
  templateUrl: './mapa-delivery.component.html',
  styleUrls: ['./mapa-delivery.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MapaDeliveryComponent implements AfterViewInit, ViewDidLeave {


  faArrowLeft = faArrowLeft;
  faCommentDots = faCommentDots;
  faFlagCheckered = faFlagCheckered;
  faMapMarkerAlt = faMapMarkerAlt;
  faUser = faUser;
  faBoxOpen = faBoxOpen;
  faMotorcycle = faMotorcycle;

  mostrarNotificacion = true;
  subscription7: Subscription | null = null;

  map!: L.Map;
  latDelivery = -34.6037;
  lngDelivery = -58.3816;

  latCliente!: number;
  lngCliente!: number;
  clienteNombre!: string;
  direccionCliente: string = 'Ubicación del Cliente';

  pedidos: any[] = [];
  pedidoSeleccionado: any | null = null;
  mostrarSheet: boolean = false;
  subscription: Subscription | null = null;
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)
  isLoading: boolean = true;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    protected auth: AuthService,
    protected db: DatabaseService,
    private pedidoService: PedidoService,
    public pushService: pushService
  ) {
    this.subscription = this.db.traerDelivery().subscribe((resultado: any[]) => {
      this.pedidos = resultado.filter(doc => doc.estadoPedido === 'enCamino');
    });

    this.route.queryParams.subscribe(params => {
      if (params['lat'] && params['lng']) {
        this.latCliente = parseFloat(params['lat']);
        this.lngCliente = parseFloat(params['lng']);
        this.clienteNombre = params['cliente'];
        if (params['direccion']) this.direccionCliente = params['direccion'];
      }
    });
  }
  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
  }
  ngAfterViewInit() {

    setTimeout(() => {
      this.initMap();
    }, 500);


    const observableDelivery = this.db.traerNotificacion('delivery');

    this.subscription7 = observableDelivery.subscribe((resultado: any[]) => {
      if (resultado.length === 0) return;

      const ultimaNotificacion: any = resultado[0];
      console.log(ultimaNotificacion);

      if (!ultimaNotificacion.recibida && this.mostrarNotificacion) {
        console.log('LLEGO UNA NOTIFICACION - Delivery');

        this.pushService.send(
          ultimaNotificacion.titulo,
          ultimaNotificacion.cuerpo,
          '/chat-delivery',
          true,
          '',
          'abrirChatDelivery'
        );


        this.db.actualizarNotificacion(
          'delivery',
          ultimaNotificacion.id,
          { recibida: true }
        );

        this.mostrarNotificacion = false;
      }
    });
  }

  ionViewDidLeave(): void {
    if (this.subscription7) {
      this.subscription7.unsubscribe();
      this.subscription7 = null;
    }
  }

  initMap() {
    if (!this.latCliente || !this.lngCliente) {
      this.isLoading = false;
      return;
    }

    this.map = L.map('map', { zoomControl: false }).setView([this.latDelivery, this.lngDelivery], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap, © CartoDB',
      maxZoom: 19
    }).addTo(this.map);

    const iconoMoto = L.icon({
      iconUrl: 'assets/iconos/delivery-icono.png',
      iconSize: [45, 45],
      iconAnchor: [22, 22],
      popupAnchor: [0, -20]
    });

    L.marker([this.latDelivery, this.lngDelivery], { icon: iconoMoto })
      .addTo(this.map)
      .bindPopup('Tú estás aquí');

    const destino = L.latLng(this.latCliente, this.lngCliente);
    L.marker(destino).addTo(this.map)
      .bindPopup(this.clienteNombre)
      .openPopup();

    this.dibujarRuta(L.latLng(this.latDelivery, this.lngDelivery), destino);

    setTimeout(() => this.map.invalidateSize(), 500);
  }

  async dibujarRuta(origen: L.LatLng, destino: L.LatLng) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origen.lng},${origen.lat};${destino.lng},${destino.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes?.[0]) {
        const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
        const polyline = L.polyline(coords, { color: '#ff5722', weight: 6, opacity: 0.8 }).addTo(this.map);
        this.map.fitBounds(polyline.getBounds(), { padding: [50, 150] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }


  toggleModalEntrega() {
    this.mostrarSheet = !this.mostrarSheet;
    if (this.mostrarSheet && this.pedidos.length === 1) {
      this.pedidoSeleccionado = this.pedidos[0];
    } else {
      this.pedidoSeleccionado = null;
    }
  }

  seleccionarParaEntregar(pedido: any) {
    this.pedidoSeleccionado = pedido;
  }

  async entregarProducto() {
    if (!this.pedidoSeleccionado) return;

    const confirm = await Swal.fire({
      title: this.diccionario[this.idioma()]['Confirmarentrega'],
      text: this.diccionario[this.idioma()]['Elpedidopasaráaestadoentregado'],
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.diccionario[this.idioma()]['Síentregar'],
      confirmButtonColor: '#4caf50',
      cancelButtonColor: '#d33',
      background: '#333',
      color: '#fff',
      heightAuto: false
    });

    if (!confirm.isConfirmed) return;

    this.isLoading = true;

    this.pedidoSeleccionado.estadoPedido = 'pedidoEntregado';
    this.pedidoSeleccionado.estadoDelivery = 'entregado';

    await this.db.ModificarObjeto(this.pedidoSeleccionado, 'delivery');
    this.pedidoService.setMostrarInfo(false);

    await this.db.enviarNotificacion('cliente', {
      titulo: '¡Pedido Entregado!',
      cuerpo: 'Gracias por elegirnos. ¡Que lo disfrutes!',
    });

    this.isLoading = false;
    this.toggleModalEntrega();

    Swal.fire({
      title: this.diccionario[this.idioma()]['EntregaExitosa'],
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      background: '#333',
      color: '#fff'
    }).then(() => {
      this.router.navigate(['/home']);
    });
  }

  irAlChat() {
    this.router.navigate(['/chat-delivery']);
  }

  volver() {
    this.router.navigate(['/listado-delivery']);
  }
}