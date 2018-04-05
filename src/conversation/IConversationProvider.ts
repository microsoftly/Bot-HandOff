import { IAddress, IMessage } from 'botbuilder';
import { IConversation } from './IConversation';

export interface IConversationProvider<T> {
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

    connectCustomerToAgent(customerAddress: IAddress, agentAddress: IAddress): Promise<IConversation<T>>;

    disconnectCustomerFromAgent(customerAddress: IAddress): Promise<IConversation<T>>;

    disconnectAgentFromCustomer(agentAddress: IAddress): Promise<IConversation<T>>;

    getConversationFromCustomerAddress(customerAddress: IAddress): Promise<IConversation<T>>;

    getConversationFromAgentAddress(agentAddress: IAddress): Promise<IConversation<T>>;

    //tslint:disable-next-line
    closeOpenConnections(...any): Promise<any>;

    getConversationsConnectedToAgent(minTime?: Date): Promise<IConversation<T>[]>;

    upsertMetadataUsingCustomerAddress(customerAddress: IAddress, metadata: T): Promise<IConversation<T>>;

    upsertMetadataUsingAgentAddress(agentAddress: IAddress, metadata: T): Promise<IConversation<T>>;
}
