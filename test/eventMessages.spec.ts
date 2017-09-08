// import * as $Promise from 'bluebird';
import { BotTester } from 'bot-tester';
import { ConsoleConnector, IAddress, IMessage, Session, UniversalBot } from 'botbuilder';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { applyHandoffMiddleware } from '../src/applyHandoffMiddleware';
import { DequeueEventMessage } from '../src/eventMessages/DequeueEventMessage';
import { HandoffEventMessage } from '../src/eventMessages/HandoffEventMessage';
import { QueueEventMessage } from '../src/eventMessages/QueueEventMessage';
import { EventFailureHandler } from '../src/options/EventFailureHandlers';
import { EventSuccessHandler } from '../src/options/EventSuccessHandlers';
import { IEventHandler, IEventHandlers } from '../src/options/IEventHandlers';
import { IHandoffOptions } from '../src/options/IHandoffOptions';
import { InMemoryProvider } from '../src/provider/prebuilt/InMemoryProvider';
import { ConversationState, IConversation } from './../src/IConversation';
import { AgentNotInConversationError } from './../src/provider/errors/AgentNotInConversationError';
import { IProvider } from './../src/provider/IProvider';
import * as TestDataProvider from './TestDataProvider';

chai.use(sinonChai);

const expect = chai.expect;

const connector = new ConsoleConnector();

const isAgent = (session: Session): Promise<boolean> => {
    return Promise.resolve(session.message.address.user.name.toLowerCase().includes('agent'));
};

describe.only('event messages', () => {
    let bot: UniversalBot;
    let eventHandlerSpies: IEventHandlers;
    let providerSpy: IProvider;

    // resolves when the error is thrown. Needs to be called before the desired rejected call is made
    function rejectProviderFunction(functionName: string): Promise<{}> {
        return new Promise((res: Function) => {
            (providerSpy[functionName] as sinon.SinonExpectation).callsFake(() => {
                res();

                return Promise.reject(TestDataProvider.unkownError);
            });
        });
    }

    async function mockSuccesfulProviderCall(functionName: string, customer1EventMessage: HandoffEventMessage): Promise<void> {
        const callPromise = new Promise((res: Function) => {
            (providerSpy[functionName] as sinon.SinonExpectation).callsFake(() => {
                res();
            });
        });

        await new BotTester(bot)
            .sendMessageToBot(customer1EventMessage)
            .then(() => callPromise)
            .runTest();
    }

    beforeEach(() => {
        const handoffOptions: IHandoffOptions = {};

        // provider = new InMemoryProvider();
        providerSpy = TestDataProvider.createIProviderSpy(); //createIProviderSpy(provider);

        eventHandlerSpies = TestDataProvider.getEventHandlerSpies();
        handoffOptions.eventHandlers = eventHandlerSpies;
        bot = new UniversalBot(connector);

        bot.dialog('/', (session: Session) => {
            session.send('this message does not matter for this test');
        });

        applyHandoffMiddleware(bot, isAgent, providerSpy, handoffOptions);
    });

    describe('queue', () => {
        beforeEach(async () => await mockSuccesfulProviderCall('queueCustomerForAgent', TestDataProvider.customer1.eventMessage.toQueue));

        it('calls provider.queueCustomerForAgent', () => {
            expect(providerSpy.queueCustomerForAgent).to.have.been.calledWith(TestDataProvider.customer1.address);
        });

        it('calls the queue event success handler when successful', () => {
            expect(eventHandlerSpies.queue.success).to.have.been.calledWith(bot, TestDataProvider.customer1.eventMessage.toQueue);
        });
    });

    describe('dequeue', () => {
        beforeEach(async () =>
            await mockSuccesfulProviderCall('dequeueCustomerForAgent', TestDataProvider.customer1.eventMessage.toDequeue));

        it('calls provider.dequeueCustomerForAgent', () => {
            expect(providerSpy.dequeueCustomerForAgent).to.have.been.calledWith(TestDataProvider.customer1.address);
        });

        it('calls the dequeue event success handler when successful', () => {
            expect(eventHandlerSpies.dequeue.success).to.have.been.calledWith(bot, TestDataProvider.customer1.eventMessage.toDequeue);
        });
    });

    describe('watch', () => {
        beforeEach(async () =>
            await mockSuccesfulProviderCall('watchConversation', TestDataProvider.agent1.convo1.eventMessage.toWatch.customer1));

        it('calls provider.watchConversation', () => {
            expect(providerSpy.watchConversation)
                .to.have.been.calledWith(TestDataProvider.customer1.address, TestDataProvider.agent1.convo1.address);
        });

        it('calls the watch event success handler when successful', () => {
            expect(eventHandlerSpies.watch.success)
                .to.have.been.calledWith(bot, TestDataProvider.agent1.convo1.eventMessage.toWatch.customer1);
        });
    });

    describe('unwatch', () => {
        beforeEach(async () =>
            await mockSuccesfulProviderCall('unwatchConversation', TestDataProvider.agent1.convo1.eventMessage.toUnwatch.customer1));

        it('calls provider.unwatchConversation', () => {
            expect(providerSpy.unwatchConversation)
                .to.have.been.calledWith(TestDataProvider.customer1.address, TestDataProvider.agent1.convo1.address);
        });

        it('calls the unwatch event success handler when successful', () => {
            expect(eventHandlerSpies.unwatch.success)
                .to.have.been.calledWith(bot, TestDataProvider.agent1.convo1.eventMessage.toUnwatch.customer1);
        });
    });

    describe('connect', () => {
        beforeEach(async () =>
            await mockSuccesfulProviderCall('connectCustomerToAgent', TestDataProvider.agent1.convo1.eventMessage.toConnectTo.customer1));

        it('calls provider.connectCustomerToAgent', () => {
            expect(providerSpy.connectCustomerToAgent)
                .to.have.been.calledWith(TestDataProvider.customer1.address, TestDataProvider.agent1.convo1.address);
        });

        it('calls the connect event success handler when successful', () => {
            expect(eventHandlerSpies.connect.success)
                .to.have.been.calledWith(bot, TestDataProvider.agent1.convo1.eventMessage.toConnectTo.customer1);
        });
    });

    describe('diconnect', () => {
        beforeEach(async () =>
            await mockSuccesfulProviderCall(
                'disconnectCustomerFromAgent',
                TestDataProvider.agent1.convo1.eventMessage.toDisconnectFrom.customer1
            ));

        it('calls provider.disconnectCustomerFromAgent', () => {
        expect(providerSpy.disconnectCustomerFromAgent)
            .to.have.been.calledWith(TestDataProvider.customer1.address, TestDataProvider.agent1.convo1.address);
        });

        it('calls the disconnect event success handler when successful', () => {
        expect(eventHandlerSpies.disconnect.success)
            .to.have.been.calledWith(bot, TestDataProvider.agent1.convo1.eventMessage.toDisconnectFrom.customer1);
        });
    });

    describe('provider failure', () => {
        it('calls the watch failure handler for watch failures', async () => {
            const rejectionIsThrownPromise = rejectProviderFunction('watchConversation');

            await new BotTester(bot)
                .sendMessageToBot(TestDataProvider.agent1.convo1.eventMessage.toWatch.customer1)
                .then(() => rejectionIsThrownPromise)
                .runTest();

            expect(eventHandlerSpies.watch.failure).to.have.been.calledOnce;
        });

        it('calls the unwatch failure handler for watch failures', async () => {
            const rejectionIsThrownPromise = rejectProviderFunction('unwatchConversation');

            await new BotTester(bot)
                .sendMessageToBot(TestDataProvider.agent1.convo1.eventMessage.toUnwatch.customer1)
                .then(() => rejectionIsThrownPromise)
                .runTest();

            expect(eventHandlerSpies.unwatch.failure).to.have.been.calledOnce;
        });

        it('calls the connect failure handler for connect failures', async () => {
            const rejectionIsThrownPromise = rejectProviderFunction('connectCustomerToAgent');

            await new BotTester(bot)
                .sendMessageToBot(TestDataProvider.agent1.convo1.eventMessage.toConnectTo.customer1)
                .then(() => rejectionIsThrownPromise)
                .runTest();

            expect(eventHandlerSpies.connect.failure).to.have.been.calledOnce;
        });

        it('calls the disconnect failure handler for disconnect failures', async () => {
            const rejectionIsThrownPromise = rejectProviderFunction('disconnectCustomerFromAgent');

            await new BotTester(bot)
                .sendMessageToBot(TestDataProvider.agent1.convo1.eventMessage.toDisconnectFrom.customer1)
                .then(() => rejectionIsThrownPromise)
                .runTest();

            expect(eventHandlerSpies.disconnect.failure).to.have.been.calledOnce;
        });

        it('calls the queue failure handler for queue failures', async () => {
            const rejectionIsThrownPromise = rejectProviderFunction('queueCustomerForAgent');

            await new BotTester(bot)
            .sendMessageToBot(TestDataProvider.customer1.eventMessage.toQueue)
                .then(() => rejectionIsThrownPromise)
                .runTest();

            expect(eventHandlerSpies.queue.failure).to.have.been.calledOnce;
        });

        it('calls the dequeue failure handler for dequeue failures', async () => {
            const rejectionIsThrownPromise = rejectProviderFunction('dequeueCustomerForAgent');

            await new BotTester(bot)
                .sendMessageToBot(TestDataProvider.customer1.eventMessage.toDequeue)
                .then(() => rejectionIsThrownPromise)
                .runTest();

            expect(eventHandlerSpies.dequeue.failure).to.have.been.calledOnce;
        });

    });
});
