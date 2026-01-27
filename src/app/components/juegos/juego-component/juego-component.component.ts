import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Motion } from '@capacitor/motion';
import { PersonajeService } from 'src/app/services/personaje.service';
import { AlertController, ToastController, IonicModule, ViewWillEnter, ViewDidLeave } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import { PedidoService } from 'src/app/services/pedido.service';
import { DICCIONARIO } from 'src/assets/diccionario';

@Component({
  standalone : true,
  imports : [FormsModule, CommonModule, RouterModule, FontAwesomeModule, IonicModule],
  selector: 'app-juego',
  templateUrl: './juego-component.component.html',
  styleUrls: ['./juego-component.component.scss'],
})
export class JuegoComponentComponent  implements ViewWillEnter, ViewDidLeave {

iconSignOutAlt = faSignOutAlt;
  jugando: boolean = false;
  

  flagChoque: boolean = false;
  flagMotion: boolean = false;
  descuento: boolean = false;
  

  personajeActual: any;
  personajeDiv: any;
  imagenPersonaje: string | null = null;
  

  x: number = 0;
  y: number = 0;
  velX: number = 0;
  velY: number = 0;
  

  tiltX: number = 0;
  tiltY: number = 0;


  aceleracion: number = 0.5; 
  friccion: number = 0.95;   
  limiteVelocidad: number = 15;

  animationFrameId: any;
  puntosId: any;

  puntos: number = 0;
  perdio: boolean = false;
  puntosGuardados: number = 0;
  dc!: boolean;
  perdioNum: number = 0;

  constructor(private router: Router, private perso : PersonajeService,
     private auth: AuthService, private toastController: ToastController, private db: DatabaseService, public pedidoService:PedidoService) { }

        ionViewWillEnter() {
    this.pedidoService.setMostrarInfo(false);
    this.imagenPersonaje = this.perso.srcPersonaje;
    this.dc = this.perso.dc;

    if (this.imagenPersonaje) {
      this.iniciarJuego();
    } else {

      this.router.navigateByUrl('/personaje');
    }
  }

  ionViewDidLeave() {
    this.pedidoService.setMostrarInfo(true);
    this.stopGameLoop();
    this.stopMotion();
    if (this.puntosId) clearInterval(this.puntosId);
  }

  iniciarJuego() {
    this.jugando = true;
    this.perdio = false;
    this.descuento = false;
    

    this.x = 0;
    this.y = 0;
    this.velX = 0;
    this.velY = 0;
    this.tiltX = 0;
    this.tiltY = 0;

    setTimeout(async () => {
    
      this.puntosId = setInterval(() => {
        if (!this.flagChoque) this.puntos++;
      }, 1000);

      this.personajeDiv = document.getElementById('personaje');
      if (this.personajeDiv) {
        this.personajeDiv.style.transform = `translate(${0}px, ${0}px)`;
      }
      
      this.flagMotion = true;
      this.startMotion(); 
      this.startGameLoop();
    }, 500);
  }


  startMotion() {
    Motion.addListener('orientation', (event: any) => {
      this.tiltX = Number(event.gamma);
      this.tiltY = Number(event.beta);
    });
  }

  stopMotion() {
    Motion.removeAllListeners();
  }


  startGameLoop() {
    const loop = () => {
      if (!this.jugando || this.flagChoque) return;

      this.updatePhysics();
      this.detectarColision();

      if (this.personajeDiv) {
        this.personajeDiv.style.transform = `translate(${this.x}px, ${this.y}px)`;
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  stopGameLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }


  updatePhysics() {
    this.velX += this.tiltX * (this.aceleracion * 0.1); 
    this.velY += this.tiltY * (this.aceleracion * 0.1);

    this.velX *= this.friccion;
    this.velY *= this.friccion;

    this.velX = Math.max(Math.min(this.velX, this.limiteVelocidad), -this.limiteVelocidad);
    this.velY = Math.max(Math.min(this.velY, this.limiteVelocidad), -this.limiteVelocidad);

    this.x += this.velX;
    this.y += this.velY;
  }

  detectarColision() {
    if (!this.personajeDiv) return;

    const rect = this.personajeDiv.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    if (rect.left <= 0 || rect.right >= winW || rect.top <= 0 || rect.bottom >= winH) {
      this.triggerChoque();
    }
  }

  triggerChoque() {
    if (this.flagChoque) return; 
    
    this.flagChoque = true;
    this.stopGameLoop();
    if (this.puntosId) clearInterval(this.puntosId);

    if (navigator.vibrate) navigator.vibrate(200);

    setTimeout(() => {
      this.perdio = true;
      this.perdido();
    }, 1000); 
  }

  salir() {
    this.stopGameLoop();
    this.stopMotion();
    this.router.navigateByUrl('/personajes');
  }

  perdido() {
    this.flagMotion = false;
    this.jugando = false;
    this.puntosGuardados = this.puntos;
    this.perdioNum++;

    if (this.auth.usuarioIngresado.descuento != 0) {
       if (this.puntosGuardados > 3 && this.perdioNum === 1) {
           this.showAlert('¡Felicidades!', `Aguantaste más de 3 segundos. Ganaste 20% OFF!`, true);
       } else {
           this.showAlert('¡Muy bien!', `Aguantaste ${this.puntos} segundos.`, false);
       }
    } else {
       this.showAlert('¡Muy bien!', `Aguantaste ${this.puntos} segundos.`, false);
    }
    
    this.puntos = 0;
  }

  showAlert(title: string, text: string, isWin: boolean) {
    Swal.fire({
      title: title,
      text: text,
      icon: 'success', 
      showCancelButton: true,
      confirmButtonText: 'Nueva partida',
      cancelButtonText: 'Salir',
      allowOutsideClick: false,
      allowEscapeKey: false,
      heightAuto: false
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.flagChoque = false;
        this.iniciarJuego();
      } else {
        this.salir();
      }
    });
  }

  logOut() {
    this.router.navigate(['/personajes']);
  }

}
