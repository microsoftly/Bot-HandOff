import { IAddress, IIdentity, IMessage } from 'botbuilder';
import { isEqual, isMatch, remove } from 'lodash';
import { ConversationState, IConversation, ITranscriptLine } from '../../../IConversation';

export class InMemoryConversation implements IConversation {
    public readonly customerAddress: IAddress;
    public readonly watchingAgents: IAddress[];
    public readonly transcript: ITranscriptLine[];
    public conversationState: ConversationState;
    public agentAddress?: IAddress;

    constructor(customerAddress: IAddress) {
        this.customerAddress = customerAddress;
        this.watchingAgents = [];
        this.transcript = [];
        this.conversationState = ConversationState.Bot;
    }

    /**
     * returns true if agent was added. False if agent was already in collection
     * @param agentAddress
     */
    public addWatchingAgent(agentAddress: IAddress): boolean {
        const agentAlreadyWatching = !!this.watchingAgents.find((curAgentAddress: IAddress) => isEqual(curAgentAddress, agentAddress));

        if (!agentAlreadyWatching) {
            this.watchingAgents.push(agentAddress);
        }

        return !agentAlreadyWatching;
    }

    /**
     * returns true if agent was removed. False if agent was not watching
     * @param agentAddress
     */
    public removeWatchingAgent(agentAddress: IAddress): boolean {
        const removedAgents = remove(this.watchingAgents, (addr: IAddress) => isEqual(addr, agentAddress));

        return !!removedAgents.length;
    }

    public setConversationStateToBot(): void {
        this.conversationState = ConversationState.Bot;
    }

    public setConversationStateToAgent(agentAddress: IAddress): void {
        this.conversationState = ConversationState.Agent;
        this.agentAddress = agentAddress;
        this.addWatchingAgent(agentAddress);
    }

    public disconnectFromAgent(agentAddress: IAddress): void {
        this.conversationState = ConversationState.Bot;
        this.agentAddress = undefined;
        this.removeWatchingAgent(agentAddress);
    }

    public setConversationStateToWait(): void {
        this.conversationState = ConversationState.Wait;
    }

    public agentIsConnectedAgent(agentAddress: IAddress): boolean {
        if (!this.agentAddress || this.conversationState !== ConversationState.Agent) {
            return false;
        }

        return isMatch(agentAddress, this.agentAddress);
    }

    public addCustomerMessage(message: IMessage): void {
        const to = this.conversationState === ConversationState.Agent ? this.agentAddress.user : message.address.bot;
        const from = message.address.user;

        this.addTranscriptLine(message, to, from);
    }

    public addBotMessage(message: IMessage): void {
        // if for whatever reason the bot starts sending messages to the agents, the message's address will always represent the correct
        // destination for bot messages
        const to = message.address.user;
        const from = message.address.bot;

        this.addTranscriptLine(message, to, from);
    }

    public addAgentMessage(message: IMessage): void {
        const to = this.customerAddress.user;
        const from = this.agentAddress.user;

        this.addTranscriptLine(message, to, from);
    }

    private addTranscriptLine(message: IMessage, to: IIdentity, from: IIdentity): void {
        const newLine = Object.assign({ to, from }, message);

        this.transcript.push(newLine);
    }
}
