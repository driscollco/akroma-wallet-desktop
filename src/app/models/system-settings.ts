import { PouchEntity } from './pouch-entity';

export interface SystemSettings extends PouchEntity {
    // this is the location of geth
    clientPath: string;
    // this is the location of the akroma wallet applications storage
    applicationPath: string;
    syncMode: string;
    akromaNode: string;
}
