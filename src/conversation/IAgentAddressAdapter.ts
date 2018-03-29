import { IAddress } from 'botbuilder';

export interface IAgentAddressAdapter<T> {
    convertAgentAddress(agentAddress: T): IAddress;
}
