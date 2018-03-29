import { IAddress, IMessage } from 'botbuilder';
import { IConversation } from '../../IConversation';
import { IConversationProvider } from './../../IConversationProvider';
import { InMemoryConversation } from './InMemoryConversation';

export class InMemoryConversationProvider<T extends IAddress> implements IConversationProvider<T> {
    private readonly conversations: Map<string, InMemoryConversation<T>>;
    private readonly agentToCustomerSerializedAddressMap: Map<string, string>;

    public constructor() {
        this.conversations = new Map<string, InMemoryConversation<T>>();
        this.agentToCustomerSerializedAddressMap = new Map<string, string>();
    }

    public addCustomerMessageToTranscript(message: IMessage): Promise<IConversation<T>> {
        const serializedCustomerAddress = this.serializeAddress(message.address);

        let customerConversation: InMemoryConversation<T>;

        if (this.conversations.has(serializedCustomerAddress)) {
            customerConversation = this.conversations.get(serializedCustomerAddress);
        } else {
            customerConversation = new InMemoryConversation(message.address);

            this.conversations.set(serializedCustomerAddress, customerConversation);
        }

        customerConversation.addCustomerMessageToTranscript(message);

        return Promise.resolve(customerConversation);
    }

    public addAgentMessageToTranscript(message: IMessage): Promise<IConversation<T>> {
        throw new Error('not implemented yet');
    }

    public async addBotMessageToTranscript(message: IMessage): Promise<IConversation<T>> {
        const serializedCustomerAddress = this.serializeAddress(message.address);

        const convo = this.conversations.get(serializedCustomerAddress);

        if (!convo) {
            // TODO make custom error
            throw new Error('bot is responding to a conversation that has no transcript');
        }

        return Promise.resolve(await convo.addBotMessageToTranscript(message));
    }

    public enqueueCustomer(customerAddress: IAddress): Promise<IConversation<T>> {
        throw new Error('not implemented yet');
    }

    public dequeueCustomer(customerAddress: IAddress): Promise<IConversation<T>> {
        throw new Error('not implemented yet');
    }

    public connectCustomerToAgent(customerAddress: IAddress, agentAddress: T): Promise<IConversation<T>> {
        throw new Error('not implemented yet');
    }

    public disconnectCustomerFromAgent(customerAddress: IAddress): Promise<IConversation<T>> {
        throw new Error('not implemented yet');
    }

    public getConversationFromCustomerAddress(customerAddress: IAddress): Promise<IConversation<T>> {
        const serializedCustomerAddress = this.serializeAddress(customerAddress);

        return Promise.resolve(this.conversations.get(serializedCustomerAddress));
    }

    public async getConversationFromAgentAddress(agentAddress: T): Promise<IConversation<T>> {
        // this.conversations.entries().
        this.conversations.forEach((conversation: InMemoryConversation<T>) => {

        });
    }

    private serializeAddress(address: IAddress): string {
        return JSON.stringify(address);
    }
}
