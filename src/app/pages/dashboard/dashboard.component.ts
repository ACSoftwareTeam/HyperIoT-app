import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild } from '@angular/core';
import { DashboardConfigService } from './dashboard-config.service';
import { takeUntil } from 'rxjs/operators';
import { Subject, forkJoin } from 'rxjs';
import { Dashboard, HProject } from '@hyperiot/core';
import { SelectOption } from '@hyperiot/components';
import { RouterLink, Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { WidgetsLayoutComponent } from './widgets-layout/widgets-layout.component';
import { DashboardViewComponent } from './dashboard-view/dashboard-view.component';
import { AddWidgetDialogComponent } from './add-widget-dialog/add-widget-dialog.component';
import { WidgetSettingsDialogComponent } from './widget-settings-dialog/widget-settings-dialog.component';
import { HytModalConfService } from 'src/app/services/hyt-modal-conf.service';

enum PageStatus {
  Loading = 0,
  Standard = 1,
  New = 2,
  Error = -1
}

interface HytSelectOption extends HProject {
  label: string;
  value?: number;
}

@Component({
  selector: 'hyt-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(DashboardViewComponent, { static: false })
  dashboardView: DashboardViewComponent;

  /** Subject for manage the open subscriptions */
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  dashboardList: Dashboard[] = [];

  hProjectList: HProject[] = [];

  hProjectListOptions: HytSelectOption[] = [];

  PageStatus = PageStatus;

  pageStatus: PageStatus = PageStatus.Loading;

  signalIsOn = true;

  streamIsOn = true;

  dataRecordingIsOn = false;

  idProjectSelected: number;

  currentDashboardId: number;

  currentDashboard: Dashboard;

  currentDashboardType: Dashboard.DashboardTypeEnum;

  recordReloading = false;

  updateRecordingInterval;

  constructor(
    private dashboardConfigService: DashboardConfigService,
    private route: Router,
    private hytModalService: HytModalConfService
  ) {

  }

  ngOnInit() {

    // if(localStorage.getItem("DASHBOARDTOSAVE")){
    //   let toSave = localStorage.getItem("DASHBOARDTOSAVE");
    //   localStorage.removeItem("DASHBOARDTOSAVE");
    //   let idToSave = toSave.split("_")[0];
    //   toSave = JSON.parse(toSave);
    //   this.dashboardConfigService.putConfig(+idToSave, toSave);
    // }

    this.dashboardConfigService.getProjectsList()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        res => {
          try {
            this.hProjectList = [...res];
            this.hProjectListOptions = this.hProjectList as HytSelectOption[];
            this.hProjectListOptions.forEach(element => {
              element.label = element.name;
              element.value = element.id;
            });

            this.hProjectListOptions.sort((a, b) => {
              if (a.entityModifyDate > b.entityModifyDate) { return -1; }
              if (a.entityModifyDate < b.entityModifyDate) { return 1; }
              return 0;
            });

            if (this.hProjectListOptions.length > 0) {
              this.idProjectSelected = this.hProjectListOptions[0].id;

              this.updateToplogyStatus();
              this.updateRecordingInterval = setInterval(() => {
                this.updateToplogyStatus();
              }, 60000);

              this.dashboardConfigService.getRealtimeDashboardFromProject(this.idProjectSelected)
                .pipe(takeUntil(this.ngUnsubscribe))
                .subscribe(
                  (dashboardRes: Dashboard[]) => {
                    try {
                      this.currentDashboard = dashboardRes[0];
                      this.currentDashboardId = this.currentDashboard.id;
                      this.pageStatus = PageStatus.Standard;
                    } catch (error) {
                      console.error(error);
                      this.pageStatus = PageStatus.New;
                    }
                  },
                  error => {
                    console.error(error);
                    this.pageStatus = PageStatus.New;
                  }
                );
            } else {
              this.pageStatus = PageStatus.New;
            }

          } catch (error) {
            console.error(error);
            this.pageStatus = PageStatus.Error;
          }

        },
        error => {
          this.pageStatus = PageStatus.Error;
        }

      );

  }

  ngOnDestroy() {
    if (this.updateRecordingInterval) {
      clearInterval(this.updateRecordingInterval);
    }

    if (this.ngUnsubscribe) {
      this.ngUnsubscribe.next();
    }
  }

  updateToplogyStatus() {
    if (!this.recordReloading) {
      this.dashboardConfigService.getRecordingStatus(this.idProjectSelected)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(
          res => {
            if (res != null && res != undefined && res.status.toLowerCase() === 'active') {
              this.dataRecordingIsOn = true;
            } else {
              this.dataRecordingIsOn = false;
            }
          },
          error => {
            this.dataRecordingIsOn = false;
            console.error(error);
          }
        );
    }
  }

  onSelectChange(event) {
    this.pageStatus = PageStatus.Loading;
    this.idProjectSelected = event.value;
    this.dashboardConfigService.getRealtimeDashboardFromProject(event.value)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (res: Dashboard[]) => {
          try {
            this.currentDashboard = res[0];
            this.currentDashboardId = this.currentDashboard.id;
            this.pageStatus = PageStatus.Standard;
          } catch (error) {
            this.pageStatus = PageStatus.New;
          }
        },
        error => {
          this.pageStatus = PageStatus.New;
        }
      );
  }

  changeSignalState(event) {
    if (this.signalIsOn) {
      this.signalIsOn = !this.signalIsOn;
      this.pageStatus = PageStatus.Loading;
      this.dashboardConfigService.getOfflineDashboardFromProject(this.idProjectSelected)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(
          (res: Dashboard[]) => {
            this.currentDashboard = res[0];
            this.currentDashboardId = this.currentDashboard.id;
            this.pageStatus = PageStatus.Standard;
          },
          error => {
            this.pageStatus = PageStatus.New;
          }
        );
    } else {
      this.signalIsOn = !this.signalIsOn;
      this.pageStatus = PageStatus.Loading;
      this.dashboardConfigService.getRealtimeDashboardFromProject(this.idProjectSelected)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(
          (res: Dashboard[]) => {
            try {
              this.currentDashboard = res[0];
              this.currentDashboardId = this.currentDashboard.id;
              this.pageStatus = PageStatus.Standard;
            } catch (error) {
              this.pageStatus = PageStatus.New;
            }
          },
          error => {
            this.pageStatus = PageStatus.New;
          }
        );
    }
  }

  changeStreamState(event) {
    this.streamIsOn = !this.streamIsOn;
  }

  changeRecordingState(event) {

    if (event === true) {

      if (this.dataRecordingIsOn) {
        this.dashboardConfigService.postRecordingStateOff(this.idProjectSelected)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe(
            res => {
              this.dataRecordingIsOn = !this.dataRecordingIsOn;
            },
            error => {
              console.error(error);
            }
          );
      } else {
        this.dashboardConfigService.postRecordingStateOn(this.idProjectSelected)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe(
            res => {

              this.dataRecordingIsOn = !this.dataRecordingIsOn;
            },
            error => {
              console.error(error);
            }
          );
      }

    }
  }

  infoRecordingState(event) {
    if (event === true) {
      this.openModal('hyt-modal-recording-confirm-action');
    }
  }

  reloadRecording(event) {
    if (event === true) {
      this.recordReloading = true;

      setTimeout(() => {
        this.recordReloading = false;
      }, 1000);
    }
  }

  saveDashboard() {
    this.dashboardView.saveDashboard();
  }

  // addWidget() {
  //   this.dashboardView.navigateToAddWidget();
  // }

  openRecordingActionModal() {
    if (!this.recordReloading) {
      if (this.dataRecordingIsOn) {
        this.hytModalService.open('hyt-modal-recording-info-action');
      } else {
        this.hytModalService.open('hyt-modal-recording-confirm-action');
      }
    }
  }

  openModal(id: string) {
    this.hytModalService.open(id);
  }

  closeModal(id: string) {
    this.hytModalService.close(id);
  }

  /************************************************************************************************************* Not used */

  createDashboard(idProject: number) {

    const dashboard: Dashboard = {
      dashboardType: 'REALTIME',
      entityVersion: 1,
      hproject: this.hProjectList.find(x => (x.id === idProject)),
      // name: this.hProjectList.find(x => (x.id == idProject)).name
    };

    // this.dashboardConfigService.saveDashboard(dashboard)
    // console.log(dashboard)

  }

  getAllDashboardAndProjects() {
    this.dashboardConfigService.getAllDashboardsAndProjects()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        ([res1, res2]) => {
          try {
            this.hProjectList = [...res1];
            this.hProjectListOptions = this.hProjectList as HytSelectOption[];
            this.hProjectListOptions.forEach(element => {
              element.label = element.name;
              element.value = element.id;
            });
          } catch (error) {
            this.pageStatus = PageStatus.Error;
          }

          try {
            this.dashboardList = [...res2];
          } catch (error) { }

        },
        error => {
          this.pageStatus = PageStatus.Error;
        },
        () => {

          this.hProjectListOptions.sort((a, b) => {
            if (a.entityModifyDate > b.entityModifyDate) { return -1; }
            if (a.entityModifyDate < b.entityModifyDate) { return 1; }
            return 0;
          });
          // console.log(this.hProjectListOptions)

          this.dashboardList.sort((a, b) => {
            if (a.entityModifyDate > b.entityModifyDate) { return -1; }
            if (a.entityModifyDate < b.entityModifyDate) { return 1; }
            return 0;
          });

          // console.log(this.dashboardList)

          if (this.dashboardList.length > 0 && this.hProjectListOptions.length > 0) {

            try {
              this.idProjectSelected = this.hProjectListOptions.find(x => (x.id === this.dashboardList[0].hproject.id)).value;
              this.currentDashboardId = this.dashboardList[0].id;
            } catch (error) {

            }
            this.pageStatus = PageStatus.Standard;
            // console.log(this.idProjectSelected)

          } else if (this.dashboardList.length === 0 && this.hProjectListOptions.length > 0) {

            this.idProjectSelected = this.hProjectListOptions[0].value;
            this.currentDashboardId = this.idProjectSelected[0].id;

            this.pageStatus = PageStatus.New;
          } else {
            this.pageStatus = PageStatus.Error;
          }

        }
      );
  }

}
