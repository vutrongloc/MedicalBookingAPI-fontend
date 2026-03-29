import { mapKeysPascalToCamel } from "../../utils/mappers";

export function unwrapApiResponse(response) {
  const body = mapKeysPascalToCamel(response.data);

  // Handle [ApiController] ProblemDetails validation error format
  if (body && typeof body === "object") {
    if (body.errors && typeof body.errors === "object") {
      const firstErrorKey = Object.keys(body.errors)[0];
      const firstError = Array.isArray(body.errors[firstErrorKey])
        ? body.errors[firstErrorKey][0]
        : body.errors[firstErrorKey];
      throw new Error(firstError || "Dữ liệu không hợp lệ");
    }
  }

  if (!body?.success) {
    throw new Error(body?.message || "Request failed");
  }
  return body;
}
