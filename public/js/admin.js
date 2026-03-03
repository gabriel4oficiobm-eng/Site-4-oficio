// ============================================
// FUNCIONALIDADES DO ADMINISTRADOR
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  if (!window.Auth) return;

  window.Admin = {
    isAdmin(profile) {
      return profile?.role === 'admin';
    },

    // Renderizar seção de upload
    renderUploadSection(containerId, profile) {
      const container = document.getElementById(containerId);
      if (!container || !this.isAdmin(profile)) {
        if (container) container.style.display = 'none';
        return;
      }

      container.innerHTML = `
        <div style="background:#f0f9ff;border:2px dashed #3b82f6;border-radius:12px;padding:24px;margin:20px 0;">
          <h3 style="color:#1e40af;margin-bottom:16px;">
            <i class="fas fa-cloud-upload-alt"></i> Área do Administrador
          </h3>
          
          <select id="uploadCategory" style="width:100%;padding:10px;margin-bottom:12px;border-radius:8px;border:1px solid #d1d5db;">
            <option value="escritura">Escritura</option>
            <option value="divorcio">Divórcio</option>
            <option value="procuracao">Procuração</option>
            <option value="usucapiao">Usucapião</option>
          </select>
          
          <input type="file" id="requirementFile" accept=".pdf" style="width:100%;padding:10px;margin-bottom:12px;">
          
          <button onclick="handleUpload()" style="background:#3b82f6;color:white;padding:10px 20px;border:none;border-radius:8px;cursor:pointer;">
            <i class="fas fa-upload"></i> Enviar
          </button>
          
          <div id="uploadStatus" style="margin-top:12px;"></div>
        </div>
      `;
    }
  };

  // Handler global
  window.handleUpload = async function() {
    const file = document.getElementById('requirementFile').files[0];
    const category = document.getElementById('uploadCategory').value;
    const status = document.getElementById('uploadStatus');
    
    if (!file) {
      status.innerHTML = '<span style="color:#ef4444;">Selecione um arquivo</span>';
      return;
    }

    status.innerHTML = '<span style="color:#3b82f6;">Enviando...</span>';
    
    // Upload para Storage
    const fileName = `${category}_${Date.now()}.pdf`;
    const { error: uploadError } = await window.Auth.client.storage
      .from('requirements')
      .upload(fileName, file);

    if (uploadError) {
      status.innerHTML = `<span style="color:#ef4444;">Erro: ${uploadError.message}</span>`;
      return;
    }

    // Salvar no banco
    const { error: dbError } = await window.Auth.client
      .from('requirement_files')
      .insert([{
        name: file.name,
        file_path: fileName,
        category: category,
        file_type: file.type,
        file_size: file.size
      }]);

    if (dbError) {
      status.innerHTML = `<span style="color:#ef4444;">Erro: ${dbError.message}</span>`;
    } else {
      status.innerHTML = '<span style="color:#10b981;">✅ Enviado com sucesso!</span>';
    }
  };
});
