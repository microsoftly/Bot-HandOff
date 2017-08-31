import { IAddress } from 'botbuilder';
import { EventMessageType } from './EventMessageType';
import { HandoffEventMessage } from './HandoffEventMessage';

/**
 * HandoffEventMessage with type of __queue__. Requires only customer address
 *
 * when sent from the customer to the bot, it should set the conversation state to wait or watch & wait state if the conversation was
 * already in a watch state
 */
export class QueueEventMessage extends HandoffEventMessage {
    constructor(customerAddress: IAddress) {
        super(EventMessageType.Queue, customerAddress);
    }
}
