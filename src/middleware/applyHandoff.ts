import { IAddress, IEvent, IMessage, UniversalBot } from 'botbuilder';
import { InMemoryConversationProvider } from '../conversation/prebuiltProviders/InMemoryConversationProvider';
import { IConversationProvider } from './../conversation/IConversationProvider';
import { IncomingMessageRouter } from './../routing/IncomingMessageRouter';
import { IAgentService } from './../services/IAgentService';

export function applyHandoff<T extends IAddress>(
    bot: UniversalBot,
    provider: IConversationProvider<T> = new InMemoryConversationProvider(),
    //tslint:disable-next-line
    agentService: IAgentService<T>
): void {
    const incomingMessageRouter = new IncomingMessageRouter(bot, provider, agentService);

    bot.use({
        botbuilder: incomingMessageRouter.route.bind(incomingMessageRouter)
    });
}
