// Script para adicionar dados de teste ao localStorage
function addTestData() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    
    // Criar dados de teste com despesas dos últimos 6 meses
    const testData = {
        receitas: [
            // Centro Loja Online
            { id: 1, data: `${ano}-10-05`, descricao: 'Salário', tipo: 'salario', valor: 3000, centroId: 'centro-loja-online' },
            { id: 2, data: `${ano}-10-15`, descricao: 'Freelance', tipo: 'freelance', valor: 500, centroId: 'centro-loja-online' },
            // Centro Consultoria
            { id: 3, data: `${ano}-11-05`, descricao: 'Salário', tipo: 'salario', valor: 3000, centroId: 'centro-consultoria' },
            { id: 4, data: `${ano}-11-20`, descricao: 'Freelance', tipo: 'freelance', valor: 800, centroId: 'centro-consultoria' },
            // Centro Loja Online
            { id: 5, data: `${ano}-12-05`, descricao: 'Salário', tipo: 'salario', valor: 3000, centroId: 'centro-loja-online' },
            { id: 6, data: `${ano}-12-10`, descricao: 'Bônus', tipo: 'bonus', valor: 2000, centroId: 'centro-loja-online' },
            // Centro Consultoria
            { id: 7, data: `${ano + 1}-01-05`, descricao: 'Salário', tipo: 'salario', valor: 3000, centroId: 'centro-consultoria' },
            { id: 8, data: `${ano + 1}-01-15`, descricao: 'Freelance', tipo: 'freelance', valor: 600, centroId: 'centro-consultoria' }
        ],
        despesas: [
            // Centro Loja Online
            { id: 1, data: `${ano}-10-01`, descricao: 'Aluguel', categoria: 'moradia', tipo: 'recorrente', natureza: 'fixa', valor: 800, centroId: 'centro-loja-online' },
            { id: 2, data: `${ano}-10-05`, descricao: 'Mercado', categoria: 'alimentacao', tipo: 'recorrente', natureza: 'variavel', valor: 250, centroId: 'centro-loja-online' },
            { id: 3, data: `${ano}-10-10`, descricao: 'Cinema', categoria: 'lazer', tipo: 'eventual', natureza: 'variavel', valor: 60, centroId: 'centro-loja-online' },
            { id: 4, data: `${ano}-10-20`, descricao: 'Combustível', categoria: 'transporte', tipo: 'recorrente', natureza: 'variavel', valor: 200, centroId: 'centro-loja-online' },
            
            // Centro Consultoria
            { id: 5, data: `${ano}-11-01`, descricao: 'Aluguel', categoria: 'moradia', tipo: 'recorrente', natureza: 'fixa', valor: 800, centroId: 'centro-consultoria' },
            { id: 6, data: `${ano}-11-03`, descricao: 'Educação', categoria: 'educacao', tipo: 'recorrente', natureza: 'fixa', valor: 300, centroId: 'centro-consultoria' },
            { id: 7, data: `${ano}-11-08`, descricao: 'Mercado', categoria: 'alimentacao', tipo: 'recorrente', natureza: 'variavel', valor: 280, centroId: 'centro-consultoria' },
            { id: 8, data: `${ano}-11-15`, descricao: 'Médico', categoria: 'saude', tipo: 'eventual', natureza: 'variavel', valor: 150, centroId: 'centro-consultoria' },
            { id: 9, data: `${ano}-11-25`, descricao: 'Combustível', categoria: 'transporte', tipo: 'recorrente', natureza: 'variavel', valor: 180, centroId: 'centro-consultoria' },
            
            // Centro Loja Online
            { id: 10, data: `${ano}-12-01`, descricao: 'Aluguel', categoria: 'moradia', tipo: 'recorrente', natureza: 'fixa', valor: 800, centroId: 'centro-loja-online' },
            { id: 11, data: `${ano}-12-05`, descricao: 'Mercado', categoria: 'alimentacao', tipo: 'recorrente', natureza: 'variavel', valor: 300, centroId: 'centro-loja-online' },
            { id: 12, data: `${ano}-12-10`, descricao: 'Presentes', categoria: 'lazer', tipo: 'eventual', natureza: 'variavel', valor: 200, centroId: 'centro-loja-online' },
            { id: 13, data: `${ano}-12-15`, descricao: 'Academia', categoria: 'saude', tipo: 'recorrente', natureza: 'fixa', valor: 100, centroId: 'centro-loja-online' },
            { id: 14, data: `${ano}-12-20`, descricao: 'Combustível', categoria: 'transporte', tipo: 'recorrente', natureza: 'variavel', valor: 200, centroId: 'centro-loja-online' },
            
            // Centro Consultoria
            { id: 15, data: `${ano + 1}-01-01`, descricao: 'Aluguel', categoria: 'moradia', tipo: 'recorrente', natureza: 'fixa', valor: 800, centroId: 'centro-consultoria' },
            { id: 16, data: `${ano + 1}-01-05`, descricao: 'Mercado', categoria: 'alimentacao', tipo: 'recorrente', natureza: 'variavel', valor: 280, centroId: 'centro-consultoria' },
            { id: 17, data: `${ano + 1}-01-10`, descricao: 'Internet', categoria: 'moradia', tipo: 'recorrente', natureza: 'fixa', valor: 100, centroId: 'centro-consultoria' },
            { id: 18, data: `${ano + 1}-01-15`, descricao: 'Combustível', categoria: 'transporte', tipo: 'recorrente', natureza: 'variavel', valor: 200, centroId: 'centro-consultoria' }
        ],
        investimentos: [],
        centrosFinanceiros: [
            { id: 'centro-loja-online', nome: 'Loja Online', descricao: 'Receitas e despesas da loja digital', orcamento: 4500, alertaPercentual: 85, meta: 0 },
            { id: 'centro-consultoria', nome: 'Consultoria', descricao: 'Receitas e despesas de serviços de consultoria', orcamento: 3500, alertaPercentual: 80, meta: 0 }
        ],
        orcamento: 3500,
        meta: 2000,
        theme: 'light',
        userName: 'Você',
        categoriasReceitas: ['salario', 'bonus', 'freelance', 'investimentos', 'outros'],
        categoriasDespesas: ['alimentacao', 'moradia', 'transporte', 'lazer', 'saude', 'educacao', 'outros'],
        tiposInvestimentos: ['renda_fixa', 'renda_variavel', 'fundos', 'criptomoedas', 'outros']
    };
    
    localStorage.setItem('financeApp', JSON.stringify(testData));
    console.log('✅ Dados de teste adicionados! Recarregue a página para ver as mudanças.');
    window.location.reload();
}

// Executar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addTestData);
} else {
    addTestData();
}
