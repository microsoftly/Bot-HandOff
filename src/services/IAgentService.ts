import { IAddress, IMessage, Session } from 'botbuilder';

export interface IAgentService<T extends IAddress> {
    //tslint:disable-next-line
    queueForAgent(session: Session): Promise<T>;
    //tslint:disable-next-line
    sendMessageToAgent(message: IMessage): Promise<any>; 

    getAgentChannelId(): string;
}
