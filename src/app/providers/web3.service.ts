import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { SettingsStorageService } from './settings-storage.service';

declare var require: any;
const Web3 = require('web3');

@Injectable()
export class Web3Service extends ( Web3 as { new(): any; }  ) {

    constructor(private settingsService: SettingsStorageService,
                private electronService: ElectronService) {
        super();
    }

    connectIpc() {
        this.settingsService.db.get('system').then(doc => {
            this.setProvider(this.providers.IpcProvider(`${doc.clientPath}/data/geth.ipc`, this.electronService.net));
        });
    }
}
