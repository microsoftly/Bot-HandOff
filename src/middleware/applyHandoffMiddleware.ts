import { IAddress, UniversalBot } from 'botbuilder';
import { InMemoryConversationProvider } from '../conversation/prebuiltProviders/InMemoryConversationProvider';
import { IConversationProvider } from './../conversation/IConversationProvider';

export function applyHandoffMiddleware<T extends IAddress>(
    bot: UniversalBot,
    provider: IConversationProvider<T> = new InMemoryConversationProvider()
): void {

}
