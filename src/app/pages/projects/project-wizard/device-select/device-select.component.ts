import { Component, OnChanges, Input, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { HDevice } from 'core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SelectOption } from 'components';

@Component({
  selector: 'hyt-device-select',
  templateUrl: './device-select.component.html',
  styleUrls: ['./device-select.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DeviceSelectComponent implements OnChanges {

  @Input() hDevices: HDevice[];

  selectForm: FormGroup;

  devicesOptions: SelectOption[] = [];

  @Output() selectedDevice = new EventEmitter<HDevice>();

  constructor(
    private fb: FormBuilder
  ) {
    this.selectForm = this.fb.group({});
  }

  ngOnChanges(): void {
    this.devicesOptions = [];
    this.hDevices.forEach(device => {
      this.devicesOptions.push({
        value: device,
        label: device.deviceName
      });
    });
    this.autoSelect();
  }

  getSelectedDevice():string {
    const deviceSelected = this.selectForm.get('selectDevice').value;
    return deviceSelected.deviceName;
  }

  deviceChanged(event): void {
    this.selectedDevice.emit(event.value);
    this.selectForm.patchValue({ selectDevice: event.value }); //force UI with patch value
  }

  /**
   * Sets a value to selected based on previous value or deafults to the first element 
   */
  autoSelect(): void {
    if (this.devicesOptions.length !== 0) {
      if (this.selectForm.get('selectDevice').value) {
        const option = this.devicesOptions.find(option => option.label === this.selectForm.get('selectDevice').value.deviceName);
        this.deviceChanged(option);
      } else {
        this.selectForm.get('selectDevice').setValue(this.devicesOptions[0].value);
        this.deviceChanged(this.devicesOptions[0]);
      }
    } else {
      this.selectedDevice.emit(null);
    }
  }

  selectSpecific(deviceId: number): void {
    const so: SelectOption = this.devicesOptions.find(x => x.value.id === deviceId);
    this.selectForm.get('selectDevice').setValue(so.value);
    this.deviceChanged(so);
  }

  freezeSelection() {
    this.selectForm.get('selectDevice').disable();
  }

  unfreezeSelection() {
    this.selectForm.get('selectDevice').enable();
  }

}
