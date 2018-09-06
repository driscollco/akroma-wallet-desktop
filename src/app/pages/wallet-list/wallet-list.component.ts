import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { PopoverDirective } from 'ngx-bootstrap/popover';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import { Wallet } from '../../models/wallet';
import { AkromaLoggerService } from '../../providers/akroma-logger.service';
import { ElectronService } from '../../providers/electron.service';
import { SettingsPersistenceService } from '../../providers/settings-persistence.service';
import { WalletPersistenceService } from '../../providers/wallet-persistence.service';
import { Web3Service } from '../../providers/web3.service';

const electron = window.require('electron');

@Component({
  selector: 'app-wallet-list',
  templateUrl: './wallet-list.component.html',
  styleUrls: ['./wallet-list.component.scss'],
})
export class WalletListComponent implements OnInit {
  allWalletsBalance: string;
  allWalletsBalanceLoading: boolean;
  editWalletForm: FormGroup;
  modalRef: BsModalRef;
  @ViewChild('pop') pop: PopoverDirective;
  walletForm: FormGroup;
  wallets: Wallet[];

  constructor(private formBuilder: FormBuilder,
    private modalService: BsModalService,
    private web3: Web3Service,
    private walletService: WalletPersistenceService,
    private settingsService: SettingsPersistenceService,
    private electronService: ElectronService,
    private logger: AkromaLoggerService) {
    this.walletForm = this.formBuilder.group(
      { name: '', passphrase: '', confirmPassphrase: '' },
      { validator: this.passphraseMatchValidator },
    );
    this.allWalletsBalance = '0';
    this.allWalletsBalanceLoading = true;
  }

  async ngOnInit() {
    await this.fetchAndHandleWallets();
  }

  private async fetchAndHandleWallets() {
    const allDocs = await this.walletService.db.allDocs({ include_docs: true });
    this.wallets = allDocs.rows.map(x => x.doc);

    const wallets = await this.web3.eth.personal.getAccounts() as string[];
    const uniqueWallets = Array.from(new Set(wallets));
    uniqueWallets.forEach(wallet => {
      const storedWallet = allDocs.rows.find(x => x.doc.address === wallet);
      if (!!storedWallet) {
        return;
      }
    });
    const storedWalletsNotFound = this.wallets.filter(x => !uniqueWallets.includes(x.address));
    await this.handleStoredWalletsNotFound(storedWalletsNotFound);

    const previouslyDeletedWallets = await this.fetchDeletedWalletsForRestore(uniqueWallets);
    this.handleWalletRestore(previouslyDeletedWallets);

    const unstoredWallets = uniqueWallets
      .filter(x => !this.wallets.map(y => y.address).includes(x))
      .filter(x => !previouslyDeletedWallets.map(y => y.id).includes(x));
    await this.handleUnstoredWallets(unstoredWallets);
    await this.getWalletBalances(this.wallets.map(x => x.address));
  }

  private async fetchDeletedWalletsForRestore(addresses: string[]): Promise<any> {
    const allDocs = await this.walletService.db.allDocs({ include_docs: true, keys: addresses });
    return allDocs.rows.filter(x => x.value && x.value.deleted);
  }

  private async handleWalletRestore(walletData: any[]): Promise<void> {
    const theWalletsToRestore = this.mapDocumentsToRestoreWallets(walletData);
    const result = await this.walletService.db.bulkDocs(theWalletsToRestore);
    this.wallets.push(...this.mapDocumentsToRestoreWallets(result));
  }

  private mapDocumentsToRestoreWallets(walletData: any[]): Wallet[] {
    return walletData.map(x => <Wallet>{
      name: x.id,
      address: x.id,
      _id: x.id,
      _rev: x.rev || x.value.rev,
    });
  }

  private async handleUnstoredWallets(addresses: string[]): Promise<void> {
    const walletsToSave = [];
    addresses.forEach(address => {
      walletsToSave.push({
        name: address,
        address: address,
        _id: address,
      });
    });
    await this.walletService.db.bulkDocs(walletsToSave);
    this.wallets.push(...walletsToSave);
  }

  private async handleStoredWalletsNotFound(wallets: Wallet[]): Promise<void> {
    wallets.forEach(x => x._deleted = true);
    await this.walletService.db.bulkDocs(wallets);
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  passphraseMatchValidator(g: FormGroup): { [key: string]: boolean } {
    return g.get('passphrase').value === g.get('confirmPassphrase').value
      ? null : { passphraseMatch: true };
  }

  async createWallet(walletForm: FormGroup = this.walletForm): Promise<void> {
    this.modalRef.hide();
    const newWalletAddress = await this.web3.eth.personal.newAccount(walletForm.get('passphrase').value);
    const newWalletObject: Wallet = {
      _id: newWalletAddress,
      address: newWalletAddress,
      name: this.walletForm.get('name').value,
    };
    this.walletService.db.put(newWalletObject);
    this.wallets.push(await this.walletService.db.get(newWalletObject._id));
    this.walletForm.reset();
  }

  async renameWallet(walletForm: FormGroup = this.editWalletForm): Promise<void> {
    this.modalRef.hide();
    const result = await this.walletService.db.put(walletForm.value);
    if (result.ok) {
      await this.fetchAndHandleWallets();
    }
    this.walletForm.reset();
  }

  openRenameWalletModal(wallet: Wallet, modalRef: TemplateRef<any>) {
    this.editWalletForm = this.formBuilder.group(wallet);
    this.openModal(modalRef);
  }

  async deleteWallet(wallet: Wallet): Promise<void> {
    const sep = this.electronService.path.sep;
    const systemSettings = await this.settingsService.db.get('system');
    const keystoreFileDir = `${systemSettings.clientPath}${sep}data${sep}keystore${sep}`;
    const keystoreFileList = this.electronService.fs.readdirSync(keystoreFileDir);
    const backupDir = `${systemSettings.clientPath}${sep}Auto-Backup-of-Deleted-Wallets${sep}`;

    if (!this.electronService.fs.existsSync(backupDir)) {
      this.electronService.fs.mkdirSync(backupDir);
    }

    keystoreFileList.map((file, i) => {
      this.electronService.fs.readJson(keystoreFileDir + file, (err, packageObj) => {
        if (err) { console.error(err); }
        if (wallet.address.replace('0x', '').toLowerCase() === packageObj.address) {
          console.log(keystoreFileDir + file, backupDir + file);
          this.electronService.fs.move(keystoreFileDir + file, backupDir + file, { overwrite: true }, error => {
            this.modalRef.hide();
            if (error) { return console.error(error); }
            this.logger.info(`wallet moved from ${keystoreFileDir}${file}`);
            this.logger.info(`wallet moved to ${backupDir}${file}`);
            console.log('success!');
          });
        }
      });
    }).map((x, i) => { // quick fix before a better system is in place
      this.refreshWalletDataAfterDelete(wallet);
    });
  }

  private async refreshWalletDataAfterDelete(wallet: Wallet) {
    try {
      const result = await this.walletService.db.remove(wallet._id, wallet._rev);
      if (result.ok) {
        this.wallets = this.wallets.filter(x => x._id !== wallet._id);
        await this.getWalletBalances(this.wallets.map(x => x.address));
      }
    } catch {
      this.wallets = this.wallets.filter(x => x._id !== wallet._id);
      await this.getWalletBalances(this.wallets.map(x => x.address));
      // this.logger.debug(`Wallet ${wallet.address} not removed from database ` +
      //   `because it did not exist, keystore file has not been deleted.`);
    }
  }



  async getWalletBalances(addresses: string[]): Promise<void> {
    this.allWalletsBalance = '0';
    if (addresses.length === 0) {
      this.allWalletsBalanceLoading = false;
      return;
    }

    for (let i = 0; i < addresses.length; i++) {
      const weiBalance = await this.web3.eth.getBalance(addresses[i]);
      const ethBalance = await this.web3.utils.fromWei(weiBalance, 'ether');
      this.allWalletsBalance = (parseFloat(ethBalance) + parseFloat(this.allWalletsBalance)).toFixed(6);
      this.allWalletsBalanceLoading = false;
    }
  }

  backupWalletReminder(wallet: Wallet, template: TemplateRef<any>) {
    this.openModal(template);
    this.modalRef.content = { wallet };
  }

  copyAddress(wallet: Wallet) {
    electron.clipboard.writeText(wallet.address);
    this.pop.hide();
  }

  async backupWallet(wallet: Wallet): Promise<void> {
    const sep = this.electronService.path.sep;
    const systemSettings = await this.settingsService.db.get('system');
    const keystoreFileDir = `${systemSettings.clientPath}${sep}data${sep}keystore${sep}`;
    const keystoreFileList = await this.electronService.fs.readdirSync(keystoreFileDir);
    // manual backup of renamed keystore needs fix
    const keystoreFile = keystoreFileList.find(x => x.toLowerCase().includes(wallet.address.replace('0x', '').toLowerCase()));
    if (keystoreFile) {
      electron.shell.showItemInFolder(`${keystoreFileDir}${sep}${keystoreFile}`);
    }
  }

  showQrCode(wallet: Wallet, template: TemplateRef<any>) {
    this.openModal(template);
    this.modalRef.content = { wallet };
  }
}
