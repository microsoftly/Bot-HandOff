import * as Promise from 'bluebird';
import { IAddress, IMessage } from 'botbuilder';
import * as _ from 'lodash';
import { ConversationState, IConversation} from '../../../IConversation';
// import { IMessage } from '../../../IMessage';
import { AgentAlreadyInConversationError} from '../../errors/AgentAlreadyInConversationError';
import { AgentNotInConversationError} from '../../errors/AgentNotInConversationError';
import { BotAttemptedToRecordMessageWhileAgentHasConnection} from '../../errors/BotAttemptedToRecordMessageWhileAgentHasConnection';
import { CustomerAlreadyConnectedException } from '../../errors/CustomerAlreadyConnectedException';
import { IProvider } from '../../IProvider';
import { AgentToCustomerConnectionMapper } from './AgentToCustomerConnectionMapper';
import { Conversation } from './Conversation';

export class InMemoryProvider implements IProvider {
    private conversations: Map<string, Conversation>;
    private agentToCustomerConnectionMapper: AgentToCustomerConnectionMapper;

    constructor() {
        this.conversations = new Map<string, Conversation>();
        this.agentToCustomerConnectionMapper = new AgentToCustomerConnectionMapper();
    }

    public addBotMessageToTranscript(message: IMessage): Promise<IConversation> {
        const customerAddress = message.address;

        const convo = this.conversations.get(customerAddress.user.id);

        if (convo && convo.conversationState === ConversationState.Agent) {
            return Promise.reject(new BotAttemptedToRecordMessageWhileAgentHasConnection(customerAddress.conversation.id));
        }

        return this.addBotMessageToTranscriptIgnoringConversationState(message);
    }

    public addBotMessageToTranscriptIgnoringConversationState(message: IMessage): Promise<IConversation> {
        const customerAddress = message.address;
        const convo = this.getConversationSynchronously(customerAddress);

        convo.addBotMessage(message);

        return Promise.resolve(convo);
    }

    public addCustomerMessageToTranscript(message: IMessage): Promise<IConversation> {
        const customerAddress = message.address;
        const convo = this.getOrCreateNewCustomerConversationSynchronously(customerAddress);

        convo.addCustomerMessage(message);

        return Promise.resolve(convo);
    }

    public addAgentMessageToTranscript(message: IMessage): Promise<IConversation> {
        const agentAddress = message.address;
        const customerId = this.agentToCustomerConnectionMapper.getCustomerIdConnectedToAgent(agentAddress);
        const convo = this.conversations.get(customerId);

        if (!convo) {
            const rejectionMessage = `no customer conversation found for agent with conversation id ${agentAddress.conversation.id}`;

            return Promise.reject(new AgentNotInConversationError(agentAddress.conversation.id));
        }

        if (convo.conversationState !== ConversationState.Agent) {
            convo.setConversationStateToAgent(agentAddress);
        }

        convo.addAgentMessage(message);

        return Promise.resolve(convo);
    }

    public getConversationFromCustomerAddress(customerAddress: IAddress): Promise<IConversation> {
        return Promise.resolve(this.conversations.get(customerAddress.user.id));
    }

    // CONNECT/DISCONNECT ACTIONS
    public connectCustomerToAgent(customerAddress: IAddress, agentAddress: IAddress): Promise<IConversation> {
        const convo = this.conversations.get(customerAddress.user.id);

        if (convo.conversationState === ConversationState.Agent) {
            if (convo.agentIsConnectedAgent(agentAddress)) {
                return Promise.reject(new AgentAlreadyInConversationError(agentAddress.user.id));
            } else {
                return Promise.reject(
                    new CustomerAlreadyConnectedException(`customer ${customerAddress.user.name} is already speaking to an agent`));
            }
        }

        this.agentToCustomerConnectionMapper.connectCustomerToAgent(customerAddress, agentAddress);
        convo.setConversationStateToAgent(agentAddress);

        return Promise.resolve(convo);
    }

    public disconnectCustomerFromAgent(customerAddress: IAddress, agentAddress: IAddress): Promise<IConversation> {
        const convo = this.getConversationSynchronously(customerAddress);

        if (convo.conversationState !== ConversationState.Agent) {
            // TODO throw customer not connected exception
        }

        if (!_.isMatch(agentAddress, convo.customerAddress)) {
            // TODO throw disconnecting agent is not the connected agent error
        }

        this.agentToCustomerConnectionMapper.disconnectCustomerFromAgent(customerAddress, agentAddress);
        convo.disconnectFromAgent(agentAddress);

        return Promise.resolve(convo);
    }

    // QUEUE/DEQUEUE ACTIONS
    public queueCustomerForAgent(customerAddress: IAddress): Promise<IConversation> {
        const convo = this.getConversationSynchronously(customerAddress);

        // TODO add checks for queueability
        convo.setConversationStateToWait();

        return Promise.resolve(convo);
    }

    public dequeueCustomerForAgent(customerAddress: IAddress): Promise<IConversation> {
        const convo = this.getConversationSynchronously(customerAddress);

        // TODO add checks for dequeability
        convo.setConversationStateToBot();

        return Promise.resolve(convo);
    }

    // WATCH/UNWATCH ACTIONS
    public watchConversation(customerAddress: IAddress, agentAddress: IAddress): Promise<IConversation> {
        const convo = this.getConversationSynchronously(customerAddress);

        convo.addWatchingAgent(agentAddress);

        return Promise.resolve(convo);
    }

    public unwatchConversation(customerAddress: IAddress, agentAddress: IAddress): Promise<IConversation> {
        const convo = this.getConversationSynchronously(customerAddress);

        convo.removeWatchingAgent(agentAddress);

        return Promise.resolve(convo);
    }

    public getOrCreateNewCustomerConversation(customerAddress: IAddress): Promise<IConversation> {
        return Promise.resolve(this.getOrCreateNewCustomerConversationSynchronously(customerAddress));
    }

    public getConversationFromAgentAddress(agentAddress: IAddress): Promise<IConversation> {
        const customerId = this.agentToCustomerConnectionMapper.getCustomerIdConnectedToAgent(agentAddress);

        if (customerId) {
            return Promise.resolve(this.conversations.get(customerId));
        }

        return Promise.resolve(undefined);
    }

    public getAllConversations(): Promise<IConversation[]> {
        return Promise.resolve(Array.from(this.conversations.values()));
    }

    private getConversationSynchronously(customerAddress: IAddress): Conversation {
        return this.conversations.get(customerAddress.user.id);
    }

    private getOrCreateNewCustomerConversationSynchronously(customerAddress: IAddress): Conversation {
        let convo: Conversation = this.conversations.get(customerAddress.user.id);

        if (!convo) {
            convo = new Conversation(customerAddress);
            this.conversations.set(customerAddress.user.id, convo);
        }

        return convo;
    }
}
