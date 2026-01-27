import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/iniciar-sesion/iniciar-sesion.component').then(
        (m) => m.IniciarSesionComponent
      ),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./components/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'alta-cliente',
    loadComponent: () =>
      import('./components/alta-cliente/alta-cliente.component').then(
        (m) => m.AltaClienteComponent
      ),
  },
   {
     path: 'cliente-espera-mesa',
     loadComponent: () =>
       import('./components/cliente/espera-mesa/espera-mesa.component').then(
         (m) => m.EsperaMesaComponent
       ),
   },
   
  {
     path: 'cliente-espera-pedido',
     loadComponent: () =>
       import('./components/cliente/espera-pedido/espera-pedido.component').then(
         (m) => m.EsperaPedidoComponent
       ),
   },
   {
     path: 'cliente-recibe-pedido',
     loadComponent: () =>
       import('./components/cliente/recibe-pedido/recibe-pedido.component').then(
         (m) => m.RecibePedidoComponent
       ),
   },

  {
    path: 'listado-clientes-solicitando-mesa',
    loadComponent: () =>
      import(
        './components/listado-clientes-solicitando-mesa/listado-clientes-solicitando-mesa.component'
      ).then((m) => m.ListadoClientesSolicitandoMesaComponent),
  },
  {
    path: 'bar',
    loadComponent: () =>
      import('./components/bar/bar.component').then((m) => m.BarComponent),
  },

  {
    path: 'cocina',
    loadComponent: () =>
      import('./components/cocina/cocina.component').then(
        (m) => m.CocinaComponent
      ),
  },
  {
    path: 'listado-productos-pendientes-mesero',
    loadComponent: () =>
      import(
        './components/listado-productos-pendientes-mozo/listado-productos-pendientes-mozo.component'
      ).then((m) => m.ListadoProductosPendientesMozoComponent),
  },
  
   {
     path: 'encuesta-cliente',
     loadComponent: () =>
       import('./components/encuestas/cliente/cliente.component').then(
         (m) => m.ClienteComponent
       ),
   },
   {
     path: 'resultado-encuestas-cliente',
     loadComponent: () =>
       import(
         './components/resultado-encuestas/clientes/clientes.component'
       ).then((m) => m.ClientesComponent),
   },
   {
     path: 'listado-productos',
     loadComponent: () =>
       import('./components/listado-productos/listado-productos.component').then(
         (m) => m.ListadoProductosComponent
       ),
   },
   {
     path: 'confirmar-pedidos',
     loadComponent: () =>
       import('./components/confirmar-pedido/confirmar-pedido.component').then(
         (m) => m.ConfirmarPedidoComponent
       ),
   },
   
   {
     path: 'chat',
     loadComponent: () =>
       import('./components/chat/chat.component').then((m) => m.ChatComponent),
   },
  {
    path: 'anonimo',
    loadComponent: () =>
      import('./components/ingreso-anonimo/ingreso-anonimo.component').then(
        (m) => m.IngresoAnonimoComponent
      ),
  },
   {
     path: 'pedir-cuenta',
     loadComponent: () =>
       import('./components/pedir-cuenta/pedir-cuenta.component').then(
         (m) => m.PedirCuentaComponent
       ),
   },
   {
    path: 'listado-clientes',
    loadComponent: () =>
      import('./components/listado-clientes/listado-clientes.component').then(
        (m) => m.ListadoClientesComponent
      ),
  },
   {
     path: 'confirmar-pago',
     loadComponent: () =>
       import('./components/confirmar-pago/confirmar-pago.component').then(
         (m) => m.ConfirmarPagoComponent
       ),
   },
   {
     path: 'alta-comida',
     loadComponent: () =>
       import('./components/alta-comida/alta-comida.component').then(
         (m) => m.AltaProductoComponent
       ),
   },
   {
     path: 'alta-bebida',
     loadComponent: () =>
       import('./components/alta-bebida/alta-bebida.component').then(
         (m) => m.AltaBebidaComponent
       ),
   },

   {
     path: 'alta-mesa',
     loadComponent: () =>
       import('./components/alta-mesa/alta-mesa.component').then(
         (m) => m.AltaMesaComponent
       ),
   },
   {
     path: 'reserva-mesa',
     loadComponent: () =>
       import('./components/reserva-mesa/reserva-mesa.component').then(
         (m) => m.ReservaMesaComponent
       ),
   },
   {
     path: 'listado-confirmar-reserva',
     loadComponent: () =>
       import('./components/confirmar-reserva/confirmar-reserva.component').then(
         (m) => m.ConfirmarReservaComponent
       ),
   },
{
     path: 'agregar-empleado',
     loadComponent: () =>
       import('./components/agregar-empleado/agregar-empleado.component').then(
         (m) => m.AgregarEmpleadoComponent
       ),
   },
   {
     path: 'juego',
     loadComponent: () =>
       import('./components/juegos/sala-de-juegos/sala-de-juegos.component').then(
         (m) => m.SalaDeJuegosComponent
       ),
   },
   {
     path: 'ahorcado',
     loadComponent: () =>
       import('./components/juegos/ahorcado/ahorcado').then(
         (m) => m.Ahorcado
       ),
   },
   {
     path: 'mayormenor',
     loadComponent: () =>
       import('./components/juegos/mayor-menor/mayor-menor').then(
         (m) => m.MayorMenor
       ),
   },
   {
     path: 'kinetico',
     loadComponent: () =>
       import('./components/juegos/kinetico/kinetico.component').then(
         (m) => m.KineticoComponent
       ),
   },
   {
     path: 'personajes',
     loadComponent: () =>
       import('./components/juegos/personaje/personaje.component').then(
         (m) => m.PersonajeComponent
       ),
   },
   {
     path: 'juegokinetico',
     loadComponent: () =>
       import('./components/juegos/juego-component/juego-component.component').then(
         (m) => m.JuegoComponentComponent
       ),
   },
   {
     path: 'juego-esquiva',
     loadComponent: () =>
       import('./components/juegos/juego-esquivar/juego-esquivar.component').then(
         (m) => m.JuegoEsquivarComponent
       ),
   },
   {
     path: 'delivery',
     loadComponent: () =>
       import('./components/delivery/delivery.component').then(
         (m) => m.DeliveryComponent
       ),
   },
    {
     path: 'map-direccion',
     loadComponent: () =>
       import('./components/map-direccion-pedido/map-direccion-pedido.component').then(
         (m) => m.MapDireccionPedidoComponent
       ),
   },
   {
     path: 'confirmar-delivery',
     loadComponent: () =>
       import('./components/confirmar-delivery/confirmar-delivery.component').then(
         (m) => m.ConfirmarDeliveryComponent
       ),
   },
   {
     path: 'listado-delivery',
     loadComponent: () =>
       import('./components/listado-delivery/listado-delivery.component').then(
         (m) => m.ListadoDeliveryComponent
       ),
   },
   {
     path: 'cocina-delivery',
     loadComponent: () =>
       import('./components/cocinero-delivery/cocinero-delivery.component').then(
         (m) => m.CocineroDeliveryComponent
       ),
   },
   {
     path: 'bar-delivery',
     loadComponent: () =>
       import('./components/bartender-delivery/bartender-delivery.component').then(
         (m) => m.BartenderDeliveryComponent
       ),
   },
   {
     path: 'mapa-delivery',
     loadComponent: () =>
       import('./components/mapa-delivery/mapa-delivery.component').then(
         (m) => m.MapaDeliveryComponent
       ),
   },
   {
     path: 'chat-delivery',
     loadComponent: () =>
       import('./components/chat-delivery/chat-delivery.component').then(
         (m) => m.ChatDeliveryComponent
       ),
   },
   {
     path: 'cliente-espera-delivery',
     loadComponent: () =>
       import('./components/cliente-espera-delivery/cliente-espera-delivery.component').then(
         (m) => m.ClienteEsperaDeliveryComponent
       ),
   },


   
];
