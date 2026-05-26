# Plano de Build — ODIN (revisado)

App técnico interno (desktop, dark) para consulta e cadastro de funções de diagnóstico automotivo. Frontend only, dados mock + persistência em localStorage.

## Stack
- Scaffold `web_app:odin` (template TanStack Start padrão da Lovable)
- Tailwind + CSS variables (paleta da spec)
- Zustand + persist
- Fuse.js + normalização sem acentos
- Lucide React
- Inter + JetBrains Mono via `@fontsource`
- Toast custom (~60 LOC)
- Animações em CSS puro, respeitando `prefers-reduced-motion`

## Estrutura de arquivos
```
src/
  data/mockData.ts            // 4 montadoras, ~2 modelos cada, 80/20 original/user
  types/index.ts
  store/useVehicleStore.ts    // persist; mocks só hidratam se vazio
  lib/
    fuzzy.ts                  // normalize + Fuse (índice normalizado)
    categories.ts             // itera categorias dinâmicas
    codes.ts                  // nextCode() incremental
    hotkeys.ts                // helper Ctrl/Cmd
  components/
    Tabs.tsx
    Combobox.tsx              // teclado completo ↑↓ Enter Esc
    Toast.tsx + ToastProvider.tsx
    DeleteInline.tsx
    SearchHistory.tsx
    VehicleResult.tsx
    GlobalCodeSearch.tsx
    forms/NewVehicleForm.tsx
    forms/ExistingVehicleForm.tsx
  routes/  (consulta default, adicionar)
  styles/tokens.css
```

## Fases

1. **Foundation** — scaffold, tokens, fontes, tipos, mock, store + persist, Toast, fuzzy + normalize, helpers (`nextCode`, hotkey).
2. **Aba Consulta** — 4 comboboxes em cascata (reset posteriores), teclado completo, botão Buscar, histórico recente (8, FIFO).
3. **Resultado** — 3 estados, header com contagens, seções colapsáveis por categoria dinâmica, deleção inline só p/ `origin: 'user'`.
4. **Busca global por código/descrição** — debounce 300ms, threshold 0.3, máx 20, destaque, clique preenche veículo.
5. **Adicionar — Novo veículo** — formulário com linhas dinâmicas, código incremental editável, validação inline, toast.
6. **Adicionar — Veículo existente** — autofill em cascata, lista existentes c/ badges, adiciona novas (`origin: 'user'`).
7. **Polish** — animações 120–200ms, focus rings, `aria-*`, contraste AA, `prefers-reduced-motion`.

## Pontos críticos (revisões aplicadas)

### 1. Atalhos: Ctrl em ambiente Windows
Todo handler de teclado usa dupla condição para portabilidade, mas labels exibidos dizem "Ctrl":
```ts
// lib/hotkeys.ts
export const isCtrl = (e: KeyboardEvent | React.KeyboardEvent) =>
  e.ctrlKey || e.metaKey;

// uso:
if (isCtrl(e) && e.key === 'Enter') runSearch();
```
- `Ctrl+Enter` em qualquer campo → busca (se todos preenchidos)
- `Enter` no último campo → busca
- Help overlay futuro: label "Ctrl" (nunca "⌘")

### 2. Fuse.js: normalização dos dois lados
Normalize aplicado **ao índice** e **à query**. Sem isso "Ônix" no mock não bate com "onix" digitado.
```ts
// lib/fuzzy.ts
const items = rawOptions.map(opt => ({
  original: opt,
  normalized: normalize(opt),
}));
const fuse = new Fuse(items, {
  keys: ['normalized'],
  threshold: 0.4,
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
});
const results = fuse.search(normalize(query));
// exibe results[].item.original
```
Para a busca global de função: índice tem `{ code, description, normalizedCode, normalizedDescription, vehicleRef }`, keys do Fuse apontam para os campos normalizados, threshold 0.3. `includeMatches: true` (sobre os campos normalizados) usado só para detectar match; o highlight no UI é feito por re-busca da substring normalizada sobre o texto original.

Ano permanece filtro exato (numérico, sem fuzzy).

### 3. Geração de código incremental
```ts
// lib/codes.ts
export function nextCode(prefix: string, existingCodes: string[]): string {
  const nums = existingCodes
    .filter(c => c.startsWith(prefix))
    .map(c => parseInt(c.slice(prefix.length), 10))
    .filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}
```
Regras:
- Sugestão = `max(códigos da categoria) + 1`. Modo existente: considera códigos já no veículo. Modo novo: considera só as linhas já adicionadas no form.
- Campo de código é **editável** — sugestão nunca é obrigatória.
- Ao adicionar nova linha, recalcula com base no estado atual (incluindo linhas não salvas) para evitar colisão sequencial.
- Validação inline: duplicata no mesmo veículo/categoria → "Código já existe neste veículo" em vermelho, bloqueia salvar.
- Remoção de linha não persistida apenas tira do array local; próxima sugestão recalcula.

## Demais detalhes
- **Cascata**: trocar campo N reseta N+1…4; posteriores ficam `disabled`.
- **Dropdown**: máx 8 visíveis com scroll, "Nenhuma opção encontrada" nunca vazio, Esc/click-fora fecham.
- **Deleção**: store rejeita silenciosamente se `origin === 'original'` (defesa em profundidade); UI já oculta `×`.
- **Categorias extensíveis**: `Object.keys(vehicle)` excluindo `['id','model','year','engine']`. Cor da tag: azul (actuation_test), roxo (special_functions), demais por hash do nome.
- **Histórico**: nova busca move entrada existente para o topo sem duplicar; `×` por item; "Limpar histórico" no fim.

## Fora de escopo
Backend/API, import em lote, export, auth, histórico de alterações, mobile.

Pronto pra implementar ao aprovar.