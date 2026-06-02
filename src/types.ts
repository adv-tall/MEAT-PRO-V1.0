export interface UserPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canVerify: boolean;
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  avatar?: string;
  permissions: UserPermissions;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}
