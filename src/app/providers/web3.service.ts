import { Injectable } from '@angular/core';
import { clientConstants } from './akroma-client.constants';
import { ElectronService } from './electron.service';
import { SettingsService } from './settings.service';

declare var require: any;
const Web3 = require('web3');

/**
 * Web3Service is the single abstraction on top of web3
 */

@Injectable()
export class Web3Service extends (Web3 as { new(): any; }) {
    // blockchain syncing
    public blockNumber: number;
    public connected: boolean;
    public syncing: boolean;
    public peerCount: number;
    public intervals: NodeJS.Timer[];
    public constructor(private settingsService: SettingsService,
        private electronService: ElectronService) {
        super();
        // TODO: define way to allow for remote providers (internalize account creation)
        this.setProvider(new this.providers.HttpProvider(clientConstants.connection.default));
        this.intervals = [];
        this.intervals.push(
            setInterval(() => {
                this.eth.getBlockNumber()
                    .then(s => { this.blockNumber = s; })
                    .catch(console.error);
                this.eth.net.isListening()
                    .then(s => { this.connected = s; })
                    .catch(console.error);
                this.eth.isSyncing()
                    .then(s => { this.syncing = s; })
                    .catch(console.error);
                this.eth.net.getPeerCount()
                    .then(s => { this.peerCount = s; })
                    .catch(console.error);
            }, 5000));
    }

    public async getBalance(address: string): Promise<number> {
        const walletBalance = await this.eth.getBalance(address);
        const akaBalance = this.utils.fromWei(walletBalance, 'ether');
        console.log(`Balance: ${akaBalance}`);
        return akaBalance;
    }

    public connectIpc() {
        // TODO: should this be a subscription?
        this.settingsService.getSettings().then(s => {
            this.setProvider(this.providers.IpcProvider(`${s.clientPath}/data/geth.ipc`, this.electronService.net));
        });
    }
}
