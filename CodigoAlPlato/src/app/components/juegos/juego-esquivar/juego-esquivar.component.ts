import { Component, ElementRef, OnDestroy, OnInit, ViewChild, HostListener, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { ViewDidEnter, ViewDidLeave, ViewWillEnter } from '@ionic/angular';
import { PedidoService } from 'src/app/services/pedido.service';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

interface GameObject {
  x: number; y: number; width: number; height: number;
  type: 'player' | 'goal' | 'obstacle';
  icon?: string; name?: string;
}

@Component({
  selector: 'app-juego-esquivar',
  templateUrl: './juego-esquivar.component.html',
  styleUrls: ['./juego-esquivar.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class JuegoEsquivarComponent implements ViewDidLeave, ViewWillEnter {
  @ViewChild('gameArea') gameAreaRef!: ElementRef;

  constructor(
    private router: Router,
    private auth: AuthService,
    private db: DatabaseService,
    private pedidoService: PedidoService
  ) { }

  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)

  gameState: 'start' | 'playing' | 'win' | 'lose' = 'start';
  isPlaying = false;
  isDesktop = false;
  primerIntento = true;

  velocity = { x: 0, y: 0 };
  acceleration = { x: 0, y: 0 };
  friction = 0.95;
  speedMultiplier = 0.5;

  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;

  player: GameObject = { x: 20, y: 20, width: 60, height: 60, type: 'player' };
  goal: GameObject = { x: 0, y: 0, width: 80, height: 80, type: 'goal' };
  obstacles: GameObject[] = [];

  animationFrameId: any;
  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
  }
  ionViewWillEnter() {
    this.pedidoService.setMostrarInfo(false);
    this.checkPlatform();
    this.updateDimensions();
    window.addEventListener('resize', () => this.updateDimensions());
  }

  ionViewDidLeave() {
    this.pedidoService.setMostrarInfo(true);
    this.stopGameLoop();
    window.removeEventListener('deviceorientation', this.handleOrientation);
  }



  updateDimensions() { this.screenWidth = window.innerWidth; this.screenHeight = window.innerHeight; }
  checkPlatform() { this.isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); }
  async startGame() {
    this.gameState = 'playing';
    this.isPlaying = true;
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.player.x = 20; this.player.y = 20;
    this.goal.x = this.screenWidth - 100; this.goal.y = this.screenHeight - 100;
    this.generateObstacles();
    window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
    this.startGameLoop();
  }
  generateObstacles() {
    this.obstacles = [];
    const types = ['⛸️', '🍌', '🛢️'];
    const padding = 120;
    for (let i = 0; i < 3; i++) {
      this.obstacles.push({
        x: Math.random() * (this.screenWidth - padding * 2) + padding,
        y: Math.random() * (this.screenHeight - padding * 2) + padding,
        width: 50, height: 50, type: 'obstacle', icon: types[i]
      });
    }
  }
  handleOrientation(event: DeviceOrientationEvent) {
    if (!this.isPlaying) return;
    let x = event.gamma || 0; let y = event.beta || 0;
    if (x > 40) x = 40; if (x < -40) x = -40;
    if (y > 40) y = 40; if (y < -40) y = -40;
    this.acceleration.x = x * this.speedMultiplier;
    this.acceleration.y = y * this.speedMultiplier;
  }
  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    if (!this.isPlaying) return;
    const speed = 2;
    switch (event.key) {
      case 'ArrowUp': this.acceleration.y = -speed * 5; break;
      case 'ArrowDown': this.acceleration.y = speed * 5; break;
      case 'ArrowLeft': this.acceleration.x = -speed * 5; break;
      case 'ArrowRight': this.acceleration.x = speed * 5; break;
    }
  }
  @HostListener('window:keyup') resetKeyboard() { this.acceleration = { x: 0, y: 0 }; }
  startGameLoop() {
    const loop = () => {
      if (!this.isPlaying) return;
      this.updatePhysics();
      this.checkCollisions();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }
  stopGameLoop() { cancelAnimationFrame(this.animationFrameId); this.isPlaying = false; }
  updatePhysics() {
    this.velocity.x += this.acceleration.x * 0.1;
    this.velocity.y += this.acceleration.y * 0.1;
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    this.player.x += this.velocity.x;
    this.player.y += this.velocity.y;
  }
  checkCollisions() {
    if (this.player.x < 0 || this.player.x > this.screenWidth - 60 ||
      this.player.y < 0 || this.player.y > this.screenHeight - 60) {
      this.gameOver('lose'); return;
    }
    for (const obs of this.obstacles) {
      if (this.isOverlapping(this.player, obs)) { this.gameOver('lose'); return; }
    }
    if (this.isOverlapping(this.player, this.goal)) { this.gameOver('win'); }
  }
  isOverlapping(a: any, b: any) {
    const p = 10;
    return (a.x + p < b.x + b.width - p && a.x + a.width - p > b.x + p &&
      a.y + p < b.y + b.height - p && a.y + a.height - p > b.y + p);
  }

  gameOver(result: 'win' | 'lose') {
    this.stopGameLoop();
    this.gameState = result;
    this.vibrate();

    if (result === 'lose') {
      this.primerIntento = false;
      ;
    } else {

      this.handleWinLogic();
    }
  }

  async handleWinLogic() {

    if (this.auth.usuarioIngresado) {

      if (this.auth.usuarioIngresado.descuento <= 0) {

        this.auth.usuarioIngresado.descuento = 0.30;

        try {
          await this.db.ModificarObjeto(this.auth.usuarioIngresado, 'clientes');
          console.log('✅ Descuento del 30% aplicado en Firebase');
        } catch (error) {
          console.error('❌ Error guardando descuento:', error);
        }

        Swal.fire({
          title: this.diccionario[this.idioma()]['Impecable'],
          text: this.diccionario[this.idioma()]['Ganasteun30dedescuentoentupedido'],
          icon: 'success',
          heightAuto: false,
          showCancelButton: true,
          confirmButtonText: this.diccionario[this.idioma()]['Jugardenuevo'],
          cancelButtonText: this.diccionario[this.idioma()]['VolveralMenú'],
          confirmButtonColor: '#4caf50',
          cancelButtonColor: '#d33',
          reverseButtons: true
        }).then((result) => {
          if (result.isDismissed) {
            this.salirDelJuego();
          } else {
            this.primerIntento = false;
            this.gameState = 'start';
          }
        });

        this.primerIntento = false;

      } else {

        Swal.fire({
          title: this.diccionario[this.idioma()]['MuybienGanaste'],
          text: this.diccionario[this.idioma()]['Pedidoentregadoconéxito'],
          icon: 'success',
          heightAuto: false,
          showCancelButton: true,
          confirmButtonText: this.diccionario[this.idioma()]['Jugardenuevo'],
          cancelButtonText: this.diccionario[this.idioma()]['VolveralMenú'],
          confirmButtonColor: '#4caf50',
          cancelButtonColor: '#d33',
          reverseButtons: true
        }).then((result) => {
          if (result.isDismissed) {
            this.salirDelJuego();
          } else {
            this.gameState = 'start';
          }
        });
      }

    } else {
      console.warn('No hay usuario logueado para aplicar descuento');
    }
  }

  vibrate() { if (navigator.vibrate) navigator.vibrate(500); }

  salirDelJuego() {
    this.router.navigateByUrl('/juego');
  }
}