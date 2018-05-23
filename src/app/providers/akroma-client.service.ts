import { Injectable } from '@angular/core';
import { ChildProcess } from 'child_process';
import * as request from 'request';
import { clientConstants } from './akroma-client.constants';
import { ElectronService } from './electron.service';
import { SettingsPersistenceService } from './settings-persistence.service';
import { Web3Service } from './web3.service';



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
  private _process: ChildProcess;
  get clientProcess(): ChildProcess {
    return this._process;
  }
  get status(): string {
    return this._status;
  }

  constructor(private es: ElectronService,
    private settingsService: SettingsPersistenceService,
    private web3: Web3Service) {
    this.web3.setProvider(new this.web3.providers.HttpProvider(clientConstants.connection.default));
  }

  async initialize(callback: Function) {
    let settings;
    try {
      this.client = clientConstants.clients.akroma.platforms[this.es.os.platform()][this.es.os.arch()];
      settings = await this.settingsService.db.get('system');
    } catch {
      settings = await this.defaultSettings();
    } finally {
      this.clientPath = settings.dataDirPath;
      this.clientBin = this.client.bin;
      this.syncMode = settings.syncMode;
      callback(true);
    }
  }

  async defaultSettings() {
    console.log('loading default settings');
    const result = await this.settingsService.db.put({
      _id: 'system',
      dataDirPath: this.es.path.join(this.es.process.env.HOME + this.client.extract_path),
      syncMode: 'fast',
    });
    if (result.ok) {
      return await this.settingsService.db.get('system') || {};
    }
  }

  downloadClient(callback?: Function): void {
    if (this.akromaClientExists()) {
      callback(true);
      return;
    }

    this._status = statusConstants.DOWNLOADING;
    const url = this.client.download.url;
    const req = request(url);

    // tslint:disable-next-line:no-console
    console.info('[Downloading Akroma client...]');
    console.log('Client path: ' + this.clientPath);
    if (this.es.fs.existsSync(this.clientPath) === false) {
      console.log('[Making Dir]' + this.clientPath);
      this.es.fs.mkdirSync(this.clientPath);
    }

    req.on('response', (response) => {
      console.log('response....');
      response.pipe(this.es.fs.createWriteStream(this.clientPath + this.es.path.sep + this.clientBin));
    });

    req.on('end', () => {
      console.log('end....' + this.es.os.platform());
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

  async startClient() {
    try {
      const isListening = await this.web3.eth.net.isListening();
      if (isListening) {
        this._status = statusConstants.RUNNING;
        return;
      }
    } catch {
      // tslint:disable-next-line:no-console
      console.info('[Starting Akroma client...]');
      const process = this.es.childProcess.spawn(this.clientPath + this.es.path.sep + this.clientBin, [
        '--datadir', this.clientPath + this.es.path.sep + 'data', '--syncmode', this.syncMode,
        '--cache', '1024', '--rpc', '--rpccorsdomain', '*', '--rpcport', '8545', '--rpcapi', 'eth,web3,admin,net,personal,db',
      ], { stdio: 'ignore' });
      this._process = process;
      this._status = statusConstants.RUNNING;
      return process;
    }
  }

  stopClient() {
    // tslint:disable-next-line:no-console
    console.info('[Stopping Akroma client...]');
    this._process.kill();
    this._status = statusConstants.STOPPED;
    return true;
  }

  private archiveVerifiedMd5Checksum(fileBuffer: Buffer): boolean {
    return this.es.crypto.createHash('md5').update(fileBuffer).digest('hex') === this.client.download.md5;
  }

  private akromaClientExists(): boolean {
    return this.es.fs.existsSync(this.clientPath + this.es.path.sep + this.clientBin);
  }
}
