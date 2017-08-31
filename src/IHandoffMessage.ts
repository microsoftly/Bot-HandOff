import { IAddress, IMessage, Message } from 'botbuilder';

export enum MessageSource {
    Bot = 'Bot',
    Agent = 'Agent',
    Customer = 'Customer'
}

export interface IHandoffMessage extends IMessage {
    customerAddress?: IAddress;
    agentAddress?: IAddress;
}
