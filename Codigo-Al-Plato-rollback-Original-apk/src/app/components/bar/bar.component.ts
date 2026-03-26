import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faGlassMartiniAlt, faClock, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss'], // Usa el mismo SCSS o uno nuevo
  standalone: true,
  imports: [FontAwesomeModule, RouterLink, CommonModule],
})
export class BarComponent implements OnInit { 
  
  faArrowLeft = faArrowLeft;
  faGlassMartiniAlt = faGlassMartiniAlt;
  faClock = faClock;
  faCheckCircle = faCheckCircle;

  pedidos: any[] = [];
  subscription: Subscription | null = null;
  isLoading: boolean = true;

  constructor(protected auth: AuthService, protected db: DatabaseService) {}

  ngOnInit() { 
    this.isLoading = true;
    setTimeout(() => { if(this.isLoading && this.pedidos.length === 0) this.isLoading = false; }, 900);

    const observable = this.db.TraerUsuario('pedidos');

    this.subscription = observable.subscribe((resultado) => {

      this.pedidos = (resultado as any[]).filter(
        (pedido) =>
          pedido.productos.some((prod: any) => prod.tipoProducto === 'bebida') &&
          !pedido.barFinalizado &&
          pedido.estadoPedido === 'enPreparacion'
      );
      this.isLoading = false;
    });
  }

  async finalizarPedido(pedido: any) {
    this.isLoading = true;
    pedido.barFinalizado = true;


    const tieneComida = pedido.productos.some((p: any) => p.tipoProducto === 'comida');
    const cocinaTermino = pedido.cocinaFinalizada || !tieneComida;

    await this.db.enviarNotificacion('mesero', {
      titulo: 'Bar Finalizado',
      cuerpo: `Mesa ${pedido.mesa}: Bebidas listas.`,
      pedidoEnProduccion: true,
      barFinalizado: true,
      cocinaFinalizada: pedido.cocinaFinalizada,
      noRedirigir: true,
      mesa: pedido.mesa,
    });

    if (pedido.barFinalizado && cocinaTermino) {
      pedido.estadoPedido = 'porEntregar';
    }
    
    await this.db.ModificarObjeto(pedido, 'pedidos');

    this.isLoading = false;

    Swal.fire({
      title: '¡Bebidas Listas!',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      background: '#333', color: '#fff'
    });
  }
}