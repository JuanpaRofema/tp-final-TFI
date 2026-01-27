import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';  // Importar Observable
import { map } from 'rxjs/operators'; // Importar map

@Injectable({
  providedIn: 'root'
})
export class PersonajeService {

  srcPersonaje: string | null = null;
  dc!: boolean;  // Variable que indica si el personaje es de DC o Marvel
  personaje: string | null = null;  // Nombre del personaje seleccionado

  personajesDC = [
    { nombre: 'Batman', img: 'assets/dc/batman.png' },
    { nombre: 'Superman', img: 'assets/dc/superman.png' },
    { nombre: 'Flash', img: 'assets/dc/flash.png' },
    { nombre: 'Batgirl', img: 'assets/dc/batgirl.png' },
    { nombre: 'Mujer Maravilla', img: 'assets/dc/mujer-maravilla.png' }
  ];

  personajesMarvel = [
    { nombre: 'Iron Man', img: 'assets/marvel/ironman-removebg-preview.png' },
    { nombre: 'Capitán América', img: 'assets/marvel/cap-removebg-preview.png' },
    { nombre: 'Gambito', img: 'assets/marvel/gambito-removebg-preview.png' },
    { nombre: 'spiderman', img: 'assets/marvel/png-transparent-marvel-spider-man-illustration-ultimate-spider-man-hulk-standee-poster-spider-comics-heroes-superhero-thumbnail-removebg-preview.png' },
    { nombre: 'wolverine', img: 'assets/marvel/png-transparent-marvel-wolverine-illustration-wolverine-iron-man-spider-man-thor-marvel-comics-marvel-comics-superhero-fictional-character-thumbnail-removebg-preview.png' }
  ];


  constructor(private firestore: AngularFirestore) { }

  getPersonajes() {
    return this.dc ? this.personajesDC : this.personajesMarvel;
  }

  setPersonaje(nombrePersonaje: string, imagen: string) {
    this.personaje = nombrePersonaje;
    this.srcPersonaje = imagen;
  }

  // Método para setear la franquicia
  setFranquicia(franquicia: string) {
    this.dc = franquicia === 'dc';
  }

  // Método para obtener si es DC o Marvel
  getFranquicia() {
    return this.dc ? 'dc' : 'marvel';
  }



  // Método para guardar los puntos en Firestore
  async guardarPuntos(correo: string, tiempo: number) {
    try {
      await this.firestore.collection('Puntos').add({
        Jugador: correo,
        Tiempo: tiempo,
        Personaje: this.personaje,
      });
    } catch (error) {
      throw error;
    }
  }

  // Método para traer los puntos de Firestore
  traerPuntos(): Observable<any[]> {
    return this.firestore.collection('Puntos', ref => ref.orderBy('Tiempo')).get().pipe(
      map(snapshot => snapshot.docs.map(doc => doc.data())) // Extrae los datos de cada documento
    );
  }

}
