import { Component, inject, signal } from '@angular/core';
import { IonicModule, ModalController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import {
  faArrowLeft,
  faUtensils,
  faMotorcycle,
  faCheckCircle,
  faWallet
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import Swal from 'sweetalert2';
import { DatabaseService } from 'src/app/services/database.service';
import { Router, RouterLink } from '@angular/router';
import { pushService } from 'src/app/services/serviciosPush/push-notifications.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import emailjs from 'emailjs-com';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { DICCIONARIO } from 'src/assets/diccionario';
import { CambioIdioma } from 'src/app/services/cambio-idioma';

@Component({
  selector: 'app-confirmar-pago',
  templateUrl: './confirmar-pago.component.html',
  styleUrls: ['./confirmar-pago.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FontAwesomeModule,
    RouterLink,
  ],
})
export class ConfirmarPagoComponent {
  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)

  faArrowLeft = faArrowLeft;
  faUtensils = faUtensils;
  faMotorcycle = faMotorcycle;
  faCheckCircle = faCheckCircle;
  faWallet = faWallet;

  subscription: Subscription | null = null;
  subscription6: Subscription | null = null;

  mesas: any = null;
  cuentas: any = null;
  pedidoSeleccionado: any | null = null;
  isLoading: boolean = true;

  constructor(
    protected auth: AuthService,
    protected router: Router,
    private modalController: ModalController,
    protected platform: Platform,
    protected db: DatabaseService,
    protected pushService: pushService
  ) {
    this.isLoading = true;
    (pdfMake as any).vfs = pdfFonts.vfs;


    const esDelivery = this.auth.usuarioIngresado.tipoCliente === 'delivery'

    if (esDelivery) {
      console.log('ola')
      const observable = this.db.traerCuentaDelivery();
      this.subscription = observable.subscribe((resultado) => {
        this.cuentas = (resultado as any[]).filter(c => c.estadoCuenta === 'haConfirmar');
        this.isLoading = false;
      });
    } else {
      const observable = this.db.traerCuentaNormal();
      this.subscription = observable.subscribe((resultado) => {
        this.cuentas = (resultado as any[]).filter(c => c.estadoCuenta === 'haConfirmar');
        this.isLoading = false;
      });
    }

    const observableMesa = this.db.traerMesas();
    this.subscription6 = observableMesa.subscribe((resultado) => {
      this.mesas = resultado;
    });
  }
  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
  }
  mostrarDetalle(pedido: any): void {
    this.pedidoSeleccionado = pedido;
  }

  cerrarDetalle(): void {
    this.pedidoSeleccionado = null;
  }

  async confirmarCuenta() {
    if (!this.pedidoSeleccionado) return;

    this.isLoading = true;

    try {

      this.pedidoSeleccionado.estadoCuenta = 'cuentaConfirmada';
      await this.db.ModificarObjeto(this.pedidoSeleccionado, 'cuenta');


      console.log("⏳ Generando PDF y enviando mail...");
      await this.generateAndSavePDF();
      console.log("✅ Proceso de PDF finalizado.");


      const esDelivery = this.auth.usuarioIngresado.tipoCliente === 'delivery' || this.auth.usuarioIngresado.perfil === 'delivery';
      let mensajeTitulo = '';
      let mensajeCuerpo = '';

      if (esDelivery) {

        mensajeTitulo = 'Entrega Finalizada';
        mensajeCuerpo = 'El pago del delivery ha sido registrado con éxito.';

        await this.enviarNotificaciones(
          ['dueño', 'supervisor', 'delivery'],
          this.diccionario[this.idioma()]['CuentaConfirmada'],
          this.diccionario[this.idioma()]['Eldeliveryhasidocobradoyfinalizado']
        );

      } else {

        mensajeTitulo = 'Mesa Liberada';
        mensajeCuerpo = `La Mesa ${this.pedidoSeleccionado.mesa} ha pagado y ha sido liberada.`;

        await this.enviarNotificaciones(
          ['dueño', 'supervisor', 'mesero'],
          this.diccionario[this.idioma()]['CuentaConfirmada'],
          `${this.diccionario[this.idioma()]['Lamesa']} ${this.pedidoSeleccionado.mesa} ${this.diccionario[this.idioma()]['cerrólacuenta']}`
        );

        this.liberarMesa(this.pedidoSeleccionado.cliente);
      }
      this.cerrarDetalle();
      this.isLoading = false;
      Swal.fire({
        heightAuto: false,
        title: mensajeTitulo,
        text: mensajeCuerpo,
        icon: 'success',
        background: '#333',
        color: '#fff',
        confirmButtonColor: '#4caf50',
        confirmButtonText: this.diccionario[this.idioma()]['Aceptar'],
      });

    } catch (error) {
      console.error("Error confirmando cuenta:", error);
      this.isLoading = false;
      Swal.fire({
        title: this.diccionario[this.idioma()]['Error'],
        text: this.diccionario[this.idioma()]['Ocurrióunerroralprocesarelpago'],
        icon: 'error'
      });
    }
  }



  async enviarNotificaciones(roles: string[], titulo: string, cuerpo: string) {
    const promesas = roles.map(rol => this.db.enviarNotificacion(rol, { titulo, cuerpo }));
    await Promise.all(promesas);
  }

  liberarMesa(clienteNombre: string) {
    if (!this.mesas) return;
    const mesa = this.mesas.find((m: any) => m.ocupadaPor === clienteNombre);
    if (mesa) {
      mesa.estado = 'desocupado';
      mesa.ocupadaPor = '';
      mesa.qrString = '';
      mesa.qrImage = '';
      this.db.ModificarObjeto(mesa, 'mesas');
    }
  }


  generateAndSavePDF(): Promise<void> {
    return new Promise((resolve, reject) => {

      const productos = this.pedidoSeleccionado?.productos || [];
      const total = this.pedidoSeleccionado.total || 0;
      const subTotal = this.pedidoSeleccionado.subTotal || total;
      const fechaHoy = new Date();
      const fechaEmision = fechaHoy.toLocaleDateString('es-AR');


      const fechaVto = new Date(fechaHoy);
      fechaVto.setDate(fechaHoy.getDate() + 10);
      const fechaVtoStr = fechaVto.toLocaleDateString('es-AR');


      const empresa = {
        nombre: "CODIGO AL PLATO S.A.",
        domicilio: "Av. Corrientes 1234, CABA",
        condicionIva: "Responsable Monotributo",
        cuit: "30-12345678-9",
        ingBrutos: "901-283912",
        inicioAct: "01/01/2024",
        ptoVenta: "00003",
        compNro: "00000001"
      };

      const cliente = {
        nombre: this.pedidoSeleccionado.cliente || "Consumidor Final",
        dni: "00000000",
        domicilio: this.pedidoSeleccionado.direccion || "Mostrador",
        condicionIva: "Consumidor Final",
        condicionVenta: "Contado"
      };


      const bodyProductos = [

        [
          { text: 'Código', style: 'tableHeader', fillColor: '#cccccc' },
          { text: 'Producto / Servicio', style: 'tableHeader', fillColor: '#cccccc' },
          { text: 'Cantidad', style: 'tableHeader', fillColor: '#cccccc' },
          { text: 'U. Medida', style: 'tableHeader', fillColor: '#cccccc' },
          { text: 'Precio Unit.', style: 'tableHeader', fillColor: '#cccccc' },
          { text: '% Bonif', style: 'tableHeader', fillColor: '#cccccc' },
          { text: 'Subtotal', style: 'tableHeader', fillColor: '#cccccc' }
        ]
      ];

      productos.forEach((p: any) => {
        let precio = Number(p.precio) || 0;
        let cantidad = Number(p.cantidad) || 1;
        let sub = precio * cantidad;

        bodyProductos.push([
          { text: '001', style: 'tableBody', fillColor: '' },
          { text: p.name, style: 'tableBody', fillColor: '' },
          { text: cantidad.toString(), style: 'tableBody', fillColor: '' },
          { text: 'unidades', style: 'tableBody', fillColor: '' },
          { text: `$ ${precio}`, style: 'tableBody', fillColor: '' },
          { text: '0.00', style: 'tableBody', fillColor: '' },
          { text: `$ ${sub}`, style: 'tableBody', fillColor: '' }
        ]);
      });


      const documentDefinition: any = {
        pageSize: 'A4',
        pageMargins: [30, 30, 30, 30],
        content: [

          {
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    columns: [

                      {
                        width: '*',
                        stack: [
                          { text: 'ORIGINAL', alignment: 'center', bold: true, margin: [0, 0, 0, 10] },
                          { text: empresa.nombre, style: 'headerEmpresa' },
                          { text: '\n' },
                          { text: `Razon Social: ${empresa.nombre}`, style: 'labelBold' },
                          { text: `Domicilio Comercial: ${empresa.domicilio}`, style: 'labelBold' },
                          { text: `Condición frente al IVA: ${empresa.condicionIva}`, style: 'labelBold' },
                        ]
                      },

                      {
                        width: 50,
                        stack: [
                          { text: ' ', fontSize: 10 },
                          {
                            table: {
                              widths: [40],
                              body: [
                                [{ text: 'C', fontSize: 24, bold: true, alignment: 'center' }],
                                [{ text: 'COD. 011', fontSize: 7, bold: true, alignment: 'center' }]
                              ]
                            },
                            layout: {
                              hLineWidth: (i: number) => 1,
                              vLineWidth: (i: number) => 1,
                            },
                            margin: [0, 5, 0, 0]
                          }
                        ],
                        alignment: 'center'
                      },

                      {
                        width: '*',
                        stack: [
                          { text: 'FACTURA', fontSize: 22, bold: true, alignment: 'left', margin: [10, 15, 0, 5] },
                          { text: `Punto de Venta: ${empresa.ptoVenta}    Comp. Nro: ${empresa.compNro}`, style: 'labelNormal', margin: [10, 0, 0, 0] },
                          { text: `Fecha de Emisión: ${fechaEmision}`, style: 'labelNormal', margin: [10, 0, 0, 5] },
                          { text: `CUIT: ${empresa.cuit}`, style: 'labelNormal', margin: [10, 0, 0, 0] },
                          { text: `Ingresos Brutos: ${empresa.ingBrutos}`, style: 'labelNormal', margin: [10, 0, 0, 0] },
                          { text: `Fecha de Inicio de Actividades: ${empresa.inicioAct}`, style: 'labelNormal', margin: [10, 0, 0, 0] }
                        ]
                      }
                    ]
                  }
                ]
              ]
            },
            layout: {
              hLineWidth: (i: number) => (i === 0 || i === 1) ? 1 : 0,
              vLineWidth: (i: number) => (i === 0 || i === 1) ? 1 : 0,
            }
          },


          {
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    columns: [
                      { text: `Período Facturado Desde: ${fechaEmision}`, style: 'labelNormal' },
                      { text: `Hasta: ${fechaEmision}`, style: 'labelNormal' },
                      { text: `Fecha de Vto. para el pago: ${fechaEmision}`, style: 'labelNormal' }
                    ]
                  }
                ]
              ]
            },
            layout: { hLineWidth: (i: number) => 1, vLineWidth: (i: number) => 1 },
            margin: [0, 5, 0, 5]
          },


          {
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    stack: [
                      {
                        columns: [
                          { text: `CUIT: ${cliente.dni}`, style: 'labelNormal', width: 'auto', margin: [0, 0, 20, 0] },
                          { text: `Apellido y Nombre / Razón Social: ${cliente.nombre}`, style: 'labelNormal' }
                        ],
                        margin: [0, 2]
                      },
                      {
                        columns: [
                          { text: `Condición frente al IVA: ${cliente.condicionIva}`, style: 'labelNormal', width: 'auto', margin: [0, 0, 20, 0] },
                          { text: `Domicilio: ${cliente.domicilio}`, style: 'labelNormal' }
                        ],
                        margin: [0, 2]
                      },
                      {
                        columns: [
                          { text: `Condición de venta: ${cliente.condicionVenta}`, style: 'labelNormal' }
                        ],
                        margin: [0, 2]
                      }
                    ]
                  }
                ]
              ]
            },
            layout: { hLineWidth: (i: number) => 1, vLineWidth: (i: number) => 1 },
            margin: [0, 0, 0, 10]
          },


          {
            table: {
              headerRows: 1,
              widths: [40, '*', 50, 50, 60, 50, 60],
              body: bodyProductos
            },
            layout: {
              fillColor: function (rowIndex: number) {
                return (rowIndex === 0) ? '#cccccc' : null;
              }
            },
            minHeight: 300
          },

          {
            text: '\n'
          },
          {
            table: {
              widths: ['*', 100],
              body: [
                [
                  { text: 'Subtotal: $', alignment: 'right', bold: true },
                  { text: subTotal.toString(), alignment: 'right' }
                ],
                [
                  { text: 'Importe Otros Tributos: $', alignment: 'right', bold: true },
                  { text: '0.00', alignment: 'right' }
                ],
                [
                  { text: 'Importe Total: $', alignment: 'right', bold: true, fontSize: 12 },
                  { text: total.toString(), alignment: 'right', bold: true, fontSize: 12 }
                ]
              ]
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 10]
          },


          {
            table: {
              widths: ['*', '*'],
              body: [
                [
                  {
                    columns: [
                      {

                        text: 'AFIP',
                        bold: true,
                        fontSize: 20,
                        italics: true,
                        color: '#ccc',
                        width: 60,
                        margin: [0, 10, 0, 0]
                      },
                      {

                        qr: `https://www.afip.gob.ar/fe/qr/?p=${Math.random()}`,
                        fit: 80
                      }
                    ]
                  },

                  {
                    stack: [
                      { text: `CAE N°: 70123456789012`, alignment: 'right', bold: true },
                      { text: `Fecha de Vto. de CAE: ${fechaVtoStr}`, alignment: 'right', bold: true }
                    ],
                    margin: [0, 20, 0, 0]
                  }
                ],
                [
                  { text: 'Comprobante Autorizado', colSpan: 2, alignment: 'center', italics: true, fontSize: 10, margin: [0, 5, 0, 0] },
                  {}
                ]
              ]
            },
            layout: { hLineWidth: (i: number) => i === 0 ? 1 : 0, vLineWidth: (i: number) => 1 }
          }

        ],
        styles: {
          headerEmpresa: { fontSize: 18, bold: true },
          labelBold: { fontSize: 9, bold: true },
          labelNormal: { fontSize: 9 },
          tableHeader: { fontSize: 8, bold: true, alignment: 'center' },
          tableBody: { fontSize: 8, alignment: 'center' }
        }
      };

      const pdfDocGenerator = pdfMake.createPdf(documentDefinition);

      pdfDocGenerator.getBase64(async (base64: any) => {
        try {
          const fileName = `factura_${new Date().getTime()}.pdf`;
          const storage = getStorage();
          const pdfRef = ref(storage, `comprobantes/${fileName}`);

          await uploadString(pdfRef, base64, 'base64');
          const pdfUrl = await getDownloadURL(pdfRef);

          const clienteEmail = this.pedidoSeleccionado.email;
          const clienteTipo = this.pedidoSeleccionado.tipoCliente;

          if (clienteTipo === 'cliente' && clienteEmail) {
            await this.sendEmail(this.pedidoSeleccionado.cliente, clienteEmail, pdfUrl);
          } else if (clienteTipo === 'anonimo') {
            await this.db.enviarNotificacion('anonimo', {
              titulo: this.diccionario[this.idioma()]['FacturaDisponible'],
              cuerpo: this.diccionario[this.idioma()]['Descargatufacturaaquí'],
              pdfUrl: pdfUrl
            });
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  sendEmail(nombre: string, mail: string, pdfUrl: string): Promise<any> {
    const templateParams = {
      to_email: mail,
      nombre: nombre,
      from_name: 'CodigoAlPlato',
      imagenFactura: 'https://firebasestorage.googleapis.com/v0/b/la-comanda-pps.appspot.com/o/images%2Ficono.png?alt=media&token=09bfed13-ec47-4a4c-bc2d-bdfea0ec29f2',
      pdfUrl: pdfUrl,
      fecha: Date.now(),
      monto: this.pedidoSeleccionado.total
    };
    return emailjs.send('service_cpd6w7a', 'template_94dgyli', templateParams, 'Zv8rWe6HOZnHiMKzg');
  }
}