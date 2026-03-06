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
