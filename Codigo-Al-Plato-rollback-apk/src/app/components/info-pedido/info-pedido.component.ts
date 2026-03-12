import { Component, inject, OnInit, signal } from '@angular/core';
import { PedidoService } from 'src/app/services/pedido.service';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faReceipt, faUtensils } from '@fortawesome/free-solid-svg-icons';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

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
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)
  mostrarModal = false;
  pedidoActual: any = null;

  constructor(private pedidoService: PedidoService) { }

  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
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