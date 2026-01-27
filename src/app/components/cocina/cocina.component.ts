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

@Component({
  selector: 'app-cocina',
  templateUrl: './cocina.component.html',
  styleUrls: ['./cocina.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, RouterLink, CommonModule],
})
export class CocinaComponent implements OnInit {
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
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
    this.isLoading = true;
    setTimeout(() => { if (this.isLoading && this.pedidos.length === 0) this.isLoading = false; }, 1000);

    const observable = this.db.TraerUsuario('pedidos');

    this.subscription = observable.subscribe((resultado) => {
      this.pedidos = (resultado as any[]).filter(
        (pedido) =>
          pedido.productos.some((prod: any) =>

            prod.tipoProducto === 'comida' || prod.tipoProducto === 'postre'
          ) &&
          !pedido.cocinaFinalizada &&
          pedido.estadoPedido === 'enPreparacion'
      );
      this.isLoading = false;
    });
  }


  async finalizarPedido(pedido: any) {
    this.isLoading = true;
    pedido.cocinaFinalizada = true;


    let barFinalizado;
    if (pedido.barFinalizado) {
      barFinalizado = true;
    } else {
      barFinalizado = false;
    }


    await this.db.enviarNotificacion('mesero', {
      titulo: this.diccionario[this.idioma()]['Cocinafinalizado'],
      cuerpo: this.diccionario[this.idioma()]['Comidaslistasparaenviar'],
      pedidoEnProduccion: true,
      cocinaFinalizada: true,
      barFinalizado: barFinalizado,
      noRedirigir: true,
      mesa: pedido.mesa,
    });


    if (pedido.cocinaFinalizada && barFinalizado) {
      pedido.estadoPedido = 'porEntregar';
    }

    await this.db.ModificarObjeto(pedido, 'pedidos');

    this.isLoading = false;

    Swal.fire({
      heightAuto: false,
      title: this.diccionario[this.idioma()]['Comidasnotificadas'],
      icon: 'success',
      background: '#333',
      color: '#fff',
      confirmButtonColor: '#780000',
      confirmButtonText: this.diccionario[this.idioma()]['Aceptar']
    });
  }
}