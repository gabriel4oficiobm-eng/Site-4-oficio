 HEAD
// ============================================
// FUNCIONALIDADES DO ADMINISTRADOR
// ============================================

const supabase = window.Auth.supabase;

// Verificar se usuário é admin
function isAdmin(profile) {
  return profile && profile.role === 'admin';
}

// Upload de arquivo para requerimentos
async function uploadRequirementFile(file, category) {
  try {
    if (!file) throw new Error('Nenhum arquivo selecionado');

    const fileExt = file.name.split('.').pop();
    const fileName = `${category}_${Date.now()}.${fileExt}`;
    const filePath = `requirements/${category}/${fileName}`;

    // Upload para Storage
    const { error: uploadError } = await supabase.storage
      .from('requirements')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Salvar metadados no banco
    const { data: fileData, error: dbError } = await supabase
      .from('requirement_files')
      .insert([
        {
          name: file.name,
          file_path: filePath,
          category: category,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: (await supabase.auth.getUser()).data.user.id
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    return { data: fileData, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Listar arquivos de requerimentos
async function listRequirementFiles(category = null) {
  try {
    let query = supabase
      .from('requirement_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Deletar arquivo
async function deleteRequirementFile(fileId, filePath) {
  try {
    // Deletar do Storage
    const { error: storageError } = await supabase.storage
      .from('requirements')
      .remove([filePath]);

    if (storageError) throw storageError;

    // Deletar do banco
    const { error: dbError } = await supabase
      .from('requirement_files')
      .delete()
      .eq('id', fileId);

    if (dbError) throw dbError;

    return { error: null };
  } catch (error) {
    return { error };
  }
}

// Obter URL pública do arquivo
async function getFileUrl(filePath) {
  const { data } = supabase.storage
    .from('requirements')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

// Renderizar seção de upload (apenas para admin)
function renderAdminUploadSection(containerId, profile) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!isAdmin(profile)) {
    container.style.display = 'none';
    return;
  }

  container.innerHTML = `
    <div class="admin-upload-section" style="
      background: #f8fafc;
      border: 2px dashed #3b82f6;
      border-radius: 12px;
      padding: 24px;
      margin: 20px 0;
    ">
      <h3 style="color: #1e40af; margin-bottom: 16px;">
        <i class="fas fa-cloud-upload-alt"></i> 
        Área do Administrador - Gerenciar Requerimentos
      </h3>
      
      <div class="upload-form" style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">
          Categoria:
        </label>
        <select id="uploadCategory" style="
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          margin-bottom: 16px;
        ">
          <option value="escritura">Escritura</option>
          <option value="divorcio">Divórcio</option>
          <option value="procuracao">Procuração</option>
          <option value="usucapiao">Usucapião</option>
          <option value="inventario">Inventário</option>
          <option value="outros">Outros</option>
        </select>

        <label style="display: block; margin-bottom: 8px; font-weight: 500;">
          Selecionar Arquivo:
        </label>
        <input type="file" id="requirementFile" accept=".pdf,.doc,.docx" style="
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          margin-bottom: 16px;
        ">

        <button onclick="handleFileUpload()" style="
          background: #3b82f6;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        ">
          <i class="fas fa-upload"></i> Enviar Arquivo
        </button>
      </div>

      <div id="uploadStatus" style="margin-top: 16px;"></div>

      <div class="files-list" style="margin-top: 24px;">
        <h4 style="margin-bottom: 12px;">Arquivos Enviados:</h4>
        <div id="adminFilesList">Carregando...</div>
      </div>
    </div>
  `;

  // Carregar lista de arquivos
  loadAdminFilesList();
}

// Handler de upload
async function handleFileUpload() {
  const fileInput = document.getElementById('requirementFile');
  const categorySelect = document.getElementById('uploadCategory');
  const statusDiv = document.getElementById('uploadStatus');

  const file = fileInput.files[0];
  const category = categorySelect.value;

  if (!file) {
    statusDiv.innerHTML = '<span style="color: #ef4444;">Selecione um arquivo!</span>';
    return;
  }

  statusDiv.innerHTML = '<span style="color: #3b82f6;">Enviando...</span>';

  const { data, error } = await uploadRequirementFile(file, category);

  if (error) {
    statusDiv.innerHTML = `<span style="color: #ef4444;">Erro: ${error.message}</span>`;
  } else {
    statusDiv.innerHTML = '<span style="color: #10b981;">✅ Arquivo enviado com sucesso!</span>';
    fileInput.value = '';
    loadAdminFilesList();
  }
}

// Carregar lista de arquivos para admin
async function loadAdminFilesList() {
  const listDiv = document.getElementById('adminFilesList');
  if (!listDiv) return;

  const { data, error } = await listRequirementFiles();

  if (error) {
    listDiv.innerHTML = `<span style="color: #ef4444;">Erro ao carregar: ${error.message}</span>`;
    return;
  }

  if (!data || data.length === 0) {
    listDiv.innerHTML = '<p style="color: #6b7280;">Nenhum arquivo enviado ainda.</p>';
    return;
  }

  listDiv.innerHTML = data.map(file => `
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: white;
      border-radius: 8px;
      margin-bottom: 8px;
      border: 1px solid #e5e7eb;
    ">
      <div>
        <strong>${file.name}</strong>
        <br>
        <small style="color: #6b7280;">
          ${file.category} • ${formatFileSize(file.file_size)} • ${formatDate(file.created_at)}
        </small>
      </div>
      <div>
        <a href="${getFileUrl(file.file_path)}" target="_blank" style="
          color: #3b82f6;
          text-decoration: none;
          margin-right: 12px;
        ">
          <i class="fas fa-download"></i> Download
        </a>
        <button onclick="deleteFile('${file.id}', '${file.file_path}')" style="
          background: #ef4444;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        ">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// Deletar arquivo
async function deleteFile(fileId, filePath) {
  if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;

  const { error } = await deleteRequirementFile(fileId, filePath);

  if (error) {
    alert('Erro ao excluir: ' + error.message);
  } else {
    loadAdminFilesList();
  }
}

// Utilitários
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

// Exportar
window.Admin = {
  isAdmin,
  uploadRequirementFile,
  listRequirementFiles,
  deleteRequirementFile,
  getFileUrl,
  renderAdminUploadSection,
  handleFileUpload,
  deleteFile
};

// 
// FUNCIONALIDADES DO ADMINISTRADOR - 4º Ofício de Notas
// Upload e gerenciamento de arquivos de requerimentos
// 

(function() {
  'use strict';

  function initAdmin() {
    if (!window.Auth) {
      console.error('❌ Auth não disponível. Aguardando...');
      setTimeout(initAdmin, 500);
      return;
    }

    console.log('✅ Inicializando área de admin...');

    window.Admin = {
      // Verificar se usuário é admin
      isAdmin(profile) {
        return profile?.role === 'admin';
      },

      // Renderizar seção de upload
      renderUploadSection(containerId, profile) {
        const container = document.getElementById(containerId);
        if (!container) {
          console.log('ℹ️ Container adminUploadSection não encontrado');
          return;
        }

        // Só mostrar para admins
        if (!this.isAdmin(profile)) {
          console.log('ℹ️ Usuário não é admin, ocultando upload');
          container.style.display = 'none';
          return;
        }

        console.log('✅ Renderizando área de upload para admin');

        container.innerHTML = `
          <div class="admin-upload-area">
            <h3>
              <i class="fas fa-cloud-upload-alt"></i> 
              Área do Administrador - Upload de Requerimentos
            </h3>
            
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 500;">Categoria do Requerimento:</label>
              <select id="uploadCategory" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #d1d5db;">
                <option value="escritura">Escritura de Compra e Venda</option>
                <option value="divorcio">Divórcio / Dissolução</option>
                <option value="procuracao">Procuração</option>
                <option value="usucapiao">Usucapião</option>
                <option value="inventario">Inventário</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 500;">Arquivo PDF:</label>
              <input type="file" id="requirementFile" accept=".pdf" 
                style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;">
            </div>
            
            <button onclick="window.handleFileUpload()" 
              style="background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
              <i class="fas fa-upload"></i> Enviar Arquivo
            </button>
            
            <div id="uploadStatus" style="margin-top: 16px;"></div>
            
            <div style="margin-top: 24px; border-top: 1px solid #dbeafe; padding-top: 16px;">
              <h4 style="margin-bottom: 12px;">
                <i class="fas fa-list"></i> Arquivos Enviados
              </h4>
              <div id="adminFilesList">
                <p style="color: #6b7280;">Carregando arquivos...</p>
              </div>
            </div>
          </div>
        `;

        // Carregar lista de arquivos
        this.loadFilesList();
      },

      // Carregar lista de arquivos do admin
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
            listDiv.innerHTML = '<p style="color: #6b7280;">Nenhum arquivo enviado ainda.</p>';
            return;
          }

          listDiv.innerHTML = data.map(file => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e5e7eb;">
              <div>
                <strong>${file.name}</strong><br>
                <small style="color: #6b7280;">
                  ${this.formatCategory(file.category)} • 
                  ${this.formatSize(file.file_size)} • 
                  ${new Date(file.created_at).toLocaleDateString('pt-BR')}
                </small>
              </div>
              <div style="display: flex; gap: 8px;">
                <a href="${this.getFileUrl(file.file_path)}" target="_blank" 
                  style="background: #3b82f6; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none;">
                  <i class="fas fa-download"></i>
                </a>
                <button onclick="window.deleteRequirementFile('${file.id}', '${file.file_path}')" 
                  style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join('');

        } catch (e) {
          listDiv.innerHTML = `<p style="color: #ef4444;">Erro ao carregar: ${e.message}</p>`;
        }
      },

      // Formatar categoria
      formatCategory(cat) {
        const categories = {
          'escritura': 'Escritura',
          'divorcio': 'Divórcio',
          'procuracao': 'Procuração',
          'usucapiao': 'Usucapião',
          'inventario': 'Inventário',
          'outros': 'Outros'
        };
        return categories[cat] || cat;
      },

      // Gerar URL pública do arquivo
      getFileUrl(filePath) {
        const { data } = window.Auth.client.storage
          .from('requirements')
          .getPublicUrl(filePath);
        return data.publicUrl;
      },

      // Formatar tamanho do arquivo
      formatSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      }
    };

    // Handler global para upload
    window.handleFileUpload = async function() {
      const fileInput = document.getElementById('requirementFile');
      const category = document.getElementById('uploadCategory').value;
      const status = document.getElementById('uploadStatus');

      const file = fileInput.files[0];
      if (!file) {
        status.innerHTML = '<span style="color: #ef4444;">⚠️ Selecione um arquivo PDF!</span>';
        return;
      }

      if (file.type !== 'application/pdf') {
        status.innerHTML = '<span style="color: #ef4444;">⚠️ Apenas arquivos PDF são permitidos!</span>';
        return;
      }

      status.innerHTML = '<span style="color: #3b82f6;">⏳ Enviando arquivo...</span>';

      try {
        // Gerar nome único
        const fileName = `${category}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        
        // Upload para Storage
        const { error: uploadError } = await window.Auth.client.storage
          .from('requirements')
          .upload(fileName, file, {
            contentType: 'application/pdf'
          });

        if (uploadError) throw uploadError;

        // Salvar metadados no banco
        const { data: { user } } = await window.Auth.client.auth.getUser();
        
        const { error: dbError } = await window.Auth.client
          .from('requirement_files')
          .insert([{
            name: file.name,
            file_path: fileName,
            category: category,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: user?.id || null,
            created_at: new Date().toISOString()
          }]);

        if (dbError) throw dbError;

        status.innerHTML = '<span style="color: #10b981;">✅ Arquivo enviado com sucesso!</span>';
        fileInput.value = '';
        
        // Recarregar lista
        window.Admin.loadFilesList();

        // Notificar sucesso
        if (window.showNotification) {
          window.showNotification('Arquivo enviado com sucesso!', 'success');
        }

      } catch (e) {
        console.error('Erro no upload:', e);
        status.innerHTML = `<span style="color: #ef4444;">❌ Erro: ${e.message}</span>`;
      }
    };

    // Handler para deletar arquivo
    window.deleteRequirementFile = async function(fileId, filePath) {
      if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;

      try {
        // Deletar do Storage
        const { error: storageError } = await window.Auth.client.storage
          .from('requirements')
          .remove([filePath]);

        if (storageError) console.warn('Aviso ao remover do storage:', storageError);

        // Deletar do banco
        const { error: dbError } = await window.Auth.client
          .from('requirement_files')
          .delete()
          .eq('id', fileId);

        if (dbError) throw dbError;

        // Recarregar lista
        window.Admin.loadFilesList();
        
        if (window.showNotification) {
          window.showNotification('Arquivo excluído!', 'success');
        }

      } catch (e) {
        alert('Erro ao excluir: ' + e.message);
      }
    };

    // Inicializar quando auth estiver pronto
    window.addEventListener('authReady', async function() {
      const { profile } = await window.Auth.getCurrentUser();
      window.Admin.renderUploadSection('adminUploadSection', profile);
    });

    console.log('✅ Sistema de admin inicializado');
  }

  // Iniciar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
  } else {
    initAdmin();
  }
})();
>>>>>>> f46cf306dcfb5604e704eaf4ae811391ffdf18ec
