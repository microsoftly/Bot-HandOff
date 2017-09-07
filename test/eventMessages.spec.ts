import * as $Promise from 'bluebird';
import { BotTester } from 'bot-tester';
import { ConsoleConnector, IAddress, IMessage, Message, Session, UniversalBot } from 'botbuilder';
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
import {
    BotAttemptedToRecordMessageWhileAgentHasConnection
} from './../src/provider/errors/BotAttemptedToRecordMessageWhileAgentHasConnection';
import { IProvider } from './../src/provider/IProvider';
import * as TestDataProvider from './TestDataProvider';

chai.use(sinonChai);

const expect = chai.expect;

const connector = new ConsoleConnector();

function getEchoMessage(originalMessage: string | IMessage, addr?: IAddress): IMessage {
    const text: string = typeof originalMessage === 'string' ? originalMessage : originalMessage.text;
    const address: IAddress = addr || (originalMessage as IMessage).address;

    return new Message()
        .text(`Echo ${text}`)
        .address(address)
        .toMessage();
}

const isAgent = (session: Session): Promise<boolean> => {
    return Promise.resolve(session.message.address.user.name.toLowerCase().includes('agent'));
};

// //tslint:disable
// function createIProviderOfStubs(provider: IProvider): IProvider {
//     Object.getOwnPropertyNames(Object.getPrototypeOf(provider)).forEach((method: string) => {
//         provider[method] = sinon.stub(provider, method as any).callThrough();
//     });

//     return provider;
// }
// //tslint:enable


//tslint:disable
function createIProviderSpyz(provider: IProvider): IProvider {
    Object.getOwnPropertyNames(Object.getPrototypeOf(provider)).forEach((method: string) => {
        provider[method] = sinon.spy(provider, method as any);
    });

    return provider;
}

function createIProviderSpy(provider: IProvider): IProvider {
    provider.addCustomerMessageToTranscript = sinon.mock();
    provider.addAgentMessageToTranscript = sinon.mock();
    provider.addBotMessageToTranscript = sinon.mock();
    provider.addBotMessageToTranscriptIgnoringConversationState = sinon.mock();
    provider.connectCustomerToAgent = sinon.mock();
    provider.disconnectCustomerFromAgent = sinon.mock();
    provider.queueCustomerForAgent = sinon.mock();
    provider.dequeueCustomerForAgent = sinon.mock();
    provider.watchConversation = sinon.mock();
    provider.unwatchConversation = sinon.mock();
    provider.getConversationFromCustomerAddress = sinon.mock();
    provider.getOrCreateNewCustomerConversation = sinon.mock();
    provider.getConversationFromAgentAddress = sinon.mock();
    provider.getAllConversations = sinon.mock();

    return provider;
}
//tslint:enable

function createEventHandlerSpy(): IEventHandler {
    return {
        success: sinon.spy() as EventSuccessHandler,
        failure: sinon.spy() as EventFailureHandler
    };
}

function createEventHandlerSpies(): IEventHandlers {
    return {
        connect: createEventHandlerSpy(),
        disconnect: createEventHandlerSpy(),
        queue: createEventHandlerSpy(),
        dequeue: createEventHandlerSpy(),
        watch: createEventHandlerSpy(),
        unwatch: createEventHandlerSpy()
    };
}

describe('event messages', () => {
    let bot: UniversalBot;
    let provider: IProvider;
    let eventHandlerSpies: IEventHandlers;
    let providerSpy: IProvider;

    // resolves when the error is thrown. Needs to be called before the desired rejected call is made
    function rejectProviderFunction(functionName: string): Promise<{}> {
        const functionMock = providerSpy[functionName] = sinon.mock();

        return new Promise((res: Function) => {
            functionMock.callsFake(() => {
                res();

                return Promise.reject(TestDataProvider.unkownError);
            });
        });
    }

    beforeEach(async () => {
        const handoffOptions: IHandoffOptions = {};

        provider = new InMemoryProvider();
        providerSpy = createIProviderSpy(provider);

        eventHandlerSpies = createEventHandlerSpies();
        handoffOptions.eventHandlers = eventHandlerSpies;
        bot = new UniversalBot(connector);

        bot.dialog('/', (session: Session) => {
            session.send(getEchoMessage(session.message));
        });

        applyHandoffMiddleware(bot, isAgent, providerSpy, handoffOptions);

        // await new BotTester(bot, TestDataProvider.customer1.address)
        //     .sendMessageToBot(TestDataProvider.customer1.message1, getEchoMessage(TestDataProvider.customer1.message1))
        //     .sendMessageToBot(
        //         TestDataProvider.customer2.message2,
        //         getEchoMessage(TestDataProvider.customer2.message2, TestDataProvider.customer2.address))
        //     .runTest();
    });

    async function mockSuccesfulProviderCall(functionName: string, customer1EventMessage: HandoffEventMessage): Promise<void> {
        const callPromise = new Promise((res: Function) => {
            if (!provider[functionName]) {
                console.log(functionName);
            }
            (provider[functionName] as sinon.SinonExpectation).callsFake(() => {
                res();
            });
            // functionMock.callsFake(() => {
            //     res();
            // });
        });

        await new BotTester(bot, TestDataProvider.customer1.address)
            .sendMessageToBot(customer1EventMessage)
            .then(() => callPromise)
            .runTest();
    }

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

        it('calls the watch event success handler when successful', () => {
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

        it('calls the watch event success handler when successful', () => {
        expect(eventHandlerSpies.disconnect.success)
            .to.have.been.calledWith(bot, TestDataProvider.agent1.convo1.eventMessage.toDisconnectFrom.customer1);
        });
    });

    describe('provider failure', () => {
        it('calls the watch failure handler for watch failures', async () => {
            const rejectionIsThrownPromise = rejectProviderFunction('watchConversation');

            await new BotTester(bot, TestDataProvider.customer2.address)
                .sendMessageToBot(TestDataProvider.agent1.convo1.eventMessage.toWatch.customer1)
                .then(() => rejectionIsThrownPromise)
                .runTest();

            expect(eventHandlerSpies.watch.failure).to.have.been.calledOnce;
        });

        it('calls the unwatch failure handler for watch failures', async () => {
            const rejectionIsThrownPromise = rejectProviderFunction('unwatchConversation');

            await new BotTester(bot, TestDataProvider.customer2.address)
                .sendMessageToBot(TestDataProvider.agent1.convo1.eventMessage.toUnwatch.customer1)
                .then(() => rejectionIsThrownPromise)
                .runTest();

            expect(eventHandlerSpies.unwatch.failure).to.have.been.calledOnce;
        });

        it('calls the connect failure handler for connect failures', async () => {
            const rejectionIsThrownPromise = rejectProviderFunction('connectCustomerToAgent');

            await new BotTester(bot, TestDataProvider.customer2.address)
                .sendMessageToBot(TestDataProvider.agent1.convo1.eventMessage.toConnectTo.customer1)
                .then(() => rejectionIsThrownPromise)
                .runTest();

            expect(eventHandlerSpies.connect.failure).to.have.been.calledOnce;
        });

        it('calls the disconnect failure handler for disconnect failures', async () => {
            const rejectionIsThrownPromise = rejectProviderFunction('disconnectCustomerFromAgent');

            await new BotTester(bot, TestDataProvider.customer2.address)
                .sendMessageToBot(TestDataProvider.agent1.convo1.eventMessage.toDisconnectFrom.customer1)
                .then(() => rejectionIsThrownPromise)
                .runTest();

            expect(eventHandlerSpies.disconnect.failure).to.have.been.calledOnce;
        });

        it('calls the queue failure handler for queue failures', async () => {
            const rejectionIsThrownPromise = rejectProviderFunction('queueCustomerForAgent');

            await new BotTester(bot, TestDataProvider.customer2.address)
            .sendMessageToBot(TestDataProvider.customer1.eventMessage.toQueue)
                .then(() => rejectionIsThrownPromise)
                .runTest();

            expect(eventHandlerSpies.queue.failure).to.have.been.calledOnce;
        });

        it('calls the dequeue failure handler for dequeue failures', async () => {
            const rejectionIsThrownPromise = rejectProviderFunction('dequeueCustomerForAgent');

            await new BotTester(bot, TestDataProvider.customer2.address)
                .sendMessageToBot(TestDataProvider.customer1.eventMessage.toDequeue)
                .then(() => rejectionIsThrownPromise)
                .runTest();

            expect(eventHandlerSpies.dequeue.failure).to.have.been.calledOnce;
        });

    });
    // describe('watch/unwatch', () => {
    //     beforeEach(async () => {
    //         convo = await provider.watchConversation(TestDataProvider.customer1.address, TestDataProvider.AGENT_1_CONVO_1);
    //     });

    //     it('watch does not affect conversation state', () => {
    //         expect(convo.conversationState).to.eq(ConversationState.Bot);
    //     });

    //     it('watch adds the agent address to the watching agents collection', () => {
    //         expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_1_CONVO_1);
    //     });

    //     it('multiple agents can watch a single conversation', async () => {
    //         convo = await provider.watchConversation(TestDataProvider.customer1.address, TestDataProvider.AGENT_2_CONVO_1);

    //         expect(convo.watchingAgents.length).to.eq(2);
    //         expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_1_CONVO_1);
    //         expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_2_CONVO_1);
    //     });

    //     it('multiple agents can watch multiple conversations', async () => {
    //         const convo2 = await provider.watchConversation(TestDataProvider.customer2.address, TestDataProvider.AGENT_1_CONVO_2);

    //         expect(convo.watchingAgents.length).to.eq(1);
    //         expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_1_CONVO_1);

    //         expect(convo2.watchingAgents.length).to.eq(1);
    //         expect(convo2.watchingAgents).to.include(TestDataProvider.AGENT_1_CONVO_2);

    //     });

    //     describe('unwatch', () => {
    //         beforeEach(async () => {
    //             convo = await provider.unwatchConversation(TestDataProvider.customer1.address, TestDataProvider.AGENT_1_CONVO_1);
    //         });

    //         it('removes the agent from the watching agents collection', () => {
    //             expect(convo.watchingAgents).not.to.include(TestDataProvider.AGENT_1_CONVO_1);
    //         });

    //         it('does not affect other agents in watch list', async () => {
    //             await provider.watchConversation(TestDataProvider.customer1.address, TestDataProvider.AGENT_2_CONVO_1);
    //             convo = await provider.unwatchConversation(TestDataProvider.customer1.address, TestDataProvider.AGENT_1_CONVO_1);

    //             expect(convo.watchingAgents.length).to.eq(1);
    //             expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_2_CONVO_1);
    //         });

    //         it('does not affect other conversations with other customers', async () => {
    //             await provider.watchConversation(TestDataProvider.customer2.address, TestDataProvider.AGENT_1_CONVO_1);
    //             await provider.unwatchConversation(TestDataProvider.customer1.address, TestDataProvider.AGENT_1_CONVO_2);
    //             convo = await provider.getConversationFromCustomerAddress(TestDataProvider.customer2.address);

    //             expect(convo.watchingAgents.length).to.eq(1);
    //         });
    //     });
    // });

    // describe('connect/disconnect', () => {
    //     beforeEach(async () => {
    //         convo = await provider.connectCustomerToAgent(TestDataProvider.customer1.address, TestDataProvider.AGENT_1_CONVO_1);
    //     });

    //     it('sets conversation state to agent', () => {
    //         expect(convo.conversationState).to.eq(ConversationState.Agent);
    //     });

    //     it('adds the agent address to the watching agent list', () => {
    //         expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_1_CONVO_1);
    //     });

    //     it('sets agentAddress on conversation', () => {
    //         expect(convo.agentAddress).to.eq(TestDataProvider.AGENT_1_CONVO_1);
    //     });

    //     it('agent messages are transcribed to the connected customer conversation', async () => {
    //         await provider.addAgentMessageToTranscript(TestDataProvider.AGENT_1_CONVO_1_MESSAGE_1);

    //         convo = await provider.getConversationFromAgentAddress(TestDataProvider.AGENT_1_CONVO_1);

    //         expect(convo.transcript.length).to.eq(2);
    //     });

    //     it('throws an error if a bot message is recorded while agent-customer connection is established', () => {
    //         // can pass in any message for customer 1 for this to work
    //         return provider.addBotMessageToTranscript(TestDataProvider.customer1.message1)
    //             .then(() => expect.fail('should have thrown an error'))
    //             .catch((e: Error) => expect(e).to.be.instanceOf(BotAttemptedToRecordMessageWhileAgentHasConnection));
    //     });

    //     describe('disconnect', () => {
    //         beforeEach(async () => {
    //             convo = await provider.disconnectCustomerFromAgent(TestDataProvider.customer1.address, TestDataProvider.AGENT_1_CONVO_1);
    //         });

    //         it('sets conversation state to bot', () => {
    //             expect(convo.conversationState).to.eq(ConversationState.Bot);
    //         });

    //         it('unsets agentAddress', () => {
    //             expect(convo.agentAddress).to.be.undefined;
    //         });

    //         it('removes agent from watching agent collection', () => {
    //             expect(convo.watchingAgents.length).to.eq(0);
    //         });

    //         it('throws not connected error if the agent not connected and agent transcription attempt occurs', () => {
    //             // as long as the messsage is sourced from agent 2, this is good
    //             return provider.addAgentMessageToTranscript(TestDataProvider.AGENT_2_CONVO_1_MESSAGE_1)
    //                 .then(() => expect.fail('should throw an AgentNotInConversationError'))
    //                 .catch((e: Error) => expect(e).to.be.instanceOf(AgentNotInConversationError));
    //         });

    //         it('does not affect other watching agents', async () => {
    //             await provider.connectCustomerToAgent(TestDataProvider.customer1.address, TestDataProvider.AGENT_1_CONVO_1);
    //             convo = await provider.watchConversation(TestDataProvider.customer1.address, TestDataProvider.AGENT_2_CONVO_1);

    //             expect(convo.agentAddress).to.deep.eq(TestDataProvider.AGENT_1_CONVO_1);
    //             expect(convo.conversationState).to.eq(ConversationState.Agent);
    //             expect(convo.watchingAgents.length).to.eq(2);
    //             expect(convo.watchingAgents).to.deep.include(TestDataProvider.AGENT_1_CONVO_1);
    //             expect(convo.watchingAgents).to.deep.include(TestDataProvider.AGENT_2_CONVO_1);

    //             convo = await provider.disconnectCustomerFromAgent(TestDataProvider.customer1.address, TestDataProvider.AGENT_2_CONVO_1);
    //             expect(convo.agentAddress).not.to.deep.eq(TestDataProvider.AGENT_1_CONVO_1);
    //             expect(convo.conversationState).to.eq(ConversationState.Bot);
    //             expect(convo.watchingAgents.length).to.eq(1);
    //             expect(convo.watchingAgents).to.deep.include(TestDataProvider.AGENT_1_CONVO_1);
    //         });
    //     });
    // });
});
