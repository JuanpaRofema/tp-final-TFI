import { Component, OnInit } from '@angular/core';
import { PedidoService } from 'src/app/services/pedido.service';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faReceipt, faUtensils } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-info-pedido',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './info-pedido.component.html',
  styleUrls: ['./info-pedido.component.scss']
})
export class InfoPedidoComponent implements OnInit {
  
  faClock = faClock;
  faReceipt = faReceipt;
  faUtensils = faUtensils;

  mostrarModal = false;
  pedidoActual: any = null;

  constructor(private pedidoService: PedidoService) {}

  ngOnInit() {
    
    this.pedidoService.pedidoActual$.subscribe(pedido => {
      this.pedidoActual = pedido;
    });
  }

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }
  
 
  detenerPropagacion(event: Event) {
    event.stopPropagation();
  }
}