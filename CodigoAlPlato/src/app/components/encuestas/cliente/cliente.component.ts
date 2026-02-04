import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CambioIdioma } from 'src/app/services/cambio-idioma';
import { DatabaseService } from 'src/app/services/database.service';
import { DICCIONARIO } from 'src/assets/diccionario';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cliente',
  templateUrl: './cliente.component.html',
  styleUrls: ['./cliente.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
})
export class ClienteComponent {

  diccionario: any = DICCIONARIO
  idioma: any = signal("es")
  cambioIdioma = inject(CambioIdioma)

  serviceRating: number = 3;
  saborComida: number = 3;

  errorAtencion: boolean = false;
  errorSabor: boolean = false;
  errorCaliente: boolean = false;
  errorPorciones: boolean = false;
  errorPresentacion: boolean = false;
  errorTipoMenu: boolean = false;
  errorTiempo: boolean = false;

  mensajeAtencion: string = '';
  mensajeSabor: string = '';
  mensajeCaliente: string = '';
  mensajePorciones: string = '';
  mensajePresentacion: string = '';
  mensajeMenu: string = '';
  mensajeTiempo: string = '';

  formEncuesta: FormGroup;

  isLoading: boolean = true;

  constructor(
    private auth: AuthService,
    protected router: Router,
    protected db: DatabaseService
  ) {
    this.isLoading = true;
    setTimeout(() => { this.isLoading = false; }, 1000);
    this.formEncuesta = new FormGroup({
      atencion: new FormControl('', [Validators.required]),
      sabor: new FormControl('', [Validators.required]),
      comidaCaliente: new FormControl('', [Validators.required]),
      porcionesAdecuadas: new FormControl('', [Validators.required]),
      presentacionAtractiva: new FormControl('', [Validators.required]),
      menuPreferido: new FormArray([], [Validators.required]),
      tiempoEspera: new FormControl('', [Validators.required]),
      comentario: new FormControl(''),
    });
  }
  ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
  }
  guardarEncuesta() {
    this.errorAtencion = false;
    this.errorSabor = false;
    this.errorCaliente = false;
    this.errorPorciones = false;
    this.errorPresentacion = false;
    this.errorTipoMenu = false;
    this.errorTiempo = false;

    if (this.ValidarCampos()) {
      this.db
        .guardarObjeto(this.formEncuesta.value, 'encuestas-cliente')
        .then((e) => {
          Swal.fire({
            heightAuto: false,
            title: this.diccionario[this.idioma()]['Encuestaregistrada'],
            confirmButtonText: this.diccionario[this.idioma()]['Aceptar'],
            background: '#333',
            color: '#fff',
            confirmButtonColor: '#780000',
          }).then((e) => {
            if (e.isConfirmed) {
              this.formEncuesta.get('atencion')?.setValue('');
              this.formEncuesta.get('sabor')?.setValue('');
              this.formEncuesta.get('comidaCaliente')?.setValue('');
              this.formEncuesta.get('porcionesAdecuadas')?.setValue('');
              this.formEncuesta.get('presentacionAtractiva')?.setValue('');
              // this.formEncuesta.get('menuPreferido')?.setValue('');
              this.formEncuesta.get('tiempoEspera')?.setValue('');
              this.formEncuesta.get('comentario')?.setValue('');
              if (this.auth.usuarioIngresado.tipoPedido != 'delivery') {
                this.router.navigate(['/cliente-recibe-pedido']);
              } else {
                this.router.navigate(['cliente-espera-delivery']);
              }
              this.auth.usuarioIngresado.encuestaCompletada = true;
              this.db.ModificarObjeto(this.auth.usuarioIngresado, 'clientes');
            }
          });
        });
    }
  }

  ValidarCampos() {
    let camposValidados = true;

    const controlAt = this.formEncuesta.controls['atencion'];
    const controlSab = this.formEncuesta.controls['sabor'];
    const controlCal = this.formEncuesta.controls['comidaCaliente'];
    const controlPor = this.formEncuesta.controls['porcionesAdecuadas'];
    const controlPres = this.formEncuesta.controls['presentacionAtractiva'];
    const controlMenu = this.formEncuesta.controls['menuPreferido'];
    const controlTiem = this.formEncuesta.controls['tiempoEspera'];

    if (controlAt.errors !== null) {
      camposValidados = false;
      this.errorAtencion = true;
      if (controlAt.errors!['required']) {
        this.mensajeAtencion = 'Debe completar este campo';
      }
    }
    if (controlSab.errors !== null) {
      camposValidados = false;
      this.errorSabor = true;
      if (controlSab.errors!['required']) {
        this.mensajeSabor = 'Debe completar este campo';
      }
    }
    if (controlCal.errors !== null) {
      camposValidados = false;
      this.errorCaliente = true;
      if (controlCal.errors!['required']) {
        this.mensajeCaliente = 'Debe completar este campo';
      }
    }
    if (controlPor.errors !== null) {
      camposValidados = false;
      this.errorPorciones = true;
      if (controlPor.errors!['required']) {
        this.mensajePorciones = 'Debe completar este campo';
      }
    }

    if (controlMenu.errors !== null) {
      camposValidados = false;
      this.errorTipoMenu = true;
      if (controlMenu.errors!['required']) {
        this.mensajeMenu = 'Debe completar este campo';
      }
    }

    if (controlPres.errors !== null) {
      camposValidados = false;
      this.errorPresentacion = true;
      if (controlPres.errors!['required']) {
        this.mensajePresentacion = 'Debe completar este campo';
      }
    }
    if (controlTiem.errors !== null) {
      camposValidados = false;
      this.errorTiempo = true;
      if (controlTiem.errors!['required']) {
        this.mensajeTiempo = 'Debe completar este campo';
      }
    }

    return camposValidados;
  }

  get menuArray(): FormArray {
    return this.formEncuesta.get('menuPreferido') as FormArray;
  }


  onCheckboxChange(event: any) {
    const selectedValue = event.target.value;
    if (event.target.checked) {

      this.menuArray.push(new FormControl(selectedValue));
    } else {

      const index = this.menuArray.controls.findIndex(
        (x) => x.value === selectedValue
      );
      if (index >= 0) {
        this.menuArray.removeAt(index);
      }
    }
  }
}
