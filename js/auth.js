// js/auth.js
// Authentication helper utilities

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

export const auth = {
    // Check if user is logged in
    async getSession() {
        const accessToken = localStorage.getItem('supabase.auth.token');
        if (!accessToken) return { data: { session: null } };
        
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
                    } 
                };
            }
        } catch (error) {
            console.error('Session check failed:', error);
        }
        
        return { data: { session: null } };
    },
    
    // Sign out
    async signOut() {
        localStorage.removeItem('supabase.auth.token');
        window.location.href = './login.html';
    },
    
    // Get current user
    async getUser() {
        const accessToken = localStorage.getItem('supabase.auth.token');
        if (!accessToken) return { data: { user: null } };
        
        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                return { data: { user } };
            }
        } catch (error) {
            console.error('Get user failed:', error);
        }
        
        return { data: { user: null } };
    }
};

// Check auth and redirect if needed
export async function requireAuth() {
    const { data: { session } } = await auth.getSession();
    
    if (!session) {
        window.location.href = './login.html';
        return false;
    }
    
    return true;
}

// Check onboarding status
export async function checkOnboarding() {
    const { data: { session } } = await auth.getSession();
    if (!session) return false;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/settings?user_id=eq.${session.user.id}&select=onboarding_completed`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${session.access_token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data[0] && !data[0].onboarding_completed) {
                window.location.href = './onboarding.html';
                return false;
            }
        }
    } catch (error) {
        console.error('Onboarding check failed:', error);
    }
    
    return true;
}