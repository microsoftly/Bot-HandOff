import { IAddress, IIdentity, IMessage } from 'botbuilder';

export enum ConversationState {
    Bot = 'bot',
    Wait = 'wait',
    Agent = 'agent'
}

export interface ITranscriptLine extends IMessage {
    // whether or not to or from should represent the conversation, user, or bot is up to the implementing code
    to: IIdentity;
    from: IIdentity;
    sentimentScore?: number;
}

// What is stored in a conversation. Agent only included if customer is talking to an agent or if agent is watching
export interface IConversation {
    customerAddress: IAddress;
    agentAddress?: IAddress;
    watchingAgents: IAddress[];
    conversationState: ConversationState;
    transcript: ITranscriptLine[];
}
