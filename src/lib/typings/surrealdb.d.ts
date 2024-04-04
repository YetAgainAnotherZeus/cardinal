/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import * as SurrealdbNode from "surrealdb.node";
declare module "surrealdb.node" {
    interface Scope {
        namespace: string;
        database: string;
        scope: string;
        params: unknown;
    }
    interface Database {
        namespace: string;
        database: string;
        username: string;
        password: string;
    }
    interface Namespace {
        namespace: string;
        username: string;
        password: string;
    }
    interface Root {
        username: string;
        password: string;
    }

    /**
     * Credentials type
     */
    type Credentials = Scope | Database | Namespace | Root;

    /**
     * Use options
     * @param ns - The namespace to use
     * @param db - The database to use
     */
    interface Use {
        ns: string;
        db: string;
    }

    /**
     * Endpoint options
     * @param capacity - The maximum number of connections to keep open
     * @param strict - Whether to fail fast on connection errors
     */
    interface Options {
        capacity: number;
        strict: boolean;
    }

    /**
     * Napi-rs error type
     * @param code - The error code
     */
    interface NapiErr {
        code: string;
    }

    /**
     * Typescript type of Rust's `Result<()>`
     */
    type ResultOk = null;

    class Surreal {
        constructor()
        connect(endpoint: string, opts?: Options): Promise<void>
        use(value: Use): Promise<void>
        set(key: string, value: unknown): Promise<void>
        unset(key: string): Promise<void>
        signup(credentials: Credentials): Promise<ResultOk>
        signin(credentials: Credentials): Promise<ResultOk>
        invalidate(): Promise<void>
        authenticate(token: string): Promise<void>
        query(sql: string, bindings?: unknown): Promise<unknown>
        select(resource: string): Promise<unknown>
        create(resource: string, data?: unknown): Promise<unknown>
        update(resource: string, data?: unknown): Promise<unknown>
        merge(resource: string, data: unknown): Promise<unknown>
        patch(resource: string, data: unknown): Promise<unknown>
        delete(resource: string): Promise<unknown>
        version(): Promise<string>
        health(): Promise<void>
    }
}