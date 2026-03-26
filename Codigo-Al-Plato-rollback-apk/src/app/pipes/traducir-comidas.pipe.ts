import { inject, Pipe, PipeTransform } from '@angular/core';
import { CambioIdioma } from '../services/cambio-idioma';

@Pipe({
  name: 'traducirComidas',
  standalone: true
})
export class TraducirComidasPipe implements PipeTransform {
  cambioIdioma = inject(CambioIdioma)

  transform(value: string): string {
    let valorActual = this.cambioIdioma.mensajeSource.getValue();
    let idiomaActual = valorActual[0];


    // Estructura de "Objeto Mapa" con todos los productos y todos los idiomas
    const traducciones: any = {
      'es': {
        'Ravioles de ricota': 'Ravioles de ricota', 'Ricotta Ravioli': 'Ravioles de ricota', 'Ravioli de ricota': 'Ravioles de ricota', 'Равиоли с рикоттой': 'Ravioles de ricota', 'Ricotta-Ravioli': 'Ravioles de ricota', 'Raviolis à la ricotta': 'Ravioles de ricota',
        'Omelette': 'Omelette', 'Omelet': 'Omelette', 'Omelete': 'Omelette', 'Омлет': 'Omelette', 'Omelett': 'Omelette',
        'Milanesa': 'Milanesa', 'Миланеса': 'Milanesa',
        'Entraña': 'Entraña', 'Skirt Steak': 'Entraña', 'Entranha': 'Entraña', 'Стейк Мачете': 'Entraña',
        'Hamburguesa': 'Hamburguesa', 'Hamburger': 'Hamburguesa', 'Hambúrguer': 'Hamburguesa', 'Гамбургер': 'Hamburguesa',
        'Estofado de Pollo': 'Estofado de Pollo', 'Chicken Stew': 'Estofado de Pollo', 'Ensopado de Frango': 'Estofado de Pollo', 'Тушеная курица': 'Estofado de Pollo', 'Hühnereintopf': 'Estofado de Pollo', 'Ragoût de poulet': 'Estofado de Pollo',
        'Daikiri': 'Daikiri', 'Daiquiri': 'Daikiri', 'Daquiri': 'Daikiri', 'Дайкири': 'Daikiri', 'Daïquiri': 'Daikiri',
        'Refresco de cola': 'Refresco de cola', 'Cola Soda': 'Refresco de cola', 'Refrigerante de cola': 'Refresco de cola', 'Кола': 'Refresco de cola', 'Cola': 'Refresco de cola', 'Soda au cola': 'Refresco de cola',
        'Pepesi': 'Pepesi', 'Pepsi': 'Pepesi', 'Пепси': 'Pepesi',
        'Cerveza Patagonia': 'Cerveza Patagonia', 'Patagonia Beer': 'Cerveza Patagonia', 'Cerveja Patagonia': 'Cerveza Patagonia', 'Пиво Patagonia': 'Cerveza Patagonia', 'Patagonia Bier': 'Cerveza Patagonia', 'Bière Patagonia': 'Cerveza Patagonia',
        'Cerveza Heineken': 'Cerveza Heineken', 'Heineken Beer': 'Cerveza Heineken', 'Cerveja Heineken': 'Cerveza Heineken', 'Пиво Heineken': 'Cerveza Heineken', 'Heineken Bier': 'Cerveza Heineken', 'Bière Heineken': 'Cerveza Heineken',
        'Agua': 'Agua', 'Water': 'Agua', 'Água': 'Agua', 'Вода': 'Agua', 'Wasser': 'Agua', 'Eau': 'Agua',
        'Vino Tinto': 'Vino Tinto', 'Red Wine': 'Vino Tinto', 'Vinho Tinto': 'Vino Tinto', 'Красное вино': 'Vino Tinto', 'Rotwein': 'Vino Tinto', 'Vin Rouge': 'Vino Tinto',
        'Flan Casero': 'Flan Casero', 'Homemade Flan': 'Flan Casero', 'Pudim Caseiro': 'Flan Casero', 'Домашний флан': 'Flan Casero', 'Hausgemachter Flan': 'Flan Casero', 'Flan Maison': 'Flan Casero',
        'Torta de Queso': 'Torta de Queso', 'Cheesecake': 'Torta de Queso', 'Чизкейк': 'Torta de Queso', 'Käsekuchen': 'Torta de Queso',
        'Helado': 'Helado', 'Ice Cream': 'Helado', 'Sorvete': 'Helado', 'Мороженое': 'Helado', 'Eis': 'Helado', 'Glace': 'Helado',
        'Brownie con helado': 'Brownie con helado', 'Brownie with Ice Cream': 'Brownie con helado', 'Brownie com sorvete': 'Brownie con helado', 'Брауни с мороженым': 'Brownie con helado', 'Brownie mit Eis': 'Brownie con helado', 'Brownie avec glace': 'Brownie con helado',
        'Chocotorta': 'Chocotorta', 'Чокоторта': 'Chocotorta'
      },
      'en': {
        'Ravioles de ricota': 'Ricotta Ravioli', 'Ricotta Ravioli': 'Ricotta Ravioli', 'Ravioli de ricota': 'Ricotta Ravioli', 'Равиоли с рикоттой': 'Ricotta Ravioli', 'Ricotta-Ravioli': 'Ricotta Ravioli', 'Raviolis à la ricotta': 'Ricotta Ravioli',
        'Omelette': 'Omelet', 'Omelet': 'Omelet', 'Omelete': 'Omelet', 'Омлет': 'Omelet', 'Omelett': 'Omelet',
        'Milanesa': 'Milanesa', 'Миланеса': 'Milanesa',
        'Entraña': 'Skirt Steak', 'Skirt Steak': 'Skirt Steak', 'Entranha': 'Skirt Steak', 'Стейк Мачете': 'Skirt Steak',
        'Hamburguesa': 'Hamburger', 'Hamburger': 'Hamburger', 'Hambúrguer': 'Hamburger', 'Гамбургер': 'Hamburger',
        'Estofado de Pollo': 'Chicken Stew', 'Chicken Stew': 'Chicken Stew', 'Ensopado de Frango': 'Chicken Stew', 'Тушеная курица': 'Chicken Stew', 'Hühnereintopf': 'Chicken Stew', 'Ragoût de poulet': 'Chicken Stew',
        'Daikiri': 'Daiquiri', 'Daiquiri': 'Daiquiri', 'Daquiri': 'Daiquiri', 'Дайкири': 'Daiquiri', 'Daïquiri': 'Daiquiri',
        'Refresco de cola': 'Cola Soda', 'Cola Soda': 'Cola Soda', 'Refrigerante de cola': 'Cola Soda', 'Кола': 'Cola Soda', 'Cola': 'Cola Soda', 'Soda au cola': 'Cola Soda',
        'Pepesi': 'Pepsi', 'Pepsi': 'Pepsi', 'Пепси': 'Pepsi',
        'Cerveza Patagonia': 'Patagonia Beer', 'Patagonia Beer': 'Patagonia Beer', 'Cerveja Patagonia': 'Patagonia Beer', 'Пиво Patagonia': 'Patagonia Beer', 'Patagonia Bier': 'Patagonia Beer', 'Bière Patagonia': 'Patagonia Beer',
        'Cerveza Heineken': 'Heineken Beer', 'Heineken Beer': 'Heineken Beer', 'Cerveja Heineken': 'Heineken Beer', 'Пиво Heineken': 'Heineken Beer', 'Heineken Bier': 'Heineken Beer', 'Bière Heineken': 'Heineken Beer',
        'Agua': 'Water', 'Water': 'Water', 'Água': 'Water', 'Вода': 'Water', 'Wasser': 'Water', 'Eau': 'Water',
        'Vino Tinto': 'Red Wine', 'Red Wine': 'Red Wine', 'Vinho Tinto': 'Red Wine', 'Красное вино': 'Red Wine', 'Rotwein': 'Red Wine', 'Vin Rouge': 'Red Wine',
        'Flan Casero': 'Homemade Flan', 'Homemade Flan': 'Homemade Flan', 'Pudim Caseiro': 'Homemade Flan', 'Домашний флан': 'Homemade Flan', 'Hausgemachter Flan': 'Homemade Flan', 'Flan Maison': 'Homemade Flan',
        'Torta de Queso': 'Cheesecake', 'Cheesecake': 'Cheesecake', 'Чизкейк': 'Cheesecake', 'Käsekuchen': 'Cheesecake',
        'Helado': 'Ice Cream', 'Ice Cream': 'Ice Cream', 'Sorvete': 'Ice Cream', 'Мороженое': 'Ice Cream', 'Eis': 'Ice Cream', 'Glace': 'Ice Cream',
        'Brownie con helado': 'Brownie with Ice Cream', 'Brownie with Ice Cream': 'Brownie with Ice Cream', 'Brownie com sorvete': 'Brownie with Ice Cream', 'Брауни с мороженым': 'Brownie with Ice Cream', 'Brownie mit Eis': 'Brownie with Ice Cream', 'Brownie avec glace': 'Brownie with Ice Cream',
        'Chocotorta': 'Chocotorta', 'Чокоторта': 'Chocotorta'
      },
      'pt': {
        'Ravioles de ricota': 'Ravioli de ricota', 'Ricotta Ravioli': 'Ravioli de ricota', 'Ravioli de ricota': 'Ravioli de ricota', 'Равиоли с рикоттой': 'Ravioli de ricota', 'Ricotta-Ravioli': 'Ravioli de ricota', 'Raviolis à la ricotta': 'Ravioli de ricota',
        'Omelette': 'Omelete', 'Omelet': 'Omelete', 'Omelete': 'Omelete', 'Омлет': 'Omelete', 'Omelett': 'Omelete',
        'Milanesa': 'Milanesa', 'Миланеса': 'Milanesa',
        'Entraña': 'Entranha', 'Skirt Steak': 'Entranha', 'Entranha': 'Entranha', 'Стейк Мачете': 'Entranha',
        'Hamburguesa': 'Hambúrguer', 'Hamburger': 'Hambúrguer', 'Hambúrguer': 'Hambúrguer', 'Гамбургер': 'Hambúrguer',
        'Estofado de Pollo': 'Ensopado de Frango', 'Chicken Stew': 'Ensopado de Frango', 'Ensopado de Frango': 'Ensopado de Frango', 'Тушеная курица': 'Ensopado de Frango', 'Hühnereintopf': 'Ensopado de Frango', 'Ragoût de poulet': 'Ensopado de Frango',
        'Daikiri': 'Daquiri', 'Daiquiri': 'Daquiri', 'Daquiri': 'Daquiri', 'Дайкири': 'Daquiri', 'Daïquiri': 'Daquiri',
        'Refresco de cola': 'Refrigerante de cola', 'Cola Soda': 'Refrigerante de cola', 'Refrigerante de cola': 'Refrigerante de cola', 'Кола': 'Refrigerante de cola', 'Cola': 'Refrigerante de cola', 'Soda au cola': 'Refrigerante de cola',
        'Pepesi': 'Pepsi', 'Pepsi': 'Pepsi', 'Пепси': 'Pepsi',
        'Cerveza Patagonia': 'Cerveja Patagonia', 'Patagonia Beer': 'Cerveja Patagonia', 'Cerveja Patagonia': 'Cerveja Patagonia', 'Пиво Patagonia': 'Cerveja Patagonia', 'Patagonia Bier': 'Cerveja Patagonia', 'Bière Patagonia': 'Cerveja Patagonia',
        'Cerveza Heineken': 'Cerveja Heineken', 'Heineken Beer': 'Cerveja Heineken', 'Cerveja Heineken': 'Cerveja Heineken', 'Пиво Heineken': 'Cerveja Heineken', 'Heineken Bier': 'Cerveja Heineken', 'Bière Heineken': 'Cerveja Heineken',
        'Agua': 'Água', 'Water': 'Água', 'Água': 'Água', 'Вода': 'Água', 'Wasser': 'Água', 'Eau': 'Água',
        'Vino Tinto': 'Vinho Tinto', 'Red Wine': 'Vinho Tinto', 'Vinho Tinto': 'Vinho Tinto', 'Красное вино': 'Vinho Tinto', 'Rotwein': 'Vinho Tinto', 'Vin Rouge': 'Vinho Tinto',
        'Flan Casero': 'Pudim Caseiro', 'Homemade Flan': 'Pudim Caseiro', 'Pudim Caseiro': 'Pudim Caseiro', 'Домашний флан': 'Pudim Caseiro', 'Hausgemachter Flan': 'Pudim Caseiro', 'Flan Maison': 'Pudim Caseiro',
        'Torta de Queso': 'Cheesecake', 'Cheesecake': 'Cheesecake', 'Чизкейк': 'Cheesecake', 'Käsekuchen': 'Cheesecake',
        'Helado': 'Sorvete', 'Ice Cream': 'Sorvete', 'Sorvete': 'Sorvete', 'Мороженое': 'Sorvete', 'Eis': 'Sorvete', 'Glace': 'Sorvete',
        'Brownie con helado': 'Brownie com sorvete', 'Brownie with Ice Cream': 'Brownie com sorvete', 'Brownie com sorvete': 'Brownie com sorvete', 'Брауни с мороженым': 'Brownie com sorvete', 'Brownie mit Eis': 'Brownie com sorvete', 'Brownie avec glace': 'Brownie com sorvete',
        'Chocotorta': 'Chocotorta', 'Чокоторта': 'Chocotorta'
      },
      'ru': {
        'Ravioles de ricota': 'Равиоли с рикоттой', 'Ricotta Ravioli': 'Равиоли с рикоттой', 'Ravioli de ricota': 'Равиоли с рикоттой', 'Равиоли с рикоттой': 'Равиоли с рикоттой', 'Ricotta-Ravioli': 'Равиоли с рикоттой', 'Raviolis à la ricotta': 'Равиоли с рикоттой',
        'Omelette': 'Омлет', 'Omelet': 'Омлет', 'Omelete': 'Омлет', 'Омлет': 'Омлет', 'Omelett': 'Омлет',
        'Milanesa': 'Миланеса', 'Миланеса': 'Миланеса',
        'Entraña': 'Стейк Мачете', 'Skirt Steak': 'Стейк Мачете', 'Entranha': 'Стейк Мачете', 'Стейк Мачете': 'Стейк Мачете',
        'Hamburguesa': 'Гамбургер', 'Hamburger': 'Гамбургер', 'Hambúrguer': 'Гамбургер', 'Гамбургер': 'Гамбургер',
        'Estofado de Pollo': 'Тушеная курица', 'Chicken Stew': 'Тушеная курица', 'Ensopado de Frango': 'Тушеная курица', 'Тушеная курица': 'Тушеная курица', 'Hühnereintopf': 'Тушеная курица', 'Ragoût de poulet': 'Тушеная курица',
        'Daikiri': 'Дайкири', 'Daiquiri': 'Дайкири', 'Daquiri': 'Дайкири', 'Дайкири': 'Дайкири', 'Daïquiri': 'Дайкири',
        'Refresco de cola': 'Кола', 'Cola Soda': 'Кола', 'Refrigerante de cola': 'Кола', 'Кола': 'Кола', 'Cola': 'Кола', 'Soda au cola': 'Кола',
        'Pepesi': 'Пепси', 'Pepsi': 'Пепси', 'Пепси': 'Пепси',
        'Cerveza Patagonia': 'Пиво Patagonia', 'Patagonia Beer': 'Пиво Patagonia', 'Cerveja Patagonia': 'Пиво Patagonia', 'Пиво Patagonia': 'Пиво Patagonia', 'Patagonia Bier': 'Пиво Patagonia', 'Bière Patagonia': 'Пиво Patagonia',
        'Cerveza Heineken': 'Пиво Heineken', 'Heineken Beer': 'Пиво Heineken', 'Cerveja Heineken': 'Пиво Heineken', 'Пиво Heineken': 'Пиво Heineken', 'Heineken Bier': 'Пиво Heineken', 'Bière Heineken': 'Пиво Heineken',
        'Agua': 'Вода', 'Water': 'Вода', 'Água': 'Вода', 'Вода': 'Вода', 'Wasser': 'Вода', 'Eau': 'Вода',
        'Vino Tinto': 'Красное вино', 'Red Wine': 'Красное вино', 'Vinho Tinto': 'Красное вино', 'Красное вино': 'Красное вино', 'Rotwein': 'Красное вино', 'Vin Rouge': 'Красное вино',
        'Flan Casero': 'Домашний флан', 'Homemade Flan': 'Домашний флан', 'Pudim Caseiro': 'Домашний флан', 'Домашний флан': 'Домашний флан', 'Hausgemachter Flan': 'Домашний флан', 'Flan Maison': 'Домашний флан',
        'Torta de Queso': 'Чизкейк', 'Cheesecake': 'Чизкейк', 'Чизкейк': 'Чизкейк', 'Käsekuchen': 'Чизкейк',
        'Helado': 'Мороженое', 'Ice Cream': 'Мороженое', 'Sorvete': 'Мороженое', 'Мороженое': 'Мороженое', 'Eis': 'Мороженое', 'Glace': 'Мороженое',
        'Brownie con helado': 'Брауни с мороженым', 'Brownie with Ice Cream': 'Брауни с мороженым', 'Brownie com sorvete': 'Брауни с мороженым', 'Брауни с мороженым': 'Брауни с мороженым', 'Brownie mit Eis': 'Брауни с мороженым', 'Brownie avec glace': 'Брауни с мороженым',
        'Chocotorta': 'Чокоторта', 'Чокоторта': 'Чокоторта'
      },
      'de': {
        'Ravioles de ricota': 'Ricotta-Ravioli', 'Ricotta Ravioli': 'Ricotta-Ravioli', 'Ravioli de ricota': 'Ricotta-Ravioli', 'Равиоли с рикоттой': 'Ricotta-Ravioli', 'Ricotta-Ravioli': 'Ricotta-Ravioli', 'Raviolis à la ricotta': 'Ricotta-Ravioli',
        'Omelette': 'Omelett', 'Omelet': 'Omelett', 'Omelete': 'Omelett', 'Омлет': 'Omelett', 'Omelett': 'Omelett',
        'Milanesa': 'Milanesa', 'Миланеса': 'Milanesa',
        'Entraña': 'Entraña', 'Skirt Steak': 'Entraña', 'Entranha': 'Entraña', 'Стейк Мачете': 'Entraña',
        'Hamburguesa': 'Hamburger', 'Hamburger': 'Hamburger', 'Hambúrguer': 'Hamburger', 'Гамбургер': 'Hamburger',
        'Estofado de Pollo': 'Hühnereintopf', 'Chicken Stew': 'Hühnereintopf', 'Ensopado de Frango': 'Hühnereintopf', 'Тушеная курица': 'Hühnereintopf', 'Hühnereintopf': 'Hühnereintopf', 'Ragoût de poulet': 'Hühnereintopf',
        'Daikiri': 'Daiquiri', 'Daiquiri': 'Daiquiri', 'Daquiri': 'Daiquiri', 'Дайкири': 'Daiquiri', 'Daïquiri': 'Daiquiri',
        'Refresco de cola': 'Cola', 'Cola Soda': 'Cola', 'Refrigerante de cola': 'Cola', 'Кола': 'Cola', 'Cola': 'Cola', 'Soda au cola': 'Cola',
        'Pepesi': 'Pepsi', 'Pepsi': 'Pepsi', 'Пепси': 'Pepsi',
        'Cerveza Patagonia': 'Patagonia Bier', 'Patagonia Beer': 'Patagonia Bier', 'Cerveja Patagonia': 'Patagonia Bier', 'Пиво Patagonia': 'Patagonia Bier', 'Patagonia Bier': 'Patagonia Bier', 'Bière Patagonia': 'Patagonia Bier',
        'Cerveza Heineken': 'Heineken Bier', 'Heineken Beer': 'Heineken Bier', 'Cerveja Heineken': 'Heineken Bier', 'Пиво Heineken': 'Heineken Bier', 'Heineken Bier': 'Heineken Bier', 'Bière Heineken': 'Heineken Bier',
        'Agua': 'Wasser', 'Water': 'Wasser', 'Água': 'Wasser', 'Вода': 'Wasser', 'Wasser': 'Wasser', 'Eau': 'Wasser',
        'Vino Tinto': 'Rotwein', 'Red Wine': 'Rotwein', 'Vinho Tinto': 'Rotwein', 'Красное вино': 'Rotwein', 'Rotwein': 'Rotwein', 'Vin Rouge': 'Rotwein',
        'Flan Casero': 'Hausgemachter Flan', 'Homemade Flan': 'Hausgemachter Flan', 'Pudim Caseiro': 'Hausgemachter Flan', 'Домашний флан': 'Hausgemachter Flan', 'Hausgemachter Flan': 'Hausgemachter Flan', 'Flan Maison': 'Hausgemachter Flan',
        'Torta de Queso': 'Käsekuchen', 'Cheesecake': 'Käsekuchen', 'Чизкейк': 'Käsekuchen', 'Käsekuchen': 'Käsekuchen',
        'Helado': 'Eis', 'Ice Cream': 'Eis', 'Sorvete': 'Eis', 'Мороженое': 'Eis', 'Eis': 'Eis', 'Glace': 'Eis',
        'Brownie con helado': 'Brownie mit Eis', 'Brownie with Ice Cream': 'Brownie mit Eis', 'Brownie com sorvete': 'Brownie mit Eis', 'Брауни с мороженым': 'Brownie mit Eis', 'Brownie mit Eis': 'Brownie mit Eis', 'Brownie avec glace': 'Brownie mit Eis',
        'Chocotorta': 'Chocotorta', 'Чокоторта': 'Chocotorta'
      },
      'fr': {
        'Ravioles de ricota': 'Raviolis à la ricotta', 'Ricotta Ravioli': 'Raviolis à la ricotta', 'Ravioli de ricota': 'Raviolis à la ricotta', 'Равиоли с рикоттой': 'Raviolis à la ricotta', 'Ricotta-Ravioli': 'Raviolis à la ricotta', 'Raviolis à la ricotta': 'Raviolis à la ricotta',
        'Omelette': 'Omelette', 'Omelet': 'Omelette', 'Omelete': 'Omelette', 'Омлет': 'Omelette', 'Omelett': 'Omelette',
        'Milanesa': 'Milanesa', 'Миланеса': 'Milanesa',
        'Entraña': 'Entraña', 'Skirt Steak': 'Entraña', 'Entranha': 'Entraña', 'Стейк Мачете': 'Entraña',
        'Hamburguesa': 'Hamburger', 'Hamburger': 'Hamburger', 'Hambúrguer': 'Hamburger', 'Гамбургер': 'Hamburger',
        'Estofado de Pollo': 'Ragoût de poulet', 'Chicken Stew': 'Ragoût de poulet', 'Ensopado de Frango': 'Ragoût de poulet', 'Тушеная курица': 'Ragoût de poulet', 'Hühnereintopf': 'Ragoût de poulet', 'Ragoût de poulet': 'Ragoût de poulet',
        'Daikiri': 'Daïquiri', 'Daiquiri': 'Daïquiri', 'Daquiri': 'Daïquiri', 'Дайкири': 'Daïquiri', 'Daïquiri': 'Daïquiri',
        'Refresco de cola': 'Soda au cola', 'Cola Soda': 'Soda au cola', 'Refrigerante de cola': 'Soda au cola', 'Кола': 'Soda au cola', 'Cola': 'Soda au cola', 'Soda au cola': 'Soda au cola',
        'Pepesi': 'Pepsi', 'Pepsi': 'Pepsi', 'Пепси': 'Pepsi',
        'Cerveza Patagonia': 'Bière Patagonia', 'Patagonia Beer': 'Bière Patagonia', 'Cerveja Patagonia': 'Bière Patagonia', 'Пиво Patagonia': 'Bière Patagonia', 'Patagonia Bier': 'Bière Patagonia', 'Bière Patagonia': 'Bière Patagonia',
        'Cerveza Heineken': 'Bière Heineken', 'Heineken Beer': 'Bière Heineken', 'Cerveja Heineken': 'Bière Heineken', 'Пиво Heineken': 'Bière Heineken', 'Heineken Bier': 'Bière Heineken', 'Bière Heineken': 'Bière Heineken',
        'Agua': 'Eau', 'Water': 'Eau', 'Água': 'Eau', 'Вода': 'Eau', 'Wasser': 'Eau', 'Eau': 'Eau',
        'Vino Tinto': 'Vin Rouge', 'Red Wine': 'Vin Rouge', 'Vinho Tinto': 'Vin Rouge', 'Красное вино': 'Vin Rouge', 'Rotwein': 'Vin Rouge', 'Vin Rouge': 'Vin Rouge',
        'Flan Casero': 'Flan Maison', 'Homemade Flan': 'Flan Maison', 'Pudim Caseiro': 'Flan Maison', 'Домашний флан': 'Flan Maison', 'Hausgemachter Flan': 'Flan Maison', 'Flan Maison': 'Flan Maison',
        'Torta de Queso': 'Cheesecake', 'Cheesecake': 'Cheesecake', 'Чизкейк': 'Cheesecake', 'Käsekuchen': 'Cheesecake',
        'Helado': 'Glace', 'Ice Cream': 'Glace', 'Sorvete': 'Glace', 'Мороженое': 'Glace', 'Eis': 'Glace', 'Glace': 'Glace',
        'Brownie con helado': 'Brownie avec glace', 'Brownie with Ice Cream': 'Brownie avec glace', 'Brownie com sorvete': 'Brownie avec glace', 'Брауни с мороженым': 'Brownie avec glace', 'Brownie mit Eis': 'Brownie avec glace', 'Brownie avec glace': 'Brownie avec glace',
        'Chocotorta': 'Chocotorta', 'Чокоторта': 'Chocotorta'
      }
    };

    // Va directo al idioma y busca el producto. Si no lo encuentra, devuelve el original.
    return traducciones[idiomaActual]?.[value] || value;
  }

}
