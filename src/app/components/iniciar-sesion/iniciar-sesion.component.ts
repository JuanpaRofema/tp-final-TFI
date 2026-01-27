import { IonicModule, Platform } from '@ionic/angular';
import { CambioIdioma } from 'src/app/services/cambio-idioma';
import { CommonModule } from '@angular/common';
import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { DICCIONARIO } from 'src/assets/diccionario';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Unsubscribe } from 'firebase/auth';
import { AuthService } from 'src/app/services/auth.service';
import {
  faUser,
  faLock,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import {
  FontAwesomeModule,
  FaIconLibrary,
} from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import axios from 'axios';
import { SendPushService } from 'src/app/services/send-push-service.service';
import { pushService } from 'src/app/services/serviciosPush/push-notifications.service';
import { DatabaseService } from 'src/app/services/database.service';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-iniciar-sesion',
  templateUrl: './iniciar-sesion.component.html',
  styleUrls: ['./iniciar-sesion.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    IonicModule,
    FontAwesomeModule,
    ReactiveFormsModule,
  ],
  providers: [GooglePlus]
})
export class IniciarSesionComponent {
  formInicioSesion: FormGroup;

  acceso: string | null = null;

  authSubscription?: Unsubscribe;


  intentosInicioSesion: number;
  diccionario: any = DICCIONARIO
  mailError: boolean = false;
  contrasenaError: boolean = false;
  usuarioNoEncontrado: boolean = false;
  googleError: boolean = false;

  mensajeMail: string = '';
  mensajeContrasena: string = '';
  mensajeUsuario: string = '';
  private cambioIdioma = inject(CambioIdioma);

  // http: HttpClient = Inject(HttpClient);

  private apiUrl = 'https://puuushs.onrender.com/send-push';
  idioma: any = signal("es")
  // Constructor
  constructor(
    private auth: AuthService,
    protected router: Router,
    private db: DatabaseService,
    library: FaIconLibrary,
    protected apiPush: SendPushService,
    protected pushServicio1000: pushService,
    private googlePlus: GooglePlus,
    private afAuth: AngularFireAuth,
    private authService: AuthService,

  ) {
    library.addIcons(faUser, faLock, faChevronRight);

    this.formInicioSesion = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      contrasena: new FormControl('', [Validators.required]),
    });
    this.intentosInicioSesion = 0;
    this.auth.CerrarSesion()
  }
  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
    console.log("ACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
  }

  IniciarSesion() {
    this.mailError = false;
    this.contrasenaError = false;
    this.usuarioNoEncontrado = false;
    if (this.ValidarCampos()) {
      this.auth
        .IniciarSesion(this.formInicioSesion.value)
        .then(async (response) => {
          await this.auth.esperarTipoDeUsuario();

          if (this.auth.usuarioIngresado.tipoCliente === 'cliente') {
            if (this.auth.usuarioIngresado.tipoCliente === 'anonimo') {
              this.confirmarLogin();
            } else {
              console.log(this.auth.usuarioIngresado.acceso);
              if (this.auth.usuarioIngresado.acceso === 'pendiente') {
                throw new Error('acceso-pendiente-cliente');
              } else if (this.auth.usuarioIngresado.acceso === 'denegado') {
                throw new Error('acceso-denegado-cliente');
              } else if (this.auth.usuarioIngresado.acceso === 'permitido') {
                this.confirmarLogin();
              }
            }
          } else {
            this.confirmarLogin();
          }
        })
        .catch((error) => {
          switch (error.code) {
            case 'auth/missing-email':
              this.mailError = true;
              this.mensajeMail = 'Correo incompleto';
              break;
            case 'auth/invalid-email':
              this.mailError = true;
              this.mensajeMail = 'Correo inválido';
              break;
            case 'auth/missing-password':
              this.contrasenaError = true;
              this.mensajeContrasena = 'Contraseña incompleta';
              break;
            case 'auth/wrong-password':
              this.contrasenaError = true;
              this.mensajeContrasena = 'Contraseña Incorrecta';
              break;
            case 'auth/user-not-found':
            case 'auth/invalid-credential':
              this.mensajeUsuario = 'Usuario no encontrado';
              this.usuarioNoEncontrado = true;
              if (this.intentosInicioSesion > 2) {
                this.formInicioSesion.patchValue({
                  email: '',
                  contraseña: '',
                });
                this.mensajeUsuario = 'Ingrese los datos nuevamente';
              }
              this.intentosInicioSesion++;
              break;
          }
          if (error.message === 'acceso-pendiente-cliente') {
            this.auth.CerrarSesion();
            Swal.fire({
              heightAuto: false,
              title: this.diccionario[this.idioma()]['Sucuentaaúnestápendientedeseraceptada'],
              background: '#333',
              color: '#fff',
              confirmButtonColor: '#780000',
              confirmButtonText: this.diccionario[this.idioma()]['Aceptar']
            });
          } else if (error.message === 'acceso-denegado-cliente') {
            this.auth.CerrarSesion();
            Swal.fire({
              heightAuto: false,
              title: this.diccionario[this.idioma()]['Suaccesofuedenegado'],
              background: '#333',
              color: '#fff',
              confirmButtonColor: '#780000',
              confirmButtonText: this.diccionario[this.idioma()]['Aceptar']
            });
          }
          console.log('Este es el ERROR: ', error);
        });
    }
  }

  ValidarCampos() {
    let camposValidados = true;

    const controlMail = this.formInicioSesion.controls['email'];
    const controlContrasena = this.formInicioSesion.controls['contrasena'];

    if (controlMail.errors !== null) {
      camposValidados = false;
      this.mailError = true;
      if (controlMail.errors!['required']) {
        this.mensajeMail = 'Ingrese su Correo';
      } else if (controlMail.errors!['email']) {
        this.mensajeMail = 'Ingrese un Correo válido';
      }
    }

    if (controlContrasena.errors !== null) {
      camposValidados = false;
      this.contrasenaError = true;
      if (controlContrasena.errors!['required']) {
        this.mensajeContrasena = 'Ingrese su contraseña';
      }
    }

    return camposValidados;
  }

  ingresarCliente() {
    this.router.navigate(['/alta-cliente']);
  }

  confirmarLogin() {
    this.formInicioSesion.get('email')?.setValue('');
    this.formInicioSesion.get('contrasena')?.setValue('');
    this.router.navigate(['/home']);
  }

  IniciarRichtofen() {
    this.formInicioSesion.patchValue({
      email: 'richtofen9399@gmail.com',
      contrasena: 'Maxis115',
    });
  }
  IniciarTakeo() {
    this.formInicioSesion.patchValue({
      email: 'masaki115@gmail.com',
      contrasena: 'Emperador115',
    });
  }

  IniciarDempsey() {
    this.formInicioSesion.patchValue({
      email: 'tank115@gmail.com',
      contrasena: 'UUHRAA115',
    });
  }
  IniciarNikolai() {
    this.formInicioSesion.patchValue({
      email: 'belinski115@gmail.com',
      contrasena: 'stalingrado115',
    });
  }
  IniciarParker() {
    this.formInicioSesion.patchValue({
      email: 'parker115@gmail.com',
      contrasena: 'Spiderman115',
    });
  }
  IniciarStacy() {
    this.formInicioSesion.patchValue({
      email: 'gwen935@gmail.com',
      contrasena: 'MolMed115',
    });
  }
  IniciarWatson() {
    this.router.navigate(['/anonimo']);
  }
  IniciarMorales() {
    this.formInicioSesion.patchValue({
      email: 'yapufranco115@gmail.com',
      contrasena: 'Prowler115',
    });
  }
  IniciarJuan() {
    this.formInicioSesion.patchValue({
      email: 'deliverybueno@gmail.com',
      contrasena: 'JuanVaz123',
    });
  }


  async googleSignIn() {
    try {
      const result = await this.authService.loginWithGoogle();

    } catch (error) {
      console.error('Error al intentar login con Google:', error);
    }
  }
}
