import { IAddress, Session, UniversalBot } from 'botbuilder';
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
    public Route(session: Session, next: Function): any {
    //tslint:enable
        const customerAddress = session.message.address;

        return this.provider.getConversationFromCustomerAddress(customerAddress)
            .then((convo: IConversation) => {
                if (convo) {
                    const mirrorMessages = convo.watchingAgents.map(
                        (watchingAgentAddress: IAddress) => Object.assign({}, session.message, { address: watchingAgentAddress }));

                    this.bot.send(mirrorMessages);

                    if (convo.conversationState === ConversationState.Wait) {
                        return this.messageReceivedWhileWaitingHandler(this.bot, session, next);
                    } else {
                        next();
                    }
                } else {
                    return this.provider.addCustomerMessageToTranscript(session.message)
                    //tslint:disable
                        .then(() => next());
                    //tslint:enable
                }
            });
    }
}
