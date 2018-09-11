import { Injectable } from '@angular/core';
import { ElectronService } from '../providers/electron.service';

@Injectable()
export class FileActionService {
  constructor(private es: ElectronService) {
  }
  public async copy(src: string, dest: string) {
    console.log('​FileActionService -> publicasynccopy -> src', src);
    console.log('​FileActionService -> publicasynccopy -> dest', dest);

    if (src !== dest) {
      this.es.fs.access(src, (err) => {
        if (err) { console.error('[ access error in copy() ]', err); }
        else {
          try { this.es.fs.copySync(src, dest) }
          catch (err) { console.error(`[ copy error ]`, err) };
        }
      });

    }
    else { console.log('[ copy: will not overwrite self ]') };
  }
}
