import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faUtensils, faClock, faBan, faCheckCircle, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { Subscription, firstValueFrom } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

@Component({
  selector: 'app-confirmar-pedido',
  templateUrl: './confirmar-pedido.component.html',
  styleUrls: ['./confirmar-pedido.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, RouterLink, CommonModule],
})
export class ConfirmarPedidoComponent implements OnInit {
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)

  faArrowLeft = faArrowLeft;
  faUtensils = faUtensils;
  faClock = faClock;
  faBan = faBan;
  faCheckCircle = faCheckCircle;
  faClipboardList = faClipboardList;

  pedidosPendientes: any[] = [];
  subscription: Subscription | null = null;
  isLoading: boolean = true;

  constructor(protected auth: AuthService, protected db: DatabaseService) { }

  ngOnInit(): void {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
    this.isLoading = true;
    setTimeout(() => { if (this.isLoading && this.pedidosPendientes.length === 0) this.isLoading = false; }, 1000);

    const observable = this.db.traerPedidos();

    this.subscription = observable.subscribe((resultado) => {
      this.pedidosPendientes = (resultado as any[]).filter((doc) => doc.estadoPedido === 'porAceptar');
      this.isLoading = false;
    });
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

  async confirmarPedido(pedido: any) {
    const { value: tiempo } = await Swal.fire({
      heightAuto: false,
      title: this.diccionario[this.idioma()]['AceptarPedido'],
      text: `${this.diccionario[this.idioma()]['Mesa']} ${pedido.mesa} ${this.diccionario[this.idioma()]['Confirmartiempodeespera']}`,
      input: 'number',
      inputValue: 30,
      inputLabel: this.diccionario[this.idioma()]['Minutos'],
      background: '#333',
      color: '#fff',
      confirmButtonColor: '#4caf50',
      confirmButtonText: this.diccionario[this.idioma()]['Confirmar'],
      showCancelButton: true,
      cancelButtonText: this.diccionario[this.idioma()]['Cancelar']
    });

    if (!tiempo) return;

    this.isLoading = true;

    try {

      await this.db.enviarNotificacion('chef', {
        titulo: this.diccionario[this.idioma()]['NuevoPedido'],
        cuerpo: `${this.diccionario[this.idioma()]['Mesa']} ${pedido.mesa} ${this.diccionario[this.idioma()]['esperacomida']}`,
      });

      const hayBebidas = pedido.productos.some((p: any) => p.tipoProducto === 'bebida');
      if (hayBebidas) {
        await this.db.enviarNotificacion('bartender', {
          titulo: this.diccionario[this.idioma()]['NuevasBebidas'],
          cuerpo: `${this.diccionario[this.idioma()]['Mesa']} ${pedido.mesa} ${this.diccionario[this.idioma()]['esperabebidas']}`,
        });
      }


      pedido.estadoPedido = 'enPreparacion';
      pedido.tiempoEstimado = tiempo;
      await this.db.ModificarObjeto(pedido, 'pedidos');


      await this.actualizarEstadoCliente(pedido.cliente, 'enPreparacion');

      Swal.fire({
        icon: 'success',
        title: this.diccionario[this.idioma()]['EnviadoaCocina'],
        timer: 1500,
        showConfirmButton: false,
        background: '#333',
        color: '#fff'
      });

    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  async rechazarPedido(pedido: any) {
    const { value: motivo } = await Swal.fire({
      title: this.diccionario[this.idioma()]['RechazarPedido'],
      input: 'text',
      inputPlaceholder: this.diccionario[this.idioma()]['FaltadestockCocinacerrada'],
      showCancelButton: true,
      confirmButtonText: this.diccionario[this.idioma()]['Rechazar'],
      confirmButtonColor: '#d33',
      background: '#333',
      color: '#fff'
    });

    if (!motivo) return;

    this.isLoading = true;

    await this.db.enviarNotificacion('cliente', {
      titulo: this.diccionario[this.idioma()]['PedidoRechazado'],
      cuerpo: `${this.diccionario[this.idioma()]['Motivo']} ${motivo}. ${this.diccionario[this.idioma()]['Porfavormodifiquesupedido']}`,
      cliente: pedido.cliente
    });


    pedido.productos = [];
    pedido.estadoPedido = 'cancelado';
    pedido.motivoRechazo = motivo;
    await this.db.ModificarObjeto(pedido, 'pedidos');


    await this.actualizarEstadoCliente(pedido.cliente, 'cancelado');

    this.isLoading = false;
  }
}