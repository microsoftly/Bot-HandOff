import { IAddress } from 'botbuilder';
// tslint:disable-next-line: no-import-side-effect
import 'mocha';
import { MongoClient } from 'mongodb';
import { InMemoryConversationProvider } from './../../src/conversation/prebuiltProviders/InMemoryConversationProvider/index';
import { MongoConversationProvider } from './../../src/conversation/prebuiltProviders/MongoConversationProvider/index';
import { conversationProviderTest } from './conversationProviderTest';

conversationProviderTest(
    () => Promise.resolve(new InMemoryConversationProvider()), 'InMemoryConversationProvider');

conversationProviderTest(
    async () =>
        await MongoConversationProvider.CreateNewMongoProvider<IAddress>('mongodb://127.0.0.1:27017', '__test_handoff__', 'conversations'),
    'Mongo provider'
);
