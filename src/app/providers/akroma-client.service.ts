import { Injectable } from '@angular/core';
import { ChildProcess } from 'child_process';
import * as request from 'request';
import { clientConstants } from './akroma-client.constants';
import { ElectronService } from './electron.service';
import { SettingsService } from './settings.service';
import { Web3Service } from './web3.service';
import { LoggerService } from './logger.service';
import { Subscription } from 'rxjs';
import { SystemSettings } from '../models/system-settings';



export const statusConstants = {
  DOWNLOADING: 'downloading',
  RUNNING: 'running',
  STOPPED: 'stopped',
  SYNCING: 'syncing',
  SYNCED: 'synced',
};

@Injectable()
export class AkromaClientService {
  private client: any; // TODO create model
  private clientPath: string;
  private clientBin: string;
  private syncMode: string;
  private _status: string;
  private settingsSub: Subscription;
  private _process: ChildProcess;
  private settings: SystemSettings;
  get clientProcess(): ChildProcess {
    return this._process;
  }
  get status(): string {
    return this._status;
  }

  constructor(
    private logger: LoggerService,
    private es: ElectronService,
    private settingsService: SettingsService,
    private web3: Web3Service) {
    this.web3.setProvider(new this.web3.providers.HttpProvider(clientConstants.connection.default));
  }

  // This is called first. Then download is called (as the callback)
  initialize(callback: Function) {
    this.client = clientConstants.clients.akroma.platforms[this.es.os.platform()][this.es.os.arch()];
    this.settingsSub = this.settingsService.settings
      .subscribe(settings => {
        this.settings = settings;
        this.logger.info('[settings]: ' + JSON.stringify(settings));
        this.logger.info('[clientPath]: ' + settings.clientPath);
        this.logger.info('[clientBin]: ' + this.client.bin);
        this.logger.info('[transactionSource]: ' + settings.transactionSource);
        this.clientPath = settings.clientPath;
        this.clientBin = this.client.bin;
        this.syncMode = settings.syncMode;
        callback();
      });
    // this.web3.setProvider(new this.web3.providers.HttpProvider(settings.akromaNode));
  }

  // Called as called back from initialize, then startClient is called (as the callback)
  downloadClient(callback?: Function): void {
    if (this.akromaClientExists()) {
      callback(true);
    }

    this._status = statusConstants.DOWNLOADING;
    const url = this.client.download.url;
    const req = request(url);

    // tslint:disable-next-line:no-console
    this.logger.debug('[Downloading Akroma client...]');
    if (this.es.fs.existsSync(this.clientPath) === false) {
      this.logger.debug('Client does not exist, making directory: ' + this.clientPath);
      this.es.fs.mkdirSync(this.clientPath);
    }

    req.on('response', (response) => {
      response.pipe(this.es.fs.createWriteStream(this.clientPath + this.es.path.sep + this.clientBin));
    });

    req.on('end', () => {
      if (this.es.os.platform().toString() !== 'win32') {
        this.es.fs.chmod(this.clientPath + this.es.path.sep + this.clientBin, this.es.fs.constants.S_IRWXU, err => {
          if (err) {
            callback(false, 'Akroma client could not be created as executable');
          }
          callback(true);
        });
      }
      callback(true);
    });
  }

  startClient(callback?: Function) {
    this.web3.eth.net.isListening()
      .then(x => {
        this._status = statusConstants.RUNNING;
        console.log('using running akroma');
        callback(true);
      })
      .catch(error => {
        this.logger.debug('[Starting Akroma client...]');
        const program = this.clientPath + this.es.path.sep + this.clientBin;
        const dataDir = this.clientPath + this.es.path.sep + 'data';

        this.logger.info('[program]: ' + program);
        this.logger.info('[dataDir]: ' + dataDir);
        const clientProcess = this.es.childProcess.spawn(program, [
          '--datadir', dataDir,
          '--syncmode', this.syncMode,
          '--cache', '1024',
          '--rpc',
          '--rpccorsdomain', '*',
          '--rpcport', '8545',
          '--rpcapi', 'eth,web3,admin,net,personal,db',
        ], { stdio: 'ignore' });
        this._process = clientProcess;
        this.es.ipcRenderer.send('client:start', this.clientProcess.pid);
        this._status = statusConstants.RUNNING;
        callback(true);
      });

    // try {
    //   const listening = await this.web3.eth.net.isListening();
    //   if (listening) {
    //     this._status = statusConstants.RUNNING;
    //     console.log('using running akroma');
    //     callback(true);
    //   }
    // } catch {
    //   this.logger.debug('[Starting Akroma client...]');
    //   const program = this.clientPath + this.es.path.sep + this.clientBin;
    //   const dataDir = this.clientPath + this.es.path.sep + 'data';

    //   this.logger.info('[program]: ' + program);
    //   this.logger.info('[dataDir]: ' + dataDir);
    //   const clientProcess = this.es.childProcess.spawn(program, [
    //     '--datadir', dataDir,
    //     '--syncmode', this.syncMode,
    //     '--cache', '1024',
    //     '--rpc',
    //     '--rpccorsdomain', '*',
    //     '--rpcport', '8545',
    //     '--rpcapi', 'eth,web3,admin,net,personal,db',
    //   ], { stdio: 'ignore' });
    //   this._process = clientProcess;
    //   this.es.ipcRenderer.send('client:start', this.clientProcess.pid);
    //   this._status = statusConstants.RUNNING;
    //   callback(true);
    // }
  }

  stopClient() {
    // tslint:disable-next-line:no-console
    this.logger.debug('[Stopping Akroma client...]');
    this._process.kill();
    this._status = statusConstants.STOPPED;
    return true;
  }

  private akromaClientExists(): boolean {
    return this.es.fs.existsSync(this.clientPath + this.es.path.sep + this.clientBin);
  }
}
