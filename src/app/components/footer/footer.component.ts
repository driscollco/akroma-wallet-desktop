import { Component, OnInit } from '@angular/core';
import { SystemSettings } from '../../models/system-settings';
import { ElectronService } from '../../providers/electron.service';
import { ImportService } from '../../providers/import.service';
import { SettingsPersistenceService } from '../../providers/settings-persistence.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  private settings: SystemSettings;

  constructor(
    private electronService: ElectronService,
    private settingsService: SettingsPersistenceService,
    public importService: ImportService,
  ) { }

  async ngOnInit() {
    try {
      this.settings = await this.settingsService.db.get('system');
    } catch {
      this.settings = await this.settingsService.defaultSettings();
    }
    // setInterval(() => {
    //   this.blockNumber = this.importService.blockNumber;
    //   this.listening = this.importService.connected;
    //   this.peerCount = this.importService.peerCount;
    //   this.importStatus = this.importService.status;
    // }, 1000);
  }

  viewLogs() {
    this.electronService.remote.shell.showItemInFolder(this.settings.applicationPath + this.electronService.path.sep + 'logs' + this.electronService.path.sep + 'akroma.log');
  }

  console() {
    console.log(`devTools`);
    this.electronService.ipcRenderer.send(`console`, `console`);
  }
}
