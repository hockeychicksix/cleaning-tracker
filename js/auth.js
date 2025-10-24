// js/auth.js
// Authentication Utilities for Cadence

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

export const auth = {
    /**
     * Sign in with email and password
     */
    async signIn(email, password) {
        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error_description || result.msg || 'Sign in failed');
            }

            const accessToken = result.access_token;
            const user = result.user;

            if (!accessToken) {
                throw new Error('No access token received');
            }

            // Store auth token
            localStorage.setItem('supabase.auth.token', accessToken);
            localStorage.setItem('supabase.auth.user', JSON.stringify(user));

            return { data: { user, session: result }, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Sign up with email and password
     */
    async signUp(email, password) {
        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error_description || result.msg || 'Sign up failed');
            }

            const accessToken = result.access_token;
            const user = result.user;

            if (!accessToken) {
                throw new Error('No access token received');
            }

            // Store auth token
            localStorage.setItem('supabase.auth.token', accessToken);
            localStorage.setItem('supabase.auth.user', JSON.stringify(user));

            return { data: { user, session: result }, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            const accessToken = localStorage.getItem('supabase.auth.token');
            
            if (accessToken) {
                await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local storage
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('supabase.auth.user');
            window.location.href = './login.html';
        }
    },

    /**
     * Get current session
     */
    async getSession() {
        const accessToken = localStorage.getItem('supabase.auth.token');
        
        if (!accessToken) {
            return { data: { session: null }, error: null };
        }

        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.ok) {
                const user = await response.json();
                return {
                    data: {
                        session: {
                            user,
                            access_token: accessToken
                        }
                    },
                    error: null
                };
            } else {
                // Token is invalid
                localStorage.removeItem('supabase.auth.token');
                localStorage.removeItem('supabase.auth.user');
                return { data: { session: null }, error: new Error('Invalid session') };
            }
        } catch (error) {
            return { data: { session: null }, error };
        }
    },

    /**
     * Get current user
     */
    async getUser() {
        const session = await this.getSession();
        return {
            data: { user: session.data.session?.user || null },
            error: session.error
        };
    },

    /**
     * Check if user is authenticated (for protected pages)
     */
    async requireAuth() {
        const { data: { session } } = await this.getSession();
        
        if (!session) {
            window.location.href = './login.html';
            return null;
        }
        
        return session.user;
    },

    /**
     * Reset password (send email)
     */
    async resetPassword(email) {
        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error_description || result.msg || 'Password reset failed');
            }

            return { data: result, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }
};

/**
 * Initialize auth check on page load for protected pages
 * Call this at the top of any page that requires authentication
 */
export async function initAuthCheck() {
    const user = await auth.requireAuth();
    return user;
}