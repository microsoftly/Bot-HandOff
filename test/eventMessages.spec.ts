// import * as $Promise from 'bluebird';
// import { BotTester } from 'bot-tester';
// import { ConsoleConnector, IAddress, IMessage, Message, Session, UniversalBot } from 'botbuilder';
// import * as chai from 'chai';
// import * as sinon from 'sinon';
// import * as sinonChai from 'sinon-chai';
// import { QueueEventMessage } from '../dist/src/eventMessages/QueueEventMessage';
// import { EventSuccessHandler } from '../dist/src/options/EventSuccessHandlers';
// import { applyHandoffMiddleware } from '../src/applyHandoffMiddleware';
// import { DequeueEventMessage } from '../src/eventMessages/DequeueEventMessage';
// import { EventFailureHandler } from '../src/options/EventFailureHandlers';
// import { IEventHandler, IEventHandlers } from '../src/options/IEventHandlers';
// import { IHandoffOptions } from '../src/options/IHandoffOptions';
// import { InMemoryProvider } from '../src/provider/prebuilt/InMemoryProvider';
// import { ConversationState, IConversation } from './../src/IConversation';
// import { AgentNotInConversationError } from './../src/provider/errors/AgentNotInConversationError';
// import {
//     BotAttemptedToRecordMessageWhileAgentHasConnection
// } from './../src/provider/errors/BotAttemptedToRecordMessageWhileAgentHasConnection';
// import { IProvider } from './../src/provider/IProvider';
// import * as TestDataProvider from './TestDataProvider';

// chai.use(sinonChai);

// const expect = chai.expect;

// const connector = new ConsoleConnector();

// function getEchoMessage(originalMessage: string | IMessage, addr?: IAddress): IMessage {
//     const text: string = typeof originalMessage === 'string' ? originalMessage : originalMessage.text;
//     const address: IAddress = addr || (originalMessage as IMessage).address;

//     return new Message()
//         .text(`Echo ${text}`)
//         .address(address)
//         .toMessage();
// }

// const isAgent = (session: Session): Promise<boolean> => {
//     return Promise.resolve(session.message.address.user.name.toLowerCase().includes('agent'));
// };

// //tslint:disable
// function createIProviderSpy(provider: IProvider): IProvider {
//     Object.getOwnPropertyNames(Object.getPrototypeOf(provider)).forEach((method: string) => {
//         provider[method] = sinon.spy(provider, method as any);
//     });

//     return provider;
// }
// //tslint:enable

// function createEventHandlerSpy(): IEventHandler {
//     return {
//         success: sinon.spy() as EventSuccessHandler,
//         failure: sinon.spy() as EventFailureHandler
//     };
// }

// function createEventHandlerSpies(): IEventHandlers {
//     return {
//         connect: createEventHandlerSpy(),
//         disconnect: createEventHandlerSpy(),
//         queue: createEventHandlerSpy(),
//         dequeue: createEventHandlerSpy(),
//         watch: createEventHandlerSpy(),
//         unwatch: createEventHandlerSpy()
//     };
// }

// describe.only('event messages', () => {
//     let bot: UniversalBot;
//     let provider: IProvider;
//     let convoCustomer1: IConversation;
//     let convoCustomer2: IConversation;
//     let eventHandlerSpies: IEventHandlers;
//     let providerSpy: IProvider;
//     let getCustomer1Convo: () => Promise<IConversation>;
//     let getCustomer2Convo: () => Promise<IConversation>;

//     beforeEach(async () => {
//         const handoffOptions: IHandoffOptions = {};

//         provider = new InMemoryProvider();
//         providerSpy = createIProviderSpy(provider);

//         getCustomer1Convo = async () => provider.getConversationFromCustomerAddress(TestDataProvider.CUSTOMER_1);
//         getCustomer2Convo = async () => provider.getConversationFromCustomerAddress(TestDataProvider.CUSTOMER_1);

//         eventHandlerSpies = createEventHandlerSpies();
//         handoffOptions.eventHandlers = eventHandlerSpies;
//         bot = new UniversalBot(connector);

//         bot.dialog('/', (session: Session) => {
//             session.send(getEchoMessage(session.message));
//         });

//         applyHandoffMiddleware(bot, isAgent, provider);

//         await new BotTester(bot, TestDataProvider.CUSTOMER_1)
//             .sendMessageToBot(TestDataProvider.CUSTOMER_1_MESSAGE_1, getEchoMessage(TestDataProvider.CUSTOMER_1_MESSAGE_1))
//             .sendMessageToBot(
//                 TestDataProvider.CUSTOMER_2_MESSAGE_1,
//                 getEchoMessage(TestDataProvider.CUSTOMER_2_MESSAGE_1, TestDataProvider.CUSTOMER_2))
//             .runTest();
//     });

//     describe('queue', () => {
//         beforeEach(async () => {
//             await new BotTester(bot, TestDataProvider.CUSTOMER_1)
//                 .sendMessageToBot(customer1QueueEventMessage)
//                 .runTest();

//             convoCustomer1 = await getCustomer1Convo();
//         });

//         it('sets conversation state to wait', () => {
//             expect(convoCustomer1.conversationState).to.eq(ConversationState.Wait);
//         });

//         it('does not affect agentAddress', () => {
//             expect(convoCustomer1.agentAddress).to.be.undefined;
//         });

//         it('calls the queue event success handler when successful', () => {
//             expect(eventHandlerSpies.queue.success).to.have.been.calledWith(bot,)
//         });

//         describe('dequeue', () => {
//             // queues customer 2
//             // dequeues customer 1
//             beforeEach(async () => {
//                 await new BotTester(bot, TestDataProvider.CUSTOMER_1)
//                     .sendMessageToBot(new QueueEventMessage(TestDataProvider.CUSTOMER_2))
//                     .sendMessageToBot(new DequeueEventMessage(TestDataProvider.CUSTOMER_1))
//                     .runTest();

//                 convoCustomer1 = await getCustomer1Convo();
//                 convoCustomer2 = await getCustomer2Convo();
//             });

//             it('returns the state to bot', () => {
//                 expect(convoCustomer1.conversationState).to.eq(ConversationState.Bot);
//             });

//             it('does not affect the waiting state of other customers', () => {
//                 expect(convoCustomer2.conversationState).to.eq(ConversationState.Wait);
//             });
//         });
//     });

//     // describe('watch/unwatch', () => {
//     //     beforeEach(async () => {
//     //         convo = await provider.watchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1);
//     //     });

//     //     it('watch does not affect conversation state', () => {
//     //         expect(convo.conversationState).to.eq(ConversationState.Bot);
//     //     });

//     //     it('watch adds the agent address to the watching agents collection', () => {
//     //         expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_1_CONVO_1);
//     //     });

//     //     it('multiple agents can watch a single conversation', async () => {
//     //         convo = await provider.watchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_2_CONVO_1);

//     //         expect(convo.watchingAgents.length).to.eq(2);
//     //         expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_1_CONVO_1);
//     //         expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_2_CONVO_1);
//     //     });

//     //     it('multiple agents can watch multiple conversations', async () => {
//     //         const convo2 = await provider.watchConversation(TestDataProvider.CUSTOMER_2, TestDataProvider.AGENT_1_CONVO_2);

//     //         expect(convo.watchingAgents.length).to.eq(1);
//     //         expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_1_CONVO_1);

//     //         expect(convo2.watchingAgents.length).to.eq(1);
//     //         expect(convo2.watchingAgents).to.include(TestDataProvider.AGENT_1_CONVO_2);

//     //     });

//     //     describe('unwatch', () => {
//     //         beforeEach(async () => {
//     //             convo = await provider.unwatchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1);
//     //         });

//     //         it('removes the agent from the watching agents collection', () => {
//     //             expect(convo.watchingAgents).not.to.include(TestDataProvider.AGENT_1_CONVO_1);
//     //         });

//     //         it('does not affect other agents in watch list', async () => {
//     //             await provider.watchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_2_CONVO_1);
//     //             convo = await provider.unwatchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1);

//     //             expect(convo.watchingAgents.length).to.eq(1);
//     //             expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_2_CONVO_1);
//     //         });

//     //         it('does not affect other conversations with other customers', async () => {
//     //             await provider.watchConversation(TestDataProvider.CUSTOMER_2, TestDataProvider.AGENT_1_CONVO_1);
//     //             await provider.unwatchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_2);
//     //             convo = await provider.getConversationFromCustomerAddress(TestDataProvider.CUSTOMER_2);

//     //             expect(convo.watchingAgents.length).to.eq(1);
//     //         });
//     //     });
//     // });

//     // describe('connect/disconnect', () => {
//     //     beforeEach(async () => {
//     //         convo = await provider.connectCustomerToAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1);
//     //     });

//     //     it('sets conversation state to agent', () => {
//     //         expect(convo.conversationState).to.eq(ConversationState.Agent);
//     //     });

//     //     it('adds the agent address to the watching agent list', () => {
//     //         expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_1_CONVO_1);
//     //     });

//     //     it('sets agentAddress on conversation', () => {
//     //         expect(convo.agentAddress).to.eq(TestDataProvider.AGENT_1_CONVO_1);
//     //     });

//     //     it('agent messages are transcribed to the connected customer conversation', async () => {
//     //         await provider.addAgentMessageToTranscript(TestDataProvider.AGENT_1_CONVO_1_MESSAGE_1);

//     //         convo = await provider.getConversationFromAgentAddress(TestDataProvider.AGENT_1_CONVO_1);

//     //         expect(convo.transcript.length).to.eq(2);
//     //     });

//     //     it('throws an error if a bot message is recorded while agent-customer connection is established', () => {
//     //         // can pass in any message for customer 1 for this to work
//     //         return provider.addBotMessageToTranscript(TestDataProvider.CUSTOMER_1_MESSAGE_1)
//     //             .then(() => expect.fail('should have thrown an error'))
//     //             .catch((e: Error) => expect(e).to.be.instanceOf(BotAttemptedToRecordMessageWhileAgentHasConnection));
//     //     });

//     //     describe('disconnect', () => {
//     //         beforeEach(async () => {
//     //             convo = await provider.disconnectCustomerFromAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1);
//     //         });

//     //         it('sets conversation state to bot', () => {
//     //             expect(convo.conversationState).to.eq(ConversationState.Bot);
//     //         });

//     //         it('unsets agentAddress', () => {
//     //             expect(convo.agentAddress).to.be.undefined;
//     //         });

//     //         it('removes agent from watching agent collection', () => {
//     //             expect(convo.watchingAgents.length).to.eq(0);
//     //         });

//     //         it('throws not connected error if the agent not connected and agent transcription attempt occurs', () => {
//     //             // as long as the messsage is sourced from agent 2, this is good
//     //             return provider.addAgentMessageToTranscript(TestDataProvider.AGENT_2_CONVO_1_MESSAGE_1)
//     //                 .then(() => expect.fail('should throw an AgentNotInConversationError'))
//     //                 .catch((e: Error) => expect(e).to.be.instanceOf(AgentNotInConversationError));
//     //         });

//     //         it('does not affect other watching agents', async () => {
//     //             await provider.connectCustomerToAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1);
//     //             convo = await provider.watchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_2_CONVO_1);

//     //             expect(convo.agentAddress).to.deep.eq(TestDataProvider.AGENT_1_CONVO_1);
//     //             expect(convo.conversationState).to.eq(ConversationState.Agent);
//     //             expect(convo.watchingAgents.length).to.eq(2);
//     //             expect(convo.watchingAgents).to.deep.include(TestDataProvider.AGENT_1_CONVO_1);
//     //             expect(convo.watchingAgents).to.deep.include(TestDataProvider.AGENT_2_CONVO_1);

//     //             convo = await provider.disconnectCustomerFromAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_2_CONVO_1);
//     //             expect(convo.agentAddress).not.to.deep.eq(TestDataProvider.AGENT_1_CONVO_1);
//     //             expect(convo.conversationState).to.eq(ConversationState.Bot);
//     //             expect(convo.watchingAgents.length).to.eq(1);
//     //             expect(convo.watchingAgents).to.deep.include(TestDataProvider.AGENT_1_CONVO_1);
//     //         });
//     //     });
//     // });
// });
