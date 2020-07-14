import {stringify} from "query-string";
import UrlPattern from "url-pattern";

const baseUrl = "http://localhost:5000/api/v1";

export interface CallDef {
    method: "GET" | "PUT" | "POST" | "DELETE";
    path: string;
    queryParams?: string[];
    jsonQueryParams?: string[];
    body?: string;
    name?: string;
}

export type ServiceDef<E> = {
    [P in keyof E]: CallDef;
};

interface FetchOptions {
    method?: string;
    body?: string;
    headers?: {[header: string]: string};
}

export function crudServiceDef<M>(name: string, pluralName: string) {
    return {
        find: {
            method: "GET" as "GET",
            path: `/${pluralName}`,
            queryParams: ["limit", "offset"],
            jsonQueryParams: ["query", "order", "projection"],
            name,
        },
        findById: {
            method: "GET" as "GET",
            path: `/${pluralName}/:id`,
            jsonQueryParams: ["projection"],
            name,
        },
        create: {
            body: "item",
            method: "POST" as "POST",
            path: `/${pluralName}`,
            name,
        },
        update: {
            body: "item",
            method: "PUT" as "PUT",
            path: `/${pluralName}/:id`,
            name,
        },
        delete: {
            authorize: true,
            method: "DELETE" as "DELETE",
            path: `/${pluralName}/:id`,
            name,
        },
    };
}

interface Query {
    [field: string]: string | number | boolean | Query | {};
}
  
interface NestedOrder {
    [field: string]: string | NestedOrder | Query;
}
  
interface Order {
    [field: string]: NestedOrder | 1 | -1;
}

interface FindOptions {
    query?: Query;
    order?: Order;
    limit?: string;
    offset?: string;
    projection?: Query;
}

export interface CrudService<E> {
    find(options?: FindOptions): Promise<Array<E>>;

    findById(options: { id: string, projection?: Query, ignoreCache?: boolean }): Promise<E>;
    
    create(options: { item: E }): Promise<E>;
  
    update(options: { id: string, item: E, restore?: boolean }): Promise<E>;
  
    delete(options: { id: string }): Promise<E>;
}

export function fetchApi<S>(def: ServiceDef<S>): S {
    const methods = Object.keys(def);
    // initializing with a default service def
    let service: any = {};
    methods.forEach((methodName: string) => {
        const callDef: CallDef = (def as any)[methodName];
        const pattern = new UrlPattern(callDef.path);
        (service as any)[methodName] = (ops: {[param: string]: any} = {}) => {
            const query: any = {};
            const queryParams = callDef.queryParams || [];
            queryParams.forEach((queryParam) => {
                query[queryParam] = ops[queryParam];
            });
            const jsonQueryParams = callDef.jsonQueryParams || [];
            jsonQueryParams.forEach((queryParam) => {
                if (typeof ops[queryParam] === "object") {
                    query[queryParam] = JSON.stringify(ops[queryParam]);
                }
            });
            const queryString = stringify(query);

            let url: string;
            try {
                url = `${baseUrl + pattern.stringify(ops)}?${queryString}`;
            } catch (e) {
                // pattern match failed
                const msg =
                    `Failed to construct api call for ${methodName}` +
                    `, with path ${callDef.path}, and options: ${JSON.stringify(ops)}.` +
                    ` Probably missing a required option.`;
                throw new Error(msg);
            }
            const body = callDef.body ? JSON.stringify(ops[callDef.body]) : undefined;
            const headers: any = {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Expires": 0,
                "Pragma": "no-cache",
            };
            if (body) {
                headers["Content-Type"] = "application/json";
            }
            const fetchOps: FetchOptions = {
                body,
                headers,
                method: callDef.method,
            };
            const fetchTask = fetch!(url, fetchOps)
                .then((res) => {
                    const json: any = res.json();
                    return json;
                });
            return fetchTask;
        };
    });
    return service;
}
