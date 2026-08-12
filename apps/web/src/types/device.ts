export interface Device {
  id: number;
  name: string;
  device_key: string;
  created_at: string;
  last_seen: string | null;
  is_active: boolean;
}