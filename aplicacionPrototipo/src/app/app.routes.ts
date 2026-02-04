import { Routes } from '@angular/router';
import { Introduccion } from './componentes/introduccion/introduccion';
import { Productos } from './componentes/productos/productos';
import { Component } from '@angular/core';
import { Prueba } from './componentes/prueba/prueba';
import { PruebaCards } from './componentes/prueba-cards/prueba-cards';

export const routes: Routes = [
    {path:"",component:Introduccion},
    {path:"productos",component:Productos, children: [
        {path:"prueba",component:Prueba}
    ]},
    {path:'prueba', component:PruebaCards},
    { path: '**', redirectTo: '' }
];
