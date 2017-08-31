import { IAddress } from 'botbuilder';
import { EventMessageType } from './EventMessageType';
import { HandoffEventMessage } from './HandoffEventMessage';

/**
 * HandoffEventMessage with type of __disconnect__. Requires customer and agent addresses
 *
 * Expected to be sent from agent to bot. Should set the conversation state to bot and remove the agent address from the watching agent list
 */
export class DisconnectEventMessage extends HandoffEventMessage {
    constructor(customerAddress: IAddress, agentAddress: IAddress) {
        super(EventMessageType.Disconnect, customerAddress, agentAddress);
    }
}
