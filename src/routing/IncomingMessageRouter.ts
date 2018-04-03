import { IAddress, IMessage, Session, UniversalBot } from 'botbuilder';
import { IConversationProvider } from './../conversation/IConversationProvider';
import { IAgentService } from './../services/IAgentService';
import { AgentMessageRouter } from './AgentMessageRouter';
import { CustomerMessageRouter } from './CustomerMessageRouter';
import { IRouter } from './IRouter';

export class IncomingMessageRouter<T extends IAddress> implements IRouter {
    private readonly bot: UniversalBot;
    private readonly agentMessageRouter: AgentMessageRouter<T>;
    private readonly customerMessageRouter: CustomerMessageRouter<T>;
    private readonly agentChannelId: string;

    public constructor(bot: UniversalBot, convoProvider: IConversationProvider<T>, agentService: IAgentService<T>) {
        this.bot = bot;
        this.agentMessageRouter = new AgentMessageRouter(bot, convoProvider);
        this.customerMessageRouter = new CustomerMessageRouter(bot, convoProvider, agentService);
        this.agentChannelId = agentService.getAgentChannelId();
    }

    //tslint:disable-next-line
    public async route(session: Session,  next?: Function): Promise<any> {
        if (session.message.address.channelId === this.agentChannelId) {
            await this.agentMessageRouter.route(session);
        } else {
            await this.customerMessageRouter.route(session, next);
        }
    }
}
