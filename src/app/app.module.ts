import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AppComponent } from './app.component';
import { RouterModule, Routes } from '@angular/router';
import { SignInComponent } from './sign-in/sign-in.component';
import { FirebaseService } from './firebase/firebase.service';
import { AngularFireModule  } from 'angularfire2';
import { RadarComponent } from './radar/radar.component';
import { TechRadar } from './radar/radar';

const appRoutes: Routes = [
  { path: 'signin', component: SignInComponent },
];

// Must export the config
export const firebaseConfig = {
  apiKey: 'AIzaSyCIyrU3ftEp3raSpagshnkSV9cfsiEgC7I',
  authDomain: 'tech-radar-builder-fce18.firebaseapp.com',
  databaseURL: 'https://tech-radar-builder-fce18.firebaseio.com',
  storageBucket: 'tech-radar-builder-fce18.appspot.com',
  messagingSenderId: '853822780959'
};

@NgModule({
  declarations: [
    AppComponent,
    SignInComponent,
    RadarComponent
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
    BrowserModule,
    FormsModule,
    HttpModule,
    AngularFireModule.initializeApp(firebaseConfig)
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }
