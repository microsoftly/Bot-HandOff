import { IAddress, IIdentity, IMessage } from 'botbuilder';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
// tslint:disable-next-line: no-import-side-effect
import 'mocha';
import { Db, MongoClient } from 'mongodb';
import { isNullOrUndefined } from 'util';
import { IConversation } from '../../src/conversation/IConversation';
import { ConversationState } from './../../src/conversation/ConversationState';
import { IConversationProvider } from './../../src/conversation/IConversationProvider';
import { ITranscriptLine } from './../../src/conversation/ITranscriptLine';
import { InMemoryConversationProvider } from './../../src/conversation/prebuiltProviders/InMemoryConversationProvider/index';
import * as TestData from './testDataProvider';
chai.use(chaiAsPromised);

const expect = chai.expect;

function expectTranscriptToContain(transcript: ITranscriptLine[], ...messages: (IMessage |ITranscriptLine)[]): void {
    expect(transcript.length).to.eq(messages.length);

    //tslint:disable-next-line
    for (let i = 0; i < transcript.length; i++) {
        const actualMessage = transcript[i];
        const expectedMessage = messages[i];

        if (isNullOrUndefined(actualMessage.from) && isNullOrUndefined((expectedMessage as ITranscriptLine).from)) {
            actualMessage.from = null;
            (expectedMessage as ITranscriptLine).from = null;
        }
        expect(actualMessage).to.deep.include(expectedMessage);
    }
}

export function conversationProviderTest<T extends IAddress>(
    getConversationProvider: () => Promise<IConversationProvider<T>>,
    providerName: string
): void {
    describe(`Conversation provider ${providerName}`, () => {
        let convoProvider: IConversationProvider<T>;
        let mongoClient: MongoClient;

        beforeEach(async () => {
            mongoClient = await MongoClient.connect('mongodb://127.0.0.1:27017');

            const  db = mongoClient.db('__test_handoff__');

            try {
                await db.dropCollection('conversations');
            } catch (e) {}

            convoProvider = await getConversationProvider();

            await convoProvider.addCustomerMessageToTranscript(TestData.customer1.message1);
        });

        afterEach(async () => {
            await mongoClient.close(true);
            await convoProvider.closeOpenConnections();
        });

        it('new customers can have their messages recorded', async () => {
            const convo = await convoProvider.getConversationFromCustomerAddress(TestData.customer1.address);

            expectTranscriptToContain(convo.transcript, TestData.customer1.message1);
        });

        it('existing customers can have their messages recorded', async () => {
            await convoProvider.addCustomerMessageToTranscript(TestData.customer1.message2);
            await convoProvider.addCustomerMessageToTranscript(TestData.customer1.message3);

            const convo = await convoProvider.getConversationFromCustomerAddress(TestData.customer1.address);

            expectTranscriptToContain(convo.transcript,
                                      TestData.customer1.message1,
                                      TestData.customer1.message2,
                                      TestData.customer1.message3);
        });

        it('multiple customers can save messages at the same time', async () => {
            await convoProvider.addCustomerMessageToTranscript(TestData.customer2.message1);
            await convoProvider.addCustomerMessageToTranscript(TestData.customer1.message2);

            await convoProvider.addCustomerMessageToTranscript(TestData.customer2.message2);
            await convoProvider.addCustomerMessageToTranscript(TestData.customer1.message3);
            await convoProvider.addCustomerMessageToTranscript(TestData.customer2.message3);

            const customer1Convo = await convoProvider.getConversationFromCustomerAddress(TestData.customer1.address);
            const customer2Convo = await convoProvider.getConversationFromCustomerAddress(TestData.customer2.address);

            expectTranscriptToContain(customer1Convo.transcript,
                                      TestData.customer1.message1,
                                      TestData.customer1.message2,
                                      TestData.customer1.message3);

            expectTranscriptToContain(customer2Convo.transcript,
                                      TestData.customer2.message1,
                                      TestData.customer2.message2,
                                      TestData.customer2.message3);
        });

        describe('enqueue', () => {
            it('updates conversation to queued', async () => {
                await convoProvider.enqueueCustomer(TestData.customer1.address);

                const convo = await convoProvider.getConversationFromCustomerAddress(TestData.customer1.address);

                expect(convo.conversationState).to.eq(ConversationState.Queued);
            });

            // TODO add error cases
            // 1. when connected to agent
            it('throws an error when connected to an agent', async () => {
                await convoProvider.enqueueCustomer(TestData.customer1.address);
                await convoProvider.connectCustomerToAgent(TestData.customer1.address, TestData.agent1.convo1.address as T);

                try {
                    await convoProvider.enqueueCustomer(TestData.customer1.address);
                    expect.fail('enqueiing a customer that is already connected to an did not throw an error');
                } catch (e) {}
            });
        });

        describe('dequeue', () => {
            it('updates conversation state to Bot', async () => {
                await convoProvider.enqueueCustomer(TestData.customer1.address);
                await convoProvider.dequeueCustomer(TestData.customer1.address);

                const convo = await convoProvider.getConversationFromCustomerAddress(TestData.customer1.address);

                expect(convo.conversationState).to.eq(ConversationState.Bot);
            });

            // TODO add error cases
            // 1. dequeue when not queued
        });

        describe('bot messages', () => {
            it('can be recorded to conversations', async () => {
                await convoProvider.addBotMessageToTranscript(TestData.customer1.bot.response1);
                await convoProvider.addBotMessageToTranscript(TestData.customer1.bot.response2);
                await convoProvider.addBotMessageToTranscript(TestData.customer1.bot.response3);
                await convoProvider.addCustomerMessageToTranscript(TestData.customer1.message2);

                const convo = await convoProvider.getConversationFromCustomerAddress(TestData.customer1.address);

                expectTranscriptToContain(convo.transcript,
                                          TestData.customer1.message1,
                                          TestData.customer1.bot.response1,
                                          TestData.customer1.bot.response2,
                                          TestData.customer1.bot.response3,
                                          TestData.customer1.message2);
            });
        });

        describe('connect to agent', () => {
            it('updates conversation state to agent', async () => {
                await convoProvider.enqueueCustomer(TestData.customer1.address);
                await convoProvider.connectCustomerToAgent(TestData.customer1.address, TestData.agent1.convo1.address as T);

                const convo = await convoProvider.getConversationFromCustomerAddress(TestData.customer1.address);

                expect(convo.conversationState).to.eq(ConversationState.Agent);
                // tslint:disable-next-line:no-unused-expression
                expect(convo.agentAddress).to.not.be.undefined;
                expect(convo.agentAddress).to.deep.eq(TestData.agent1.convo1.address);
            });

            it('throws an error when not in a queued state', async () => {
                try {
                    await convoProvider.connectCustomerToAgent(TestData.customer1.address, TestData.agent1.convo1.address as T);
                    expect.fail('connect customer to agent should have thrown an error while in Bot state');
                } catch (e) {}
            });
        });

        describe('disconnect from agent', () => {
            it('updates the conversation state to Bot', async () => {
                await convoProvider.enqueueCustomer(TestData.customer1.address);
                await convoProvider.connectCustomerToAgent(TestData.customer1.address, TestData.agent1.convo1.address as T);
                await convoProvider.disconnectCustomerFromAgent(TestData.customer1.address);

                let convo = await convoProvider.getConversationFromCustomerAddress(TestData.customer1.address);

                expect(convo.conversationState).to.eq(ConversationState.Bot);

                await convoProvider.enqueueCustomer(TestData.customer1.address);
                await convoProvider.connectCustomerToAgent(TestData.customer1.address, TestData.agent1.convo1.address as T);
                await convoProvider.disconnectAgentFromCustomer(TestData.agent1.convo1.address as T);

                convo = await convoProvider.getConversationFromCustomerAddress(TestData.customer1.address);

                expect(convo.conversationState).to.eq(ConversationState.Bot);
                //tslint:disable-next-line
                expect(convo.agentAddress).to.be.null
            });

            it('throws an exception when not connected to an agent', async () => {
                try {
                    await convoProvider.disconnectAgentFromCustomer(TestData.agent1.convo1.address as T);
                    expect.fail('disconnect agent from customer did not throw an error');
                } catch (e) {}

                try {
                    await convoProvider.disconnectCustomerFromAgent(TestData.customer1.address);
                    expect.fail('disconnect customer from agent did not throw an error');
                } catch (e) {}

                await convoProvider.enqueueCustomer(TestData.customer1.address);

                try {
                    await convoProvider.disconnectAgentFromCustomer(TestData.agent1.convo1.address as T);
                    expect.fail('disconnect agent from customer did not throw an error');
                } catch (e) {}

                try {
                    await convoProvider.disconnectCustomerFromAgent(TestData.customer1.address);
                    expect.fail('disconnect customer from agent did not throw an error');
                } catch (e) {}
            });
        });

        describe('agent messages', () => {
            it('are recorded', async () => {
                await convoProvider.enqueueCustomer(TestData.customer1.address);
                await convoProvider.connectCustomerToAgent(TestData.customer1.address, TestData.agent1.convo1.address as T);
                await convoProvider.addAgentMessageToTranscript(TestData.agent1.convo1.message1);
                await convoProvider.addAgentMessageToTranscript(TestData.agent1.convo1.message2);
                await convoProvider.addCustomerMessageToTranscript(TestData.customer1.message2);

                const convo = await convoProvider.getConversationFromCustomerAddress(TestData.customer1.address);

                expectTranscriptToContain(convo.transcript,
                                          TestData.customer1.message1,
                                          TestData.agent1.convo1.message1,
                                          TestData.agent1.convo1.message2,
                                          TestData.customer1.message2);
            });

            it('throw an error when not conversation state is not agent', async () => {
                try {
                    await convoProvider.addAgentMessageToTranscript(TestData.agent1.convo1.message1);
                    expect.fail('transcribing an agent messages should have failed due to being in Bot state');
                } catch (e) {}

                await convoProvider.enqueueCustomer(TestData.customer1.address);

                try {
                    await convoProvider.addAgentMessageToTranscript(TestData.agent1.convo1.message1);
                    expect.fail('transcribing an agent messages should have failed due to being in queued state');
                } catch (e) {}
            });

            it('throws an error when a different than the connected agent sent a message', async () => {
                await convoProvider.enqueueCustomer(TestData.customer1.address);
                await convoProvider.connectCustomerToAgent(TestData.customer1.address, TestData.agent1.convo1.address as T);
                await convoProvider.addAgentMessageToTranscript(TestData.agent1.convo1.message1);

                try {
                    await convoProvider.addAgentMessageToTranscript(TestData.agent2.convo1.message1);
                    expect.fail('An agent other than the connected agent recording a message did not throw an error');
                } catch (e) {}
            });
        });

        it('can get all conversations currently active with an agent', async () => {
            await convoProvider.enqueueCustomer(TestData.customer1.address);
            await convoProvider.connectCustomerToAgent(TestData.customer1.address, TestData.agent1.convo1.address as T);
            await convoProvider.addCustomerMessageToTranscript(TestData.customer2.message1);

            let connectedConversations = await convoProvider.getConversationsConnectedToAgent();

            expect(connectedConversations.length).to.eq(1);
            expect(connectedConversations[0].conversationState).to.eq(ConversationState.Agent);
            expect(connectedConversations[0].customerAddress).to.deep.eq(TestData.customer1.address);

            await convoProvider.enqueueCustomer(TestData.customer2.address);
            await convoProvider.connectCustomerToAgent(TestData.customer2.address, TestData.agent1.convo2.address as T);

            connectedConversations = await convoProvider.getConversationsConnectedToAgent();

            expect(connectedConversations.length).to.eq(2);
            connectedConversations.forEach((convo: IConversation<T>) => expect(convo.conversationState).to.eq(ConversationState.Agent));
            expect(connectedConversations[0].customerAddress).to.not.deep.eq(connectedConversations[1].customerAddress);
        });
    });
}
