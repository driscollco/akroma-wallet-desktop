import { Component, OnInit } from '@angular/core';
import { SystemSettings } from '../../models/system-settings';
import { ElectronService } from '../../providers/electron.service';
import { SettingsService } from '../../providers/settings.service';
import { TransactionService } from '../../providers/transaction.service';
import { Web3Service } from '../../providers/web3.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  public settings: SystemSettings;
  public web3: Web3Service;

  constructor(
    private electronService: ElectronService,
    private settingsService: SettingsService,
    public web3Service: Web3Service,
    public transactionService: TransactionService,
  ) {
  }

  ngOnInit() {
    this.settingsService.settings
      .subscribe(settings => this.settings = settings);
  }

  viewLogs() {
    // this.electronService.remote.shell.showItemInFolder(this._settings.applicationPath + this.electronService.path.sep + 'logs' + this.electronService.path.sep + 'akroma.log');
    console.log('logs.');
  }

  console() {
    console.log(`devTools`);
    this.electronService.ipcRenderer.send(`console`, `console`);
  }
}
