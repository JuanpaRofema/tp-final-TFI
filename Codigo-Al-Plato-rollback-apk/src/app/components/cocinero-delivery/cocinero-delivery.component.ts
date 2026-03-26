import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faUtensils, faClock, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { CambioIdioma } from 'src/app/services/cambio-idioma';
import { DICCIONARIO } from 'src/assets/diccionario';
import { TraducirComidasPipe } from 'src/app/pipes/traducir-comidas.pipe';

@Component({
  selector: 'app-cocinero-delivery',
  templateUrl: './cocinero-delivery.component.html',
  styleUrls: ['./cocinero-delivery.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, RouterLink, CommonModule, TraducirComidasPipe],
})
export class CocineroDeliveryComponent implements OnInit {

  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)

  faArrowLeft = faArrowLeft;
  faUtensils = faUtensils;
  faClock = faClock;
  faCheckCircle = faCheckCircle;

  pedidos: any[] = [];
  subscription: Subscription | null = null;
  isLoading: boolean = true;

  constructor(protected auth: AuthService, protected db: DatabaseService) { }

  ngOnInit() {
    console.clear()
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
    this.isLoading = true;
    const observable = this.db.traerDelivery();

    this.subscription = observable.subscribe((resultado) => {

      this.pedidos = (resultado as any[]).filter(
        (pedido) =>
          pedido.productos.some((p: any) => p.tipoProducto === 'comida' || p.tipoProducto === 'postre') &&
          !pedido.cocinaFinalizada &&
          pedido.estadoDelivery === 'aceptado'
      );
      this.isLoading = false;
    });
  }

  async finalizarPedido(pedido: any) {

    this.isLoading = true;
    pedido.cocinaFinalizada = true;


    const tieneBebidas = pedido.productos.some((p: any) => p.tipoProducto === 'bebida');
    const barTermino = pedido.barFinalizado || !tieneBebidas;

    await this.db.ModificarObjeto(pedido, 'delivery');


    if (pedido.cocinaFinalizada && barTermino) {


      await this.db.enviarNotificacion('dueño', {
        titulo: 'Pedido Listo para Entregar',
        cuerpo: `El pedido de ${pedido.cliente} está listo en cocina y barra.`,
        pedidoId: pedido.id
      });
      await this.db.enviarNotificacion('supervisor', {
        titulo: 'Pedido Listo para Entregar',
        cuerpo: `El pedido de ${pedido.cliente} está listo.`,
      });

      Swal.fire({
        title: this.diccionario[this.idioma()]['PedidoFinalizado'],
        text: this.diccionario[this.idioma()]['SehanotificadoalDueñoparalaentrega'],
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: '#333',
        color: '#fff'
      });
    } else {

      Swal.fire({
        title: this.diccionario[this.idioma()]['CocinaFinalizada'],
        text: this.diccionario[this.idioma()]['Esperandoalsectordebebidas'],
        icon: 'info',
        timer: 1500,
        showConfirmButton: false,
        background: '#333',
        color: '#fff'
      });
    }

    this.isLoading = false;
  }
}