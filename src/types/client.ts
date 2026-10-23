export interface ClientProject {
  id: string;
  title: string;
  slug: string;
  routePrefix: string;
}

export interface ClientItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  status: 'active' | 'lead' | 'inactive';
  notes?: string | null;
  projectId?: string | null;
  project?: ClientProject | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'active' | 'lead' | 'inactive';
  notes: string;
  projectId: string;
}

export interface ClientFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface ProjectOption {
  id: string;
  title: string;
  slug: string;
  routePrefix: string;
}

export interface ClientsState {
  clients: ClientItem[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'lead' | 'inactive';
  selectedClient: ClientItem | null;
  isModalOpen: boolean;
  modalMode: 'create' | 'edit';
  formData: ClientFormData;
  formErrors: ClientFormErrors;
}

export type ClientsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: ClientItem[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: 'all' | 'active' | 'lead' | 'inactive' }
  | { type: 'OPEN_CREATE_MODAL' }
  | { type: 'OPEN_EDIT_MODAL'; payload: ClientItem }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_FORM_FIELD'; payload: { field: keyof ClientFormData; value: string } }
  | { type: 'SET_FORM_ERRORS'; payload: ClientFormErrors }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS_CREATE'; payload: ClientItem }
  | { type: 'SUBMIT_SUCCESS_UPDATE'; payload: ClientItem }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'DELETE_CLIENT_SUCCESS'; payload: string };
