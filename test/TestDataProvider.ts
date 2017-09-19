import { ConsoleConnector, IAddress, IIdentity, IMessage, Message, Session, UniversalBot } from 'botbuilder';
import * as sinon from 'sinon';
import { ConnectEventMessage } from '../src/eventMessages/ConnectEventMessage';
import { DequeueEventMessage } from '../src/eventMessages/DequeueEventMessage';
import { DisconnectEventMessage } from '../src/eventMessages/DisconnectEventMessage';
import { HandoffEventMessage } from '../src/eventMessages/HandoffEventMessage';
import { QueueEventMessage } from '../src/eventMessages/QueueEventMessage';
import { UnwatchEventMessage } from '../src/eventMessages/UnwatchEventMessage';
import { WatchEventMessage } from '../src/eventMessages/WatchEventMessage';
import { EventFailureHandler } from '../src/options/EventFailureHandlers';
import { EventSuccessHandler } from '../src/options/EventSuccessHandlers';
import { IEventHandler, IEventHandlers } from '../src/options/IEventHandlers';
import { IProvider } from '../src/provider/IProvider';
import { InMemoryProvider } from '../src/provider/prebuilt/InMemoryProvider';

const bot = {
    id: 'bot',
    name: 'Bot'
};

const channelId = 'test';
const AGENT_1_USER: IIdentity = {
    id: 'agent1Id',
    name: 'agent1'
};

const AGENT_2_USER: IIdentity = {
    id: 'agent2Id',
    name: 'agent2'
};

const AGENT_1_CONVO_1: IAddress = {
    bot,
    channelId,
    user: AGENT_1_USER,
    conversation: {
        id: 'agent1Convo1'
    }
};

const AGENT_1_CONVO_2: IAddress = {
    bot,
    channelId,
    user: AGENT_1_USER,
    conversation: {
        id: 'agent1Convo2'
    }
};

const AGENT_2_CONVO_1: IAddress = {
    bot,
    channelId,
    user: AGENT_2_USER,
    conversation: {
        id: 'agent2Convo1'
    }
};

const AGENT_2_CONVO_2: IAddress = {
    bot,
    channelId,
    user: AGENT_2_USER,
    conversation: {
        id: 'agent2Convo2'
    }
};

const CUSTOMER_1: IAddress = {
    bot,
    channelId,
    user: {
        id: 'customer1Id',
        name: 'customer1'
    },
    conversation: {
        id: 'customer1ConvoId'
    }
};

const CUSTOMER_2: IAddress = {
    bot,
    channelId,
    user: {
        id: 'customer2Id',
        name: 'customer2'
    },
    conversation: {
        id: 'customer2ConvoId'
    }
};

const CUSTOMER_1_MESSAGE_1 = new Message()
    .text('customer 1 FIRST message')
    .address(CUSTOMER_1)
    .toMessage();

const CUSTOMER_2_MESSAGE_1 = new Message()
    .text('customer 2 FIRST message')
    .address(CUSTOMER_2)
    .toMessage();

const CUSTOMER_1_MESSAGE_2 = new Message()
    .text('customer 1 SECOND message')
    .address(CUSTOMER_1)
    .toMessage();

const CUSTOMER_2_MESSAGE_2 = new Message()
    .text('customer 2 SECOND message')
    .address(CUSTOMER_2)
    .toMessage();

const CUSTOMER_1_MESSAGE_3 = new Message()
    .text('customer 1 THIRD message')
    .address(CUSTOMER_1)
    .toMessage();

const CUSTOMER_2_MESSAGE_3 = new Message()
    .text('customer 2 THIRD message')
    .address(CUSTOMER_2)
    .toMessage();

const AGENT_1_CONVO_1_MESSAGE_1 = new Message()
    .text('agent 1 convo 1 FIRST message')
    .address(AGENT_1_CONVO_1)
    .toMessage();

const AGENT_1_CONVO_2_MESSAGE_1 = new Message()
    .text('agent 1 convo 2 FIRST message')
    .address(AGENT_1_CONVO_2)
    .toMessage();

const AGENT_2_CONVO_1_MESSAGE_1 = new Message()
    .text('agent 2 convo 1 FIRST message')
    .address(AGENT_2_CONVO_1)
    .toMessage();

const AGENT_2_CONVO_2_MESSAGE_1 = new Message()
    .text('agent 2 convo 2 FIRST message')
    .address(AGENT_2_CONVO_2)
    .toMessage();

const AGENT_1_CONVO_1_MESSAGE_2 = new Message()
    .text('agent 1 convo 1 SECOND message')
    .address(AGENT_1_CONVO_1)
    .toMessage();

const AGENT_1_CONVO_2_MESSAGE_2 = new Message()
    .text('agent 1 convo 2 SECOND message')
    .address(AGENT_1_CONVO_2)
    .toMessage();

const AGENT_2_CONVO_1_MESSAGE_2 = new Message()
    .text('agent 2 convo 1 SECOND message')
    .address(AGENT_2_CONVO_1)
    .toMessage();

const AGENT_2_CONVO_2_MESSAGE_2 = new Message()
    .text('agent 2 convo 2 SECOND message')
    .address(AGENT_2_CONVO_2)
    .toMessage();

const AGENT_1_CONVO_1_MESSAGE_3 = new Message()
    .text('agent 1 convo 1 THIRD message')
    .address(AGENT_1_CONVO_1)
    .toMessage();

const AGENT_1_CONVO_2_MESSAGE_3 = new Message()
    .text('agent 1 convo 2 THIRD message')
    .address(AGENT_1_CONVO_2)
    .toMessage();

const AGENT_2_CONVO_1_MESSAGE_3 = new Message()
    .text('agent 2 convo 1 THIRD message')
    .address(AGENT_2_CONVO_1)
    .toMessage();

const AGENT_2_CONVO_2_MESSAGE_3 = new Message()
    .text('agent 2 convo 2 THIRD message')
    .address(AGENT_2_CONVO_2)
    .toMessage();

export function getExpectedReceivedMessage(originalMessage: IMessage, expectedAddress: IAddress): IMessage {
    return Object.assign({}, originalMessage, { address: expectedAddress });
}

// tslint:disable
// I'm too lazy to build the return type for this ...
function getCustomerEventMessages(customerAddress: IAddress) {
// tslint:enable
    return {
        toQueue: new QueueEventMessage(customerAddress),
        toDequeue: new DequeueEventMessage(customerAddress)
    };
}

//tslint:disable
// I'm too lazy to type out the return type
function getAgentEventMessagesForConversation(convoAddress: IAddress) {
//tslint:enable
    return {
        toConnectTo: {
            customer1: new ConnectEventMessage(CUSTOMER_1, convoAddress),
            customer2: new ConnectEventMessage(CUSTOMER_2, convoAddress)
        },
        toDisconnectFrom: {
            customer1: new DisconnectEventMessage(CUSTOMER_1, convoAddress),
            customer2: new DisconnectEventMessage(CUSTOMER_2, convoAddress)
        },
        toWatch: {
            customer1: new WatchEventMessage(CUSTOMER_1, convoAddress),
            customer2: new WatchEventMessage(CUSTOMER_2, convoAddress)
        },
        toUnwatch: {
            customer1: new UnwatchEventMessage(CUSTOMER_1, convoAddress),
            customer2: new UnwatchEventMessage(CUSTOMER_2, convoAddress)
        }
    };
}

export const agent1 = {
    user: AGENT_1_USER,

    convo1: {
        address: AGENT_1_CONVO_1,

        message1: AGENT_1_CONVO_1_MESSAGE_1,
        message2: AGENT_1_CONVO_1_MESSAGE_2,
        message3: AGENT_1_CONVO_1_MESSAGE_3,

        eventMessage: getAgentEventMessagesForConversation(AGENT_1_CONVO_1)
    },

    convo2: {
        address: AGENT_1_CONVO_2,

        message1: AGENT_1_CONVO_2_MESSAGE_1,
        message2: AGENT_1_CONVO_2_MESSAGE_2,
        message3: AGENT_1_CONVO_2_MESSAGE_3,

        eventMessage: getAgentEventMessagesForConversation(AGENT_1_CONVO_2)
    }
};

export const agent2 = {
    user: AGENT_2_USER,

    convo1: {
        address: AGENT_2_CONVO_1,

        message1: AGENT_2_CONVO_1_MESSAGE_1,
        message2: AGENT_2_CONVO_1_MESSAGE_2,
        message3: AGENT_2_CONVO_1_MESSAGE_3,

        eventMessage: getAgentEventMessagesForConversation(AGENT_2_CONVO_1)
    },

    convo2: {
        address: AGENT_2_CONVO_2,

        message1: AGENT_2_CONVO_2_MESSAGE_1,
        message2: AGENT_2_CONVO_2_MESSAGE_2,
        message3: AGENT_2_CONVO_2_MESSAGE_3,

        eventMessage: getAgentEventMessagesForConversation(AGENT_2_CONVO_2)
    }
};

export const customer1 = {
    address: CUSTOMER_1,

    message1: CUSTOMER_1_MESSAGE_1,
    message2: CUSTOMER_1_MESSAGE_2,
    message3: CUSTOMER_1_MESSAGE_3,

    eventMessage: getCustomerEventMessages(CUSTOMER_1)
};

export const customer2 = {
    address: CUSTOMER_2,

    message1: CUSTOMER_2_MESSAGE_1,
    message2: CUSTOMER_2_MESSAGE_2,
    message3: CUSTOMER_2_MESSAGE_3,

    eventMessage: getCustomerEventMessages(CUSTOMER_2)
};

export const unkownError = new Error('an error was thrown');

function createEventHandlerSpy(): IEventHandler {
    return {
        success: sinon.spy() as EventSuccessHandler,
        failure: sinon.spy() as EventFailureHandler
    };
}

export function getEventHandlerSpies(): IEventHandlers {
    return {
        connect: createEventHandlerSpy(),
        disconnect: createEventHandlerSpy(),
        queue: createEventHandlerSpy(),
        dequeue: createEventHandlerSpy(),
        watch: createEventHandlerSpy(),
        unwatch: createEventHandlerSpy()
    };
}

export function createIProviderSpy(): IProvider {
    const provider = new InMemoryProvider();

    provider.addCustomerMessageToTranscript = sinon.spy(provider, 'addCustomerMessageToTranscript');
    provider.addAgentMessageToTranscript = sinon.spy(provider, 'addAgentMessageToTranscript');
    provider.addBotMessageToTranscript = sinon.spy(provider, 'addBotMessageToTranscript');
    // provider.addBotMessageToTranscript = sinon.spy(provider, 'addBotMessageToTranscriptIgnoringConversationState');
    provider.connectCustomerToAgent = sinon.spy(provider, 'connectCustomerToAgent');
    provider.disconnectCustomerFromAgent = sinon.spy(provider, 'disconnectCustomerFromAgent');
    provider.queueCustomerForAgent = sinon.spy(provider, 'queueCustomerForAgent');
    provider.dequeueCustomerForAgent = sinon.spy(provider, 'dequeueCustomerForAgent');
    provider.watchConversation = sinon.spy(provider, 'watchConversation');
    provider.unwatchConversation = sinon.spy(provider, 'unwatchConversation');
    provider.getConversationFromCustomerAddress = sinon.spy(provider, 'getConversationFromCustomerAddress');
    provider.getOrCreateNewCustomerConversation = sinon.spy(provider, 'getOrCreateNewCustomerConversation');
    provider.getConversationFromAgentAddress = sinon.spy(provider, 'getConversationFromAgentAddress');
    provider.getAllConversations = sinon.spy(provider, 'getAllConversations');

    return provider;
}

export function createIProviderMock(): IProvider {
    const provider = new InMemoryProvider();

    provider.addCustomerMessageToTranscript = sinon.mock(provider).expects('addCustomerMessageToTranscript');
    provider.addAgentMessageToTranscript = sinon.mock(provider).expects('addAgentMessageToTranscript');
    provider.addBotMessageToTranscript = sinon.mock(provider).expects('addBotMessageToTranscript');
    // provider.addBotMessageToTranscript =
    //     sinon.mock(provider).expects('addBotMessageToTranscriptIgnoringConversationState');
    provider.connectCustomerToAgent = sinon.mock(provider).expects('connectCustomerToAgent');
    provider.disconnectCustomerFromAgent = sinon.mock(provider).expects('disconnectCustomerFromAgent');
    provider.queueCustomerForAgent = sinon.mock(provider).expects('queueCustomerForAgent');
    provider.dequeueCustomerForAgent = sinon.mock(provider).expects('dequeueCustomerForAgent');
    provider.watchConversation = sinon.mock(provider).expects('watchConversation');
    provider.unwatchConversation = sinon.mock(provider).expects('unwatchConversation');
    provider.getConversationFromCustomerAddress = sinon.mock(provider).expects('getConversationFromCustomerAddress');
    provider.getOrCreateNewCustomerConversation = sinon.mock(provider).expects('getOrCreateNewCustomerConversation');
    provider.getConversationFromAgentAddress = sinon.mock(provider).expects('getConversationFromAgentAddress');
    provider.getAllConversations = sinon.mock(provider).expects('getAllConversations');

    return provider;
}

// to avoid binding to a particular implementation of event messages, use the .wait method after a single or several event messages to
// ensure the expected action occurs
export const EVENT_DELAY = 50;

export const DEFAULT_BOT_RESPONSE = 'response!';

export function getNewBotInstance(): UniversalBot {
    const chatbot = new UniversalBot(new ConsoleConnector());

    chatbot.dialog('/', (session: Session) => {
        session.send(DEFAULT_BOT_RESPONSE);
    });

    return chatbot;
}

export const IS_AGENT_FN = (session: Session): Promise<boolean> => {
    return Promise.resolve(session.message.address.user.name.toLowerCase().includes('agent'));
};
