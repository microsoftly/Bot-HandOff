import { IAddress } from 'botbuilder';
import { EventMessageType } from './EventMessageType';
import { HandoffEventMessage } from './HandoffEventMessage';

/**
 * HandoffEventMessage that wraps any error. Provides the source EventMessage that caused the error and the Error that was raised
 */
export class ErrorEventMessage extends HandoffEventMessage {
    public readonly sourceEvent: HandoffEventMessage;
    public readonly error: {};

    constructor(sourceEvent: HandoffEventMessage, error: {}) {
        super(EventMessageType.Error, sourceEvent.customerAddress, sourceEvent.agentAddress);

        this.sourceEvent = sourceEvent;
        this.error = error;
    }
}
