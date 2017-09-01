import * as Promise from 'bluebird';
import { IAddress, IMessage } from 'botbuilder';
import { IConversation } from '../IConversation';
// import { IHandoffMessage } from './../IHandoffMessage';

export interface IProvider {

    /**
     * transcribes a message for a customer
     *
     * @param message message to be transcribed
     */
    addCustomerMessageToTranscript(message: IMessage): Promise<IConversation>;

    /**
     * transcribes a message for an Agent
     *
     * @param message message to be transcribed
     */
    addAgentMessageToTranscript(message: IMessage): Promise<IConversation>;

    /**
     * transcribes a message for a bot
     *
     * @param message message to be transcribed
     */
    addBotMessageToTranscript(message: IMessage): Promise<IConversation>;

    /**
     * transcribes a message for a bot. Will not throw any checked (known) exceptions
     *
     * @param message message to be transcribed
     */
    addBotMessageToTranscriptIgnoringConversationState(message: IMessage): Promise<IConversation>;
    /*
        there are 3 basic pairwise actions that can be performed
            1. connect/disconnect customer to/from agent
            2. queue/dequeue customer for agent
            3. watch/unwatch customer conversation (agent)
    */

    /**
     * sets customer conversation state to Agent. Sets agentAddress for conversation to agentAddress. Adds agent address to watching agent
     * list, if not already present
     *
     * @param customerAddress address of customer being connected
     * @param agentAddress address of agent being connected
     */
    connectCustomerToAgent(customerAddress: IAddress, agentAddress: IAddress): Promise<IConversation>;

    /**
     * sets customer conversation state to Bot. Sets agentAddress for conversation to agentAddress. Adds agent address to watching agent
     * list, if not already present
     *
     * @param customerAddress address of customer being disconnected
     * @param agentAddress address of agent being disconnected
     */
    disconnectCustomerFromAgent(customerAddress: IAddress, agentAddress: IAddress): Promise<IConversation>;

    queueCustomerForAgent(customerAddress: IAddress): Promise<IConversation>;
    dequeueCustomerForAgent(customerAddress: IAddress): Promise<IConversation>;

    watchConversation(customerAddress: IAddress, agentAddress: IAddress): Promise<IConversation>;
    unwatchConversation(customerAddress: IAddress, agentAddress: IAddress): Promise<IConversation>;

    getConversationFromCustomerAddress(customerAddress: IAddress): Promise<IConversation>;
    getOrCreateNewCustomerConversation(customerAddress: IAddress): Promise<IConversation>;
    getConversationFromAgentAddress(agentAddress: IAddress): Promise<IConversation>;
    getAllConversations(): Promise<IConversation[]>;
}
