import { FastifyInstance } from 'fastify';
import type Logger from '../log';
import { IAccount } from '../models/account';
import authRouter from './auth';

export type Closure = (err?: Error | undefined) => void;

export interface Context {
    user:       IAccount;
    servers:    unknown[];
    type:       SessionType;
    isAdmin:    boolean;
}

export enum SessionType {
    NONE,
    RETURNING,
    NEW_ACCOUNT
}

export default async function (log: Logger, ctx: FastifyInstance, done: Closure) {
    ctx.setNotFoundHandler((_, res) => res.view('errors.ejs', {
        code: 404,
        message: 'Page Not Found'
    }));

    ctx.addHook('onError', (_, res, err, done) => {
        log.error(err.message);
        res.view('errors.ejs', {
            code: err.code,
            message: err.message
        });
        return done();
    });

    ctx.get('/login', (_, res) => { res.view('login.ejs', {}); });
    ctx.get('/signup', (_, res) => { res.view('signup.ejs', {}); });
    ctx.register(
        (api, _, done) => authRouter(log, api, done),
        { prefix: '/auth' }
    );

    ctx.get('/dashboard', (req, res) => {
        const session = req.session.get('account');
        if (!session) {
            res.redirect('/login');
        } else {
            res.view<Context>('dashboard.ejs', session);
        }
    });

    ctx.get('/', (_, res) => {
        res.view('home.ejs');
    });

    done();
}
