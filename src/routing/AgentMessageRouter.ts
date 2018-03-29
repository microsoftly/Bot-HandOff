import { IAddress, Session, UniversalBot } from 'botbuilder';
import { IConversationProvider } from './../conversation/IConversationProvider';
import { IRouter } from './IRouter';

export class AgentMessageRouter<T extends IAddress> implements IRouter {
    private readonly bot: UniversalBot;
    private readonly convoProvider: IConversationProvider<T>;

    public constructor(bot: UniversalBot, convoProvider: IConversationProvider<T>) {
        this.bot = bot;
        this.convoProvider = convoProvider;
    }

    //tslint:disable-next-line
    public async route(session: Session): Promise<any> {
        const agentAddress = session.message.address as T;
        const convo = await this.convoProvider.getConversationFromAgentAddress(agentAddress);

        const customerMessage = Object.assign({}, session.message, { address: convo.customerAddress });

        await this.convoProvider.addAgentMessageToTranscript(session.message);

        this.bot.send(customerMessage);
    }
}
