import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faRightFromBracket, faComment } from '@fortawesome/free-solid-svg-icons';
import { ModalController, Platform, ViewDidEnter, ViewDidLeave, ViewWillEnter } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import Swal from 'sweetalert2';
import { PedidoService } from 'src/app/services/pedido.service';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';
// import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-mayor-menor',
  imports: [RouterLink, FontAwesomeModule],
  standalone: true,
  templateUrl: './mayor-menor.html',
  styleUrl: './mayor-menor.scss'
})
export class MayorMenor implements ViewWillEnter, ViewDidLeave {
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)
  faRightFromBracket = faRightFromBracket;
  faComent = faComment;

  constructor(protected auth: AuthService,
    protected router: Router,
    private modalController: ModalController,
    protected platform: Platform,
    protected db: DatabaseService,
    protected pedidoService: PedidoService) { }

  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
  }
  ionViewWillEnter() {
    this.pedidoService.setMostrarInfo(false);
  }

  ionViewDidLeave() {
    this.pedidoService.setMostrarInfo(true);
  }

  cartasPoker = [
    { nombre: "A de Corazones", valor: 14, imagen: "assets/iconos/cartas/corazon/ACECora.png" },
    { nombre: "2 de Corazones", valor: 2, imagen: "assets/iconos/cartas/corazon/2Cora.png" },
    { nombre: "3 de Corazones", valor: 3, imagen: "assets/iconos/cartas/corazon/3Cora.png" },
    { nombre: "4 de Corazones", valor: 4, imagen: "assets/iconos/cartas/corazon/4Cora.png" },
    { nombre: "5 de Corazones", valor: 5, imagen: "assets/iconos/cartas/corazon/5Cora.png" },
    { nombre: "6 de Corazones", valor: 6, imagen: "assets/iconos/cartas/corazon/6Cora.png" },
    { nombre: "7 de Corazones", valor: 7, imagen: "assets/iconos/cartas/corazon/7Cora.png" },
    { nombre: "8 de Corazones", valor: 8, imagen: "assets/iconos/cartas/corazon/8Cora.png" },
    { nombre: "9 de Corazones", valor: 9, imagen: "assets/iconos/cartas/corazon/9Cora.png" },
    { nombre: "10 de Corazones", valor: 10, imagen: "assets/iconos/cartas/corazon/10Cora.png" },
    { nombre: "J de Corazones", valor: 11, imagen: "assets/iconos/cartas/corazon/JCora.png" },
    { nombre: "Q de Corazones", valor: 12, imagen: "assets/iconos/cartas/corazon/QCora.png" },
    { nombre: "K de Corazones", valor: 13, imagen: "assets/iconos/cartas/corazon/KCora.png" },

    { nombre: "A de Diamantes", valor: 14, imagen: "assets/iconos/cartas/diamante/ACEDiam.png" },
    { nombre: "2 de Diamantes", valor: 2, imagen: "assets/iconos/cartas/diamante/2Diam.png" },
    { nombre: "3 de Diamantes", valor: 3, imagen: "assets/iconos/cartas/diamante/3Diam.png" },
    { nombre: "4 de Diamantes", valor: 4, imagen: "assets/iconos/cartas/diamante/4Diam.png" },
    { nombre: "5 de Diamantes", valor: 5, imagen: "assets/iconos/cartas/diamante/5Diam.png" },
    { nombre: "6 de Diamantes", valor: 6, imagen: "assets/iconos/cartas/diamante/6Diam.png" },
    { nombre: "7 de Diamantes", valor: 7, imagen: "assets/iconos/cartas/diamante/7Diam.png" },
    { nombre: "8 de Diamantes", valor: 8, imagen: "assets/iconos/cartas/diamante/8Diam.png" },
    { nombre: "9 de Diamantes", valor: 9, imagen: "assets/iconos/cartas/diamante/9Diam.png" },
    { nombre: "10 de Diamantes", valor: 10, imagen: "assets/iconos/cartas/diamante/10Diam.png" },
    { nombre: "J de Diamantes", valor: 11, imagen: "assets/iconos/cartas/diamante/JDiam.png" },
    { nombre: "Q de Diamantes", valor: 12, imagen: "assets/iconos/cartas/diamante/QDiam.png" },
    { nombre: "K de Diamantes", valor: 13, imagen: "assets/iconos/cartas/diamante/KDiam.png" },

    { nombre: "A de Tréboles", valor: 14, imagen: "assets/iconos/cartas/trebol/AceTreb.png" },
    { nombre: "2 de Tréboles", valor: 2, imagen: "assets/iconos/cartas/trebol/2treb.png" },
    { nombre: "3 de Tréboles", valor: 3, imagen: "assets/iconos/cartas/trebol/3Treb.png" },
    { nombre: "4 de Tréboles", valor: 4, imagen: "assets/iconos/cartas/trebol/4Treb.png" },
    { nombre: "5 de Tréboles", valor: 5, imagen: "assets/iconos/cartas/trebol/5Treb.png" },
    { nombre: "6 de Tréboles", valor: 6, imagen: "assets/iconos/cartas/trebol/6Treb.png" },
    { nombre: "7 de Tréboles", valor: 7, imagen: "assets/iconos/cartas/trebol/7Treb.png" },
    { nombre: "8 de Tréboles", valor: 8, imagen: "assets/iconos/cartas/trebol/8Treb.png" },
    { nombre: "9 de Tréboles", valor: 9, imagen: "assets/iconos/cartas/trebol/9Treb.png" },
    { nombre: "10 de Tréboles", valor: 10, imagen: "assets/iconos/cartas/trebol/10Treb.png" },
    { nombre: "J de Tréboles", valor: 11, imagen: "assets/iconos/cartas/trebol/JTreb.png" },
    { nombre: "Q de Tréboles", valor: 12, imagen: "assets/iconos/cartas/trebol/QTreb.png" },
    { nombre: "K de Tréboles", valor: 13, imagen: "assets/iconos/cartas/trebol/KTreb.png" },

    { nombre: "A de Picas", valor: 14, imagen: "assets/iconos/cartas/espada/ACEEspa.png" },
    { nombre: "2 de Picas", valor: 2, imagen: "assets/iconos/cartas/espada/2Espa.png" },
    { nombre: "3 de Picas", valor: 3, imagen: "assets/iconos/cartas/espada/3Espa.png" },
    { nombre: "4 de Picas", valor: 4, imagen: "assets/iconos/cartas/espada/4Espa.png" },
    { nombre: "5 de Picas", valor: 5, imagen: "assets/iconos/cartas/espada/5Espa.png" },
    { nombre: "6 de Picas", valor: 6, imagen: "assets/iconos/cartas/espada/6Espa.png" },
    { nombre: "7 de Picas", valor: 7, imagen: "assets/iconos/cartas/espada/7Espa.png" },
    { nombre: "8 de Picas", valor: 8, imagen: "assets/iconos/cartas/espada/8Espa.png" },
    { nombre: "9 de Picas", valor: 9, imagen: "assets/iconos/cartas/espada/9Espa.png" },
    { nombre: "10 de Picas", valor: 10, imagen: "assets/iconos/cartas/espada/10Espa.png" },
    { nombre: "J de Picas", valor: 11, imagen: "assets/iconos/cartas/espada/JEspa.png" },
    { nombre: "Q de Picas", valor: 12, imagen: "assets/iconos/cartas/espada/QEspa.png" },
    { nombre: "K de Picas", valor: 13, imagen: "assets/iconos/cartas/espada/KEspa.png" },
  ];
  estadoJuego = false
  cartaActual: any = ""
  cartaSiguiente: any = ""
  puntos = 0
  puntajePerder = 0
  // snackBar = inject(MatSnackBar);
  comenzarAJugar() {
    this.estadoJuego = true
    this.cartaActual = this.cartasPoker[Math.floor(Math.random() * this.cartasPoker.length)]
    this.cartaSiguiente = this.cartasPoker[Math.floor(Math.random() * this.cartasPoker.length)]
    while (this.cartaActual == this.cartaSiguiente) {
      this.cartaActual = this.cartasPoker[Math.floor(Math.random() * this.cartasPoker.length)]
    }
    console.log(this.cartaActual)
    console.log(this.cartaSiguiente)
  }
  mayorQue() {
    if (this.estadoJuego) {
      if (this.cartaSiguiente.valor > this.cartaActual.valor) {
        // Adivinaste bien
        this.cartasPoker = this.cartasPoker.filter(carta => carta !== this.cartaSiguiente);
        this.cartaActual = this.cartaSiguiente;
        this.cartaSiguiente = this.cartasPoker[Math.floor(Math.random() * this.cartasPoker.length)];
        this.puntos += 100
        //verificamos que las cartas que quedan sean diferentes
        if (this.ultimasCartasIguales()) {
          //("Ganaste!!! Felicidades!","cerrar", { duration: 2000 });
        }
        else {
          while (this.cartaActual == this.cartaSiguiente) {
            this.cartaActual = this.cartasPoker[Math.floor(Math.random() * this.cartasPoker.length)]
          }

        }
        console.log(this.cartaActual)
        console.log(this.cartaSiguiente)
        //("¡Correcto! La carta era mayor","cerrar", { duration: 2000 });
      } else {
        //("Perdiste, te Equivocaste!","cerrar", { duration: 2000 });

        this.puntajePerder += 1;
        console.log(this.puntajePerder)
        console.log(this.puntos)
        if (this.auth.usuarioIngresado.descuento === 0) {
          if (this.puntos > 699 && this.puntajePerder === 1) {
            Swal.fire({
              title: this.diccionario[this.idioma()]['Felicidades'],
              text: this.diccionario[this.idioma()]['Hasconseguidomasde700puntosGanasteundescuentode15'],
              icon: 'success',
              confirmButtonText: this.diccionario[this.idioma()]['Nuevapartida'],
              allowOutsideClick: false,
              allowEscapeKey: false
            }).then(() => {
              this.TerminarJuego();
            });
            console.log('hola entro aca');
            this.auth.usuarioIngresado.descuento = 0.15;
            this.db.ModificarObjeto(this.auth.usuarioIngresado, 'clientes');
          } else {
            Swal.fire({
              title: this.diccionario[this.idioma()]['Muybien'],
              text: `${this.diccionario[this.idioma()]['Hasconseguido']} ${this.puntos} ${this.diccionario[this.idioma()]['mejorsuertelaproxima']}`,
              icon: 'success',
              confirmButtonText: this.diccionario[this.idioma()]['Nuevapartida'],
              allowOutsideClick: false,
              allowEscapeKey: false
            }).then(() => {
              this.TerminarJuego();
            });
          }
        } else {
          console.log('ya tenes descuento papi');
          Swal.fire({
            title: this.diccionario[this.idioma()]['Muybien'],
            text: `${this.diccionario[this.idioma()]['Hasconseguido']} ${this.puntos} ${this.diccionario[this.idioma()]['mejorsuertelaproxima']}`,
            icon: 'success',
            confirmButtonText: this.diccionario[this.idioma()]['Nuevapartida'],
            allowOutsideClick: false,
            allowEscapeKey: false
          }).then(() => {
            this.TerminarJuego();
          });

        }




      }
    } else {
      this.TerminarJuego();
      //("Tenes que tocar comenzar para jugar","cerrar", { duration: 2000 });
    }
  }

  menorQue() {
    if (this.estadoJuego) {
      if (this.cartaSiguiente.valor < this.cartaActual.valor) {
        // Adivinaste bien
        this.cartasPoker = this.cartasPoker.filter(carta => carta !== this.cartaSiguiente);
        this.cartaActual = this.cartaSiguiente;
        this.cartaSiguiente = this.cartasPoker[Math.floor(Math.random() * this.cartasPoker.length)];
        this.puntos += 100
        //verificamos que las cartas que quedan sean diferentes
        if (this.ultimasCartasIguales()) {
          //("Ganaste!!! Felicidades!","cerrar", { duration: 2000 });
        }
        else {
          while (this.cartaActual == this.cartaSiguiente) {
            this.cartaActual = this.cartasPoker[Math.floor(Math.random() * this.cartasPoker.length)]
          }

        }
        console.log(this.cartaActual)
        console.log(this.cartaSiguiente)

        //("¡Correcto! La carta era menor","cerrar", { duration: 2000 });
      } else {

        this.puntajePerder += 1;
        console.log(this.puntajePerder)
        console.log(this.puntos)
        if (this.auth.usuarioIngresado.descuento === 0) {
          if (this.puntos > 699 && this.puntajePerder === 1) {
            Swal.fire({
              title: this.diccionario[this.idioma()]['Felicidades'],
              text: this.diccionario[this.idioma()]['Hasconseguidomasde700puntosGanasteundescuentode15'],
              icon: 'success',
              confirmButtonText: this.diccionario[this.idioma()]['Nuevapartida'],
              allowOutsideClick: false,
              allowEscapeKey: false
            }).then(() => {
              this.TerminarJuego();
            });
            console.log('hola entro aca');
            this.auth.usuarioIngresado.descuento = 0.15;
            this.db.ModificarObjeto(this.auth.usuarioIngresado, 'clientes');
          } else {

            Swal.fire({
              title: this.diccionario[this.idioma()]['Muybien'],
              text: `${this.diccionario[this.idioma()]['Hasconseguido']} ${this.puntos} ${this.diccionario[this.idioma()]['mejorsuertelaproxima']}`,
              icon: 'success',
              confirmButtonText: this.diccionario[this.idioma()]['Nuevapartida'],
              allowOutsideClick: false,
              allowEscapeKey: false
            }).then(() => {
              this.TerminarJuego();
            });
          }
        } else {
          console.log('ya tenes descuento papi');
          Swal.fire({
            title: this.diccionario[this.idioma()]['Muybien'],
            text: `${this.diccionario[this.idioma()]['Hasconseguido']} ${this.puntos} ${this.diccionario[this.idioma()]['mejorsuertelaproxima']}`,
            icon: 'success',
            confirmButtonText: this.diccionario[this.idioma()]['Nuevapartida'],
            allowOutsideClick: false,
            allowEscapeKey: false
          }).then(() => {
            this.TerminarJuego();
          });

        }

        this.TerminarJuego();
        //("Perdiste, te Equivocaste!","cerrar", { duration: 2000 });
      }
    } else {
      this.TerminarJuego();
      //("Tenes que tocar comenzar para jugar","cerrar", { duration: 2000 });
    }
  }

  TerminarJuego() {
    this.estadoJuego = false
    this.cartaActual = ""
    this.cartaSiguiente = ""

    this.puntos = 0
    //mostrar mensaje
  }
  ultimasCartasIguales(): boolean {
    let valorIgual = this.cartasPoker[0].valor
    let sonIguales = true
    for (let carta of this.cartasPoker) {
      if (carta.valor != valorIgual) {
        sonIguales = false
        break
      }
    }
    return sonIguales;
  }

  cerrarSesion() {
    this.router.navigateByUrl('/juego');
  }

}

