import { IAddress, IEvent, IMessage, UniversalBot } from 'botbuilder';
import { IConversation } from '../conversation/IConversation';
import { InMemoryConversationProvider } from '../conversation/prebuiltProviders/InMemoryConversationProvider';
import { IConversationProvider } from './../conversation/IConversationProvider';
import { IncomingMessageRouter } from './../routing/IncomingMessageRouter';
import { IAgentService } from './../services/IAgentService';

export async function applyHandoff<T>(
    bot: UniversalBot,
    provider: IConversationProvider<T> = new InMemoryConversationProvider(),
    //tslint:disable-next-line
    agentService: IAgentService<T>
): Promise<void> {
    const incomingMessageRouter = new IncomingMessageRouter(bot, provider, agentService);

    if (agentService.listenForAgentMessages) {
        const activeAgentConversations = await provider.getConversationsConnectedToAgent();

        //tslint:disable-next-line
        activeAgentConversations.length && console.log('reconnecteing to disconnected conversations');

        activeAgentConversations.forEach((convo: IConversation<T>) => agentService.listenForAgentMessages( convo.agentAddress,
        //tslint:disable-next-line
            async (messageFromAgent: IMessage) => {
                await provider.addAgentMessageToTranscript(messageFromAgent);

                bot.send(Object.assign({}, messageFromAgent, {address: convo.customerAddress}));
            },                                                                                             convo.metadata));
    }

    bot.use({
        botbuilder: incomingMessageRouter.route.bind(incomingMessageRouter)
    });

    async function exitHandler(): Promise<void> {
        await provider.closeOpenConnections();
    }

    // //catches ctrl+c event
    process.on('SIGINT', async () => exitHandler());
}
