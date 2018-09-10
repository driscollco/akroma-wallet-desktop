import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { SystemSettings } from '../../models/system-settings';
import { SettingsService } from '../../providers/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsPageComponent implements OnInit {
  @ViewChild('directoryInput')
  private directoryInput: ElementRef;
  systemSettingsForm: FormGroup;
  settings: SystemSettings;

  constructor(
    private settingsService: SettingsService,
    private fb: FormBuilder,
    private router: Router) {
    this.systemSettingsForm = this.fb.group({
      clientPath: [''],
      syncMode: [''],
      transactionSource: [''],
      _rev: '',
      _id: 'system',
    });
  }

  async ngOnInit() {
    this.settings = await this.settingsService.getSettings();
    this.systemSettingsForm = this.fb.group({
      clientPath: [this.settings.clientPath],
      syncMode: [this.settings.syncMode],
      transactionSource: [this.settings.transactionSource],
      _rev: this.settings._rev,
      _id: 'system',
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
    const success = await this.settingsService.saveSettings(this.systemSettingsForm.value);
    if (success) {
      this.onRevert();
    }
  }

  /**
   * Reloads settings form with settings from database.
   */
  async onRevert() {
    const systemSettings = await this.settingsService.getSettings();
    this.systemSettingsForm = this.fb.group(systemSettings);
    this.directoryInput.nativeElement.value = '';
    this.router.navigate(['/wallets']);
  }
}
