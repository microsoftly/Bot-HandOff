import * as Promise from 'bluebird';
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

function addCustomerAddressToMessage(msg: IMessage, customerAddress: IAddress): void {
    (msg as IHandoffMessage).customerAddress = customerAddress;
}

function addAgentAddressToMessage(msg: IMessage, agentAddress: IAddress): void {
    (msg as IHandoffMessage).agentAddress = agentAddress;
}

export function providerTest(getNewProvider: () => Promise<IProvider>, providerName: string): void {
    const customer1IntroMessage = new Message()
        .address(TestDataProvider.CUSTOMER_1)
        .text('first message from customer 1')
        .toMessage();

    const customer2IntroMessage = new Message()
        .address(TestDataProvider.CUSTOMER_2)
        .text('first message from customer 2')
        .toMessage();

    addCustomerAddressToMessage(customer1IntroMessage, TestDataProvider.CUSTOMER_1);
    addCustomerAddressToMessage(customer2IntroMessage, TestDataProvider.CUSTOMER_2);

    let provider: IProvider;

    describe.only(providerName, () => {
        let convo: IConversation;
        let customer1Convo: IConversation;
        let customer2Convo: IConversation;

        beforeEach(() => {
            return getNewProvider()
                .then((newProvider: IProvider) => provider = newProvider)
                .then(() => Promise.all([
                    provider.addCustomerMessageToTranscript(customer1IntroMessage),
                    provider.addCustomerMessageToTranscript(customer2IntroMessage)
                ]))
                .spread((customer1ConvoOut: IConversation, customer2ConvoOut: IConversation) => {
                    customer1Convo = customer1ConvoOut;
                    customer2Convo = customer2ConvoOut;
                });
        });

        describe.only('customer messages', () => {
            const customer1SecondMessage = new Message()
                .address(TestDataProvider.CUSTOMER_1)
                .text('second message from customer 1')
                .toMessage();

            const customer2SecondMessage = new Message()
                .address(TestDataProvider.CUSTOMER_2)
                .text('second message from customer 2')
                .toMessage();

            addCustomerAddressToMessage(customer1SecondMessage, TestDataProvider.CUSTOMER_1);
            addCustomerAddressToMessage(customer2SecondMessage, TestDataProvider.CUSTOMER_2);

            beforeEach(() => {
                return Promise.all([
                        provider.addCustomerMessageToTranscript(customer1SecondMessage),
                        provider.addCustomerMessageToTranscript(customer2SecondMessage)
                    ])
                    .spread((customer1ConvoOut: IConversation, customer2ConvoOut: IConversation) => {
                        customer1Convo = customer1ConvoOut;
                        customer2Convo = customer2ConvoOut;
                    });
            });

            it('can be uniquely retrieved for separate customers', () => {
                expect(customer1Convo.transcript.length).to.eq(2);
                expect(customer1Convo.transcript[0].text).to.eq(customer1IntroMessage.text);
                expect(customer1Convo.transcript[1].text).to.eq(customer1SecondMessage.text);

                expect(customer2Convo.transcript.length).to.eq(2);
                expect(customer2Convo.transcript[0].text).to.eq(customer2IntroMessage.text);
                expect(customer2Convo.transcript[1].text).to.eq(customer2SecondMessage.text);
            });

            it('saves the customer address to the conversation', () => {
                expect(customer1Convo.customerAddress).to.deep.eq(TestDataProvider.CUSTOMER_1);
                expect(customer2Convo.customerAddress).to.deep.eq(TestDataProvider.CUSTOMER_2);
            });
        });

        xdescribe('customer messages', () => {
            const message1Address1 = new Message()
                .address(TestDataProvider.CUSTOMER_1)
                .text('first message')
                .toMessage();

            const message2Address1 = new Message()
                .address(TestDataProvider.CUSTOMER_1)
                .text('second message')
                .toMessage();

            const message3Address1 = new Message()
                .address(TestDataProvider.CUSTOMER_1)
                .text('third message')
                .toMessage();

            const message1Address2 = new Message()
                .address(TestDataProvider.CUSTOMER_2)
                .text('first message')
                .toMessage();

            const message2Address2 = new Message()
                .address(TestDataProvider.CUSTOMER_2)
                .text('second message')
                .toMessage();

            const message3Address2 = new Message()
                .address(TestDataProvider.CUSTOMER_2)
                .text('third message')
                .toMessage();

            addCustomerAddressToMessage(message1Address1, TestDataProvider.CUSTOMER_1);
            addCustomerAddressToMessage(message2Address1, TestDataProvider.CUSTOMER_1);
            addCustomerAddressToMessage(message3Address1, TestDataProvider.CUSTOMER_1);
            addCustomerAddressToMessage(message1Address2, TestDataProvider.CUSTOMER_2);
            addCustomerAddressToMessage(message2Address2, TestDataProvider.CUSTOMER_2);
            addCustomerAddressToMessage(message3Address2, TestDataProvider.CUSTOMER_2);

            beforeEach(() => {
                return Promise.join(
                    provider.addCustomerMessageToTranscript(message1Address1),
                    provider.addCustomerMessageToTranscript(message2Address1),
                    provider.addCustomerMessageToTranscript(message3Address1),

                    provider.addCustomerMessageToTranscript(message1Address2),
                    provider.addCustomerMessageToTranscript(message2Address2),
                    provider.addCustomerMessageToTranscript(message3Address2)
                );
            });

            const verifyConversationForAddress = (convo: IConversation, address: IAddress): void => {
                expect(convo.customerAddress).to.deep.equal(address);
                expect(convo.agentAddress).to.be.undefined;
                expect(convo.transcript.length).to.be.equal(3);
                const transcript = convo.transcript;

                transcript.forEach((t: ITranscriptLine) => expect(t.from).to.be.equal(address));
                expect(transcript[0].text).to.be.equal('first message');
                expect(transcript[1].text).to.be.equal('second message');
                expect(transcript[2].text).to.be.equal('third message');
            };

            it('can be retrieved in a conversation form', () => {
                return provider.getOrCreateNewCustomerConversation(TestDataProvider.CUSTOMER_1)
                    .then((convo: IConversation) => verifyConversationForAddress(convo, TestDataProvider.CUSTOMER_1));
            });

            it('can be uniquely retrieved for separate customers', () => {
                return Promise.join(
                    provider.getOrCreateNewCustomerConversation(TestDataProvider.CUSTOMER_1),
                    provider.getOrCreateNewCustomerConversation(TestDataProvider.CUSTOMER_2)
                )
                    .spread((convo1: IConversation, convo2: IConversation) => {
                        verifyConversationForAddress(convo1, TestDataProvider.CUSTOMER_1);
                        verifyConversationForAddress(convo2, TestDataProvider.CUSTOMER_2);
                    });
            });
        });

        describe('queue/dequeue', () => {
            beforeEach(() => {
                return provider.queueCustomerForAgent(TestDataProvider.CUSTOMER_1)
                    .then((convoOut: IConversation) => convo = convoOut);
            });

            it('queue sets conversation state to wait', () => {
                expect(convo.conversationState).to.eq(ConversationState.Wait);
            });

            // more testing may be needed around this
            it('queue does not affect agentAddress', () => {
                expect(convo.agentAddress).to.be.undefined;
            });

            // assumes watch works
            it('watch and unwatch does not affect wait conversation state', () => {
                return provider.watchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1)
                    .then((watchedConvo: IConversation) => {
                        expect(watchedConvo.conversationState).to.eq(ConversationState.Wait);
                    })
                    .then(() => provider.unwatchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1))
                    .then((unwatchedConvo: IConversation) => {
                        expect(unwatchedConvo.conversationState).to.eq(ConversationState.Wait);
                    });
            });

            describe('dequeue', () => {
                beforeEach(() => {
                    return provider.dequeueCustomerForAgent(TestDataProvider.CUSTOMER_1)
                        .then((convoOut: IConversation) => convo = convoOut);
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
            beforeEach(() => {
                return provider.watchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1)
                    .then((convoOut: IConversation) => convo = convoOut);
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

            // TODO agent already watching error
            it('an agent that attempts to watch that is already watching throws TODO ERROR', () => {
                expect.fail();
            });

            it('throws an error if the agent\'s conversation id is alredy occupied', () => {
                expect.fail();
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
            const agentMessage = new Message()
                .text('agent message')
                .address(TestDataProvider.AGENT_1_CONVO_1)
                .toMessage();

            addAgentAddressToMessage(agentMessage, TestDataProvider.AGENT_1_CONVO_1);
            addCustomerAddressToMessage(agentMessage, TestDataProvider.CUSTOMER_1);

            beforeEach(() => {
                return provider.connectCustomerToAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1)
                    .then((convoOut: IConversation) => convo = convoOut);
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

            it('receives messages from agent after connection is established', () => {
                return provider.addAgentMessageToTranscript(agentMessage)
                    .then(() => provider.getConversationFromAgentAddress(TestDataProvider.AGENT_1_CONVO_1))
                    .then((convoOut: IConversation) => convo = convoOut)
                    .then(() => {
                        expect(convo.transcript.length).to.eq(2);
                    });
            });

            // TODO
            it('throws an error if a bot message is recorded while agent-customer connection is established', () => {
                expect.fail();
            });

            describe('disconnect', () => {
                beforeEach(() => {
                    return provider.disconnectCustomerFromAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1)
                        .then((convoOut: IConversation) => convo = convoOut);
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

                // TODO agent not connected error (disconnect)
                it('throws not connected error if the agent not connected and agent transcription attempt occurs', () => {
                    expect.fail();
                });

                it('does not affect other watching agents', () => {
                    return provider.connectCustomerToAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1)
                        .then(() => provider.watchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_2_CONVO_1))
                        .then((convoOut: IConversation) => convo = convoOut)
                        .then(() => {
                            expect(convo.agentAddress).to.deep.eq(TestDataProvider.AGENT_1_CONVO_1);
                            expect(convo.conversationState).to.eq(ConversationState.Agent);
                            expect(convo.watchingAgents.length).to.eq(2);
                            expect(convo.watchingAgents).to.deep.include(TestDataProvider.AGENT_1_CONVO_1);
                            expect(convo.watchingAgents).to.deep.include(TestDataProvider.AGENT_2_CONVO_1);
                        })
                        .then(() => provider.disconnectCustomerFromAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_2_CONVO_1))
                        .then((convoOut: IConversation) => convo = convoOut)
                        .then(() => {
                            expect(convo.agentAddress).not.to.deep.eq(TestDataProvider.AGENT_1_CONVO_1);
                            expect(convo.conversationState).to.eq(ConversationState.Bot);
                            expect(convo.watchingAgents.length).to.eq(1);
                            expect(convo.watchingAgents).to.deep.include(TestDataProvider.AGENT_1_CONVO_1);
                        });
                });
            });
        });

        // xdescribe('customer queue for agent', () => {
        //     const message = new Message()
        //         .address(CUSTOMER_1_ADDRESS)
        //         .text('message')
        //         .toMessage();

        //     addCustomerAddressToMessage(message, CUSTOMER_1_ADDRESS);

        //     beforeEach(() => {
        //         return provider.addCustomerMessageToTranscript(message)
        //             .then(() => provider.queueCustomerForAgent(CUSTOMER_1_ADDRESS));
        //     });

        //     it('updates conversation state to be wait', () => {
        //         return provider.getConversationFromCustomerAddress(CUSTOMER_1_ADDRESS)
        //             .then((conversation: IConversation) => {
        //                 expect(conversation.agentAddress).to.be.undefined;
        //                 expect(conversation.conversationState).to.be.equal(ConversationState.Wait);
        //                 expect(conversation.transcript.length).to.be.equal(1);
        //             });
        //     });

        //     it('allows bot messages to be recorded withbout affecting state', () => {
        //         const msg = Object.assign({}, message, { text: 'bot message' });

        //         return provider.addBotMessageToTranscript(msg)
        //             .then(() => provider.getConversationFromCustomerAddress(CUSTOMER_1_ADDRESS))
        //             .then((convo: IConversation) => {
        //                 expect(convo.agentAddress).to.be.undefined;
        //                 expect(convo.conversationState).to.be.equal(ConversationState.Wait);
        //                 expect(convo.transcript.length).to.be.equal(2);
        //                 expect(convo.transcript[1].text).to.be.equal('bot message');
        //                 expect(convo.transcript[1].from).to.be.undefined;
        //             });
        //     });
        // });

        describe('customer connecting to agent', () => {
            const customer1Message = new Message()
                .address(TestDataProvider.CUSTOMER_1)
                .text('message')
                .toMessage();

            const agentMessage = new Message()
                .address(TestDataProvider.AGENT_1_CONVO_1)
                .text('agent message')
                .toMessage();

            addCustomerAddressToMessage(customer1Message, TestDataProvider.CUSTOMER_1);
            addAgentAddressToMessage(agentMessage, TestDataProvider.AGENT_1_CONVO_1);

            beforeEach(() => {
                return provider.addCustomerMessageToTranscript(customer1Message)
                    .then(() =>  provider.connectCustomerToAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1));
            });

            it('updates the customer conversation state to "Agent"', () => {
                return provider.getOrCreateNewCustomerConversation(TestDataProvider.CUSTOMER_1)
                    .then((convo: IConversation) => expect(convo.conversationState).to.be.equal(ConversationState.Agent));
            });

            it('receives messages from agent after connection is established', () => {
                return provider.addAgentMessageToTranscript(agentMessage)
                    .then((convo: IConversation) => {
                        expect(convo.transcript.length).to.be.equal(2);
                        expect(convo.transcript[0].from).to.be.equal(TestDataProvider.CUSTOMER_1);
                        expect(convo.transcript[1].from).to.be.equal(TestDataProvider.AGENT_1_CONVO_1);
                        expect(convo.transcript[1].text).to.be.equal('agent message');
                    });
            });

            it('throws an error if a bot message is recorded while agent-customer connection is established', () => {
                // can reuse the customer address. Addresses are idempotent between bots and users
                return provider.addBotMessageToTranscript(customer1Message)
                    .then(() => expect.fail(null, null, 'expected error thrown when bot sends message to customer in convo with agent'))
                    .catch(BotAttemptedToRecordMessageWhileAgentHasConnection, (e: BotAttemptedToRecordMessageWhileAgentHasConnection) => {
                        expect(e).to.be.an.instanceOf(BotAttemptedToRecordMessageWhileAgentHasConnection);
                        expect(e.message)
                            .to.be.equal(new BotAttemptedToRecordMessageWhileAgentHasConnection(TestDataProvider.CUSTOMER_1.conversation.id).message);
                    });
            });

            it('throws an error if the agent\'s conversation id is alredy occupied', () => {
                const expectedErrorMessage
                    = `agent ${TestDataProvider.AGENT_1_CONVO_1.user.name} with conversation id ${TestDataProvider.AGENT_1_CONVO_1.conversation.id} is already occupied`;

                const customer2Message = new Message()
                    .address(TestDataProvider.CUSTOMER_2)
                    .text('customer 2 message')
                    .toMessage();

                addCustomerAddressToMessage(customer2Message, TestDataProvider.CUSTOMER_2);

                return provider.addCustomerMessageToTranscript(customer2Message)
                    .then(() => provider.connectCustomerToAgent(TestDataProvider.CUSTOMER_2, TestDataProvider.AGENT_1_CONVO_1))
                    .then(() => expect.fail('didn\'t throw error when attempting to connect on an agent conversation id that is occupied'))
                    .catch(AgentAlreadyInConversationError, (e: AgentAlreadyInConversationError) => {
                        expect(e).to.be.an.instanceOf(AgentAlreadyInConversationError);
                    });
            });
        });

        describe('agent messages', () => {
            xit('are recorded to the customer transcript', () => {
                const customer1Message = new Message()
                    .address(TestDataProvider.CUSTOMER_1)
                    .text('customer 1')
                    .toMessage();

                const customer2Message = new Message()
                    .address(TestDataProvider.CUSTOMER_2)
                    .text('customer 2')
                    .toMessage();

                const agentMessageConvo1 = new Message()
                    .address(TestDataProvider.AGENT_1_CONVO_1)
                    .text('agent 1')
                    .toMessage();

                const agentMessageConvo2 = new Message()
                    .address(TestDataProvider.AGENT_2_CONVO_1)
                    .text('agent 2')
                    .toMessage();

                addCustomerAddressToMessage(customer1Message, TestDataProvider.CUSTOMER_1);
                addCustomerAddressToMessage(customer2Message, TestDataProvider.CUSTOMER_2);
                addAgentAddressToMessage(agentMessageConvo1, TestDataProvider.AGENT_1_CONVO_1);
                addAgentAddressToMessage(agentMessageConvo2, TestDataProvider.AGENT_2_CONVO_1);

                const expectConversationBetweenAgentAndCustomer
                    = (c1: IConversation, customerAddress: IAddress, agentAddress: IAddress, idCounter: number) => {
                        expect(c1.agentAddress).to.deep.equal(agentAddress);
                        console.log(c1.transcript.map(t => t.text));
                        expect(c1.transcript.length).to.be.equal(2);
                        const firstTranscript = c1.transcript[0];
                        const secondTranscript = c1.transcript[1];

                        expect(firstTranscript.from).to.be.equal(customerAddress);
                        expect(secondTranscript.from).to.be.equal(agentAddress);

                        expect(firstTranscript.text).to.be.equal(`customer ${idCounter}`);
                        expect(secondTranscript.text).to.be.equal(`agent ${idCounter}`);
                };

                return Promise.join(
                        provider.addCustomerMessageToTranscript(customer1Message),
                        provider.addCustomerMessageToTranscript(customer2Message))
                    .then(() => Promise.join(
                        provider.connectCustomerToAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1),
                        provider.connectCustomerToAgent(TestDataProvider.CUSTOMER_2, TestDataProvider.AGENT_2_CONVO_1)))
                    .then(() => Promise.join(
                        provider.addAgentMessageToTranscript(agentMessageConvo1),
                        provider.addAgentMessageToTranscript(agentMessageConvo2)))
                    .then(() => Promise.join(
                        provider.getOrCreateNewCustomerConversation(TestDataProvider.CUSTOMER_1),
                        provider.getOrCreateNewCustomerConversation(TestDataProvider.CUSTOMER_2)))
                    .spread((convo1: IConversation, convo2: IConversation) => {
                        expectConversationBetweenAgentAndCustomer(convo1, TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1, 1);
                        expectConversationBetweenAgentAndCustomer(convo2, TestDataProvider.CUSTOMER_2, TestDataProvider.AGENT_2_CONVO_1, 2);
                    });
            });

            it('that are sent to customer conversations that do not have a connection get an error', () => {
                const agentMessage = new Message()
                    .address(TestDataProvider.AGENT_1_CONVO_1)
                    .text('This is an agent, how can I help?')
                    .toMessage();

                addAgentAddressToMessage(agentMessage, TestDataProvider.AGENT_1_CONVO_1);

                return provider.addAgentMessageToTranscript(agentMessage)
                    .then(() => expect.fail('did not throw an error as expected'))
                    .catch((e: Error) => expect(e).to.be.an.instanceOf(AgentNotInConversationError));
            });
        });

        describe('agents watching conversation', () => {
            const customerMessage = new Message()
                .address(TestDataProvider.CUSTOMER_1)
                .text('customer message')
                .toMessage();

            const agentMessage = new Message()
                .address(TestDataProvider.AGENT_1_CONVO_1)
                .text('agent message')
                .toMessage();

            addCustomerAddressToMessage(customerMessage, TestDataProvider.CUSTOMER_1);
            addAgentAddressToMessage(agentMessage, TestDataProvider.AGENT_1_CONVO_1);

            beforeEach(() => {
                return provider.addCustomerMessageToTranscript(customerMessage)
                    .then(() => provider.watchConversation(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1));
            });

            it('adds agent address to the watching agent list', () => {
                return provider.getOrCreateNewCustomerConversation(TestDataProvider.CUSTOMER_1)
                    .then((convo: IConversation) => {
                        // expect(convo.watchingAgents).to.deep.include();
                    });
            });

            it('set conversation state to Agent implicitly if an agent sends a message', () => {
                return provider.addAgentMessageToTranscript(agentMessage)
                    .then(() => provider.getOrCreateNewCustomerConversation(TestDataProvider.CUSTOMER_1))
                    .then((convo: IConversation) => {
                        expect(convo.agentAddress).not.to.be.undefined;
                        expect(convo.conversationState).to.be.equal(ConversationState.Agent);
                        expect(convo.transcript.length).to.be.equal(2);
                        const firstMessage = convo.transcript[0];
                        const secondMessage = convo.transcript[1];

                        expect(firstMessage.from).to.be.equal(TestDataProvider.CUSTOMER_1);
                        expect(secondMessage.from).to.be.equal(TestDataProvider.AGENT_1_CONVO_1);
                        expect(firstMessage.text).to.be.equal('customer message');
                        expect(secondMessage.text).to.be.equal('agent message');

                    });
            });

            // this is a weird case that shouldn't be hit, but I wanted to cover my bases
            it('throws error if different agent conversation than watching agent conversation attempts to connect to customer', () => {
                return provider.connectCustomerToAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_2_CONVO_1)
                    .then(() => expect.fail(null, null, 'Should have thrown error or wrong convo id to connect'))
                    .catch(ConnectingAgentIsNotWatching, (e: ConnectingAgentIsNotWatching) => {
                        expect(e).to.be.an.instanceOf(ConnectingAgentIsNotWatching);
                    });
            });

            // it('can have conversation set to wait and watch if customer queues for agent', () => {
            //     return provider.queueCustomerForAgent(customer1Address)
            //         .then(() => provider.getConversationFromCustomerAddress(customer1Address))
            //         .then((convo: IConversation) => expect(convo.conversationState).to.be.equal(ConversationState.WatchAndWait));
            // });
        });

        describe('disconnecting user from agent', () => {
            const customerMessage = new Message()
                .address(TestDataProvider.CUSTOMER_1)
                .text('I need to speak to an agent')
                .toMessage();

            const agentMessage = new Message()
                .address(TestDataProvider.AGENT_1_CONVO_1)
                .text('This is an agent, how can I help?')
                .toMessage();

            addCustomerAddressToMessage(customerMessage, TestDataProvider.CUSTOMER_1);
            addAgentAddressToMessage(agentMessage, TestDataProvider.AGENT_1_CONVO_1);

            beforeEach(() => {
                return provider.addCustomerMessageToTranscript(customerMessage)
                    .then(() => provider.connectCustomerToAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1))
                    .then(() => provider.addAgentMessageToTranscript(agentMessage))
                    .then(() => provider.getOrCreateNewCustomerConversation(TestDataProvider.CUSTOMER_1))
                    .then((conversation: IConversation) => {
                        expect(conversation.agentAddress).not.to.be.undefined;
                        expect(conversation.transcript.length).to.be.equal(2);
                        const firstTranscript = conversation.transcript[0];
                        const secondTranscript = conversation.transcript[1];

                        expect(firstTranscript.from).to.be.equal(TestDataProvider.CUSTOMER_1);
                        expect(secondTranscript.from).to.be.equal(TestDataProvider.AGENT_1_CONVO_1);
                    })
                    .then(() => provider.disconnectCustomerFromAgent(TestDataProvider.CUSTOMER_1, TestDataProvider.AGENT_1_CONVO_1));
            });

            it('changes conversation state to bot', () => {
                return provider.getOrCreateNewCustomerConversation(TestDataProvider.CUSTOMER_1)
                    .then((convo: IConversation) => expect(convo.conversationState).to.be.equal(ConversationState.Bot));
            });

            it('removes agent address from conversation', () => {
                return provider.getOrCreateNewCustomerConversation(TestDataProvider.CUSTOMER_1)
                    .then((convo: IConversation) => expect(convo.agentAddress).to.be.undefined);
            });

            it('causes agent to throw error if they attempt to send another message', () => {
                const expectedErrorMessage =
                    `no customer conversation found for agent with conversation id ${TestDataProvider.AGENT_1_CONVO_1.conversation.id}`;

                return provider.addAgentMessageToTranscript(agentMessage)
                    .then(() => expect.fail(null, null, 'agent sending message to user they are not connected to didn\'t throw exception'))
                    .catch(AgentNotInConversationError, (e: AgentNotInConversationError) => {
                        expect(e).to.be.an.instanceOf(AgentNotInConversationError);
                        expect(e.message).to.be.equal(new AgentNotInConversationError(TestDataProvider.AGENT_1_CONVO_1.conversation.id).message);
                    });
            });

        });
    });
}
