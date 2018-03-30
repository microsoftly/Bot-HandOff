import { IAddress, Session, UniversalBot } from 'botbuilder';
import { IConversationProvider } from './../conversation/IConversationProvider';
import { AgentMessageRouter } from './AgentMessageRouter';
import { CustomerMessageRouter } from './CustomerMessageRouter';
import { IRouter } from './IRouter';

export class IncomingMessageRouter<T extends IAddress> implements IRouter {
    private readonly bot: UniversalBot;
    private readonly agentMessageRouter: AgentMessageRouter<T>;
    private readonly customerMessageRouter: CustomerMessageRouter<T>;

    public constructor(bot: UniversalBot, convoProvider: IConversationProvider<T>) {
        this.bot = bot;
        this.agentMessageRouter = new AgentMessageRouter(bot, convoProvider);
        this.customerMessageRouter = new CustomerMessageRouter(bot, convoProvider);
    }

    //tslint:disable-next-line
    public async route(session: Session,  next?: Function): Promise<any> {
        if (session.userData.isAgent) {

        }
    }
}
