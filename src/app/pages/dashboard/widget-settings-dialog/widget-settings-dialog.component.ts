import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HytModal, HytModalService } from '@hyperiot/components';
import { Subject } from 'rxjs';

@Component({
  selector: 'hyt-widget-settings-dialog',
  templateUrl: './widget-settings-dialog.component.html',
  styleUrls: ['./widget-settings-dialog.component.scss']
})
export class WidgetSettingsDialogComponent extends HytModal implements OnInit {

  modalApply: Subject<any> = new Subject();
  widget;
  widgetName;
  widgetId: string;
  areaId: string;
  @ViewChild(NgForm, { static: true }) settingsForm: NgForm;

  dialogDataState = 0;

  modalIsOpen = false;

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
    // this.close($event);

    // this.modalClose.emit($event);
    this.close('save');
  }

  // dismiss(e: any) {
  //   if (e.target === this.viewContainer.nativeElement) {
  //     // this.close(e);
  //     this.close();
  //   }
  // }

  // open() {
  //   // TODO: init stuff goes here
  // }

  // close($event?) {
  //   this.router.navigate(
  //     ['../', { outlets: { modal: null } }],
  //     { relativeTo: this.activatedRoute }
  //   );
  //   this.modalClose.emit($event);
  // }
}
