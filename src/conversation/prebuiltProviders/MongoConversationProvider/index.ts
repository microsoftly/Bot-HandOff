import { IAddress, IMessage } from 'botbuilder';
import { IConversation } from '../../IConversation';
import { IConversationProvider } from './../../IConversationProvider';

export class MongoConversationProvider<T extends IAddress> implements IConversationProvider<T> {
    /**
     * transcribes a message for a customer
     *
     * @param message message to be transcribed
     */
    public async addCustomerMessageToTranscript(message: IMessage): Promise<IConversation<T>> {

    }

    /**
     * transcribes a message for an Agent
     *
     * @param message message to be transcribed
     */
    public async addAgentMessageToTranscript(message: IMessage): Promise<IConversation<T>> {

    }

    /**
     * transcribes a message for a bot.
     *
     * @param message message to be transcribed
     */
    public async addBotMessageToTranscript(message: IMessage): Promise<IConversation<T>> {

    }

    public async enqueueCustomer(customerAddress: IAddress): Promise<IConversation<T>> {

    }

    public async dequeueCustomer(customerAddress: IAddress): Promise<IConversation<T>> {

    }

    public async connectCustomerToAgent(customerAddress: IAddress, agentAddress: T): Promise<IConversation<T>> {

    }

    public async disconnectCustomerFromAgent(customerAddress: IAddress): Promise<IConversation<T>> {

    }

    public async disconnectAgentFromCustomer(agentAddress: T): Promise<IConversation<T>> {

    }

    public async getConversationFromCustomerAddress(customerAddress: IAddress): Promise<IConversation<T>> {

    }

    public async getConversationFromAgentAddress(agentAddress: T): Promise<IConversation<T>> {

    }
}
