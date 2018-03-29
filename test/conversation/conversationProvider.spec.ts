import { IAddress } from 'botbuilder';
// tslint:disable-next-line: no-import-side-effect
import 'mocha';
import { InMemoryConversationProvider } from './../../src/conversation/prebuiltProviders/InMemoryConversationProvider/index';
import { conversationProviderTest } from './conversationProviderTest';

conversationProviderTest(
    () => Promise.resolve(new InMemoryConversationProvider()), 'InMemoryConversationProvider');
