export class AgentNotInConversationError extends Error {
    constructor(msg: string = 'agent attempted to perform operation on a conversation that requires a connection') {
        super(msg);

        this.name = 'AgentNotInConversationError';

        Object.setPrototypeOf(this, AgentNotInConversationError.prototype);
    }
}
