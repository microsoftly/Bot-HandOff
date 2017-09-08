import * as $Promise from 'bluebird';
import { Session, UniversalBot } from 'botbuilder';
import { applyHandoffEventListeners } from './middleware/applyHandoffEventListeners';
import { getBotSourceMirrorMiddleware } from './middleware/getBotSourceMirrorMiddleware';
import { getRouteMessgeMiddleware } from './middleware/getRouteMessageMiddleware';
import { getTranscribeBotMessagesMiddleware } from './middleware/getTranscribeBotMessagesMiddleware';
import { defaultHandoffOptions, IHandoffOptions } from './options/IHandoffOptions';
import { IProvider } from './provider/IProvider';
import { InMemoryProvider } from './provider/prebuilt/InMemoryProvider';
import { AgentMessageRouter } from './routers/AgentMessageRouter';
import { CustomerMessageRouter } from './routers/CustomerMessageRouter';

export function applyHandoffMiddleware(
    bot: UniversalBot,
    isAgent: (session: Session) => boolean | PromiseLike<boolean>,
    provider: IProvider = new InMemoryProvider(),
    options?: IHandoffOptions
): void {
    // in case a consumer sends in partial definition of the event success handlers (js side), fill the missing ones with defaults
    options = Object.assign({}, defaultHandoffOptions, options);
    const isAgentFn = $Promise.method(isAgent) as (s: Session) => Promise<boolean>;
    // while not exactly botbuilder middleware, these listeners act in the same way
    applyHandoffEventListeners(bot, provider, options.eventHandlers);

    const botbuilder = [];

    botbuilder.push(
        getRouteMessgeMiddleware(
            isAgentFn,
            new CustomerMessageRouter(bot, provider, options.shouldTranscribeMessages, options.messageReceivedWhileWaitingHandler),
            new AgentMessageRouter(bot, provider, options.shouldTranscribeMessages)));

    const send = [
        getBotSourceMirrorMiddleware(bot, provider)
    ];

    if (options.shouldTranscribeMessages) {
        send.push(getTranscribeBotMessagesMiddleware(provider));
    }

    bot.use({
        send,
        botbuilder
    });
}
