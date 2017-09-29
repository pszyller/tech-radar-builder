import { Component, OnInit,AfterViewInit, EventEmitter, Output, Input } from '@angular/core';
import { AngularFire, FirebaseAuthState, AuthProviders, AuthMethods, FirebaseListObservable } from 'angularfire2';
import { FirebaseService } from '../firebase/firebase.service';
import { Injectable } from '@angular/core';
import { TechRadar } from '../radar/radar';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
  providers: [FirebaseService]
})

export class SignInComponent implements AfterViewInit {

  uid: string;
  @Output() signedin: EventEmitter<string> = new EventEmitter<string>();
  @Input() owner: string;

  constructor(private firebaseService: FirebaseService) {
 
  }

  authByGoogle() { this.authBy(AuthProviders.Google); }
  authByGitHub() { this.authBy(AuthProviders.Github); }
  authByFacebook() { this.authBy(AuthProviders.Facebook); }
  authByTwitter() { this.authBy(AuthProviders.Twitter); }

  authBy(provider: AuthProviders) {
    this.firebaseService.auth(provider).then(state => {

      if (state.uid != null) {
        this.uid = state.uid;
        localStorage.setItem("uid", this.uid);
        this.signedin.next(this.uid);
      }
    }).catch(e => {
      alert(e);
    });
  }

ngAfterViewInit() 
 {
    if(this.owner)
    {
      localStorage.setItem("uid", this.owner);
    }
 
    this.uid = localStorage.getItem("uid");
    debugger;
    if (this.uid != null) {
      this.signedin.next(this.uid);
      return;
    }
    else {


      var data = "{\"config\":{\"title\":\"Sample Radar\",\"updateDate\":\"Sun Feb 05 2017 21:54:27 GMT+0100 (Central European Standard Time)\",\"contact\":\"\",\"slices\":[\"Practices\",\"Tools/Technologies\"],\"stages\":[{\"name\":\"Delete, forget, don't use...\",\"scale\":0.2},{\"name\":\"Just found...\",\"scale\":0.2},{\"name\":\"Looks good...\",\"scale\":0.2},{\"name\":\"Trying to use ...\",\"scale\":0.2},{\"name\":\"Love it !!...\",\"scale\":0.2}],\"showItemsList\":false},\"data\":[{\"slice\":\"Practices\",\"data\":[{\"title\":\"technology polygon\",\"desc\":\"Use as much different frameworks and libraries as possible in our project! Don't care about agreed technology stack!.. developers loves it :)\",\"stage\":\"Delete, forget, don't use...\",\"x\":1045.8333666666667,\"y\":177.08333333333331}]},{\"slice\":\"Languages\",\"data\":[]},{\"slice\":\"Tools/Technologies\",\"data\":[{\"title\":\"tech-radar-builder\",\"desc\":\"Helps to keep all core technologies in one picture. Supports controlled technologies flow.. and it's very useful in presentations to your boss :-)\",\"stage\":\"Trying to use ...\",\"x\":848.9582666666666,\"y\":390.6249666666667}]}],\"key\":\"\"}";

      //new TechRadar(JSON.parse(data), 1);
    }
  }



}
