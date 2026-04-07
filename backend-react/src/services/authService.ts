import api from './api';
import { User } from './userService';

export interface LoginCredentials {
  email: string;
  mot_de_passe: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

class AuthService {
  private readonly STORAGE_KEY = 'bmp_user';
  private readonly STORAGE_TOKEN = 'bmp_token';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('Tentative de login avec:', credentials.email);
      
      // Appeler l'endpoint de login du backend
      const response = await api.post<{ success: boolean; user?: User; message?: string }>('/users/login', {
        email: credentials.email,
        mot_de_passe: credentials.mot_de_passe,
      });

      console.log('Réponse du serveur:', response.data);

      if (!response.data.success || !response.data.user) {
        const errorMsg = response.data.message || 'Email ou mot de passe incorrect';
        console.error('Erreur de login:', errorMsg);
        throw new Error(errorMsg);
      }

      const user = response.data.user;
      console.log('Utilisateur connecté:', user);

      // Stocker l'utilisateur et créer un token simple
      const token = this.generateToken(user._id || '');
      this.setUser(user, token);

      return { user, token };
    } catch (error: any) {
      console.error('Erreur complète:', error);
      const raw = error.response?.data?.message;
      const errorMessage = Array.isArray(raw)
        ? raw.join(' ')
        : raw || error.message || 'Erreur de connexion';
      throw new Error(errorMessage);
    }
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_TOKEN);
    window.location.href = '/login';
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.STORAGE_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.STORAGE_TOKEN);
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  private setUser(user: User, token: string): void {
    // Ne pas stocker le mot de passe
    const { mot_de_passe, ...userWithoutPassword } = user;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userWithoutPassword));
    localStorage.setItem(this.STORAGE_TOKEN, token);
  }

  private generateToken(userId: string): string {
    // Token simple - en production utiliser JWT
    return btoa(`${userId}-${Date.now()}`);
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const response = await api.put<User>(`/users/${userId}`, data);
    const updatedUser = response.data;
    
    // Mettre à jour l'utilisateur stocké
    const { mot_de_passe, ...userWithoutPassword } = updatedUser;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userWithoutPassword));
    
    return updatedUser;
  }
}

export default new AuthService();
