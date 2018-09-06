import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { concat, filter } from 'lodash';
import { DragulaService } from 'ng2-dragula';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/Subscription';
import { SystemSettings } from '../../../models/system-settings';
import { ElectronService } from '../../../providers/electron.service';
import { SettingsPersistenceService } from '../../../providers/settings-persistence.service';
import { Web3Service } from '../../../providers/web3.service';


export interface KeystoreData {
  fileName?: string;
  address?: string;
  balance?: number;
  push?: any;
  id: any;
}

@Component({
  selector: 'app-from-keystore',
  templateUrl: './from-keystore.component.html',
  styleUrls: ['./from-keystore.component.scss'],

})
export class FromKeystoreComponent implements OnInit, OnDestroy {

  subs = new Subscription();
  elMoveState = [false]
  settings: SystemSettings;
  sep: string;

  akromaDataKeystoreDirName: string;
  desktopAkromaDirName: string;
  akromaDeletedWalletsDirName: string;
  documentsAkromaBackupDirName: string;

  keystoreFolder: KeystoreData[] = [];
  importFolder: KeystoreData[] = [];

  @HostListener('document:keydown.escape', ['$event'])
  escapeFromSettingsPage(event: KeyboardEvent) {
    setTimeout(() => {
      this.whereToGo(this.keystoreFolder, this.router)
    }, 200);
  }

  constructor(

    public dragulaService: DragulaService,
    private router: Router,
    private web3: Web3Service,
    private settingsService: SettingsPersistenceService,
    public electronService: ElectronService,

  ) {

    this.sep = this.electronService.path.sep;

    this.dragulaService.createGroup('folder', {
      copy: () => {
        this.subs.add(this.dragulaService.dropModel(`folder`)
          .subscribe(({ source, target, item }) => {
            const src = source.className + item.fileName
            const dest = target.className + item.fileName
            item.id = `can-not-move`
            if (target.className === this.akromaDataKeystoreDirName) {
              this.copy(src, dest)
            }
          }))

        return true
      },
      removeOnSpill: true,
      copyItem: (item) => { return item },

      accepts: (target, source) => { return target.className !== source.className },

      moves: (el) => {
        Observable.from(this.elMoveState)
          .subscribe(x => {
            this.moveController(el, this.elMoveState, this.keystoreFolder, this.importFolder)
          })
          .unsubscribe()

        console.log(`elMoveState`, this.elMoveState[0])

        return this.elMoveState[0]
      }
    })

  }//constructor



  async ngOnInit() {

    try {
      console.warn(`system path`)
      this.settings = await this.settingsService.db.get('system');
      this.getPaths();

    } catch {
      console.warn(`default path`)
      this.settings = await this.settingsService.defaultSettings();
      this.getPaths();
    }

    this.backupToDocuments(this.documentsAkromaBackupDirName, this.akromaDeletedWalletsDirName, this.akromaDataKeystoreDirName, this.desktopAkromaDirName)

    setTimeout(() => {
      this.lookForKeystore(this.keystoreFolder, this.akromaDataKeystoreDirName)
      this.lookForKeystore(this.importFolder, this.documentsAkromaBackupDirName)
    }, 50); // backup should complete before this

  }


  private moveController(element, elMoveState, keystoreFolder, importFolder) {
    const count = []
    const one = concat(importFolder, keystoreFolder);
    const uniq = filter(one, (o) => {
      if (o.id === element.id) { count.push(o) }
      if (count[1] === undefined) {
        elMoveState[0] = true
      } else {
        elMoveState[0] = false
      }
      return o.id === element.id
    })
  }




  public async  copy(src: string, dest: string) {
    if (src !== dest) {
      await this.electronService.fs.access(src, (err) => {
        if (err) {
          console.error('access error in copy()', err);
        } else {
          console.log(`copySync`)
          this.electronService.fs.copySync(src, dest);
        }
      });
    } else { console.log('copy: will not overwrite self') }
  }

  private async lookForKeystore(folder: KeystoreData[], FolderDirName: string) {

    const fileNameList: any[] = await this.electronService.fs.readdir(FolderDirName);
    let len;
    if (FolderDirName === this.documentsAkromaBackupDirName) {
      len = fileNameList.length;
    }

    fileNameList
      .map(fileName => {
        this.electronService.fs
          .readFile(FolderDirName + fileName, 'utf8', (err, data) => {
            if (err) {
              throw err;
            }

            const valid: Boolean = this.validateJSON(data, fileName, FolderDirName);
            if (valid) {
              const Data: KeystoreData = JSON.parse(data);
              const address = `0x` + Data.address;
              const id = `wallet-id-` + address;
              const balance = this.web3.eth.getBalance(address)
                .then(wei => {
                  return this.web3.utils.fromWei(wei, 'ether')
                });
              folder
                .push({
                  id: id,
                  address: address,
                  balance: balance,
                  fileName: fileName,

                })
            }
          });
      }).map(x => {

        if (len) {
          setTimeout(() => {
            this.compareFolders(this.importFolder, this.keystoreFolder)
          }, 100);
        }
      })
  }

  private compareFolders(folder1, folder2) {
    if (folder1.length >= folder2.length) {
      const combined = concat(folder1, folder2);
      const uniq = filter(combined, (o, i) => {
        if (folder1[i] === folder2[i]) {
          var x: any = document.getElementsByClassName(o.id);
          var i;
          for (i = 0; i < x.length; i++) {
            x[i].classList.add(`can-not-move`)
          }
        }
        return folder1[i] === folder2[i]
      }
      )
    }
  }

  async whereToGo(wallets, router) {

    if (wallets[0]) {
      console.warn(`found wallet data!`)
      router.navigate(['/this.wallets']);
    } else {
      console.warn(`No wallets ! Go Create!`)
      router.navigate(['/create']);
    }
  }

  private validateJSON(body: string, fileName: string, dirName: string) {
    try {
      const data = JSON.parse(body);
      return data;
    } catch (e) {
      console.error(dirName + fileName, 'is not a keystore');
      return null;
    }
  }

  private getPaths() {
    this.akromaDeletedWalletsDirName = `${this.settings.clientPath}${this.sep}Auto-Backup-of-Deleted-Wallets${this.sep}`;
    this.akromaDataKeystoreDirName = `${this.settings.clientPath}${this.sep}data${this.sep}keystore${this.sep}`;
    this.desktopAkromaDirName = `${this.electronService.os.homedir}${this.sep}Desktop${this.sep}AKA${this.sep}`;
    this.documentsAkromaBackupDirName = `${this.electronService.os.homedir}${this.sep}Documents${this.sep}Akroma-UTC-JSON-Backup${this.sep}`
    this.electronService.fs.ensureDir(this.documentsAkromaBackupDirName)
      .then(() => {
        console.log('success!')
      })

    this.electronService.fs.ensureDir(this.desktopAkromaDirName)
      .then(() => {
        console.log('success!')
      })
  }



  private async backupToDocuments(documentsAkromaBackupDirName, akromaDeletedWalletsDirName, akromaDataKeystoreDirName, desktopAkromaDirName) {
    await this.electronService.fs.copySync(akromaDeletedWalletsDirName, documentsAkromaBackupDirName)
    await this.electronService.fs.copySync(akromaDataKeystoreDirName, documentsAkromaBackupDirName)
    await this.electronService.fs.copySync(desktopAkromaDirName, documentsAkromaBackupDirName)
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.dragulaService.destroy(`folder`);

  }

}//end
