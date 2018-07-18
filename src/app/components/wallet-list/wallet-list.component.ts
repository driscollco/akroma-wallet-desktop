import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { PopoverDirective } from 'ngx-bootstrap/popover';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import { distinctUntilChanged, mergeMap, retry } from 'rxjs/operators';

import { Wallet } from '../../models/wallet';
import { clientConstants } from '../../providers/akroma-client.constants';
import { ElectronService } from '../../providers/electron.service';
import { SettingsStorageService } from '../../providers/settings-storage.service';
import { WalletStorageService } from '../../providers/wallet-storage.service';
import { Web3Service } from '../../providers/web3.service';
import { AkromaLoggerService } from '../../providers/akroma-logger.service';

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
    private walletService: WalletStorageService,
    private settingsService: SettingsStorageService,
    private electronService: ElectronService,
    private logger: AkromaLoggerService) {
    this.web3.setProvider(new this.web3.providers.HttpProvider(clientConstants.connection.default));
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
    this.wallets = await this.walletService.getAll() as Wallet[];

    const wallets = await this.web3.eth.personal.getAccounts() as string[];
    const uniqueWallets = Array.from(new Set(wallets));
    uniqueWallets.forEach(wallet => {
      const storedWallet = this.wallets.find(x => x.address === wallet);
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
    const allWallets = await this.walletService.getAll({ keys: addresses }) as any[];
    return allWallets.filter(x => x.value && x.value.deleted);
  }

  private async handleWalletRestore(walletData: any[]): Promise<void> {
    const theWalletsToRestore = this.mapDocumentsToRestoreWallets(walletData);
    const result = await this.walletService.putMany(theWalletsToRestore) as Wallet[];
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
    await this.walletService.putMany(walletsToSave);
    this.wallets.push(...walletsToSave);
  }

  private async handleStoredWalletsNotFound(wallets: Wallet[]): Promise<void> {
    wallets.forEach(x => x._deleted = true);
    await this.walletService.putMany(wallets);
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
    const newWallet = await this.walletService.put(newWalletObject) as Wallet;
    console.log('newWallet', newWallet);
    this.wallets.push(newWallet);
    this.walletForm.reset();
  }

  async renameWallet(walletForm: FormGroup = this.editWalletForm): Promise<void> {
    this.modalRef.hide();
    const result = await this.walletService.put(walletForm.value);
    if (!!result) {
      await this.fetchAndHandleWallets();
    }
    this.walletForm.reset();
  }

  openRenameWalletModal(wallet: Wallet, modalRef: TemplateRef<any>) {
    this.editWalletForm = this.formBuilder.group(wallet);
    this.openModal(modalRef);
  }

  async deleteWallet(wallet: Wallet): Promise<void> {
    const systemSettings = await this.settingsService.db.get('system');
    const keystoreFileDir = `${systemSettings.clientPath}/data/keystore`;
    const keystoreFileList = this.electronService.fs.readdirSync(keystoreFileDir);
    const keystoreFile = keystoreFileList.find(x => x.toLowerCase().includes(wallet.address.replace('0x', '').toLowerCase()));
    const backupDir = `${systemSettings.clientPath}/Auto-Backup-of-Deleted-Wallets`;

    if (!this.electronService.fs.existsSync(backupDir)) {
      this.electronService.fs.mkdirSync(backupDir);
    }
    if (keystoreFile) {
      this.modalRef.hide();

      this.electronService.fs.createReadStream(`${keystoreFileDir}/${keystoreFile}`)
      .pipe(this.electronService.fs.createWriteStream(`${systemSettings.clientPath}/Auto-Backup-of-Deleted-Wallets/${keystoreFile}`));
      console.log(`${keystoreFileDir}/${keystoreFile} was coppyed to ${backupDir}`);

      await this.electronService.fs.unlinkSync(`${keystoreFileDir}/${keystoreFile}`);
      try {
        const result = await this.walletService.delete(wallet) as PouchDB.Core.Response;
        if (result.ok) {
          this.wallets = this.wallets.filter(x => x._id !== wallet._id);
          await this.getWalletBalances(this.wallets.map(x => x.address));
        }
      } catch {
        this.wallets = this.wallets.filter(x => x._id !== wallet._id);
        await this.getWalletBalances(this.wallets.map(x => x.address));
        this.logger.debug(`Wallet ${wallet.address} not removed from database ` +
          `because it did not exist, but keystore file has been deleted.`);
      }
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
    const systemSettings = await this.settingsService.db.get('system');
    const keystoreFileDir = `${systemSettings.clientPath}/data/keystore`;
    const keystoreFileList = await this.electronService.fs.readdirSync(keystoreFileDir);
    const keystoreFile = keystoreFileList.find(x => x.toLowerCase().includes(wallet.address.replace('0x', '').toLowerCase()));
    if (keystoreFile) {
      electron.shell.showItemInFolder(`${keystoreFileDir}/${keystoreFile}`);
    }
  }

  showQrCode(wallet: Wallet, template: TemplateRef<any>) {
    this.openModal(template);
    this.modalRef.content = { wallet };
  }
}
