import { IAddress } from 'botbuilder';

export class AgentToCustomerConnectionMapper {
    private convoIdToCustomerIdMap: Map<string, string>;

    constructor() {
        this.convoIdToCustomerIdMap = new Map<string, string>();
    }

    public connectCustomerToAgent(customerAddress: IAddress, agentAddress: IAddress): void {
        this.convoIdToCustomerIdMap.set(agentAddress.conversation.id, customerAddress.user.id);
    }

    public disconnectCustomerFromAgent(customerAddress: IAddress, agentAddress: IAddress): void {
        this.convoIdToCustomerIdMap.delete(agentAddress.conversation.id);
    }

    public getCustomerIdConnectedToAgent(agentAddress: IAddress): string {
        return this.convoIdToCustomerIdMap.get(agentAddress.conversation.id);
    }
}
