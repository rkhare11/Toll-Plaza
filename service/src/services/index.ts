import { Model, Document } from "mongoose";

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

// credServiceDef and crudServiceImpl can be used generically to create any service.
// The model with specific fields needs to be created separately

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

export function curdServiceImpl<M>(model: Model<M & Document>) {
    return {
        async find({query = {}, order, limit, offset, projection = {}}: FindOptions = {}) {
            const parsedLimit = parseInt(limit!, 10);
            const parsedOffset = parseInt(offset!, 10);
            const mongoQuery = model
                .find(query as any, projection)
                .limit(parsedLimit!)
                .skip(parsedOffset);
            if (order) {
                mongoQuery.sort(order);
            }
            return mongoQuery.exec();
        },
        async findById({id, projection = {}}: FindOptions & {id: string}) {
            return model
                .findById(id, projection);
        },
        async create({item}: {item: M}) {
            return model.create(item as any);
        },
        async update({id, item}: {id: string, item: M}) {
            return model.findByIdAndUpdate(id, item, {useFindAndModify: false, new: true});
        },
        async delete({id}: {id: string}) {
            return model.findByIdAndRemove(id, {useFindAndModify: false} as any);
        },
    };
}

export * from "./toll";
