// import * as $Promise from 'bluebird';
import { IAddress, Session, UniversalBot } from 'botbuilder';
import { isEqual } from 'lodash';
import { ConversationState, IConversation } from '../IConversation';
import { removeAddressFromAddressCollection, sendMirrorMessages } from '../utils';
import { IProvider } from './../provider/IProvider';
// import { Router } from './Router';

export class AgentMessageRouter {
    private bot: UniversalBot;
    private provider: IProvider;
    private shouldTranscribeMessage: boolean;

    constructor(bot: UniversalBot, provider: IProvider, shouldTranscribeMessage: boolean) {
        this.bot = bot;
        this.provider = provider;
        this.shouldTranscribeMessage = shouldTranscribeMessage;
    }

    //tslint:disable
    public async Route(session: Session): Promise<any> {
    //tslint:enable
        const agentAddress = session.message.address;
        const convo = await this.provider.getConversationFromAgentAddress(agentAddress);

        if (convo && convo.conversationState === ConversationState.Agent) {
            const customerAddress = convo.customerAddress;
            const agentsToMirror = removeAddressFromAddressCollection(convo.watchingAgents, agentAddress);
            const addressesToMirrorMessage = [customerAddress, ...agentsToMirror];

            sendMirrorMessages(this.bot, session.message, addressesToMirrorMessage);
            // const agentMirrorMessages =
            //     convo.watchingAgents
            //         // don't send the message back to the originating agent
            //         .filter((watchingAgentAddress: IAddress) => !isEqual(watchingAgentAddress, agentAddress))
            //         .map((watchingAgentAddress: IAddress) => Object.assign({}, session.message, { address: watchingAgentAddress }));

            if (this.shouldTranscribeMessage) {
                await this.provider.addAgentMessageToTranscript(session.message);
            }

            // only send the messages out once they've been successfully recorded in the transcript
            // this.bot.send([customerMirrorMessage, ...agentMirrorMessages]);
        } else {
            // throw an error?
        }
    }
}
