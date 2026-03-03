// 
// SISTEMA DE AUTENTICAÇÃO - 4º Ofício de Notas
// Raphael da Costa Souza
// 

(function() {
  'use strict';

  function initAuth() {
    // Verificar se Supabase está disponível
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase não carregou. Tentando novamente em 500ms...');
      setTimeout(initAuth, 500);
      return;
    }

    console.log('✅ Supabase carregado, inicializando auth...');

    const supabaseUrl = window.ENV?.SUPABASE_URL;
    const supabaseKey = window.ENV?.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Configuração do Supabase não encontrada em window.ENV');
      return;
    }

    // Criar cliente Supabase
    const client = window.supabase.createClient(supabaseUrl, supabaseKey);

    // Objeto global Auth
    window.Auth = {
      client: client,
      
      // Criar usuário admin automaticamente
      async createAdminUser() {
        try {
          // Verificar se admin já existe
          const { data: existing, error: checkError } = await this.client
            .from('profiles')
            .select('email')
            .eq('email', 'admin@cartorio4oficio.com')
            .single();

          if (existing) {
            console.log('ℹ️ Usuário admin já existe');
            return;
          }

          // Criar usuário no Auth
          const { data: authData, error: authError } = await this.client.auth.signUp({
            email: 'admin@cartorio4oficio.com',
            password: 'Admin@123456'
          });

          if (authError) {
            console.log('ℹ️ Admin já existe no auth:', authError.message);
            return;
          }

          // Criar perfil do admin
          const { error: profileError } = await this.client
            .from('profiles')
            .insert([{
              id: authData.user.id,
              email: 'admin@cartorio4oficio.com',
              role: 'admin',
              name: 'Raphael Souza',
              accepted: true,
              created_at: new Date().toISOString()
            }]);

          if (profileError) {
            console.error('❌ Erro ao criar perfil:', profileError);
            return;
          }

          console.log('✅ Usuário admin criado com sucesso!');
          console.log('   Email: admin@cartorio4oficio.com');
          console.log('   Senha: Admin@123456');

        } catch (e) {
          console.error('❌ Erro ao criar admin:', e);
        }
      },

      // Login de usuário
      async login(email, password) {
        try {
          const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
          });

          if (error) throw error;

          // Buscar perfil do usuário
          const { data: profile, error: profileError } = await this.client
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.error('Erro ao buscar perfil:', profileError);
          }

          return { 
            user: data.user, 
            profile: profile || null, 
            error: null 
          };

        } catch (error) {
          console.error('❌ Erro no login:', error.message);
          return { user: null, profile: null, error };
        }
      },

      // Logout
      async logout() {
        try {
          await this.client.auth.signOut();
          console.log('✅ Logout realizado');
        } catch (e) {
          console.error('❌ Erro no logout:', e);
        }
      },

      // Verificar usuário atual
      async getCurrentUser() {
        try {
          const { data: { user }, error } = await this.client.auth.getUser();
          
          if (error || !user) {
            return { user: null, profile: null };
          }

          const { data: profile } = await this.client
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          return { user, profile: profile || null };

        } catch (e) {
          console.error('❌ Erro ao verificar usuário:', e);
          return { user: null, profile: null };
        }
      },

      // Verificar se é admin
      isAdmin(profile) {
        return profile?.role === 'admin';
      }
    };

    // Inicializar
    window.Auth.createAdminUser();
    
    // Disparar evento de pronto
    window.dispatchEvent(new CustomEvent('authReady'));
    console.log('✅ Sistema de autenticação pronto');
  }

  // Iniciar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
})();
