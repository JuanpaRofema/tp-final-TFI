import { inject, Pipe, PipeTransform } from '@angular/core';
import { CambioIdioma } from 'src/app/services/cambio-idioma';
import { DICCIONARIO } from 'src/assets/diccionario';

@Pipe({
  name: 'menu',
  standalone: true
})
export class MenuPipe implements PipeTransform {
  cambioIdioma = inject(CambioIdioma)
  transform(value: any, numero: number): any {
  // Protección por si la lista viene vacía
  if (!value) return value;

  let idioma: any = this.cambioIdioma.mensajeSource.value[0];
  idioma = String(idioma);
  
  let categoriaSeleccionada = "";

  // 1. TUS 3 IFs para decidir qué lista del diccionario usar
  if (numero === 1) {
    categoriaSeleccionada = "menu_comida";
  } else if (numero === 2) {
    categoriaSeleccionada = "menu_bebida";
  } else if (numero === 3) {
    categoriaSeleccionada = "menu_postre";
  }

  // Si no elegimos ninguna categoría válida, devolvemos la lista tal cual
  if (categoriaSeleccionada === "") return value;

  // 2. Recorremos y traducimos usando la categoría que ganamos en los IFs
  value.forEach((producto: any, i: any) => {
    // Recuperamos la traducción específica para ese índice
    const traduccion = DICCIONARIO[idioma][categoriaSeleccionada][i];

    // Verificamos que exista traducción para no romper el código
    if (traduccion) {
      producto.name = traduccion.nombre;
      producto.description = traduccion.descripcion;
    }
  });

  return value;
}

    
  }

}
