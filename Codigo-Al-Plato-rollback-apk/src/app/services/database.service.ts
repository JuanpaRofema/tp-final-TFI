import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { BehaviorSubject, Observable } from 'rxjs';
// import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  fotosClientesCollectionReference: any;
  fotosClientes: Observable<any>;
  mesa: string = '';
  descuento:number = 0 
  latitud: any = undefined;
  longitud:any = undefined;
  direccion:string = ''
  mostrarSwal:boolean = false;

  private spinnerSubject = new BehaviorSubject<boolean>(false);
  spinner$ = this.spinnerSubject.asObservable();

  constructor(
    public firestore: AngularFirestore,
    // public auth: AuthService
  ) {
    this.fotosClientesCollectionReference =
      this.firestore.collection<any>('clientes');
    this.fotosClientes = this.fotosClientesCollectionReference.valueChanges({
      idField: 'id',
    });
  }

  setSpinner(value: boolean) {
    this.spinnerSubject.next(value);
  }

  TraerUsuario(col: string) {
    const colUsuarios = this.firestore.collection(col);

    const observable = colUsuarios.valueChanges();
    return observable;
  }

  TraerObjeto(col: string) {
    const colObjeto = this.firestore.collection(col);

    const observable = colObjeto.valueChanges();
    return observable;
  }

  guardarObjeto(objeto: any, coleccion: string) {
    const colObjeto = this.firestore.collection(coleccion);

    const documento = colObjeto.doc();
    objeto.id = documento.ref.id;

    return documento.set({ ...objeto });
  }

  ModificarObjeto(objeto: any, col: string) {
    const colObjeto = this.firestore.collection(col);
    const documento = colObjeto.doc(objeto.id);

    documento.update({ ...objeto });
  }

  ModificarObjetoParcial(coleccion: string, id: string, datos: any) {
  const docRef = this.firestore.collection(coleccion).doc(id);
  return docRef.update(datos);
}

  //agrego los clientes a la base de datos con sus respectivos datos
  GuardarCliente(cliente: any) {
    // return this.firestore.collection('clientes').add(cliente);
    const colObjeto = this.firestore.collection('clientes');

    const documento = colObjeto.doc();
    cliente.id = documento.ref.id;

    return documento.set({ ...cliente });
  }
  GuardarMaitre(cliente: any) {
    // return this.firestore.collection('clientes').add(cliente);
    const colObjeto = this.firestore.collection('maitre');

    const documento = colObjeto.doc();
    cliente.id = documento.ref.id;

    return documento.set({ ...cliente });
  }
  GuardarMeseros(cliente: any) {
    // return this.firestore.collection('clientes').add(cliente);
    const colObjeto = this.firestore.collection('meseros');

    const documento = colObjeto.doc();
    cliente.id = documento.ref.id;

    return documento.set({ ...cliente });
  }
  GuardarCocinero(cliente: any) {
    // return this.firestore.collection('clientes').add(cliente);
    if(cliente.perfil == 'chef'){
    const colObjeto = this.firestore.collection('chefs');

        const documento = colObjeto.doc();
        cliente.id = documento.ref.id;

        return documento.set({ ...cliente });
    }else if(cliente.perfil == 'bartender'){
      console.log('hola me meti a bartender')
        const colObjeto = this.firestore.collection('bartenders');

        const documento = colObjeto.doc();
        cliente.id = documento.ref.id;

        return documento.set({ ...cliente });
    }else{
      console.log('hola')
      return false
    }
   
  }




  


  async actualizarDeliveryEnCliente(clienteDelivery: any) {
    try {

      const col = this.firestore.collection('clientes', ref =>
        ref.where('email', '==', clienteDelivery.email)
      );


      const snap = await col.ref.get();

      if (!snap.empty) {

        const updates: Promise<void>[] = snap.docs.map((docSnap) => {

          return this.firestore.collection('clientes').doc(docSnap.id).update({
            estadoDelivery: clienteDelivery.estadoDelivery
          });
        });

        await Promise.all(updates);
        console.log('Clientes actualizados correctamente');
      } else {
        console.log('No se encontró ningún cliente con ese email');
      }
    } catch (error) {
      console.error('Error actualizando cliente en clientes:', error);
      throw error;
    }
  }

  enviarNotificacion(rol: string, data: any) {
  return this.firestore
    .collection(`notificaciones/${rol}/mensajes`)
    .add({
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      recibida: false
    });
}

traerNotificacion(rol: string) {
  return this.firestore.collection(
    `notificaciones/${rol}/mensajes`,
    ref => ref
      .where('recibida', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(1)
  ).valueChanges({ idField: 'id' });
}
  actualizarNotificacion(rol: string, id: string, data: any) {
  return this.firestore
    .collection(`notificaciones/${rol}/mensajes`)
    .doc(id)
    .update(data);
}

  traerMesas() {
    const colMesas = this.firestore.collection('mesas');

    const observable = colMesas.valueChanges();
    return observable;
  }

  traerPedidos() {
    return this.firestore.collection('pedidos', ref =>
      ref.where('estadoPedido', '!=', 'cancelado')
    ).valueChanges({ idField: 'id' });
  }
  traerTodosLosPedidos() {

    return this.firestore.collection('pedidos').valueChanges({ idField: 'id' });
  }
  traerDelivery() {
    return this.firestore.collection('delivery', ref =>
      ref.where('estadoDelivery', '!=', 'cancelado')
    ).valueChanges({ idField: 'id' });
  }

    traerCuentaDelivery(){
      return this.firestore.collection('cuenta', ref=>
        ref.where('tipoPedido', '==', 'delivery')
      ).valueChanges({ idField: 'id' });
  }

  traerCuentaNormal() {
    return this.firestore.collection('cuenta', ref=>
        ref.where('tipoPedido', '==', 'presencial')
      ).valueChanges({ idField: 'id' });
  }


  traerDeliveryPorCliente(nombreCliente: string) {
  return this.firestore.collection('delivery', ref =>
    ref.where('cliente', '==', nombreCliente)
  ).valueChanges({ idField: 'id' });
}

  traerCuenta() {
    const colC = this.firestore.collection('cuenta');

    const observable = colC.valueChanges();
    return observable;
  }

    async VerificarUsuarioPorCorreo(correo: string | null) {
    const colecciones = ['clientes', 'dueños', 'maitre', 'meseros', 'chefs', 'bartenders'];
    
    for (const col of colecciones) {
      const snapshot = await this.firestore.collection(col, ref =>
        ref.where('email', '==', correo)
      ).get().toPromise();

      if (snapshot && !snapshot.empty) {
        const userDoc:any = snapshot.docs[0].data();
        userDoc['coleccion'] = col; // Para saber de qué rol viene
        return userDoc;
      }
    }

    return null; 
  }


  GuardarMesas(cliente: any) {
    // return this.firestore.collection('clientes').add(cliente);
    const colObjeto = this.firestore.collection('mesas');

    const documento = colObjeto.doc();
    cliente.id = documento.ref.id;

    return documento.set({ ...cliente });
  }

  actualizarEstadoMesa(id: string, nuevoEstado: string): Promise<void> {
  return this.firestore
    .collection('mesas')
    .doc(id)
    .update({ estado: nuevoEstado });
}

}

