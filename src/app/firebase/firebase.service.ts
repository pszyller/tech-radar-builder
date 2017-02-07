import { AngularFire, FirebaseAuthState, AuthProviders, AuthMethods, FirebaseListObservable } from 'angularfire2';
import { Injectable } from '@angular/core';

@Injectable()
export class FirebaseService {
  items: FirebaseListObservable<any[]>;
  angularFire: AngularFire;

  constructor(af: AngularFire) {
    this.angularFire = af;

  //  this.items = af.database.list('/radars');
  }

  auth(provider : AuthProviders) {
    return this.angularFire.auth.login({
      provider: provider,
      method: AuthMethods.Popup,
    });
  }

    getRadars(uid: string) {
    
    return this.angularFire.database.list('/radars/' + uid);

  }  
      updateRadar(uid: string, radar: any) {

        if(radar.key == null)
        {
           this.angularFire.database.list('/radars/' + uid).push(JSON.stringify(radar)).then(r=>
           {
             radar.key = r.key
             ;
           });
        }
        else
        {
          var item = this.angularFire.database.object('/radars/' + uid + '/' + radar.key);
          item.set(JSON.stringify(radar));
        }     
    } 

        deleteRadar(uid: string, radar: any) {
          if(radar.key == null)
          return;
          var item = this.angularFire.database.object('/radars/' + uid + '/' + radar.key);
          item.remove();
    }   
}
