import { AngularFire, FirebaseAuthState, AuthProviders, AuthMethods, FirebaseListObservable } from 'angularfire2';
import { Injectable  } from '@angular/core';
import { Subject } from "rxjs/"

@Injectable()
export class FirebaseService {
  items: FirebaseListObservable<any[]>;
  error: Subject<string> = new Subject<string>();
  userLogin: Subject<string> = new Subject<string>();
  angularFire: AngularFire;
  isAuth : boolean;
  constructor(af: AngularFire) {
    this.angularFire = af;
    this.angularFire.auth.subscribe( (state)=>
    {
      this.isAuth = state != null;     
      if(this.isAuth)
      {
        this.userLogin.next(state.auth.displayName);
      }
    });
  //  this.items = af.database.list('/radars');
  }

  auth(provider : AuthProviders) {
    return this.angularFire.auth.login({
      provider: provider,
      method: AuthMethods.Popup,
    });
  }

  logout()
  {
    this.angularFire.auth.logout();
    
  }

   getRadars(uid: string) {
    
    return this.angularFire.database.list('/radars/' + uid);

  }  
      updateRadar(uid: string, radar: any) {

        if((radar.key || '').length == 0)
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
          item.set(JSON.stringify(radar)).then(()=>{}, (err:any)=>
          {
            this.error.next(err);
          });
        }     
    } 

        deleteRadar(uid: string, radar: any) {
          if(radar.key == null)
          return;
          var item = this.angularFire.database.object('/radars/' + uid + '/' + radar.key);
          item.remove();
    }   
}
