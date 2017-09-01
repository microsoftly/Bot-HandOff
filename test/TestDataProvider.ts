import { IAddress, IIdentity, IMessage, Message } from 'botbuilder';

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

export const AGENT_1_CONVO_1: IAddress = {
    bot,
    channelId,
    user: AGENT_1_USER,
    conversation: {
        id: 'agent1Convo1'
    }
};

export const AGENT_1_CONVO_2: IAddress = {
    bot,
    channelId,
    user: AGENT_1_USER,
    conversation: {
        id: 'agent1Convo2'
    }
};

export const AGENT_2_CONVO_1: IAddress = {
    bot,
    channelId,
    user: AGENT_2_USER,
    conversation: {
        id: 'agent2Convo1'
    }
};

export const AGENT_2_CONVO_2: IAddress = {
    bot,
    channelId,
    user: AGENT_2_USER,
    conversation: {
        id: 'agent2Convo2'
    }
};

export const CUSTOMER_1: IAddress = {
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

export const CUSTOMER_2: IAddress = {
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

export const CUSTOMER_1_MESSAGE_1 = new Message()
    .text('customer 1 FIRST message')
    .address(CUSTOMER_1)
    .toMessage();

export const CUSTOMER_2_MESSAGE_1 = new Message()
    .text('customer 2 FIRST message')
    .address(CUSTOMER_2)
    .toMessage();

export const CUSTOMER_1_MESSAGE_2 = new Message()
    .text('customer 1 SECOND message')
    .address(CUSTOMER_1)
    .toMessage();

export const CUSTOMER_2_MESSAGE_2 = new Message()
    .text('customer 2 SECOND message')
    .address(CUSTOMER_2)
    .toMessage();

export const CUSTOMER_1_MESSAGE_3 = new Message()
    .text('customer 1 THIRD message')
    .address(CUSTOMER_1)
    .toMessage();

export const CUSTOMER_2_MESSAGE_3 = new Message()
    .text('customer 2 THIRD message')
    .address(CUSTOMER_2)
    .toMessage();

export const AGENT_1_CONVO_1_MESSAGE_1 = new Message()
    .text('agent 1 convo 1 FIRST message')
    .address(AGENT_1_CONVO_1)
    .toMessage();

export const AGENT_1_CONVO_2_MESSAGE_1 = new Message()
    .text('agent 1 convo 2 FIRST message')
    .address(AGENT_1_CONVO_2)
    .toMessage();

export const AGENT_2_CONVO_1_MESSAGE_1 = new Message()
    .text('agent 2 convo 1 FIRST message')
    .address(AGENT_2_CONVO_1)
    .toMessage();

export const AGENT_2_CONVO_2_MESSAGE_1 = new Message()
    .text('agent 2 convo 2 FIRST message')
    .address(AGENT_2_CONVO_2)
    .toMessage();

export const AGENT_1_CONVO_1_MESSAGE_2 = new Message()
    .text('agent 1 convo 1 SECOND message')
    .address(AGENT_1_CONVO_1)
    .toMessage();

export const AGENT_1_CONVO_2_MESSAGE_2 = new Message()
    .text('agent 1 convo 2 SECOND message')
    .address(AGENT_1_CONVO_2)
    .toMessage();

export const AGENT_2_CONVO_1_MESSAGE_2 = new Message()
    .text('agent 2 convo 1 SECOND message')
    .address(AGENT_2_CONVO_1)
    .toMessage();

export const AGENT_2_CONVO_2_MESSAGE_2 = new Message()
    .text('agent 2 convo 2 SECOND message')
    .address(AGENT_2_CONVO_2)
    .toMessage();

export function getExpectedReceivedMessage(originalMessage: IMessage, expectedAddress: IAddress): IMessage {
    return Object.assign({}, originalMessage, { address: expectedAddress });
}
