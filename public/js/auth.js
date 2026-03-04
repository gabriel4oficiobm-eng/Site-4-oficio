// 
// SISTEMA DE AUTENTICAÇÃO - 4º Ofício de Notas
// 

(function() {
  'use strict';

  // Variáveis globais
  let supabase = null;
  let isInitialized = false;

  // Inicialização
  function init() {
    console.log('🚀 Inicializando Auth...');

    // Verificar se Supabase está disponível
    if (typeof window.supabase === 'undefined') {
      console.log('⏳ Aguardando Supabase...');
      setTimeout(init, 100);
      return;
    }

    // Verificar config
    if (!window.ENV || !window.ENV.SUPABASE_URL) {
      console.error('❌ Configuração não encontrada');
      showError('Erro ao carregar sistema');
      return;
    }

    try {
      // Criar cliente
      supabase = window.supabase.createClient(
        window.ENV.SUPABASE_URL,
        window.ENV.SUPABASE_ANON_KEY
      );

      console.log('✅ Supabase conectado');
      
      // Tornar disponível globalmente
      window.Auth = createAuthAPI();
      
      // Criar admin
      window.Auth.createAdminUser();
      
      // Disparar evento
      isInitialized = true;
      window.dispatchEvent(new CustomEvent('authReady'));
      console.log('✅ Auth pronto');

    } catch (error) {
      console.error('❌ Erro ao inicializar:', error);
      showError('Erro ao conectar com servidor');
    }
  }

  // Mostrar erro na interface
  function showError(message) {
    const errorDiv = document.getElementById('systemError');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  // Criar API de autenticação
  function createAuthAPI() {
    return {
      client: supabase,

      // Criar usuário admin
      async createAdminUser() {
        try {
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'admin')
            .limit(1);

          if (existing && existing.length > 0) {
            console.log('ℹ️ Admin já existe');
            return;
          }

          console.log('🔄 Criando admin...');

          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: 'admin@cartorio4oficio.com',
            password: 'Admin@123456'
          });

          if (authError && !authError.message.includes('already registered')) {
            console.error('Erro auth:', authError);
            return;
          }

          const userId = authData?.user?.id;
          if (!userId) {
            // Tentar login para pegar ID
            const { data: loginData } = await supabase.auth.signInWithPassword({
              email: 'admin@cartorio4oficio.com',
              password: 'Admin@123456'
            });
            
            if (loginData?.user) {
              await this.upsertAdminProfile(loginData.user.id);
              await supabase.auth.signOut();
            }
            return;
          }

          await this.upsertAdminProfile(userId);
          console.log('✅ Admin criado');

        } catch (e) {
          console.error('❌ Erro:', e);
        }
      },

      // Criar/atualizar perfil admin
      async upsertAdminProfile(userId) {
        await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: 'admin@cartorio4oficio.com',
            role: 'admin',
            name: 'Raphael Souza',
            accepted: true,
            created_at: new Date().toISOString()
          });
      },

      // Login
      async login(email, password) {
        try {
          console.log('🔐 Login:', email);

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) throw error;

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile && !profile.accepted) {
            await supabase.auth.signOut();
            return { error: { message: 'Cadastro aguardando aprovação.' } };
          }

          console.log('✅ Login OK');
          return { user: data.user, profile, error: null };

        } catch (error) {
          console.error('❌ Login erro:', error);
          return { error: { message: 'Email ou senha incorretos.' } };
        }
      },

      // Logout
      async logout() {
        await supabase.auth.signOut();
      },

      // Verificar sessão
      async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { user: null, profile: null };

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        return { user, profile };
      },

      // Registrar
      async register(email, password, userData) {
        try {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
          });

          if (authError) throw authError;

          await supabase
            .from('profiles')
            .insert([{
              id: authData.user.id,
              email,
              role: userData.role || 'client',
              name: userData.name,
              accepted: false,
              created_at: new Date().toISOString()
            }]);

          return { error: null, message: 'Cadastro realizado! Aguarde aprovação.' };

        } catch (error) {
          return { error };
        }
      },

      // Login com Google
      async loginWithGoogle() {
        return await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin }
        });
      },

      isAdmin: (profile) => profile?.role === 'admin'
    };
  }

  // Iniciar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
