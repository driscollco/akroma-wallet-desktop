import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import { Subject } from 'rxjs';
import { SystemSettings } from '../models/system-settings';
import { clientConstants } from './akroma-client.constants';
import { ElectronService } from './electron.service';

@Injectable()
export class SettingsService {
  private _db: PouchDB.Database<SystemSettings>;
  public settings = new Subject<SystemSettings>();
  constructor(
    private es: ElectronService,
  ) {
    this._db = new PouchDB('settings');
    try {
      this._db.get('system')
        .then(data => {
          this.settings.next(data);
        });
    } catch (error) {
      const client = clientConstants.clients.akroma.platforms[this.es.os.platform()][this.es.os.arch()];
      const settings = {
        _id: 'system',
        clientPath: this.es.path.join(this.es.os.homedir + client.extract_path),
        applicationPath: this.es.remote.app.getPath('userData'),
        syncMode: 'fast',
        transactionSource: 'remote', // remote or local
      };
      this.settings.next(settings);
    }
  }

  async getSettings(): Promise<SystemSettings> {
    return await this._db.get('system');
  }

  async saveSettings(toUpdate: SystemSettings): Promise<boolean> {
    try {
      const current = await this._db.get('system');
      current.applicationPath = toUpdate.applicationPath;
      current.syncMode = toUpdate.syncMode;
      current.transactionSource = toUpdate.transactionSource;
      const result = await this._db.put(current);
      if (result.ok) {
        this.settings.next(current);
      }
      return result.ok;
    } catch (error) {
    }
  }
}
