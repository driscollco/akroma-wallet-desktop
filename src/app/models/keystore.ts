export class KeyStore {
    timestamp: Date;
    calculatedBlockStart: number;

    constructor(timestamp: Date, calculatedBlockStart: number) {
        this.timestamp = timestamp;
        this.calculatedBlockStart = calculatedBlockStart;
    }
}