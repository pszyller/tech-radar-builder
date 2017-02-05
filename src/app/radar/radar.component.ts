import { Component, OnInit } from '@angular/core';
import * as _ from "lodash";
import { TechRadar } from './radar';
import { RadarDefinition, RadarDataItemDef, RadarStage } from './radar-definition';
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
  newItemTitle: string;
  uid: string;
  radars: Array<RadarDefinition>;
  loaded: boolean = false;

  private newItemDesc: string;

  constructor(private firebaseService: FirebaseService) {
    this.uid = localStorage.getItem("uid");
  }

  ngOnInit() {
      var l = this.firebaseService.getRadars(this.uid).subscribe(r => {
      this.radars =
        _.map(r, i => {
          var obj = <RadarDefinition>JSON.parse(i.$value);
          obj.key = i.$key;
          return obj;
        });

      this.techRadar = new TechRadar(this.radars[0], 1);
      this.techRadar.addUpdateListener(s =>
      {
        l.unsubscribe();
        this.firebaseService.updateRadar(this.uid, s);
      });
      this.radarDefinition = this.techRadar.data;
      this.configureClick();

      this.loaded = true;
    });
  }

  addNewItem() {
    let newItem = new RadarDataItemDef();
    newItem.title = this.newItemTitle;
    newItem.desc = this.newItemDesc;

    this.techRadar.add(newItem, 600, 200, "#ff0000");
  }

  changeRadar(radar) {
  
    this.radarDefinition = radar;
    this.techRadar = new TechRadar(radar, 1);
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

  addConfig() {

    this.radarDefinition = JSON.parse(JSON.stringify(this.workingCopyRadarDefinition));
    this.firebaseService.updateRadar(this.uid, this.radarDefinition);
    this.techRadar = new TechRadar(this.radarDefinition, 1);
    
  }

  configureClick() {
    this.workingCopyRadarDefinition = JSON.parse(JSON.stringify(this.radarDefinition));
  }

  removeStage(stage: RadarStage) {
    this.workingCopyRadarDefinition.config.stages =
      _.remove(this.workingCopyRadarDefinition.config.stages, (x: RadarStage) => { return x.name !== stage.name; });

    _.forEach(this.workingCopyRadarDefinition.config.stages, (x: RadarStage) => { x.scale = 1 / this.workingCopyRadarDefinition.config.stages.length; });
  }

  addStage() {
    let newStage = new RadarStage();
    newStage.name = "new stage " + (this.workingCopyRadarDefinition.config.stages.length + 1);

    this.workingCopyRadarDefinition.config.stages.push(newStage);
    _.forEach(this.workingCopyRadarDefinition.config.stages, (x: RadarStage) => { x.scale = 1 / this.workingCopyRadarDefinition.config.stages.length; });
  }

  removeSlice(slice: string) {

    this.workingCopyRadarDefinition.config.slices =
      _.remove(this.workingCopyRadarDefinition.config.slices, (x: string) => { return x !== slice; });

    // _.forEach(this.radarDefinition.config.slices, (x:RadarStage)=>{ x.scale = 1/this.radarDefinition.config.stages.length; });
  }

  addSlice() {
    this.workingCopyRadarDefinition.config.slices.push("new slice " + (this.workingCopyRadarDefinition.config.slices.length + 1));
  }

  trackByInd(ind) {
  }

  signOut()
  {
    localStorage.removeItem("uid");
    window.location.href=window.location.href;
  }
}
