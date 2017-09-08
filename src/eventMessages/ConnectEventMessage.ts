import { IAddress } from 'botbuilder';
import { EventMessageType } from './EventMessageType';
import { HandoffEventMessage } from './HandoffEventMessage';

/**
 * HandoffEventMessage with type of __connect__. Requires customer and agent addresses.
 *
 * Expected to be sent from agent to bot. Should add the agent addresss to the watching agents list and set the conversation state to Agent
 * to connect the agent and customer
 */
export class ConnectEventMessage extends HandoffEventMessage {
    constructor(customerAddress: IAddress, agentAddress: IAddress) {
        super(EventMessageType.Connect, customerAddress, agentAddress);
    }
}
