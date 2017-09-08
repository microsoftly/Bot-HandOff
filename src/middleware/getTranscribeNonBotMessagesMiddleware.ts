// import * as Promise from 'bluebird';
import { Session } from 'botbuilder';
// import { IHandoffMessage } from './../IHandoffMessage';
import { IProvider } from './../provider/IProvider';

/**
 * returns middleware that transcribes customer and agent messages
 *
 * @param provider data provider for transcription services
 */
export function getTranscribeNonBotMessagesMiddleware(provider: IProvider): (s: Session, n: Function) => void {
    return (session: Session, next: Function) => {
        // const message = session.message as IHandoffMessage;
        // let transcriptionPromise: Promise<{}> = Promise.resolve({});
        // // TODO can probably safely remove this
        // if (!message.customerAddress && !message.agentAddress) {
        //     throw new Error('TranscribeNonBotMessagesMiddleware must be applied after addAddressesForHandoffMessageMiddleware');
        // }

        // event messages are not part of a transcript
        // if (message.type === 'message') {
        //     if (message.agentAddress) {
        //         transcriptionPromise = provider.addAgentMessageToTranscript(message);
        //     } else {
        //         transcriptionPromise = provider.addCustomerMessageToTranscript(message);
        //     }
        // }

        next();

        //tslint:disable
        // transcriptionPromise.then(() => next());
        //tslint:enable
    };
}
