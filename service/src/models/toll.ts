import {Document, model, Model, Schema} from "mongoose";

export interface TollDocument extends Document {
    vehicleRegistrationNumber: string;
    amount: number;
    updatedAt: string,
    createdAt: string;
}

const schema = new Schema({
    vehicleRegistrationNumber: String,
    amount: Number,
}, {timestamps: true, collation: {locale: "en", strength: 2}});

export const TollModel: Model<TollDocument> = model<TollDocument>("tolls", schema);
