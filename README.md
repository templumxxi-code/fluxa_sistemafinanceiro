# 📊 Controle Financeiro Pessoal - Nova Funcionalidade

## ✨ Novo Gráfico: Despesas nos Últimos 6 Meses + Previsão

Você agora tem um gráfico visual completo que mostra:

### 📈 O que você vê no gráfico:

1. **Barras Vermelhas (Despesas Realizadas)**
   - Mostram suas despesas reais dos últimos 6 meses completos
   - Permite acompanhar o histórico de gastos passados

2. **Barras Rosa Claro (Previsão do Mês Atual)**
   - Calcula automaticamente quanto você tende a gastar até o final do mês
   - Baseado na média diária de gastos do mês atual
   - Ajuda você a se preparar para as próximas despesas

### 🧮 Como a previsão é calculada:

```
Previsão = Gastos até hoje + (Média diária × Dias restantes do mês)
```

**Exemplo prático:**
- Se você gastou R$ 500 nos primeiros 10 dias do mês
- Média diária = R$ 50 (500 ÷ 10)
- Com 20 dias restantes: 50 × 20 = R$ 1.000
- **Previsão final = R$ 500 + R$ 1.000 = R$ 1.500**

### 🎯 Como usar essa informação:

✅ **Para planejamento:** Veja se você está no caminho certo ou se precisa economizar
✅ **Para alertas:** Identifique meses de gastos altos no passado
✅ **Para metas:** Use o histórico para definir orçamentos realistas

### 📋 Outras melhorias incluídas:

- **Resumo Mensal (tabela):** Mostra despesas totais e sobras de cada mês
- **Gráfico de Receitas vs Despesas:** Comparação visual mensal
- **Gráfico de Despesas por Categoria:** Identifique onde você mais gasta

---

## 🚀 Como testar com dados de exemplo:

1. Abra o console do navegador (F12)
2. Vá até a aba "Console"
3. Cole este comando:
```javascript
fetch('test-data.js').then(r => r.text()).then(eval)
```

Ou simplesmente abra o arquivo `test-data.js` no navegador adicionando ao seu `index.html`:
```html
<script src="test-data.js"></script>
```

---

## 📌 Dicas importantes:

- Os gráficos se atualizam automaticamente quando você adiciona nova despesa
- A previsão é recalculada diariamente
- Você pode acompanhar sua evolução financeira ao longo dos meses
- Use o orçamento mensal para comparar com a previsão

**Aproveite seu novo sistema de controle financeiro! 💰**
