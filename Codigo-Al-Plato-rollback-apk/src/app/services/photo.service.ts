import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getStorage, ref, uploadString } from 'firebase/storage';
import { AuthService } from './auth.service';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  user: any = null;

  constructor(
    private authService: AuthService,
    private angularFirestorage: AngularFireStorage,
    private databaseService: DatabaseService
  ) {
    this.user = this.authService.usuarioIngresado;
  }

  async addNewToGallery(): Promise<string> {
    const capturedPhoto = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });

    const date = new Date().getTime();
    const name = `${this.user.email}_${date}.png`;
    const filePath = `clientes/${name}`;

    if (capturedPhoto.dataUrl) {
      const uploadTask = await this.angularFirestorage.upload(
        filePath,
        capturedPhoto.dataUrl
      );
      const url = await uploadTask.ref.getDownloadURL();
      return url;
    }
    return '';
  }
}
