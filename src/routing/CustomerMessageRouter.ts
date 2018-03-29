import { IAddress, Session, UniversalBot } from 'botbuilder';
import { ConversationState } from '../conversation/ConversationState';
import { IConversationProvider } from './../conversation/IConversationProvider';
import { IRouter } from './IRouter';

export class CustomerMessageRouter<T extends IAddress> implements IRouter {
    private readonly bot: UniversalBot;
    private readonly convoProvider: IConversationProvider<T>;

    public constructor(bot: UniversalBot, convoProvider: IConversationProvider<T>) {
        this.bot = bot;
        this.convoProvider = convoProvider;
    }

    //tslint:disable-next-line
    public async route(session: Session,  next?: Function): Promise<any> {
        const customerAddress = session.message.address;
        const convo = await this.convoProvider.getConversationFromCustomerAddress(customerAddress);

        await this.convoProvider.addCustomerMessageToTranscript(session.message);

        if (convo.conversationState === ConversationState.Bot) {
            return next();
        } else {
            session.send('please hold while we connect you to the next available agent');
        }
    }
}
