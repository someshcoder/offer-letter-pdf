import { Schema } from "mongoose";

export const softDeleteFields = {
  deletedAt: { type: Date, default: null, index: true },
  deletedBy: { type: String, default: null },
  isActive: { type: Boolean, default: true, index: true },
};

export const actorFields = {
  createdBy: { type: String, default: "" },
  updatedBy: { type: String, default: "" },
};

export function softDeleteSchemaPlugin(schema: Schema) {
  schema.add(softDeleteFields);
  schema.add(actorFields);
}
