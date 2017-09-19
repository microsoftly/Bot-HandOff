import { BotTester } from 'bot-tester';
import { ConsoleConnector, IAddress, IMessage, Message, Session, UniversalBot } from 'botbuilder';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { QueueEventMessage } from '../src/eventMessages/QueueEventMessage';
import { IConversation } from '../src/IConversation';
import { IEventHandlers } from '../src/options/IEventHandlers';
import { MessageReceivedWhileWaitingHandler } from '../src/options/MessageReceivedWhileWaitingHandler';
import { applyHandoffMiddleware } from './../src/applyHandoffMiddleware';
import { ConnectEventMessage } from './../src/eventMessages/ConnectEventMessage';
import { IProvider } from './../src/provider/IProvider';
import * as TestDataProvider from './TestDataProvider';

chai.use(sinonChai);
chai.use(chaiAsPromised);

const expect = chai.expect;

const connector = new ConsoleConnector();

describe('agent handoff', () => {
    let bot: UniversalBot;
    let providerSpy: IProvider;
    let eventHandlerSpies: IEventHandlers;

    beforeEach(async () => {
        // this is a hack to work with the bot tester framework (not just end up hanging). This is likely not a good example implementation
        const messageReceivedWhileWaitingHandler = (b: UniversalBot, s: Session, next: Function) => {
            next();
        };

        eventHandlerSpies = TestDataProvider.getEventHandlerSpies();
        providerSpy = TestDataProvider.createIProviderSpy();

        bot = TestDataProvider.getNewBotInstance();

        applyHandoffMiddleware(
            bot, TestDataProvider.IS_AGENT_FN, providerSpy,
            { eventHandlers: eventHandlerSpies, messageReceivedWhileWaitingHandler: messageReceivedWhileWaitingHandler });

        // all customers should have their intro messages sent first
        await new BotTester(bot)
            .sendMessageToBot(TestDataProvider.customer1.message1, TestDataProvider.DEFAULT_BOT_RESPONSE)
            .sendMessageToBot(TestDataProvider.customer2.message1, TestDataProvider.DEFAULT_BOT_RESPONSE)
            .runTest();
    });

    // covers a single agent connected to a single customer, with both sending messages
    it('can handover to agents', async () => {
        await new BotTester(bot, { defaultAddress: TestDataProvider.customer1.address })
            .sendMessageToBotIgnoringResponseOrder(
                new ConnectEventMessage(TestDataProvider.customer1.address, TestDataProvider.agent1.convo1.address))
                .wait(TestDataProvider.EVENT_DELAY)
            .sendMessageToBot(
                TestDataProvider.agent1.convo1.message1,
                TestDataProvider.getExpectedReceivedMessage(TestDataProvider.agent1.convo1.message1, TestDataProvider.customer1.address))
            .sendMessageToBot(
                TestDataProvider.customer1.message2,
                TestDataProvider.getExpectedReceivedMessage(TestDataProvider.customer1.message2, TestDataProvider.agent1.convo1.address)
            )
            .runTest()
            .then(() => providerSpy.getAllConversations())
            .then((convos: IConversation[]) => {
                convos.forEach((convo: IConversation) => {
                    expect(convo.transcript).not.to.be.empty;
                });
            });
    });

    describe('watching agents', () => {
        beforeEach(async () => {
            await new BotTester(bot, { defaultAddress: TestDataProvider.customer1.address })
                .sendMessageToBot(TestDataProvider.agent1.convo1.eventMessage.toWatch.customer1)
                // allow time for the messages to process (watching doesn't send a response by default)
                .wait(TestDataProvider.EVENT_DELAY)
                .runTest();
        });
        // perfect example case for possibly receiving messages in an unknown order
        it('each receive a message for every bot and user message', async () => {
            const botResponseToCustomerMessage = new Message()
                .text(TestDataProvider.DEFAULT_BOT_RESPONSE)
                .address(TestDataProvider.customer1.address)
                .toMessage();

            const agent1ReceptionOfCustomerMessage2 =
                TestDataProvider.getExpectedReceivedMessage(
                    TestDataProvider.customer1.message2,
                    TestDataProvider.agent1.convo1.address);

            const agent2ReceptionOfCustomerMessage2 =
                TestDataProvider.getExpectedReceivedMessage(
                    TestDataProvider.customer1.message2,
                    TestDataProvider.agent2.convo1.address);

            const agent1ReceptionOfBotResponseToCustomerMessage2 =
                    TestDataProvider.getExpectedReceivedMessage(
                        botResponseToCustomerMessage,
                        TestDataProvider.agent1.convo1.address);

            const agent2ReceptionOfBotResponseToCustomerMessage2 =
                    TestDataProvider.getExpectedReceivedMessage(
                        botResponseToCustomerMessage,
                        TestDataProvider.agent2.convo1.address);

            await new BotTester(bot)
                .sendMessageToBot(TestDataProvider.agent2.convo1.eventMessage.toWatch.customer1)
                .wait(TestDataProvider.EVENT_DELAY)
                .sendMessageToBotIgnoringResponseOrder(
                    TestDataProvider.customer1.message2,

                    // customer message is mirrored to the watching agents
                    agent1ReceptionOfCustomerMessage2,
                    agent2ReceptionOfCustomerMessage2,

                    // bot responds to the customer with a message
                    botResponseToCustomerMessage,

                    // agents see the bot's response to the user
                    agent1ReceptionOfBotResponseToCustomerMessage2,
                    agent2ReceptionOfBotResponseToCustomerMessage2
                )
                .runTest();
        });

        it('each receive a message for every agent message, except for the originating agent', async () => {
            const agent2Message = new Message()
                .address(TestDataProvider.agent2.convo1.address)
                .text('agent 2 connected to YOU')
                .toMessage();

            const agent1ReceptionOfAgent2Message =
                TestDataProvider.getExpectedReceivedMessage(
                    agent2Message,
                    TestDataProvider.agent1.convo1.address);

            const customerReceptionOfAgent2Message =
                TestDataProvider.getExpectedReceivedMessage(
                    agent2Message,
                    TestDataProvider.customer1.address);

            await new BotTester(bot)
                .sendMessageToBot(TestDataProvider.agent2.convo1.eventMessage.toConnectTo.customer1)
                .wait(TestDataProvider.EVENT_DELAY)
                .sendMessageToBotIgnoringResponseOrder(
                    agent2Message,

                    agent1ReceptionOfAgent2Message,
                    customerReceptionOfAgent2Message
                )
                .runTest();
        });

        it('no longer receive messages when no longer watching and do not affect other agents that are still watching', async () => {
            const botResponseToCustomerMessage = new Message()
                .text(TestDataProvider.DEFAULT_BOT_RESPONSE)
                .address(TestDataProvider.customer1.address)
                .toMessage();

            const agent1ReceptionOfCustomerMessage2 =
                TestDataProvider.getExpectedReceivedMessage(
                    TestDataProvider.customer1.message2,
                    TestDataProvider.agent1.convo1.address);

            await new BotTester(bot, { defaultAddress: TestDataProvider.customer1.address })
                .sendMessageToBot(TestDataProvider.agent1.convo1.eventMessage.toUnwatch.customer1)
                .wait(TestDataProvider.EVENT_DELAY)
                .runTest();

            await new BotTester(bot, { defaultAddress: TestDataProvider.customer1.address })
                    .wait(TestDataProvider.EVENT_DELAY)
                    .sendMessageToBotIgnoringResponseOrder(
                        TestDataProvider.customer1.message2,
                        TestDataProvider.DEFAULT_BOT_RESPONSE
                    )
                    .runTest();
        });

        it('other agents are unaffected by an agent unwatching', async () => {
            const botResponseToCustomerMessage = new Message()
                .text(TestDataProvider.DEFAULT_BOT_RESPONSE)
                .address(TestDataProvider.customer1.address)
                .toMessage();

            const agent2ReceptionOfCustomerMessage2 =
                TestDataProvider.getExpectedReceivedMessage(
                    TestDataProvider.customer1.message2,
                    TestDataProvider.agent2.convo1.address);

            await new BotTester(bot, { defaultAddress: TestDataProvider.customer1.address })
                .sendMessageToBot(TestDataProvider.agent2.convo1.eventMessage.toWatch.customer1)
                .sendMessageToBot(TestDataProvider.agent1.convo1.eventMessage.toUnwatch.customer1)
                .wait(TestDataProvider.EVENT_DELAY)
                .runTest();

            await new BotTester(bot, { defaultAddress: TestDataProvider.customer1.address })
                    .wait(TestDataProvider.EVENT_DELAY)
                    .sendMessageToBotIgnoringResponseOrder(
                        TestDataProvider.customer1.message2,
                        TestDataProvider.DEFAULT_BOT_RESPONSE,
                        agent2ReceptionOfCustomerMessage2
                    )
                    .runTest();
        });
    });

    describe('connecting agents', () => {
        // basic case is covered in the example test above for agent handoff
        beforeEach(async () => {
            await new BotTester(bot)
                .sendMessageToBot(TestDataProvider.agent1.convo1.eventMessage.toConnectTo.customer1)
                .wait(TestDataProvider.EVENT_DELAY)
                .runTest();
        });

        it('can connect to multiple customers then send and receive messages from the customers to the correct addresses', async () => {
            const customer1ReceptionOfAgent1Message1 =
                TestDataProvider.getExpectedReceivedMessage(
                    TestDataProvider.agent1.convo1.message1,
                    TestDataProvider.customer1.address);

            const customer2ReceptionOfAgent1Message2 =
                TestDataProvider.getExpectedReceivedMessage(
                    TestDataProvider.agent1.convo2.message2,
                    TestDataProvider.customer2.address);

            const agentReceptionOfCustomer1Message2 =
                    TestDataProvider.getExpectedReceivedMessage(
                        TestDataProvider.customer1.message2,
                        TestDataProvider.agent1.convo1.address);

            const agentReceptionOfCustomer2Message2 =
                    TestDataProvider.getExpectedReceivedMessage(
                        TestDataProvider.customer2.message2,
                        TestDataProvider.agent1.convo2.address);

            await new BotTester(bot)
                .sendMessageToBot(TestDataProvider.agent1.convo2.eventMessage.toConnectTo.customer2)
                .wait(TestDataProvider.EVENT_DELAY)
                .sendMessageToBot(TestDataProvider.agent1.convo1.message1, customer1ReceptionOfAgent1Message1)
                .sendMessageToBot(TestDataProvider.agent1.convo2.message2, customer2ReceptionOfAgent1Message2)
                .sendMessageToBot(TestDataProvider.customer1.message2, agentReceptionOfCustomer1Message2)
                .sendMessageToBot(TestDataProvider.customer2.message2, agentReceptionOfCustomer2Message2)
                .runTest();
        });

        it('cannot connect to a customer that is connected to another agent', async () => {
            (eventHandlerSpies.connect.success as sinon.SinonSpy).reset();

            await new BotTester(bot)
                .sendMessageToBot(TestDataProvider.agent2.convo1.eventMessage.toConnectTo.customer1)
                .wait(TestDataProvider.EVENT_DELAY)
                .runTest();

            expect(eventHandlerSpies.connect.failure).to.have.been.called;
            expect(eventHandlerSpies.connect.success).not.to.have.been.called;
        });

        describe('can disconnect from a conversation', () => {
            it('and not affect other agents watching the conversation', async () => {
                const botResponseToCustomerMessage = new Message()
                    .text(TestDataProvider.DEFAULT_BOT_RESPONSE)
                    .address(TestDataProvider.customer1.address)
                    .toMessage();

                const botResponseMirroredToAgent2 = new Message()
                    .text(TestDataProvider.DEFAULT_BOT_RESPONSE)
                    .address(TestDataProvider.agent2.convo1.address)
                    .toMessage();

                const customerMessageMirroredToAgent2 =
                    TestDataProvider.getExpectedReceivedMessage(
                        TestDataProvider.customer1.message2,
                        TestDataProvider.agent2.convo1.address);

                await new BotTester(bot)
                    .sendMessageToBot(TestDataProvider.agent2.convo1.eventMessage.toWatch.customer1)
                    .wait(TestDataProvider.EVENT_DELAY)
                    .sendMessageToBot(TestDataProvider.agent1.convo1.eventMessage.toDisconnectFrom.customer1)
                    .wait(TestDataProvider.EVENT_DELAY)
                    .sendMessageToBotIgnoringResponseOrder(
                        TestDataProvider.customer1.message2,

                        // message is mirrored to agent
                        customerMessageMirroredToAgent2,

                        // bot responds
                        botResponseToCustomerMessage,

                        // agent sees bot's response
                        botResponseMirroredToAgent2)
                    .runTest();
            });

            it('and not affect other conversations the agent is connected to', async () => {
                const customerReceptionOfAgentMessage =
                    TestDataProvider.getExpectedReceivedMessage(
                        TestDataProvider.agent1.convo1.message1,
                        TestDataProvider.customer1.address);

                await new BotTester(bot)
                    .sendMessageToBot(TestDataProvider.agent1.convo2.eventMessage.toConnectTo.customer2)
                    .wait(TestDataProvider.EVENT_DELAY)
                    .sendMessageToBot(TestDataProvider.agent1.convo2.eventMessage.toDisconnectFrom.customer2)
                    .wait(TestDataProvider.EVENT_DELAY)
                    .sendMessageToBot(TestDataProvider.agent1.convo1.message1, customerReceptionOfAgentMessage)
                    .runTest();
            });
        });
    });
});
