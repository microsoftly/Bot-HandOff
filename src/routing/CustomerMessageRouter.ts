import { IAddress, Message, Session, UniversalBot } from 'botbuilder';
import * as builder from 'botbuilder';
import { ConversationState } from '../conversation/ConversationState';
import { IConversationProvider } from './../conversation/IConversationProvider';
import { IAgentService } from './../services/IAgentService';
import { IRouter } from './IRouter';

// let liveAgentSeq = 1;
export class CustomerMessageRouter<T> implements IRouter {
    private readonly bot: UniversalBot;
    private readonly convoProvider: IConversationProvider<T>;
    private readonly agentService: IAgentService<T>;

    public constructor(bot: UniversalBot, convoProvider: IConversationProvider<T>, agentService: IAgentService<T>) {
        this.bot = bot;
        this.convoProvider = convoProvider;
        this.agentService = agentService;
    }

    //tslint:disable-next-line
    public async route(session: Session,  next?: Function): Promise<any> {
        const customerAddress = session.message.address;

        // this needs to be before fetching the convo. New conversations will be implicitly made with this funciton
        // it gaurantees that the getConvo function will never return null
        await this.convoProvider.addCustomerMessageToTranscript(session.message);

        const convo = await this.convoProvider.getConversationFromCustomerAddress(customerAddress);

        if (convo.conversationState === ConversationState.Bot) {
            if (session.message.text !== 'connect to agent') {
                const message = new Message()
                    .text(`you said: ${session.message.text}`)
                    .address(session.message.address)
                    .timestamp()
                    .toMessage();

                await this.convoProvider.addBotMessageToTranscript(message);

                return session.send(message);
            }

            await this.convoProvider.enqueueCustomer(customerAddress);

            session.send('please hold while we check with our agents');

            try {
                const { agentAddress, metadata } = await this.agentService.queueForAgent(session.message.address);

                const agentConnectedConversation = await this.convoProvider.connectCustomerToAgent(customerAddress, agentAddress);

                if (metadata) {
                    await this.convoProvider.upsertMetadataUsingCustomerAddress(customerAddress, metadata);
                }

                if (!this.agentService.listenForAgentMessages) {
                    return;
                }

                await this.agentService.listenForAgentMessages(agentAddress,
                    //tslint:disable-next-line
                        async (messageFromAgent: builder.IMessage) => {
                            await this.convoProvider.addAgentMessageToTranscript(messageFromAgent);

                            this.bot.send(Object.assign({}, messageFromAgent, {address: customerAddress}));
                            //tslint:disable-next-line
                        }, metadata);

            } catch (e) {
                session.send('sorry, there are no agents currently available to help');

                return await this.convoProvider.dequeueCustomer(customerAddress);
            }
        } else if (convo.conversationState === ConversationState.Queued) {
            return session.send('please hold while we connect you to the next available agent');
        } else {
            //tslint:disable-next-line
            const agentAddress = convo.agentAddress;

            const message = new Message()
                .text(session.message.text)
                .address(agentAddress)
                .timestamp(new Date().toISOString())
                .toMessage();

            try {
                const metadata = await this.agentService.sendMessageToAgent(message, convo.metadata);

                if (metadata) {
                    await this.convoProvider.upsertMetadataUsingCustomerAddress(convo.customerAddress, metadata);
                }
            } catch (e) {
                console.error(e);

                session.send('sorry, we\'re having trouble delivering your message');
            }

            // await this.convoProvider.addAgentMessageToTranscript(messageSentToAgent);

            // await this.liveAgentClient.chatActivityMonitoring.ChatMessage({text: session.message.text}, {
            //     liveAgentAffinity: agentAddress.liveAgentAffinity,
            //     liveAgentSessionKey: agentAddress.liveAgentSessionKey,
            //     liveAgentSequence: liveAgentSeq++
            // });
        }
    }

    // private async queueForAgent(customerMessage: IMessage): Promise<void> {
    //     const result: SessionId = await this.liveAgentClient.liveAgentSession.getSessionId();

    //     const affinityToken = result.affinityToken;
    //     const clientPollTimeout = result.clientPollTimeout;
    //     const sessionId = result.id;
    //     const sessionKey = result.key;

    //     const chasitorInit = new ChasitorInit();

    // // from snap in 5733D0000004CBY raw html/js
    //     chasitorInit.buttonId = '5733D0000004CDU'; // '5733D0000004CBY'; //'5733D0000004CDU';

    //     chasitorInit.deploymentId = '5723D0000008OS7'; // '5723D0000004CB4'; //'5723D0000008OS7';

    //     chasitorInit.sessionId = sessionId;

    //     chasitorInit.organizationId = '00D3D000000Cxao';

    //     chasitorInit.language = 'en-US';

    //     chasitorInit.screenResolution = '2560x1440';

    //     chasitorInit.prechatDetails = [];

    //     chasitorInit.prechatEntities = [];

    //     chasitorInit.receiveQueueUpdates = true;

    //     chasitorInit.isPost = true;

    //     const headers = {
    //         liveAgentAffinity: affinityToken,
    //         liveAgentSessionKey: sessionKey,
    //         liveAgentSequence: -1
    //     };

    //     try {
    //         await this.liveAgentClient.chatSessionManagement.createNewVisitorSession(chasitorInit, headers);

    //         await this.convoProvider.enqueueCustomer(customerMessage.address);
    //     } catch (e) {
    //         console.log('could not create customer session');

    //         console.error(e);
    //     }
    //     let visitorId: string = null;
    //     let liveAgentUserId: string = null;
    //     let liveAgentName: string = null;

    //     let agentAddress: AgentAddress;
    //     await this.liveAgentClient.chatActivityMonitoring.onLiveAgentMessage(async (messages: IMessage[]) => {
    //         if (messages) {
    //             messages.forEach(async (message: Message) => {
    //                 if (message.type === MessageType.ChatRequestSuccess) {
    //                     visitorId = message.message.visitorId;
    //                 } else if (message.type === MessageType.ChatEstablished) {
    //                     liveAgentUserId = message.message.userId;
    //                     liveAgentName = message.message.name;

    //                     agentAddress = AgentAddress.CreateAgentAddressForNewConversation({
    //                         // visitorId,
    //                         liveAgentUserId,
    //                         liveAgentName,
    //                         liveAgentAffinity: affinityToken,
    //                         liveAgentSessionKey: sessionKey
    //                     });

    //                     //tslint:disable-next-line
    //                     await this.convoProvider.connectCustomerToAgent(customerMessage.address, agentAddress as any);

    //                     agentAddress = AgentAddress.CreateAgentAddress({
    //                         visitorId,
    //                         liveAgentUserId,
    //                         liveAgentName,
    //                         liveAgentAffinity: affinityToken,
    //                         liveAgentSessionKey: sessionKey
    //                     });

    //                     await this.liveAgentClient.chatActivityMonitoring.ChatMessage({text: customerMessage.text}, headers);
    //                 } else if (message.type === MessageType.ChatMessage) {
    //                     const text = message.message.text;

    //                     const msgToReceive = new builder.Message()
    //                         .text(text)
    //                         .toMessage();

    //                     msgToReceive.address = agentAddress;

    //                     this.bot.receive(msgToReceive);
    //                 }
    //             });
    //         }
    //     //tslint:disable-next-line
    //     }, headers);
    // }
}
/*

channelId === 'liveAgent'
conversation: {
    id: sessionKey,
    name: 'sessionKey'
}
bot: {
    id: 'liveAgentBot'
}
user {

}

*/
