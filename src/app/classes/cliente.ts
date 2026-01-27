export class Cliente {
  nombre: string;
  apellido: string;
  dni: string;
  foto: string;
  acceso: string;
  estadoMesa: string;
  estadoReserva: string
  id: string;
  email: string;
  static id: any;

  constructor(
    nombre: string,
    apellido: string,
    dni: string,
    foto: string,
    acceso: string,
    email: string,
    id: string = '',
    estadoMesa: string = '',
    estadoReserva: string = ''
  ) {
    this.nombre = nombre;
    this.apellido = apellido;
    this.dni = dni;
    this.foto = foto;
    this.acceso = acceso;
    this.email = email;
    this.id = id;
    this.estadoMesa = estadoMesa;
    this.estadoReserva = estadoReserva;
  }
}

export class Anonimo {
  nombre: string;
  foto: string;
  acceso: string;
  estadoMesa: string;
  id: string;

  constructor(
    nombre: string,
    foto: string,
    acceso: string,
    id: string = '',
    estadoMesa: string = ''
  ) {
    this.nombre = nombre;
    this.foto = foto;
    this.acceso = acceso;
    this.id = id;
    this.estadoMesa = estadoMesa;
  }
}
