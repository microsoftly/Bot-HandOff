import { IAddress, IMessage, Session } from 'botbuilder';
import { IConversation } from './../conversation/IConversation';

export interface IAgentAddressAndMetadata<T> {
    agentAddress: IAddress;
    metadata?: T;
}

export interface IAgentService<T> {
    idleDisconnectTimeMs?: number;

    //tslint:disable-next-line
    queueForAgent(customerAddress: IAddress): Promise<IAgentAddressAndMetadata<T>>;
    //tslint:disable-next-line
    sendMessageToAgent(message: IMessage, metadata?: T): Promise<T | void>; 

    getAgentChannelId(): string;

    //tslint:disable-next-line
    listenForAgentMessages?(agentAddress: IAddress, onMessageReceived: (messageFromAgent: IMessage) => any, metadata?: T): any;
}
