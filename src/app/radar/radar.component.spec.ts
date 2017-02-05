/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { RadarComponent } from './radar.component';

describe('RadarComponent', () => {
  let component: RadarComponent;
  let fixture: ComponentFixture<RadarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RadarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RadarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
