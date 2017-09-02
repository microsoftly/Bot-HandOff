import * as $Promise from 'bluebird';
import { BotTester } from 'bot-tester';
import { UniversalBot } from 'botbuilder';
import * as TestDataProvider from './TestDataProvider';

export function sendAllFirstCustomerMessages(bot: UniversalBot): Promise<{}> | $Promise<{}> {
    return new BotTester(bot, TestDataProvider.CUSTOMER_1)
        .sendMessageToBot(TestDataProvider.CUSTOMER_1_MESSAGE_1)
        .sendMessageToBot(TestDataProvider.CUSTOMER_2_MESSAGE_1)
        .runTest();
}
