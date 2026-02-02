import { Component, inject, OnInit, signal } from '@angular/core';
import { IonicModule, ModalController, Platform } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { DICCIONARIO } from 'src/assets/diccionario';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { faArrowLeft, faQrcode, faCamera } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { DatabaseService } from 'src/app/services/database.service';
import { getStorage, ref, getDownloadURL, uploadString } from 'firebase/storage';
import { CameraResultType, CameraSource, Camera } from '@capacitor/camera';
import { BarcodeScanningModalComponent } from './barcode-scanning-modal.component';
import { BarcodeScanner, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import Swal from 'sweetalert2';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

@Component({
  selector: 'app-agregar-empleado',
  templateUrl: './agregar-empleado.component.html',
  styleUrls: ['./agregar-empleado.component.scss'],
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
export class AgregarEmpleadoComponent implements OnInit {
  isLoading: boolean = true;
  faArrowLeft = faArrowLeft;
  faCamera = faCamera;
  faQrcode = faQrcode;

  clienteForm: FormGroup;
  fotoUrl: string = 'assets/faceless-businessman-user-profile-icon-business-leader-profile-picture-portrait-user-member-people-i.png';
  selectedImage: string = '';
  scanResultDni = '';

  mostrarPerfil = false;
  contrasenaDueño: string = '';
  emailDueño: string = '';

  idioma: any = signal("es")
  diccionario = DICCIONARIO
  cambioIdioma = inject(CambioIdioma)

  constructor(
    private fb: FormBuilder,
    private database: DatabaseService,
    public authService: AuthService,
    private modalController: ModalController,
    private platform: Platform,
    private library: FaIconLibrary,
    private router: Router
  ) {

    if (this.authService.usuarioIngresado?.tipoCliente === 'dueño') {
      this.emailDueño = this.authService.usuarioIngresado.email;
      this.contrasenaDueño = this.authService.usuarioIngresado.contrasena;
    }

    this.clienteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      contraseña: ['', [Validators.required, Validators.minLength(6)]],
      repetir_contraseña: ['', [Validators.required, Validators.minLength(6)]],
      nombre: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]],
      apellido: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{2}.\d{3}.\d{3}$/)]],
      cuil: ['', [Validators.required, Validators.pattern(/^\d{2}.\d{2}.\d{3}.\d{3}.\d{1}$/)]],
      tipoEmpleado: ['', [Validators.required]],
      perfil: [''],
    }, { validators: this.passwordsMatchValidator() });

    this.library.addIcons(faQrcode, faCamera);
  }

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

  passwordsMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const contraseña = control.get('contraseña')?.value;
      const repetirContraseña = control.get('repetir_contraseña')?.value;
      return contraseña === repetirContraseña ? null : { passwordsMismatch: true };
    };
  }

  onTipoEmpleadoChange(event: any) {
    const tipo = event.detail.value;
    this.mostrarPerfil = tipo === "cocinero";

    const perfilControl = this.clienteForm.get('perfil');
    if (this.mostrarPerfil) {
      perfilControl?.setValidators([Validators.required]);
    } else {
      perfilControl?.clearValidators();
      perfilControl?.setValue('');
    }
    perfilControl?.updateValueAndValidity();
  }

  async starScan() {
    const modal = await this.modalController.create({
      component: BarcodeScanningModalComponent,
      cssClass: 'barcode-scanning-modal',
      showBackdrop: false,
      componentProps: { formats: [], LensFacing: LensFacing.Back },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data?.barcode?.displayValue) {
      this.scanResultDni = data.barcode.displayValue;
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
    if (valor.length > 2) valor = valor.slice(0, 2) + '.' + valor.slice(2);
    if (valor.length > 6) valor = valor.slice(0, 6) + '.' + valor.slice(6);
    if (valor.length > 10) valor = valor.slice(0, 10);
    event.target.value = valor;
    this.clienteForm.get('dni')?.setValue(valor);
  }

  formatearCuil(event: any) {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 2) valor = valor.slice(0, 2) + '.' + valor.slice(2);
    if (valor.length > 5) valor = valor.slice(0, 5) + '.' + valor.slice(5);
    if (valor.length > 9) valor = valor.slice(0, 9) + '.' + valor.slice(9);
    if (valor.length > 13) valor = valor.slice(0, 13) + '.' + valor.slice(13);
    if (valor.length > 14) valor = valor.slice(0, 15);
    event.target.value = valor;
    this.clienteForm.get('cuil')?.setValue(valor);
  }

  async tomarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        this.selectedImage = image.dataUrl;
        this.fotoUrl = this.selectedImage;
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
    }
  }

  onSubmit() {
    if (this.clienteForm.valid) {
      this.isLoading = true;

      this.authService.RegistrarUsuario(this.clienteForm.value)
        .then(() => {
          this.authService.CerrarSesion();
          if (this.emailDueño) {
            this.authService.IniciarSesion({ email: this.emailDueño, contrasena: this.contrasenaDueño });
          }
          this.subirDatos(this.selectedImage);
        })
        .catch(err => {
          this.isLoading = false;
          Swal.fire({ icon: 'error', title: this.diccionario[this.idioma()]['Error'], text: err.message, background: '#333', color: '#fff' });
        });
    }
  }

  async subirDatos(dataUrl: string) {
    try {
      let photoUrl = this.fotoUrl;

      if (dataUrl && dataUrl.startsWith('data:image/')) {
        const storage = getStorage();
        const storageRef = ref(storage, `images/${new Date().getTime()}.jpeg`);
        await uploadString(storageRef, dataUrl, 'data_url');
        photoUrl = await getDownloadURL(storageRef);
      }

      const empleadoData = {
        ...this.clienteForm.value,
        foto: photoUrl,
        createdAt: new Date(),
        acceso: 'pendiente',

      };


      if (empleadoData.tipoEmpleado === 'cocinero') {
        empleadoData.tipoCliente = empleadoData.perfil === 'chef' ? 'chef' : 'bartender';
        await this.database.GuardarCocinero(empleadoData);
      } else if (empleadoData.tipoEmpleado === 'mesero') {
        empleadoData.tipoCliente = 'mesero';
        await this.database.GuardarMeseros(empleadoData);
      } else if (empleadoData.tipoEmpleado === 'maitre') {
        empleadoData.tipoCliente = 'maitre';
        await this.database.GuardarMaitre(empleadoData);
      }

      await this.database.enviarNotificacion('dueño', {
        titulo: this.diccionario[this.idioma()]['NuevoEmpleado'],
        cuerpo: `${this.diccionario[this.idioma()]['SeRegistroUn']} ${empleadoData.tipoCliente}.`,
      });

      this.isLoading = false;

      Swal.fire({
        heightAuto: false,
        title: this.diccionario[this.idioma()]['EmpleadoRegistrado'],
        icon: 'success',
        background: '#333',
        color: '#fff',
        confirmButtonColor: '#4caf50',
        confirmButtonText: this.diccionario[this.idioma()]['Aceptar'],
      }).then(() => {
        this.moverAlHome();
      });

      this.clienteForm.reset();

    } catch (error) {
      console.error('Error subiendo empleado:', error);
      this.isLoading = false;
    }
  }

  moverAlHome() {
    if (this.authService.usuarioIngresado) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}