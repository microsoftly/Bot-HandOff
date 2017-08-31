import { IAddress } from 'botbuilder';
import { EventMessageType } from './EventMessageType';
import { HandoffEventMessage } from './HandoffEventMessage';

/**
 * HandoffEventMessage with type of __watch__. Requires customer and agent addresses. Requires customer and agent addresses. Sets the
 *
 * conversation state to watch or wait & watch if it was already wait
 */
export class WatchEventMessage extends HandoffEventMessage {
    constructor(customerAddress: IAddress, agentAddress: IAddress) {
        super(EventMessageType.Watch, customerAddress, agentAddress);
    }
}
