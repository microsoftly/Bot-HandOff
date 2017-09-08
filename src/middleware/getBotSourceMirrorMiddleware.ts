import { IMessage, UniversalBot } from 'botbuilder';
import { ConversationState } from '../../src/IConversation';
import { sendMirrorMessages } from '../utils';
import { IProvider } from './../provider/IProvider';

/**
 * mirrors messages sent to the customer to a watching agent, whether they be from the bot or agents.
 * @param provider data provider for transcription services
 */
export function getBotSourceMirrorMiddleware(bot: UniversalBot, provider: IProvider): (s: IMessage, n: Function) => Promise<void> {
    return async (message: IMessage, next: Function): Promise<void> => {
        const convo = await provider.getOrCreateNewCustomerConversation(message.address);

        // if in agent mode, bot messages are either going to or from a customer/agent
        if (convo.conversationState !== ConversationState.Agent) {

            const agentMirrorAddresses = convo.watchingAgents;

            sendMirrorMessages(bot, message, convo.watchingAgents);
        }
// TODO => DELETE THIS
        next();
    };
}
