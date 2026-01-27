import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatabaseService } from '../../services/database.service';
import { Mensaje } from 'src/app/classes/mensaje';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { ChatService } from 'src/app/services/chat.service';
import { IonicModule } from '@ionic/angular';
import { pushService } from 'src/app/services/serviciosPush/push-notifications.service';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, FontAwesomeModule],
})
export class ChatComponent implements OnInit {

  faArrowLeft = faArrowLeft;
  faPaperPlane = faPaperPlane;

  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)

  mensajes: Mensaje[] = [];
  subscription: Subscription | null = null;
  mesa: string = '';
  mensajeInput: string = '';
  numeroMesa: string = '';

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
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
    this.mesa = this.db.mesa;

    if (this.mesa) {

      this.numeroMesa = this.mesa.split('-').pop() || '';
    }

    const observable = this.chat.TraerChat(this.mesa);

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
      setTimeout(() => { this.HacerScroll(); }, 100);
    });
  }

  async EnviarMensaje() {
    if (this.mensajeInput.trim() === '') return;

    let nuevoMensaje = new Mensaje(
      this.auth.usuarioIngresado.nombre,
      this.mensajeInput,
      this.auth.usuarioIngresado.email,
      new Date(),
      this.mesa
    );

    const str: any = this.db.mesa || '0';
    const numero: any = str.match(/\d+/)?.[0] || '0';

    if (['anonimo', 'cliente'].includes(this.auth.usuarioIngresado.tipoCliente)) {
      await this.db.enviarNotificacion('mesero', {
        titulo: this.diccionario[this.idioma()]['Nuevomensaje'],
        cuerpo: `${this.diccionario[this.idioma()]['Clienteconsultóenlamesa']} ${numero}`,
        mesa: this.db.mesa,
      });
    } else if (this.auth.usuarioIngresado.tipoCliente === 'mesero') {
      await this.db.enviarNotificacion('cliente', {
        titulo: this.diccionario[this.idioma()]['Nuevomensaje'],
        cuerpo: `${this.diccionario[this.idioma()]['Meserorespondióenmesa']} ${numero}`,
        mesa: this.db.mesa,
      });
      await this.db.enviarNotificacion('anonimo', {
        titulo: this.diccionario[this.idioma()]['Nuevomensaje'],
        cuerpo: `${this.diccionario[this.idioma()]['Meserorespondióenmesa']} ${numero}`,
        mesa: this.db.mesa,
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
    if (['cliente', 'anonimo'].includes(this.auth.usuarioIngresado.tipoCliente)) {
      this.router.navigate(['/listado-productos']);
    } else if (this.auth.usuarioIngresado.tipoCliente === 'mesero') {
      this.router.navigate(['/home']);
    }
  }
}