import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faUtensils, faCheckCircle, faClock, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import { PedidoService } from 'src/app/services/pedido.service';
import { CommonModule } from '@angular/common';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

@Component({
  selector: 'app-listado-productos-pendientes-mozo',
  templateUrl: './listado-productos-pendientes-mozo.component.html',
  styleUrls: ['./listado-productos-pendientes-mozo.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, RouterLink, CommonModule],
})
export class ListadoProductosPendientesMozoComponent implements OnInit {
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)
  // Iconos
  faArrowLeft = faArrowLeft;
  faUtensils = faUtensils;
  faCheckCircle = faCheckCircle;
  faClock = faClock;
  faClipboardList = faClipboardList;

  pedidos: any[] = [];
  subscription: Subscription | null = null;
  isLoading: boolean = true; // 🔥 Spinner activo

  constructor(
    protected auth: AuthService,
    protected db: DatabaseService,
    private pedidoService: PedidoService
  ) { }

  ngOnInit(): void {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
    this.isLoading = true;


    setTimeout(() => { if (this.isLoading && this.pedidos.length === 0) this.isLoading = false; }, 1000);

    const observable = this.db.traerPedidos();

    this.subscription = observable.subscribe((resultado) => {

      this.pedidos = (resultado as any[]).filter((doc) => doc.estadoPedido === 'porEntregar');
      this.isLoading = false;
    });
  }

  async confirmarEntrega(pedido: any) {
    this.isLoading = true;

    pedido.estadoPedido = 'entregado';

    await this.db.ModificarObjeto(pedido, 'pedidos');


    this.pedidoService.setMostrarInfo(false);

    this.isLoading = false;

    Swal.fire({
      title: this.diccionario[this.idioma()]['PedidoEntregado'],
      text: `${this.diccionario[this.idioma()]['ElclientedelaMesa']} ${pedido.mesa} ${this.diccionario[this.idioma()]['yatienesupedido']}`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      background: '#333',
      color: '#fff'
    });
  }
}