// Central export file for all services
export * from './auth';
export * from './students';
export * from './dashboard';
export * from './payments';
export * from './feeStructures';

// Re-export for better IDE support
export { feeStructuresService } from './feeStructures';
