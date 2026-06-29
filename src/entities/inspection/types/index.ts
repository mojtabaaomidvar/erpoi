
export interface Inspection {
  id: string;
  inspection_no: string;
  contract_id?: string;
  client_id?: string;
  discipline: string;
  location: string;
  status: string;
  inspector_name?: string;
  date_requested?: string;
  date_assigned?: string;
  date_completed?: string;
  has_ncr?: boolean;
}
