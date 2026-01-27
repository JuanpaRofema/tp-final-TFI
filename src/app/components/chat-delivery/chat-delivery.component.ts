import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatabaseService } from '../../services/database.service';
import { Mensaje } from 'src/app/classes/mensaje';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faLocationArrow, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { ChatService } from 'src/app/services/chat.service';
import { IonicModule } from '@ionic/angular';
import { pushService } from 'src/app/services/serviciosPush/push-notifications.service';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

@Component({
  selector: 'app-chat-delivery',
  templateUrl: './chat-delivery.component.html',
  styleUrls: ['./chat-delivery.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, FontAwesomeModule],
})
export class ChatDeliveryComponent implements OnInit {

  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)

  faArrowLeft = faArrowLeft;
  faLocationArrow = faLocationArrow;
  faPaperPlane = faPaperPlane;

  mensajes: Mensaje[] = [];
  subscription: Subscription | null = null;
  mensajeInput: string = '';

  tituloChat: string = 'Chat';
  subtituloChat: string = '';

  @ViewChild('chatBody') chatBody!: ElementRef;

  constructor(
    private chat: ChatService,
    protected auth: AuthService,
    protected router: Router,
    protected db: DatabaseService,
    private route: ActivatedRoute,
    private pushService: pushService
  ) { }

  ngOnInit() {
    if (this.auth.usuarioIngresado.tipoCliente === 'delivery') {
      this.tituloChat = this.db.direccion || 'Cliente';
      this.subtituloChat = 'Destino del pedido';
    } else {
      this.tituloChat = 'Repartidor';
      this.subtituloChat = 'En camino';
    }


    const salaChat = 'mesa-1001';

    const observable = this.chat.TraerChat(salaChat);
    this.subscription = observable.subscribe((resultado) => {
      this.mensajes = (resultado as any[]).map((doc) => {


        let fechaReal: Date;

        if (doc.fecha && typeof doc.fecha === 'object' && 'seconds' in doc.fecha) {

          fechaReal = doc.fecha.toDate();
        } else {

          fechaReal = new Date(doc.fecha);
        }


        return new Mensaje(doc.nombre, doc.contenido, doc.email, fechaReal, doc.mesa);
      });


      this.mensajes.sort((a: any, b: any) => a.fecha - b.fecha);

      setTimeout(() => this.HacerScroll(), 100);
    });
  }

  async EnviarMensaje() {
    if (this.mensajeInput.trim() === '') return;


    let nuevoMensaje = new Mensaje(
      this.auth.usuarioIngresado.nombre,
      this.mensajeInput,
      this.auth.usuarioIngresado.email,
      new Date(),
      'mesa-1001'
    );

    if (this.auth.usuarioIngresado.tipoCliente === 'cliente') {
      await this.db.enviarNotificacion('delivery', {
        titulo: this.diccionario[this.idioma()]['MensajedelCliente'],
        cuerpo: this.mensajeInput,
      });
    } else if (this.auth.usuarioIngresado.tipoCliente === 'delivery') {
      await this.db.enviarNotificacion('cliente', {
        titulo: this.diccionario[this.idioma()]['MensajedelRepartidor'],
        cuerpo: this.mensajeInput,
      });
    }

    this.chat.AgregarMensaje(nuevoMensaje);
    this.mensajeInput = '';
  }

  HacerScroll(): void {
    try {
      this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
    } catch (err) { }
  }

  volver() {
    if (this.auth.usuarioIngresado.tipoCliente === 'cliente') {
      this.router.navigate(['/cliente-espera-delivery']);
    } else {
      this.router.navigate(['/mapa-delivery']);
    }
  }
}