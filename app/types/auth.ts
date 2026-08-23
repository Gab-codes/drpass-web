export interface UserResponse {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: 'admin' | 'user';
}
