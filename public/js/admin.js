(function () {
  'use strict';

  function initAdmin() {
    if (!window.Auth) {
      setTimeout(initAdmin, 500);
      return;
    }

    console.log('✅ Admin inicializado');

    window.Admin = {

      isAdmin(profile) {
        return profile?.role === 'admin';
      },

      renderUploadSection(containerId, profile) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!this.isAdmin(profile)) {
          container.style.display = 'none';
          return;
        }

        container.innerHTML = `
          <div class="admin-upload-area" style="background:#f0f9ff; border:2px dashed #3b82f6;
               border-radius:12px; padding:24px; margin-top:24px;">
            <h3 style="color:#1d4ed8; margin-bottom:16px;">
              <i class="fas fa-cloud-upload-alt"></i>
              Área do Administrador — Upload de Requerimentos
            </h3>

            <div style="margin-bottom:16px;">
              <label style="display:block; margin-bottom:8px; font-weight:500;">
                Categoria do Requerimento:
              </label>
              <select id="uploadCategory"
                style="width:100%; padding:10px; border-radius:8px; border:1px solid #d1d5db;">
                <option value="escritura">Escritura de Compra e Venda</option>
                <option value="divorcio">Divórcio / Dissolução</option>
                <option value="procuracao">Procuração</option>
                <option value="usucapiao">Usucapião</option>
                <option value="inventario">Inventário</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div style="margin-bottom:16px;">
              <label style="display:block; margin-bottom:8px; font-weight:500;">
                Arquivo PDF:
              </label>
              <input type="file" id="requirementFile" accept=".pdf"
                style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px;">
            </div>

            <button onclick="window.handleFileUpload()"
              style="background:#3b82f6; color:white; padding:12px 24px;
                     border:none; border-radius:8px; cursor:pointer; font-weight:500;">
              <i class="fas fa-upload"></i> Enviar Arquivo
            </button>

            <div id="uploadStatus" style="margin-top:16px;"></div>

            <div style="margin-top:24px; border-top:1px solid #dbeafe; padding-top:16px;">
              <h4 style="margin-bottom:12px;">
                <i class="fas fa-list"></i> Arquivos Enviados
              </h4>
              <div id="adminFilesList">
                <p style="color:#6b7280;">Carregando arquivos...</p>
              </div>
            </div>
          </div>
        `;

        this.loadFilesList();
      },

      async loadFilesList() {
        const listDiv = document.getElementById('adminFilesList');
        if (!listDiv) return;

        try {
          const { data, error } = await window.Auth.client
            .from('requirement_files')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (!data || data.length === 0) {
            listDiv.innerHTML = '<p style="color:#6b7280;">Nenhum arquivo enviado ainda.</p>';
            return;
          }

          listDiv.innerHTML = data.map(file => `
            <div style="display:flex; justify-content:space-between; align-items:center;
                 padding:12px; background:white; border-radius:8px;
                 margin-bottom:8px; border:1px solid #e5e7eb;">
              <div>
                <strong>${file.name}</strong><br>
                <small style="color:#6b7280;">
                  ${this.formatCategory(file.category)} •
                  ${this.formatSize(file.file_size)} •
                  ${new Date(file.created_at).toLocaleDateString('pt-BR')}
                </small>
              </div>
              <div style="display:flex; gap:8px;">
                <a href="${this.getFileUrl(file.file_path)}" target="_blank"
                  style="background:#3b82f6; color:white; padding:6px 12px;
                         border-radius:6px; text-decoration:none;">
                  <i class="fas fa-download"></i>
                </a>
                <button onclick="window.deleteRequirementFile('${file.id}','${file.file_path}')"
                  style="background:#ef4444; color:white; border:none;
                         padding:6px 12px; border-radius:6px; cursor:pointer;">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join('');

        } catch (e) {
          listDiv.innerHTML = `<p style="color:#ef4444;">Erro ao carregar: ${e.message}</p>`;
        }
      },

      getFileUrl(filePath) {
        const { data } = window.Auth.client.storage
          .from('requirements')
          .getPublicUrl(filePath);
        return data.publicUrl;
      },

      formatCategory(cat) {
        const map = {
          escritura:  'Escritura',
          divorcio:   'Divórcio',
          procuracao: 'Procuração',
          usucapiao:  'Usucapião',
          inventario: 'Inventário',
          outros:     'Outros'
        };
        return map[cat] || cat;
      },

      formatSize(bytes) {
        if (!bytes) return '0 B';
        const k     = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i     = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      }
    };

    // ── Upload ────────────────────────────────────────────────────────────────
    window.handleFileUpload = async function () {
      const fileInput = document.getElementById('requirementFile');
      const category  = document.getElementById('uploadCategory')?.value;
      const status    = document.getElementById('uploadStatus');
      const file      = fileInput?.files[0];

      if (!file) {
        if (status) status.innerHTML = '<span style="color:#ef4444;">⚠️ Selecione um arquivo PDF!</span>';
        return;
      }

      if (file.type !== 'application/pdf') {
        if (status) status.innerHTML = '<span style="color:#ef4444;">⚠️ Apenas arquivos PDF são permitidos!</span>';
        return;
      }

      if (status) status.innerHTML = '<span style="color:#3b82f6;">⏳ Enviando arquivo...</span>';

      try {
        const fileName = `${category}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

        const { error: uploadError } = await window.Auth.client.storage
          .from('requirements')
          .upload(fileName, file, { contentType: 'application/pdf' });

        if (uploadError) throw uploadError;

        const { data: { user } } = await window.Auth.client.auth.getUser();

        const { error: dbError } = await window.Auth.client
          .from('requirement_files')
          .insert([{
            name:        file.name,
            file_path:   fileName,
            category:    category,
            file_type:   file.type,
            file_size:   file.size,
            uploaded_by: user?.id || null,
            created_at:  new Date().toISOString()
          }]);

        if (dbError) throw dbError;

        if (status) status.innerHTML = '<span style="color:#10b981;">✅ Arquivo enviado com sucesso!</span>';
        if (fileInput) fileInput.value = '';
        window.Admin.loadFilesList();

        if (window.showNotification) window.showNotification('Arquivo enviado com sucesso!', 'success');

      } catch (e) {
        console.error('Erro no upload:', e);
        if (status) status.innerHTML = `<span style="color:#ef4444;">❌ Erro: ${e.message}</span>`;
        if (window.showNotification) window.showNotification('Erro ao enviar: ' + e.message, 'error');
      }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    window.deleteRequirementFile = async function (fileId, filePath) {
      if (!window.confirm('Deseja excluir este arquivo permanentemente?')) return;

      try {
        const { error: storageError } = await window.Auth.client.storage
          .from('requirements')
          .remove([filePath]);

        if (storageError) console.warn('Aviso storage:', storageError.message);

        const { error: dbError } = await window.Auth.client
          .from('requirement_files')
          .delete()
          .eq('id', fileId);

        if (dbError) throw dbError;

        window.Admin.loadFilesList();
        if (window.showNotification) window.showNotification('Arquivo excluído com sucesso!', 'success');

      } catch (e) {
        console.error('Erro ao excluir:', e);
        if (window.showNotification) {
          window.showNotification('Erro ao excluir: ' + e.message, 'error');
        } else {
          alert('Erro ao excluir: ' + e.message);
        }
      }
    };

    // ── AuthReady ─────────────────────────────────────────────────────────────
    document.addEventListener('authReady', async function () {
      const { profile } = await window.Auth.getCurrentUser();
      if (profile) window.Admin.renderUploadSection('adminUploadSection', profile);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
  } else {
    initAdmin();
  }

})();
