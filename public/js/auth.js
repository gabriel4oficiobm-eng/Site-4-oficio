(function () {
  'use strict';

  // SUPABASE_ANON_KEY é pública por design (segura para o front-end).
  // ⚠️ NUNCA coloque senha, email de admin ou qualquer credencial sensível aqui.
  // O usuário admin deve ser criado UMA VEZ manualmente no painel do Supabase:
  // Authentication → Users → Invite User
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

    // Login com email e senha
    async login(email, password) {
      try {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: profile, error: profileError } = await client
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        return { success: true, user: data.user, profile: profile, error: null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    // Cadastro de novo usuário
    async register(userData) {
      try {
        const { email, password, name, cpf, role, oab } = userData;
        const { data: authData, error: authError } = await client.auth.signUp({ email, password });
        if (authError) throw authError;

        const { error: profileError } = await client.from('profiles').insert([{
          id: authData.user.id,
          name: name,
          email: email,
          cpf: cpf,
          role: role,
          oab: oab || null,
          created_at: new Date().toISOString()
        }]);

        if (profileError) throw profileError;

        return { success: true, user: authData.user, error: null };
      } catch (error) {
        return { success: false, error: error.message };
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

    // Obter usuário logado e seu perfil
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

        if (profileError) throw profileError;

        return { user: user, profile: profile, error: null };
      } catch (error) {
        return { user: null, profile: null, error: error.message };
      }
    },

    isAdmin:  (profile) => profile?.role === 'admin',
    isClient: (profile) => profile?.role === 'cliente',
    isLawyer: (profile) => profile?.role === 'advogado'
  };

  // Avisa o resto da aplicação que o Auth está pronto
  document.dispatchEvent(new CustomEvent('authReady'));

})();
