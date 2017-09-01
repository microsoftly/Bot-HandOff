import { IAddress } from 'botbuilder';

export class AgentToCustomerConnectionMapper {
    private convoIdToCustomerIdMap: Map<string, string>;

    constructor() {
        this.convoIdToCustomerIdMap = new Map<string, string>();
    }

    public connectCustomerToAgent(customerAddress: IAddress, agentAddress: IAddress): void {
        // TODO add error checking
        this.convoIdToCustomerIdMap.set(agentAddress.conversation.id, customerAddress.user.id);
    }

    public disconnectCustomerFromAgent(customerAddress: IAddress, agentAddress: IAddress): void {
        // TODO add error checking
        this.convoIdToCustomerIdMap.delete(agentAddress.conversation.id);
    }

    public getCustomerIdConnectedToAgent(agentAddress: IAddress): string {
        // TODO add error checking
        return this.convoIdToCustomerIdMap.get(agentAddress.conversation.id);
    }
}
