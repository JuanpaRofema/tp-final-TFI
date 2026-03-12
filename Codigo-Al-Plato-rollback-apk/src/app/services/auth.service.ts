import { inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  Unsubscribe,
  GoogleAuthProvider,
  signInWithPopup,
} from '@angular/fire/auth';
import { DatabaseService } from './database.service';
import { Router } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';
import firebase from 'firebase/compat';
import { isPlatform } from '@ionic/angular';
import { getAuth,signInWithCredential } from 'firebase/auth';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // usuario info

  usuarioDeDB: any = null;
  authSubscription?: Unsubscribe;

  tipoDeUsuarioIngresado: any | null = null;
  usuarioIngresado: any | null = null;
  usuarioEncontrado: boolean = false;

  // Injecciones
  private auth = inject(Auth);

  constructor(private db: DatabaseService, private router: Router) {
    this.authSubscription = this.auth.onAuthStateChanged((auth) => {
      if (auth?.email) {
        this.usuarioIngresado = auth;
        this.tipoDeUsuarioIngresado = '';
        this.usuarioEncontrado = false;

        const observable = db.TraerUsuario('clientes');
        observable.subscribe((resultado) => {
          resultado.forEach((usuario) => {
             console.log('Clientes en DB:', resultado);
            this.usuarioDeDB = usuario;
            if (this.usuarioDeDB.email === this.usuarioIngresado.email) {
              this.usuarioIngresado = this.usuarioDeDB;
              this.tipoDeUsuarioIngresado = 'cliente';
              this.usuarioEncontrado = true;
            }
          });
        });


        if (!this.usuarioEncontrado) {
          const observableMeseros = db.TraerUsuario('meseros');
          observableMeseros.subscribe((resultado) => {
            resultado.forEach((usuario) => {
              this.usuarioDeDB = usuario;
              if (this.usuarioDeDB.email === this.usuarioIngresado.email) {
                this.usuarioIngresado = this.usuarioDeDB;
                this.tipoDeUsuarioIngresado = 'mesero';
                this.usuarioEncontrado = true;
              }
            });
          });
        }

        if (!this.usuarioEncontrado) {
          const observableMeseros = db.TraerUsuario('deliery_pedidos');
          observableMeseros.subscribe((resultado) => {
            resultado.forEach((usuario) => {
              this.usuarioDeDB = usuario;
              if (this.usuarioDeDB.email === this.usuarioIngresado.email) {
                this.usuarioIngresado = this.usuarioDeDB;
                this.tipoDeUsuarioIngresado = 'delivery';
                this.usuarioEncontrado = true;
              }
            });
          });
        }

        if (!this.usuarioEncontrado) {
          const observableDueños = db.TraerUsuario('dueños');
          observableDueños.subscribe((resultado) => {
            resultado.forEach((usuario) => {
              this.usuarioDeDB = usuario;
              if (this.usuarioDeDB.email === this.usuarioIngresado.email) {
                console.log(this.usuarioDeDB.email);
                console.log(auth.email);
                this.usuarioIngresado = this.usuarioDeDB;
                this.tipoDeUsuarioIngresado = 'dueño';
                this.usuarioEncontrado = true;
              }
            });
          });
        }

        if (!this.usuarioEncontrado) {
          const observableMaitres = db.TraerUsuario('maitre');
          observableMaitres.subscribe((resultado) => {
            resultado.forEach((usuario) => {
              this.usuarioDeDB = usuario;
              if (this.usuarioDeDB.email === this.usuarioIngresado.email) {
                console.log(this.usuarioDeDB.email);
                console.log(auth.email);
                this.usuarioIngresado = this.usuarioDeDB;
                this.tipoDeUsuarioIngresado = 'maitre';
                this.usuarioEncontrado = true;
              }
            });
          });
        }
        if (!this.usuarioEncontrado) {
          const observableChef = db.TraerUsuario('chefs');
          observableChef.subscribe((resultado) => {
            resultado.forEach((usuario) => {
              this.usuarioDeDB = usuario;
              if (this.usuarioDeDB.email === this.usuarioIngresado.email) {
                console.log(this.usuarioDeDB.email);
                console.log(auth.email);
                this.usuarioIngresado = this.usuarioDeDB;
                this.tipoDeUsuarioIngresado = 'chef';
                this.usuarioEncontrado = true;
              }
            });
          });
        }
        if (!this.usuarioEncontrado) {
          const observableBartenders = db.TraerUsuario('bartenders');
          observableBartenders.subscribe((resultado) => {
            resultado.forEach((usuario) => {
              this.usuarioDeDB = usuario;
              if (this.usuarioDeDB.email === this.usuarioIngresado.email) {
                console.log(this.usuarioDeDB.email);
                console.log(auth.email);
                this.usuarioIngresado = this.usuarioDeDB;
                this.tipoDeUsuarioIngresado = 'bartender';
                this.usuarioEncontrado = true;
              }
            });
          });
        }
        if (!this.usuarioEncontrado) {
          const observableBartenders = db.TraerUsuario('supervisor');
          observableBartenders.subscribe((resultado) => {
            resultado.forEach((usuario) => {
              this.usuarioDeDB = usuario;
              if (this.usuarioDeDB.email === this.usuarioIngresado.email) {
                console.log(this.usuarioDeDB.email);
                console.log(auth.email);
                this.usuarioIngresado = this.usuarioDeDB;
                this.tipoDeUsuarioIngresado = 'supervisor';
                this.usuarioEncontrado = true;
              }
            });
          });
        }
      } else {
        this.usuarioEncontrado = false;
        this.tipoDeUsuarioIngresado = '';
        this.usuarioIngresado = null;
      }
    });
  }

  async esperarTipoDeUsuario(): Promise<void> {
    return new Promise((resolve) => {
      const intervalo = setInterval(() => {
        if (this.tipoDeUsuarioIngresado !== null && this.usuarioEncontrado) {
          clearInterval(intervalo);
          resolve();
        }
      }, 100);
    });
  }

  RegistrarUsuario({ email, contraseña }: any) {
    return createUserWithEmailAndPassword(this.auth, email, contraseña);
  }

  IniciarSesion({ email, contrasena }: any) {
    return signInWithEmailAndPassword(this.auth, email, contrasena);
  }

  CerrarSesion() {
  this.limpiarSuscripciones();
  return signOut(this.auth);
}
private suscripciones: any[] = [];

agregarSuscripcion(sub: any) {
  this.suscripciones.push(sub);
}

limpiarSuscripciones() {
  this.suscripciones.forEach(s => {
    if (s && typeof s.unsubscribe === 'function') {
      s.unsubscribe();
    }
  });
  this.suscripciones = [];
}


 async loginWithGoogle() {
  const auth = getAuth();
  console.log('isPlatform capacitor?', isPlatform('capacitor'));

  try {
    if (isPlatform('capacitor')) {
      console.log('USANDO LOGIN MÓVIL');
      await GoogleAuth.signOut();

      const googleUser = await GoogleAuth.signIn();
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);

      const result = await signInWithCredential(auth, credential);
      console.log('Login de Google exitoso:', result);
      this.router.navigateByUrl('/home', { replaceUrl: true });

      return result;
    } else {
      console.log('USANDO LOGIN WEB');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      this.router.navigateByUrl('/home', { replaceUrl: true });
      return result;
    }
  } catch (error) {
    console.error('Error en login con Google:', error);
    return
  }
}

}
