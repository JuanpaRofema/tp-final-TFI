import { Component, inject, OnInit, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { faArrowLeft, faCamera } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import { getDownloadURL, getStorage, ref, uploadString } from 'firebase/storage';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

@Component({
  selector: 'app-alta-bebida',
  templateUrl: './alta-bebida.component.html',
  styleUrls: ['./alta-bebida.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    IonicModule,
    FontAwesomeModule,
    RouterLink,
  ],
})
export class AltaBebidaComponent implements OnInit {
  isLoading: boolean = true;
  faArrowLeft = faArrowLeft;
  faCamera = faCamera;

  // Fotos
  fotos: string[] = ['', '', ''];
  placeholder = 'assets/faceless-businessman-user-profile-icon-business-leader-profile-picture-portrait-user-member-people-i.png';

  nuevoProducto: any = {
    name: '',
    description: '',
    precio: '',
    tiempoEstimado: '',
    tipoProducto: 'bebida',
    image1: '',
    image2: '',
    image3: '',
    cantidad: 0
  };
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)

  constructor(
    private database: DatabaseService,
    public authService: AuthService,
    private router: Router,
    private library: FaIconLibrary
  ) {
    this.library.addIcons(faCamera);
    this.fotos = [this.placeholder, this.placeholder, this.placeholder];
  }

  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
    setTimeout(() => { this.isLoading = false; }, 1000);

  }

  async tomarFoto(index: number) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        this.fotos[index] = image.dataUrl;

        if (index === 0) this.nuevoProducto.image1 = image.dataUrl;
        if (index === 1) this.nuevoProducto.image2 = image.dataUrl;
        if (index === 2) this.nuevoProducto.image3 = image.dataUrl;
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
    }
  }

  async guardarProducto() {
    if (!this.nuevoProducto.name || !this.nuevoProducto.precio || !this.nuevoProducto.tiempoEstimado) {
      Swal.fire({
        icon: 'error',
        title: this.diccionario[this.idioma()]['Faltandatos'],
        text: this.diccionario[this.idioma()]['Completeloscamposobligatorios'],
        heightAuto: false,
        background: '#333',
        color: '#fff'
      });
      return;
    }

    this.isLoading = true;

    try {
      const storage = getStorage();

      const subirFoto = async (dataUrl: string): Promise<string> => {
        if (!dataUrl || dataUrl === this.placeholder) return '';
        const fileName = `bebida_${new Date().getTime()}_${Math.random()}.jpeg`;
        const storageRef = ref(storage, `productos/${fileName}`);
        await uploadString(storageRef, dataUrl, 'data_url');
        return await getDownloadURL(storageRef);
      };

      const [url1, url2, url3] = await Promise.all([
        subirFoto(this.nuevoProducto.image1),
        subirFoto(this.nuevoProducto.image2),
        subirFoto(this.nuevoProducto.image3)
      ]);

      const productoFormateado = {
        ...this.nuevoProducto,
        precio: Number(this.nuevoProducto.precio),
        image1: url1,
        image2: url2,
        image3: url3,
        cantidad: 0
      };

      await this.database.guardarObjeto(productoFormateado, 'productos');

      this.isLoading = false;

      Swal.fire({
        title: this.diccionario[this.idioma()]['BebidaCreada'],
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
      this.isLoading = false; Swal
      Swal.fire({
          heightAuto: false,
          title: this.diccionario[this.idioma()]['Clientecreadoconéxito'],
          background: '#333',
          color: '#fff',
          confirmButtonColor: '#780000',
          confirmButtonText: this.diccionario[this.idioma()]['Aceptar'],
        });
    }
  }

  moverAlHome() {
    this.router.navigate(['/home']);
  }
}