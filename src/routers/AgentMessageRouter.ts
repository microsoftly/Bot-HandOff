import * as $Promise from 'bluebird';
import { IAddress, Session, UniversalBot } from 'botbuilder';
import { isEqual } from 'lodash';
import { ConversationState, IConversation } from '../IConversation';
import { IHandoffMessage } from '../IHandoffMessage';
import { IProvider } from './../provider/IProvider';
import { Router } from './Router';

export class AgentMessageRouter extends Router {
    constructor(bot: UniversalBot, provider: IProvider) {
        super(bot, provider);
    }

    //tslint:disable
    public async Route(session: Session): Promise<any> {
    //tslint:enable
        const agentAddress = session.message.address;
        const convo = await this.provider.getConversationFromAgentAddress(agentAddress);

        if (convo && convo.conversationState === ConversationState.Agent) {
            const customerAddress = convo.customerAddress;
            const customerMirrorMessage: IHandoffMessage =
                Object.assign({ customerAddress, agentAddress }, session.message, { address: customerAddress });

            const agentMirrorMessages =
                convo.watchingAgents
                    // don't send the message back to the originating agent
                    .filter((watchingAgentAddress: IAddress) => !isEqual(watchingAgentAddress, agentAddress))
                    .map((watchingAgentAddress: IAddress) => Object.assign({}, session.message, { address: watchingAgentAddress }));

            await this.provider.addAgentMessageToTranscript(session.message);

            // only send the messages out once they've been successfully recorded in the transcript
            this.bot.send([customerMirrorMessage, ...agentMirrorMessages]);
        } else {
            // throw an error?
        }
    }
}
