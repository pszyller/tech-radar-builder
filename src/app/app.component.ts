import { Component, ChangeDetectorRef } from '@angular/core';
import {Router, ActivatedRoute, Params} from '@angular/router';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  showRadar : boolean;
  uid: string;
  owner:string = "";
  ready: boolean;
  init: boolean = true;

  constructor(private route: ActivatedRoute, private ref: ChangeDetectorRef) {
  //  this.showRadar = false;
  }

ngOnInit() {
    // subscribe to router event
     this.route.params.subscribe((params: Params) => {
    
    });
    this.route.queryParams.subscribe((params: Params) => {
         
      debugger;
         if(window.location.href.indexOf('?') > 0)
         {
            if(this.init)
            {
              this.init = false;
              return;  
            }
            else
            {
              var autologinUser = params['u'];
              var autologinPassword = params['p'];
              
              var data = params['radar'].split("||");
              localStorage.setItem("uid", data[0]);
              localStorage.setItem("radar", data[1]);
            }
         }
         
       //  this.owner = params['id'];
         this.ready = true;
      });
  }
  signedIn(e) {
  
    this.showRadar = true;

  }


}
