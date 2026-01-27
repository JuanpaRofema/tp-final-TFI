import {
  IonicModule,
  ModalController,
  Platform,
  IonIcon,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
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
import { BarcodeScanningModalComponent } from './barcode-scanning-modal.component';
import { BarcodeScanner, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { faArrowLeft, faQrcode, faCamera } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import firebase from 'firebase/compat/app';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

@Component({
  selector: 'app-alta-cliente',
  templateUrl: './alta-cliente.component.html',
  styleUrls: ['./alta-cliente.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    IonicModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    BarcodeScanningModalComponent,
    RouterLink,
  ],
})
export class AltaClienteComponent implements OnInit {
  isLoading: boolean = true;
  faArrowLeft = faArrowLeft;
  faQrcode = faQrcode;
  faCamera = faCamera;

  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)

  clienteForm: FormGroup;
  anonimoForm: FormGroup;
  nombreFoto: string = '';
  cargando: boolean = false;
  selectedImage: string = '';
  scanResultDni = '';
  todosLosDatosDelDni: string = '';
  fotoUrl: string =
    'assets/faceless-businessman-user-profile-icon-business-leader-profile-picture-portrait-user-member-people-i.png';

  contrasenaDueño: string = '';
  emailDueño: string = '';

  async ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);

    if (this.platform.is('capacitor')) {
      BarcodeScanner.isSupported().then();
      BarcodeScanner.checkPermissions().then();
      BarcodeScanner.removeAllListeners();
    }
  }
  anonimo: boolean = false;

  constructor(
    private fb: FormBuilder,
    private database: DatabaseService,
    private photoService: PhotoService,
    public authService: AuthService,
    private modalController: ModalController,
    private platform: Platform,
    private library: FaIconLibrary,
    private router: Router
  ) {
    if (this.authService.usuarioIngresado === null) {
    } else if (this.authService.usuarioIngresado.tipoCliente === 'dueño') {
      this.emailDueño = this.authService.usuarioIngresado.email;
      this.contrasenaDueño = this.authService.usuarioIngresado.contrasena;
    }


    this.clienteForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        contraseña: ['', [Validators.required, Validators.minLength(6)]],
        repetir_contraseña: [
          '',
          [Validators.required, Validators.minLength(6)],
        ],
        nombre: [
          '',
          [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)],
        ],
        apellido: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
          ],
        ],
        dni: [
          '',
          [Validators.required, Validators.pattern(/^\d{2}.\d{3}.\d{3}$/)],
        ],
      },
      { validators: this.passwordsMatchValidator() }
    );

    this.anonimoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]],
    });

    this.library.addIcons(faQrcode);
    //this.correoUsuario = this.authService.usuarioIngresado.email;
  }

  passwordsMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const contraseña = control.get('contraseña')?.value;
      const repetirContraseña = control.get('repetir_contraseña')?.value;
      return contraseña === repetirContraseña
        ? null
        : { passwordsMismatch: true };
    };
  }

  async starScan() {
    const modal = await this.modalController.create({
      component: BarcodeScanningModalComponent,
      cssClass: 'barcode-scanning-modal',
      showBackdrop: false,
      componentProps: {
        formats: [],
        LensFacing: LensFacing.Back,
      },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      this.scanResultDni = data?.barcode?.displayValue;
      console.log((this.todosLosDatosDelDni = this.scanResultDni));

      const datos = this.scanResultDni.split('@');


      this.clienteForm.patchValue({
        apellido: datos[1] || '',
        nombre: datos[2] || '',
        dni: datos[4] || '',
      });

      this.formatearDocumento({ target: { value: datos[4] } });
    }
  }

  formatearDocumento(event: any) {
    let valor = event.target.value.replace(/\D/g, '');

    if (valor.length > 2) {
      valor = valor.slice(0, 2) + '.' + valor.slice(2);
    }

    if (valor.length > 6) {
      valor = valor.slice(0, 6) + '.' + valor.slice(6);
    }

    if (valor.length > 10) {
      valor = valor.slice(0, 10);
    }

    event.target.value = valor;
    this.clienteForm.get('dni')?.setValue(valor);
  }

  async subirDatos(dataUrl: string) {
    if (dataUrl && dataUrl.startsWith('data:image/')) {
      this.isLoading = true;
      try {
        const storage = getStorage();
        const storageRef = ref(storage, `images/${new Date().getTime()}.jpeg`);

        // Subir la imagen
        await uploadString(storageRef, dataUrl, 'data_url');
        console.log('Imagen subida exitosamente');

        // Obtener URL de descarga
        const photoUrl = await getDownloadURL(storageRef);
        const firestore = getFirestore();

        const clienteData = {
          ...this.clienteForm.value,
          foto: photoUrl,
          createdAt: new Date(),
          acceso: 'pendiente',
          tipoCliente: 'cliente',
          estadoMesa: 'sin-pedir',
          descuento: 0
        };

        await this.database.GuardarCliente(clienteData);
        await this.database.enviarNotificacion('dueño', {
          titulo: this.diccionario[this.idioma()]['Nuevocliente'],
          cuerpo: this.diccionario[this.idioma()]['Seregistróunnuevocliente'],
        });

        this.isLoading = false;

        Swal.fire({
          heightAuto: false,
          title: `Cliente creado con éxito `,
          background: '#333',
          color: '#fff',
          confirmButtonColor: '#780000',
          confirmButtonText: 'Aceptar',
        });
        if (
          this.authService.usuarioIngresado === 'dueño'
        ) {
          this.router.navigate(['/home']);
        } else {
          this.router.navigate(['/login']);
        }
        this.clienteForm.reset();
        this.fotoUrl =
          'assets/faceless-businessman-user-profile-icon-business-leader-profile-picture-portrait-user-member-people-i.png';
      } catch (error) {
        console.error('Error al subir la imagen y los datos:', error);
      } finally {
        this.isLoading = false; // Desactiva el spinner al finalizar
      }
    } else {
      console.error('El formato de la imagen no es válido.');
    }
  }

  async subirDatosAnonimo(dataUrl: string) {
    if (dataUrl && dataUrl.startsWith('data:image/')) {
      this.isLoading = true;
      try {
        const storage = getStorage();
        const storageRef = ref(storage, `images/${new Date().getTime()}.jpeg`);

        // Subir la imagen
        await uploadString(storageRef, dataUrl, 'data_url');
        console.log('Imagen subida exitosamente');

        // Obtener URL de descarga
        const photoUrl = await getDownloadURL(storageRef);
        const firestore = getFirestore();

        const clienteData = {
          ...this.anonimoForm.value,
          foto: photoUrl,
          createdAt: new Date(),
          acceso: 'permitido',
          tipoCliente: 'anonimo',
          estadoMesa: 'sin-pedir',
          descuento: 0
        };

        await this.database.GuardarCliente(clienteData);
        alert('Cliente y foto registrados con éxito');
        this.anonimoForm.reset();
      } catch (error) {
        console.error('Error al subir la imagen y los datos:', error);
      } finally {
        this.isLoading = false;
      }
    } else {
      console.error('El formato de la imagen no es válido.');
    }
  }

  onSubmit() {
    if (this.clienteForm.valid) {
      this.isLoading = true;

      this.authService
        .RegistrarUsuario(this.clienteForm.value)
        .then((response) => {
          this.authService.CerrarSesion();
          if (this.emailDueño !== '') {
            this.authService.IniciarSesion({
              email: this.emailDueño,
              contrasena: this.contrasenaDueño,
            });
          }
          console.log(this.authService.usuarioIngresado)
          this.subirDatos(this.selectedImage);
        });
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

  moverAlHome() {
    if (this.authService.usuarioIngresado === null) {
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
