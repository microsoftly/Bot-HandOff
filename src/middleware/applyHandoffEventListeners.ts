// import * as Promise from 'bluebird';
import { IAddress, Message, UniversalBot } from 'botbuilder';
import { EventMessageType } from '../eventMessages/EventMessageType';
import { HandoffEventMessage } from '../eventMessages/HandoffEventMessage';
import { IConversation } from '../IConversation';
import { EventFailureHandler } from '../options/EventFailureHandlers';
import { IEventHandler, IEventHandlers } from '../options/IEventHandlers';
import { IProvider } from '../provider/IProvider';
import { ErrorEventMessage } from './../eventMessages/ErrorEventMessage';

/**
 * adds 6 event listeners, 1 for each event message type. Any incoming messages will go through this middleware before any other. If there
 * is a match, the message is **NOT** propagated futher down the middleware chain
 *
 * @param bot bot that the middleware is being provided to
 * @param provider implementation of data provider layer
 * @param eventHandlers success and failure handlers for each EventMessage type
 */
export function applyHandoffEventListeners(bot: UniversalBot, provider: IProvider, eventHandlers: IEventHandlers): void {
    return new HandoffMessageEventListnerApplicator(bot, provider, eventHandlers).applyHandoffEventListeners();
}

class HandoffMessageEventListnerApplicator {
    private provider: IProvider;
    private bot: UniversalBot;
    private eventHandlers: IEventHandlers;

    constructor(bot: UniversalBot, provider: IProvider, eventHandlers: IEventHandlers) {
        this.bot = bot;
        this.provider = provider;
        this.eventHandlers = eventHandlers;
    }

    public applyHandoffEventListeners(): void {
        this.bot.on(
            EventMessageType.Connect,
            this.wrapEventHandlerWithResultPropagator(
                this.handleConnectEvent.bind(this),
                this.eventHandlers.connect));

        this.bot.on(
            EventMessageType.Disconnect,
            this.wrapEventHandlerWithResultPropagator(
                this.handleDisconnectEvent.bind(this),
                this.eventHandlers.disconnect));

        this.bot.on(
            EventMessageType.Queue,
            this.wrapEventHandlerWithResultPropagator(
                this.handleQueueEvent.bind(this),
                this.eventHandlers.queue));

        this.bot.on(
            EventMessageType.Dequeue,
            this.wrapEventHandlerWithResultPropagator(
                this.handleDequeueEvent.bind(this),
                this.eventHandlers.dequeue));

        this.bot.on(
            EventMessageType.Watch,
            this.wrapEventHandlerWithResultPropagator(
                this.handleWatchEvent.bind(this),
                this.eventHandlers.watch));

        this.bot.on(
            EventMessageType.Unwatch,
            this.wrapEventHandlerWithResultPropagator(
                this.handleUnwatchEvent.bind(this),
                this.eventHandlers.unwatch));
    }

    private wrapEventHandlerWithResultPropagator(
        fn: (msg: HandoffEventMessage) => Promise<void>,
        eventHandler: IEventHandler
    ): (msg: HandoffEventMessage) => Promise<void> {
        return async (msg: HandoffEventMessage): Promise<void> => {
            try {
                await fn(msg);
                eventHandler.success(this.bot, msg);
            } catch (err) {
                eventHandler.failure(this.bot, new ErrorEventMessage(msg, err));
            }
        };
    }

    private async handleQueueEvent(msg: HandoffEventMessage): Promise<void> {
        await this.provider.queueCustomerForAgent(msg.customerAddress);
    }

    private async handleDequeueEvent(msg: HandoffEventMessage): Promise<void> {
        await this.provider.dequeueCustomerForAgent(msg.customerAddress);
    }

    private async handleWatchEvent(msg: HandoffEventMessage): Promise<void> {
        await this.provider.watchConversation(msg.customerAddress, msg.agentAddress);
    }

    private async handleUnwatchEvent(msg: HandoffEventMessage): Promise<void> {
        await this.provider.unwatchConversation(msg.customerAddress, msg.agentAddress);
    }

    private async handleConnectEvent(msg: HandoffEventMessage): Promise<void> {
        await this.provider.connectCustomerToAgent(msg.customerAddress, msg.agentAddress);
    }

    private async handleDisconnectEvent(msg: HandoffEventMessage): Promise<void> {
        await this.provider.disconnectCustomerFromAgent(msg.customerAddress, msg.agentAddress);
    }
}
