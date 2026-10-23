import type { ClientsState, ClientsAction } from '../types/client';

export const initialClientsState: ClientsState = {
  clients: [],
  loading: true,
  submitting: false,
  error: null,
  searchTerm: '',
  statusFilter: 'all',
  selectedClient: null,
  isModalOpen: false,
  modalMode: 'create',
  formData: {
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'active',
    notes: '',
    projectId: '',
  },
  formErrors: {},
};

export function clientsReducer(state: ClientsState, action: ClientsAction): ClientsState {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };

    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        clients: action.payload,
        error: null,
      };

    case 'FETCH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case 'SET_SEARCH':
      return {
        ...state,
        searchTerm: action.payload,
      };

    case 'SET_STATUS_FILTER':
      return {
        ...state,
        statusFilter: action.payload,
      };

    case 'OPEN_CREATE_MODAL':
      return {
        ...state,
        isModalOpen: true,
        modalMode: 'create',
        selectedClient: null,
        formData: {
          name: '',
          email: '',
          phone: '',
          company: '',
          status: 'active',
          notes: '',
          projectId: '',
        },
        formErrors: {},
      };

    case 'OPEN_EDIT_MODAL':
      return {
        ...state,
        isModalOpen: true,
        modalMode: 'edit',
        selectedClient: action.payload,
        formData: {
          name: action.payload.name || '',
          email: action.payload.email || '',
          phone: action.payload.phone || '',
          company: action.payload.company || '',
          status: action.payload.status || 'active',
          notes: action.payload.notes || '',
          projectId: action.payload.projectId || '',
        },
        formErrors: {},
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        isModalOpen: false,
        selectedClient: null,
        formErrors: {},
      };

    case 'SET_FORM_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.payload.field]: action.payload.value,
        },
        formErrors: {
          ...state.formErrors,
          [action.payload.field]: undefined,
        },
      };

    case 'SET_FORM_ERRORS':
      return {
        ...state,
        formErrors: action.payload,
      };

    case 'SUBMIT_START':
      return {
        ...state,
        submitting: true,
      };

    case 'SUBMIT_SUCCESS_CREATE':
      return {
        ...state,
        submitting: false,
        isModalOpen: false,
        clients: [action.payload, ...state.clients],
        formErrors: {},
      };

    case 'SUBMIT_SUCCESS_UPDATE':
      return {
        ...state,
        submitting: false,
        isModalOpen: false,
        clients: state.clients.map((c) => (c.id === action.payload.id ? action.payload : c)),
        formErrors: {},
      };

    case 'SUBMIT_ERROR':
      return {
        ...state,
        submitting: false,
      };

    case 'DELETE_CLIENT_SUCCESS':
      return {
        ...state,
        clients: state.clients.filter((c) => c.id !== action.payload),
      };

    default:
      return state;
  }
}
