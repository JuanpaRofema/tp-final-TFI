import { Component, Inject, OnInit } from '@angular/core';
import { EmailComposer } from '@awesome-cordova-plugins/email-composer/ngx';
import { Subscription } from 'rxjs';
import { Cliente } from 'src/app/classes/cliente';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import emailjs from 'emailjs-com';
import { faArrowLeft, faUserCheck, faUserSlash, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-listado-clientes',
  templateUrl: './listado-clientes.component.html',
  styleUrls: ['./listado-clientes.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, IonicModule, RouterLink, CommonModule],
})
export class ListadoClientesComponent {

  faArrowLeft = faArrowLeft;
  faUserCheck = faUserCheck;
  faUserSlash = faUserSlash;
  faEnvelope = faEnvelope;

  clientes: Cliente[] = [];
  subscription: Subscription | null = null;
  isLoading: boolean = true; 

  constructor(protected auth: AuthService, protected db: DatabaseService) {}

  ngOnInit() {
     this.isLoading = true; 

    
    const observable = this.db.TraerUsuario('clientes');

    this.subscription = observable.subscribe((resultado) => {
      this.clientes = (resultado as any[])
        .filter((doc) => doc.acceso === 'pendiente')
        .map(
          (doc) =>
            new Cliente(
              doc.nombre,
              doc.apellido,
              doc.dni,
              doc.foto,
              doc.acceso,
              doc.email,
              doc.id
            )
        );
      setTimeout(() => {
        this.isLoading = false;
    }, 900);
    });
  }


  async cambiarEstadoAcceso(cliente: any, estado: 'permitido' | 'denegado') {
    const texto = estado === 'permitido' ? 'Permitir' : 'Denegar';
    const colorBtn = estado === 'permitido' ? '#4caf50' : '#d33';

    const confirm = await Swal.fire({
      title: `¿${texto} acceso?`,
      text: `Cliente: ${cliente.nombre} ${cliente.apellido}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${texto}`,
      confirmButtonColor: colorBtn,
      cancelButtonText: 'Cancelar',
      background: '#333',
      color: '#fff',
      heightAuto: false
    });

    if (confirm.isConfirmed) {
      this.isLoading = true; 

      cliente.acceso = estado;
      await this.db.ModificarObjeto(cliente, 'clientes');
      
      const esAceptado = estado === 'permitido';
      this.sendEmail(esAceptado, cliente.nombre, cliente.email);

      this.isLoading = false;

      Swal.fire({
        title: `Acceso ${estado}`,
        icon: esAceptado ? 'success' : 'error',
        timer: 1500,
        showConfirmButton: false,
        background: '#333',
        color: '#fff',
        heightAuto: false
      });
    }
  }

  sendEmail(aceptado: boolean, nombre: string, mail: string) {
    const templateParams = {
      to_email: mail,
      nombre: nombre,
      from_name: 'Administración CodigoAlPlato',
      imagen:'https://firebasestorage.googleapis.com/v0/b/la-comanda-pps.appspot.com/o/images%2Ficono.png?alt=media&token=5e600321-4ce3-4986-a98c-22dd2b0e991b',
    };

    let templateID = '';
    if (aceptado) {
      templateID = 'template_tesx4wj';
    } else {
      templateID = 'template_jhtl2fb';
    }

    emailjs
      .send('service_e996sbi', templateID, templateParams, 'AdOvugLoSNob9DXIi')
      .then(
        (response) => {
          console.log(
            'Correo enviado con éxito:',
            response.status,
            response.text
          );
        },
        (err) => {
          console.error('Error al enviar correo:', err);
        }
      );
  }
}
