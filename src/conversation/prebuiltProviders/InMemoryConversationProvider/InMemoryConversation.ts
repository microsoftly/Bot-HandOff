import { IAddress, IIdentity, IMessage } from 'botbuilder';
import { v4 as uuidGenerator} from 'uuid';
import { ITranscriptLine } from '../../ITranscriptLine';
import { ConversationState } from './../../ConversationState';
import { IConversation } from './../../IConversation';

//tslint:disable-next-line
function updateLastModifiedTimestamp<T>(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
    const originalFunction = descriptor.value;

    descriptor.value =  function(): InMemoryConversation<T> {
        const args = [].slice.call(arguments, 0);

        //tslint:disable-next-line no-invalid-this
        const retVal = originalFunction.apply(this, args);

        retVal.lastModified = new Date().toISOString();

        return retVal;
    };
}

//tslint:disable-next-line
function requiresAgentAddress<T extends IAddress>(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
    const originalFunction = descriptor.value;

    descriptor.value =  function(): InMemoryConversation<T> {
        //tslint:disable-next-line no-invalid-this
        if (!(this as InMemoryConversation<T>).agentAddress) {
            throw new Error(`${propertyKey} requires an agent address to be defined on the conversation`);
        }

        const args = [].slice.call(arguments, 0);

        //tslint:disable-next-line no-invalid-this
        return  originalFunction.apply(this, args);
    };
}

function requireConversationState<T extends IAddress>(...conversationStates: ConversationState[]): Function {
    //tslint:disable-next-line
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
        const originalFunction = descriptor.value;

        descriptor.value =  function(): InMemoryConversation<T> {
            const containsValidConversationState =
                conversationStates.some(
                    //tslint:disable-next-line no-invalid-this
                    (conversationState: ConversationState) => (this as InMemoryConversation<T>).conversationState === conversationState);

            if (!containsValidConversationState) {
                throw new Error(`${propertyKey} requires a conversation state of
                    ${conversationStates.map((convoState: ConversationState) => convoState.toString), toString()}`);
            }

            const args = [].slice.call(arguments, 0);

            //tslint:disable-next-line no-invalid-this
            return  originalFunction.apply(this, args);
        };
    };
}

export class InMemoryConversation<T> implements IConversation<T> {
    public readonly customerAddress: IAddress;
    public readonly createdAt: Date;
    public transcript: ITranscriptLine[];
    public conversationState: ConversationState;
    public agentAddress?: IAddress;
    public lastModified: Date;
    public metadata: T;

    constructor(customerAddress: IAddress, createdAt?: Date) {
        this.customerAddress = customerAddress;
        this.transcript = [];
        this.conversationState = ConversationState.Bot;
        this.agentAddress = null;
        this.createdAt = createdAt || new Date();
    }

    @updateLastModifiedTimestamp
    public addCustomerMessageToTranscript(message: IMessage): InMemoryConversation<T> {
        const destinationIdentity = this.conversationState === ConversationState.Agent ? this.agentAddress.user : this.customerAddress.bot;

        const transcriptLine = this.convertMessageToTranscriptLine(message, destinationIdentity, message.user);

        this.transcript.push(transcriptLine);

        return this;
    }

    @requiresAgentAddress
    @requireConversationState(ConversationState.Agent)
    @updateLastModifiedTimestamp
    public addAgentMessageToTranscript(message: IMessage): InMemoryConversation<T> {
        const transcriptLine = this.convertMessageToTranscriptLine(message, this.customerAddress.user, this.agentAddress.user);

        this.transcript.push(transcriptLine);

        return this;
    }

    @updateLastModifiedTimestamp
    public addBotMessageToTranscript(message: IMessage): InMemoryConversation<T> {
        const transcriptLine = this.convertMessageToTranscriptLine(message, this.customerAddress.user, this.customerAddress.bot );

        this.transcript.push(transcriptLine);

        return this;
    }

    @updateLastModifiedTimestamp
    public enqueueCustomer(customerAddress: IAddress): InMemoryConversation<T> {
        this.conversationState = ConversationState.Queued;

        return this;
    }

    @requireConversationState(ConversationState.Queued)
    @updateLastModifiedTimestamp
    public dequeueCustomer(customerAddress: IAddress): InMemoryConversation<T> {
        this.conversationState = ConversationState.Bot;

        return this;
    }

    @updateLastModifiedTimestamp
    public connectCustomerToAgent(agentAddress: IAddress): InMemoryConversation<T> {
        this.conversationState = ConversationState.Agent;
        this.agentAddress = agentAddress;

        return this;
    }

    @requireConversationState(ConversationState.Agent)
    @requiresAgentAddress
    @updateLastModifiedTimestamp
    public disconnectCustomerFromAgent(): InMemoryConversation<T> {
        this.conversationState = ConversationState.Bot;
        this.agentAddress = null;

        return this;
    }

    // tslint:disable-next-line member-ordering
    public static from<K>(otherConvo: IConversation<K>): InMemoryConversation<K> {
        const newConvo = new InMemoryConversation<K>(otherConvo.customerAddress, otherConvo.createdAt);

        newConvo.agentAddress = Object.assign({}, otherConvo.agentAddress);
        newConvo.conversationState = otherConvo.conversationState;
        newConvo.transcript = otherConvo.transcript.map((transcriptLine: ITranscriptLine) => Object.assign({}, transcriptLine));
        newConvo.lastModified = otherConvo.lastModified;

        return newConvo;
    }

    private convertMessageToTranscriptLine(message: IMessage, to: IIdentity, from: IIdentity): ITranscriptLine {
        return Object.assign({timestamp: new Date().toISOString()}, message, {to, from, conversationState: this.conversationState});
    }
}
