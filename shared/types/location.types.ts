export interface Location {
  id: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  type: string;
  createdAt?: Date;
}
