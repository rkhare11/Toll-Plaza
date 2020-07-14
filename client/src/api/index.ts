import { tollServiceDef } from "./toll";
import { fetchApi, CrudService } from "./utils";

// All the serviceDefs can be added here and exported as a separate API call with different methods.
export const TollApi = fetchApi<CrudService<{_id?: string, vehicleRegistrationNumber: string, amount: number, createdAt: string, updatedAt: string}>>(tollServiceDef);
