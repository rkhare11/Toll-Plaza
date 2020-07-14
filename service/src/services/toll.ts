import {curdServiceImpl, crudServiceDef} from ".";
import {TollModel} from "../models/toll";

export const tollServiceDef = {
    ...crudServiceDef("toll", "tolls"),
}

export const tollServiceImpl = {
    ...curdServiceImpl(TollModel),
};
