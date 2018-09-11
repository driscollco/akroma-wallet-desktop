import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from './app.config';
import { AkromaClientService } from './providers/akroma-client.service';
import { ElectronService } from './providers/electron.service';
import { LoggerService } from './providers/logger.service';
import { SettingsService } from './providers/settings.service';
import { TransactionSyncService } from './providers/transaction.sync.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public constructor(
    private logger: LoggerService,
    public electronService: ElectronService,
    // tslint:disable-next-line
    private translate: TranslateService,
    private settingsService: SettingsService,
    private syncSQLService: TransactionSyncService,
    private akromaClientService: AkromaClientService) {

    translate.setDefaultLang('en');
    console.log('AppConfig', AppConfig);

    if (electronService.isElectron()) {
      console.log('Mode electron');
      console.log('Electron ipcRenderer', electronService.ipcRenderer);
      console.log('NodeJS childProcess', electronService.childProcess);
      this.logger.init(cb => this.akromaClientService.initialize(res => {
        logger.info('[os]: ' + electronService.os.platform);
        logger.info('[arch]: ' + electronService.os.arch);
        logger.info('[homedir]: ' + electronService.os.homedir);
        logger.info('[appPath]: ' + electronService.remote.app.getAppPath());
        logger.info('[userData]: ' + electronService.remote.app.getPath('userData'));
        logger.info('[locale]: ' + electronService.remote.app.getLocale());
        this.akromaClientService.downloadClient(success => {
          if (success) {
            this.akromaClientService.startClient(c => {
              this.settingsService.getSettings()
                .then(settings => {
                  if (settings.transactionSource === 'local') {
                    console.log('using local source for transactions.');
                    this.syncSQLService.startSync();
                  } else {
                    console.log('using remote source for transactions.');
                  }
                });
            });
          }
        });
      }),
      );
    } else {
      console.log('Mode web');
    }
  }
}
