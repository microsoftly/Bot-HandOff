// import { IAddress, IIdentity, IMessage } from 'botbuilder';
// import { clone } from 'lodash';
// import { ConnectingAgentIsNotWatching } from '../../errors/AgentConnectingIsNotSameAsWatching';
// import { ConversationStateUnchangedException } from '../../errors/ConversationStateUnchangedException';
// import { ConversationState, createDefaultConversation, IConversation } from './../../../IConversation';
// import { InMemoryConversationAgentManager } from './InMemoryConversationAgentManager';

// function getConversationIdFromAddresOrString(addressOrConvoId: string | IAddress): string {
//     return typeof(addressOrConvoId) === 'string' ? addressOrConvoId : addressOrConvoId.conversation.id;
// }

// function isNewConversationStateTheSame(convo: IConversation, newState: ConversationState): boolean {
//     return convo.conversationState === newState;
// }

// export class InMemoryConversationProvider {
//     private conversations: {[s: string]: IConversation};
//     private agentManager: InMemoryConversationAgentManager;

//     constructor(conversations?: {[s: string]: IConversation}) {
//         this.conversations = conversations || {};
//         this.agentManager = new InMemoryConversationAgentManager(this.conversations);
//     }

//     public getConversationFromCustomerAddress(customerAddressOrConvoId: string | IAddress): IConversation {
//         const customerConvoId = getConversationIdFromAddresOrString(customerAddressOrConvoId);

//         this.conversations[customerConvoId] =
//             this.conversations[customerConvoId] || this.createNewConversation(customerAddressOrConvoId as IAddress);

//         return this.conversations[customerConvoId];
//     }

//     // public addToTranscriptOrCreateNewConversation(customerAddress: IAddress, message: IMessage, from?: IAddress): IConversation {
//     //     const newLine = Object.assign({from, to: message.address}, clone(message));
//     //     let convo = this.getConversationFromCustomerAddress(customerAddress);

//     //     if (!convo) {
//     //         convo = this.createNewConversation(customerAddress);
//     //     }

//     //     convo.transcript.push(newLine);

//     //     return convo;
//     // }

//     public addToTranscript(customerAddress: IAddress, message: IMessage, from: IIdentity): IConversation {
//         const convo = this.getConversationFromCustomerAddress(customerAddress);

//         if (!convo) {
//             throw new Error('conversation does not exist');
//         }

//         const newLine = Object.assign({from, to: message.address}, clone(message));

//         convo.transcript.push(newLine);

//         return convo;
//     }

//     public createNewConversation(customerAddress: IAddress): IConversation {
//         const newConvo = createDefaultConversation(customerAddress);

//         newConvo.customerAddress = customerAddress;

//         this.conversations[customerAddress.conversation.id] = newConvo;

//         return newConvo;
//     }

//     public setConversationStateToAgent(customerAddressOrConvoId: string | IAddress, agentAddress: IAddress): IConversation {
//         const convo = this.getConversationFromCustomerAddress(customerAddressOrConvoId);
//         const agentConvoId = agentAddress.conversation.id;

//         // this.agentManager.connectConversationToAgent(customerAddressOrConvoId, agentAddress);
//         this.agentManager.addWatchingAgent(customerAddressOrConvoId, agentAddress);

//         if (convo.agentAddress && convo.agentAddress.conversation.id !== agentConvoId) {
//             // tslint:disable
//             throw new ConnectingAgentIsNotWatching(`agent ${convo.agentAddress.user.name} is attempting to connect to customer ${convo.customerAddress.user.name}, but was not the same agent that was watching`);
//             //tslint:enable
//         }

//         return this.setConversationState(customerAddressOrConvoId, ConversationState.Agent, agentAddress);
//     }

//     public unsetConversationStateToAgent(customerAddressOrConvoId: string | IAddress): IConversation {
//         return this.setConversationStateToBot(customerAddressOrConvoId);
//     }

//     public setConversationStateToWait(customerAddress: string | IAddress): IConversation {
//         const convo = this.getConversationFromCustomerAddress(customerAddress);

//         return this.setConversationState(customerAddress, ConversationState.Wait);
//     }

//     public unsetConversationWait(customerConvo: string): IConversation {
//         const conversation = this.getConversationFromCustomerAddress(customerConvo);

//         return this.setConversationStateToBot(customerConvo);
//     }

//     public addWatchingAgent(customerAddress: IAddress, agentAddress: IAddress): IConversation {
//         this.agentManager.addWatchingAgent(customerAddress, agentAddress);

//         return this.getConversationFromCustomerAddress(customerAddress);
//     }

//     public removeWatchingAgent(customerAddress: IAddress, agentAddress: IAddress): IConversation {
//         this.agentManager.removeWatchingAgent(customerAddress, agentAddress);

//         return this.getConversationFromCustomerAddress(customerAddress);
//     }

//     // public setConversationStateToWatch(customerAddress: string | IAddress, agentAddress?: IAddress): IConversation {
//     //     const convo = this.getConversationFromCustomerAddress(customerAddress);
//     //     agentAddress = agentAddress || convo.agentAddress;

//     //     if (convo.conversationState === ConversationState.Wait) {
//     //         return this.setConversationStateToWaitAndWatch(customerAddress, agentAddress);
//     //     }

//     //     return this.setConversationState(customerAddress, ConversationState.Watch, agentAddress);
//     // }

//     // public unsetConversationToWatch(customerAddress: string | IAddress): IConversation {
//     //     const convo = this.getConversationFromCustomerAddress(customerAddress);

//     //     if (convo.conversationState === ConversationState.WatchAndWait) {
//     //         return this.setConversationStateToWait(customerAddress);
//     //     }

//     //     return this.setConversationStateToBot(customerAddress);
//     // }

//     // private setConversationStateToWaitAndWatch(customerAddressOrConvoId: string | IAddress, agentAddress?: IAddress): IConversation {
//     //     if (!agentAddress) {
//     //         agentAddress = this.getConversationFromCustomerAddress(customerAddressOrConvoId).agentAddress;
//     //     }

//     //     return this.setConversationState(customerAddressOrConvoId, ConversationState.WatchAndWait, agentAddress);
//     // }

//     private setConversationStateToBot(customerAddress: string | IAddress): IConversation {
//         const convo = this.getConversationFromCustomerAddress(customerAddress);

//         convo.conversationState = ConversationState.Bot;
//         delete convo.agentAddress;

//         return convo;
//     }

//     private setConversationState(customerConvo: string | IAddress, state: ConversationState, agentAddress?: IAddress): IConversation {
//         const convo = this.getConversationFromCustomerAddress(customerConvo);

//         if (isNewConversationStateTheSame(convo, state)) {
//             throw new ConversationStateUnchangedException(`conversation was already in state ${state}`);
//         }

//         convo.conversationState = state;
//         convo.agentAddress = agentAddress;

//         return convo;
//     }
// }
