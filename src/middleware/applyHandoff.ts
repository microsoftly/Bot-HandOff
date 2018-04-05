import { IAddress, IEvent, IMessage, UniversalBot } from 'botbuilder';
import { IConversation } from '../conversation/IConversation';
import { InMemoryConversationProvider } from '../conversation/prebuiltProviders/InMemoryConversationProvider';
import { IConversationProvider } from './../conversation/IConversationProvider';
import { IncomingMessageRouter } from './../routing/IncomingMessageRouter';
import { IAgentService } from './../services/IAgentService';

export async function applyHandoff<T extends IAddress>(
    bot: UniversalBot,
    provider: IConversationProvider<T> = new InMemoryConversationProvider(),
    //tslint:disable-next-line
    agentService: IAgentService<T>
): Promise<void> {
    const incomingMessageRouter = new IncomingMessageRouter(bot, provider, agentService);

    if (agentService.listenForAgentMessages) {
        const activeAgentConversations = await provider.getConversationsConnectedToAgent();

        activeAgentConversations.length && console.log('reconnecteing to disconnected conversations');

        activeAgentConversations.forEach((convo: IConversation<T>) => agentService.listenForAgentMessages(convo,
            // tslint:disable
            async (message: IMessage) => {
                await provider.addAgentMessageToTranscript(Object.assign({}, message, {address: convo.agentAddress}));

                bot.send(message);
            }));
    }

    bot.use({
        botbuilder: incomingMessageRouter.route.bind(incomingMessageRouter)
    });

    async function exitHandler(): Promise<void> {
        await provider.closeOpenConnections();
    }

    process.on('exit', async () => await exitHandler());

    //catches ctrl+c event
    process.on('SIGINT', async () => await exitHandler());

    process.on('SIGUSR1', async () => await exitHandler());
    process.on('SIGUSR2', async () => await exitHandler());

}
