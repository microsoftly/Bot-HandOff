import { IAddress } from 'botbuilder';
import { EventMessageType } from './EventMessageType';
import { HandoffEventMessage } from './HandoffEventMessage';

/**
 * HandoffEventMessage with type of __unwatch__. Requires customer and agent addresses. Sets the conversation state to bot or wait if it
 * was wait & watch.
 */
export class UnwatchEventMessage extends HandoffEventMessage {
    constructor(customerAddress: IAddress, agentAddress: IAddress) {
        super(EventMessageType.Unwatch, customerAddress, agentAddress);
    }
}
