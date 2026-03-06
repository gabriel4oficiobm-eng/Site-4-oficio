<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - 4º Ofício</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="public/js/config.js"></script>
    <script src="public/js/auth.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f6fa;
            min-height: 100vh;
        }
        
        /* Sidebar */
        .sidebar {
            width: 260px;
            height: 100vh;
            background: #1e3c72;
            position: fixed;
            left: 0;
            top: 0;
            color: white;
            padding: 25px 20px;
            overflow-y: auto;
        }
        
        .sidebar-header {
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255,255,255,0.2);
            margin-bottom: 25px;
        }
        
        .sidebar-header h2 {
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .sidebar-header p {
            font-size: 12px;
            opacity: 0.8;
            margin-top: 5px;
        }
        
        .sidebar nav ul {
            list-style: none;
        }
        
        .sidebar nav ul li {
            margin-bottom: 5px;
        }
        
        .sidebar nav ul li a {
            color: white;
            text-decoration: none;
            padding: 12px 15px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-radius: 8px;
            transition: all 0.3s;
            font-size: 14px;
        }
        
        .sidebar nav ul li a:hover,
        .sidebar nav ul li a.active {
            background: rgba(255,255,255,0.15);
        }
        
        /* Main Content */
        .main-content {
            margin-left: 260px;
            padding: 25px;
        }
        
        .header {
            background: white;
            padding: 20px 25px;
            border-radius: 12px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }
        
        .header h1 {
            color: #1e3c72;
            font-size: 24px;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .user-info span {
            color: #666;
            font-size: 14px;
        }
        
        .logout-btn {
            background: #e74c3c;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        
        .logout-btn:hover {
            background: #c0392b;
        }
        
        /* Cards */
        .cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
        }
        
        .card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            transition: all 0.3s;
        }
        
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .card-icon {
            font-size: 32px;
            margin-bottom: 15px;
        }
        
        .card h3 {
            color: #666;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 10px;
        }
        
        .card .number {
            font-size: 36px;
            font-weight: bold;
            color: #1e3c72;
        }
        
        .card.positive .number {
            color: #27ae60;
        }
        
        .card.warning .number {
            color: #f39c12;
        }
        
        .card.negative .number {
            color: #e74c3c;
        }
        
        /* Sections */
        .section {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            margin-bottom: 20px;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .section h2 {
            color: #1e3c72;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .btn-add {
            background: #1e3c72;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        
        /* Table */
        .table-container {
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        
        th {
            color: #666;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
        }
        
        td {
            font-size: 14px;
        }
        
        .status {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .status.pending {
            background: #fff3cd;
            color: #856404;
        }
        
        .status.completed {
            background: #d4edda;
            color: #155724;
        }
        
        .status.processing {
            background: #cce5ff;
            color: #004085;
        }
        
        /* Loading */
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-size: 18px;
            color: #1e3c72;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .sidebar {
                width: 100%;
                position: relative;
                height: auto;
            }
            
            .main-content {
                margin-left: 0;
            }
        }
    </style>
</head>
<body>
    <!-- Loading State -->
    <div id="loading" class="loading">
        Verificando autenticação...
    </div>

    <!-- Dashboard Content -->
    <div id="dashboard" style="display: none;">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <h2>🔐 Painel Admin</h2>
                <p>4º Ofício de Registro de Imóveis</p>
            </div>
            
            <nav>
                <ul>
                    <li><a href="#" class="active">📊 Dashboard</a></li>
                    <li><a href="#">📋 Protocolos</a></li>
                    <li><a href="#">💬 Atendimento</a></li>
                    <li><a href="#">📈 Relatórios</a></li>
                    <li><a href="#">⚙️ Configurações</a></li>
                </ul>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Header -->
            <div class="header">
                <h1>Bem-vindo, <span id="userName">Admin</span></h1>
                <div class="user-info">
                    <span id="userEmail">admin@cartorio4oficio.com</span>
                    <button class="logout-btn" onclick="logout()">Sair</button>
                </div>
            </div>

            <!-- Cards -->
            <div class="cards">
                <div class="card">
                    <div class="card-icon">📋</div>
                    <h3>Protocolos Hoje</h3>
                    <div class="number">12</div>
                </div>
                <div class="card positive">
                    <div class="card-icon">✅</div>
                    <h3>Concluídos</h3>
                    <div class="number">8</div>
                </div>
                <div class="card warning">
                    <div class="card-icon">⏳</div>
                    <h3>Pendentes</h3>
                    <div class="number">3</div>
                </div>
                <div class="card negative">
                    <div class="card-icon">⚠️</div>
                    <h3>Urgentes</h3>
                    <div class="number">1</div>
                </div>
            </div>

            <!-- Protocolos Section -->
            <div class="section">
                <div class="section-header">
                    <h2>📋 Últimos Protocolos</h2>
                    <button class="btn-add">+ Novo Protocolo</button>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nº Protocolo</th>
                                <th>Tipo</th>
                                <th>Requerente</th>
                                <th>Data</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>#2024-001</td>
                                <td>Registro</td>
                                <td>João Silva</td>
                                <td>05/03/2026</td>
                                <td><span class="status completed">Concluído</span></td>
                            </tr>
                            <tr>
                                <td>#2024-002</td>
                                <td>Averbação</td>
                                <td>Maria Santos</td>
                                <td>05/03/2026</td>
                                <td><span class="status processing">Em Andamento</span></td>
                            </tr>
                            <tr>
                                <td>#2024-003</td>
                                <td>Certidão</td>
                                <td>Pedro Costa</td>
                                <td>04/03/2026</td>
                                <td><span class="status pending">Pendente</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Atendimento Section -->
            <div class="section">
                <div class="section-header">
                    <h2>💬 Atendimentos do Dia</h2>
                    <button class="btn-add">+ Novo Atendimento</button>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Horário</th>
                                <th>Nome</th>
                                <th>Assunto</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>09:00</td>
                                <td>Carlos Oliveira</td>
                                <td>Consulta de Matrícula</td>
                                <td><span class="status completed">Atendido</span></td>
                            </tr>
                            <tr>
                                <td>10:30</td>
                                <td>Ana Paula</td>
                                <td>Retificação</td>
                                <td><span class="status processing">Em Atendimento</span></td>
                            </tr>
                            <tr>
                                <td>14:00</td>
                                <td>Roberto Lima</td>
                                <td>Registro de Imóvel</td>
                                <td><span class="status pending">Aguardando</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <script>
        // Verifica autenticação ao carregar
        document.addEventListener('DOMContentLoaded', async function() {
            const loading = document.getElementById('loading');
            const dashboard = document.getElementById('dashboard');
            
            // Aguarda Auth carregar
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkAuth = setInterval(async () => {
                attempts++;
                
                if (window.Auth && !window.Auth.error) {
                    clearInterval(checkAuth);
                    
                    // Verifica se usuário está logado
                    const { user } = await window.Auth.getCurrentUser();
                    
                    if (!user) {
                        // Não logado, redireciona para login
                        window.location.href = 'login.html';
                        return;
                    }
                    
                    // Logado, mostra dashboard
                    document.getElementById('userName').textContent = user.email.split('@')[0];
                    document.getElementById('userEmail').textContent = user.email;
                    
                    loading.style.display = 'none';
                    dashboard.style.display = 'block';
                    
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkAuth);
                    loading.innerHTML = 'Erro ao carregar. <a href="login.html">Voltar para login</a>';
                }
            }, 100);
        });
        
        // Logout
        async function logout() {
            await window.Auth.logout();
            window.location.href = 'login.html';
        }
    </script>
</body>
</html>
