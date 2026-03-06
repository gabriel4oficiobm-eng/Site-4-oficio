(function () {
  'use strict';

  const config = window.AppConfig || {};
  const SUPABASE_URL = config.supabaseUrl || 'https://cqvkfrojkjicfxipwltz.supabase.co';
  const SUPABASE_ANON_KEY = config.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdmtmcm9qa2ppY2Z4aXB3bHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTQzNzksImV4cCI6MjA4Nzk3MDM3OX0.THdrIPT1L9l3WPD3ltuI4oR0ggAn-MUi_FCqPfBobDE';
  const SUPABASE_CDN_FALLBACKS = [
    'https://unpkg.com/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
  ];

  function resolveSupabaseGlobal() {
    if (typeof window === 'undefined') return null;
    return window.supabase || window.supabaseJs || null;
  }

  function createAuthApi(client) {
    return {
      client,

      async login(email, password) {
        try {
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (error) throw error;

          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          return { success: true, user: data.user, profile: profile || {}, error: null };
        } catch (err) {
          return { success: false, user: null, profile: null, error: err.message };
        }
      },

      async register({ email, password, name, cpf, role, oab }) {
        try {
          const { data: authData, error: authError } = await client.auth.signUp({ email, password });
          if (authError) throw authError;

          await client.from('profiles').insert([{
            id: authData.user.id,
            name,
            email,
            cpf: cpf || null,
            role,
            oab: oab || null,
            created_at: new Date().toISOString()
          }]);

          return { success: true, user: authData.user, error: null };
        } catch (err) {
          return { success: false, error: err.message };
        }
      },

      async logout() {
        try {
          await client.auth.signOut();
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      },

      async getCurrentUser() {
        try {
          const { data: { user } } = await client.auth.getUser();
          if (!user) return { user: null, profile: null, error: null };

          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          return { user, profile: profile || {}, error: null };
        } catch (err) {
          return { user: null, profile: null, error: err.message };
        }
      },

      isAdmin: (profile) => profile?.role === 'admin',
      isClient: (profile) => profile?.role === 'cliente',
      isLawyer: (profile) => profile?.role === 'advogado'
    };
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (resolveSupabaseGlobal()) {
          resolve();
          return;
        }

        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error(`Falha ao carregar ${src}`)), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
      document.head.appendChild(script);
    });
  }

  async function ensureSupabaseSdk() {
    if (resolveSupabaseGlobal()) return true;

    for (const src of SUPABASE_CDN_FALLBACKS) {
      try {
        await loadScript(src);
        if (resolveSupabaseGlobal()) return true;
      } catch (err) {
        console.warn(`⚠️ ${err.message}`);
      }
    }

    return false;
  }

  function dispatchReadyEvent() {
    document.dispatchEvent(new CustomEvent('authReady'));
  }

  async function initializeAuth() {
    const isSdkReady = await ensureSupabaseSdk();
    if (!isSdkReady) {
      const msg = 'Supabase SDK não carregado';
      console.error(`❌ ${msg}`);
      window.Auth = { error: msg };
      dispatchReadyEvent();
      return;
    }

    const sb = resolveSupabaseGlobal();
    const client = sb.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.Auth = createAuthApi(client);

    console.log('✅ Auth inicializado');
    dispatchReadyEvent();
  }

  initializeAuth();
})();
public/js/config.js
public/js/config.js
