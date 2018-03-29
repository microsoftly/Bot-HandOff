import { IAddress, IIdentity, IMessage } from 'botbuilder';
import { expect } from 'chai';
// tslint:disable-next-line: no-import-side-effect
import 'mocha';
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
        });

        it('new customers can have their messages recorded', async () => {
            await convoProvider.addCustomerMessageToTranscript(TestData.customer1.message1);

            const convo = await convoProvider.getConversationFromCustomerAddress(TestData.customer1.address);

            expectTranscriptToContain(convo.transcript, TestData.customer1.message1);
        });

        it('existing customers can have their messages recorded', async () => {
            await convoProvider.addCustomerMessageToTranscript(TestData.customer1.message1);
            await convoProvider.addCustomerMessageToTranscript(TestData.customer1.message2);
            await convoProvider.addCustomerMessageToTranscript(TestData.customer1.message3);

            const convo = await convoProvider.getConversationFromCustomerAddress(TestData.customer1.address);

            expectTranscriptToContain(convo.transcript,
                                      TestData.customer1.message1,
                                      TestData.customer1.message2,
                                      TestData.customer1.message3);
        });

        it('multiple customers can save messages at the same time', async () => {
            await convoProvider.addCustomerMessageToTranscript(TestData.customer1.message1);
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
    });
}
