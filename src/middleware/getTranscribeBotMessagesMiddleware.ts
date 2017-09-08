import { IAddress, IMessage } from 'botbuilder';
// import { IHandoffMessage } from './../IHandoffMessage';
import { IProvider } from './../provider/IProvider';

/**
 * returns middleware that transcribes messages from a bot to a transcript
 * @param provider data provider for transcription services
 */
export function getTranscribeBotMessagesMiddleware(provider: IProvider): (s: IMessage, n: Function) => Promise<void> {
    return async (message: IMessage, next: Function): Promise<void> => {

        // messages that get routed to agents will never go to the bot. For this reason, we know that messages at this point
        // are only going to the user.
        if (message.type === 'message') {
            await provider.addBotMessageToTranscriptIgnoringConversationState(message);
        }

        next();

        // const convo = await provider.getConversationFromCustomerAddress(message.address);
        // convo.watchingAgents.forEach((watchingAgentAddress: IAddress) => );)
        //tslint:disable
        // return transcribePromise.then(() => next())
        //tslint:enable
    };
}
