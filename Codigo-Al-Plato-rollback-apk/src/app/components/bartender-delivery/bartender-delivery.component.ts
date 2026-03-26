import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faGlassMartiniAlt, faClock, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';
import { TraducirComidasPipe } from 'src/app/pipes/traducir-comidas.pipe';

@Component({
  selector: 'app-bartender-delivery',
  templateUrl: './bartender-delivery.component.html',
  styleUrls: ['./bartender-delivery.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, RouterLink, CommonModule, TraducirComidasPipe],
})
export class BartenderDeliveryComponent implements OnInit {

  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)

  faArrowLeft = faArrowLeft;
  faGlassMartiniAlt = faGlassMartiniAlt;
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
          pedido.productos.some((p: any) => p.tipoProducto === 'bebida') &&
          !pedido.barFinalizado &&
          pedido.estadoDelivery === 'aceptado'
      );
      this.isLoading = false;
    });
  }

  async finalizarPedido(pedido: any) {
    this.isLoading = true;
    pedido.barFinalizado = true;


    const tieneComida = pedido.productos.some((p: any) => p.tipoProducto === 'comida');
    const cocinaTermino = pedido.cocinaFinalizada || !tieneComida;

    await this.db.ModificarObjeto(pedido, 'delivery');


    if (pedido.barFinalizado && cocinaTermino) {

        await this.db.enviarNotificacion('dueño', {
            titulo: 'Pedido Listo para Entregar',
            cuerpo: `El pedido de ${pedido.cliente} está listo en barra y cocina.`,
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
        title: this.diccionario[this.idioma()]['BebidasListas'],
        text: this.diccionario[this.idioma()]['Esperandoalsectordecocina'],
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