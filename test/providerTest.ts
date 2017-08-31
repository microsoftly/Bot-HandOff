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

const CUSTOMER_1_ADDRESS: IAddress = { channelId: 'console',
    user: { id: 'userId1', name: 'user1' },
    bot: { id: 'bot', name: 'Bot' },
    conversation: { id: 'user1Conversation' }
};

const CUSTOMER_2_ADDRESS: IAddress = { channelId: 'console',
    user: { id: 'userId2', name: 'user2' },
    bot: { id: 'bot', name: 'Bot' },
    conversation: { id: 'user2Conversation' }
};

const AGENT_1_ADDRESS: IAddress = { channelId: 'console',
    user: { id: 'agent1Id', name: 'agent1' },
    bot: { id: 'bot', name: 'Bot' },
    conversation: { id: 'agent1Convo' }
};

const AGENT_2_ADDRESS: IAddress = { channelId: 'console',
    user: { id: 'agent2Id', name: 'agent2' },
    bot: { id: 'bot', name: 'Bot' },
    conversation: { id: 'agent2Convo' }
};

function addCustomerAddressToMessage(msg: IMessage, customerAddress: IAddress): void {
    (msg as IHandoffMessage).customerAddress = customerAddress;
}

function addAgentAddressToMessage(msg: IMessage, agentAddress: IAddress): void {
    (msg as IHandoffMessage).agentAddress = agentAddress;
}

export function providerTest(getNewProvider: () => Promise<IProvider>, providerName: string): void {
    const customer1IntroMessage = new Message()
        .address(CUSTOMER_1_ADDRESS)
        .text('first message from customer 1')
        .toMessage();

    const customer2IntroMessage = new Message()
        .address(CUSTOMER_2_ADDRESS)
        .text('first message from customer 2')
        .toMessage();

    addCustomerAddressToMessage(customer1IntroMessage, CUSTOMER_1_ADDRESS);
    addCustomerAddressToMessage(customer2IntroMessage, CUSTOMER_2_ADDRESS);

    let provider: IProvider;

    describe(providerName, () => {
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

        describe('customer messages', () => {
            const customer1SecondMessage = new Message()
                .address(CUSTOMER_1_ADDRESS)
                .text('second message from customer 1')
                .toMessage();

            const customer2SecondMessage = new Message()
                .address(CUSTOMER_2_ADDRESS)
                .text('second message from customer 2')
                .toMessage();

            addCustomerAddressToMessage(customer1SecondMessage, CUSTOMER_1_ADDRESS);
            addCustomerAddressToMessage(customer2SecondMessage, CUSTOMER_2_ADDRESS);

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
                expect(customer1Convo.customerAddress).to.deep.eq(CUSTOMER_1_ADDRESS);
                expect(customer2Convo.customerAddress).to.deep.eq(CUSTOMER_2_ADDRESS);
            });
        });

        xdescribe('customer messages', () => {
            const message1Address1 = new Message()
                .address(CUSTOMER_1_ADDRESS)
                .text('first message')
                .toMessage();

            const message2Address1 = new Message()
                .address(CUSTOMER_1_ADDRESS)
                .text('second message')
                .toMessage();

            const message3Address1 = new Message()
                .address(CUSTOMER_1_ADDRESS)
                .text('third message')
                .toMessage();

            const message1Address2 = new Message()
                .address(CUSTOMER_2_ADDRESS)
                .text('first message')
                .toMessage();

            const message2Address2 = new Message()
                .address(CUSTOMER_2_ADDRESS)
                .text('second message')
                .toMessage();

            const message3Address2 = new Message()
                .address(CUSTOMER_2_ADDRESS)
                .text('third message')
                .toMessage();

            addCustomerAddressToMessage(message1Address1, CUSTOMER_1_ADDRESS);
            addCustomerAddressToMessage(message2Address1, CUSTOMER_1_ADDRESS);
            addCustomerAddressToMessage(message3Address1, CUSTOMER_1_ADDRESS);
            addCustomerAddressToMessage(message1Address2, CUSTOMER_2_ADDRESS);
            addCustomerAddressToMessage(message2Address2, CUSTOMER_2_ADDRESS);
            addCustomerAddressToMessage(message3Address2, CUSTOMER_2_ADDRESS);

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
                return provider.getConversationFromCustomerAddress(CUSTOMER_1_ADDRESS)
                    .then((convo: IConversation) => verifyConversationForAddress(convo, CUSTOMER_1_ADDRESS));
            });

            it('can be uniquely retrieved for separate customers', () => {
                return Promise.join(
                    provider.getConversationFromCustomerAddress(CUSTOMER_1_ADDRESS),
                    provider.getConversationFromCustomerAddress(CUSTOMER_2_ADDRESS)
                )
                    .spread((convo1: IConversation, convo2: IConversation) => {
                        verifyConversationForAddress(convo1, CUSTOMER_1_ADDRESS);
                        verifyConversationForAddress(convo2, CUSTOMER_2_ADDRESS);
                    });
            });
        });

        describe('queue/dequeue', () => {
            beforeEach(() => {
                return provider.queueCustomerForAgent(CUSTOMER_1_ADDRESS)
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
                return provider.watchConversation(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS)
                    .then((watchedConvo: IConversation) => {
                        expect(watchedConvo.conversationState).to.eq(ConversationState.Wait);
                    })
                    .then(() => provider.unwatchConversation(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS))
                    .then((unwatchedConvo: IConversation) => {
                        expect(unwatchedConvo.conversationState).to.eq(ConversationState.Wait);
                    });
            });

            describe('dequeue', () => {
                beforeEach(() => {
                    return provider.dequeueCustomerForAgent(CUSTOMER_1_ADDRESS)
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
                return provider.watchConversation(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS)
                    .then((convoOut: IConversation) => convo = convoOut);
            });

            it('watch does not affect conversation state', () => {
                expect(convo.conversationState).to.eq(ConversationState.Bot);
            });

            it('watch adds the agent address to the watching agents collection', () => {
                expect(convo.watchingAgents).to.include(AGENT_1_ADDRESS);
            });

            it('multiple agents can watch a single conversation', () => {
                return provider.watchConversation(CUSTOMER_1_ADDRESS, AGENT_2_ADDRESS)
                    .then((convoOut: IConversation) => convo = convoOut)
                    .then(() => {
                        expect(convo.watchingAgents.length).to.eq(2);
                        expect(convo.watchingAgents).to.include(AGENT_1_ADDRESS);
                        expect(convo.watchingAgents).to.include(AGENT_2_ADDRESS);
                    });
            });

            it('multiple agents can watch multiple conversations', () => {
                return provider.watchConversation(CUSTOMER_2_ADDRESS, AGENT_2_ADDRESS)
                    .then((convo2: IConversation) => {
                        expect(convo.watchingAgents.length).to.eq(1);
                        expect(convo.watchingAgents).to.include(AGENT_1_ADDRESS);

                        expect(convo2.watchingAgents.length).to.eq(1);
                        expect(convo2.watchingAgents).to.include(AGENT_2_ADDRESS);
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
                    return provider.unwatchConversation(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS)
                        .then((convoOut: IConversation) => convo = convoOut);
                });

                it('removes the agent from the watching agents collection', () => {
                    expect(convo.watchingAgents).not.to.include(AGENT_1_ADDRESS);
                });

                it('does not affect other agents in watch list', () => {
                    return provider.watchConversation(CUSTOMER_1_ADDRESS, AGENT_2_ADDRESS)
                        .then(() => provider.unwatchConversation(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS))
                        .then((convoOut: IConversation) => convo = convoOut)
                        .then(() => {
                            expect(convo.watchingAgents.length).to.eq(1);
                            expect(convo.watchingAgents).to.include(AGENT_2_ADDRESS);
                        });
                });

                it('does not affect other conversations with other customers', () => {
                    return provider.watchConversation(CUSTOMER_2_ADDRESS, AGENT_2_ADDRESS)
                        .then((convoOut: IConversation) => convo = convoOut)
                        .then(() => provider.unwatchConversation(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS))
                        .then(() => {
                            expect(convo.watchingAgents.length).to.eq(1);
                        });
                });
            });
        });

        describe.only('connect/disconnect', () => {
            const agentMessage = new Message()
                .text('agent message')
                .address(AGENT_1_ADDRESS)
                .toMessage();

            addAgentAddressToMessage(agentMessage, AGENT_1_ADDRESS);
            addCustomerAddressToMessage(agentMessage, CUSTOMER_1_ADDRESS);

            beforeEach(() => {
                return provider.connectCustomerToAgent(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS)
                    .then((convoOut: IConversation) => convo = convoOut);
            });

            it('sets conversation state to agent', () => {
                expect(convo.conversationState).to.eq(ConversationState.Agent);
            });

            it('adds the agent address to the watching agent list', () => {
                expect(convo.watchingAgents).to.include(AGENT_1_ADDRESS);
            });

            it('sets agentAddress on conversation', () => {
                expect(convo.agentAddress).to.eq(AGENT_1_ADDRESS);
            });

            it('receives messages from agent after connection is established', () => {
                return provider.addAgentMessageToTranscript(agentMessage)
                    .then(() => provider.getConversationFromAgentAddress(AGENT_1_ADDRESS))
                    .then((convoOut: IConversation) => convo = convoOut)
                    .then(() => {
                        expect(convo.transcript.length).to.eq(2);
                    });
            });

            // TODO
            it('throws an error if a bot message is recorded while agent-customer connection is established', () => {
                expect.fail();
            });

            it('if agent is watching and transcription occurs, conversation state is implicitly set to Agent', () => {
                return provider.disconnectCustomerFromAgent(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS)
                    .then(() => provider.watchConversation(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS))
                    .then(() => provider.addAgentMessageToTranscript(agentMessage))
                    .then((convoOut: IConversation) => convo = convoOut)
                    .then(() => {
                        expect(convo.conversationState).to.eq(ConversationState.Agent);
                    });
            });

            describe('disconnect', () => {
                beforeEach(() => {
                    return provider.disconnectCustomerFromAgent(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS)
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
                    return provider.connectCustomerToAgent(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS)
                        .then(() => provider.watchConversation(CUSTOMER_1_ADDRESS, AGENT_2_ADDRESS))
                        .then((convoOut: IConversation) => convo = convoOut)
                        .then(() => {
                            expect(convo.agentAddress).to.deep.eq(AGENT_1_ADDRESS);
                            expect(convo.conversationState).to.eq(ConversationState.Agent);
                            expect(convo.watchingAgents.length).to.eq(2);
                            expect(convo.watchingAgents).to.deep.include(AGENT_1_ADDRESS);
                            expect(convo.watchingAgents).to.deep.include(AGENT_2_ADDRESS);
                        })
                        .then(() => provider.disconnectCustomerFromAgent(CUSTOMER_1_ADDRESS, AGENT_2_ADDRESS))
                        .then((convoOut: IConversation) => convo = convoOut)
                        .then(() => {
                            expect(convo.agentAddress).not.to.deep.eq(AGENT_1_ADDRESS);
                            expect(convo.conversationState).to.eq(ConversationState.Bot);
                            expect(convo.watchingAgents.length).to.eq(1);
                            expect(convo.watchingAgents).to.deep.include(AGENT_1_ADDRESS);
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
                .address(CUSTOMER_1_ADDRESS)
                .text('message')
                .toMessage();

            const agentMessage = new Message()
                .address(AGENT_1_ADDRESS)
                .text('agent message')
                .toMessage();

            addCustomerAddressToMessage(customer1Message, CUSTOMER_1_ADDRESS);
            addAgentAddressToMessage(agentMessage, AGENT_1_ADDRESS);

            beforeEach(() => {
                return provider.addCustomerMessageToTranscript(customer1Message)
                    .then(() =>  provider.connectCustomerToAgent(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS));
            });

            it('updates the customer conversation state to "Agent"', () => {
                return provider.getConversationFromCustomerAddress(CUSTOMER_1_ADDRESS)
                    .then((convo: IConversation) => expect(convo.conversationState).to.be.equal(ConversationState.Agent));
            });

            it('receives messages from agent after connection is established', () => {
                return provider.addAgentMessageToTranscript(agentMessage)
                    .then((convo: IConversation) => {
                        expect(convo.transcript.length).to.be.equal(2);
                        expect(convo.transcript[0].from).to.be.equal(CUSTOMER_1_ADDRESS);
                        expect(convo.transcript[1].from).to.be.equal(AGENT_1_ADDRESS);
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
                            .to.be.equal(new BotAttemptedToRecordMessageWhileAgentHasConnection(CUSTOMER_1_ADDRESS.conversation.id).message);
                    });
            });

            it('throws an error if the agent\'s conversation id is alredy occupied', () => {
                const expectedErrorMessage
                    = `agent ${AGENT_1_ADDRESS.user.name} with conversation id ${AGENT_1_ADDRESS.conversation.id} is already occupied`;

                const customer2Message = new Message()
                    .address(CUSTOMER_2_ADDRESS)
                    .text('customer 2 message')
                    .toMessage();

                addCustomerAddressToMessage(customer2Message, CUSTOMER_2_ADDRESS);

                return provider.addCustomerMessageToTranscript(customer2Message)
                    .then(() => provider.connectCustomerToAgent(CUSTOMER_2_ADDRESS, AGENT_1_ADDRESS))
                    .then(() => expect.fail('didn\'t throw error when attempting to connect on an agent conversation id that is occupied'))
                    .catch(AgentAlreadyInConversationError, (e: AgentAlreadyInConversationError) => {
                        expect(e).to.be.an.instanceOf(AgentAlreadyInConversationError);
                    });
            });
        });

        describe('agent messages', () => {
            it('are recorded to the customer transcript', () => {
                const customer1Message = new Message()
                    .address(CUSTOMER_1_ADDRESS)
                    .text('customer 1')
                    .toMessage();

                const customer2Message = new Message()
                    .address(CUSTOMER_2_ADDRESS)
                    .text('customer 2')
                    .toMessage();

                const agentMessageConvo1 = new Message()
                    .address(AGENT_1_ADDRESS)
                    .text('agent 1')
                    .toMessage();

                const agentMessageConvo2 = new Message()
                    .address(AGENT_2_ADDRESS)
                    .text('agent 2')
                    .toMessage();

                addCustomerAddressToMessage(customer1Message, CUSTOMER_1_ADDRESS);
                addCustomerAddressToMessage(customer2Message, CUSTOMER_2_ADDRESS);
                addAgentAddressToMessage(agentMessageConvo1, AGENT_1_ADDRESS);
                addAgentAddressToMessage(agentMessageConvo2, AGENT_2_ADDRESS);

                const expectConversationBetweenAgentAndCustomer
                    = (convo: IConversation, customerAddress: IAddress, agentAddress: IAddress, idCounter: number) => {
                        expect(convo.agentAddress).to.deep.equal(agentAddress);
                        expect(convo.transcript.length).to.be.equal(2);
                        const firstTranscript = convo.transcript[0];
                        const secondTranscript = convo.transcript[1];

                        expect(firstTranscript.from).to.be.equal(customerAddress);
                        expect(secondTranscript.from).to.be.equal(agentAddress);

                        expect(firstTranscript.text).to.be.equal(`customer ${idCounter}`);
                        expect(secondTranscript.text).to.be.equal(`agent ${idCounter}`);
                };

                return Promise.join(
                        provider.addCustomerMessageToTranscript(customer1Message),
                        provider.addCustomerMessageToTranscript(customer2Message))
                    .then(() => Promise.join(
                        provider.connectCustomerToAgent(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS),
                        provider.connectCustomerToAgent(CUSTOMER_2_ADDRESS, AGENT_2_ADDRESS)))
                    .then(() => Promise.join(
                        provider.addAgentMessageToTranscript(agentMessageConvo1),
                        provider.addAgentMessageToTranscript(agentMessageConvo2)))
                    .then(() => Promise.join(
                        provider.getConversationFromCustomerAddress(CUSTOMER_1_ADDRESS),
                        provider.getConversationFromCustomerAddress(CUSTOMER_2_ADDRESS)))
                    .spread((convo1: IConversation, convo2: IConversation) => {
                        expectConversationBetweenAgentAndCustomer(convo1, CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS, 1);
                        expectConversationBetweenAgentAndCustomer(convo2, CUSTOMER_2_ADDRESS, AGENT_2_ADDRESS, 2);
                    });
            });

            it('that are sent to customer conversations that do not have a connection get an error', () => {
                const agentMessage = new Message()
                    .address(AGENT_1_ADDRESS)
                    .text('This is an agent, how can I help?')
                    .toMessage();

                addAgentAddressToMessage(agentMessage, AGENT_1_ADDRESS);

                return provider.addAgentMessageToTranscript(agentMessage)
                    .then(() => expect.fail('did not throw an error as expected'))
                    .catch((e: Error) => expect(e).to.be.an.instanceOf(AgentNotInConversationError));
            });
        });

        describe('agents watching conversation', () => {
            const customerMessage = new Message()
                .address(CUSTOMER_1_ADDRESS)
                .text('customer message')
                .toMessage();

            const agentMessage = new Message()
                .address(AGENT_1_ADDRESS)
                .text('agent message')
                .toMessage();

            addCustomerAddressToMessage(customerMessage, CUSTOMER_1_ADDRESS);
            addAgentAddressToMessage(agentMessage, AGENT_1_ADDRESS);

            beforeEach(() => {
                return provider.addCustomerMessageToTranscript(customerMessage)
                    .then(() => provider.watchConversation(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS));
            });

            it('adds agent address to the watching agent list', () => {
                return provider.getConversationFromCustomerAddress(CUSTOMER_1_ADDRESS)
                    .then((convo: IConversation) => {
                        // expect(convo.watchingAgents).to.deep.include();
                    });
            });

            it('set conversation state to Agent implicitly if an agent sends a message', () => {
                return provider.addAgentMessageToTranscript(agentMessage)
                    .then(() => provider.getConversationFromCustomerAddress(CUSTOMER_1_ADDRESS))
                    .then((convo: IConversation) => {
                        expect(convo.agentAddress).not.to.be.undefined;
                        expect(convo.conversationState).to.be.equal(ConversationState.Agent);
                        expect(convo.transcript.length).to.be.equal(2);
                        const firstMessage = convo.transcript[0];
                        const secondMessage = convo.transcript[1];

                        expect(firstMessage.from).to.be.equal(CUSTOMER_1_ADDRESS);
                        expect(secondMessage.from).to.be.equal(AGENT_1_ADDRESS);
                        expect(firstMessage.text).to.be.equal('customer message');
                        expect(secondMessage.text).to.be.equal('agent message');

                    });
            });

            // this is a weird case that shouldn't be hit, but I wanted to cover my bases
            it('throws error if different agent conversation than watching agent conversation attempts to connect to customer', () => {
                return provider.connectCustomerToAgent(CUSTOMER_1_ADDRESS, AGENT_2_ADDRESS)
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
                .address(CUSTOMER_1_ADDRESS)
                .text('I need to speak to an agent')
                .toMessage();

            const agentMessage = new Message()
                .address(AGENT_1_ADDRESS)
                .text('This is an agent, how can I help?')
                .toMessage();

            addCustomerAddressToMessage(customerMessage, CUSTOMER_1_ADDRESS);
            addAgentAddressToMessage(agentMessage, AGENT_1_ADDRESS);

            beforeEach(() => {
                return provider.addCustomerMessageToTranscript(customerMessage)
                    .then(() => provider.connectCustomerToAgent(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS))
                    .then(() => provider.addAgentMessageToTranscript(agentMessage))
                    .then(() => provider.getConversationFromCustomerAddress(CUSTOMER_1_ADDRESS))
                    .then((conversation: IConversation) => {
                        expect(conversation.agentAddress).not.to.be.undefined;
                        expect(conversation.transcript.length).to.be.equal(2);
                        const firstTranscript = conversation.transcript[0];
                        const secondTranscript = conversation.transcript[1];

                        expect(firstTranscript.from).to.be.equal(CUSTOMER_1_ADDRESS);
                        expect(secondTranscript.from).to.be.equal(AGENT_1_ADDRESS);
                    })
                    .then(() => provider.disconnectCustomerFromAgent(CUSTOMER_1_ADDRESS, AGENT_1_ADDRESS));
            });

            it('changes conversation state to bot', () => {
                return provider.getConversationFromCustomerAddress(CUSTOMER_1_ADDRESS)
                    .then((convo: IConversation) => expect(convo.conversationState).to.be.equal(ConversationState.Bot));
            });

            it('removes agent address from conversation', () => {
                return provider.getConversationFromCustomerAddress(CUSTOMER_1_ADDRESS)
                    .then((convo: IConversation) => expect(convo.agentAddress).to.be.undefined);
            });

            it('causes agent to throw error if they attempt to send another message', () => {
                const expectedErrorMessage =
                    `no customer conversation found for agent with conversation id ${AGENT_1_ADDRESS.conversation.id}`;

                return provider.addAgentMessageToTranscript(agentMessage)
                    .then(() => expect.fail(null, null, 'agent sending message to user they are not connected to didn\'t throw exception'))
                    .catch(AgentNotInConversationError, (e: AgentNotInConversationError) => {
                        expect(e).to.be.an.instanceOf(AgentNotInConversationError);
                        expect(e.message).to.be.equal(new AgentNotInConversationError(AGENT_1_ADDRESS.conversation.id).message);
                    });
            });

        });
    });
}
