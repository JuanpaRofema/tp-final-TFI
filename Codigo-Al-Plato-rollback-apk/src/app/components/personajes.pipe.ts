import { inject, Pipe, PipeTransform } from '@angular/core';
import { CambioIdioma } from '../services/cambio-idioma';

@Pipe({
  name: 'personajes',
  standalone: true
})
export class PersonajesPipe implements PipeTransform {
  cambioIdioma = inject(CambioIdioma)

  transform(value: any): any {
    const nombre = value.toLowerCase();
    const idioma = this.cambioIdioma.mensajeSource.getValue()[0];
    switch (idioma) {
      case 'en':
        if (nombre === 'mujer maravilla') return 'Wonder Woman';
        if (nombre === 'capitán américa') return 'Captain America';
        if (nombre === 'gambito') return 'Gambit';
        if (nombre === 'spiderman') return 'Spider-Man';
        break;

      case 'pt':
        if (nombre === 'mujer maravilla') return 'Mulher-Maravilha';
        if (nombre === 'iron man') return 'Homem de Ferro';
        if (nombre === 'capitán américa') return 'Capitão América';
        if (nombre === 'spiderman') return 'Homem-Aranha';
        break;

      case 'ru':
        if (nombre === 'batman') return 'Бэтмен';
        if (nombre === 'superman') return 'Супермен';
        if (nombre === 'flash') return 'Флэш';
        if (nombre === 'batgirl') return 'Бэтгерл';
        if (nombre === 'mujer maravilla') return 'Чудо-женщина';
        if (nombre === 'iron man') return 'Железный человек';
        if (nombre === 'capitán américa') return 'Капитан Америка';
        if (nombre === 'gambito') return 'Гамбит';
        if (nombre === 'spiderman') return 'Человек-паук';
        if (nombre === 'wolverine') return 'Росомаха';
        break;

      case 'de':
      case 'fr':
        // En alemán y francés, casi todos los superhéroes usan su nombre original en inglés
        if (nombre === 'mujer maravilla') return 'Wonder Woman';
        if (nombre === 'capitán américa') return 'Captain America';
        if (nombre === 'gambito') return 'Gambit';
        if (nombre === 'spiderman') return 'Spider-Man';
        break;
        
      // El caso 'es' no hace falta ponerlo porque ya es el idioma por defecto
    }

    // Si el idioma es español, o si es un personaje como Batman que se llama igual
    // en casi todos lados, devolvemos el nombre original que vino del array.
    return nombre;
  }

}
