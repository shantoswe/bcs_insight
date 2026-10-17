// Throw from services for expected failures; the API guard turns it into
// a clean envelope instead of a 500.
export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
