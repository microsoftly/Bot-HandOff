import { IIdentity, IMessage } from 'botbuilder';
import { ConversationState } from './ConversationState';

export interface ITranscriptLine extends IMessage {
    to: IIdentity;
    from: IIdentity;
    conversationState: ConversationState;
}
