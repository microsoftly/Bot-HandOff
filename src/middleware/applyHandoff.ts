import { IAddress, UniversalBot } from 'botbuilder';
import { InMemoryConversationProvider } from '../conversation/prebuiltProviders/InMemoryConversationProvider';
import { IConversationProvider } from './../conversation/IConversationProvider';
import { IncomingMessageRouter } from './../routing/IncomingMessageRouter';

export function applyHandoff<T extends IAddress>(
    bot: UniversalBot,
    provider: IConversationProvider<T> = new InMemoryConversationProvider()
): void {
    const incomingMessageRouter = new IncomingMessageRouter(bot, provider);

    bot.use({
        botbuilder: incomingMessageRouter.route
    });
}
