# Relatório — Sistema de Gestão Acadêmica

**Disciplina:** CIN0135 – Estruturas de Dados Orientadas a Objetos (EDOO), CIn/UFPE
**Equipe:** Pedro Henrique, Felipe Belfort, Gabriel Geller e Luis Henrique
**Repositório:** https://github.com/Fbelt/Projeto-EDOO-
**Página:** https://fbelt.github.io/Projeto-EDOO-/
**Vídeo:** _(colocar o link do YouTube)_

> Rascunho. As seções 4 a 6 juntam a documentação de cada integrante (`docs/integranteN.md`).

## 1. Descrição do sistema

O sistema gerencia a parte acadêmica de uma escola ou universidade: alunos, professores, disciplinas, turmas e matrículas, com notas, frequência e situação de cada aluno. Ele pode ser usado pelo menu de texto no terminal ou por uma interface web em React (bônus), e guarda os dados em um banco SQLite (um arquivo local). As duas interfaces usam as mesmas classes C++ e o mesmo banco.

O usuário entra em um de três perfis:

- **Administrador (secretaria):** cadastra, edita e remove alunos, professores e disciplinas; cria e encerra turmas; matricula e desmatricula alunos; faz buscas; gera o relatório da turma e o histórico escolar.
- **Professor:** vê as próprias turmas, lança e corrige notas, faz a chamada, lança a prova final e encerra a turma.
- **Aluno:** consulta disciplinas, notas, frequência, situação, horário semanal e histórico.

A situação do aluno é calculada automaticamente. Enquanto a turma está aberta, ele aparece como "Cursando". Quando a turma é encerrada, vale a regra da disciplina (seção 5).

## 2. Tecnologias

- **C++17**, compilado com g++ (MinGW no Windows)
- **SQLite** na versão "amalgamation" (um único arquivo `.c` compilado junto com o projeto)
- Interface no terminal, com cores ANSI e caracteres Unicode
- Interface web (bônus) em **React**, ligada às classes C++ por um pequeno servidor HTTP (`api/server.cpp`, com a biblioteca cpp-httplib)

## 3. Arquitetura

O projeto tem três camadas:

1. **Domínio:** as classes `Person`, `Student`, `Teacher`, `Discipline`, `ClassGroup`, `Enrollment` e `FinalExamEnrollment`. Elas têm as regras e não sabem que o banco existe.
2. **Persistência:** a classe `Database` (Singleton) e os repositórios (`StudentRepository` etc.). Só eles têm SQL.
3. **Interface:** os menus, a validação de entrada (`Input`) e a parte visual (`ui`).

Ao abrir, o programa carrega tudo do banco para a memória. Cada ação muda o objeto na memória e depois chama o repositório para salvar.

_(inserir aqui o diagrama UML da página)_

## 4. Conceitos de Orientação a Objetos

| Conceito | Onde aparece |
|---|---|
| Classes e objetos | Cada entidade é uma classe |
| Herança | `Student` e `Teacher` herdam de `Person`; `FinalExamEnrollment` herda de `Enrollment` |
| Classe abstrata | `Person` tem `exibirInfo() = 0` |
| Encapsulamento | CPF, notas e frequência são `private`, acessados por getters e setters que validam os valores |
| Polimorfismo | `exibirInfo()` (aluno × professor) e `calculateStatus()` (com × sem prova final) |
| Ponteiros e referências | `ClassGroup` guarda `vector<Enrollment*>`; métodos como `enroll(Student& s)` recebem referência |
| Singleton (bônus) | `Database::getInstance()` |
| Factory Method (bônus) | `PersonFactory::criar("aluno", ...)` |

_(Detalhar com os textos de `integrante1.md` e `integrante2.md`.)_

## 5. Regras de negócio

- A turma tem limite de vagas, não aceita o mesmo aluno duas vezes e, depois de encerrada, não aceita matrícula.
- **Disciplina sem prova final:** frequência abaixo de 75% reprova por falta; média 7 ou mais aprova.
- **Disciplina com prova final:** média 7 ou mais aprova; abaixo de 3 reprova; entre 3 e 7 o aluno faz a final e passa se (média + final) / 2 ≥ 5.

## 6. Banco de dados

Seis tabelas: `pessoas`, `disciplinas`, `turmas`, `matriculas`, `notas` e `frequencia`. Aluno e professor ficam na mesma tabela porque os dois são `Person`.

_(Detalhar com o texto de `integrante3.md`.)_

## 7. Interface

Cada menu é um laço que desenha a tela, lê a opção e chama uma função. A entrada é validada: números fora do intervalo, notas fora de 0 a 10, CPF e data em formato errado são recusados e perguntados de novo. Ações que apagam dados pedem confirmação.

O visual segue as heurísticas de Nielsen: o caminho da tela fica sempre visível no topo, `0` sempre volta, `?` abre a ajuda, e as mensagens de erro dizem como resolver. Detalhes em `integrante4.md`.

## 8. Como compilar e rodar

```
make            # Linux / Mac   (mingw32-make no Windows)
./sistema
```

Na primeira execução, o banco `data/escola.db` é criado com dados de exemplo.

## 9. Limitações e próximos passos

- O SQL é montado juntando textos. Por isso o menu recusa o apóstrofo (`'`) nos campos de texto. O certo seria usar *prepared statements*.
- Não há login com senha: o usuário escolhe o perfil e a pessoa em uma lista.
- Uma interface gráfica (ex: Qt) seria um bônus.

## 10. Divisão do trabalho

| Integrante | Parte |
|---|---|
| Pedro Henrique | Pessoa, Aluno, Professor e Factory |
| Felipe Belfort | Disciplina, Turma, Matrícula, GitHub Pages e documentação |
| Gabriel Geller | Estrutura do projeto e banco de dados |
| Luis Henrique | Interface de console, GitHub Pages, relatório e vídeo |
