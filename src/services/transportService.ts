
// Re-export all transport functionality from the modular structure
export {
  fetchTransports,
  fetchTransportById,
  fetchTransportsByPatientCase,
  fetchActiveTransports,
  createTransport,
  updateTransport,
  updateTransportLocation,
  getTransportLocationHistory
} from './transport';
