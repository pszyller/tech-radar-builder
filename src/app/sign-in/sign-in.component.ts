import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
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

export class SignInComponent {

  uid: string;
  @Output() signedin: EventEmitter<string> = new EventEmitter<string>();
  
  constructor(private firebaseService: FirebaseService) {
 
  }

  authByGoogle() { this.authBy(AuthProviders.Google); }
  authByGitHub() { this.authBy(AuthProviders.Github); }
  authByFacebook() { this.authBy(AuthProviders.Facebook); }
  authByTwitter() { this.authBy(AuthProviders.Twitter); }
  authByPassword() { this.authBy(AuthProviders.Password); }

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



}
