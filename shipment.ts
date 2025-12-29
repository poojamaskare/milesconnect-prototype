export enum ShipmentStatus {
  PENDING = 'PENDING',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  DELAYED = 'DELAYED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_PAID = 'PARTIALLY_PAID'
}

export interface Location {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: string;
  model?: string;
  capacity?: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
}

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
}

export interface Shipment {
  id: string;
  trackingId: string;
  origin: Location;
  destination: Location;
  status: ShipmentStatus;
  assignedVehicle?: Vehicle;
  assignedDriver?: Driver;
  eta?: Date;
  paymentStatus: PaymentStatus;
  timestamps: Timestamps;
}

export interface CreateShipmentDTO {
  trackingId: string;
  origin: Location;
  destination: Location;
  assignedVehicleId?: string;
  assignedDriverId?: string;
  eta?: Date;
}

export interface UpdateShipmentDTO {
  status?: ShipmentStatus;
  assignedVehicleId?: string;
  assignedDriverId?: string;
  eta?: Date;
  paymentStatus?: PaymentStatus;
}
