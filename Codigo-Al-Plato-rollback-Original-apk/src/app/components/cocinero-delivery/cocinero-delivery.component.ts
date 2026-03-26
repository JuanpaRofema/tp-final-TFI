import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faUtensils, faClock, faCheckCircle } from '@fortawesome/free-solid-svg-icons'; 
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cocinero-delivery',
  templateUrl: './cocinero-delivery.component.html',
  styleUrls: ['./cocinero-delivery.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, RouterLink, CommonModule],
})
export class CocineroDeliveryComponent implements OnInit {

  faArrowLeft = faArrowLeft;
  faUtensils = faUtensils;
  faClock = faClock;
  faCheckCircle = faCheckCircle;

  pedidos: any[] = [];
  subscription: Subscription | null = null;
  isLoading: boolean = true;

  constructor(protected auth: AuthService, protected db: DatabaseService) {}

  ngOnInit() {
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
            title: 'Pedido Finalizado',
            text: 'Se ha notificado al Dueño para la entrega.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: '#333',
            color: '#fff'
        });
    } else {
        
        Swal.fire({
            title: 'Cocina Finalizada',
            text: 'Esperando al sector de bebidas...',
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