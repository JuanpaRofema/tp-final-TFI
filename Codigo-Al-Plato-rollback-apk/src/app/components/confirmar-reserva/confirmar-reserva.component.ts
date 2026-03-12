import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faCalendarCheck, faBan, faCheckCircle, faUsers, faClock } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { DatePipe, CommonModule } from '@angular/common';
import { Cliente } from 'src/app/classes/cliente';
import { Mesa } from 'src/app/classes/mesa';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import emailjs from 'emailjs-com';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

@Component({
  selector: 'app-confirmar-reserva',
  templateUrl: './confirmar-reserva.component.html',
  styleUrls: ['./confirmar-reserva.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, RouterLink, CommonModule, DatePipe],
})
export class ConfirmarReservaComponent implements OnInit {
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)

  faArrowLeft = faArrowLeft;
  faCalendarCheck = faCalendarCheck;
  faBan = faBan;
  faCheckCircle = faCheckCircle;
  faUsers = faUsers;
  faClock = faClock;

  isLoading: boolean = true;

  clientes: any[] = [];
  mesas: Mesa[] = [];

  subscription: Subscription | null = null;

  mostrarMesasDisponibles: boolean = false;
  usuarioSeleccionado: any | null = null;

  constructor(
    protected auth: AuthService,
    protected db: DatabaseService,
    protected router: Router
  ) { }

  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
    this.isLoading = true;


    const observableClientes = this.db.TraerUsuario('clientes');
    this.subscription = observableClientes.subscribe((resultado) => {
      this.clientes = (resultado as any[])
        .filter((doc) => doc.estadoReserva === 'pendiente')
        .map(doc => {

          return {
            ...doc,
            fechaReservaDate: doc.fechaReserva && doc.fechaReserva.toDate ? doc.fechaReserva.toDate() : null
          };
        });


      if (this.mesas.length > 0) this.isLoading = false;
    });


    const observableMesas = this.db.TraerObjeto('mesas');
    observableMesas.subscribe((resultado) => {
      this.actualizarEstadosDeMesas(resultado);
      setTimeout(() => { this.isLoading = false; }, 1500);
    });
  }

  actualizarEstadosDeMesas(resultado: any[]) {
    const ahora = new Date();

    this.mesas = resultado.map((doc) => {


      let fechaReserva = '';

      if (doc.fechaReserva && doc.fechaReserva.toDate) {
        fechaReserva = doc.fechaReserva.toDate();
      } else {
        fechaReserva = doc.fechaReserva;
      }

      if (doc.foto) {
        const img = new Image();
        img.src = doc.foto;
      }

      const mesa: Mesa = {
        id: doc.id,
        numero: doc.numero,
        estado: doc.estado,
        ocupadaPor: doc.ocupadaPor,
        foto: doc.foto,
        qrString: doc.qrString,
        qrImage: doc.qrImage,
        reservadaPor: doc.reservadaPor,
        fechaReserva: doc.fechaReserva,
        estadoReserva: doc.estadoReserva,
        tipo: doc.tipo
      } as Mesa;

      return mesa;
    });
  }

  async rechazarReserva(cliente: any) {
    const { value: motivo } = await Swal.fire({
      title: this.diccionario[this.idioma()]['RechazarReserva'],
      input: 'textarea',
      inputPlaceholder: this.diccionario[this.idioma()]['Indiqueelmotivo'],
      showCancelButton: true,
      confirmButtonText: this.diccionario[this.idioma()]['Rechazar'],
      confirmButtonColor: '#d33',
      background: '#333',
      color: '#fff'
    });

    if (!motivo) return;

    this.isLoading = true;

    cliente.estadoReserva = 'rechazada';
    cliente.estadoMesa = '';

    await this.db.ModificarObjeto(cliente, 'clientes');

    this.sendEmailRechazar(true, cliente.nombre, cliente.email, motivo);

    this.isLoading = false;

    Swal.fire({
      title: this.diccionario[this.idioma()]['ReservaRechazada'],
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      background: '#333',
      color: '#fff'
    });
  }


  abrirSelectorMesa(cliente: any) {
    this.isLoading = true;
    setTimeout(() => { this.isLoading = false; }, 1000);
    this.usuarioSeleccionado = cliente;
    this.mostrarMesasDisponibles = true;
    console.log(this.mesas)
  }

  cerrarSelectorMesa() {
    this.mostrarMesasDisponibles = false;
    this.usuarioSeleccionado = null;
  }


  async asignarMesa(mesa: Mesa) {
    if (!this.usuarioSeleccionado) return;

    this.isLoading = true;

    try {

      mesa.reservadaPor = this.usuarioSeleccionado.id;
      mesa.estadoReserva = 'aprobada';
      mesa.estado = 'ocupada';
      mesa.ocupadaPor = this.usuarioSeleccionado.id
      mesa.fechaReserva = this.usuarioSeleccionado.fechaReserva;

      await this.db.ModificarObjeto(mesa, 'mesas');


      this.usuarioSeleccionado.estadoReserva = 'aprobada';
      this.usuarioSeleccionado.estadoMesa = mesa.numero;

      await this.db.ModificarObjeto(this.usuarioSeleccionado, 'clientes');


      this.sendEmail(true, this.usuarioSeleccionado.nombre, this.usuarioSeleccionado.email, this.usuarioSeleccionado.fechaReservaDate, this.usuarioSeleccionado.dni);

      this.isLoading = false;
      this.cerrarSelectorMesa();

      Swal.fire({
        title: this.diccionario[this.idioma()]['ReservaConfirmada'],
        text: `${this.diccionario[this.idioma()]['Mesa']} ${mesa.numero} ${this.diccionario[this.idioma()]['asignadaa']} ${this.usuarioSeleccionado.nombre}`,
        icon: 'success',
        background: '#333',
        color: '#fff'
      });

    } catch (error) {
      console.error(error);
      this.isLoading = false;
    }
  }


  sendEmail(aceptado: boolean, nombre: string, email: string, fecha: Date, dni: string) {
    const templateParams = {
      email: email,
      nombre: nombre,
      imagen: 'https://firebasestorage.googleapis.com/v0/b/la-comanda-pps.appspot.com/o/images%2Ficono.png?alt=media&token=09bfed13-ec47-4a4c-bc2d-bdfea0ec29f2',
      fechaReserva: fecha ? fecha.toLocaleString() : 'Confirmada',
      dni: dni,
      from_name: 'Codigo al Plato',
    };


    const templateID = aceptado ? 'template_aa7ydsa' : 'template_jhtl2fb';
    emailjs.send('service_c4lsywj', templateID, templateParams, '_LgtBiRQISWfd3V9s');
  }

  sendEmailRechazar(aceptado: boolean, nombre: string, email: string, motivo: string) {
    const templateParams = {
      email: email,
      nombre: nombre,
      imagen: 'https://firebasestorage.googleapis.com/v0/b/la-comanda-pps.appspot.com/o/images%2Ficono.png?alt=media&token=09bfed13-ec47-4a4c-bc2d-bdfea0ec29f2',
      motivo: motivo,
      from_name: 'Codigo al Plato',
    };
    emailjs.send('service_c4lsywj', 'template_aywwhbo', templateParams, '_LgtBiRQISWfd3V9s');
  }
}