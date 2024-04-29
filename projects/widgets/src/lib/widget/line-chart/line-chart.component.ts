import { Component, Injector, OnInit, Optional } from '@angular/core';
import { DataChannel, DataPacketFilter, Logger, LoggerService, PacketData } from 'core';
import { PlotlyService } from 'angular-plotly.js';
import { BehaviorSubject, Subscription, asyncScheduler, bufferTime, filter, map } from 'rxjs';

import { BaseChartComponent } from '../../base/base-chart/base-chart.component';
import { WidgetAction } from '../../base/base-widget/model/widget.model';
import { TimeSeries } from '../../data/time-series';
import { ServiceType } from '../../service/model/service-type';

@Component({
  selector: 'hyperiot-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['../../../../../../src/assets/widgets/styles/widget-commons.css', './line-chart.component.css'],
})
export class LineChartComponent
  extends BaseChartComponent
  implements OnInit
{
  lowerBound = 0;
  sideMarginGap = 0.12;
  totalLength = 0;
  fieldsName: any[] = [];

  dataChannel: DataChannel;
  dataSubscription: Subscription;
  offControllerSubscription: Subscription;

  lastRequestedDate: Date;
  lastOfflineDate: Date;
  loadingOfflineData = false;

  allData: PacketData[] = [];

  protected logger: Logger; 

  constructor(
    injector: Injector, 
    @Optional() public plotly: PlotlyService,
    protected loggerService: LoggerService) {
    super(injector, plotly, loggerService);
    this.logger = new Logger(this.loggerService);
    this.logger.registerClass(LineChartComponent.name);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.configure();
    
    (
      this.dataService["rangeSelectionDataAlreadyLoaded"] as BehaviorSubject<number>
    ).subscribe((res) => {
      if (res) this.loadingOfflineData = false;
    });
  }

  configure() {
    this.graph.layout = {};
    this.graph.data = [];
    super.removeSubscriptionsAndDataChannels();
    if (!this.serviceType) {
      this.logger.error('TYPE SERVICE UNDEFINED');
      return;
    }

    super.configure();

    if (
      !(
        this.widget.config != null &&
        this.widget.config.packetId != null &&
        this.widget.config.packetFields != null &&
        Object.keys(this.widget.config.packetFields).length > 0
      )
    ) {
      this.isConfigured = false;
      return;
    }
    this.isConfigured = true;

    // scheduling chart initialization because of chart size
    asyncScheduler.schedule(() => {
      this.setTimeSeries();
      this.setTimeChartLayout();
    });
  }

  subscribeAndInit() {
    this.subscribeDataChannel();
    this.computePacketData(this.initData);
    const resizeObserver = new ResizeObserver((entries) => {
      const graph = this.plotly.getInstanceByDivId(`widget-${this.widget.id}${this.isToolbarVisible}`);
      if (graph) {
        this.plotly.resize(graph);
      }
    });
    resizeObserver.observe(document.querySelector(`#widget-${this.widget.id}${this.isToolbarVisible}`));
  }

  subscribeDataChannel() {

    const dataPacketFilter = new DataPacketFilter(
      this.widget.config.packetId,
      this.widget.config.packetFields,
      true
    );
    this.dataChannel = this.dataService.addDataChannel(
      +this.widget.id,
      [dataPacketFilter]
    );
    this.dataSubscription = this.dataChannel.subject
      .pipe(
        map(dataChunk => dataChunk.data),
        bufferTime(this.widget.config.refreshIntervalMillis || 0),
        filter((data) => data.length !== 0),
        map(data => [].concat.apply([], data))
      )
      .subscribe((eventData) => this.computePacketData(eventData));
    if (this.serviceType === ServiceType.OFFLINE) {
      this.offControllerSubscription = this.dataChannel.controller.$totalCount.subscribe((res) => {
        this.totalLength = res;
        this.allData = [];
        this.graph.data.forEach(tsd=> {
          tsd.x = [],
          tsd.y = []
        });
        if (res !== 0) {
          this.dataRequest();
        }
      });
    }

  }

  computePacketData(packetData: PacketData[]) {
    super.computePacketData(packetData);

    if (packetData.length === 0) {
      return;
    }
    this.allData = this.allData.concat(packetData);

    packetData.forEach((datum) => {
      if (
        new Date(datum.timestamp) >
          this.lastOfflineDate ||
        !this.lastOfflineDate
      ) {
        this.lastOfflineDate = new Date(
          datum.timestamp
        );
      }
      this.convertAndBufferData(datum);
    });
    this.renderBufferedData();
    this.loadingOfflineData = false;
    if (this.serviceType === ServiceType.OFFLINE) {
      this.lowerBound++;
      this.updateDataRequest();
    }
  }

  setTimeChartLayout() {
    this.chartData.forEach((timeSeries, i) => {
      const fieldName = timeSeries.name;
      const a = i + 1;
      if (a === 1) {
        this.graph.layout[`yaxis`] = {
          title: fieldName,
          domain: [0.15, 0.85],
          // showline: true
        };
      } else {
        this.graph.layout[`yaxis${a}`] = {
          title: fieldName,
          autorange: true,
          anchor: 'free',
          overlaying: 'y',
          side: 'right',
          position: 1 - i * this.sideMarginGap,
          // showline: true,
        };

      }

      const tsd = {
        name: fieldName,
        x: [],
        y: [],
        yaxis: 'y' + (i + 1),
        type: ''
      };
      Object.assign(tsd, this.defaultSeriesConfig);
      this.graph.data.push(tsd);
    });
    this.graph.layout.showlegend = true;
    this.graph.layout.legend = {
      orientation: 'h',
      x: 0.25,
      y: 1,
      traceorder: 'normal',
      font: {
        family: 'sans-serif',
        size: 10,
        color: '#000',
      },
      bgcolor: '#FFFFFF85',
      borderwidth: 0,
    };

    this.graph.layout.font = {
      size: 9,
    };
    this.graph.layout.title = null;
    this.graph.layout.dragmode = 'pan';
    this.graph.layout.responsive = true;
    this.graph.layout.autosize = true;
    this.graph.layout.margin = {
      l: 24,
      r: 24,
      b: 0,
      t: 0,
      pad: 0,
    };
    this.graph.layout.xaxis = {
      type: 'date',
      showgrid: false,
      range: [],
    };
  }

  setTimeSeries(): void {
    this.chartData = [];
    Object.keys(this.widget.config.packetFields).forEach((fieldId) => {
      this.chartData.push(
        new TimeSeries(this.widget.config.packetFields[fieldId])
      );
    });
  }
  async renderBufferedData() {
    const Plotly = await this.plotly.getPlotly();
    const graph = this.plotly.getInstanceByDivId(`widget-${this.widget.id}${this.isToolbarVisible}`); // TODO change isToolbarVisible
    if (graph) {
      if (this.serviceType === ServiceType.OFFLINE) {
        graph.on('plotly_relayout', (eventdata) => {
          if (eventdata['xaxis.range[1]']) {
            this.lastRequestedDate = new Date(eventdata['xaxis.range[1]']);
            this.updateDataRequest();
          }
        });
      }
      this.renderAllSeriesData(this.chartData, Plotly, graph, this.isPaused);
    }
  }

  convertAndBufferData(ed: PacketData) {
    Object.keys(ed).forEach((k) => {
      if (k !== 'timestamp') {
        if (this.chartData.some((x) => x.name === k)) {
          this.bufferData(
            this.chartData.find((x) => x.name === k),
            ed.timestamp,
            ed[k]
          );
        }
      }
    });
  }

  // OFFLINE
  dataRequest() {
    console.warn(this);
    if (this.loadingOfflineData || this.dataService['rangeSelectionDataAlreadyLoaded'].value) {
      return;
    }
    this.loadingOfflineData = true;

    this.dataService.loadNextData(this.widget.id);
  }

  isLoadingData(){
    if(this.dataService['rangeSelectionDataAlreadyLoaded'].value){
      return false;
    }
    return this.loadingOfflineData;
  }

  noRangeSelected(){
    // return false;
    return this.dataChannel && !this.dataChannel.controller.channelLowerBound;
  }

  updateDataRequest() {
    if (
      !this.lastRequestedDate ||
      !this.lastOfflineDate ||
      this.lastRequestedDate <= this.lastOfflineDate
    ) {
      return;
    }
    this.dataRequest();
  }

  play(): void {
    this.dataChannel.controller.play();
  }

  pause(): void {
    this.dataChannel.controller.pause();
  }

  onToolbarAction(action: string) {
    const widgetAction: WidgetAction = { widget: this.widget, action };
    switch (action) {
      case 'toolbar:play':
        this.play();
        break;
      case 'toolbar:pause':
        this.pause();
        break;
      case 'toolbar:fullscreen':
        widgetAction.value = this.allData;
        break;
    }

    this.widgetAction.emit(widgetAction);
  }
}