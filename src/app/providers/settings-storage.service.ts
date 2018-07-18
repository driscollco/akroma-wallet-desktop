import { Injectable } from '@angular/core';

import PouchDB from 'pouchdb';

import { SystemSettings } from '../models/system-settings';
import { ElectronService } from './electron.service';
import { clientConstants } from './akroma-client.constants';

@Injectable()
export class SettingsStorageService {
  private _db: PouchDB.Database<SystemSettings>;

  get db(): PouchDB.Database<SystemSettings> {
    return this._db;
  }

  constructor(
    private es: ElectronService) {
    this._db = new PouchDB('settings');
  }

  async defaultSettings(): Promise<any> {
    const client = clientConstants.clients.akroma.platforms[this.es.os.platform()][this.es.os.arch()];
    const saveMe = {
      _id: 'system',
      clientPath: this.es.path.join(this.es.os.homedir + client.extract_path),
      applicationPath: this.es.remote.app.getPath('userData'),
      syncMode: 'fast',
    };

    try {
      const result = await this.db.put(saveMe);
      if (result.ok) {
        return await this.db.get('system');
      }
    } catch {
      // We are returning this when we catch,
      // because there may be conflicts as there may be several puts happening
      // simultaneously as we rely on defaultSettings() during alpha.
      return await this.db.get('system');
    }
  }
}
