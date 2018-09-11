import { Injectable } from '@angular/core';
import * as childProcess from 'child_process';
import * as crypto from 'crypto';
// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, remote, webFrame } from 'electron';
import * as fs from 'fs-extra';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';
import * as process from 'process';


@Injectable()
export class ElectronService {

  public ipcRenderer: typeof ipcRenderer;
  public webFrame: typeof webFrame;
  public remote: typeof remote;
  public childProcess: typeof childProcess;
  public fs: typeof fs;
  public os: typeof os;
  public crypto: typeof crypto;
  public path: typeof path;
  public process: typeof process;
  public net: typeof net;

  public constructor() {
    // Conditional imports
    if (this.isElectron()) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.remote = window.require('electron').remote;
      this.childProcess = window.require('child_process');
      this.fs = window.require('fs-extra');
      this.os = window.require('os');
      this.crypto = window.require('crypto');
      this.path = window.require('path');
      this.process = window.require('process');
      this.net = window.require('net');
    }
  }

  public isElectron = () => {
    return window && window.process && window.process.type;
  }
}
