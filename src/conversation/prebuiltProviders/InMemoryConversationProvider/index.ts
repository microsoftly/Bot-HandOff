import { IAddress, IMessage } from 'botbuilder';
import { IConversation } from '../../IConversation';
import { IConversationProvider } from './../../IConversationProvider';
import { InMemoryConversation } from './InMemoryConversation';

export class InMemoryConversationProvider<T extends IAddress> implements IConversationProvider<T> {
    private readonly conversations: Map<string, InMemoryConversation<T>>;

    public constructor() {
        this.conversations = new Map<string, InMemoryConversation<T>>();
    }

    public async addCustomerMessageToTranscript(message: IMessage): Promise<IConversation<T>> {
        const serializedCustomerAddress = this.serializeAddress(message.address);

        let customerConversation: InMemoryConversation<T>;

        if (this.conversations.has(serializedCustomerAddress)) {
            customerConversation = this.conversations.get(serializedCustomerAddress);
        } else {
            customerConversation = new InMemoryConversation(message.address);

            this.conversations.set(serializedCustomerAddress, customerConversation);
        }

        customerConversation.addCustomerMessageToTranscript(message);

        return customerConversation;
    }

    public addAgentMessageToTranscript(message: IMessage): Promise<IConversation<T>> {
        throw new Error('not implemented yet');
    }

    public addBotMessageToTranscript(message: IMessage): Promise<IConversation<T>> {
        throw new Error('not implemented yet');
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

    private serializeAddress(address: IAddress): string {
        return JSON.stringify(address);
    }
}
