import { Injectable } from '@angular/core';
import { SystemSettings } from '../models/system-settings';
import { ElectronService } from './electron.service';
import { SettingsPersistenceService } from './settings-persistence.service';

@Injectable()
export class AkromaLoggerService {

    settings: SystemSettings;
    logPath: string;
    noop() { }

    constructor(
        private electronService: ElectronService,
        private settingsService: SettingsPersistenceService,
    ) { }

    async init(callback: Function) {
        console.log('settings service!');
        let settings;
        try {
            settings = await this.settingsService.db.get('system');
        } catch {
            settings = await this.settingsService.defaultSettings();
        }
        this.logPath = settings.applicationPath + this.electronService.path.sep + 'logs' + this.electronService.path.sep 'akroma.log';
        console.log(`AkromaLoggerService: [logPath]: ${this.logPath}`);

        const exists = this.electronService.fs.existsSync(this.logPath);
        if (!exists) {
            console.log(`AkromaLoggerService: log file does not exist`);
            // tslint:disable-next-line:max-line-length
            this.electronService.fs.appendFile(this.logPath, this.format('Created log file', new Date(), 'debug'), () => this.noop);
        }
        try {
            this.electronService.fs.accessSync(this.logPath);
        } catch (err) {
            console.log(`AkromaLoggerService: Unable to access file: ${this.logPath}`);
        }
        callback();
    }

    debug(message: string) {
        // tslint:disable-next-line:no-console
        const formatted = this.format(message, new Date(), 'debug');
        this.electronService.fs.appendFile(this.logPath, formatted, () => this.noop);
        console.log(formatted);
    }

    info(message: string) {
        const formatted = this.format(message, new Date(), 'info');
        this.electronService.fs.appendFile(this.logPath, formatted, () => this.noop);
        // tslint:disable-next-line:no-console
        console.info(formatted);
    }

    warn(message: string) {
        const formatted = this.format(message, new Date(), 'warn');
        this.electronService.fs.appendFile(this.logPath, formatted, () => this.noop);
        console.warn(formatted);
    }

    error(message: string) {
        const formatted = this.format(message, new Date(), 'error');
        this.electronService.fs.appendFile(this.logPath, formatted, () => this.noop);
        console.error(formatted);
    }

    format(message: string, date: Date, level: string) {
        return '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}\r\n'
            .replace('{level}', level)
            .replace('{text}', message)
            .replace('{y}', date.getFullYear().toString())
            .replace('{m}', this.pad(date.getMonth() + 1))
            .replace('{d}', this.pad(date.getDate()))
            .replace('{h}', this.pad(date.getHours()))
            .replace('{i}', this.pad(date.getMinutes()))
            .replace('{s}', this.pad(date.getSeconds()))
            .replace('{ms}', this.pad(date.getMilliseconds(), 3))
            .replace('{z}', this.formatTimeZone(date.getTimezoneOffset()));
    }

    pad(number, zeros = 2) {
        zeros = zeros || 2;
        return (new Array(zeros + 1).join('0') + number).substr(-zeros, zeros);
    }

    formatTimeZone(minutesOffset) {
        const m = Math.abs(minutesOffset);
        return (minutesOffset >= 0 ? '-' : '+') +
            this.pad(Math.floor(m / 60)) + ':' +
            this.pad(m % 60);
    }
}
