import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  showRadar : boolean = false;

  constructor() {
  //  this.showRadar = false;
  }

  signedIn(e) {
    this.showRadar = true;
  }


}
