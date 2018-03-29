import { IAddress } from 'botbuilder';
import { ConversationState } from './ConversationState';
import { ITranscriptLine } from './ITranscriptLine';

export interface IConversation<T extends IAddress> {
    customerAddress: IAddress;

    agentAddress?: T;

    // TODO add replication addresses
    conversationState: ConversationState;
    transcript: ITranscriptLine[];
}
