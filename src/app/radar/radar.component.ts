import { Component, OnInit,NgZone } from '@angular/core';
import * as _ from "lodash";
import { TechRadar } from './radar';
import { RadarDefinition, RadarDataItemDef, RadarStage, RadarSlice, ScalableItem, ViewSettings } from './radar-definition';
import { FirebaseService } from '../firebase/firebase.service';


@Component({
  selector: 'app-radar',
  templateUrl: './radar.component.html',
  styleUrls: ['./radar.component.css'],
  providers: [FirebaseService]
})

export class RadarComponent implements OnInit {

  techRadar: TechRadar;
  radarDefinition: RadarDefinition
  workingCopyRadarDefinition: RadarDefinition
  newItemMode :string;
  editingItem : RadarDataItemDef;
  itemWorkingCopy : RadarDataItemDef = new RadarDataItemDef();
  uid: string;
  radars: Array<RadarDefinition>;
  loaded: boolean = false;
  lock: boolean = false;
  firebaseService: FirebaseService;
  json: string = "test";
  viewSettings: ViewSettings = new ViewSettings();
  
  constructor(private fService: FirebaseService, private zone: NgZone) {
  
    this.viewSettings.readOnly = !fService.isAuth;
    this.uid = localStorage.getItem("uid");
    this.firebaseService = fService;
  }

  ngOnInit() {
    


  var l = this.firebaseService.getRadars(this.uid).subscribe(r => {
      l.unsubscribe();
      this.radars =
        _.map(r, i => {
          var obj = <RadarDefinition>JSON.parse(i.$value);
          obj.key = i.$key;
          return obj;
        });

      this.createRadar(this.radars[0]);
      this.radarDefinition = this.techRadar.radarDefinition;
      this.configureClick(false);

      this.loaded = true;
    });
  }

  editItem(item : RadarDataItemDef)
  {
  console.log(item.title);
    this.newItemMode = 'edit';
    this.editingItem = item;
  
    this.itemWorkingCopy = _.cloneDeep(item);
    this.zone.run(()=>{
  document.getElementById('itemDetailsBtn').click();
});
   
  }

  addNewItem() {
 
    let newItem = new RadarDataItemDef();
    newItem.x = 500;
    newItem.y = 100;
    
    if(this.newItemMode == 'edit')
    {
     
      var oldName = this.editingItem.title;
    this.editingItem.title = this.itemWorkingCopy.title;
    this.editingItem.desc = this.itemWorkingCopy.desc;
    this.editingItem.size = this.itemWorkingCopy.size;
    this.editingItem.color = this.itemWorkingCopy.color;
    this.editingItem.history = this.itemWorkingCopy.history;

    this.techRadar.update(this.editingItem, oldName);
      return;
    }
    
    newItem.title = this.itemWorkingCopy.title;
    newItem.desc = this.itemWorkingCopy.desc;
    newItem.size = this.itemWorkingCopy.size;
    newItem.color = this.itemWorkingCopy.color;

    this.techRadar.add(newItem, newItem.x, newItem.y, "#ff0000", true);
  }

  changeRadar(radar) {

    this.radarDefinition = radar;
    this.createRadar(radar);
  }

  createRadar(radar: RadarDefinition) {
   
    this.techRadar = new TechRadar(radar, 1, this.viewSettings.readOnly);
  

    this.techRadar.addUpdateListener(s => {
     //this.json = JSON.stringify(s, null, 2);
      this.firebaseService.updateRadar(this.uid, s);
    });
    this.techRadar.editItem = (itm) =>
    {
      debugger;
      this.editItem(itm);
    }
  }

  canAddSlices() {
    return this.workingCopyRadarDefinition.config.slices.length < 15;
  }
  canAddStages() {
    return this.workingCopyRadarDefinition.config.stages.length < 15;
  }
  canRemoveSlices() {
    return this.workingCopyRadarDefinition.config.slices.length > 2;
  }
  canRemoveStages() {
    return this.workingCopyRadarDefinition.config.stages.length > 1;
  }

  saveConfig() {

    this.radarDefinition = JSON.parse(JSON.stringify(this.workingCopyRadarDefinition));

    if (this.radarDefinition.key == null) {
      this.radars.push(this.radarDefinition);
    }

    this.firebaseService.updateRadar(this.uid, this.radarDefinition);
    this.createRadar(this.radarDefinition);
  }

  addItemClick()
  {
    this.newItemMode='add';
    this.itemWorkingCopy = new RadarDataItemDef();
  }

  configureClick(isNew: boolean) {

    this.workingCopyRadarDefinition = JSON.parse(JSON.stringify(this.radarDefinition));
    this.resetPerc(this.workingCopyRadarDefinition.config.stages, true);
    this.resetPerc(this.workingCopyRadarDefinition.config.slices, true);

    if (isNew) {
      this.workingCopyRadarDefinition.key = null;
      this.workingCopyRadarDefinition.config.title = '';
      this.workingCopyRadarDefinition.data = [];
    }
  }

  resetPerc(arr: Array<ScalableItem>, onlyIfMoreThan100: boolean) {

    if (onlyIfMoreThan100) {
      let sum = 0;
      _.forEach(arr, (x) => sum += x.perc);
      if (sum < 100.5) {
        return;
      }
    }
    _.forEach(arr, (x) => x.perc = Math.round((100 / arr.length) * 100)/100);
  }

  removeStage(stage: RadarStage) {
    this.workingCopyRadarDefinition.config.stages =
      _.remove(this.workingCopyRadarDefinition.config.stages, (x: RadarStage) => { return x.name !== stage.name; });

    this.resetPerc(this.workingCopyRadarDefinition.config.stages, false);
  }

  addStage() {
    let newStage = new RadarStage();
    newStage.name = "new stage " + (this.workingCopyRadarDefinition.config.stages.length + 1);

    this.workingCopyRadarDefinition.config.stages.push(newStage);
    this.resetPerc(this.workingCopyRadarDefinition.config.stages, true);
  }

  removeHistoryItem(index: number)
  {
    this.itemWorkingCopy.history.splice(index, 1);
  }
  removeSlice(slice: string) {

    this.workingCopyRadarDefinition.config.slices =
      _.remove(this.workingCopyRadarDefinition.config.slices, (x: string) => { return x !== slice; });

    this.resetPerc(this.workingCopyRadarDefinition.config.slices, false);

  }

  addSlice() {
    this.workingCopyRadarDefinition.config.slices.push(new RadarSlice({ name: "new slice " + (this.workingCopyRadarDefinition.config.slices.length + 1) }));
    this.resetPerc(this.workingCopyRadarDefinition.config.slices, true);
  }

  trackByInd(ind) {
  }

  signOut() {
    localStorage.removeItem("uid");
    this.firebaseService.logout();
    window.location.href = window.location.href;
  }

  signedIn(uid)
  {
    this.uid = uid;
    window.location.href = window.location.href;
  }

  editClick()
  {
    this.viewSettings.readOnly = !this.viewSettings.readOnly;

    this.createRadar(this.radars[0]);
    
  }

  deleteClick() {
    this.firebaseService.deleteRadar(this.uid, this.radarDefinition);
    this.ngOnInit();
  }

  percChanged(e, ind, arr: Array<ScalableItem>) {

    let sum = 0;
    _.forEach(arr, (x) => sum += x.perc);
    console.debug('presum:' + sum);
    let dx = sum - 100;
    var dv = dx / (arr.length - 1);
    var c = arr[ind].perc;
    for (let i = 0; i < arr.length; i++) {
      if (i === ind) {
        continue;
      }
      arr[i].perc -= dv;
      console.log('rounded b ' + arr[i].perc);
      arr[i].perc = Math.round(arr[i].perc * 100) / 100;

      console.log('rounded a ' + arr[i].perc);
    }

    sum = 0;
    _.forEach(arr, (x) => sum += x.perc);
    console.debug('sum:' + sum);
  }
}
