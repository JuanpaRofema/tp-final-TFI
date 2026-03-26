import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { DatabaseService } from './database.service';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  
  // Subjects
  private mostrarInfo = new BehaviorSubject<boolean>(false);
  mostrarInfo$ = this.mostrarInfo.asObservable();

  private pedidoActual = new BehaviorSubject<any>(null);
  pedidoActual$ = this.pedidoActual.asObservable();

  constructor(private db: DatabaseService, private auth: AuthService) {}

  setMostrarInfo(valor: boolean){ this.mostrarInfo.next(valor); }
  setPedidoActual(pedido: any) { this.pedidoActual.next(pedido); }

  escucharPedidoCliente(): Subscription {

    // 1. Verificación básica
    if (!this.auth.usuarioIngresado) {
      console.warn('⛔ PedidoService: No hay usuario logueado.');
      return new Subscription(); 
    }

    const usuario = this.auth.usuarioIngresado;
    const nombreUsuario = usuario.nombre.toLowerCase().trim(); // Normalizamos el nombre
    
    console.log('🔍 Buscando pedidos para:', nombreUsuario);
    console.log('Tipo de pedido del usuario:', usuario.tipoPedido);

    // 2. Lógica para DELIVERY
    // Nota: A veces tipoPedido puede ser undefined, aseguramos que entre si es delivery
    if(usuario.tipoPedido === 'delivery'){
      
      console.log('✅ Entrando en modo DELIVERY');
      
      return this.db.traerDelivery().subscribe((pedidos: any[]) => {
          const pedidoCliente = pedidos.find(p => {
            // Normalizamos el nombre que viene de la BD también
            const nombreBD = p.cliente ? p.cliente.toLowerCase().trim() : '';
            
            const esMismoCliente = nombreBD === nombreUsuario;
            
            // Verificamos estado (Delivery aceptado O Pedido en preparación)
            const estadoValido = 
                p.estadoPedido === 'enPreparacion' || 
                p.estadoPedido === 'listo' ||
                p.estadoDelivery === 'aceptado' ||
                p.estadoDelivery === 'enCamino';

            return esMismoCliente && estadoValido;
          });

          if (pedidoCliente) {
            console.log('🎉 ¡PEDIDO ENCONTRADO!', pedidoCliente);
            this.pedidoActual.next(pedidoCliente);
            this.mostrarInfo.next(true);
          } else {
            console.log('⚠️ No se encontró pedido activo en Delivery.');
            this.mostrarInfo.next(false);
          }
        });

    } 
    // 3. Lógica para RESTAURANTE (Mesa)
    else {
      console.log('🍽️ Entrando en modo RESTAURANTE');
      
      return this.db.traerPedidos().subscribe((pedidos: any[]) => {
          const pedidoCliente = pedidos.find(p => {
             const nombreBD = p.cliente ? p.cliente.toLowerCase().trim() : '';
             return nombreBD === nombreUsuario && 
                    (p.estadoPedido === 'enPreparacion' || p.estadoPedido === 'listo');
          });

          if (pedidoCliente) {
            this.pedidoActual.next(pedidoCliente);
            this.mostrarInfo.next(true);
          } else {
            this.mostrarInfo.next(false);
          }
        });
    }
  }
}