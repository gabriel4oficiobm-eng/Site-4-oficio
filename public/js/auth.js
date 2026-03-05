(function() {
    'use strict';
    
    // ============================================
    // CONFIGURAÇÃO SUPABASE
    // ============================================
    
    const SUPABASE_URL = 'https://cqvkfrojkicfxipwltz.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdmtmcm9qa2ppY2Z4aXB3bHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTQzNzksImV4cCI6MjA4Nzk3MDM3OX0.THdrIPT1L9l3WPD3ltuI4oR0ggAn-MUi_FCqPfBobDE';
    
    // ============================================
    // INICIALIZAÇÃO ÚNICA
    // ============================================
    
    if (window.Auth && window.Auth.client) {
        console.log('Auth já inicializado');
        return;
    }
    
    // Criar cliente Supabase
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // ============================================
    // FUNÇÕES AUXILIARES
    // ============================================
    
    async function createAdminUser() {
        const adminEmail = 'admin@cartorio4oficio.com';
        const adminPassword = 'Admin@123456';
        
        try {
            // Tenta fazer login primeiro
            const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
                email: adminEmail,
                password: adminPassword
            });
            
            if (loginError) {
                // Se falhar, tenta criar
                if (loginError.message.includes('Invalid login credentials')) {
                    const { data: signUpData, error: signUpError } = await client.auth.signUp({
                        email: adminEmail,
                        password: adminPassword,
                        options: {
                            data: {
                                role: 'admin',
                                name: 'Administrador'
                            }
                        }
                    });
                    
                    if (signUpError) {
                        console.error('Erro ao criar admin:', signUpError.message);
                    } else {
                        console.log('✅ Usuário admin criado:', adminEmail);
                        // Faz logout após criar
                        await client.auth.signOut();
                    }
                }
            } else {
                console.log('✅ Admin já existe');
                await client.auth.signOut();
            }
        } catch (err) {
            console.error('Erro ao verificar/criar admin:', err);
        }
    }
    
    // ============================================
    // API PÚBLICA
    // ============================================
    
    window.Auth = {
        client: client,
        supabase: client, // alias para compatibilidade
        
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
                    session: data.session,
                    error: null 
                };
            } catch (error) {
                console.error('Login error:', error.message);
                return { 
                    success: false, 
                    user: null,
                    session: null,
                    error: error.message 
                };
            }
        },
        
        // Logout
        async logout() {
            try {
                const { error } = await client.auth.signOut();
                if (error) throw error;
                
                // Limpa storage
                localStorage.removeItem('supabase.auth.token');
                
                return { success: true, error: null };
            } catch (error) {
                console.error('Logout error:', error.message);
                return { success: false, error: error.message };
            }
        },
        
        // Verificar sessão atual
        async getCurrentUser() {
            try {
                const { data: { session }, error: sessionError } = await client.auth.getSession();
                
                if (sessionError) throw sessionError;
                
                if (!session) {
                    return { user: null, session: null, error: null };
                }
                
                const { data: { user }, error: userError } = await client.auth.getUser();
                
                if (userError) throw userError;
                
                return { 
                    user: user, 
                    session: session,
                    error: null 
                };
            } catch (error) {
                console.error('Get user error:', error.message);
                return { user: null, session: null, error: error.message };
            }
        },
        
        // Verificar se é admin
        isAdmin(user) {
            return user?.user_metadata?.role === 'admin' || 
                   user?.app_metadata?.role === 'admin';
        }
    };
    
    // ============================================
    // INICIALIZAÇÃO AUTOMÁTICA
    // ============================================
    
    // Cria admin se não existir
    createAdminUser();
    
    // Dispara evento de prontidão
    window.dispatchEvent(new CustomEvent('authReady', { 
        detail: { auth: window.Auth } 
    }));
    
    console.log('✅ Auth inicializado');
})();
