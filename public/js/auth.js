(function() {
    'use strict';
    
    const SUPABASE_URL = 'https://cqvkfrojkicfxipwltz.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdmtmcm9qa2ppY2Z4aXB3bHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTQzNzksImV4cCI6MjA4Nzk3MDM3OX0.THdrIPT1L9l3WPD3ltuI4oR0ggAn-MUi_FCqPfBobDE';
    
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase SDK não carregado');
        window.Auth = { error: 'Supabase SDK não carregado' };
        return;
    }
    
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    window.Auth = {
        client: client,
        
        async login(email, password) {
            try {
                const { data, error } = await client.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) throw error;
                
                return { 
                    success: true, 
                    user: data.user,
                    session: data.session,
                    error: null 
                };
            } catch (error) {
                console.error('❌ Erro login:', error.message);
                return { 
                    success: false, 
                    error: error.message 
                };
            }
        },
        
        async logout() {
            try {
                await client.auth.signOut();
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },
        
        async getCurrentUser() {
            const { data: { user } } = await client.auth.getUser();
            return { user };
        }
    };
    
    console.log('✅ Auth pronto');
})();
