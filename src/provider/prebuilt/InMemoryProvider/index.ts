import { IAddress, IMessage } from 'botbuilder';
import * as _ from 'lodash';
import { ConversationState, IConversation} from '../../../IConversation';
import { AgentAlreadyConnectedOnConversationIdException } from '../../errors/AgentAlreadyConnectedOnConversationIdException';
import { AgentAlreadyInConversationError} from '../../errors/AgentAlreadyInConversationError';
import { AgentNotInConversationError} from '../../errors/AgentNotInConversationError';
import { CustomerAlreadyConnectedException } from '../../errors/CustomerAlreadyConnectedException';
import { CustomerNotConnectedException } from '../../errors/CustomerNotConnectedException';
import { IProvider } from '../../IProvider';
import { AgentToCustomerConnectionMapper } from './AgentToCustomerConnectionMapper';
import { InMemoryConversation } from './InMemoryConversation';

export class InMemoryProvider implements IProvider {
    private conversations: Map<string, InMemoryConversation>;
    private agentToCustomerConnectionMapper: AgentToCustomerConnectionMapper;

    constructor() {
        this.conversations = new Map<string, InMemoryConversation>();
        this.agentToCustomerConnectionMapper = new AgentToCustomerConnectionMapper();
    }

    public addBotMessageToTranscript(message: IMessage): Promise<IConversation> {
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
        if (this.agentToCustomerConnectionMapper.getCustomerIdConnectedToAgent(agentAddress)) {
            return Promise.reject(new AgentAlreadyConnectedOnConversationIdException());
        }

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
            // TODO test this
            return Promise.reject(new CustomerNotConnectedException());
        }

        if (!_.isMatch(agentAddress, convo.agentAddress)) {
            // TODO test this
            return Promise.reject(new AgentNotInConversationError());
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

    private getConversationSynchronously(customerAddress: IAddress): InMemoryConversation {
        return this.conversations.get(customerAddress.user.id);
    }

    private getOrCreateNewCustomerConversationSynchronously(customerAddress: IAddress): InMemoryConversation {
        let convo: InMemoryConversation = this.conversations.get(customerAddress.user.id);

        if (!convo) {
            convo = new InMemoryConversation(customerAddress);
            this.conversations.set(customerAddress.user.id, convo);
        }

        return convo;
    }
}
