import { IAddress, IMessage, Session, UniversalBot } from 'botbuilder';
import { ConversationState, IConversation } from '../IConversation';
// import { IHandoffMessage } from '../IHandoffMessage';
import { MessageReceivedWhileWaitingHandler } from '../options/MessageReceivedWhileWaitingHandler';
import { sendMirrorMessages } from '../utils';
import { IProvider } from './../provider/IProvider';
// import { IRouter } from './IRouter';

export class CustomerMessageRouter {
    private bot: UniversalBot;
    private provider: IProvider;
    private shouldTranscribeMessage: boolean;
    private messageReceivedWhileWaitingHandler: MessageReceivedWhileWaitingHandler;

    constructor(
        bot: UniversalBot,
        provider: IProvider,
        shouldTranscribeMessage: boolean,
        messageReceivedWhileWaitingHandler: MessageReceivedWhileWaitingHandler
    ) {
        this.bot = bot;
        this.provider = provider;
        this.shouldTranscribeMessage = shouldTranscribeMessage;
        this.messageReceivedWhileWaitingHandler = messageReceivedWhileWaitingHandler;
    }
    //tslint:disable
    public async Route(session: Session, next: Function): Promise<any> {
    //tslint:enable
        const customerAddress = session.message.address;

        const convo = await this.provider.getOrCreateNewCustomerConversation(customerAddress);

        // const mirrorMessages = convo.watchingAgents.map(
        //     (watchingAgentAddress: IAddress) => Object.assign({}, session.message, { address: watchingAgentAddress }));

        if (this.shouldTranscribeMessage) {
            await this.provider.addCustomerMessageToTranscript(session.message);
        }

        sendMirrorMessages(this.bot, session.message, convo.watchingAgents);

        // only send the messages out once they've been successfully recorded in the transcript
        // this.bot.send(mirrorMessages);

        if (convo.conversationState === ConversationState.Bot) {
            next();
        } else if (convo.conversationState === ConversationState.Wait) {
            this.messageReceivedWhileWaitingHandler(this.bot, session, next);
        }
    }
}
