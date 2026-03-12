import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-splashscreen',
  templateUrl: './components.component.html',
  styleUrls: ['./components.component.scss'],
  standalone: true,
  imports: [IonSpinner, NgIf],
})
export class SplashscreenComponent implements OnInit {
  @Output() splashFinished = new EventEmitter<boolean>();
  showSplash = true;

  constructor() { }

  ngOnInit(): void {
    setTimeout(() => {
      this.showSplash = false;
      this.splashFinished.emit(true);
    }, 3700); 
  }
}