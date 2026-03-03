// 
// SISTEMA DE AUTENTICAÇÃO
// 

(function() {
  'use strict';

  function initAuth() {
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase não carregou. Tentando novamente...');
      setTimeout(initAuth, 500);
      return;
    }

    console.log('✅ Supabase carregado');

    const supabaseUrl = window.ENV?.SUPABASE_URL;
    const supabaseKey = window.ENV?.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Configuração do Supabase não encontrada');
      return;
    }

    const client = window.supabase.createClient(supabaseUrl, supabaseKey);

    window.Auth = {
      client: client,
      
      async createAdminUser() {
        try {
          const { data: existing } = await this.client
            .from('profiles')
            .select('email')
            .eq('email', 'admin@cartorio4oficio.com')
            .single();

          if (!existing) {
            const { data: authData, error: authError } = await this.client.auth.signUp({
              email: 'admin@cartorio4oficio.com',
              password: 'Admin@123456'
            });

            if (authError) {
              console.log('ℹ️ Admin já existe');
              return;
            }

            await this.client.from('profiles').insert([{
              id: authData.user.id,
              email: 'admin@cartorio4oficio.com',
              role: 'admin',
              name: 'Administrador',
              accepted: true
            }]);

            console.log('✅ Admin criado');
          }
        } catch (e) {
          console.error('❌ Erro ao criar admin:', e);
        }
      },

      async login(email, password) {
        try {
          const { data, error } = await this.client.auth.signInWithPassword({ email, password });
          if (error) throw error;

          const { data: profile } = await this.client
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          return { user: data.user, profile, error: null };
        } catch (error) {
          return { user: null, profile: null, error };
        }
      },

      async logout() {
        await this.client.auth.signOut();
        window.location.reload();
      },

      async getCurrentUser() {
        const { data: { user } } = await this.client.auth.getUser();
        if (!user) return { user: null, profile: null };

        const { data: profile } = await this.client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        return { user, profile };
      }
    };

    window.Auth.createAdminUser();
    window.dispatchEvent(new CustomEvent('authReady'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
})();
