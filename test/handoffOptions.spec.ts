import { BotTester } from 'bot-tester';
import { ConsoleConnector, Session, UniversalBot } from 'botbuilder';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { applyHandoffMiddleware } from '../src/applyHandoffMiddleware';
import { IEventHandlers } from '../src/options/IEventHandlers';
import { IProvider } from '../src/provider/IProvider';
import * as TestDataProvider from './TestDataProvider';

chai.use(sinonChai);
chai.use(chaiAsPromised);

const expect = chai.expect;

describe('handoff options', () => {
    let bot: UniversalBot;
    let providerSpy: IProvider;
    let eventHandlerSpies: IEventHandlers;
    let messageReceivedWhileWaitingSpy: sinon.SinonSpy;

    async function sendMessagesForTranscriptionTest(): Promise<void> {
        await new BotTester(bot)
            .sendMessageToBot(TestDataProvider.customer1.message1, TestDataProvider.DEFAULT_BOT_RESPONSE)
            .sendMessageToBot(TestDataProvider.agent1.convo1.eventMessage.toConnectTo.customer1)
            .wait(TestDataProvider.EVENT_DELAY)
            .sendMessageToBot(TestDataProvider.agent1.convo1.message1,
                              TestDataProvider.getExpectedReceivedMessage(
                                  TestDataProvider.agent1.convo1.message1,
                                  TestDataProvider.customer1.address
                                ))
            .runTest();
    }

    beforeEach(() => {
        // this is a hack to work with the bot tester framework (not just end up hanging). This is likely not a good example implementation
        const messageReceivedWhileWaitingHandler = (b: UniversalBot, s: Session, next: Function) => {
            next();
        };

        messageReceivedWhileWaitingSpy = sinon.spy(messageReceivedWhileWaitingHandler);
        eventHandlerSpies = TestDataProvider.getEventHandlerSpies();
        providerSpy = TestDataProvider.createIProviderSpy();

        bot = TestDataProvider.getNewBotInstance();
    });

    it('MessageReceivedWhileWaitingHandler is called when in a waiting state', async () => {
        // apply the standard handoff middleware
        applyHandoffMiddleware(
            bot, TestDataProvider.IS_AGENT_FN, providerSpy,
            { eventHandlers: eventHandlerSpies, messageReceivedWhileWaitingHandler: messageReceivedWhileWaitingSpy });

        await new BotTester(bot)
            .then(() => expect(messageReceivedWhileWaitingSpy).not.to.have.been.called)

            // send initial message from customer 1 to have a transcript going
            .sendMessageToBot(TestDataProvider.customer1.message1, TestDataProvider.DEFAULT_BOT_RESPONSE)

            // send queue message to customer 1 to put it in a wait state
            .sendMessageToBot(TestDataProvider.customer1.eventMessage.toQueue)

            // add in delay to ensure that the event has occurred properly
            .wait(TestDataProvider.EVENT_DELAY)

            // send customer message that will be sent to the messageRecevedWhileWaitingSpy
            .sendMessageToBot(TestDataProvider.customer1.message2)
            .wait(TestDataProvider.EVENT_DELAY)
            .then(() => expect(messageReceivedWhileWaitingSpy).to.have.been.called)
            .runTest();
    });

    it('Transcription occurs when shouldTranscribeMessages is set to true', async () => {
        applyHandoffMiddleware(
            bot, TestDataProvider.IS_AGENT_FN, providerSpy,
            {
                eventHandlers: eventHandlerSpies,
                messageReceivedWhileWaitingHandler: messageReceivedWhileWaitingSpy,
                shouldTranscribeMessages: true
            });

        await sendMessagesForTranscriptionTest();

        expect(providerSpy.addAgentMessageToTranscript).to.have.been.called;
        expect(providerSpy.addCustomerMessageToTranscript).to.have.been.called;
        expect(providerSpy.addBotMessageToTranscript).to.have.been.called;
    });

    it('Transcription does not occur when shouldTranscribeMessages is set to false', async () => {
        applyHandoffMiddleware(
            bot, TestDataProvider.IS_AGENT_FN, providerSpy,
            {
                eventHandlers: eventHandlerSpies,
                messageReceivedWhileWaitingHandler: messageReceivedWhileWaitingSpy,
                shouldTranscribeMessages: false
            });

        await sendMessagesForTranscriptionTest();

        expect(providerSpy.addAgentMessageToTranscript).not.to.have.been.called;
        expect(providerSpy.addCustomerMessageToTranscript).not.to.have.been.called;
        expect(providerSpy.addBotMessageToTranscript).not.to.have.been.called;
    });
});
