import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { IonicModule } from '@ionic/angular';
import {
  Chart,
  PieController,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  BarController,
  CategoryScale,
  LinearScale,
  RadarController,
  BubbleController,
  PointElement,
  LineElement,
  RadialLinearScale,
  LineController,
} from 'chart.js';
import { AuthService } from 'src/app/services/auth.service';
import { CambioIdioma } from 'src/app/services/cambio-idioma';
import { DatabaseService } from 'src/app/services/database.service';
import { EncuestasService } from 'src/app/services/encuestas.service';
import { DICCIONARIO } from 'src/assets/diccionario';
@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FontAwesomeModule, RouterLink, FormsModule,
        CommonModule,
          IonicModule,],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
})
export class ClientesComponent implements OnInit {
  faArrowLeft = faArrowLeft;

  chart: any;
  comentarios: any[] = [];
  isLoading: boolean = true;
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)
  constructor(
    protected db: DatabaseService,
    protected encServ: EncuestasService,
    protected auth: AuthService,
    protected router: Router
  ) {
    Chart.register(
      PieController,
      ArcElement,
      BarController,
      BarElement,
      CategoryScale,
      LinearScale,
      RadarController,
      BubbleController,
      RadialLinearScale,
      Tooltip,
      Legend,
      PointElement,
      LineElement,
      LineController
    );
  }

  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
  this.isLoading = true;

  this.encServ.encuestas$.subscribe(encuestas => {
    if (!encuestas || encuestas.length === 0) return;

    console.log("✅ ENCUESTAS RECIBIDAS:", encuestas);

    this.IniciarCanva();   // ✅ SOLO SE EJECUTA CUANDO YA HAY DATOS
  });
}


  IniciarCanva() {
    const encuestas = this.encServ.listaEncuestas;
    console.log(encuestas);

    const atencion = encuestas.map((enc) => enc.atencion);
    const atencion1 = encuestas.filter((enc) => enc.atencion == 1).length;
    const atencion2 = encuestas.filter((enc) => enc.atencion == 2).length;
    const atencion3 = encuestas.filter((enc) => enc.atencion == 3).length;
    const atencion4 = encuestas.filter((enc) => enc.atencion == 4).length;
    const atencion5 = encuestas.filter((enc) => enc.atencion == 5).length;

    let listaAtencion = [];
    listaAtencion.push(atencion1, atencion2, atencion3, atencion4, atencion5);

    const sabor = encuestas.map((enc) => enc.sabor);
    const sabor1 = encuestas.filter((enc) => enc.sabor == 1).length;
    const sabor2 = encuestas.filter((enc) => enc.sabor == 2).length;
    const sabor3 = encuestas.filter((enc) => enc.sabor == 3).length;
    const sabor4 = encuestas.filter((enc) => enc.sabor == 4).length;
    const sabor5 = encuestas.filter((enc) => enc.sabor == 5).length;

    let listaSabor = [];
    listaSabor.push(sabor1, sabor2, sabor3, sabor4, sabor5);

    const comidaCaliente = encuestas.map((enc) => enc.comidaCaliente);
    const comidaCalienteSi = encuestas.filter(
      (enc) => enc.comidaCaliente == 'si'
    ).length;
    const comidaCalienteNo = encuestas.filter(
      (enc) => enc.comidaCaliente == 'no'
    ).length;

    let listaComidaCaliente = [];
    listaComidaCaliente.push(comidaCalienteSi, comidaCalienteNo);

    const porcionesAdecuadass = encuestas.map((enc) => enc.porcionesAdecuadas);
    const porcionesMuyGrandes = encuestas.filter(
      (enc) => enc.porcionesAdecuadas == 'Muy grandes'
    ).length;
    const porcionesAdecuadas = encuestas.filter(
      (enc) => enc.porcionesAdecuadas == 'Adecuadas'
    ).length;
    const porcionesMuyPequeñas = encuestas.filter(
      (enc) => enc.porcionesAdecuadas == 'Muy pequeñas'
    ).length;

    let listaPorcionesAdecuadas = [];
    listaPorcionesAdecuadas.push(
      porcionesMuyGrandes,
      porcionesAdecuadas,
      porcionesMuyPequeñas
    );

    const presentacionAtractiva = encuestas.map(
      (enc) => enc.presentacionAtractiva
    );

    const presAtractivaSi = encuestas.filter(
      (enc) => enc.presentacionAtractiva == 'si'
    ).length;
    const presAtractivaNo = encuestas.filter(
      (enc) => enc.presentacionAtractiva == 'no'
    ).length;

    let listaPresentacionAtractiva = [];
    listaPresentacionAtractiva.push(presAtractivaSi, presAtractivaNo);

    const menuPreferido = encuestas.map((enc) => enc.menuPreferido);

    const contadorValores: { [key: string]: number } = {};

  
    encuestas.forEach((encuesta) => {
      encuesta.menuPreferido.forEach((valor: string | number) => {
        if (contadorValores[valor]) {
          contadorValores[valor]++;
        } else {
          contadorValores[valor] = 1;
        }
      });
    });

    const listaClavesMenu = Object.keys(contadorValores);
    const listaValoresMenu = Object.values(contadorValores);

    const tiempoEspera = encuestas.map((enc) => enc.tiempoEspera);

    const tiempo15Min = encuestas.filter(
      (enc) => enc.tiempoEspera == 'Menos de 15 minutos'
    ).length;
    const tiempo30Min = encuestas.filter(
      (enc) => enc.tiempoEspera == '15-30 minutos'
    ).length;
    const tiempo45Min = encuestas.filter(
      (enc) => enc.tiempoEspera == '30-45 minutos'
    ).length;
    const tiempoMas45 = encuestas.filter(
      (enc) => enc.tiempoEspera == 'Más de 45 minutos'
    ).length;

    let listaTiempo = [];
    listaTiempo.push(tiempo15Min, tiempo30Min, tiempo45Min, tiempoMas45);

    this.comentarios = encuestas.map((enc) => enc.comentario);

    this.crearCanvaRadar('myPieChart', listaAtencion, [
      '1',
      '2',
      '3',
      '4',
      '5',
    ]);
    this.crearCanvaBar('myPieChart2', listaSabor, ['1', '2', '3', '4', '5']);
    this.crearCanva('myPieChart3', listaComidaCaliente, ['Si', 'No']);
    this.crearCanvaBar('myPieChart4', listaPorcionesAdecuadas, [
      'Muy grandes',
      'Adecuadas',
      'Muy pequeñas',
    ]);
    this.crearCanva('myPieChart5', listaPresentacionAtractiva, ['Si', 'No']);
    this.crearCanvaRadar('myPieChart6', listaValoresMenu, listaClavesMenu);
    this.crearCanvaBar('myPieChart7', listaTiempo, [
      'Menos de 45 minutos',
      '15-30 Minutos',
      '30-45 Minutos',
      'Más de 45 minutos',
    ]);

    this.isLoading = false;
  }

  crearCanva(div: string, datos: any[], etiquetas: any[]) {
    const ctx = document.getElementById(div) as HTMLCanvasElement;

    if (ctx) {
      this.chart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: etiquetas,
          datasets: [
            {
              label: 'votos',
              data: datos,
              backgroundColor: [
                'rgba(75, 0, 130, 0.6)', // Indigo oscuro
                'rgba(139, 0, 0, 0.6)', // Rojo oscuro
                'rgba(0, 100, 0, 0.6)', // Verde oscuro
                'rgba(72, 61, 139, 0.6)', // Azul oscuro
                'rgba(47, 79, 79, 0.6)', // Gris oscuro
                'rgba(128, 0, 128, 0.6)', // Púrpura oscuro
                'rgba(0, 0, 128, 0.6)', // Azul marino
              ],
              borderColor: [
                'rgba(75, 0, 130, 1)', // Indigo oscuro
                'rgba(139, 0, 0, 1)', // Rojo oscuro
                'rgba(0, 100, 0, 1)', // Verde oscuro
                'rgba(72, 61, 139, 1)', // Azul oscuro
                'rgba(47, 79, 79, 1)', // Gris oscuro
                'rgba(128, 0, 128, 1)', // Púrpura oscuro
                'rgba(0, 0, 128, 1)', // Azul marino
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: 'black', // Cambia el color del texto de la leyenda a negro
              },
            },
          },
        },
      });
    }
  }

  crearCanvaBar(div: string, datos: any[], etiquetas: any[]) {
    const ctx = document.getElementById(div) as HTMLCanvasElement;

    if (ctx) {
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: etiquetas,
          datasets: [
            {
              label: 'votos',
              data: datos,
              backgroundColor: [
                'rgba(75, 0, 130, 0.6)', // Indigo oscuro
                'rgba(139, 0, 0, 0.6)', // Rojo oscuro
                'rgba(0, 100, 0, 0.6)', // Verde oscuro
                'rgba(72, 61, 139, 0.6)', // Azul oscuro
                'rgba(47, 79, 79, 0.6)', // Gris oscuro
                'rgba(128, 0, 128, 0.6)', // Púrpura oscuro
                'rgba(0, 0, 128, 0.6)', // Azul marino
              ],
              borderColor: [
                'rgba(75, 0, 130, 1)', // Indigo oscuro
                'rgba(139, 0, 0, 1)', // Rojo oscuro
                'rgba(0, 100, 0, 1)', // Verde oscuro
                'rgba(72, 61, 139, 1)', // Azul oscuro
                'rgba(47, 79, 79, 1)', // Gris oscuro
                'rgba(128, 0, 128, 1)', // Púrpura oscuro
                'rgba(0, 0, 128, 1)', // Azul marino
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              padding: 20,
            },
            legend: {
              position: 'top',
              labels: {
                color: 'black', // Cambia el color del texto de la leyenda a negro
              },
            },
            tooltip: {
              enabled: true,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: 'black', // Cambia el color de las etiquetas del eje Y
                stepSize: 1, // Solo números enteros
              },
              grid: {
                color: 'black', // Cambia el color de las líneas del grid
              },
            },
            x: {
              ticks: {
                color: 'black', // Cambia el color de las etiquetas del eje X
              },
            },
          },
        },
      });
    }
  }

  crearCanvaRadar(div: string, datos: any[], etiquetas: any[]) {
    const ctx = document.getElementById(div) as HTMLCanvasElement;

    if (ctx) {
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: etiquetas,
          datasets: [
            {
              label: 'votos',
              data: datos,
              backgroundColor: [
                'rgba(75, 0, 130, 0.6)', // Indigo oscuro
                'rgba(139, 0, 0, 0.6)', // Rojo oscuro
                'rgba(0, 100, 0, 0.6)', // Verde oscuro
                'rgba(72, 61, 139, 0.6)', // Azul oscuro
                'rgba(47, 79, 79, 0.6)', // Gris oscuro
                'rgba(128, 0, 128, 0.6)', // Púrpura oscuro
                'rgba(0, 0, 128, 0.6)', // Azul marino
              ],
              borderColor: [
                'rgba(75, 0, 130, 1)', // Indigo oscuro
                'rgba(139, 0, 0, 1)', // Rojo oscuro
                'rgba(0, 100, 0, 1)', // Verde oscuro
                'rgba(72, 61, 139, 1)', // Azul oscuro
                'rgba(47, 79, 79, 1)', // Gris oscuro
                'rgba(128, 0, 128, 1)', // Púrpura oscuro
                'rgba(0, 0, 128, 1)', // Azul marino
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: 'black', // Cambia el color del texto de la leyenda a negro
              },
            },
            tooltip: {
              enabled: true,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: 'black', // Cambia el color de las etiquetas del eje Y
                stepSize: 1, // Solo números enteros
              },
            },
            x: {
              ticks: {
                color: 'black', // Cambia el color de las etiquetas del eje X
              },
            },
          },
        },
      });
    }
  }

  ngAfterViewInit() {

  const container = document.getElementById('snapContainer');

  if (!container) return;

  let bloqueado = false;

  container.addEventListener('wheel', (e: WheelEvent) => {
    e.preventDefault(); // ⛔ bloquea scroll libre del navegador

    if (bloqueado) return;
    bloqueado = true;

    const direccion = Math.sign(e.deltaY); // 1 baja, -1 sube
    const altura = container.clientHeight;

    container.scrollBy({
      top: direccion * altura,
      behavior: 'smooth'
    });

    setTimeout(() => {
      bloqueado = false;
    }, 650); // tiempo del snap
  }, { passive: false });
}

  volver() {
    if (
      this.auth.usuarioIngresado.estadoPedido === 'porAceptar' ||
      this.auth.usuarioIngresado.estadoPedido === 'enPreparacion' ||
      this.auth.usuarioIngresado.estadoPedido === 'entregado'

    ) {
      this.router.navigateByUrl('/cliente-espera-pedido');
      console.log(this.auth.usuarioIngresado.estadoPedido, this.auth.usuarioIngresado)
    }
    else if (this.auth.usuarioIngresado.estadoPedido === 'consumiendo') {
      this.router.navigateByUrl('/cliente-recibe-pedido');
    }else{
      this.router.navigateByUrl('/cliente-espera-mesa');
    } 

  }
}
