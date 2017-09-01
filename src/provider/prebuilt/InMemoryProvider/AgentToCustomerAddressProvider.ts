// import { IAddress, IIdentity } from 'botbuilder';

// export class AgentToCustomerAddressProvider {
//     private agentToCustomerAddressMap: Map<string, IAddress>;

//     constructor() {
//         this.agentToCustomerAddressMap = new Map<string, IAddress>();
//     }

//     public getCustomerAddress(agentId: IIdentity): IAddress {
//         return this.agentToCustomerAddressMap.get(agentId.id);
//     }

//     public linkCustomerAddressToAgentConvoId(agentId: IIdentity, customerAddress: IAddress): void {
//         this.agentToCustomerAddressMap.set(agentId.id, customerAddress);
//     }

//     public removeAgentConvoId(agentId: IIdentity): void {
//         this.agentToCustomerAddressMap.delete(agentId.id);
//     }
// }
