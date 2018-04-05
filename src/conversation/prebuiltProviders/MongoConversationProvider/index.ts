import { IAddress, IMessage } from 'botbuilder';
import { Collection, MongoClient, MongoClientOptions } from 'mongodb';
import { IConversation } from '../../IConversation';
import { ConversationState } from './../../ConversationState';
import { IConversationProvider } from './../../IConversationProvider';
import { InMemoryConversation } from './../InMemoryConversationProvider/InMemoryConversation';

export class MongoConversationProvider<T extends IAddress> implements IConversationProvider<T> {
    private readonly collection: Collection<IConversation<T>>;
    private mongoClient: MongoClient;

    private constructor(client: MongoClient, dbName: string, collectionName: string) {
        const db = client.db(dbName);
        this.mongoClient = client;
        this.collection = db.collection(collectionName);
    }
    /**
     * transcribes a message for a customer
     *
     * @param message message to be transcribed
     */
    public async addCustomerMessageToTranscript(message: IMessage): Promise<IConversation<T>> {
        const customerConversation = await this.collection.findOne({'customerAddress.conversation.id': message.address.conversation.id});

        let convo: InMemoryConversation<T>;

        if (!customerConversation) {
            convo = new InMemoryConversation<T>(message.address);
        } else {
            convo = InMemoryConversation.from(customerConversation);
        }

        convo.addCustomerMessageToTranscript(message);

        await this.collection.update({'customerAddress.conversation.id': message.address.conversation.id}, { $set: convo },
                                     { upsert: true } );

        return convo;
    }

    /**
     * transcribes a message for an Agent
     *
     * @param message message to be transcribed
     */
    public async addAgentMessageToTranscript(message: IMessage): Promise<IConversation<T>> {
        const addressWithoutSequence = Object.assign({}, message.address);
        //tslint:disable-next-line
        delete (addressWithoutSequence as any).currentLongPollSequence;
        const storedConvo = await this.collection.findOne({agentAddress: message.address});

        const convo = InMemoryConversation.from(storedConvo);

        convo.addAgentMessageToTranscript(message);

        await this.collection.update({agentAddress: message.address}, { $set: convo }, { upsert: true } );

        return convo;
    }

    /**
     * transcribes a message for a bot.
     *
     * @param message message to be transcribed
     */
    public async addBotMessageToTranscript(message: IMessage): Promise<IConversation<T>> {
        const storedConvo = await this.collection.findOne({'customerAddress.conversation.id': message.address.conversation.id});

        const convo = InMemoryConversation.from(storedConvo);

        convo.addBotMessageToTranscript(message);

        await this.collection.update({'customerAddress.conversation.id': message.address.conversation.id},
                                     { $set: convo }, { upsert: true } );

        return convo;
    }

    public async enqueueCustomer(customerAddress: IAddress): Promise<IConversation<T>> {
        const storedConvo = await this.collection.findOne({'customerAddress.conversation.id': customerAddress.conversation.id});

        const convo = InMemoryConversation.from(storedConvo);

        convo.enqueueCustomer(customerAddress);

        await this.collection.update({'customerAddress.conversation.id': customerAddress.conversation.id},
                                     { $set: convo }, { upsert: true } );

        return convo;
    }

    public async dequeueCustomer(customerAddress: IAddress): Promise<IConversation<T>> {
        const storedConvo = await this.collection.findOne({'customerAddress.conversation.id': customerAddress.conversation.id});

        const convo = InMemoryConversation.from(storedConvo);

        convo.dequeueCustomer(customerAddress);

        await this.collection.update({'customerAddress.conversation.id': customerAddress.conversation.id},
                                     { $set: convo }, { upsert: true } );

        return convo;
    }

    public async connectCustomerToAgent(customerAddress: IAddress, agentAddress: T): Promise<IConversation<T>> {
        const storedConvo = await this.collection.findOne({'customerAddress.conversation.id': customerAddress.conversation.id});

        const convo = InMemoryConversation.from(storedConvo);

        convo.connectCustomerToAgent(agentAddress);

        await this.collection.update({'customerAddress.conversation.id': customerAddress.conversation.id},
                                     { $set: convo }, { upsert: true } );

        return convo;
    }

    public async disconnectCustomerFromAgent(customerAddress: IAddress): Promise<IConversation<T>> {
        const storedConvo = await this.collection.findOne({'customerAddress.conversation.id': customerAddress.conversation.id});

        const convo = InMemoryConversation.from(storedConvo);

        convo.disconnectCustomerFromAgent();

        await this.collection.update({'customerAddress.conversation.id': customerAddress.conversation.id},
                                     { $set: convo }, { upsert: true } );

        return convo;
    }

    public async disconnectAgentFromCustomer(agentAddress: T): Promise<IConversation<T>> {
        const storedConvo = await this.collection.findOne({agentAddress});

        const convo = InMemoryConversation.from(storedConvo);

        convo.disconnectCustomerFromAgent();

        await this.collection.update({agentAddress}, { $set: convo }, { upsert: true } );

        return convo;
    }

    public async getConversationFromCustomerAddress(customerAddress: IAddress): Promise<IConversation<T>> {
        return await this.collection.findOne({'customerAddress.conversation.id': customerAddress.conversation.id});
    }

    public async getConversationFromAgentAddress(agentAddress: T): Promise<IConversation<T>> {
        return await this.collection.findOne({agentAddress});
    }

    public async closeOpenConnections(): Promise<void> {
        await this.mongoClient.close(true);
    }

    public async getConversationsConnectedToAgent(minTime?: Date): Promise<IConversation<T>[]> {
        const query = {
            conversationState: ConversationState.Agent
        //tslint:disable-next-line
        } as any;

        if (minTime) {
            query.lastModified = { $gte: minTime };
        }

        return await this.collection.find<IConversation<T>>(query).toArray();
    }

    //tslint:disable-next-line member-ordering
    public static async CreateNewMongoProvider<T extends IAddress>(
        uri: string,
        dbName: string,
        collectionName: string,
        options?: MongoClientOptions
    ): Promise<MongoConversationProvider<T>> {
        const client = await MongoClient.connect(uri, options);

        return new MongoConversationProvider<T>(client, dbName, collectionName);
    }

    // tslint:disable-next-line
    private static addId(target: any, objectWithId: any): any {
        target._id = objectWithId._id;
    }
}
