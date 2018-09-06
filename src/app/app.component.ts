import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from './app.config';
import { AkromaClientService } from './providers/akroma-client.service';
import { AkromaLoggerService } from './providers/akroma-logger.service';
import { ElectronService } from './providers/electron.service';
import { ImportService } from './providers/import.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(
    private logger: AkromaLoggerService,
    public electronService: ElectronService,
    // tslint:disable-next-line
    private translate: TranslateService,
    private importService: ImportService,
    private akromaClientService: AkromaClientService) {

    translate.setDefaultLang('en');
    console.log('AppConfig', AppConfig);

    if (electronService.isElectron()) {
      console.log('Mode electron');
      console.log('Electron ipcRenderer', electronService.ipcRenderer);
      console.log('NodeJS childProcess', electronService.childProcess);
      this.logger.init(async cb => await this.akromaClientService.initialize(res => {
        logger.info('[os]: ' + electronService.os.platform);
        logger.info('[arch]: ' + electronService.os.arch);
        logger.info('[homedir]: ' + electronService.os.homedir);
        logger.info('[appPath]: ' + electronService.remote.app.getAppPath());
        logger.info('[userData]: ' + electronService.remote.app.getPath('userData'));
        logger.info('[locale]: ' + electronService.remote.app.getLocale());
        this.akromaClientService.downloadClient(success => {
          console.log('download client complete');
          if (success) {
            this.akromaClientService.startClient(async c => {
              console.log('start client complete');
              await this.importService.StartSync();
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
