// ============================================
// SISTEMA DE AUTENTICAÇÃO - CORRIGIDO
// ============================================

// Aguardar Supabase carregar
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se Supabase está disponível
  if (typeof window.supabase === 'undefined') {
    console.error('❌ Supabase não carregou!');
    showError('Erro ao carregar sistema. Recarregue a página.');
    return;
  }

  // Inicializar cliente Supabase
  const supabaseUrl = window.ENV?.SUPABASE_URL || 'https://cqvkfrojkjicfxipwltz.supabase.co';
  const supabaseKey = window.ENV?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdmtmcm9qa2ppY2Z4aXB3bHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTQzNzksImV4cCI6MjA4Nzk3MDM3OX0.THdrIPT1L9l3WPD3ltuI4oR0ggAn-MUi_FCqPfBobDE';
  
  window.Auth = {
    client: window.supabase.createClient(supabaseUrl, supabaseKey),
    
    // Criar usuário admin
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
            console.log('Admin já existe');
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
        console.error('Erro ao criar admin:', e);
      }
    },

    // Login
    async login(email, password) {
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      const { data: profile } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      return { user: data.user, profile };
    },

    // Logout
    async logout() {
      await this.client.auth.signOut();
      window.location.reload();
    },

    // Verificar sessão
    async getUser() {
      const { data: { user } } = await this.client.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      return { user, profile };
    }
  };

  // Inicializar
  window.Auth.createAdminUser();
});

function showError(msg) {
  const el = document.getElementById('error-message');
  if (el) el.textContent = msg;
}
