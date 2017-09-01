import { IAddress, IMessage, Session, UniversalBot } from 'botbuilder';
import { ConversationState, IConversation } from '../IConversation';
import { IHandoffMessage } from '../IHandoffMessage';
import { MessageReceivedWhileWaitingHandler } from '../options/MessageReceivedWhileWaitingHandler';
import { IProvider } from './../provider/IProvider';
import { Router } from './Router';

export class CustomerMessageRouter extends Router {
    private messageReceivedWhileWaitingHandler: MessageReceivedWhileWaitingHandler;

    constructor(bot: UniversalBot, provider: IProvider, messageReceivedWhileWaitingHandler: MessageReceivedWhileWaitingHandler) {
        super(bot, provider);

        this.messageReceivedWhileWaitingHandler = messageReceivedWhileWaitingHandler;
    }
    //tslint:disable
    public async Route(session: Session, next: Function): Promise<any> {
    //tslint:enable
        const customerAddress = session.message.address;

        const convo = await this.provider.getOrCreateNewCustomerConversation(customerAddress);

        const mirrorMessages = convo.watchingAgents.map(
            (watchingAgentAddress: IAddress) => Object.assign({}, session.message, { address: watchingAgentAddress }));

        await this.provider.addCustomerMessageToTranscript(session.message);

        // only send the messages out once they've been successfully recorded in the transcript
        this.bot.send(mirrorMessages);
    }
}
