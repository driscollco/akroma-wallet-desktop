import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../../providers/electron.service';
@Component({
  selector: 'app-frame-action',
  templateUrl: './frame-action.component.html',
  styleUrls: ['./frame-action.component.scss'],
})
export class FrameActionComponent implements OnInit {

  public constructor(private es: ElectronService) { }

  public ngOnInit() {
  }

  public close() {
    window.close();
  }

  public max() {
    this.es.ipcRenderer.send(`max`, `max`);
  }

  public min() {
    this.es.ipcRenderer.send(`min`, `min`);
  }
}
