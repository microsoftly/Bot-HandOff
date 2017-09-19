export class CustomerNotConnectedException extends Error {
    constructor(msg: string = 'Attempted to perform operation on a non-connected customer') {
        super(msg);

        this.name = 'CustomerNotConnectedException';

        Object.setPrototypeOf(this, CustomerNotConnectedException.prototype);
    }
}
