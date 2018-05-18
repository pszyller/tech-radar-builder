import { Component, OnInit, Input } from '@angular/core';
import { RadarDefinition, RadarDataItemDef, RadarStage, RadarSlice, ScalableItem, ViewSettings, RadarDataItem } from '../radar/radar-definition';
import * as _ from "lodash";

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {


  @Input()
  customTitle: string;

  @Input()
  radarDefinition: RadarDefinition = new RadarDefinition();

  constructor() { }

  ngOnInit() {
    debugger;
  }

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
        // this.zone.runOutsideAngular(function()
        // {
        //   var d = self.techRadar.loadSvgFromCache(newEl.shape || 'circle.svg').clone();
      
        //   if (d) {
        //     d.attr({
        //       fill: el.color,
        //       'fill-opacity': 1,
        //       stroke: "#FFFFFF",
        //       strokeWidth: 0.5,
        //     });
        //     d.transform('s0.9');
  
        //     newEl.svg =  d.node.outerHTML;
        //   }
        //   d.remove();
        // });

      });

    });

    this.legendCache = slices;
    return slices;

  }

}
