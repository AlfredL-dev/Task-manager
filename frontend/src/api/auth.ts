import { api } from './client'
import type { AuthResponse } from '../types'

export async function register(email: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/api/auth/register', { email, password })
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/api/auth/login', { email, password })
}
