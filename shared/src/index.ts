// Public barrel for @app/shared. Re-exports the cross-cutting API contracts
// (currently the error envelope) consumed by both frontend and backend.
export {
  ERROR_STATUS,
  type ErrorCode,
  errorCodeSchema,
  type ErrorEnvelope,
  errorEnvelopeSchema,
} from "./api/common";
