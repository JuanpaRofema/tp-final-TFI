import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { Anonimo, Cliente } from 'src/app/classes/cliente';
import { Mesa } from 'src/app/classes/mesa';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import firebase from 'firebase/compat/app';
import { FormsModule, NgModel } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-reserva-mesa',
  templateUrl: './reserva-mesa.component.html',
  styleUrls: ['./reserva-mesa.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, RouterLink, FormsModule,
      CommonModule,
        IonicModule,],
})
export class ReservaMesaComponent {
  isLoading:boolean = false;
  faArrowLeft = faArrowLeft;
  clientes: any[] = [];
  subscription: Subscription | null = null;

  mostrarMesasDisponibles: boolean = true;
  usuarioSeleccionado: any | null = null;
  mesas: Mesa[] = [];
  mesaSeleccionada: Mesa | null = null;
  mostrarSelectorDeFecha: boolean = false;
  fechaSeleccionada: string = '';
  cantidadComensales:number = 0;
  tipoMesa:string = ''
 

  constructor(
    protected auth: AuthService,
    protected db: DatabaseService,
    protected router: Router
  ) {

    const observableMesas = db.TraerObjeto('mesas');

    this.subscription = observableMesas.subscribe((resultado) => {
      this.mesas = (resultado as any[]).map(
        (doc) => new Mesa(doc.numero, doc.estado, doc.ocupadaPor, doc.id, doc.foto, doc.qrString, doc.qrImage, doc.reservadaPor)

      );
    });

    console.log(this.auth.usuarioIngresado.nombre)
  }


  mostrarDetalle(cliente: Cliente): void {
    this.usuarioSeleccionado = cliente;
  }
  cerrarDetalle(): void {
    this.usuarioSeleccionado = null;
  }

  volverFuncionalidad() {
    if (this.mostrarMesasDisponibles) {
      this.mostrarMesasDisponibles = false;
    } else {
      this.router.navigateByUrl('/home');
    }
  }
  
      

  abrirSelectorDeFecha(mesa: Mesa) {
  this.mesaSeleccionada = mesa;
  this.mostrarSelectorDeFecha = true;
  this.mostrarMesasDisponibles = false

}



async confirmarReserva() {
  if (!this.auth.usuarioIngresado) return;

  const ahora = new Date();
  const fechaReserva = new Date(this.fechaSeleccionada);
  const tipoMesa = this.tipoMesa
  const cantidadComensales = this.cantidadComensales

  if (!this.fechaSeleccionada || fechaReserva <= ahora) {
    Swal.fire('Fecha inválida', 'La reserva debe ser en el futuro.', 'error');
    return;
  }

  if(this.mesaSeleccionada?.estadoReserva === 'aprobada'){
    Swal.fire('Reserva invalida', 'La mesa ya esta reservada.', 'error');
    return;
  }
  
  this.isLoading = true;

  try {
    const reserva = {
      clienteId: this.auth.usuarioIngresado.id,
      clienteNombre: this.auth.usuarioIngresado.nombre,
      fechaReserva: new Date(fechaReserva),
      estado: 'pendiente',
      mesaAsignada: '',
    };

    await this.db.guardarObjeto(reserva, 'reserva');

    this.auth.usuarioIngresado.estadoReserva = 'pendiente'; 
    this.auth.usuarioIngresado.fechaReserva = new Date(fechaReserva); 
    this.auth.usuarioIngresado.estadoMesa = 'noSeleccionada';
    this.auth.usuarioIngresado.tipoMesa = tipoMesa
    this.auth.usuarioIngresado.cantidadComensales = cantidadComensales;

    await this.db.ModificarObjeto(this.auth.usuarioIngresado, 'clientes');

    Swal.fire({
      title: `Solicitud enviada para el ${fechaReserva.toLocaleString()}`,
      text: 'Esperá la confirmación del restaurante.',
      icon: 'success',
      background: '#333',
      color: '#fff',
      confirmButtonColor: '#780000',
    });

    await this.db.guardarObjeto(reserva, 'reserva');
      await this.db.enviarNotificacion('dueño', {
        titulo: 'Cuenta confirmada',
        cuerpo: `${this.auth.usuarioIngresado.nombre} pidió una reserva para el ${fechaReserva.toLocaleString()}`,
      });


    this.router.navigate(['/home']);
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Hubo un problema al reservar', 'error');
    } finally {
        this.isLoading = false;
    }
  }



  cancelarReserva() {
    this.mostrarSelectorDeFecha = false;
    this.mesaSeleccionada = null;
    this.fechaSeleccionada = '';
    this.mostrarMesasDisponibles = true
  }
}