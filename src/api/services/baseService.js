import { mapKeysPascalToCamel } from "../../utils/mappers";

export function unwrapApiResponse(response) {
  const body = mapKeysPascalToCamel(response.data);
  if (!body?.success) {
    throw new Error(body?.message || "Request failed");
  }
  return body;
}
