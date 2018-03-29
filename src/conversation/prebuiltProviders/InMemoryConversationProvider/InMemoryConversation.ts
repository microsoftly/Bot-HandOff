import { IAddress, IIdentity, IMessage } from 'botbuilder';
import { v4 as uuidGenerator} from 'uuid';
import { ITranscriptLine } from '../../ITranscriptLine';
import { ConversationState } from './../../ConversationState';
import { IConversation } from './../../IConversation';

export class InMemoryConversation<T extends IAddress> implements IConversation<T> {
    public readonly customerAddress: IAddress;
    public readonly transcript: ITranscriptLine[];
    public conversationState: ConversationState;
    public agentAddress?: T;

    constructor(customerAddress: IAddress) {
        this.customerAddress = customerAddress;
        this.transcript = [];
        this.conversationState = ConversationState.Bot;
        this.agentAddress = null;
    }

    public addCustomerMessageToTranscript(message: IMessage): InMemoryConversation<T> {
        const destinationIdentity = this.conversationState === ConversationState.Agent ? this.agentAddress.user : this.customerAddress.bot;

        const transcriptLine = this.convertMessageToTranscriptLine(message, destinationIdentity, message.user);

        this.transcript.push(transcriptLine);

        return this;
    }

    public addAgentMessageToTranscript(message: IMessage): InMemoryConversation<T> {
        if (!this.agentAddress) {
            // TODO make custom error
            throw new Error('cannot save an agent message without an agent address');
        }

        if (this.conversationState !== ConversationState.Agent) {
            // TODO make custom error
            throw new Error('cannot save agent messages to a conversation that is not connected to an agent');
        }

        const transcriptLine = this.convertMessageToTranscriptLine(message, this.customerAddress.user, this.agentAddress.user);

        this.transcript.push(transcriptLine);

        return this;
    }

    public addBotMessageToTranscript(message: IMessage): InMemoryConversation<T> {
        const transcriptLine = this.convertMessageToTranscriptLine(message, this.customerAddress.user, this.customerAddress.bot );

        this.transcript.push(transcriptLine);

        return this;
    }

    public enqueueCustomer(customerAddress: IAddress): InMemoryConversation<T> {
        this.conversationState = ConversationState.Queued;

        return this;
    }

    public dequeueCustomer(customerAddress: IAddress): InMemoryConversation<T> {
        this.conversationState = ConversationState.Bot;

        return this;
    }

    public connectCustomerToAgent(customerAddress: IAddress, agentAddress: T): InMemoryConversation<T> {
        this.conversationState = ConversationState.Agent;
        this.agentAddress = agentAddress;

        return this;
    }

    public disconnectCustomerFromAgent(customerAddress: IAddress): InMemoryConversation<T> {
        if (!this.agentAddress) {
            // TODO make custom error
            throw new Error('No agent to disconnect from');
        }

        this.conversationState = ConversationState.Bot;
        this.agentAddress = null;

        return this;
    }

    private convertMessageToTranscriptLine(message: IMessage, to: IIdentity, from: IIdentity): ITranscriptLine {
        return Object.assign(message, {to, from, conversationState: this.conversationState});
    }
}
