import { IAddress, IMessage, Session } from 'botbuilder';
import { IConversation } from './../conversation/IConversation';

export interface IAgentService<T extends IAddress> {
    idleDisconnectTimeMs?: number;

    //tslint:disable-next-line
    queueForAgent(session: Session): Promise<T>;
    //tslint:disable-next-line
    sendMessageToAgent(message: IMessage): Promise<IMessage>; 

    getAgentChannelId(): string;

    //tslint:disable-next-line
    listenForAgentMessages?(conversation: IConversation<T>, onMessageReceived: (message: IMessage) => any): any;
}
