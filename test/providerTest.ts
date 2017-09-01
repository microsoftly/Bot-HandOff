import * as $Promise from 'bluebird';
import { IAddress, IMessage, Message } from 'botbuilder';
import { expect } from 'chai';
import { IHandoffMessage } from '../src/IHandoffMessage';
import { ConversationState, IConversation, ITranscriptLine } from './../src/IConversation';
import { AgentAlreadyInConversationError } from './../src/provider/errors/AgentAlreadyInConversationError';
import { ConnectingAgentIsNotWatching } from './../src/provider/errors/AgentConnectingIsNotSameAsWatching';
import { AgentNotInConversationError } from './../src/provider/errors/AgentNotInConversationError';
import {
    BotAttemptedToRecordMessageWhileAgentHasConnection
} from './../src/provider/errors/BotAttemptedToRecordMessageWhileAgentHasConnection';
import { IProvider } from './../src/provider/IProvider';
import * as TestDataProvider from './TestDataProvider';

export function providerTest(getNewProvider: () => $Promise<IProvider>, providerName: string): void {
    // const customer1IntroMessage = new Message()
    //     .address(TestDataProvider.CUSTOMER_1)
    //     .text('first message from customer 1')
    //     .toMessage();

    // const customer2IntroMessage = new Message()
    //     .address(TestDataProvider.CUSTOMER_2)
    //     .text('first message from customer 2')
    //     .toMessage();

    let provider: IProvider;

    describe.only(providerName, () => {
        let convo: IConversation;
        let customer1Convo: IConversation;
        let customer2Convo: IConversation;

        beforeEach(() => {
            return getNewProvider()
                .then((newProvider: IProvider) => provider = newProvider)
                .then(() => $Promise.all([
                    provider.addCustomerMessageToTranscript(TestDataProvider.CUSTOMER_1_MESSAGE_1),
                    provider.addCustomerMessageToTranscript(TestDataProvider.CUSTOMER_2_MESSAGE_1)
                ]))
                .spread((customer1ConvoOut: IConversation, customer2ConvoOut: IConversation) => {
                    customer1Convo = customer1ConvoOut;
                    customer2Convo = customer2ConvoOut;
                });
        });

        describe('customer messages', () => {
            beforeEach(() => {
                return $Promise.all([
                        provider.addCustomerMessageToTranscript(TestDataProvider.CUSTOMER_1_MESSAGE_2),
                        provider.addCustomerMessageToTranscript(TestDataProvider.CUSTOMER_2_MESSAGE_2)
                    ])
                    .spread((customer1ConvoOut: IConversation, customer2ConvoOut: IConversation) => {
                        customer1Convo = customer1ConvoOut;
                        customer2Convo = customer2ConvoOut;
                    });
            });

            it('can be uniquely retrieved for separate customers', () => {
                expect(customer1Convo.transcript.length).to.eq(2);
                expect(customer1Convo.transcript[0].text).to.eq(TestDataProvider.CUSTOMER_1_MESSAGE_1.text);
                expect(customer1Convo.transcript[1].text).to.eq(TestDataProvider.CUSTOMER_1_MESSAGE_2.text);

                expect(customer2Convo.transcript.length).to.eq(2);
                expect(customer2Convo.transcript[0].text).to.eq(TestDataProvider.CUSTOMER_2_MESSAGE_1.text);
                expect(customer2Convo.transcript[1].text).to.eq(TestDataProvider.CUSTOMER_2_MESSAGE_2.text);
            });

            it('saves the customer address to the conversation', () => {
                expect(customer1Convo.customerAddress).to.deep.eq(TestDataProvider.CUSTOMER_1);
                expect(customer2Convo.customerAddress).to.deep.eq(TestDataProvider.CUSTOMER_2);
            });
        });

        describe('queue/dequeue', () => {
            beforeEach(async () => {
                convo = await provider.queueCustomerForAgent(TestDataProvider.CUSTOMER_1);
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
                convo = await provider.watchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1);

                expect(convo.conversationState).to.eq(ConversationState.Wait);

                convo = await provider.unwatchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1);

                expect(convo.conversationState).to.eq(ConversationState.Wait);
            });

            describe('dequeue', () => {
                beforeEach(async () => {
                    convo = await provider.dequeueCustomerForAgent(TestDataProvider.CUSTOMER_1);
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
                convo = await provider.watchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1);
            });

            it('watch does not affect conversation state', () => {
                expect(convo.conversationState).to.eq(ConversationState.Bot);
            });

            it('watch adds the agent address to the watching agents collection', () => {
                expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_1_CONVO_1);
            });

            it('multiple agents can watch a single conversation', () => {
                return provider.watchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_2_CONVO_1)
                    .then((convoOut: IConversation) => convo = convoOut)
                    .then(() => {
                        expect(convo.watchingAgents.length).to.eq(2);
                        expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_1_CONVO_1);
                        expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_2_CONVO_1);
                    });
            });

            it('multiple agents can watch multiple conversations', () => {
                return provider.watchConversation(TestDataProvider.CUSTOMER_2, TestDataProvider.AGENT_2_CONVO_1)
                    .then((convo2: IConversation) => {
                        expect(convo.watchingAgents.length).to.eq(1);
                        expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_1_CONVO_1);

                        expect(convo2.watchingAgents.length).to.eq(1);
                        expect(convo2.watchingAgents).to.include(TestDataProvider.AGENT_2_CONVO_1);
                    });
            });

            describe('unwatch', () => {
                beforeEach(() => {
                    return provider.unwatchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1)
                        .then((convoOut: IConversation) => convo = convoOut);
                });

                it('removes the agent from the watching agents collection', () => {
                    expect(convo.watchingAgents).not.to.include(TestDataProvider.AGENT_1_CONVO_1);
                });

                it('does not affect other agents in watch list', () => {
                    return provider.watchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_2_CONVO_1)
                        .then(() => provider.unwatchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1))
                        .then((convoOut: IConversation) => convo = convoOut)
                        .then(() => {
                            expect(convo.watchingAgents.length).to.eq(1);
                            expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_2_CONVO_1);
                        });
                });

                it('does not affect other conversations with other customers', () => {
                    return provider.watchConversation(TestDataProvider.CUSTOMER_2, TestDataProvider.AGENT_2_CONVO_1)
                        .then((convoOut: IConversation) => convo = convoOut)
                        .then(() => provider.unwatchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1))
                        .then(() => {
                            expect(convo.watchingAgents.length).to.eq(1);
                        });
                });
            });
        });

        describe('connect/disconnect', () => {
            beforeEach(async () => {
                convo = await provider.connectCustomerToAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1);
            });

            it('sets conversation state to agent', () => {
                expect(convo.conversationState).to.eq(ConversationState.Agent);
            });

            it('adds the agent address to the watching agent list', () => {
                expect(convo.watchingAgents).to.include(TestDataProvider.AGENT_1_CONVO_1);
            });

            it('sets agentAddress on conversation', () => {
                expect(convo.agentAddress).to.eq(TestDataProvider.AGENT_1_CONVO_1);
            });

            it('agent messages are transcribed to the connected customer conversation', async () => {
                await provider.addAgentMessageToTranscript(TestDataProvider.AGENT_1_CONVO_1_MESSAGE_1);

                convo = await provider.getConversationFromAgentAddress(TestDataProvider.AGENT_1_CONVO_1);

                expect(convo.transcript.length).to.eq(2);
            });

            it('throws an error if a bot message is recorded while agent-customer connection is established', () => {
                // can pass in any message for customer 1 for this to work
                return provider.addBotMessageToTranscript(TestDataProvider.CUSTOMER_1_MESSAGE_1)
                    .then(() => expect.fail('should have thrown an error'))
                    .catch((e: Error) => expect(e).to.be.instanceOf(BotAttemptedToRecordMessageWhileAgentHasConnection));
            });

            describe('disconnect', () => {
                beforeEach(async () => {
                    convo = await provider.disconnectCustomerFromAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1);
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

                it('throws not connected error if the agent not connected and agent transcription attempt occurs', () => {
                    // as long as the messsage is sourced from agent 2, this is good
                    return provider.addAgentMessageToTranscript(TestDataProvider.AGENT_2_CONVO_1_MESSAGE_1)
                        .then(() => expect.fail('should throw an AgentNotInConversationError'))
                        .catch((e: Error) => expect(e).to.be.instanceOf(AgentNotInConversationError));
                });

                it('does not affect other watching agents', async () => {
                    await provider.connectCustomerToAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1);
                    convo = await provider.watchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_2_CONVO_1);

                    expect(convo.agentAddress).to.deep.eq(TestDataProvider.AGENT_1_CONVO_1);
                    expect(convo.conversationState).to.eq(ConversationState.Agent);
                    expect(convo.watchingAgents.length).to.eq(2);
                    expect(convo.watchingAgents).to.deep.include(TestDataProvider.AGENT_1_CONVO_1);
                    expect(convo.watchingAgents).to.deep.include(TestDataProvider.AGENT_2_CONVO_1);

                    convo = await provider.disconnectCustomerFromAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_2_CONVO_1);
                    expect(convo.agentAddress).not.to.deep.eq(TestDataProvider.AGENT_1_CONVO_1);
                    expect(convo.conversationState).to.eq(ConversationState.Bot);
                    expect(convo.watchingAgents.length).to.eq(1);
                    expect(convo.watchingAgents).to.deep.include(TestDataProvider.AGENT_1_CONVO_1);
                });
            });
        });
    });
}
