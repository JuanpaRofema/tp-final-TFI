export class Mesa {
  numero: number;
  estado: string;
  ocupadaPor: string;
  id: string;
  foto:string
  qrString:string
  qrImage:string
  reservadaPor: string; 
  fechaReserva: string = '';
  estadoReserva: string = '';
  tipo:string = ''

  constructor(
    numero: number,
    estado: string,
    ocupadaPor: string,
    id: string = '',
    foto:string = '',
    qrString:string = '',
    qrImage:string = '',
    reservadaPor: string,
    fechaReserva:string = '',
    estadoReserva: string = '',
    tipo:string = ''
  ) {
    this.numero = numero;
    this.estado = estado;
    this.ocupadaPor = ocupadaPor;
    this.id = id;
    this.foto = foto
    this.qrString = qrString
    this.qrImage = qrImage
    this.reservadaPor = reservadaPor
    this.fechaReserva = fechaReserva
    this.estadoReserva = estadoReserva
    this.tipo = tipo
  }
}
