(function () {
    'use strict';

    const SUPABASE_URL      = 'https://cqvkfrojkjicfxipwltz.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdmtmcm9qa2ppY2Z4aXB3bHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTQzNzksImV4cCI6MjA4Nzk3MDM3OX0.THdrIPT1L9l3WPD3ltuI4oR0ggAn-MUi_FCqPfBobDE';

    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase SDK não carregado');
        window.Auth = { error: 'Supabase SDK não carregado' };
        return;
    }

    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    window.Auth = {
        client,

        async login(email, password) {
            try {
                const { data, error } = await client.auth.signInWithPassword({ email, password });
                if (error) throw error;
                const { data: profile } = await client
                    .from('profiles').select('*').eq('id', data.user.id).single();
                return { success: true, user: data.user, profile: profile || {}, error: null };
            } catch (err) {
                return { success: false, user: null, profile: null, error: err.message };
            }
        },

        async register({ email, password, name, cpf, role, oab }) {
            try {
                const { data: authData, error: authError } = await client.auth.signUp({ email, password });
                if (authError) throw authError;
                await client.from('profiles').insert([{
                    id: authData.user.id, name, email,
                    cpf: cpf || null, role, oab: oab || null,
                    created_at: new Date().toISOString()
                }]);
                return { success: true, user: authData.user, error: null };
            } catch (err) {
                return { success: false, error: err.message };
            }
        },

        async logout() {
            try {
                await client.auth.signOut();
                return { success: true };
            } catch (err) {
                return { success: false, error: err.message };
            }
        },

        async getCurrentUser() {
            try {
                const { data: { user }, error } = await client.auth.getUser();
                if (error || !user) return { user: null, profile: null, error: null };
                const { data: profile } = await client
                    .from('profiles').select('*').eq('id', user.id).single();
                return { user, profile: profile || {}, error: null };
            } catch (err) {
                return { user: null, profile: null, error: err.message };
            }
        },

        isAdmin:  (p) => p?.role === 'admin',
        isClient: (p) => p?.role === 'cliente',
        isLawyer: (p) => p?.role === 'advogado'
    };

    document.dispatchEvent(new CustomEvent('authReady'));
})();
