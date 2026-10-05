# Sistema de Gestão Acadêmica

Projeto prático da disciplina **CIN0135 - Estruturas de Dados Orientadas a Objetos (EDOO)**, CIn/UFPE.

É um sistema de terminal (menu de texto), feito em **C++** com banco de dados **SQLite**, para cuidar de alunos, professores, disciplinas, turmas e matrículas, com notas, frequência e situação de cada aluno (aprovado ou reprovado).

## Links

- 📄 Relatório: _em breve_
- 🌐 GitHub Pages: https://fbelt.github.io/Projeto-EDOO-/
- 🎥 Vídeo no YouTube: _em breve_

## Como compilar e rodar

Você precisa do **g++** (MinGW no Windows). Na pasta do projeto:

```
mingw32-make
./sistema
```

No Linux/Mac, troque `mingw32-make` por `make`.

A primeira compilação demora uns 15 segundos porque compila o SQLite junto. Depois disso fica rápido.

Na primeira vez que roda, o programa cria o banco em `data/escola.db` e coloca dados de exemplo nele. Para recomeçar do zero, é só apagar esse arquivo.

> Rode sempre de dentro da pasta do projeto (o caminho do banco é `data/escola.db`).
> O menu usa cores e caracteres Unicode: no Windows, use o **Windows Terminal** (o `cmd` antigo pode mostrar símbolos estranhos).

## Como usar

Ao abrir, escolha um perfil. Em qualquer tela, `0` volta e `?` abre a ajuda.

| Perfil | O que dá para fazer |
|---|---|
| **Administrador** | CRUD de alunos, professores e disciplinas · criar, encerrar e remover turmas · matricular e desmatricular · busca · relatório de turma · histórico escolar |
| **Professor** | ver turmas e alunos · lançar e editar notas · fazer chamada · lançar prova final · encerrar turma |
| **Aluno** | disciplinas do semestre · notas · frequência · situação · horário semanal · histórico escolar |

Para testar com os dados de exemplo: professor **Ana Souza** (turma EDOO, aberta) e aluno **Joao Silva** (tem uma turma encerrada e uma aberta).

## Interface web (bônus)

Além do menu no terminal, o sistema tem uma interface gráfica feita em **React**. Ela usa as mesmas classes C++ e o mesmo banco.

**1. Compilar o servidor**

```
make servidor            # Linux / Mac
mingw32-make servidor    # Windows
```

**2. Ligar o servidor**

```
./servidor               # Linux / Mac
.\servidor.exe           # Windows (PowerShell)
```

**3. Abrir no navegador:** http://localhost:8080 (o mesmo login de teste: professor **Ana Souza** ou aluno **Joao Silva**).

Como funciona: o navegador não consegue chamar classes C++ direto. Por isso o `servidor` (em `api/server.cpp`) fica ouvindo em `localhost:8080`. Ele entrega as telas (a pasta `web/dist`) e responde os pedidos do React em JSON, chamando as classes do grupo. As regras de aprovação, de vagas etc. continuam todas no C++.

**Só para quem for mudar as telas** (precisa do Node.js). Com o servidor ligado, em outro terminal:

```
cd web
npm install
npm run dev              # abra a URL que aparecer (normalmente http://localhost:5173)
npm run build            # no fim, atualiza a pasta web/dist
```

Em modo de desenvolvimento, os pedidos para `/api` são repassados para o servidor na porta 8080 (veja `web/vite.config.js`).

> No Windows, o servidor precisa de um MinGW com suporte a threads (por exemplo o do MSYS2 ou o WinLibs).

## Estrutura do projeto

```
include/   arquivos .h (declaração de cada classe)
src/       arquivos .cpp (código de cada classe) e o main.cpp
sqlite/    biblioteca SQLite, baixada de sqlite.org (não foi escrita pelo grupo)
data/      onde fica o arquivo do banco (escola.db)
docs/      explicação da parte de cada integrante e o site (GitHub Pages)
api/       servidor da interface web (server.cpp) e a biblioteca cpp-httplib (não foi escrita pelo grupo)
web/       interface web em React
```

Cada classe tem um par de arquivos: um `.h` e um `.cpp` com o mesmo nome.

## Classes

| Classe | O que é |
|---|---|
| `Person` | Pessoa (classe **abstrata**): nome, CPF, data de nascimento, contato |
| `Student` | Aluno, herda de `Person`: matrícula e curso |
| `Teacher` | Professor, herda de `Person`: matrícula funcional e disciplinas |
| `Discipline` | Disciplina: código, nome, carga horária, ementa, professor responsável |
| `ClassGroup` | Turma: disciplina, semestre, horário, limite de vagas e alunos matriculados |
| `Enrollment` | Matrícula de um aluno numa turma: notas, frequência e situação |
| `FinalExamEnrollment` | Matrícula de disciplina com prova final (muda a regra de aprovação) |
| `PersonFactory` | Cria um `Student` ou um `Teacher` a partir de um texto ("aluno" ou "professor") |
| `PersonCRUD` | Guarda alunos e professores na memória |
| `Database` | Conexão com o banco SQLite (Singleton) |
| `StudentRepository`, `TeacherRepository`, `DisciplineRepository`, `ClassGroupRepository`, `EnrollmentRepository` | Salvam e buscam cada tipo de objeto no banco |
| `SchoolData` | Guarda na memória tudo o que foi carregado do banco (alunos, professores, disciplinas, turmas) |
| Menus (`MenuMain`, `MenuAdmin`, `MenuTeacher`, `MenuStudent`, `MenuShared`) | As telas de cada perfil |
| `Input` | Validação do que o usuário digita (números, notas, CPF, data, sim/não) |
| `ui` | Parte visual do terminal: cores, tabelas e caixas |

## Conceitos de Orientação a Objetos

| Conceito | Onde aparece |
|---|---|
| **Classes e objetos** | Cada entidade do sistema é uma classe (tabela acima) |
| **Herança** | `Student` e `Teacher` herdam de `Person`. `FinalExamEnrollment` herda de `Enrollment` |
| **Classe abstrata** | `Person` tem o método puro `exibirInfo() = 0`, então não dá para criar uma `Person` direto |
| **Encapsulamento** | Atributos como CPF, notas e frequência são `private` e só são acessados por getters e setters |
| **Polimorfismo** | `exibirInfo()` mostra coisas diferentes para aluno e professor. `calculateStatus()` usa uma regra em `Enrollment` e outra em `FinalExamEnrollment` |
| **Ponteiros e referências** | `ClassGroup` guarda as matrículas como ponteiros (`vector<Enrollment*>`). Os métodos recebem objetos por referência, ex: `enroll(Student& s)` e `insert(Student& s)` |
| **Singleton** (bônus) | `Database` tem construtor privado e só um objeto, pego com `Database::getInstance()` |
| **Factory Method** (bônus) | `PersonFactory::criar("aluno", ...)` devolve um `Student`, e com `"professor"` devolve um `Teacher` |

## Regras de negócio

- A turma tem limite de vagas: não dá para matricular acima dele.
- O mesmo aluno não pode ser matriculado duas vezes na mesma turma.
- Turma encerrada não aceita matrícula. Enquanto a turma não acaba, a situação do aluno é "Cursando".
- **Disciplina sem prova final:** frequência abaixo de 75% reprova por falta. Média 7 ou mais aprova.
- **Disciplina com prova final:** média 7 ou mais aprova, abaixo de 3 reprova. Entre 3 e 7 o aluno faz a final e passa se (média + final) / 2 for 5 ou mais.

## Banco de dados

O banco é um arquivo SQLite com 6 tabelas: `pessoas`, `disciplinas`, `turmas`, `matriculas`, `notas` e `frequencia`.

As classes do sistema não têm SQL dentro delas. Quem conversa com o banco são os **repositórios**. Mais detalhes em [`docs/integrante3.md`](docs/integrante3.md).

## Situação atual

- [x] Pessoa, Aluno, Professor e Factory
- [x] Disciplina, Turma e Matrícula, com as regras de aprovação
- [x] Banco de dados SQLite, repositórios e dados de exemplo
- [x] Menu no terminal (Administrador, Professor e Aluno)
- [x] Interface web em React (bônus)
- [x] GitHub Pages (falta o link do vídeo)
- [ ] Relatório e vídeo

## Equipe

| Integrante | Parte | Documentação |
|---|---|---|
| Pedro Henrique | Pessoa, Aluno, Professor e Factory | [`docs/integrante1.md`](docs/integrante1.md) |
| Felipe Belfort | Disciplina, Turma e Matrícula | [`docs/integrante2.md`](docs/integrante2.md) |
| Gabriel Geller | Estrutura do projeto e banco de dados (SQLite) | [`docs/integrante3.md`](docs/integrante3.md) |
| Luis Henrique | Menu no terminal, relatório e vídeo | [`docs/integrante4.md`](docs/integrante4.md) |
