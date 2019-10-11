import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetSettingsDialogComponent } from './widget-settings-dialog.component';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';

describe('WidgetSettingsDialogComponent', () => {
  let component: WidgetSettingsDialogComponent;
  let fixture: ComponentFixture<WidgetSettingsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetSettingsDialogComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetSettingsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
