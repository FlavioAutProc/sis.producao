// Sistema de Controle de Pesagem e Remanejamento de Produção - CORRIGIDO

class SistemaProducao {
    constructor() {
        this.produtos = produtosIniciais;
        this.registros = JSON.parse(localStorage.getItem('producao_registros')) || [];
        this.produtoSelecionado = null;
        this.produtosChart = null;
        this.topProductsChart = null;
        this.typeDistributionChart = null;
        this.dailyEvolutionChart = null;
        this.productionLossChart = null;
        this.topProductsTodayChart = null;
        
        // Produtos especiais para remanejamento
        this.produtosEspeciais = {
            'farinha': { codigo: 6613, nome: 'FARINHA DE ROSCA' },
            'torrada': { codigo: 6781, nome: 'TORRADA SIMPLES' }
        };
        
        // Controle de edição
        this.editandoRegistroId = null;
        this.editandoRemanejamentoId = null;
        
        this.inicializar();
    }
    
    inicializar() {
        // Inicializar data e hora
        this.atualizarDataHora();
        setInterval(() => this.atualizarDataHora(), 1000);
        
        // Configurar eventos
        this.configurarEventos();
        
        // Configurar datas nos filtros
        this.configurarFiltros();
        
        // Atualizar dashboard
        this.atualizarDashboard();
        
        // Inicializar cálculos
        this.calcularPesoLiquido();
        this.calcularRemanejamento();
    }
    
    atualizarDataHora() {
        const now = new Date();
        document.getElementById('current-date').textContent = 
            moment(now).locale('pt-br').format('dddd, D [de] MMMM [de] YYYY');
        document.getElementById('current-time').textContent = 
            moment(now).locale('pt-br').format('HH:mm:ss');
    }
    
    configurarEventos() {
        // Navegação entre abas
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.getAttribute('data-tab');
                this.mostrarAba(tab);
            });
        });
        
        // Tipo de pesagem
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-type');
                this.mostrarTipoPesagem(type);
            });
        });
        
        // Pesagem - Busca de produto
        document.getElementById('product-search').addEventListener('input', (e) => {
            this.buscarProduto(e.target.value, 'search-results');
        });
        
        // Pesagem - Campos de cálculo
        document.getElementById('tara').addEventListener('input', () => this.calcularPesoLiquido());
        document.getElementById('bruto').addEventListener('input', () => this.calcularPesoLiquido());
        document.getElementById('valor-kg').addEventListener('input', () => this.calcularPesoLiquido());
        
        // Pesagem - Limpar formulário
        document.getElementById('clear-form').addEventListener('click', () => {
            this.limparFormularioPesagem();
        });
        
        // Pesagem - Registrar
        document.getElementById('submit-weighing').addEventListener('click', () => {
            this.registrarPesagemNormal();
        });
        
        // Botão Salvar Edição
        document.getElementById('save-edit').addEventListener('click', () => {
            this.salvarEdicao();
        });
        
        // Botão Cancelar Edição
        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.cancelarEdicao();
        });
        
        // Remanejamento - Busca de produto
        document.getElementById('remanejamento-search').addEventListener('input', (e) => {
            this.buscarProduto(e.target.value, 'remanejamento-results');
        });
        
        // Remanejamento - Passos
        document.querySelectorAll('.btn-next-step').forEach(btn => {
            btn.addEventListener('click', () => {
                const nextStep = btn.getAttribute('data-next');
                this.proximoPasso(nextStep);
            });
        });
        
        document.querySelectorAll('.btn-prev-step').forEach(btn => {
            btn.addEventListener('click', () => {
                const prevStep = btn.getAttribute('data-prev');
                this.voltarPasso(prevStep);
            });
        });
        
        // Remanejamento - Selecionar tipo
        document.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selecionarTipoRemanejamento(card);
            });
        });
        
        // Remanejamento - Campos de cálculo
        document.getElementById('peso-inicial').addEventListener('input', () => this.calcularRemanejamento());
        document.getElementById('peso-final').addEventListener('input', () => this.calcularRemanejamento());
        document.getElementById('valor-origem').addEventListener('input', () => this.calcularRemanejamento());
        document.getElementById('valor-destino').addEventListener('input', () => this.calcularRemanejamento());
        
        // Remanejamento - Registrar
        document.getElementById('submit-remanejamento').addEventListener('click', () => {
            this.registrarRemanejamento();
        });
        
        // Registros - Filtros
        document.getElementById('filter-apply').addEventListener('click', () => {
            this.aplicarFiltros();
        });
        
        document.getElementById('filter-reset').addEventListener('click', () => {
            this.resetarFiltros();
        });
        
        document.getElementById('filter-date').addEventListener('change', () => {
            this.aplicarFiltros();
        });
        
        document.getElementById('filter-type').addEventListener('change', () => {
            this.aplicarFiltros();
        });
        
        // Filtros avançados para relatórios
        document.getElementById('filter-product-name').addEventListener('input', () => {
            this.aplicarFiltrosAvancados();
        });
        
        document.getElementById('filter-product-code').addEventListener('input', () => {
            this.aplicarFiltrosAvancados();
        });
        
        document.getElementById('filter-tipo-detalhado').addEventListener('change', () => {
            this.aplicarFiltrosAvancados();
        });
        
        // CORREÇÃO: Configurar o evento do botão Gerar Relatório
        document.getElementById('apply-advanced-filters').addEventListener('click', () => {
            this.aplicarFiltrosAvancados();
        });
        
        document.getElementById('reset-advanced-filters').addEventListener('click', () => {
            this.resetarFiltrosAvancados();
        });
        
        // CORREÇÃO: Configurar o evento do botão Exportar PDF
        document.getElementById('generate-pdf').addEventListener('click', () => {
            this.gerarPDF();
        });
        
        // Registros - Limpar todos
        document.getElementById('clear-records').addEventListener('click', () => {
            this.confirmarLimparRegistros();
        });
        
        // Relatórios - Gerar
        // CORREÇÃO: Configurar o evento do botão Gerar Relatório
        document.getElementById('generate-report').addEventListener('click', () => {
            this.gerarRelatorio();
        });
        
        // Dashboard - Atualizar
        document.getElementById('refresh-dashboard').addEventListener('click', () => {
            this.atualizarDashboard();
        });
        
        // Modal - Cancelar
        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.fecharModal();
        });
    }
    
    configurarFiltros() {
        const hoje = moment().format('YYYY-MM-DD');
        document.getElementById('filter-date').value = hoje;
        document.getElementById('report-start').value = moment().subtract(7, 'days').format('YYYY-MM-DD');
        document.getElementById('report-end').value = hoje;
        
        // Configurar filtros avançados
        document.getElementById('advanced-start').value = moment().subtract(7, 'days').format('YYYY-MM-DD');
        document.getElementById('advanced-end').value = hoje;
    }
    
    mostrarAba(abaId) {
        // Atualizar botões ativos
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.toggle('active', button.getAttribute('data-tab') === abaId);
        });
        
        // Mostrar conteúdo da aba
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === abaId);
        });
        
        // Ações específicas por aba
        switch(abaId) {
            case 'dashboard':
                this.atualizarDashboard();
                break;
            case 'records':
                this.aplicarFiltros();
                break;
            case 'reports':
                this.gerarRelatorio();
                break;
            case 'remanejamento':
                this.resetarRemanejamento();
                break;
        }
    }
    
    mostrarTipoPesagem(type) {
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-type') === type);
        });
        
        if (type === 'rework') {
            this.mostrarAba('remanejamento');
        }
    }
    
    buscarProduto(termo, resultsId) {
        const resultsContainer = document.getElementById(resultsId);
        
        if (!termo.trim()) {
            resultsContainer.style.display = 'none';
            return;
        }
        
        const termoLower = termo.toLowerCase();
        const resultados = this.produtos.filter(produto => {
            return produto.CÓDIGO.toString().includes(termo) ||
                   produto.PRODUTO.toLowerCase().includes(termoLower);
        }).slice(0, 10);
        
        if (resultados.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result-item">Nenhum produto encontrado</div>';
            resultsContainer.style.display = 'block';
            return;
        }
        
        resultsContainer.innerHTML = resultados.map(produto => `
            <div class="search-result-item" data-codigo="${produto.CÓDIGO}">
                <strong>${produto.CÓDIGO}</strong> - ${produto.PRODUTO}
            </div>
        `).join('');
        
        resultsContainer.style.display = 'block';
        
        // Adicionar eventos aos resultados
        resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const codigo = parseInt(item.getAttribute('data-codigo'));
                
                if (resultsId === 'search-results') {
                    this.selecionarProdutoNormal(codigo);
                } else {
                    this.selecionarProdutoRemanejamento(codigo);
                }
                
                resultsContainer.style.display = 'none';
            });
        });
    }
    
    selecionarProdutoNormal(codigo) {
        this.produtoSelecionado = this.produtos.find(p => p.CÓDIGO === codigo);
        
        const container = document.getElementById('selected-product');
        if (this.produtoSelecionado) {
            const editando = this.editandoRegistroId ? ' (EDITANDO)' : '';
            container.innerHTML = `
                <div class="product-selected-info">
                    <div class="product-info">
                        <h3>${this.produtoSelecionado.PRODUTO}${editando}</h3>
                        <p>${this.editandoRegistroId ? 'Editando registro existente' : 'Produção normal - produto selecionado'}</p>
                    </div>
                    <div class="product-code">Código: ${this.produtoSelecionado.CÓDIGO}</div>
                </div>
            `;
            container.classList.add('active');
            
            // Definir valor padrão baseado no produto
            this.definirValorPadrao(this.produtoSelecionado.PRODUTO);
        }
    }
    
    selecionarProdutoRemanejamento(codigo) {
        this.produtoRemanejamento = this.produtos.find(p => p.CÓDIGO === codigo);
        
        const container = document.getElementById('remanejamento-selected');
        if (this.produtoRemanejamento) {
            const editando = this.editandoRemanejamentoId ? ' (EDITANDO)' : '';
            container.innerHTML = `
                <div class="product-selected-info">
                    <div class="product-info">
                        <h3>${this.produtoRemanejamento.PRODUTO}${editando}</h3>
                        <p>${this.editandoRemanejamentoId ? 'Editando registro existente' : 'Produto de origem para remanejamento'}</p>
                    </div>
                    <div class="product-code">Código: ${this.produtoRemanejamento.CÓDIGO}</div>
                </div>
            `;
            container.classList.add('active');
            
            // Atualizar informações do passo 3
            this.atualizarInfoRemanejamento();
        }
    }
    
    definirValorPadrao(nomeProduto) {
        const valoresPadrao = {
            'PÃO': 12.50,
            'BOLO': 25.50,
            'BISCOITO': 18.00,
            'BOLACHA': 15.00,
            'TORTA': 35.00,
            'SALGADO': 28.00,
            'DOCE': 32.00
        };
        
        let valor = 25.50; // Valor padrão
        
        for (const [key, val] of Object.entries(valoresPadrao)) {
            if (nomeProduto.includes(key)) {
                valor = val;
                break;
            }
        }
        
        document.getElementById('valor-kg').value = valor.toFixed(2);
        this.calcularPesoLiquido();
    }
    
    calcularPesoLiquido() {
        const tara = parseFloat(document.getElementById('tara').value) || 0;
        const bruto = parseFloat(document.getElementById('bruto').value) || 0;
        const valorKg = parseFloat(document.getElementById('valor-kg').value) || 0;
        
        const liquido = Math.max(0, bruto - tara);
        const valorTotal = liquido * valorKg;
        
        document.getElementById('liquido').textContent = liquido.toFixed(3) + ' kg';
        document.getElementById('valor-total').textContent = 
            valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        return { liquido, valorTotal };
    }
    
    limparFormularioPesagem() {
        document.getElementById('product-search').value = '';
        document.getElementById('selected-product').innerHTML = `
            <div class="empty-selection">
                <i class="fas fa-arrow-up"></i>
                <p>Selecione um produto da lista acima</p>
            </div>
        `;
        document.getElementById('selected-product').classList.remove('active');
        document.getElementById('tara').value = '0.500';
        document.getElementById('bruto').value = '5.500';
        document.getElementById('valor-kg').value = '25.50';
        document.getElementById('search-results').style.display = 'none';
        
        this.produtoSelecionado = null;
        this.editandoRegistroId = null;
        
        // Restaurar botão padrão
        this.ocultarBotoesEdicao();
        
        this.calcularPesoLiquido();
    }
    
    ocultarBotoesEdicao() {
        document.getElementById('submit-weighing').style.display = 'flex';
        document.getElementById('save-edit').style.display = 'none';
        document.getElementById('cancel-edit').style.display = 'none';
        document.getElementById('clear-form').style.display = 'flex';
    }
    
   mostrarBotoesEdicao() {
    document.getElementById('submit-weighing').style.display = 'none';
    document.getElementById('save-edit').style.display = 'flex';
    document.getElementById('cancel-edit').style.display = 'flex';
    document.getElementById('clear-form').style.display = 'none';
    
    // Adicionar status visual de edição
    const selectedProduct = document.getElementById('selected-product');
    if (selectedProduct.querySelector('.product-selected-info')) {
        const productInfo = selectedProduct.querySelector('.product-info');
        if (!productInfo.querySelector('.editing-status')) {
            const statusDiv = document.createElement('div');
            statusDiv.className = 'editing-status';
            statusDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> MODO EDIÇÃO - As alterações serão salvas no registro original';
            productInfo.appendChild(statusDiv);
        }
    }
}
    
    registrarPesagemNormal() {
        if (!this.produtoSelecionado) {
            this.mostrarNotificacao('Selecione um produto para registrar a pesagem', 'error');
            return;
        }
        
        const tara = parseFloat(document.getElementById('tara').value);
        const bruto = parseFloat(document.getElementById('bruto').value);
        const valorKg = parseFloat(document.getElementById('valor-kg').value);
        const { liquido, valorTotal } = this.calcularPesoLiquido();
        
        if (liquido <= 0) {
            this.mostrarNotificacao('O peso líquido deve ser maior que zero', 'error');
            return;
        }
        
        // CORREÇÃO: Verificar se está editando
        if (this.editandoRegistroId) {
            this.salvarEdicao();
            return;
        }
        
        const registro = {
            id: Date.now(),
            data: new Date().toISOString(),
            tipo: 'normal',
            produto: this.produtoSelecionado.PRODUTO,
            codigo: this.produtoSelecionado.CÓDIGO,
            tara: tara,
            bruto: bruto,
            liquido: liquido,
            valorKg: valorKg,
            valorTotal: valorTotal,
            prejuizo: 0,
            observacoes: 'Produção normal'
        };
        
        this.registros.unshift(registro);
        this.salvarRegistros();
        
        this.mostrarNotificacao(
            `Produção registrada: ${liquido.toFixed(3)} kg de ${this.produtoSelecionado.PRODUTO}`,
            'success'
        );
        
        this.limparFormularioPesagem();
        this.atualizarDashboard();
        
        if (document.querySelector('#records.tab-content.active')) {
            this.aplicarFiltros();
        }
    }
    
    // CORREÇÃO: Salvar edição de registro (atualiza sem duplicar)
    salvarEdicao() {
    if (!this.produtoSelecionado || !this.editandoRegistroId) {
        this.mostrarNotificacao('Nenhum registro em edição', 'error');
        return;
    }
    
    const tara = parseFloat(document.getElementById('tara').value);
    const bruto = parseFloat(document.getElementById('bruto').value);
    const valorKg = parseFloat(document.getElementById('valor-kg').value);
    const { liquido, valorTotal } = this.calcularPesoLiquido();
    
    if (liquido <= 0) {
        this.mostrarNotificacao('O peso líquido deve ser maior que zero', 'error');
        return;
    }
    
    // Encontrar e atualizar o registro existente - SEM DUPLICAR
    const index = this.registros.findIndex(r => r.id === this.editandoRegistroId);
    if (index !== -1) {
        // CORREÇÃO CRÍTICA: Atualizar APENAS o registro existente
        const registroOriginal = this.registros[index];
        
        this.registros[index] = {
            ...registroOriginal, // Mantém todos os dados originais
            produto: this.produtoSelecionado.PRODUTO,
            codigo: this.produtoSelecionado.CÓDIGO,
            tara: tara,
            bruto: bruto,
            liquido: liquido,
            valorKg: valorKg,
            valorTotal: valorTotal,
            dataEditado: new Date().toISOString() // Marca como editado
        };
        
        this.salvarRegistros();
        
        this.mostrarNotificacao(
            `Registro atualizado: ${liquido.toFixed(3)} kg de ${this.produtoSelecionado.PRODUTO}`,
            'success'
        );
        
        // Limpar e atualizar interfaces
        this.limparFormularioPesagem();
        this.atualizarDashboard();
        
        if (document.querySelector('#records.tab-content.active')) {
            this.aplicarFiltros();
        }
        
        // Resetar ID de edição
        this.editandoRegistroId = null;
    } else {
        this.mostrarNotificacao('Registro não encontrado para edição', 'error');
    }
}
    
    cancelarEdicao() {
        this.limparFormularioPesagem();
        this.mostrarNotificacao('Edição cancelada', 'warning');
    }
    
    resetarRemanejamento() {
        // Resetar passos
        this.mostrarPasso(1);
        
        // Limpar seleções
        this.produtoRemanejamento = null;
        this.tipoRemanejamento = null;
        this.destinoRemanejamento = null;
        this.editandoRemanejamentoId = null;
        
        // Resetar UI
        document.getElementById('remanejamento-selected').innerHTML = `
            <div class="empty-selection">
                <i class="fas fa-box"></i>
                <p>Selecione um produto para remanejamento</p>
            </div>
        `;
        document.getElementById('remanejamento-selected').classList.remove('active');
        
        document.querySelectorAll('.option-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Resetar campos
        document.getElementById('peso-inicial').value = '10.000';
        document.getElementById('peso-final').value = '8.500';
        document.getElementById('valor-origem').value = '25.50';
        document.getElementById('valor-destino').value = '15.00';
        document.getElementById('observacoes').value = '';
        
        // Resetar info
        document.getElementById('info-origem').textContent = '-';
        document.getElementById('info-tipo').textContent = '-';
        document.getElementById('info-destino').textContent = '-';
        
        // Resetar botões
        document.getElementById('submit-remanejamento').style.display = 'flex';
        document.getElementById('submit-remanejamento').textContent = 'Registrar Remanejamento';
        
        // Resetar cálculos
        this.calcularRemanejamento();
    }
    
    mostrarPasso(numero) {
        // Atualizar steps
        document.querySelectorAll('.step').forEach(step => {
            step.classList.toggle('active', parseInt(step.getAttribute('data-step')) === numero);
        });
        
        // Mostrar conteúdo do passo
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.toggle('active', step.id === `step-${numero}`);
        });
    }
    
    proximoPasso(passo) {
        const passoAtual = parseInt(document.querySelector('.form-step.active').id.split('-')[1]);
        
        // Validações antes de prosseguir
        if (passoAtual === 1 && !this.produtoRemanejamento) {
            this.mostrarNotificacao('Selecione um produto de origem', 'error');
            return;
        }
        
        if (passoAtual === 2 && !this.tipoRemanejamento) {
            this.mostrarNotificacao('Selecione um tipo de remanejamento', 'error');
            return;
        }
        
        this.mostrarPasso(parseInt(passo));
    }
    
    voltarPasso(passo) {
        this.mostrarPasso(parseInt(passo));
    }
    
    selecionarTipoRemanejamento(card) {
        document.querySelectorAll('.option-card').forEach(c => {
            c.classList.remove('active');
        });
        
        card.classList.add('active');
        
        this.tipoRemanejamento = card.getAttribute('data-tipo');
        this.destinoRemanejamento = card.getAttribute('data-destino') || null;
        
        // Atualizar informações
        this.atualizarInfoRemanejamento();
        
        // Definir valores padrão baseado no destino
        this.definirValoresRemanejamento();
    }
    
    atualizarInfoRemanejamento() {
        if (this.produtoRemanejamento) {
            document.getElementById('info-origem').textContent = this.produtoRemanejamento.PRODUTO;
        }
        
        if (this.tipoRemanejamento) {
            const tipoText = this.tipoRemanejamento === 'sobra' ? 'Sobra/Transformação' : 'Perda/Descarte';
            document.getElementById('info-tipo').textContent = tipoText;
        }
        
        if (this.destinoRemanejamento) {
            const destinoText = this.destinoRemanejamento === 'farinha' ? 
                'Farinha de Rosca' : 'Torrada';
            document.getElementById('info-destino').textContent = destinoText;
        } else if (this.tipoRemanejamento === 'perda') {
            document.getElementById('info-destino').textContent = 'Descarte';
        }
    }
    
    definirValoresRemanejamento() {
        if (this.tipoRemanejamento === 'perda') {
            document.getElementById('valor-destino').value = '0.00';
            document.getElementById('peso-final').value = '0.000';
        } else if (this.destinoRemanejamento) {
            // Valores padrão para transformação
            const valores = {
                'farinha': 8.50,
                'torrada': 12.00
            };
            
            if (valores[this.destinoRemanejamento]) {
                document.getElementById('valor-destino').value = valores[this.destinoRemanejamento].toFixed(2);
            }
        }
        
        this.calcularRemanejamento();
    }
    
    calcularRemanejamento() {
        const pesoInicial = parseFloat(document.getElementById('peso-inicial').value) || 0;
        const pesoFinal = parseFloat(document.getElementById('peso-final').value) || 0;
        const valorOrigem = parseFloat(document.getElementById('valor-origem').value) || 0;
        const valorDestino = parseFloat(document.getElementById('valor-destino').value) || 0;
        
        const diffPeso = pesoInicial - pesoFinal;
        const valorInicial = pesoInicial * valorOrigem;
        const valorFinal = pesoFinal * valorDestino;
        const prejuizo = valorInicial - valorFinal;
        
        // Atualizar displays
        document.getElementById('diff-peso').textContent = diffPeso.toFixed(3) + ' kg';
        document.getElementById('valor-inicial').textContent = 
            valorInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('valor-final').textContent = 
            valorFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('prejuizo').textContent = 
            prejuizo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        return { diffPeso, valorInicial, valorFinal, prejuizo };
    }
    
    registrarRemanejamento() {
        if (!this.produtoRemanejamento || !this.tipoRemanejamento) {
            this.mostrarNotificacao('Complete todos os passos do remanejamento', 'error');
            return;
        }
        
        const pesoInicial = parseFloat(document.getElementById('peso-inicial').value);
        const pesoFinal = parseFloat(document.getElementById('peso-final').value);
        const valorOrigem = parseFloat(document.getElementById('valor-origem').value);
        const valorDestino = parseFloat(document.getElementById('valor-destino').value);
        const observacoes = document.getElementById('observacoes').value;
        
        const { diffPeso, valorInicial, valorFinal, prejuizo } = this.calcularRemanejamento();
        
        if (pesoInicial <= 0) {
            this.mostrarNotificacao('O peso inicial deve ser maior que zero', 'error');
            return;
        }
        
        // Se estiver editando, atualizar registro existente
        if (this.editandoRemanejamentoId) {
            const index = this.registros.findIndex(r => r.id === this.editandoRemanejamentoId);
            if (index !== -1) {
                // CORREÇÃO: Manter os dados originais exceto os editados
                this.registros[index] = {
                    ...this.registros[index],
                    tipo: this.tipoRemanejamento,
                    produto: this.produtoRemanejamento.PRODUTO,
                    codigo: this.produtoRemanejamento.CÓDIGO,
                    destino: this.destinoRemanejamento,
                    pesoInicial: pesoInicial,
                    pesoFinal: pesoFinal,
                    diferencaPeso: diffPeso,
                    valorOrigem: valorOrigem,
                    valorDestino: valorDestino,
                    valorInicial: valorInicial,
                    valorFinal: valorFinal,
                    prejuizo: Math.max(0, prejuizo),
                    observacoes: observacoes || `Remanejamento: ${this.tipoRemanejamento === 'sobra' ? 'Transformação para ' + (this.destinoRemanejamento === 'farinha' ? 'Farinha de Rosca' : 'Torrada') : 'Perda/Descarte'}`,
                    dataEditado: new Date().toISOString() // Adiciona data da edição
                };
                
                this.salvarRegistros();
                this.mostrarNotificacao('Remanejamento atualizado com sucesso', 'success');
                this.resetarRemanejamento();
                this.atualizarDashboard();
                if (document.querySelector('#records.tab-content.active')) {
                    this.aplicarFiltros();
                }
                return;
            }
        }
        
        // Criar novo registro de remanejamento
        const registro = {
            id: Date.now(),
            data: new Date().toISOString(),
            tipo: this.tipoRemanejamento,
            produto: this.produtoRemanejamento.PRODUTO,
            codigo: this.produtoRemanejamento.CÓDIGO,
            destino: this.destinoRemanejamento,
            pesoInicial: pesoInicial,
            pesoFinal: pesoFinal,
            diferencaPeso: diffPeso,
            valorOrigem: valorOrigem,
            valorDestino: valorDestino,
            valorInicial: valorInicial,
            valorFinal: valorFinal,
            prejuizo: Math.max(0, prejuizo),
            observacoes: observacoes || `Remanejamento: ${this.tipoRemanejamento === 'sobra' ? 'Transformação para ' + (this.destinoRemanejamento === 'farinha' ? 'Farinha de Rosca' : 'Torrada') : 'Perda/Descarte'}`
        };
        
        this.registros.unshift(registro);
        this.salvarRegistros();
        
        let mensagem = '';
        if (this.tipoRemanejamento === 'sobra') {
            mensagem = `Transformação registrada: ${pesoInicial.toFixed(3)} kg → ${pesoFinal.toFixed(3)} kg`;
        } else {
            mensagem = `Perda registrada: ${pesoInicial.toFixed(3)} kg perdidos`;
        }
        
        this.mostrarNotificacao(mensagem, 'success');
        
        this.resetarRemanejamento();
        this.atualizarDashboard();
        
        if (document.querySelector('#records.tab-content.active')) {
            this.aplicarFiltros();
        }
    }
    
    salvarRegistros() {
        localStorage.setItem('producao_registros', JSON.stringify(this.registros));
    }
    
    aplicarFiltros() {
        const tipo = document.getElementById('filter-type').value;
        const dataStr = document.getElementById('filter-date').value;
        
        let registrosFiltrados = [...this.registros];
        
        // Filtrar por tipo
        if (tipo !== 'all') {
            registrosFiltrados = registrosFiltrados.filter(registro => {
                if (tipo === 'remanejamento') {
                    return registro.tipo === 'sobra' || registro.tipo === 'perda';
                }
                return registro.tipo === tipo;
            });
        }
        
        // Filtrar por data
        if (dataStr) {
            const dataFiltro = moment(dataStr);
            registrosFiltrados = registrosFiltrados.filter(registro => {
                return moment(registro.data).isSame(dataFiltro, 'day');
            });
        }
        
        this.exibirRegistros(registrosFiltrados);
    }
    
    // CORREÇÃO: Aplicar filtros avançados (relatórios)
    aplicarFiltrosAvancados() {
        // CORREÇÃO: Usar os filtros corretos do relatório
        const inicio = document.getElementById('advanced-start').value;
        const fim = document.getElementById('advanced-end').value;
        const nomeProduto = document.getElementById('filter-product-name').value.toLowerCase().trim();
        const codigoProduto = document.getElementById('filter-product-code').value.trim();
        const tipoDetalhado = document.getElementById('filter-tipo-detalhado').value;
        
        console.log('Filtros aplicados:', { inicio, fim, nomeProduto, codigoProduto, tipoDetalhado });
        
        let registrosFiltrados = [...this.registros];
        
        // Filtrar por período
        if (inicio && fim) {
            const dataInicio = moment(inicio).startOf('day');
            const dataFim = moment(fim).endOf('day');
            
            registrosFiltrados = registrosFiltrados.filter(registro => {
                const dataRegistro = moment(registro.data);
                return dataRegistro.isBetween(dataInicio, dataFim, null, '[]');
            });
            
            console.log('Após filtro de data:', registrosFiltrados.length);
        }
        
        // Filtrar por nome do produto
        if (nomeProduto) {
            registrosFiltrados = registrosFiltrados.filter(registro => 
                registro.produto.toLowerCase().includes(nomeProduto)
            );
            console.log('Após filtro de nome:', registrosFiltrados.length);
        }
        
        // Filtrar por código do produto
        if (codigoProduto) {
            registrosFiltrados = registrosFiltrados.filter(registro => 
                registro.codigo.toString().includes(codigoProduto)
            );
            console.log('Após filtro de código:', registrosFiltrados.length);
        }
        
        // Filtrar por tipo
        if (tipoDetalhado !== 'all') {
            registrosFiltrados = registrosFiltrados.filter(registro => registro.tipo === tipoDetalhado);
            console.log('Após filtro de tipo:', registrosFiltrados.length);
        }
        
        // Atualizar exibição
        this.gerarRelatorioDetalhado(registrosFiltrados);
        
        // Gerar gráficos com os registros filtrados
        this.gerarGraficosRelatorio(registrosFiltrados, 
            inicio ? moment(inicio) : moment().subtract(7, 'days'),
            fim ? moment(fim) : moment()
        );
        
        // Atualizar mensagem de filtro
        const filtroAtivo = document.getElementById('filter-active');
        let filtroTexto = '';
        
        if (inicio && fim) {
            filtroTexto += `${moment(inicio).locale('pt-br').format('DD/MM/YYYY')} até ${moment(fim).locale('pt-br').format('DD/MM/YYYY')}`;
        }
        
        if (nomeProduto) filtroTexto += nomeProduto ? ` • Produto: ${nomeProduto}` : '';
        if (codigoProduto) filtroTexto += codigoProduto ? ` • Código: ${codigoProduto}` : '';
        if (tipoDetalhado !== 'all') {
            const tipoText = tipoDetalhado === 'normal' ? 'Produção Normal' : 
                           tipoDetalhado === 'sobra' ? 'Sobras' : 'Perdas';
            filtroTexto += tipoDetalhado !== 'all' ? ` • ${tipoText}` : '';
        }
        
        filtroAtivo.textContent = filtroTexto || 'Todos os registros';
    }
    
    resetarFiltrosAvancados() {
        document.getElementById('filter-product-name').value = '';
        document.getElementById('filter-product-code').value = '';
        document.getElementById('filter-tipo-detalhado').value = 'all';
        document.getElementById('advanced-start').value = moment().subtract(7, 'days').format('YYYY-MM-DD');
        document.getElementById('advanced-end').value = moment().format('YYYY-MM-DD');
        
        this.aplicarFiltrosAvancados();
    }
    
    resetarFiltros() {
        document.getElementById('filter-type').value = 'all';
        document.getElementById('filter-date').value = moment().format('YYYY-MM-DD');
        this.aplicarFiltros();
    }
    
    exibirRegistros(registros) {
    const tbody = document.getElementById('records-body');
    
    if (registros.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-table">
                    <i class="fas fa-clipboard-list"></i>
                    Nenhum registro encontrado
                </td>
            </tr>
        `;
        
        // Resetar totais
        document.getElementById('total-peso').textContent = '0 kg';
        document.getElementById('total-valor').textContent = 'R$ 0,00';
        document.getElementById('total-diff').textContent = '0 kg';
        document.getElementById('total-prejuizo').textContent = 'R$ 0,00';
        
        return;
    }
    
    let totalPeso = 0;
    let totalValor = 0;
    let totalDiff = 0;
    let totalPrejuizo = 0;
    
    tbody.innerHTML = registros.map(registro => {
        // Calcular valores para exibição
        let pesoExibir = 0;
        let valorExibir = 0;
        let diffExibir = 0;
        let prejuizoExibir = 0;
        let detalhes = '';
        
        if (registro.tipo === 'normal') {
            pesoExibir = registro.liquido || 0;
            valorExibir = registro.valorTotal || 0;
            detalhes = `Tara: ${(registro.tara || 0).toFixed(3)}kg | Bruto: ${(registro.bruto || 0).toFixed(3)}kg`;
        } else {
            pesoExibir = registro.pesoInicial || 0;
            valorExibir = registro.valorInicial || 0;
            diffExibir = registro.diferencaPeso || 0;
            prejuizoExibir = registro.prejuizo || 0;
            
            if (registro.tipo === 'sobra') {
                detalhes = `Transformação para ${registro.destino === 'farinha' ? 'Farinha de Rosca' : 'Torrada Simples'}`;
            } else {
                detalhes = 'Perda/Descarte';
            }
        }
        
        // Acumular totais
        totalPeso += pesoExibir;
        totalValor += valorExibir;
        totalDiff += diffExibir;
        totalPrejuizo += prejuizoExibir;
        
        // Criar badge de tipo
        let tipoBadge = '';
        if (registro.tipo === 'normal') {
            tipoBadge = '<span class="type-badge normal">Normal</span>';
        } else if (registro.tipo === 'sobra') {
            tipoBadge = '<span class="type-badge sobra">Sobra</span>';
        } else {
            tipoBadge = '<span class="type-badge perda">Perda</span>';
        }
        
        // Adicionar ícone de edição se o registro foi editado
        const editadoIcon = registro.dataEditado ? 
            '<i class="fas fa-pencil-alt" style="margin-left: 5px; color: #ff9800; font-size: 10px;" title="Editado"></i>' : '';
        
        // Observações se existirem
        const observacoesExibir = registro.observacoes ? 
            `<br><small class="observacoes-text">${registro.observacoes}</small>` : '';
        
        return `
            <tr>
                <td>
                    ${moment(registro.data).locale('pt-br').format('DD/MM/YYYY HH:mm')}
                    ${editadoIcon}
                </td>
                <td>${tipoBadge}</td>
                <td>
                    ${registro.produto}
                    <br><small>Código: ${registro.codigo}</small>
                    ${observacoesExibir}
                </td>
                <td>${detalhes}</td>
                <td>${pesoExibir.toFixed(3)} kg</td>
                <td>${valorExibir.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td>${registro.tipo !== 'normal' ? diffExibir.toFixed(3) + ' kg' : '-'}</td>
                <td>
                    ${prejuizoExibir > 0 ? 
                        `<span class="prejuizo-text">${prejuizoExibir.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>` : 
                        '-'}
                </td>
                <td class="actions">
                    <button class="btn-action btn-edit" title="Editar registro" onclick="sistema.editarRegistro(${registro.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete-row" title="Excluir registro" onclick="sistema.confirmarExcluirRegistro(${registro.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Atualizar totais
    document.getElementById('total-peso').textContent = totalPeso.toFixed(3) + ' kg';
    document.getElementById('total-valor').textContent = 
        totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-diff').textContent = totalDiff.toFixed(3) + ' kg';
    document.getElementById('total-prejuizo').textContent = 
        totalPrejuizo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
    
    confirmarExcluirRegistro(id) {
    const registro = this.registros.find(r => r.id === id);
    if (!registro) {
        this.mostrarNotificacao('Registro não encontrado', 'error');
        return;
    }
    
    let tipoTexto = '';
    if (registro.tipo === 'normal') {
        tipoTexto = 'produção normal';
    } else if (registro.tipo === 'sobra') {
        tipoTexto = 'transformação de sobra';
    } else {
        tipoTexto = 'perda/descarte';
    }
    
    this.mostrarModal(
        `<strong>Tem certeza que deseja excluir permanentemente este registro?</strong><br><br>
         <strong>Produto:</strong> ${registro.produto}<br>
         <strong>Tipo:</strong> ${tipoTexto}<br>
         <strong>Data:</strong> ${moment(registro.data).locale('pt-br').format('DD/MM/YYYY HH:mm')}<br><br>
         <em>Esta ação não pode ser desfeita.</em>`,
        () => this.excluirRegistro(id)
    );
}
    
    excluirRegistro(id) {
        const index = this.registros.findIndex(r => r.id === id);
        if (index !== -1) {
            this.registros.splice(index, 1);
            this.salvarRegistros();
            this.aplicarFiltros();
            this.atualizarDashboard();
            this.mostrarNotificacao('Registro excluído com sucesso', 'success');
        }
    }
    
    confirmarLimparRegistros() {
        if (this.registros.length === 0) return;
        
        this.mostrarModal(
            `Tem certeza que deseja excluir todos os ${this.registros.length} registros? Esta ação não pode ser desfeita.`,
            () => this.limparTodosRegistros()
        );
    }
    
    limparTodosRegistros() {
        this.registros = [];
        this.salvarRegistros();
        this.aplicarFiltros();
        this.atualizarDashboard();
        this.mostrarNotificacao('Todos os registros foram excluídos', 'success');
    }
    
    // CORREÇÃO: Edição de registros
    editarRegistro(id) {
    const registro = this.registros.find(r => r.id === id);
    if (!registro) {
        this.mostrarNotificacao('Registro não encontrado', 'error');
        return;
    }
    
    if (registro.tipo === 'normal') {
        this.mostrarAba('weighing');
        
        // Limpar formulário primeiro
        this.limparFormularioPesagem();
        
        // Setar modo de edição
        this.editandoRegistroId = id;
        this.mostrarBotoesEdicao();
        
        // Selecionar o produto
        const produto = this.produtos.find(p => p.CÓDIGO === registro.codigo);
        if (produto) {
            this.produtoSelecionado = produto;
            const container = document.getElementById('selected-product');
            container.innerHTML = `
                <div class="product-selected-info">
                    <div class="product-info">
                        <h3>${produto.PRODUTO} (EDITANDO)</h3>
                        <p><i class="fas fa-pencil-alt"></i> Editando registro existente</p>
                    </div>
                    <div class="product-code">Código: ${produto.CÓDIGO}</div>
                </div>
            `;
            container.classList.add('active');
        }
        
        // Preencher campos com os dados existentes
        document.getElementById('tara').value = registro.tara || 0.500;
        document.getElementById('bruto').value = registro.bruto || 0;
        document.getElementById('valor-kg').value = registro.valorKg || 25.50;
        this.calcularPesoLiquido();
        
    } else {
        this.mostrarAba('remanejamento');
        
        // Resetar primeiro
        this.resetarRemanejamento();
        
        // Setar modo de edição
        this.editandoRemanejamentoId = id;
        document.getElementById('submit-remanejamento').textContent = 'Salvar Edição';
        
        // Preencher dados do remanejamento
        const produto = this.produtos.find(p => p.CÓDIGO === registro.codigo);
        if (produto) {
            this.produtoRemanejamento = produto;
            this.tipoRemanejamento = registro.tipo;
            this.destinoRemanejamento = registro.destino;
            
            // Atualizar UI - primeiro mostrar o produto selecionado
            const container = document.getElementById('remanejamento-selected');
            container.innerHTML = `
                <div class="product-selected-info">
                    <div class="product-info">
                        <h3>${produto.PRODUTO} (EDITANDO)</h3>
                        <p><i class="fas fa-pencil-alt"></i> Editando registro de remanejamento</p>
                    </div>
                    <div class="product-code">Código: ${produto.CÓDIGO}</div>
                </div>
            `;
            container.classList.add('active');
            
            // Selecionar tipo correspondente
            setTimeout(() => {
                document.querySelectorAll('.option-card').forEach(card => {
                    const tipo = card.getAttribute('data-tipo');
                    const destino = card.getAttribute('data-destino');
                    
                    if (registro.tipo === 'perda' && tipo === 'perda') {
                        card.classList.add('active');
                    } else if (registro.tipo === 'sobra' && destino === registro.destino) {
                        card.classList.add('active');
                    }
                });
                
                // Ir para o passo 3
                this.mostrarPasso(3);
                this.atualizarInfoRemanejamento();
                
                // Preencher campos
                document.getElementById('peso-inicial').value = registro.pesoInicial || 0;
                document.getElementById('peso-final').value = registro.pesoFinal || 0;
                document.getElementById('valor-origem').value = registro.valorOrigem || 0;
                document.getElementById('valor-destino').value = registro.valorDestino || 0;
                document.getElementById('observacoes').value = registro.observacoes || '';
                
                this.calcularRemanejamento();
            }, 100);
        }
    }
    
    this.mostrarNotificacao('Editando registro existente. As alterações serão salvas no registro original.', 'warning');
}
    
    atualizarDashboard() {
        const hoje = moment().startOf('day');
        const registrosHoje = this.registros.filter(registro => 
            moment(registro.data).isSameOrAfter(hoje)
        );
        
        // Calcular estatísticas
        const producaoNormal = registrosHoje.filter(r => r.tipo === 'normal');
        const producaoSobra = registrosHoje.filter(r => r.tipo === 'sobra');
        const producaoPerda = registrosHoje.filter(r => r.tipo === 'perda');
        
        // Totais do dia
        const totalKg = producaoNormal.reduce((sum, r) => sum + r.liquido, 0);
        const totalValor = producaoNormal.reduce((sum, r) => sum + r.valorTotal, 0);
        
        // Perdas do dia
        const totalPerdaKg = producaoPerda.reduce((sum, r) => sum + r.pesoInicial, 0);
        const totalPerdaValor = producaoPerda.reduce((sum, r) => sum + r.prejuizo, 0);
        
        // Sobras transformadas
        const totalSobraKg = producaoSobra.reduce((sum, r) => sum + r.pesoInicial, 0);
        
        // Estatísticas
        const produtosUnicos = [...new Set(producaoNormal.map(r => r.codigo))].length;
        
        // Última atividade
        const ultimaAtividade = registrosHoje[0];
        
        // Atualizar valores no dashboard
        document.getElementById('daily-total').textContent = totalKg.toFixed(3) + ' kg';
        document.getElementById('daily-value').textContent = 
            totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        document.getElementById('daily-items').textContent = produtosUnicos;
        
        document.getElementById('daily-loss').textContent = totalPerdaKg.toFixed(3) + ' kg';
        document.getElementById('loss-value').textContent = 
            totalPerdaValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        if (ultimaAtividade) {
            document.getElementById('last-weighing').textContent = 
                moment(ultimaAtividade.data).locale('pt-br').format('HH:mm');
            document.getElementById('last-product').textContent = ultimaAtividade.produto;
        } else {
            document.getElementById('last-weighing').textContent = '--:--';
            document.getElementById('last-product').textContent = 'Nenhuma ainda';
        }
        
        // Atualizar totais no cabeçalho
        document.getElementById('total-today').textContent = totalKg.toFixed(3) + ' kg';
        document.getElementById('total-loss').textContent = totalPerdaKg.toFixed(3) + ' kg';
        
        // Atualizar atividade recente
        this.atualizarAtividadeRecente(registrosHoje.slice(0, 5));
        
        // Atualizar gráficos do dashboard
        this.atualizarGraficosDashboard(producaoNormal, producaoSobra, producaoPerda);
    }
    
    atualizarAtividadeRecente(registros) {
        const container = document.getElementById('recent-activity');
        
        if (registros.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>Nenhuma atividade registrada hoje</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = registros.map(registro => {
            let icon = 'fa-weight-hanging';
            let tipoText = 'Produção';
            let valorText = '';
            let pesoText = '';
            
            if (registro.tipo === 'normal') {
                icon = 'fa-check-circle';
                pesoText = `${registro.liquido.toFixed(3)} kg`;
                valorText = registro.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            } else if (registro.tipo === 'sobra') {
                icon = 'fa-recycle';
                tipoText = 'Transformação';
                pesoText = `${registro.pesoInicial.toFixed(3)}kg → ${registro.pesoFinal.toFixed(3)}kg`;
                valorText = `Prejuízo: ${registro.prejuizo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
            } else {
                icon = 'fa-exclamation-triangle';
                tipoText = 'Perda';
                pesoText = `${registro.pesoInicial.toFixed(3)} kg`;
                valorText = `Prejuízo: ${registro.prejuizo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
            }
            
            return `
                <div class="activity-item">
                    <div class="activity-info">
                        <h4>${registro.produto}</h4>
                        <p>
                            <i class="fas ${icon}"></i>
                            ${tipoText} • ${moment(registro.data).locale('pt-br').format('HH:mm')}
                        </p>
                    </div>
                    <div class="activity-values">
                        <div class="weight">${pesoText}</div>
                        <div class="value">${valorText}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    atualizarGraficosDashboard(normal, sobra, perda) {
        // Gráfico de produção vs perdas
        const ctx1 = document.getElementById('productionLossChart');
        if (ctx1) {
            if (this.productionLossChart) {
                this.productionLossChart.destroy();
            }
            
            const totalProducao = normal.reduce((sum, r) => sum + r.liquido, 0);
            const totalSobras = sobra.reduce((sum, r) => sum + r.pesoInicial, 0);
            const totalPerdas = perda.reduce((sum, r) => sum + r.pesoInicial, 0);
            
            this.productionLossChart = new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Produção', 'Sobras', 'Perdas'],
                    datasets: [{
                        data: [totalProducao, totalSobras, totalPerdas],
                        backgroundColor: ['#27ae60', '#3498db', '#e74c3c'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.parsed.toFixed(3)} kg`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Gráfico top 5 produtos hoje
        const ctx2 = document.getElementById('topProductsTodayChart');
        if (ctx2) {
            if (this.topProductsTodayChart) {
                this.topProductsTodayChart.destroy();
            }
            
            // Agrupar produção normal por produto
            const produtosAgrupados = {};
            normal.forEach(registro => {
                if (!produtosAgrupados[registro.produto]) {
                    produtosAgrupados[registro.produto] = 0;
                }
                produtosAgrupados[registro.produto] += registro.liquido;
            });
            
            const top5 = Object.entries(produtosAgrupados)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            if (top5.length > 0) {
                this.topProductsTodayChart = new Chart(ctx2, {
                    type: 'bar',
                    data: {
                        labels: top5.map(p => p[0].length > 15 ? p[0].substring(0, 15) + '...' : p[0]),
                        datasets: [{
                            label: 'Peso (kg)',
                            data: top5.map(p => p[1]),
                            backgroundColor: '#3498db',
                            borderColor: '#2980b9',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Peso (kg)'
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `Peso: ${context.parsed.y.toFixed(3)} kg`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
    }
    
    // CORREÇÃO: Método de gerar relatório
    gerarRelatorio() {
        this.aplicarFiltrosAvancados();
    }
    
    gerarRelatorioDetalhado(registros) {
        const tbody = document.getElementById('detailed-body');
        
        if (registros.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-table">
                        <i class="fas fa-chart-bar"></i>
                        Nenhum registro encontrado no período selecionado
                    </td>
                </tr>
            `;
            
            // Resetar totais do relatório
            document.getElementById('report-total-kg').textContent = '0 kg';
            document.getElementById('report-total-value').textContent = 'R$ 0,00';
            document.getElementById('report-total-loss').textContent = '0 kg';
            document.getElementById('report-loss-value').content = 'R$ 0,00';
            
            return;
        }
        
        // Agrupar por produto e tipo para exibição INDIVIDUAL
        const produtosAgrupados = {};
        
        registros.forEach(registro => {
            const chave = `${registro.codigo}-${registro.produto}`;
            
            if (!produtosAgrupados[chave]) {
                produtosAgrupados[chave] = {
                    produto: registro.produto,
                    codigo: registro.codigo,
                    registros: [],
                    producao: 0,
                    sobras: 0,
                    perdas: 0,
                    valorTotal: 0,
                    prejuizoTotal: 0
                };
            }
            
            produtosAgrupados[chave].registros.push(registro);
            
            if (registro.tipo === 'normal') {
                produtosAgrupados[chave].producao += registro.liquido;
                produtosAgrupados[chave].valorTotal += registro.valorTotal;
            } else if (registro.tipo === 'sobra') {
                produtosAgrupados[chave].sobras += registro.pesoInicial;
                produtosAgrupados[chave].prejuizoTotal += registro.prejuizo;
            } else if (registro.tipo === 'perda') {
                produtosAgrupados[chave].perdas += registro.pesoInicial;
                produtosAgrupados[chave].prejuizoTotal += registro.prejuizo;
            }
        });
        
        // Converter para array e calcular eficiência
        const produtosArray = Object.values(produtosAgrupados);
        produtosArray.forEach(prod => {
            const total = prod.producao + prod.sobras + prod.perdas;
            prod.eficiencia = total > 0 ? (prod.producao / total) * 100 : 0;
        });
        
        // Ordenar por produção (decrescente)
        produtosArray.sort((a, b) => b.producao - a.producao);
        
        // Calcular totais para exibição no resumo
        const totalProducao = produtosArray.reduce((sum, prod) => sum + prod.producao, 0);
        const totalValor = produtosArray.reduce((sum, prod) => sum + prod.valorTotal, 0);
        const totalPerdas = produtosArray.reduce((sum, prod) => sum + prod.perdas, 0);
        const totalPrejuizo = produtosArray.reduce((sum, prod) => sum + prod.prejuizoTotal, 0);
        
        // Atualizar totais no resumo
        document.getElementById('report-total-kg').textContent = totalProducao.toFixed(3) + ' kg';
        document.getElementById('report-total-value').textContent = 
            totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('report-total-loss').textContent = totalPerdas.toFixed(3) + ' kg';
        document.getElementById('report-loss-value').textContent = 
            totalPrejuizo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        // Gerar tabela com dados INDIVIDUAIS
        tbody.innerHTML = produtosArray.map(prod => {
            const eficienciaClass = prod.eficiencia >= 80 ? 'high' : 
                                  prod.eficiencia >= 60 ? 'medium' : 'low';
            
            // Determinar tipo principal (o mais frequente)
            const tipos = prod.registros.map(r => r.tipo);
            const tipoPrincipal = tipos.reduce((a, b, i, arr) => 
                arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b, tipos[0] || 'normal');
            
            const tipoText = tipoPrincipal === 'normal' ? 'Normal' : 
                           tipoPrincipal === 'sobra' ? 'Sobra' : 'Perda';
            
            return `
                <tr>
                    <td>${prod.produto}</td>
                    <td>${prod.codigo}</td>
                    <td>${tipoText}</td>
                    <td>${prod.producao.toFixed(3)}</td>
                    <td>${prod.sobras.toFixed(3)}</td>
                    <td>${prod.perdas.toFixed(3)}</td>
                    <td>${prod.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td>${prod.prejuizoTotal > 0 ? prod.prejuizoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</td>
                    <td><span class="efficiency-badge ${eficienciaClass}">${prod.eficiencia.toFixed(1)}%</span></td>
                </tr>
            `;
        }).join('');
    }
    
    gerarGraficosRelatorio(registros, inicio, fim) {
        // Gráfico de distribuição por tipo
        const ctx1 = document.getElementById('typeDistributionChart');
        if (ctx1) {
            if (this.typeDistributionChart) {
                this.typeDistributionChart.destroy();
            }
            
            const normal = registros.filter(r => r.tipo === 'normal');
            const sobra = registros.filter(r => r.tipo === 'sobra');
            const perda = registros.filter(r => r.tipo === 'perda');
            
            const totalNormal = normal.reduce((sum, r) => sum + (r.liquido || r.pesoInicial || 0), 0);
            const totalSobra = sobra.reduce((sum, r) => sum + (r.pesoInicial || 0), 0);
            const totalPerda = perda.reduce((sum, r) => sum + (r.pesoInicial || 0), 0);
            
            this.typeDistributionChart = new Chart(ctx1, {
                type: 'pie',
                data: {
                    labels: ['Produção Normal', 'Sobras', 'Perdas'],
                    datasets: [{
                        data: [totalNormal, totalSobra, totalPerda],
                        backgroundColor: ['#27ae60', '#3498db', '#e74c3c'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.parsed.toFixed(3)} kg`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Gráfico de evolução diária
        const ctx2 = document.getElementById('dailyEvolutionChart');
        if (ctx2) {
            if (this.dailyEvolutionChart) {
                this.dailyEvolutionChart.destroy();
            }
            
            // Agrupar por dia
            const dadosPorDia = {};
            const dias = [];
            let dataAtual = inicio.clone();
            
            while (dataAtual.isSameOrBefore(fim, 'day')) {
                const diaStr = dataAtual.format('DD/MM');
                dias.push(diaStr);
                dadosPorDia[diaStr] = { producao: 0, perdas: 0 };
                dataAtual.add(1, 'day');
            }
            
            // Preencher dados
            registros.forEach(registro => {
                const diaStr = moment(registro.data).format('DD/MM');
                if (dadosPorDia[diaStr]) {
                    if (registro.tipo === 'normal') {
                        dadosPorDia[diaStr].producao += registro.liquido || 0;
                    } else if (registro.tipo === 'perda') {
                        dadosPorDia[diaStr].perdas += registro.pesoInicial || 0;
                    }
                }
            });
            
            this.dailyEvolutionChart = new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: dias,
                    datasets: [
                        {
                            label: 'Produção (kg)',
                            data: dias.map(dia => dadosPorDia[dia].producao),
                            borderColor: '#27ae60',
                            backgroundColor: 'rgba(39, 174, 96, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Perdas (kg)',
                            data: dias.map(dia => dadosPorDia[dia].perdas),
                            borderColor: '#e74c3c',
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Peso (kg)'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(3)} kg`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    async gerarPDF() {
    const inicio = document.getElementById('advanced-start').value;
    const fim = document.getElementById('advanced-end').value;
    const tipoRelatorio = document.getElementById('filter-tipo-detalhado').value;
    const nomeProduto = document.getElementById('filter-product-name').value;
    const codigoProduto = document.getElementById('filter-product-code').value;
    
    if (!inicio || !fim) {
        this.mostrarNotificacao('Selecione um período válido para gerar o PDF', 'error');
        return;
    }
    
    // Filtrar registros pelo período
    let registrosPeriodo = [...this.registros];
    
    // Filtrar por período
    if (inicio && fim) {
        const dataInicio = moment(inicio).startOf('day');
        const dataFim = moment(fim).endOf('day');
        
        registrosPeriodo = registrosPeriodo.filter(registro => {
            const dataRegistro = moment(registro.data);
            return dataRegistro.isBetween(dataInicio, dataFim, null, '[]');
        });
    }
    
    // Aplicar todos os filtros
    if (tipoRelatorio !== 'all') {
        registrosPeriodo = registrosPeriodo.filter(registro => registro.tipo === tipoRelatorio);
    }
    
    if (nomeProduto) {
        registrosPeriodo = registrosPeriodo.filter(registro => 
            registro.produto.toLowerCase().includes(nomeProduto.toLowerCase())
        );
    }
    
    if (codigoProduto) {
        registrosPeriodo = registrosPeriodo.filter(registro => 
            registro.codigo.toString().includes(codigoProduto)
        );
    }
    
    if (registrosPeriodo.length === 0) {
        this.mostrarNotificacao('Nenhum registro encontrado no período para gerar PDF', 'warning');
        return;
    }
    
    try {
        // Carregar a biblioteca jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');
        
        let yPos = 50;
        
        // Cabeçalho profissional
        doc.setFontSize(24);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'bold');
        doc.text('RELATÓRIO DE PRODUÇÃO - POR PRODUTO', 40, yPos);
        yPos += 35;
        
        // Linha decorativa
        doc.setDrawColor(41, 98, 255);
        doc.setLineWidth(2);
        doc.line(40, yPos, 555, yPos);
        yPos += 20;
        
        // Informações do período
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(`Período: ${moment(inicio).locale('pt-br').format('DD/MM/YYYY')} até ${moment(fim).locale('pt-br').format('DD/MM/YYYY')}`, 40, yPos);
        yPos += 15;
        doc.text(`Gerado em: ${moment().locale('pt-br').format('DD/MM/YYYY HH:mm')}`, 40, yPos);
        yPos += 30;
        
        // Agrupar registros por produto para resumo individual
        const produtosAgrupados = {};
        
        registrosPeriodo.forEach(registro => {
            const chave = `${registro.codigo}-${registro.produto}`;
            
            if (!produtosAgrupados[chave]) {
                produtosAgrupados[chave] = {
                    produto: registro.produto,
                    codigo: registro.codigo,
                    producaoNormal: [],
                    producaoSobras: [],
                    producaoPerdas: [],
                    totalProducao: 0,
                    totalProducaoValor: 0,
                    totalSobras: 0,
                    totalSobrasPrejuizo: 0,
                    totalPerdas: 0,
                    totalPerdasPrejuizo: 0
                };
            }
            
            if (registro.tipo === 'normal') {
                produtosAgrupados[chave].producaoNormal.push(registro);
                produtosAgrupados[chave].totalProducao += registro.liquido || 0;
                produtosAgrupados[chave].totalProducaoValor += registro.valorTotal || 0;
            } else if (registro.tipo === 'sobra') {
                produtosAgrupados[chave].producaoSobras.push(registro);
                produtosAgrupados[chave].totalSobras += registro.pesoInicial || 0;
                produtosAgrupados[chave].totalSobrasPrejuizo += registro.prejuizo || 0;
            } else if (registro.tipo === 'perda') {
                produtosAgrupados[chave].producaoPerdas.push(registro);
                produtosAgrupados[chave].totalPerdas += registro.pesoInicial || 0;
                produtosAgrupados[chave].totalPerdasPrejuizo += registro.prejuizo || 0;
            }
        });
        
        // Calcular totais gerais para o relatório
        const totalGeralProducao = Object.values(produtosAgrupados).reduce((sum, prod) => sum + prod.totalProducao, 0);
        const totalGeralProducaoValor = Object.values(produtosAgrupados).reduce((sum, prod) => sum + prod.totalProducaoValor, 0);
        const totalGeralSobras = Object.values(produtosAgrupados).reduce((sum, prod) => sum + prod.totalSobras, 0);
        const totalGeralPerdas = Object.values(produtosAgrupados).reduce((sum, prod) => sum + prod.totalPerdas, 0);
        const totalGeralPrejuizo = Object.values(produtosAgrupados).reduce((sum, prod) => 
            sum + prod.totalSobrasPrejuizo + prod.totalPerdasPrejuizo, 0);
        
        // RESULTADO GERAL (visão rápida)
        doc.setFontSize(14);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'bold');
        doc.text('RESULTADO GERAL DO PERÍODO', 40, yPos);
        yPos += 20;
        
        // Quadro de resultado geral
        doc.setFillColor(245, 247, 255);
        doc.rect(40, yPos, 515, 50, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(40, yPos, 515, 50);
        
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        
        // Coluna 1
        doc.text('Total Produção:', 50, yPos + 20);
        doc.text('Valor Total:', 50, yPos + 35);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(`${totalGeralProducao.toFixed(3)} kg`, 150, yPos + 20);
        doc.text(totalGeralProducaoValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 150, yPos + 35);
        
        // Coluna 2
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Total Sobras:', 250, yPos + 20);
        doc.text('Total Perdas:', 250, yPos + 35);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(`${totalGeralSobras.toFixed(3)} kg`, 350, yPos + 20);
        doc.text(`${totalGeralPerdas.toFixed(3)} kg`, 350, yPos + 35);
        
        // Coluna 3
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Prejuízo Total:', 450, yPos + 20);
        doc.text('Produtos:', 450, yPos + 35);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(231, 76, 60);
        doc.text(totalGeralPrejuizo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 540, yPos + 20);
        doc.setTextColor(30, 30, 30);
        doc.text(Object.keys(produtosAgrupados).length.toString(), 540, yPos + 35);
        
        yPos += 70;
        
        // Agora, para cada produto individualmente
        Object.values(produtosAgrupados).forEach((prod, index) => {
            // Verificar se precisa de nova página
            if (yPos > 650) {
                doc.addPage();
                yPos = 50;
            }
            
            // Título do produto
            doc.setFontSize(16);
            doc.setTextColor(41, 98, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(`${prod.produto} (Código: ${prod.codigo})`, 40, yPos);
            yPos += 25;
            
            // Resumo individual do produto
            doc.setFontSize(12);
            doc.setTextColor(30, 30, 30);
            doc.setFont('helvetica', 'bold');
            doc.text('RESUMO DO PRODUTO:', 40, yPos);
            yPos += 20;
            
            // Quadro de resumo individual
            doc.setFillColor(248, 249, 250);
            doc.rect(40, yPos, 515, 60, 'F');
            doc.setDrawColor(200, 200, 200);
            doc.rect(40, yPos, 515, 60);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            // Linha 1: Produção
            doc.setTextColor(100, 100, 100);
            doc.text('Produção Normal:', 50, yPos + 20);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(`${prod.totalProducao.toFixed(3)} kg`, 150, yPos + 20);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Valor Total:', 200, yPos + 20);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(39, 174, 96);
            doc.text(prod.totalProducaoValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 280, yPos + 20);
            
            // Linha 2: Sobras
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Sobras Transformadas:', 50, yPos + 35);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(`${prod.totalSobras.toFixed(3)} kg`, 150, yPos + 35);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Prejuízo Sobras:', 200, yPos + 35);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(52, 152, 219);
            doc.text(prod.totalSobrasPrejuizo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 280, yPos + 35);
            
            // Linha 3: Perdas
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Perdas/Descartes:', 50, yPos + 50);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(`${prod.totalPerdas.toFixed(3)} kg`, 150, yPos + 50);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Prejuízo Perdas:', 200, yPos + 50);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(231, 76, 60);
            doc.text(prod.totalPerdasPrejuizo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 280, yPos + 50);
            
            // Calcular Eficiência
            const pesoTotal = prod.totalProducao + prod.totalSobras + prod.totalPerdas;
            const eficiencia = pesoTotal > 0 ? (prod.totalProducao / pesoTotal) * 100 : 0;
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Eficiência:', 350, yPos + 35);
            doc.setFont('helvetica', 'bold');
            
            // Cor da eficiência baseada no valor
            if (eficiencia >= 80) {
                doc.setTextColor(39, 174, 96);
            } else if (eficiencia >= 60) {
                doc.setTextColor(241, 196, 15);
            } else {
                doc.setTextColor(231, 76, 60);
            }
            
            doc.text(`${eficiencia.toFixed(1)}%`, 420, yPos + 35);
            
            yPos += 80;
            
            // Detalhamento da Produção Normal (se houver)
            if (prod.producaoNormal.length > 0) {
                doc.setFontSize(12);
                doc.setTextColor(39, 174, 96);
                doc.setFont('helvetica', 'bold');
                doc.text('DETALHAMENTO DA PRODUÇÃO NORMAL:', 40, yPos);
                yPos += 20;
                
                const headersProducao = [['Data', 'Peso Líq. (kg)', 'Valor/kg (R$)', 'Valor Total (R$)']];
                const dataProducao = prod.producaoNormal.map(registro => [
                    moment(registro.data).locale('pt-br').format('DD/MM/YYYY HH:mm'),
                    registro.liquido.toFixed(3),
                    registro.valorKg.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    registro.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                ]);
                
                doc.autoTable({
                    startY: yPos,
                    head: headersProducao,
                    body: dataProducao,
                    theme: 'striped',
                    headStyles: {
                        fillColor: [39, 174, 96],
                        textColor: [255, 255, 255],
                        fontSize: 9,
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        fontSize: 8
                    },
                    margin: { left: 40, right: 40 },
                    tableWidth: 'auto'
                });
                
                yPos = doc.lastAutoTable.finalY + 20;
            }
            
            // Detalhamento das Sobras (se houver)
            if (prod.producaoSobras.length > 0) {
                doc.setFontSize(12);
                doc.setTextColor(52, 152, 219);
                doc.setFont('helvetica', 'bold');
                doc.text('TRANSFORMAÇÕES DE SOBRAS:', 40, yPos);
                yPos += 20;
                
                const headersSobras = [['Data', 'Peso Inicial (kg)', 'Destino', 'Peso Final (kg)', 'Prejuízo (R$)']];
                const dataSobras = prod.producaoSobras.map(registro => [
                    moment(registro.data).locale('pt-br').format('DD/MM/YYYY HH:mm'),
                    registro.pesoInicial.toFixed(3),
                    registro.destino === 'farinha' ? 'Farinha de Rosca' : 'Torrada Simples',
                    registro.pesoFinal.toFixed(3),
                    registro.prejuizo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                ]);
                
                doc.autoTable({
                    startY: yPos,
                    head: headersSobras,
                    body: dataSobras,
                    theme: 'striped',
                    headStyles: {
                        fillColor: [52, 152, 219],
                        textColor: [255, 255, 255],
                        fontSize: 9,
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        fontSize: 8
                    },
                    margin: { left: 40, right: 40 },
                    tableWidth: 'auto'
                });
                
                yPos = doc.lastAutoTable.finalY + 20;
            }
            
            // Detalhamento das Perdas (se houver)
            if (prod.producaoPerdas.length > 0) {
                doc.setFontSize(12);
                doc.setTextColor(231, 76, 60);
                doc.setFont('helvetica', 'bold');
                doc.text('PERDAS E DESCARTES:', 40, yPos);
                yPos += 20;
                
                const headersPerdas = [['Data', 'Peso Perdido (kg)', 'Valor Perdido (R$)', 'Observações']];
                const dataPerdas = prod.producaoPerdas.map(registro => [
                    moment(registro.data).locale('pt-br').format('DD/MM/YYYY HH:mm'),
                    registro.pesoInicial.toFixed(3),
                    registro.prejuizo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    registro.observacoes || '-'
                ]);
                
                doc.autoTable({
                    startY: yPos,
                    head: headersPerdas,
                    body: dataPerdas,
                    theme: 'striped',
                    headStyles: {
                        fillColor: [231, 76, 60],
                        textColor: [255, 255, 255],
                        fontSize: 9,
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        fontSize: 8
                    },
                    margin: { left: 40, right: 40 },
                    tableWidth: 'auto'
                });
                
                yPos = doc.lastAutoTable.finalY + 40;
            }
            
            // Linha separadora entre produtos (exceto o último)
            if (index < Object.values(produtosAgrupados).length - 1) {
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.5);
                doc.line(40, yPos, 555, yPos);
                yPos += 20;
            }
        });
        
        // Adicionar página de análise final se houver múltiplos produtos
        if (Object.keys(produtosAgrupados).length > 1) {
            doc.addPage();
            yPos = 50;
            
            doc.setFontSize(16);
            doc.setTextColor(30, 30, 30);
            doc.setFont('helvetica', 'bold');
            doc.text('ANÁLISE COMPARATIVA ENTRE PRODUTOS', 40, yPos);
            yPos += 30;
            
            // Tabela comparativa
            const headersComparacao = [['Produto', 'Produção (kg)', 'Valor (R$)', 'Sobras (kg)', 'Perdas (kg)', 'Prejuízo (R$)', 'Eficiência']];
            
            const dataComparacao = Object.values(produtosAgrupados).map(prod => {
                const pesoTotal = prod.totalProducao + prod.totalSobras + prod.totalPerdas;
                const eficiencia = pesoTotal > 0 ? (prod.totalProducao / pesoTotal) * 100 : 0;
                
                return [
                    prod.produto,
                    prod.totalProducao.toFixed(3),
                    prod.totalProducaoValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    prod.totalSobras.toFixed(3),
                    prod.totalPerdas.toFixed(3),
                    (prod.totalSobrasPrejuizo + prod.totalPerdasPrejuizo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    `${eficiencia.toFixed(1)}%`
                ];
            });
            
            // Ordenar por produção (maior para menor)
            dataComparacao.sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
            
            doc.autoTable({
                startY: yPos,
                head: headersComparacao,
                body: dataComparacao,
                theme: 'grid',
                headStyles: {
                    fillColor: [41, 98, 255],
                    textColor: [255, 255, 255],
                    fontSize: 9,
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    fontSize: 8
                },
                margin: { left: 40, right: 40 },
                styles: {
                    cellPadding: 5,
                    overflow: 'linebreak'
                },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { cellWidth: 70, halign: 'right' },
                    2: { cellWidth: 80, halign: 'right' },
                    3: { cellWidth: 70, halign: 'right' },
                    4: { cellWidth: 70, halign: 'right' },
                    5: { cellWidth: 80, halign: 'right' },
                    6: { cellWidth: 60, halign: 'right' }
                },
                didParseCell: function(data) {
                    // Colorir células de eficiência
                    if (data.column.index === 6) {
                        const eficiencia = parseFloat(data.cell.text[0]);
                        if (eficiencia >= 80) {
                            data.cell.styles.fillColor = [232, 245, 233];
                            data.cell.styles.textColor = [39, 174, 96];
                        } else if (eficiencia >= 60) {
                            data.cell.styles.fillColor = [255, 253, 231];
                            data.cell.styles.textColor = [241, 196, 15];
                        } else {
                            data.cell.styles.fillColor = [255, 243, 224];
                            data.cell.styles.textColor = [230, 126, 34];
                        }
                    }
                    
                    // Colorir células de prejuízo
                    if (data.column.index === 5) {
                        const valor = parseFloat(data.cell.text[0].replace('R$', '').replace('.', '').replace(',', '.'));
                        if (valor > 0) {
                            data.cell.styles.fillColor = [255, 235, 238];
                            data.cell.styles.textColor = [231, 76, 60];
                        }
                    }
                }
            });
            
            yPos = doc.lastAutoTable.finalY + 30;
            
            // Conclusão
            doc.setFontSize(12);
            doc.setTextColor(30, 30, 30);
            doc.setFont('helvetica', 'bold');
            doc.text('CONCLUSÃO:', 40, yPos);
            yPos += 20;
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`O período analisado compreende ${Object.keys(produtosAgrupados).length} produtos diferentes, ` +
                    `com produção total de ${totalGeralProducao.toFixed(3)} kg e valor total de ` +
                    `${totalGeralProducaoValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. ` +
                    `O prejuízo total das sobras e perdas foi de ` +
                    `${totalGeralPrejuizo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`, 
                    40, yPos, { maxWidth: 515 });
        }
        
        // Rodapé em todas as páginas
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Rodapé com informações
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont('helvetica', 'normal');
            
            // Linha do rodapé
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(40, doc.internal.pageSize.height - 40, 555, doc.internal.pageSize.height - 40);
            
            // Textos do rodapé
            doc.text('Sistema de Controle de Produção • Relatório por Produto', 40, doc.internal.pageSize.height - 25);
            doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 100, doc.internal.pageSize.height - 25);
            
            // Adicionar logo ou identificação da empresa
            if (i === 1) {
                doc.setFontSize(10);
                doc.setTextColor(41, 98, 255);
                doc.setFont('helvetica', 'bold');
                doc.text('CONTROLE DE PRODUÇÃO E QUALIDADE', doc.internal.pageSize.width / 2, 30, { align: 'center' });
            }
        }
        
        // Salvar PDF
        const nomeArquivo = `relatorio_producao_${moment().format('YYYYMMDD_HHmmss')}.pdf`;
        doc.save(nomeArquivo);
        
        this.mostrarNotificacao(`PDF gerado com sucesso: ${nomeArquivo}`, 'success');
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        this.mostrarNotificacao('Erro ao gerar PDF. Verifique se todos os dados estão corretos.', 'error');
    }
}
    
    mostrarModal(mensagem, callbackConfirmar) {
        document.getElementById('modal-message').textContent = mensagem;
        document.getElementById('confirmation-modal').style.display = 'flex';
        
        const confirmar = document.getElementById('modal-confirm');
        const novoConfirmar = confirmar.cloneNode(true);
        confirmar.parentNode.replaceChild(novoConfirmar, confirmar);
        
        novoConfirmar.addEventListener('click', () => {
            callbackConfirmar();
            this.fecharModal();
        });
    }
    
    fecharModal() {
        document.getElementById('confirmation-modal').style.display = 'none';
    }
    
    mostrarNotificacao(mensagem, tipo = 'success') {
        const notification = document.getElementById('notification');
        const message = document.getElementById('notification-message');
        const icon = document.getElementById('notification-icon');
        
        message.textContent = mensagem;
        notification.className = `notification ${tipo}`;
        
        // Definir ícone baseado no tipo
        if (tipo === 'success') {
            icon.className = 'fas fa-check-circle';
        } else if (tipo === 'error') {
            icon.className = 'fas fa-exclamation-circle';
        } else if (tipo === 'warning') {
            icon.className = 'fas fa-exclamation-triangle';
        }
        
        notification.style.display = 'flex';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }
}

// Inicializar o sistema quando a página carregar
let sistema;
document.addEventListener('DOMContentLoaded', () => {
    sistema = new SistemaProducao();
});