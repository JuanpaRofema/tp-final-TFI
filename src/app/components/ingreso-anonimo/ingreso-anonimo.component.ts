import {
  IonicModule,
  ModalController,
  Platform,
  IonIcon,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
import { DatabaseService } from 'src/app/services/database.service';
import { PhotoService } from 'src/app/services/photo.service';
import { addDoc, getFirestore } from '@firebase/firestore';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import {
  getStorage,
  ref,
  listAll,
  getDownloadURL,
  uploadString,
} from 'firebase/storage';
import { CameraResultType, CameraSource } from '@capacitor/camera';
import { Camera } from '@capacitor/camera';
import { collection } from '@firebase/firestore';
import { BarcodeScanner, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { faQrcode } from '@fortawesome/free-solid-svg-icons';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

@Component({
  selector: 'app-ingreso-anonimo',
  templateUrl: './ingreso-anonimo.component.html',
  styleUrls: ['./ingreso-anonimo.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    IonicModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    RouterLink,
  ],
})
export class IngresoAnonimoComponent implements OnDestroy {
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)

  isLoading: boolean = false;
  faArrowLeft = faArrowLeft;
  faCamera = faCamera;
  anonimoForm: FormGroup;
  selectedImage: string = '';
  cargando: boolean = false;
  fotoUrl: string =
    'assets/faceless-businessman-user-profile-icon-business-leader-profile-picture-portrait-user-member-people-i.png';


  private usuarioSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private database: DatabaseService,
    private photoService: PhotoService,
    private authService: AuthService,
    private modalController: ModalController,
    private platform: Platform,
    private library: FaIconLibrary,
    private router: Router
  ) {
    this.isLoading = true;


    this.anonimoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]],
    });

    this.library.addIcons(faQrcode);
    setTimeout(() => {
      this.isLoading = false;
    }, 900);

  }
  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
  }
  ngOnDestroy() {
    if (this.usuarioSub) {
      console.log('Desuscribiendo observable de usuarios anónimos...');
      this.usuarioSub.unsubscribe();
      this.usuarioSub = null;
    }
  }

  async subirDatosAnonimo(dataUrl: string) {
    if (dataUrl && dataUrl.startsWith('data:image/')) {
      this.isLoading = true;
      try {
        const storage = getStorage();
        const storageRef = ref(storage, `images/${new Date().getTime()}.jpeg`);

        await uploadString(storageRef, dataUrl, 'data_url');
        console.log('Imagen subida exitosamente');


        const photoUrl = await getDownloadURL(storageRef);
        const firestore = getFirestore();

        const clienteData = {
          ...this.anonimoForm.value,
          foto: photoUrl,
          apellido: '',
          contraseña: '',
          dni: '',
          email: `${this.anonimoForm.controls['nombre'].value}@gmail.com`,
          repetir_contraseña: '',
          acceso: 'permitido',
          tipoCliente: 'anonimo',
          estadoMesa: 'sin-pedir',
        };

        await this.database.GuardarCliente(clienteData);

        Swal.fire({
          heightAuto: false,
          title: this.diccionario[this.idioma()]['Clientecreadoconéxito'],
          background: '#333',
          color: '#fff',
          confirmButtonText: this.diccionario[this.idioma()]['Aceptar'],
          confirmButtonColor: '#780000',
        }).then((resp) => {

          const observable = this.database.TraerUsuario('clientes');


          this.usuarioSub = observable.subscribe((resultado) => {
            resultado.forEach((usuario: any) => {
              if (usuario.tipoCliente === 'anonimo') {
                console.log(usuario.nombre);
                console.log(this.anonimoForm.get('nombre'));
                if (
                  usuario.nombre === this.anonimoForm.controls['nombre'].value
                ) {
                  console.log('es nombre');

                  this.authService.usuarioIngresado = usuario;
                  this.router.navigate(['/home']);
                  this.anonimoForm.reset();

                }
              }
            });
          });
        });
      } catch (error) {
        console.error('Error al subir la imagen y los datos:', error);
      } finally {
        this.isLoading = false;
      }
    } else {
      console.error('El formato de la imagen no es válido.');
    }
  }

  subirAnonimo() {
    if (this.anonimoForm.valid) {
      this.subirDatosAnonimo(this.selectedImage);
    }
  }

  async tomarFoto() {
    try {
      this.cargando = true;

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        this.selectedImage = image.dataUrl;
        this.fotoUrl = this.selectedImage;
      } else {
        console.error('No se pudo obtener la imagen');
      }
    } catch (error) {
      console.error('Error al tomar la foto:', error);
    } finally {
      this.cargando = false;
    }
  }

  moverAlLogin() {
    this.router.navigate(['/login']);
  }
}