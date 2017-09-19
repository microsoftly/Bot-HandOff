import { IAddress, IMessage } from 'botbuilder';
import { IConversation } from '../IConversation';

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
     * transcribes a message for a bot.
     *
     * @param message message to be transcribed
     */
    addBotMessageToTranscript(message: IMessage): Promise<IConversation>;
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

    /**
     * sets the customer conversation state to wait.
     *
     * @param customerAddress address of customer being queued
     */
    queueCustomerForAgent(customerAddress: IAddress): Promise<IConversation>;

    /**
     * unsets the customer conversation state from wait to bot.
     *
     * @param customerAddress address of customer being queued
     */
    dequeueCustomerForAgent(customerAddress: IAddress): Promise<IConversation>;

    /**
     * adds agent address to the watching agents collection
     *
     * @param customerAddress customer conversation being watched
     * @param agentAddress address of agent that is watching the conversation
     */
    watchConversation(customerAddress: IAddress, agentAddress: IAddress): Promise<IConversation>;

    /**
     * removes agent address to the watching agents collection
     *
     * @param customerAddress customer conversation being watched
     * @param agentAddress address of agent that should be removed from the watching agents collection
     */
    unwatchConversation(customerAddress: IAddress, agentAddress: IAddress): Promise<IConversation>;

    /**
     * retrieves the conversation associated with customerAddress
     *
     * @param customerAddress customer address for conversation
     */
    getConversationFromCustomerAddress(customerAddress: IAddress): Promise<IConversation>;

    /**
     * retrieves the conversation associated with customerAddress. If one does not exist, a new one is created and returned
     *
     * @param customerAddress customer address for conversation
     */
    getOrCreateNewCustomerConversation(customerAddress: IAddress): Promise<IConversation>;

    /**
     * retrieves a conversation from an agent address
     *
     * @param agentAddress agent address associated with conversation being retrieved
     */
    getConversationFromAgentAddress(agentAddress: IAddress): Promise<IConversation>;

    /**
     * gets all conversations
     */
    getAllConversations(): Promise<IConversation[]>;
}
