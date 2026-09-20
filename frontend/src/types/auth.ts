export interface User {
  id: string;
  username: string;
  email?: string;
  phoneNumber: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  profilePicture?: File;
}

export interface LoginData {
  username: string;
  password: string;
}
