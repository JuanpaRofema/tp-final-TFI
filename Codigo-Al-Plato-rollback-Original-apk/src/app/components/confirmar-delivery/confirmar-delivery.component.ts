import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import { Subscription, firstValueFrom } from 'rxjs'; 
import { pushService } from 'src/app/services/serviciosPush/push-notifications.service';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faMapMarkerAlt, faClock, faUtensils, faMotorcycle } from '@fortawesome/free-solid-svg-icons'; 
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-confirmar-delivery',
  templateUrl: './confirmar-delivery.component.html',
  styleUrls: ['./confirmar-delivery.component.scss'],
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink, IonicModule]
})
export class ConfirmarDeliveryComponent implements OnInit {

  faArrowLeft = faArrowLeft;
  faMapMarkerAlt = faMapMarkerAlt;
  faClock = faClock;
  faUtensils = faUtensils;
  faMotorcycle = faMotorcycle;

  pedidosPendientes: any[] = [];
  pedidosListos: any[] = []; 
  isLoading: boolean = true;
  subscription: Subscription | null = null;

  constructor(
    protected auth: AuthService, 
    protected db: DatabaseService,
    private pushService: pushService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    const observable = this.db.traerDelivery();

    this.subscription = observable.subscribe((resultado:any[]) => {
    
      this.pedidosPendientes = (resultado as any[]).filter((doc) => doc.estadoDelivery === 'pendiente');
      console.log(this.pedidosPendientes)

      this.pedidosListos = resultado.filter((doc) => 
          doc.estadoDelivery === 'aceptado' && 
          doc.cocinaFinalizada === true && 
          (doc.barFinalizado === true || !doc.productos.some((p: any) => p.tipoProducto === 'bebida'))
      );

      this.isLoading = false;
    });
  }


  async aceptarPedido(pedido: any) {
    

    const confirm = await Swal.fire({
        title: '¿Aceptar pedido?',
        text: `Cliente: ${pedido.cliente} - Total: $${pedido.total}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, Aceptar',
        confirmButtonColor: '#4caf50',
        cancelButtonText: 'Cancelar',
        cancelButtonColor: '#d33',
        background: '#333',
        color: '#fff',
        heightAuto: false
    });

    if (!confirm.isConfirmed) return;

    this.isLoading = true;

    try {
        
        await this.db.enviarNotificacion('chef', {
            titulo: 'Nuevo Delivery',
            cuerpo: `Hay un pedido de delivery para preparar.`,
        });

        
        await this.db.enviarNotificacion('bartender', {
            titulo: 'Nuevo Delivery',
            cuerpo: `Hay bebidas de delivery para preparar.`,
        });

       
        await this.pushService.send(
             'Pedido Aceptado',
             `Tu pedido está en preparación. Tiempo aprox: ${pedido.tiempoEstimado} min.`,
             '', 
        );

       
        pedido.estadoPedido = 'enPreparacion'; 
        pedido.estadoDelivery = 'aceptado'; 
        
        await this.db.ModificarObjeto(pedido, 'delivery');

        Swal.fire({
            title: '¡Pedido Enviado a Cocina!',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: '#333', 
            color: '#fff'
        });

    } catch (e) {
        console.error(e);
    } finally {
        this.isLoading = false;
    }
  }

  async rechazarPedido(pedido: any) {
      const { value: motivo } = await Swal.fire({
          title: 'Rechazar Delvery',
          input: 'text',
          inputPlaceholder: 'Ej: Falta de stock / Cocina cerrada',
          showCancelButton: true,
          confirmButtonText: 'Rechazar',
          confirmButtonColor: '#d33',
          background: '#333', color: '#fff'
      });

      if (!motivo) return; 

      this.isLoading = true;

      await this.db.enviarNotificacion('cliente', {
        titulo: 'Pedido Rechazado',
        cuerpo: `Motivo: ${motivo}. Por favor modifique su pedido.`,
        cliente: pedido.cliente 
    });

      pedido.productos = []; 
      pedido.estadoDelivery = 'cancelado';
      pedido.estadoPedido = 'cancelado';
      pedido.motivoRechazo = motivo;

      await this.db.ModificarObjeto(pedido, 'delivery');

      await this.actualizarEstadoCliente(pedido.cliente, 'cancelado');

      
 

      this.isLoading = false;
  }
  

  async actualizarEstadoCliente(nombreCliente: string, nuevoEstado: string) {
      try {
  
        const clientes = await firstValueFrom(this.db.TraerUsuario('clientes'));
        
  
        const clienteEncontrado: any = (clientes as any[]).find(c => c.nombre === nombreCliente);
  
        if (clienteEncontrado) {
          clienteEncontrado.estadoPedido = nuevoEstado;
          await this.db.ModificarObjeto(clienteEncontrado, 'clientes');
          console.log(`Estado del cliente ${nombreCliente} actualizado a: ${nuevoEstado}`);
        } else {
          console.warn(`Cliente ${nombreCliente} no encontrado.`);
        }
      } catch (error) {
        console.error('Error actualizando cliente:', error);
      }
    }
  

  async entregarAlDelivery(pedido: any) {
    
    const confirm = await Swal.fire({
        title: '¿Entregar al repartidor?',
        text: `El pedido de ${pedido.cliente} está listo.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, Entregar',
        confirmButtonColor: '#d84f45',
        background: '#333',
        color: '#fff',
        heightAuto: false
    });

    if (!confirm.isConfirmed) return;

    this.isLoading = true;

    try {
       
        pedido.estadoDelivery = 'confirmado'; 
        pedido.estadoPedido = 'porEntregar';

        await this.db.ModificarObjeto(pedido, 'delivery');

       
        await this.db.enviarNotificacion('delivery', {
            titulo: '¡Pedido Listo!',
            cuerpo: `Tienes un pedido nuevo para retirar y entregar a ${pedido.cliente}.`,
        });

        Swal.fire({
            title: '¡Entregado al Delivery!',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: '#333', 
            color: '#fff'
        });

    } catch (e) {
        console.error(e);
    } finally {
        this.isLoading = false;
    }
  }
}