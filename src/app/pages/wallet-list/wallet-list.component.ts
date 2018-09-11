import { Component, OnInit, TemplateRef, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { PopoverDirective } from 'ngx-bootstrap/popover';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import { Wallet } from '../../models/wallet';
import { ElectronService } from '../../providers/electron.service';
import { LoggerService } from '../../providers/logger.service';
import { SettingsService } from '../../providers/settings.service';
import { WalletService } from '../../providers/wallet.service';
import { Web3Service } from '../../providers/web3.service';
import { Subscription } from 'rxjs';
import { SystemSettings } from '../../models/system-settings';
import { FileActionService } from '../../providers/file-action.service';
const electron = window.require('electron');

@Component({
  selector: 'app-wallet-list',
  templateUrl: './wallet-list.component.html',
  styleUrls: ['./wallet-list.component.scss'],
})
export class WalletListComponent implements OnInit ,OnDestroy {
  allWalletsBalance: string;
  allWalletsBalanceLoading: boolean;
  editWalletForm: FormGroup;
  modalRef: BsModalRef;
  @ViewChild('pop') pop: PopoverDirective;
  walletForm: FormGroup;
  wallets: Wallet[];
  private settings: SystemSettings;
  private settingsSub: Subscription;
  public keystoreFileList: any[] = [];
  public keystoreFileDir: string;

  constructor(
    public file: FileActionService,
    private formBuilder: FormBuilder,
    private modalService: BsModalService,
    private web3: Web3Service,
    private walletService: WalletService,
    private settingsService: SettingsService,
    private electronService: ElectronService,
    private logger: LoggerService) {
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

  ngOnDestroy(){
    this.wallets=[]
  }

  private async fetchAndHandleWallets() {

    const sep = this.electronService.path.sep;
    const systemSettings = await this.settingsService.getSettings();
    this.keystoreFileDir = `${systemSettings.clientPath}${sep}data${sep}keystore${sep}`;
    this.keystoreFileList = this.electronService.fs.readdirSync(this.keystoreFileDir);

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
    await this.getWalletBalances(this.wallets);
    await this.addFilenamesToWallet(this.wallets, this.keystoreFileList, this.keystoreFileDir)

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

  async deleteWallet(wallet: Wallet, i): Promise<void> {
    this.modalRef.hide();
    const sep = this.electronService.path.sep;
    const systemSettings = await this.settingsService.getSettings();

    const keystoreFileDir = `${systemSettings.clientPath}${sep}data${sep}keystore${sep}`;
    const backupDir = `${systemSettings.clientPath}${sep}Auto-Backup-of-Deleted-Wallets${sep}`;

 
    if (!this.electronService.fs.existsSync(backupDir)) {
      this.electronService.fs.mkdirSync(backupDir);
    }

    this.wallets.splice(i, 1)
    this.electronService.fs.move(keystoreFileDir + wallet.filename, backupDir + wallet.filename, { overwrite: true }, err => {

      if (err) return console.error(err)

      this.logger.info(`wallet moved from ${keystoreFileDir}${wallet.filename}`);
      this.logger.info(`wallet moved to ${backupDir}${wallet.filename}`);
      const result = this.walletService.db.remove(wallet._id, wallet._rev);
      if (result) {
        this.getWalletBalances(this.wallets);
      }
      console.log('success! :: wallet removed!')
       
    })

  }


 


  async getWalletBalances(wallets: Wallet[]): Promise<void> {
    this.allWalletsBalance = '0'; 
    if (wallets.length === 0) {
      this.allWalletsBalanceLoading = false;
      return; 
    }

  wallets.map(async (x,i)=>{  

    const weiBalance = await this.web3.eth.getBalance(x.address);
    const ethBalance = await this.web3.utils.fromWei(weiBalance, 'ether');
    wallets[i].balance=await ethBalance;
    this.allWalletsBalance = (parseFloat(ethBalance) + parseFloat(this.allWalletsBalance)).toFixed(6);
    this.allWalletsBalanceLoading = false;
  })
    
  }

  backupWalletReminder(wallet: Wallet, template: TemplateRef<any>) {
    this.openModal(template); 
    this.modalRef.content = {wallet}
  }

  copyAddress(wallet: Wallet) {
    electron.clipboard.writeText(wallet.address);
    this.pop.hide();
  }

  async backupWallet(wallet: Wallet): Promise<void> {
    const sep = this.electronService.path.sep;
    const systemSettings = await this.settingsService.getSettings();
    const keystoreFileDir = `${systemSettings.clientPath}${sep}data${sep}keystore${sep}`;
    const keystoreFileList = await this.electronService.fs.readdirSync(keystoreFileDir);
    const keystoreFile = keystoreFileList.find(x => x.toLowerCase().includes(wallet.address.replace('0x', '').toLowerCase()));
    if (keystoreFile) {
      electron.shell.showItemInFolder(`${keystoreFileDir}${sep}${keystoreFile}`);
    }
  }

  showQrCode(wallet: Wallet, template: TemplateRef<any>) {
    this.openModal(template);
    this.modalRef.content = { wallet };
  }

  async importFile(res) {
    const sep = this.electronService.path.sep;
    const systemSettings = await this.settingsService.getSettings();
    const keystoreFileDir = `${systemSettings.clientPath}${sep}data${sep}keystore${sep}`;
    const file = res[0].path;
    const filename = res[0].name;

    this.file.copy(file, keystoreFileDir + filename)
    setTimeout(async () => {
      this.wallets = []

      await this.fetchAndHandleWallets()
    }, 500); 

  }

  addFilenamesToWallet(wallets, keystoreFileList, keystoreFileDir) {

    keystoreFileList
     .map( (file,i) => {
       this.electronService.fs.readJson(keystoreFileDir + file, (err, packageObj) => {
       wallets.map( (placeholder, i) => {
           if (wallets[i].address.replace('0x', '').toLowerCase() === packageObj.address) {
              wallets[i].filename=file
           }
         })
       })
     })
 }

 async selectFile(res) {
  const sep = this.electronService.path.sep;
  const systemSettings = await this.settingsService.getSettings();
  const keystoreFileDir = `${systemSettings.clientPath}${sep}data${sep}keystore${sep}`;
  const file = res[0].path;
  const fileName = res[0].name;

  this.file.copy(file, keystoreFileDir + fileName)
  setTimeout(async () => {
    this.wallets = []

    await this.fetchAndHandleWallets()
  }, 500); 

}


}
