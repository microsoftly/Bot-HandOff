export class AgentAlreadyConnectedOnConversationIdException extends Error {
    constructor(msg: string = 'agent conversation is alreaedy connected to a customer') {
        super(msg);

        this.name = 'AgentAlreadyConnectedOnConversationIdException';

        Object.setPrototypeOf(this, AgentAlreadyConnectedOnConversationIdException.prototype);
    }
}
