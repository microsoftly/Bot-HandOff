import { IAddress, IMessage, UniversalBot } from 'botbuilder';
import { isEqual } from 'lodash';

export function sendMirrorMessages(bot: UniversalBot, message: IMessage, addresses: IAddress | IAddress[]): void {
    if (!(addresses instanceof Array)) {
        addresses = [addresses];
    }
    const messages = addresses.map((address: IAddress) => Object.assign({}, message, { address }));

    bot.send(messages);
}

export function removeAddressFromAddressCollection(addressCollection: IAddress[], addressToRemove: IAddress): IAddress[] {
    return addressCollection.filter((address: IAddress) => !isEqual(address, addressToRemove));
}
