import { ConnectEventMessage } from './ConnectEventMessage';
import { DequeueEventMessage } from './DequeueEventMessage';
import { DisconnectEventMessage } from './DisconnectEventMessage';
import { ErrorEventMessage } from './ErrorEventMessage';
import { HandoffEventMessage } from './HandoffEventMessage';
import { QueueEventMessage } from './QueueEventMessage';
import { UnwatchEventMessage } from './UnwatchEventMessage';
import { WatchEventMessage } from './WatchEventMessage';

export const eventMessages = {
    ConnectEventMessage,
    DequeueEventMessage,
    DisconnectEventMessage,
    ErrorEventMessage,
    HandoffEventMessage,
    QueueEventMessage,
    UnwatchEventMessage,
    WatchEventMessage
};
