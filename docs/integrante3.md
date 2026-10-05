# Integrante 3 — Estrutura do projeto e banco de dados (SQLite)

## Estrutura de pastas

| Pasta | O que tem |
|---|---|
| `include/` | Arquivos `.h` (declaração das classes) |
| `src/` | Arquivos `.cpp` (implementação) |
| `sqlite/` | Biblioteca SQLite (`sqlite3.c` e `sqlite3.h`), baixada de sqlite.org. **Não foi escrita pelo grupo** |
| `data/` | Onde o programa cria o arquivo do banco (`escola.db`) |
| `docs/` | Documentação de cada integrante |

Para compilar: `mingw32-make` (Windows) ou `make` (Linux). Para rodar: `./sistema`.

O C++ não tem banco de dados na biblioteca padrão. Por isso usamos o SQLite no formato
"amalgamation": a biblioteca inteira num único arquivo `.c`, que é compilado junto com o projeto.

## Modelo do banco

| Tabela | Colunas | Observação |
|---|---|---|
| `pessoas` | matricula, tipo, nome, cpf, nascimento, contato, curso | Aluno e Professor ficam juntos porque os dois herdam de Pessoa. A coluna `tipo` diz qual é |
| `disciplinas` | codigo, nome, carga_horaria, ementa, tem_final, professor | `professor` guarda a matrícula do professor |
| `turmas` | codigo, disciplina, professor, semestre, horario, vagas, encerrada | `disciplina` guarda o código da disciplina |
| `matriculas` | aluno, turma, nota_final | Uma linha = um aluno numa turma |
| `notas` | aluno, turma, valor | Uma linha para cada nota |
| `frequencia` | aluno, turma, aulas, presencas | Total de aulas e quantas o aluno assistiu |

As tabelas se ligam pelos códigos. Por exemplo, `turmas.disciplina = 'CIN0135'` aponta para a
disciplina com `codigo = 'CIN0135'`.

**As classes do sistema não têm SQL dentro.** `Student`, `ClassGroup` etc. não sabem que o banco
existe. Quem fala com o banco são os **repositórios**.

## Repositórios (CRUD)

| Classe | Métodos |
|---|---|
| `StudentRepository` | `insert`, `update`, `remove`, `findByMatricula`, `findByName` |
| `TeacherRepository` | `insert`, `update`, `remove`, `findByMatricula`, `findByName` |
| `DisciplineRepository` | `insert`, `update`, `remove`, `findByCode`, `findByName` |
| `ClassGroupRepository` | `insert`, `update`, `remove`, `findAll` |
| `EnrollmentRepository` | `save`, `saveAll`, `remove`, `loadInto` |

- `insert` e `update` recebem o objeto **por referência** (ex: `insert(Student& s)`), sem copiar.
- Os repositórios só montam o texto do SQL e chamam `Database::execute` (para gravar) ou
  `Database::query` (para ler). Só a classe `Database` usa as funções da biblioteca SQLite.
- As buscas criam os objetos com `new`. Quem chamar fica responsável por dar `delete`.
- **Limitação:** o SQL é montado juntando textos, então um nome com apóstrofo (ex: "D'Avila")
  dá erro.

## Singleton (classe `Database`)

O programa precisa de **uma única conexão** com o banco. O Singleton garante isso:

```cpp
class Database {
private:
    Database();                      // construtor privado: ninguém cria um Database de fora
public:
    static Database& getInstance();  // devolve sempre o mesmo objeto
};

Database& Database::getInstance() {
    static Database instance;  // criado só na primeira chamada
    return instance;
}
```

Em qualquer arquivo, `Database::getInstance()` devolve a mesma conexão. Os repositórios
usam isso sem precisar receber o banco como parâmetro.

## Dados de exemplo (seed)

Quando o banco está vazio, `seedDatabase()` cria 2 professores, 4 alunos, 2 disciplinas e
2 turmas, com notas e frequência. Uma turma é do semestre passado (já encerrada, com aprovado,
reprovado por falta e reprovado por nota) e a outra é do semestre atual. Para recomeçar do
zero, é só apagar o arquivo `data/escola.db`.

## Para os outros integrantes

- **Integrante 4 (menu):** o `main.cpp` já mostra como carregar tudo. A ordem é: alunos →
  professores → disciplinas → turmas. Depois de mudar algo na memória, chame o repositório
  para salvar. Exemplos: `turma->enroll(aluno)` e depois `enrollmentRepo.save(*turma, *turma->findEnrollment(aluno))`;
  ao lançar nota, `enrollmentRepo.save(...)` de novo; ao encerrar a turma, `groupRepo.update(*turma)`.
