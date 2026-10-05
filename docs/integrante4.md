# Integrante 4 — Interface de console e entrega

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `main.cpp` | Abre o banco, carrega os dados e chama o menu principal |
| `SchoolData` | Struct com as 4 listas do sistema (alunos, professores, disciplinas, turmas) e buscas por código |
| `MenuMain.cpp` | Menu principal: escolha do perfil |
| `MenuAdmin.cpp` | Menu do Administrador |
| `MenuTeacher.cpp` | Menu do Professor |
| `MenuStudent.cpp` | Menu do Aluno |
| `MenuShared.cpp` | Telas usadas por mais de um perfil: listas para escolher, relatório da turma, histórico, horário e ajuda |
| `Input` | Validação de entrada |
| `Ui` | Só a aparência: cores, tabelas e caixas. Não tem regra do sistema |

## Como o menu funciona

1. O `main` carrega tudo do banco para a memória, guardando em um `SchoolData`.
2. Cada menu é um `while (true)` que desenha a tela, lê a opção e chama uma função.
3. Toda ação segue o mesmo padrão:
   - **pede os dados** (com as funções de `Input`)
   - **muda o objeto na memória** (ex: `turma->enroll(aluno)`)
   - **salva no banco** com o repositório (ex: `enrollmentRepo.save(...)`)
4. A opção `0` sai do `while` e volta para o menu anterior.

```cpp
// exemplo: matricular (MenuAdmin.cpp)
g->enroll(*s);                               // memória
EnrollmentRepository repo;
repo.save(*g, *g->findEnrollment(*s));       // banco
```

## Conceitos de OOP que aparecem no menu

- **Polimorfismo:** na ficha do aluno ou do professor, o menu usa um `Person*` e chama `exibirInfo()`. O C++ escolhe a versão de `Student` ou de `Teacher` na hora de rodar. No relatório, `calculateStatus()` usa a regra normal ou a regra com prova final, dependendo do tipo da matrícula.
- **Referências:** os menus recebem `SchoolData&`, `Teacher&` e `Student&`, sem copiar nada.
- **Ponteiros:** as listas guardam ponteiros (`vector<Student*>`). Ao remover alguém, o menu tira o ponteiro da lista e dá `delete`.

## Validação de entrada (`Input`)

Cada função pergunta de novo até o valor ser válido:

| Função | O que aceita |
|---|---|
| `readInt(label, min, max)` | só números, dentro do intervalo |
| `readGrade` | nota de 0 a 10, com vírgula ou ponto (`7,5`) |
| `readCpf` | 11 dígitos, com ou sem pontos. Devolve `000.000.000-00` |
| `readDate` | `DD/MM/AAAA`. Devolve `AAAA-MM-DD` (formato do banco) |
| `readText` | não aceita vazio nem apóstrofo (o `'` quebraria o SQL) |
| `readYesNo` | `s` ou `n` |

## Regras de prevenção de erro do menu

- Antes de matricular, confere: turma encerrada, turma lotada e aluno repetido.
- Apagar aluno, professor, disciplina ou turma sempre pede confirmação.
- Professor que ainda tem turma e disciplina com turmas não podem ser apagados.
- Turma encerrada não aceita mais nota nem chamada.
- Matrícula precisa ser única entre alunos **e** professores, porque os dois ficam na tabela `pessoas`.

## Design da interface

Usei o guia de UI/UX da Loomi (heurísticas de Nielsen):

- **Status do sistema:** o caminho `Início › Perfil › Tela` fica sempre no topo, e cada perfil tem uma cor.
- **Controle do usuário:** a opção `0` sempre volta.
- **Prevenção de erro:** confirmação antes de apagar.
- **Reconhecer em vez de lembrar:** o usuário escolhe pelo número em uma tabela, não precisa decorar matrícula.
- **Mensagens de erro:** dizem o que aconteceu e como resolver.
- **Ajuda:** opção `?` em todos os menus.
- **Acessibilidade:** a cor nunca é o único sinal. Toda situação tem ícone e texto (✔ Aprovado, ✖ Reprovado).

## Mudança no Makefile

Coloquei `-std=c++17` no comando do `g++`. No Mac, o `g++` usa um padrão antigo do C++ e o projeto não compilava (`vector<vector<string>>` dava erro). No Windows, nada muda.

## Interface web (bônus)

Além do terminal, fiz uma interface gráfica em React que usa **o mesmo código C++**.

```
React (navegador)  ──pede──▶  servidor C++ (api/server.cpp)  ──chama──▶  classes do grupo + SQLite
                   ◀──JSON──
```

- `api/server.cpp` abre o endereço `http://localhost:8080`. Cada rota (ex: `/api/matriculas/criar`) faz o mesmo que o menu: lê os campos, muda o objeto na memória e salva com o repositório.
- A resposta é JSON montado com texto, ex: `{"nome": "Joao", "media": 8.5}`.
- A situação e a previsão vêm prontas do C++: `getStatus()` e `calculateStatus()` (polimorfismo). O React só mostra.
- O servidor atende **um pedido por vez** (`ThreadPool(1)`), para dois pedidos nunca mexerem nos dados ao mesmo tempo.
- A biblioteca `cpp-httplib` (`api/httplib.h`) é de terceiros, como o SQLite.

Design (guia da Loomi): espaçamento em múltiplos de 8, 8 tamanhos de texto (36 a 12), contraste mínimo de 4.5:1, um botão principal por tela, confirmação antes de apagar, mensagens que dizem o que fazer, caminho "Início › …" no topo, ajuda com `?` e busca com `/`.
