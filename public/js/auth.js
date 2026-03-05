(function() {
    'use strict';
    
    // ============================================
    // CONFIGURAÇÃO SUPABASE
    // ============================================
    
    const SUPABASE_URL = 'https://cqvkfrojkjicfxipwltz.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdmtmcm9qa2ppY2Z4aXB3bHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTQzNzksImV4cCI6MjA4Nzk3MDM3OX0.THdrIPT1L9l3WPD3ltuI4oR0ggAn-MUi_FCqPfBobDE';
    
    // ============================================
    // INICIALIZAÇÃO COM VERIFICAÇÃO
    // ============================================
    
    if (window.Auth && window.Auth.client) {
        console.log('Auth já inicializado');
        return;
    }
    
    // Verificar se supabase está disponível
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase SDK não carregado');
        window.Auth = { error: 'Supabase SDK não carregado' };
        return;
    }
    
    // Criar cliente
    let client;
    try {
        client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });
        console.log('✅ Cliente Supabase criado');
    } catch (err) {
        console.error('❌ Erro ao criar cliente:', err);
        window.Auth = { error: 'Erro ao inicializar Supabase' };
        return;
    }
    
    // ============================================
    // API PÚBLICA
    // ============================================
    
    window.Auth = {
        client: client,
        
        // Login com tratamento de erro
        async login(email, password) {
            try {
                console.log('🔐 Tentando login...');
                
                const { data, error } = await client.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) {
                    console.error('❌ Erro login:', error);
                    return { 
                        success: false, 
                        error: error.message 
                    };
                }
                
                console.log('✅ Login OK');
                return { 
                    success: true, 
                    user: data.user,
                    session: data.session,
                    error: null 
                };
                
            } catch (err) {
                console.error('❌ Exceção no login:', err);
                return { 
                    success: false, 
                    error: 'Erro de conexão com o servidor' 
                };
            }
        },
        
        // Logout
        async logout() {
            try {
                const { error } = await client.auth.signOut();
                if (error) throw error;
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },
        
        // Verificar sessão
        async getCurrentUser() {
            try {
                const { data: { user }, error } = await client.auth.getUser();
                if (error) throw error;
                return { user, error: null };
            } catch (error) {
                return { user: null, error: error.message };
            }
        }
    };
    
    console.log('✅ Auth pronto');
})();
