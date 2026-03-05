// public/js/auth.js

(function() {
    'use strict';

    // 
    // CONFIGURAÇÃO SUPABASE
    // 
    const SUPABASE_URL = 'https://cqvkfrojkjicfxipwltz.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdmtmcm9qa2ppY2Z4aXB3bHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTQzNzksImV4cCI6MjA4Nzk3MDM3OX0.THdrIPT1L9l3WPD3ltuI4oR0ggAn-MUi_FCqPfBobDE';
    
    // Credenciais do Admin padrão
    const ADMIN_EMAIL = 'admin@cartorio4oficio.com';
    const ADMIN_PASSWORD = 'Admin@123456';
    const ADMIN_NAME = 'Raphael da Costa Souza'; // Seu nome completo

    // 
    // INICIALIZAÇÃO DO CLIENTE SUPABASE
    // 
    if (window.Auth && window.Auth.client) {
        console.log('Auth já inicializado. Pulando.');
        return;
    }

    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase SDK não carregado. Verifique o script no HTML.');
        window.Auth = { error: 'Supabase SDK não carregado' };
        return;
    }

    let client;
    try {
        client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {<br/>
                autoRefreshToken: true,<br/>
                persistSession: true,<br/>
                detectSessionInUrl: true
            }
        });
        console.log('✅ Cliente Supabase criado.');
    } catch (err) {
        console.error('❌ Erro ao inicializar cliente Supabase:', err);<br/>
        window.Auth = { error: 'Erro ao inicializar Supabase' };
        return;
    }

    // 
    // FUNÇÕES AUXILIARES (Criação de Admin e Perfil)
    // 

    // Garante que a tabela 'profiles' existe e cria o admin
    async function setupAdminAndProfile() {
        try {
            // 1. Tenta fazer login com o admin padrão
            const { data: loginData, error: loginError } = await client.auth.signInWithPassword({<br/>
                email: ADMIN_EMAIL,<br/>
                password: ADMIN_PASSWORD
            });

            let userId = loginData?.user?.id;

            if (loginError && loginError.message.includes('Invalid login credentials')) {
                // 2. Se o login falhou (usuário não existe ou senha errada), tenta criar o usuário
                console.log('ℹ️ Admin não encontrado ou senha incorreta. Tentando criar/redefinir.');
                const { data: signUpData, error: signUpError } = await client.auth.signUp({<br/>
                    email: ADMIN_EMAIL,<br/>
                    password: ADMIN_PASSWORD
                });

                if (signUpError) {
                    // Se o erro for que o usuário já existe, tentamos fazer login novamente para pegar o ID
                    if (signUpError.message.includes('already registered')) {
                        console.log('ℹ️ Admin já registrado. Tentando login para obter ID.');
                        const { data: retryLoginData, error: retryLoginError } = await client.auth.signInWithPassword({<br/>
                            email: ADMIN_EMAIL,<br/>
                            password: ADMIN_PASSWORD
                        });
                        if (retryLoginError) throw retryLoginError;
                        userId = retryLoginData.user.id;
                    } else {
                        throw signUpError;
                    }
                } else {
                    userId = signUpData.user.id;
                }
            } else if (loginError) {
                throw loginError; // Outros erros de login
            }

            // 3. Se temos um userId, criamos/atualizamos o perfil na tabela 'profiles'
            if (userId) {
                await client
                    .from('profiles')
                    .upsert({
                        id: userId,<br/>
                        email: ADMIN_EMAIL,<br/>
                        role: 'admin',<br/>
                        name: ADMIN_NAME,<br/>
                        accepted: true,<br/>
                        created_at: new Date().toISOString()<br/>
                    }, { onConflict: 'id' }); // Atualiza se já existir
                console.log('✅ Perfil admin garantido na tabela profiles.');
            }

            // 4. Garante que o admin não fica logado após a configuração
            await client.auth.signOut();
            console.log('✅ Admin configurado e deslogado.');

        } catch (err) {
            console.error('❌ Erro ao configurar admin e perfil:', err.message);
        }
    }

    // 
    // API PÚBLICA (window.Auth)
    // 
    window.Auth = {
        client: client,

        async login(email, password) {
            try {
                const { data, error } = await client.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                // Opcional: buscar perfil para verificar 'accepted' ou outras regras<br/>
                const { data: profile, error: profileError } = await client
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = linha não encontrada
                    console.warn('Perfil não encontrado para o usuário:', data.user.id, profileError);
                    // Se não tem perfil, mas logou, pode ser um usuário novo sem perfil ainda
                }

                if (profile && profile.role !== 'admin') {
                    await client.auth.signOut();
                    return { success: false, error: 'Acesso restrito a administradores.' };
                }

                return {
                    success: true,<br/>
                    user: data.user,<br/>
                    profile: profile,<br/>
                    error: null
                };
            } catch (error) {
                console.error('❌ Erro no login:', error.message);<br/>
                return { success: false, error: error.message || 'Erro desconhecido no login.' };
            }
        },

        async logout() {
            try {
                const { error } = await client.auth.signOut();
                if (error) throw error;
                return { success: true, error: null };
            } catch (error) {
                console.error('❌ Erro no logout:', error.message);<br/>
                return { success: false, error: error.message || 'Erro desconhecido no logout.' };
            }
        },

        async getCurrentUser() {
            try {
                const { data: { user }, error: userError } = await client.auth.getUser();
                if (userError) throw userError;

                if (!user) return { user: null, profile: null, error: null };

                const { data: profile, error: profileError } = await client
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') {
                    console.warn('Perfil não encontrado para o usuário:', user.id, profileError);
                }

                return { user, profile: profile || null, error: null };
            } catch (error) {
                console.error('❌ Erro ao obter usuário atual:', error.message);<br/>
                return { user: null, profile: null, error: error.message || 'Erro desconhecido.' };
            }
        },

        isAdmin(profile) {
            return profile && profile.role === 'admin';
        }
    };

    // 
    // INICIALIZAÇÃO AUTOMÁTICA
    // 
    // Garante que o admin padrão e seu perfil são criados/atualizados
    setupAdminAndProfile();

    // Dispara evento 'authReady' quando o script é carregado e o Auth está pronto
    window.dispatchEvent(new CustomEvent('authReady', {
        detail: { auth: window.Auth }
    }));
    console.log('✅ Sistema de Autenticação (Auth) inicializado e pronto.');
})();
