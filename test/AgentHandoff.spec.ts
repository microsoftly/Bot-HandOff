import * as $Promise from 'bluebird';
import { BotTester } from 'bot-tester';
import { ConsoleConnector, IAddress, Message, Session, UniversalBot } from 'botbuilder';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { QueueEventMessage } from '../src/eventMessages/QueueEventMessage';
import { IConversation } from '../src/IConversation';
import { MessageReceivedWhileWaitingHandler } from '../src/options/MessageReceivedWhileWaitingHandler';
import { InMemoryProvider } from '../src/provider/prebuilt/InMemoryProvider';
import { applyHandoffMiddleware } from './../src/applyHandoffMiddleware';
import { ConnectEventMessage } from './../src/eventMessages/ConnectEventMessage';
import { IProvider } from './../src/provider/IProvider';
import * as TestDataProvider from './TestDataProvider';

chai.use(sinonChai);

const expect = chai.expect;

const connector = new ConsoleConnector();

const isAgent = (session: Session): $Promise<boolean> => {
    return $Promise.resolve(session.message.address.user.name.toLowerCase().includes('agent'));
};

describe('agent handoff', () => {
    let bot: UniversalBot;
    let provider: IProvider;

    beforeEach(async () => {
        provider = new InMemoryProvider();
        bot = new UniversalBot(connector);
        bot.dialog('/', (session: Session) => {
            session.send('intro!');
        });

        applyHandoffMiddleware(bot, isAgent, provider);

        // all customers should have their intro messages sent first
        await new BotTester(bot)
            .sendMessageToBot(TestDataProvider.customer1.message1, 'intro!')
            .sendMessageToBot(TestDataProvider.customer2.message1, 'intro!')
            .runTest();
    });

    it.only('can handover to agents', () => {
        return new BotTester(bot, TestDataProvider.customer1.address)
            .sendMessageToBot(
                new ConnectEventMessage(TestDataProvider.customer1.address, TestDataProvider.agent1.convo1.address),
                // ToDo remove expected response .... already covered in the handoffMessageEvents tests & in the options tests below
                'you\'re now connected to an agent')
            .sendMessageToBot(
                TestDataProvider.agent1.convo1.message1,
                TestDataProvider.getExpectedReceivedMessage(TestDataProvider.agent1.convo1.message1, TestDataProvider.customer1.address))
            .sendMessageToBot(
                TestDataProvider.customer1.message2,
                TestDataProvider.getExpectedReceivedMessage(TestDataProvider.customer1.message2, TestDataProvider.agent1.convo1.address)
            )
            .runTest()
            .then(() => provider.getAllConversations())
            .then((convos: IConversation[]) => {
                convos.forEach((convo: IConversation) => {
                    expect(convo.transcript).not.to.be.empty;
                });
            });
    });

    describe('watching agents', () => {
        it('each receive a message for every bot message', async () => {
            await new BotTester(bot)
                .sendMessageToBot(SendMessage)
                .runTest();
        });

        it('each receive a message for every customer message', () => {
            expect.fail();
        });

        it('each receive a message for every agent message, except for the originating agent', () => {
            expect.fail();
        });

        it('no longer receive messages when no longer watching', () => {
            expect.fail();
        });

        it('do not affect other watching agents when they stop watching', () => {
            expect.fail();
        });

        describe('can stop watching a conversation', () => {
            it('and stop receiving messages from that customer conversation', () => {
                expect.fail();
            });

            it('and not affect other agents watching the conversation', () => {
                expect.fail();
            });

            it('and not affect other agents watching the conversation', () => {
                expect.fail();
            });
        });
    });

    describe('connecting agents', () => {
        it('can connect to a single customer then send and receive messages from the customer', () => {
            expect.fail();
        });

        it('can connect to multiple customers then send and receive messages from the customers to the correct addresses', () => {
            expect.fail();
        });

        it('cannot connect to a customer that is connected to another agent', () => {
            expect.fail();
        });

        describe('can disconnect from a conversation', () => {
            it('and not receive disconnected customer messages afterwards', () => {
                expect.fail();
            });

            it('and not affect other agents watching the conversation', () => {
                expect.fail();
            });

            it('and not affect other conversations the agent is connected to', () => {
                expect.fail();
            });
        });
    });

    it('a single agent can communicate to multuple customers', () => {
        expect.fail();
    });

    it('a second agent attempting to connect to a customer that is already connected to an agent throws an error', () => {
        expect.fail();
    });

    // describe('Handoff Options', () => {
    //     it('will not transcribe if shouldTranscribeMessages option is set to false', () => {
    //         applyHandoffMiddleware(bot, isAgent, provider, {shouldTranscribeMessages: false});

    //         const userReceptionOfAgentMessage = Object.assign({}, agentMessage, { address: CUSTOMER_ADDRESS, text: 'hello there'});

    //         return new BotTester(bot, CUSTOMER_ADDRESS)
    //             .sendMessageToBot(customerIntroMessage, 'intro!')
    //             .sendMessageToBot(new ConnectEventMessage(CUSTOMER_ADDRESS, AGENT_ADDRESS), 'you\'re now connected to an agent')
    //             .sendMessageToBot(agentMessage, userReceptionOfAgentMessage)
    //             .runTest()
    //             .then(() => provider.getAllConversations())
    //             .then((convos: IConversation[]) => {
    //                 convos.forEach((convo: IConversation) => {
    //                     expect(convo.transcript).to.be.empty;
    //                 });
    //             });
    //     });

    //     it('calls the MessageReceivedWhileWaitingHandler when in a waiting state', () => {
    //     // limitations of the BotTester famework require next to be called for the test to pass
    //         const messageReceivedHandler: MessageReceivedWhileWaitingHandler = (_0: UniversalBot, _1: Session, next: Function) => {
    //             next();
    //         };
    //         const spy = sinon.spy(messageReceivedHandler);
    //         const resetSpy = () => spy.reset();
    //         const messageReceivedWhileWaitingHandlerSpy = spy as MessageReceivedWhileWaitingHandler;
    //         const expectMessageReceivedWhileWaitingNotToHaveBeenCalled =
    //             () => expect(messageReceivedWhileWaitingHandlerSpy).not.to.have.been.called;
    //         const expectMessageReceivedWhileWaitingToHaveBeenCalledOnce =
    //             () => expect(messageReceivedWhileWaitingHandlerSpy).to.have.been.calledOnce;

    //         applyHandoffMiddleware(bot, isAgent, provider, { messageReceivedWhileWaitingHandler: messageReceivedWhileWaitingHandlerSpy });

    //         const userReceptionOfAgentMessage = Object.assign({}, agentMessage, { address: CUSTOMER_ADDRESS, text: 'hello there'});

    //         return new BotTester(bot, CUSTOMER_ADDRESS)
    //             .sendMessageToBot(customerIntroMessage, 'intro!')
    //             .then(expectMessageReceivedWhileWaitingNotToHaveBeenCalled)

    //             .sendMessageToBot(new QueueEventMessage(CUSTOMER_ADDRESS))
    //             .then(expectMessageReceivedWhileWaitingNotToHaveBeenCalled)

    //             .sendMessageToBot(customerIntroMessage)
    //             .then(expectMessageReceivedWhileWaitingToHaveBeenCalledOnce)
    //             .then(resetSpy)

    //             .sendMessageToBot(new ConnectEventMessage(CUSTOMER_ADDRESS, AGENT_ADDRESS), 'you\'re now connected to an agent')
    //             .then(expectMessageReceivedWhileWaitingNotToHaveBeenCalled)

    //             .sendMessageToBot(agentMessage, userReceptionOfAgentMessage)
    //             .then(expectMessageReceivedWhileWaitingNotToHaveBeenCalled)
    //             .runTest();
    //     });
    // });
});
