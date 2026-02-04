import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faComment, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { ModalController, Platform, ViewDidLeave, ViewWillEnter } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { CambioIdioma } from 'src/app/services/cambio-idioma';
import { DatabaseService } from 'src/app/services/database.service';
import { PedidoService } from 'src/app/services/pedido.service';
import { DICCIONARIO } from 'src/assets/diccionario';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-ahorcado',
  standalone: true,
  imports: [RouterLink, FontAwesomeModule],
  templateUrl: './ahorcado.html',
  styleUrl: './ahorcado.scss'
})
export class Ahorcado implements ViewWillEnter, ViewDidLeave {
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)
  faRightFromBracket = faRightFromBracket;
  faComent = faComment;
  //primero fijarme que hacer con el icono
  //arreglar el problema con volver a empezar el juego

  palabras_es = ['FIDEOS', 'MILANESA', 'CARNE', 'POLLO', 'POLENTA', 'ARROZ'];

  palabras_en = ['NOODLES', 'CUTLET', 'MEAT', 'CHICKEN', 'POLENTA', 'RICE'];

  palabras_pt = ['MACARRAO', 'MILANESA', 'CARNE', 'FRANGO', 'POLENTA', 'ARROZ'];

  palabras_ru = ['ЛАПША', 'ШНИЦЕЛЬ', 'МЯСО', 'КУРИЦА', 'ПОЛЕНТА', 'РИС'];

  palabras_de = ['NUDELN', 'SCHNITZEL', 'FLEISCH', 'HUHN', 'POLENTA', 'REIS'];

  palabras_fr = ['PATES', 'MILANAISE', 'VIANDE', 'POULET', 'POLENTA', 'RIZ'];
  vida = 6;
  vida_descuento = 1;
  mensaje = '';
  puestoA = false;
  puestoB = false;
  puestoC = false;
  puestoD = false;
  puestoE = false;
  puestoF = false;
  puestoG = false;
  puestoH = false;
  puestoI = false;
  puestoJ = false;
  puestoK = false;
  puestoL = false;
  puestoM = false;
  puestoN = false;
  puestoENIE = false;
  puestoO = false;
  puestoP = false;
  puestoQ = false;
  puestoR = false;
  puestoS = false;
  puestoT = false;
  puestoU = false;
  puestoV = false;
  puestoW = false;
  puestoX = false;
  puestoY = false;
  puestoZ = false;
  puestoA_ru = false;
  puestoE_ru = false;
  puestoI_ru = false;
  puestoK_ru = false;
  puestoL_ru = false;
  puestoM_ru = false;
  puestoN_ru = false;
  puestoO_ru = false;
  puestoP_ru = false;
  puestoR_ru = false;
  puestoS_ru = false;
  puestoT_ru = false;
  puestoU_ru = false;
  puestoTS_ru = false;
  puestoSH_ru = false;
  puestoSignoBlando_ru = false;
  puestoYA_ru = false;

  usuario = '';
  letras_usadas = 0;
  palabra_acertada = 0;
  reiniciar = false

  constructor(protected auth: AuthService,
    protected router: Router,
    private modalController: ModalController,
    protected platform: Platform,
    protected db: DatabaseService,
    private pedidoService: PedidoService) { }
  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => {
      this.idioma.set(data[0])
      console.log("ACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA idioma es " + data)
      
    })


  }

  ionViewWillEnter() {
    this.pedidoService.setMostrarInfo(false);
  }

  ionViewDidLeave() {
    this.pedidoService.setMostrarInfo(true);
  }

  getRandomPalabra(): string {
    let lang: any = "es"
    this.cambioIdioma.idiomaActual$.subscribe(data => lang = data[0]).unsubscribe();

    console.log("el idioma es " + lang)
    if (lang === 'en') {
      const randomIndex = Math.floor(Math.random() * this.palabras_en.length);
      let palabra = this.palabras_fr[randomIndex];
      console.log("el idioma que tengo es  " + lang + "  y la palabra es " + palabra)
      return palabra
    }

    if (lang === 'pt') {
      const randomIndex = Math.floor(Math.random() * this.palabras_pt.length);
      let palabra = this.palabras_pt[randomIndex];
      console.log("el idioma que tengo es  " + lang + "  y la palabra es " + palabra)
      return palabra
    }

    if (lang === 'ru') {
      const randomIndex = Math.floor(Math.random() * this.palabras_ru.length);
      let palabra = this.palabras_ru[randomIndex];
      console.log("el idioma que tengo es  " + lang + "  y la palabra es " + palabra)
      return palabra
    }

    if (lang === 'de') {
      const randomIndex = Math.floor(Math.random() * this.palabras_de.length);
      let palabra = this.palabras_de[randomIndex];
      console.log("el idioma que tengo es  " + lang + "  y la palabra es " + palabra)
      return palabra
    }

    if (lang === 'fr') {
      const randomIndex = Math.floor(Math.random() * this.palabras_fr.length);
      let palabra = this.palabras_fr[randomIndex];
      console.log("el idioma que tengo es  " + lang + "  y la palabra es " + palabra)
      return palabra
    }

    // Por defecto (si es 'es' o cualquier otro), usamos la lista en Español
    const randomIndex = Math.floor(Math.random() * this.palabras_es.length);
    let palabra = this.palabras_es[randomIndex];
    console.log("el idioma que tengo es  " + lang + "  y la palabra es " + palabra)
    return palabra
  }

  palabra = this.getRandomPalabra();

  palabraOculta = '_'.repeat(this.palabra.length).trim()
  letra = '';
  letrasUsadas: string[] = [];

  comprobarLetra() {
    if (this.palabra.includes(this.letra)) {
      const palabraOcultaArray = this.palabraOculta.split('');
      for (let i = 0; i < this.palabra.length; i++) {
        if (this.palabra[i] === this.letra) {
          palabraOcultaArray[i] = this.letra;
        }
      }
      this.palabraOculta = palabraOcultaArray.join('');
    } else {
      this.vida -= 1;
    }

    if (this.palabraOculta === this.palabra) {
      this.palabra_acertada = this.palabra_acertada + 1;
      if (this.auth.usuarioIngresado.descuento === 0) {
        if (this.palabra_acertada === 1 && this.vida_descuento === 1) {
          Swal.fire({
            title: this.diccionario[this.idioma()]['Felicidades'],
            text: `${this.diccionario[this.idioma()]['Hasadivinadolapalabra']} ${this.palabra} ${this.diccionario[this.idioma()]['Ganasteundescuentode10']}`,
            icon: 'success',
            confirmButtonText: this.diccionario[this.idioma()]['Nuevapartida'],
            allowOutsideClick: false,
            allowEscapeKey: false
          }).then(() => {
            this.reiniciarPartida()
          });
          console.log('entre la concha tuya');
          console.log(this.auth.usuarioIngresado.descuento);
          this.auth.usuarioIngresado.descuento = 0.10;
          this.db.ModificarObjeto(this.auth.usuarioIngresado, 'clientes');
        } else {
          Swal.fire({
            title: this.diccionario[this.idioma()]['Muybien'],
            text: `${this.diccionario[this.idioma()]['Hasadivinadolapalabra']} ${this.palabra}`,
            icon: 'success',
            confirmButtonText: this.diccionario[this.idioma()]['Nuevapartida'],
            allowOutsideClick: false,
            allowEscapeKey: false
          }).then(() => {
            this.reiniciarPartida()
          });
        }
      } else {
        Swal.fire({
          title: this.diccionario[this.idioma()]['Muybien'],
          text: `${this.diccionario[this.idioma()]['Hasadivinadolapalabra']} ${this.palabra}`,
          icon: 'success',
          confirmButtonText: this.diccionario[this.idioma()]['Nuevapartida'],
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(() => {
          this.reiniciarPartida()
        });
      }


    }


    //this.guardarAhorcado();


    if (this.vida === 0) {
      this.vida_descuento -= 1;
      this.mensaje = "Perdiste. La palabra era " + this.palabra;
      this.reiniciar = true;
      //this.guardarAhorcado();
    }
  }


  a() {
    this.letra = "A";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoA = true;
  }

  b() {
    this.letra = "B";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoB = true;
  }

  c() {
    this.letra = "C";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoC = true;
  }

  d() {
    this.letra = "D";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoD = true;
  }

  e() {
    this.letra = "E";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoE = true;
  }

  f() {
    this.letra = "F";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoF = true;
  }

  g() {
    this.letra = "G";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoG = true;
  }

  h() {
    this.letra = "H";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoH = true;
  }

  i() {
    this.letra = "I";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoI = true;
  }

  j() {
    this.letra = "J";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoJ = true;
  }

  k() {
    this.letra = "K";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoK = true;
  }

  l() {
    this.letra = "L";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoL = true;
  }

  m() {
    this.letra = "M";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoM = true;
  }

  n() {
    this.letra = "N";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoN = true;
  }

  enie() {
    this.letra = "Ñ";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoENIE = true;
  }

  o() {
    this.letra = "O";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoO = true;
  }

  p() {
    this.letra = "P";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoP = true;
  }

  q() {
    this.letra = "Q";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoQ = true;
  }

  r() {
    this.letra = "R";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoR = true;
  }

  s() {
    this.letra = "S";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoS = true;
  }

  t() {
    this.letra = "T";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoT = true;
  }

  u() {
    this.letra = "U";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoU = true;
  }

  v() {
    this.letra = "V";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoV = true;
  }

  w() {
    this.letra = "W";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoW = true;
  }

  x() {
    this.letra = "X";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoX = true;
  }

  y() {
    this.letra = "Y";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoY = true;
  }

  z() {
    this.letra = "Z";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoZ = true;
  }
  a_ru() {
    this.letra = "А";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoA_ru = true;
  }

  e_ru() {
    this.letra = "Е";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoE_ru = true;
  }

  i_ru() {
    this.letra = "И";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoI_ru = true;
  }

  k_ru() {
    this.letra = "К";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoK_ru = true;
  }

  l_ru() {
    this.letra = "Л";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoL_ru = true;
  }

  m_ru() {
    this.letra = "М";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoM_ru = true;
  }

  n_ru() {
    this.letra = "Н";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoN_ru = true;
  }

  o_ru() {
    this.letra = "О";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoO_ru = true;
  }

  p_ru() {
    this.letra = "П";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoP_ru = true;
  }

  r_ru() {
    this.letra = "Р";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoR_ru = true;
  }

  s_ru() {
    this.letra = "С";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoS_ru = true;
  }

  t_ru() {
    this.letra = "Т";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoT_ru = true;
  }

  u_ru() {
    this.letra = "У";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoU_ru = true;
  }

  ts_ru() {
    this.letra = "Ц";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoTS_ru = true;
  }

  sh_ru() {
    this.letra = "Ш";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoSH_ru = true;
  }

  signoBlando_ru() {
    this.letra = "Ь";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoSignoBlando_ru = true;
  }

  ya_ru() {
    this.letra = "Я";
    this.letrasUsadas.push(this.letra);
    this.letras_usadas += 1;
    this.comprobarLetra();
    this.puestoYA_ru = true;
  }

  reiniciarPartida() {
    this.reiniciar = false
    this.vida = 6
    this.getRandomPalabra();
    this.palabra = this.getRandomPalabra();
    this.palabraOculta = '_'.repeat(this.palabra.length).trim();
    this.puestoA = false;
    this.puestoB = false;
    this.puestoC = false;
    this.puestoD = false;
    this.puestoE = false;
    this.puestoF = false;
    this.puestoG = false;
    this.puestoH = false;
    this.puestoI = false;
    this.puestoJ = false;
    this.puestoK = false;
    this.puestoL = false;
    this.puestoM = false;
    this.puestoN = false;
    this.puestoENIE = false;
    this.puestoO = false;
    this.puestoP = false;
    this.puestoQ = false;
    this.puestoR = false;
    this.puestoS = false;
    this.puestoT = false;
    this.puestoU = false;
    this.puestoV = false;
    this.puestoW = false;
    this.puestoX = false;
    this.puestoY = false;
    this.puestoZ = false;
    this.puestoA_ru = false;
    this.puestoE_ru = false;
    this.puestoI_ru = false;
    this.puestoK_ru = false;
    this.puestoL_ru = false;
    this.puestoM_ru = false;
    this.puestoN_ru = false;
    this.puestoO_ru = false;
    this.puestoP_ru = false;
    this.puestoR_ru = false;
    this.puestoS_ru = false;
    this.puestoT_ru = false;
    this.puestoU_ru = false;
    this.puestoTS_ru = false;
    this.puestoSH_ru = false;
    this.puestoSignoBlando_ru = false;
    this.puestoYA_ru = false;
    this.puestoO_ru = false;
    this.puestoT_ru = false;
    this.mensaje = ''
  }


  cerrarSesion() {
    this.router.navigateByUrl('/juego');
  }

}
