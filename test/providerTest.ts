import * as $Promise from 'bluebird';
import { expect } from 'chai';
import {
    AgentAlreadyConnectedOnConversationIdException
} from '../src/provider/errors/AgentAlreadyConnectedOnConversationIdException';
import { ConversationState, IConversation } from './../src/IConversation';
import { AgentNotInConversationError } from './../src/provider/errors/AgentNotInConversationError';
import { IProvider } from './../src/provider/IProvider';
import * as TestDataProvider from './TestDataProvider';

export function providerTest(getNewProvider: () => $Promise<IProvider>, providerName: string): void {
    let provider: IProvider;

    describe(providerName, () => {
        let convo: IConversation;
        let customer1Convo: IConversation;
        let customer2Convo: IConversation;

        beforeEach(() => {
            return getNewProvider()
                .then((newProvider: IProvider) => provider = newProvider)
                .then(() => $Promise.all([
                    provider.addCustomerMessageToTranscript(TestDataProvider.customer1.message1),
                    provider.addCustomerMessageToTranscript(TestDataProvider.customer2.message1)
                ]))
                .spread((customer1ConvoOut: IConversation, customer2ConvoOut: IConversation) => {
                    customer1Convo = customer1ConvoOut;
                    customer2Convo = customer2ConvoOut;
                });
        });

        describe('customer messages', () => {
            beforeEach(() => {
                return $Promise.all([
                        provider.addCustomerMessageToTranscript(TestDataProvider.customer1.message2),
                        provider.addCustomerMessageToTranscript(TestDataProvider.customer2.message2)
                    ])
                    .spread((customer1ConvoOut: IConversation, customer2ConvoOut: IConversation) => {
                        customer1Convo = customer1ConvoOut;
                        customer2Convo = customer2ConvoOut;
                    });
            });

            it('can be uniquely retrieved for separate customers', () => {
                expect(customer1Convo.transcript.length).to.eq(2);
                expect(customer1Convo.transcript[0].text).to.eq(TestDataProvider.customer1.message1.text);
                expect(customer1Convo.transcript[1].text).to.eq(TestDataProvider.customer1.message2.text);

                expect(customer2Convo.transcript.length).to.eq(2);
                expect(customer2Convo.transcript[0].text).to.eq(TestDataProvider.customer2.message1.text);
                expect(customer2Convo.transcript[1].text).to.eq(TestDataProvider.customer2.message2.text);
            });

            it('saves the customer address to the conversation', () => {
                expect(customer1Convo.customerAddress).to.deep.eq(TestDataProvider.customer1.address);
                expect(customer2Convo.customerAddress).to.deep.eq(TestDataProvider.customer2.address);
            });
        });

        describe('queue/dequeue', () => {
            beforeEach(async () => {
                convo = await provider.queueCustomerForAgent(TestDataProvider.customer1.address);
            });

            it('queue sets conversation state to wait', () => {
                expect(convo.conversationState).to.eq(ConversationState.Wait);
            });

            // more testing may be needed around this
            it('queue does not affect agentAddress', () => {
                expect(convo.agentAddress).to.be.undefined;
            });

            // assumes watch works
            it('watch and unwatch does not affect wait conversation state', async () => {
                convo = await provider.watchConversation(TestDataProvider.customer1.address, TestDataProvider.agent1.convo1.address);

                expect(convo.conversationState).to.eq(ConversationState.Wait);

                convo = await provider.unwatchConversation(TestDataProvider.customer1.address, TestDataProvider.agent1.convo1.address);

                expect(convo.conversationState).to.eq(ConversationState.Wait);
            });

            describe('dequeue', () => {
                beforeEach(async () => {
                    convo = await provider.dequeueCustomerForAgent(TestDataProvider.customer1.address);
                });

                it('returns the state to bot', () => {
                    expect(convo.conversationState).to.eq(ConversationState.Bot);
                });

                // more testing may be needed around this
                it('does not affect agentAddress', () => {
                    expect(convo.agentAddress).to.be.undefined;
                });
            });
        });

        describe('watch/unwatch', () => {
            beforeEach(async () => {
                convo = await provider.watchConversation(TestDataProvider.customer1.address, TestDataProvider.agent1.convo1.address);
            });

            it('watch does not affect conversation state', () => {
                expect(convo.conversationState).to.eq(ConversationState.Bot);
            });

            it('watch adds the agent address to the watching agents collection', () => {
                expect(convo.watchingAgents).to.include(TestDataProvider.agent1.convo1.address);
            });

            it('multiple agents can watch a single conversation', async () => {
                convo = await provider.watchConversation(TestDataProvider.customer1.address, TestDataProvider.agent2.convo1.address);

                expect(convo.watchingAgents.length).to.eq(2);
                expect(convo.watchingAgents).to.include(TestDataProvider.agent1.convo1.address);
                expect(convo.watchingAgents).to.include(TestDataProvider.agent2.convo1.address);
            });

            it('multiple agents can watch multiple conversations', async () => {
                const convo2 = await provider.watchConversation(TestDataProvider.customer2.address, TestDataProvider.agent1.convo2.address);

                expect(convo.watchingAgents.length).to.eq(1);
                expect(convo.watchingAgents).to.include(TestDataProvider.agent1.convo1.address);

                expect(convo2.watchingAgents.length).to.eq(1);
                expect(convo2.watchingAgents).to.include(TestDataProvider.agent1.convo2.address);

            });

            describe('unwatch', () => {
                beforeEach(async () => {
                    convo = await provider.unwatchConversation(TestDataProvider.customer1.address, TestDataProvider.agent1.convo1.address);
                });

                it('removes the agent from the watching agents collection', () => {
                    expect(convo.watchingAgents).not.to.include(TestDataProvider.agent1.convo1.address);
                });

                it('does not affect other agents in watch list', async () => {
                    await provider.watchConversation(TestDataProvider.customer1.address, TestDataProvider.agent2.convo1.address);
                    convo = await provider.unwatchConversation(TestDataProvider.customer1.address, TestDataProvider.agent1.convo1.address);

                    expect(convo.watchingAgents.length).to.eq(1);
                    expect(convo.watchingAgents).to.include(TestDataProvider.agent2.convo1.address);
                });

                it('does not affect other conversations with other customers', async () => {
                    await provider.watchConversation(TestDataProvider.customer2.address, TestDataProvider.agent1.convo1.address);
                    await provider.unwatchConversation(TestDataProvider.customer1.address, TestDataProvider.agent1.convo2.address);
                    const convoCustomer1 = await provider.getConversationFromCustomerAddress(TestDataProvider.customer1.address);
                    const convoCustomer2 = await provider.getConversationFromCustomerAddress(TestDataProvider.customer2.address);

                    expect(convoCustomer1.watchingAgents.length).to.eq(0);
                    expect(convoCustomer2.watchingAgents.length).to.eq(1);
                });
            });
        });

        describe('connect/disconnect', () => {
            beforeEach(async () => {
                convo = await provider.connectCustomerToAgent(TestDataProvider.customer1.address, TestDataProvider.agent1.convo1.address);
                await $Promise.delay(TestDataProvider.EVENT_DELAY);
            });

            it('sets conversation state to agent', () => {
                expect(convo.conversationState).to.eq(ConversationState.Agent);
            });

            it('adds the agent address to the watching agent list', () => {
                expect(convo.watchingAgents).to.include(TestDataProvider.agent1.convo1.address);
            });

            it('sets agentAddress on conversation', () => {
                expect(convo.agentAddress).to.eq(TestDataProvider.agent1.convo1.address);
            });

            it('agent messages are transcribed to the connected customer conversation', async () => {
                await provider.addAgentMessageToTranscript(TestDataProvider.agent1.convo1.message1);

                convo = await provider.getConversationFromAgentAddress(TestDataProvider.agent1.convo1.address);

                expect(convo.transcript.length).to.eq(2);
            });

            it('throws an AgentAlreadyConnectedOnConversationIdException error if attempting to connect on convo id that is already in use', async () => {
                try {
                    await provider.connectCustomerToAgent(TestDataProvider.customer2.address, TestDataProvider.agent1.convo1.address);
                    expect.fail('should have thrown an AgentAlreadyConnectedOnConversationIdException expectinon');
                } catch (e) {
                    expect(e).to.be.instanceof(AgentAlreadyConnectedOnConversationIdException);
                }
            });

            describe('disconnect', () => {
                beforeEach(async () => {
                    convo = await
                        provider.disconnectCustomerFromAgent(TestDataProvider.customer1.address, TestDataProvider.agent1.convo1.address);
                });

                it('sets conversation state to bot', () => {
                    expect(convo.conversationState).to.eq(ConversationState.Bot);
                });

                it('unsets agentAddress', () => {
                    expect(convo.agentAddress).to.be.undefined;
                });

                it('removes agent from watching agent collection', () => {
                    expect(convo.watchingAgents.length).to.eq(0);
                });

                it('throws agent not in conversation error if the agent not connected and agent transcription attempt occurs', () => {
                    // as long as the messsage is sourced from agent 2, this is good
                    return provider.addAgentMessageToTranscript(TestDataProvider.agent2.convo1.message1)
                        .then(() => expect.fail('should throw an AgentNotInConversationError'))
                        .catch((e: Error) => expect(e).to.be.instanceOf(AgentNotInConversationError));
                });

                it('does not affect other watching agents', async () => {
                    await provider.connectCustomerToAgent(TestDataProvider.customer1.address, TestDataProvider.agent1.convo1.address);
                    convo = await provider.watchConversation(TestDataProvider.customer1.address, TestDataProvider.agent2.convo1.address);

                    expect(convo.agentAddress).to.deep.eq(TestDataProvider.agent1.convo1.address);
                    expect(convo.conversationState).to.eq(ConversationState.Agent);
                    expect(convo.watchingAgents.length).to.eq(2);
                    expect(convo.watchingAgents).to.deep.include(TestDataProvider.agent1.convo1.address);
                    expect(convo.watchingAgents).to.deep.include(TestDataProvider.agent2.convo1.address);

                    convo = await
                        provider.disconnectCustomerFromAgent(TestDataProvider.customer1.address, TestDataProvider.agent1.convo1.address);

                    expect(convo.agentAddress).not.to.deep.eq(TestDataProvider.agent1.convo1.address);
                    expect(convo.conversationState).to.eq(ConversationState.Bot);
                    expect(convo.watchingAgents.length).to.eq(1);
                    expect(convo.watchingAgents).to.deep.include(TestDataProvider.agent2.convo1.address);
                });
            });
        });
    });
}
