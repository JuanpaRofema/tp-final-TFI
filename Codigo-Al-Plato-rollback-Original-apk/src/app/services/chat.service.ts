import { Injectable } from '@angular/core';
import { collectionData } from '@angular/fire/firestore';
import { addDoc, collection, Firestore } from '@firebase/firestore';
import { map, Observable } from 'rxjs';
import { Mensaje } from '../classes/mensaje';
import { AngularFirestore } from '@angular/fire/compat/firestore';



@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private firestore: AngularFirestore,) {}

  TraerChat(mesa: string) {
    // Filtramos los mensajes por número de mesa
    return this.firestore.collection('chat', ref => ref.where('mesa', '==', mesa))
      .valueChanges();
  }

  AgregarMensaje(mensaje: Mensaje) {
    const colChat = this.firestore.collection('chat');
    colChat.add({ ...mensaje });
  }
}
