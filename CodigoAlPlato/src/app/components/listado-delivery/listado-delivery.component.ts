import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faMapMarkerAlt, faUser, faBoxOpen, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CambioIdioma } from 'src/app/services/cambio-idioma';
import { DICCIONARIO } from 'src/assets/diccionario';

@Component({
  selector: 'app-listado-delivery',
  templateUrl: './listado-delivery.component.html',
  styleUrls: ['./listado-delivery.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, CommonModule, IonicModule]
})
export class ListadoDeliveryComponent implements OnInit {

  faArrowLeft = faArrowLeft;
  faMapMarkerAlt = faMapMarkerAlt;
  faUser = faUser;
  faBoxOpen = faBoxOpen;
  faCheckCircle = faCheckCircle;

  pedidos: any[] = [];
  subscription: Subscription | null = null;
  isLoading: boolean = true;
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)
  constructor(
    protected auth: AuthService, 
    protected db: DatabaseService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
    this.isLoading = true;
    const observable = this.db.traerDelivery();

    this.subscription = observable.subscribe((resultado) => {
      this.pedidos = (resultado as any[]).filter((doc) => 
          doc.estadoPedido === 'porEntregar' && 
          doc.estadoDelivery === 'confirmado'
      );
      this.isLoading = false;
    });
  }

  async tomarPedido(pedido: any) {
    const confirm = await Swal.fire({
title: this.diccionario[this.idioma()]['Tomarestepedido'],
    text: `${this.diccionario[this.idioma()]['Llevara']} ${pedido.direccion}`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: this.diccionario[this.idioma()]['Sívoyyo'],
    confirmButtonColor: '#4caf50',
    cancelButtonText: this.diccionario[this.idioma()]['Cancelar'],
    background: '#333',
    color: '#fff',
    heightAuto: false
    });

    if (!confirm.isConfirmed) return;


    this.isLoading = true;


    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        pedido.estadoPedido = 'enCamino';
        pedido.estadoDelivery = 'enCamino';
        pedido.repartidor = this.auth.usuarioIngresado.nombre; 

        await this.db.ModificarObjeto(pedido, 'delivery');
        
        await this.db.enviarNotificacion('cliente', {
            titulo: '¡Pedido en Camino!',
            cuerpo: `${this.auth.usuarioIngresado.nombre} está llevando tu pedido.`,
            pedidoId: pedido.id
        });


        this.router.navigate(['/mapa-delivery'], {
            queryParams: { 
                lat: pedido.latitud, 
                lng: pedido.longitud, 
                cliente: pedido.cliente,
                direccion: pedido.direccion 
            }
        });
        


    } catch (error) {
        console.error(error);
        this.isLoading = false; 
    }
  }
  
  volver() {
      this.router.navigate(['/home']);
  }
}