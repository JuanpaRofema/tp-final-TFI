import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { faArrowLeft, faCamera } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import { getDownloadURL, getStorage, ref, uploadString } from 'firebase/storage';
import { QRCodeComponent } from 'angularx-qrcode';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

@Component({
  selector: 'app-alta-mesa',
  templateUrl: './alta-mesa.component.html',
  styleUrls: ['./alta-mesa.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    IonicModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    RouterLink,
    QRCodeComponent,
  ],
})
export class AltaMesaComponent {
  @ViewChild('qrContainer', { static: false }) qrContainer!: ElementRef;

  isLoading: boolean = true;
  faArrowLeft = faArrowLeft;
  faCamera = faCamera;

  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)

  fotoUrl: string = 'assets/faceless-businessman-user-profile-icon-business-leader-profile-picture-portrait-user-member-people-i.png';
  selectedImage: string = '';

  nuevaMesa: any = {
    numero: '',
    cantidadComensales: '',
    tipo: 'estandar',
    estado: 'desocupada',
    ocupadaPor: '',
    foto: '',
    qrString: '',
    qrImage: '',
  };

  constructor(
    private database: DatabaseService,
    public authService: AuthService,
    private router: Router,
    private library: FaIconLibrary
  ) {
    this.library.addIcons(faCamera);

    setTimeout(() => { this.isLoading = false; }, 1000);
  }
  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
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

  async capturarQRComoImagen(): Promise<string | null> {

    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas: HTMLCanvasElement = this.qrContainer?.nativeElement.querySelector('canvas');
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  }

  async crearMesa() {
    if (!this.selectedImage || !this.nuevaMesa.numero || !this.nuevaMesa.cantidadComensales) {
      Swal.fire({
        icon: 'error',
        title: this.diccionario[this.idioma()]['Faltandatos'],
        text: this.diccionario[this.idioma()]['Completetodosloscamposylafoto'],
        heightAuto: false,
        background: '#333',
        color: '#fff'
      });
      return;
    }

    this.isLoading = true;

    try {
      const storage = getStorage();


      const storageRef = ref(storage, `mesas/mesa_${this.nuevaMesa.numero}_${new Date().getTime()}.jpeg`);
      await uploadString(storageRef, this.selectedImage, 'data_url');
      const photoUrl = await getDownloadURL(storageRef);


      const qrDataUrl = await this.capturarQRComoImagen();
      let qrImageUrl = '';

      if (qrDataUrl) {
        const qrRef = ref(storage, `qrs/mesa-${this.nuevaMesa.numero}.png`);
        await uploadString(qrRef, qrDataUrl, 'data_url');
        qrImageUrl = await getDownloadURL(qrRef);
      }

      // 
      const mesaData = {
        ...this.nuevaMesa,
        numero: Number(this.nuevaMesa.numero),
        cantidadComensales: Number(this.nuevaMesa.cantidadComensales),
        foto: photoUrl,
        qrString: `mesa-${this.nuevaMesa.numero}`,
        qrImage: qrImageUrl,
      };

      await this.database.GuardarMesas(mesaData);

      this.isLoading = false;

      Swal.fire({
        title: this.diccionario[this.idioma()]['MesaCreada'],
        text: `${this.diccionario[this.idioma()]['Mesa']} ${mesaData.numero} ${this.diccionario[this.idioma()]['registradaconéxito']}`,
        icon: 'success',
        background: '#333',
        color: '#fff',
        confirmButtonColor: '#4caf50',
        heightAuto: false
      }).then(() => {
        this.moverAlHome();
      });

    } catch (error) {
      console.error('Error:', error);
      this.isLoading = false;
      Swal.fire({
        title: this.diccionario[this.idioma()]['Error'],
        text: this.diccionario[this.idioma()]['Nosepudocrearlamesa'],
        icon: 'error',
        background: '#333',
        color: '#fff'
      });
    }
  }

  moverAlHome() {
    this.router.navigate(['/home']);
  }
}