import { Session } from 'botbuilder';
import { MessageReceivedWhileWaitingHandler } from '../options/MessageReceivedWhileWaitingHandler';
import { AgentMessageRouter } from '../routers/AgentMessageRouter';
import { CustomerMessageRouter } from '../routers/CustomerMessageRouter';
import { IHandoffMessage } from './../IHandoffMessage';

/**
 * returns the middleware that selects which route to send the message through: customer or agent
 * @param customerMessageRouter customer message route handler
 * @param agentMessageRouter agent message route handler
 */
export function getRouteMessgeMiddleware(
    isAgentFn: (session: Session) => Promise<boolean>,
    customerMessageRouter: CustomerMessageRouter,
    agentMessageRouter: AgentMessageRouter
): (session: Session, next: Function) => Promise<void> {
    return async (session: Session, next: Function): Promise<void> => {
        if (session.message.type === 'message') {
            const isAgent = await isAgentFn(session);
            const message = session.message;

            if (isAgent) {
                agentMessageRouter.Route(session);
            } else {
                customerMessageRouter.Route(session, next);
            }
        } else {
            next();
        }
    };
}
