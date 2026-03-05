(function() {
    'use strict';
    
    // ============================================
    // CONFIGURAÇÃO SUPABASE
    // ============================================
    
    const SUPABASE_URL = 'https://cqvkfrojkjicfxipwltz.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdmtmcm9qa2ppY2Z4aXB3bHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTQzNzksImV4cCI6MjA4Nzk3MDM3OX0.THdrIPT1L9l3WPD3ltuI4oR0ggAn-MUi_FCqPfBobDE';
    
    // ============================================
    // INICIALIZAÇÃO
    // ============================================
    
    if (window.Auth && window.Auth.client) {
        console.log('Auth já inicializado');
        return;
    }
    
    // Criar cliente Supabase
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // ============================================
    // CRIAR ADMIN AUTOMATICAMENTE
    // ============================================
    
    async function setupAdmin() {
        try {
            const adminEmail = 'admin@cartorio4oficio.com';
            const adminPassword = 'Admin@123456';
            
            // Tenta fazer login
            const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
                email: adminEmail,
                password: adminPassword
            });
            
            if (loginError) {
                // Se falhar, cria o usuário
                if (loginError.message.includes('Invalid login')) {
                    const { error: signUpError } = await client.auth.signUp({
                        email: adminEmail,
                        password: adminPassword
                    });
                    
                    if (signUpError) {
                        console.log('Admin pode já existir ou erro:', signUpError.message);
                    } else {
                        console.log('✅ Admin criado:', adminEmail);
                    }
                }
            } else {
                console.log('✅ Admin verificado');
                await client.auth.signOut();
            }
        } catch (err) {
            console.error('Erro setup admin:', err);
        }
    }
    
    // ============================================
    // API PÚBLICA
    // ============================================
    
    window.Auth = {
        client: client,
        
        // Login
        async login(email, password) {
            try {
                const { data, error } = await client.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (error) throw error;
                
                return { 
                    success: true, 
                    user: data.user,
                    error: null 
                };
            } catch (error) {
                return { 
                    success: false, 
                    error: error.message 
                };
            }
        },
        
        // Logout
        async logout() {
            try {
                await client.auth.signOut();
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },
        
        // Verificar sessão
        async getCurrentUser() {
            const { data: { user } } = await client.auth.getUser();
            return { user };
        }
    };
    
    // Inicializar
    setupAdmin();
    
    console.log('✅ Auth pronto');
})();
