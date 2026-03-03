// ============================================
// SISTEMA DE AUTENTICAÇÃO
// ============================================

// Inicializar Supabase
const supabase = window.supabase.createClient(
  window.ENV.SUPABASE_URL,
  window.ENV.SUPABASE_ANON_KEY
);

// Criar usuário admin automaticamente
async function createAdminUser() {
  try {
    // Verificar se admin já existe
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@cartorio4oficio.com')
      .single();

    if (!existingUser) {
      // Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'admin@cartorio4oficio.com',
        password: 'Admin@123456'
      });

      if (authError) {
        console.log('Admin já existe ou erro:', authError.message);
        return;
      }

      // Criar perfil admin
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: 'admin@cartorio4oficio.com',
            role: 'admin',
            name: 'Administrador',
            accepted: true
          }
        ]);

      if (profileError) {
        console.error('Erro ao criar perfil admin:', profileError);
      } else {
        console.log('✅ Usuário admin criado com sucesso!');
      }
    }
  } catch (error) {
    console.error('Erro ao criar admin:', error);
  }
}

// Login de usuário
async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return { user: data.user, profile, error: null };
  } catch (error) {
    return { user: null, profile: null, error };
  }
}

// Registrar novo usuário
async function registerUser(email, password, userData) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) throw authError;

    // Criar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email,
          role: userData.role || 'client',
          name: userData.name,
          accepted: false
        }
      ]);

    if (profileError) throw profileError;

    return { user: authData.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

// Verificar sessão atual
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { user, profile };
}

// Logout
async function logoutUser() {
  await supabase.auth.signOut();
  window.location.reload();
}

// Exportar funções
window.Auth = {
  supabase,
  createAdminUser,
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser
};
