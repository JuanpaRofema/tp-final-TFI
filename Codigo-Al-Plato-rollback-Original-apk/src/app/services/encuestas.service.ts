import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EncuestasService {

  private encuestasSubject = new BehaviorSubject<any[]>([]);
  encuestas$ = this.encuestasSubject.asObservable();

  listaEncuestas: any[] = [];

  constructor(protected db: DatabaseService) {
    this.obtenerEncuestas();
  }

  obtenerEncuestas() {
    const observable = this.db.TraerObjeto('encuestas-cliente');

    observable.subscribe((resultado) => {
      this.listaEncuestas = (resultado as any[]).map((doc) => ({
        atencion: doc.atencion,
        sabor: doc.sabor,
        comidaCaliente: doc.comidaCaliente,
        porcionesAdecuadas: doc.porcionesAdecuadas,
        presentacionAtractiva: doc.presentacionAtractiva,
        menuPreferido: doc.menuPreferido,
        tiempoEspera: doc.tiempoEspera,
        comentario: doc.comentario,
      }));

      this.encuestasSubject.next(this.listaEncuestas);
    });
  }
}
