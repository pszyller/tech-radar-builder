import { Component, OnInit, NgZone, AfterViewInit } from '@angular/core';
import * as _ from "lodash";
import { TechRadar } from './radar';
import { RadarDefinition, RadarDataItemDef, RadarStage, RadarSlice, ScalableItem, ViewSettings, RadarDataItem } from './radar-definition';
import { FirebaseService } from '../firebase/firebase.service';


@Component({
  selector: 'app-radar',
  templateUrl: './radar.component.html',
  styleUrls: ['./radar.component.css'],
  providers: [FirebaseService]
})

export class RadarComponent implements OnInit, AfterViewInit  {

  techRadar: TechRadar;
  radarDefinition: RadarDefinition = new RadarDefinition();
  workingCopyRadarDefinition: RadarDefinition;
  newItemMode: string;
  editingItem: RadarDataItemDef;
  itemWorkingCopy: RadarDataItemDef = new RadarDataItemDef();
  uid: string;
  radars: Array<RadarDefinition> = [];
  loaded: boolean = false;
  lock: boolean = false;
  firebaseService: FirebaseService;
  json: string = "test";
  viewSettings: ViewSettings = new ViewSettings();
  infoModalMsg: string;
  userDisplayName: string;
  readOnlyRadar: string;
  showConfigureModal: boolean;
  showLegend:boolean;
  screenfull:any;

  constructor(private fService: FirebaseService, private zone: NgZone) {

    this.screenfull = window["screenfull"];
    this.viewSettings.readOnly = !fService.isAuth;
    this.uid = localStorage.getItem("uid");
    this.readOnlyRadar = localStorage.getItem("radar");
    this.workingCopyRadarDefinition = _.cloneDeep(TechRadar.prototype.proto);
    this.firebaseService = fService;
    fService.error.subscribe((err: any) => {
      this.infoModalMsg = err;
    });
    fService.userLogin.subscribe((displayName: string) => {
      this.userDisplayName = displayName;
    });
  }

  ngOnInit() {

    if (!this.uid)
      return;

    var l = this.firebaseService.getRadars(this.uid).subscribe(r => {
      l.unsubscribe();
      this.radars =
        _.map(r, i => {
          var obj = <RadarDefinition>JSON.parse(i.$value);
          obj.key = i.$key;
          return obj;
        });

      if (this.readOnlyRadar) {
        var index = this.radars.findIndex((x) => { return x.key == this.readOnlyRadar; });
        this.createRadar(this.radars[index]);
        this.radarDefinition = this.techRadar.radarDefinition;
      }
      else
        if (this.radars.length > 0) {
          this.createRadar(this.radars[0]);
          this.radarDefinition = this.techRadar.radarDefinition;
          //  this.configureClick(false);
        }



      this.loaded = true;
    });
  }

  getIcons() {
    return ["circle.svg", "star.svg", "rsquare.svg", "triangle.svg"];
  }

  selectShape(shapeName: string) {
    this.itemWorkingCopy.shape = shapeName;

  }

  editItem(item: RadarDataItemDef) {


    if(!item)
    {
      this.addItemClick();
      return;
    }

    this.newItemMode = 'edit';
    this.editingItem = item;

    this.itemWorkingCopy = _.cloneDeep(item);
    if (!this.itemWorkingCopy.shape) this.itemWorkingCopy.shape = 'circle.svg';
    this.zone.run(() => {
      document.getElementById('itemDetailsBtn').click();
    });

  }

  closeReadOnlyRadar() {
    localStorage.removeItem("uid");
    localStorage.removeItem("radar");
    this.readOnlyRadar = null;
    window.location.href = window.location.href;
  }

  shareClick() {
    this.infoModalMsg = window.location.href.replace('#', '') + '?radar=' + this.uid + '||' + this.radarDefinition.key;
  }

  addNewItem() {

    if (this.newItemMode == 'edit') {

      var oldName = this.editingItem.title;
      this.editingItem.title = this.itemWorkingCopy.title;
      this.editingItem.desc = this.itemWorkingCopy.desc;
      this.editingItem.size = this.itemWorkingCopy.size;
      this.editingItem.color = this.itemWorkingCopy.color;
      this.editingItem.history = this.itemWorkingCopy.history;
      this.editingItem.shape = this.itemWorkingCopy.shape;
      this.editingItem.alwaysShowTitle = this.itemWorkingCopy.alwaysShowTitle;
      this.techRadar.update();
      return;
    }
    
    let newItem = new RadarDataItemDef();
    newItem.x = 0;
    newItem.y = 0;
    newItem.title = this.itemWorkingCopy.title;
    newItem.desc = this.itemWorkingCopy.desc;
    newItem.size = this.itemWorkingCopy.size;
    newItem.color = this.itemWorkingCopy.color;
    newItem.shape = this.itemWorkingCopy.shape;
    newItem.alwaysShowTitle = this.itemWorkingCopy.alwaysShowTitle;

    var item = this.techRadar.add(newItem, newItem.x, newItem.y, null, true);
    this.techRadar.moveToSlice(this.techRadar.currentElem.x, this.techRadar.currentElem.y, item);
  }

  deleteItem()
  {
    this.techRadar.remove(this.editingItem);
  }

  changeRadar(radar) {
    this.showLegend = false;
    this.legendCache = null;
    this.radarDefinition = radar;
    this.createRadar(radar);
    
  }

  createRadar(radar: RadarDefinition, s: number = 1) {
    var self = this;
    
    this.zone.runOutsideAngular(function () {
      self.techRadar = new TechRadar(radar, s, self.viewSettings.readOnly);
    });



    this.techRadar.addUpdateListener(s => {
      this.legendCache = null;
      this.firebaseService.updateRadar(this.uid, s);
    });

    this.techRadar.editItem = (itm) => {
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
    this.legendCache = null;
    this.createRadar(this.radarDefinition);
    this.showConfigureModal = false;
  }

  addItemClick() {
    this.newItemMode = 'add';
    this.itemWorkingCopy = new RadarDataItemDef();
    this.zone.run(() => {
      document.getElementById('itemDetailsBtn').click();
    });
  }

  configureClick(isNew: boolean) {

    if (!isNew) {
      this.workingCopyRadarDefinition = JSON.parse(JSON.stringify(this.radarDefinition));
      this.resetPerc(this.workingCopyRadarDefinition.config.stages, true);
      this.resetPerc(this.workingCopyRadarDefinition.config.slices, true);
    }

    if (isNew) {

      this.workingCopyRadarDefinition = TechRadar.prototype.proto;
      this.workingCopyRadarDefinition.key = null;
      // this.workingCopyRadarDefinition.config.title = '';
      // this.workingCopyRadarDefinition.data = [];
    }
    this.showConfigureModal = true;
    eval("$('#configureModal').modal('show')");

  }

  resetPerc(arr: Array<ScalableItem>, onlyIfMoreThan100: boolean) {

    if (onlyIfMoreThan100) {
      let sum = 0;
      _.forEach(arr, (x) => sum += x.perc);
      if (sum < 100.5) {
        return;
      }
    }
    _.forEach(arr, (x) => x.perc = Math.round((100 / arr.length) * 100) / 100);
  }

  removeStage(stage: RadarStage) {
    this.workingCopyRadarDefinition.config.stages =
      _.remove(this.workingCopyRadarDefinition.config.stages, (x: RadarStage) => { return x.name !== stage.name; });

    this.resetPerc(this.workingCopyRadarDefinition.config.stages, false);
  }

  addStage() {
    let newStage = new RadarStage();
    newStage.name = "new stage " + (this.workingCopyRadarDefinition.config.stages.length + 1);
    newStage.id = _.max(_.map(this.workingCopyRadarDefinition.config.stages, function (e) { return e.id || 0; })) + 1;

    this.resetPerc(this.workingCopyRadarDefinition.config.stages, true);
  }

  removeHistoryItem(index: number) {
    this.itemWorkingCopy.history.splice(index, 1);
  }
  removeSlice(slice: RadarSlice) {


    _.remove(this.workingCopyRadarDefinition.config.slices, (x: RadarSlice) => { return x.id == slice.id; });

    _.remove(this.workingCopyRadarDefinition.data, (x: RadarDataItem) => { return x.sliceId == slice.id; });



    this.resetPerc(this.workingCopyRadarDefinition.config.slices, false);

  }

  addSlice() {
    var newId = _.max(_.map(this.workingCopyRadarDefinition.config.slices, function (e) { return e.id || 0; })) + 1;

    this.workingCopyRadarDefinition.config.slices.push(new RadarSlice({ id: newId, name: "new slice " + (this.workingCopyRadarDefinition.config.slices.length + 1) }));
    this.resetPerc(this.workingCopyRadarDefinition.config.slices, true);
  }

  trackByInd(ind) {
  }

  signOut() {
    localStorage.removeItem("uid");
    this.firebaseService.logout();
    window.location.href = window.location.href;
  }

  signedIn(uid) {
    this.uid = uid;
    window.location.href = window.location.href;
  }

  editClick() {
    this.viewSettings.readOnly = !this.viewSettings.readOnly;
    this.techRadar.readOnly = this.viewSettings.readOnly;
    this.techRadar.create(this.techRadar.size, this.techRadar.radarDefinition);
    //this.createRadar(this.radars[0]);

  }

  deleteClick() {


    this.firebaseService.deleteRadar(this.uid, this.radarDefinition);
    var svg = document.getElementById('radar');
    this.legendCache = null;
    this.showLegend = false;
    if (svg != null)
      svg.remove();
    this.ngOnInit();
  }

  fullScreenClick()
  {
  
    if (this.screenfull.enabled) 
    { this.screenfull.toggle(); };
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

  getSliceById(id: number) {

    return _.find(this.radarDefinition.config.slices, function (e: RadarSlice) { return e.id == id });
  }

  getStageById(id: number) {
    return _.find(this.radarDefinition.config.stages, function (e: RadarStage) { return e.id == id });
  }

  getSortedItems() {
    return _.forEach(_.sortBy(this.radarDefinition.data, function (c: any) {
      return c.slice;
    }));
  }

  getSortedItems2(data: RadarDataItemDef[]) {
    _.forEach(_.sortBy(data, function (c: RadarDataItemDef) {
      return this.radarDefinition.config.stages.length - _.findIndex(this.radarDefinition.config.stages, function (e: RadarStage) {
        return e.id == c.stageId;
      })
    }));
  }

  getRadarItems1(){return [];}
  
  legendCache: any;
  getRadarItems() {
    if (!this.radarDefinition || !this.radarDefinition.config.slices)
      return;

    if(this.legendCache)
    return this.legendCache;

    console.log('updating');
    var sliceMap = {};
    var stageMap = {};

    this.radarDefinition.config.slices.forEach(s => {
      sliceMap[s.id] = s;
    });
    this.radarDefinition.config.stages.forEach(s => {
      sliceMap[s.id] = s;
    });

    var slices = [];


    this.radarDefinition.config.slices.forEach(element => {

      var clone = <any>_.cloneDeep(element);

      clone.stages = [];

      this.radarDefinition.config.stages.forEach(e => {
        var stclone = <any>_.cloneDeep(e);
        stclone.elem = [];
        clone.stages.push(stclone);
      });

      slices.push(clone);

    });

    this.radarDefinition.data.forEach(element => {

      var s = _.find(slices, function (e: any) {
        return e.id == element.sliceId;
      });
      //  if(!s)return;

      element.data.forEach(el => {
        if (!s.stages) {
          
        }
        var g = _.find(s.stages, function (e: any) {
          return e.id == el.stageId;
        });
        var newEl = <any>_.cloneDeep(el);
        g.elem.push(newEl);
        var self = this;
        this.zone.runOutsideAngular(function()
        {
          var d = self.techRadar.loadSvgFromCache(newEl.shape || 'circle.svg').clone();
      
          if (d) {
            d.attr({
              fill: el.color,
              'fill-opacity': 1,
              stroke: "#FFFFFF",
              strokeWidth: 0.5,
            });
            d.transform('s0.9');
  
            newEl.svg =  d.node.outerHTML;
          }
          d.remove();
        });

      });

    });

    this.legendCache = slices;
    return slices;

  }

  ngAfterViewInit()
  {

  }



}
