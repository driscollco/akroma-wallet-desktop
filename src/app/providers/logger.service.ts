import { Injectable } from '@angular/core';
import { SystemSettings } from '../models/system-settings';
import { ElectronService } from './electron.service';
import { SettingsService } from './settings.service';

@Injectable()
export class LoggerService {
    public logPath: string;
    public noop() { }

    public constructor(
        private electronService: ElectronService,
        private settingsService: SettingsService,
    ) {
    }

    public async init(callback: Function): Promise<void> {
        console.log('logger init...');
        const settings = await this.settingsService.getSettings();
        console.log(settings);
        let folder = '';
        if (settings.applicationPath !== undefined) {
            folder = settings.applicationPath;
        }
        const sep = this.electronService.path.sep;
        const logDirPath = folder + sep + 'logs';
        this.logPath = folder + sep + 'logs' + sep + 'akroma.log';
        console.log(`LoggerService: [logPath]: ${this.logPath}`);
        const exists = this.electronService.fs.existsSync(this.logPath);
        if (!exists) {
            console.warn(`LoggerService: log file does not exist`);
            this.electronService.fs.ensureDir(logDirPath, err => {
                console.log(`creating log folder`);
                if (err) { console.error(`Error: `, err); }
            });
            // tslint:disable-next-line:max-line-length
            this.electronService.fs.appendFile(this.logPath, this.format('Created log file', new Date(), 'debug'), () => this.noop);
        }
        try {
            this.electronService.fs.accessSync(this.logPath);
        } catch (err) {
            console.log(`LoggerService: Unable to access file: ${this.logPath}`);
        }
        callback();

    }

    public debug(message: string) {
        // tslint:disable-next-line:no-console
        const formatted = this.format(message, new Date(), 'debug');
        this.electronService.fs.appendFile(this.logPath, formatted, () => this.noop);
        console.log(formatted);
    }

    public info(message: string) {
        const formatted = this.format(message, new Date(), 'info');
        this.electronService.fs.appendFile(this.logPath, formatted, () => this.noop);
        // tslint:disable-next-line:no-console
        console.info(formatted);
    }

    public warn(message: string) {
        const formatted = this.format(message, new Date(), 'warn');
        this.electronService.fs.appendFile(this.logPath, formatted, () => this.noop);
        console.warn(formatted);
    }

    public error(message: string) {
        const formatted = this.format(message, new Date(), 'error');
        this.electronService.fs.appendFile(this.logPath, formatted, () => this.noop);
        console.error(formatted);
    }

    public format(message: string, date: Date, level: string) {
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

    public pad(number, zeros = 2) {
        zeros = zeros || 2;
        return (new Array(zeros + 1).join('0') + number).substr(-zeros, zeros);
    }

    public formatTimeZone(minutesOffset) {
        const m = Math.abs(minutesOffset);
        return (minutesOffset >= 0 ? '-' : '+') +
            this.pad(Math.floor(m / 60)) + ':' +
            this.pad(m % 60);
    }
}
