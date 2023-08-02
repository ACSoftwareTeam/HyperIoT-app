import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {NgForm} from '@angular/forms';
import {HytModal, HytModalService} from 'components';
import {Subject} from 'rxjs';
import { AutoUpdateConfigStatus, ConfigModel } from '../../base/base-widget/model/widget.model';

@Component({
  selector: 'hyperiot-widget-settings-dialog',
  templateUrl: './widget-settings-dialog.component.html',
  styleUrls: ['./widget-settings-dialog.component.scss']
})
export class WidgetSettingsDialogComponent extends HytModal implements OnInit {

  modalApply: Subject<any> = new Subject();
  widget;
  widgetName;
  widgetId: string;
  areaId: string;
  @ViewChild('settingsForm', { static: false }) settingsForm: NgForm;

  dialogDataState = 0;

  modalIsOpen = false;

  autoUpdateConfigStatus: AutoUpdateConfigStatus = AutoUpdateConfigStatus.UNNECESSARY;

  constructor(
    hytModalService: HytModalService,
  ) {
    super(hytModalService);
  }

  ngOnInit() {
    this.widget = this.data.widget;
    this.widgetName = this.data.widget.name;
    this.widgetId = this.data.currentWidgetIdSetting;
    this.dialogDataState = 1;
    this.areaId = this.data.areaId;

    this.autoUpdateConfig();
  }

  // open modal
  open(): void {
    this.dialogDataState = 0;
    // super.open();
    this.modalIsOpen = true;
    this.dialogDataState = 1;
  }

  // close modal
  closeModal(event?): void {
    this.modalIsOpen = false;
    this.close(event);
  }

  getWidgetId() {
    return this.widgetId;
  }

  setWidget(w: any) {
    this.widget = w;
    this.widgetName = w.name;
  }

  confirm() {
    // common config options
    this.widget.name = this.widgetName;
    // signal 'apply' to widget specific config component
    this.modalApply.next('apply');
    // reconfigure widget instance with new values
    this.widget.instance.configure();
    // close dialog
    this.close('save');
  }

  private autoUpdateConfig() {
    try {
      const widgetConfig = this.widget.config as ConfigModel;
      if (widgetConfig && widgetConfig.packetUnitsConversion && widgetConfig.packetUnitsConversion.length > 0) {
        widgetConfig.fieldUnitConversions =  { };
        widgetConfig.packetUnitsConversion.forEach(element => {
          widgetConfig.fieldUnitConversions[element.field.id] = {
            convertFrom: element.convertFrom,
            convertTo: element.convertTo,
            decimals: element.decimals,
            options: element.options,
            conversionCustomLabel: element.conversionCustomLabel,
          }
        });
        delete widgetConfig.packetUnitsConversion;
        this.autoUpdateConfigStatus = AutoUpdateConfigStatus.SUCCESS;
      } else {
        this.autoUpdateConfigStatus = AutoUpdateConfigStatus.UNNECESSARY;
      }
    } catch(error) {
      this.autoUpdateConfigStatus = AutoUpdateConfigStatus.ERROR;
    }
  }

}
