# Configuração do VSCode para Techno Sutra Unified

Este documento explica como configurar o Visual Studio Code para trabalhar com o projeto Techno Sutra Unified.

## Extensões Recomendadas

Ao abrir o projeto no VSCode, você será solicitado a instalar as extensões recomendadas. As principais extensões incluem:

- **TypeScript e JavaScript**: Suporte avançado para TypeScript/JavaScript
- **Tailwind CSS**: IntelliSense e autocomplete para classes Tailwind
- **Prettier**: Formatação automática de código
- **ESLint**: Linting de código JavaScript/TypeScript
- **React Snippets**: Snippets para desenvolvimento React
- **Path Intellisense**: Auto-completar caminhos de importação
- **Auto Rename Tag**: Renomear tags HTML automaticamente

## Configurações do Workspace

O projeto inclui configurações específicas em `.vscode/settings.json`:

- **Formatação automática** ao salvar arquivos
- **Fix automático de erros ESLint** ao salvar
- **Organização automática de imports** ao salvar
- **Configuração do Tailwind CSS** para reconhecer classes em arquivos TypeScript/React
- **Configuração do Emmet** para JSX/TSX
- **Exclusão de pastas** como node_modules, dist e build do explorer e search

## Tarefas Disponíveis

O projeto define tarefas VSCode para os principais scripts npm:

- `dev`: Iniciar servidor de desenvolvimento
- `build`: Build de produção
- `build:dev`: Build de desenvolvimento
- `preview`: Visualizar build localmente
- `lint`: Verificar erros de lint
- `deploy`: Deploy para GitHub Pages
- `predeploy`: Preparação para deploy

Para executar uma tarefa, use `Ctrl+Shift+P` e digite "Tasks: Run Task" ou use o menu Terminal → Run Task.

## Debugging

Configurações de debugging estão disponíveis em `.vscode/launch.json`:

- **Launch Chrome**: Abre o aplicativo no Chrome para debugging
- **Launch Vite Server**: Inicia o servidor Vite com debugging

## Snippets Úteis

### React Components
- `rfc` - React Function Component
- `useEffect` - useEffect hook
- `useState` - useState hook

### Tailwind CSS
- Classes são autocompletadas automaticamente
- Use `Ctrl+Espaço` para ver sugestões de classes

## Atalhos Úteis

- `Ctrl+Shift+P`: Command Palette
- `Ctrl+P`: Quick Open
- `Ctrl+Shift+F`: Search in files
- `Ctrl+Shift+G`: Git
- `Ctrl+``: Toggle terminal
- `Alt+Shift+F`: Format document
- `Ctrl+Shift+V`: Markdown preview

## Dicas de Produtividade

1. **Auto Imports**: O TypeScript automaticamente sugere e adiciona imports
2. **Rename Symbol**: `F2` para renomear variáveis, funções, etc. em todo o projeto
3. **Go to Definition**: `F12` para ir para a definição de uma função/variável
4. **Find All References**: `Shift+F12` para encontrar todas as referências
5. **Peek Definition**: `Alt+F12` para ver definição sem sair do arquivo atual

## Problemas Comuns

### Extensões não estão funcionando
- Certifique-se de que todas as extensões recomendadas estão instaladas
- Reinicie o VSCode após instalar as extensões

### Formatação não está funcionando
- Verifique se o Prettier está instalado
- Confirme que as configurações de formatação estão habilitadas no settings.json

### IntelliSense do Tailwind não está funcionando
- Certifique-se de que a extensão Tailwind CSS está instalada
- Reinicie o servidor Tailwind com `Ctrl+Shift+P` → "Tailwind CSS: Restart IntelliSense Server"

### Debugging não está funcionando
- Certifique-se de que o servidor de desenvolvimento está rodando
- Verifique se a porta correta (5173) está configurada no launch.json
