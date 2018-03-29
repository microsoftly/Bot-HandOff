import { Session } from 'botbuilder';

export interface IRouter {
    //tslint:disable-next-line
    route(session: Session,  next?: Function): Promise<any>;
}
