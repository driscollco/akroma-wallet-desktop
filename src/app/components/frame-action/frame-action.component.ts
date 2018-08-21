import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../../providers/electron.service';

@Component({
  selector: 'app-frame-action',
  templateUrl: './frame-action.component.html',
  styleUrls: ['./frame-action.component.scss']
})
export class FrameActionComponent implements OnInit {

  constructor(private es:ElectronService) { }

  ngOnInit() {
  }

  
  close(){

    window.close()
  }
  
  max(){
    
    this.es.ipcRenderer.send(`max`,`max`)  
    
  }


  min(){
    
    this.es.ipcRenderer.send(`min`,`min`)  
    
  }
}