import { IAddress, IMessage } from 'botbuilder';
import { IConversation } from './IConversation';

export interface IConversationProvider<T extends IAddress> {
    /**
     * transcribes a message for a customer
     *
     * @param message message to be transcribed
     */
    addCustomerMessageToTranscript(message: IMessage): Promise<IConversation<T>>;

    /**
     * transcribes a message for an Agent
     *
     * @param message message to be transcribed
     */
    addAgentMessageToTranscript(message: IMessage): Promise<IConversation<T>>;

    /**
     * transcribes a message for a bot.
     *
     * @param message message to be transcribed
     */
    addBotMessageToTranscript(message: IMessage): Promise<IConversation<T>>;

    enqueueCustomer(customerAddress: IAddress): Promise<IConversation<T>>;

    dequeueCustomer(customerAddress: IAddress): Promise<IConversation<T>>;

    connectCustomerToAgent(customerAddress: IAddress, agentAddress: T): Promise<IConversation<T>>;

    disconnectCustomerFromAgent(customerAddress: IAddress): Promise<IConversation<T>>;

    disconnectAgentFromCustomer(agentAddress: T): Promise<IConversation<T>>;

    getConversationFromCustomerAddress(customerAddress: IAddress): Promise<IConversation<T>>;

    getConversationFromAgentAddress(agentAddress: T): Promise<IConversation<T>>;
}
