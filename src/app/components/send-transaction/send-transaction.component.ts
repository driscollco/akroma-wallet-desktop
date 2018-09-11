import {
  Component, Input, ChangeDetectionStrategy, OnChanges,
  SimpleChanges, TemplateRef, ViewChild, ChangeDetectorRef, Output, EventEmitter, HostListener, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, Validators, FormBuilder, AbstractControl } from '@angular/forms';
import 'rxjs/add/observable/fromPromise';
import { Observable } from 'rxjs';

import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

import { Wallet } from '../../models/wallet';
import { Web3Service } from '../../providers/web3.service';
import { LoggerService } from '../../providers/logger.service';

@Component({
  // changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-send-transaction',
  templateUrl: './send-transaction.component.html',
  styleUrls: ['./send-transaction.component.scss'],
})
export class SendTransactionComponent implements OnChanges, OnInit {

  public amountSelected: boolean;
  public sendForm: FormGroup;
  public modalRef: BsModalRef;
  public gasPrice$: Observable<number>;
  public passphrase: string;
  @ViewChild('sendTransactionPassphrase') public passphraseModal: TemplateRef<any>;
  @Input() public wallet: Wallet;
  @Output() public transactionSent: EventEmitter<any>;
  public escapeKey;
  @HostListener('document:keydown.escape', ['$event'])
  public escapeFromSettingsPage(event: KeyboardEvent) {
    this.escapeKey = event.key;
    this.router.navigate(['/wallets']);
  }
  public constructor(private cd: ChangeDetectorRef,
    private fb: FormBuilder,
    private modalService: BsModalService,
    private web3: Web3Service,
    private router: Router,
    private logger: LoggerService,
  ) {
    this.transactionSent = new EventEmitter<any>();
    this.gasPrice$ = Observable.from(this.web3.eth.getGasPrice());
  }

  public ngOnInit(): void {
    this.sendForm = this.fb.group({
      to: '',
      from: [this.wallet.address],
      value: [0, Validators.min(0)],
      data: ['', this.hexValidator],
      gas: 21000,
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.wallet.isFirstChange()) {
      return;
    }

    if (!!changes.wallet && !!changes.wallet.currentValue && changes.wallet.previousValue === undefined) {
      this.buildStockForm();
    }
  }

  public async onTransactionSent() {
    console.log(`sent placeholder`);
  }

  public buildStockForm() {
    this.sendForm = this.fb.group({
      to: '',
      from: this.wallet.address,
      value: [0, Validators.min(0)],
      data: ['', this.hexValidator],
      gas: 21000,
    });
    this.cd.markForCheck();
  }

  public hexValidator(formcontrol: AbstractControl) {
    const a = parseInt(formcontrol.value, 16);
    return (a.toString(16) === formcontrol.value) ? null : { hex: { valid: false } };
  }

  public openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  public async sendTransaction() {
    // TODO: Need to install bignumber library for keeping decimal accuracy
    try {
      const tx = {
        ...this.sendForm.value,
        value: this.web3.utils.toWei(this.sendForm.value.value.toString(), 'ether'),
      };
      const txHash = await this.web3.eth.personal.sendTransaction(tx, this.passphrase);
      this.transactionSent.emit({
        ...tx,
        hash: txHash,
      });
      this.buildStockForm();
      this.passphrase = '';
    } catch (error) {
      console.log(error);
      // in case of exception, always clear passphrase and form
      this.buildStockForm();
      this.passphrase = '';
    }
    this.modalRef.hide();
  }
}
