import { IAddress } from 'botbuilder';
import { EventMessageType } from './EventMessageType';
import { HandoffEventMessage } from './HandoffEventMessage';

/**
 * HandoffEventMessage with type of __dequeue__. Requires only customer address.
 *
 * Should only be sent from the customer. Sets the conversation state to a wait state to wait for an agent to connect. Aftwards, messages
 * from the customer should be sent to the MessageReceivedWhileWaitingHandler
 */
export class DequeueEventMessage extends HandoffEventMessage {
    constructor(customerAddress: IAddress) {
        super(EventMessageType.Dequeue, customerAddress);
    }
}
