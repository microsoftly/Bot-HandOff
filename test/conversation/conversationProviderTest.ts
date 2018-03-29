import { IAddress, IIdentity, IMessage } from 'botbuilder';
import { expect } from 'chai';
// tslint:disable-next-line: no-import-side-effect
import 'mocha';
import { ConversationState } from './../../src/conversation/ConversationState';
import { IConversationProvider } from './../../src/conversation/IConversationProvider';
import { ITranscriptLine } from './../../src/conversation/ITranscriptLine';
import { InMemoryConversationProvider } from './../../src/conversation/prebuiltProviders/InMemoryConversationProvider/index';
import * as TestData from './testDataProvider';

function expectTranscriptToContain(transcript: ITranscriptLine[], ...messages: (IMessage |ITranscriptLine)[]): void {
    expect(transcript.length).to.eq(messages.length);

    //tslint:disable-next-line
    for (let i = 0; i < transcript.length; i++) {
        const actualMessage = transcript[i];
        const expectedMessage = messages[i];

        expect(actualMessage).to.deep.include(expectedMessage);
    }
}

export function conversationProviderTest<T extends IAddress>(
    getConversationProvider: () => Promise<InMemoryConversationProvider<T>>,
    providerName: string
): void {
    describe(`Conversation provider ${providerName}`, () => {
        let convoProvider: InMemoryConversationProvider<T>;

        beforeEach(async () => {
            convoProvider = await getConversationProvider();

            await convoProvider.addCustomerMessageToTranscript(TestData.customer1.message1);
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

            // TODO add error cases
            // 1. when connected to agent
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

            // TODO error cases
            // 1. when not queued. -> this could be a product spec and updated. Reconsider with feedback
            // I'm assuming transfers are okay
        });

        describe('disconnect from agent', () => {
            it('updates the conversation state to Bot', async () => {
                await convoProvider.enqueueCustomer(TestData.customer1.address);
                await convoProvider.connectCustomerToAgent(TestData.customer1.address, TestData.agent1.convo1.address as T);
                await convoProvider.disconnectCustomerFromAgent(TestData.customer1.address);

                const convo = await convoProvider.getConversationFromCustomerAddress(TestData.customer1.address);

                expect(convo.conversationState).to.eq(ConversationState.Bot);
            });

            // TODO error cases
            // 1. when not connect to agent
        });

        describe('agent messages', () => {
            beforeEach(async () => {
                await convoProvider.addCustomerMessageToTranscript(TestData.customer1.message1);
            });

            it('');

            // TODO error cases
            // 1. when connected to bot
            // 2. when queued
            // 3. recorded agent and agent sending message do not match
        });
    });
}
