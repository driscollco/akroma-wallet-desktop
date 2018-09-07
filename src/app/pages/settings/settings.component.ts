import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { SettingsService } from '../../providers/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent implements OnInit {
  @ViewChild('directoryInput')
  private directoryInput: ElementRef;
  systemSettingsForm: FormGroup;

  constructor(
    private settingsService: SettingsService,
    private fb: FormBuilder,
    private router: Router) {
    console.log('called ctor');
    this.systemSettingsForm = this.fb.group({
      clientPath: [''],
      syncMode: [''],
      transactionSource: [''],
      _rev: '',
      _id: 'system',
    });
  }

  ngOnInit() {
    console.log('called init');
    this.settingsService.settings
      .subscribe(settings => {
        this.systemSettingsForm = this.fb.group({
          clientPath: [settings.clientPath],
          syncMode: [settings.syncMode],
          transactionSource: [settings.transactionSource],
          _rev: settings._rev,
          _id: 'system',
        });
      });
  }

  onDirectoryPathChange(event: any) {
    const files = event.srcElement.files;
    if (files.length > 0) {
      this.systemSettingsForm.get('clientPath').setValue(files['0'].path);
      this.systemSettingsForm.get('clientPath').markAsDirty();
    }
  }

  async onSubmit() {
    console.log('saving');
    const success = await this.settingsService.saveSettings(this.systemSettingsForm.value);
    if (success) {
      this.onRevert();
    }
  }

  async onRevert() {
    // const systemSettings = await this.settingsService.getSettings();
    // this.systemSettingsForm = this.fb.group(systemSettings);
    this.directoryInput.nativeElement.value = '';
    this.router.navigate(['/wallets']);
  }
}
