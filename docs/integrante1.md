# Integrante 1 — Pessoa, Aluno, Professor e Factory

| Classe | Para que serve |
|---|---|
| `Person` (abstrata) | Base de Aluno e Professor: nome, CPF, data de nascimento, contato |
| `Student` (herda Person) | Matrícula e curso do aluno |
| `Teacher` (herda Person) | Matrícula funcional e disciplinas que o professor pode lecionar |
| `PersonCRUD` | Cadastro em memória de alunos e professores (para o Integrante 3) |
| `PersonFactory` | Cria Aluno ou Professor a partir de um tipo em string |

---

## Herança

`Person` é a classe base **abstrata** — ela não pode ser instanciada diretamente porque declara o método puro `exibirInfo()`. Isso força toda subclasse a implementar sua própria versão antes de poder ser usada.

`Student` e `Teacher` herdam de `Person` com `public`, o que significa que todo aluno **é uma** pessoa e todo professor **é uma** pessoa. Os atributos comuns (nome, CPF, data de nascimento, contato) ficam em `Person` e não precisam ser repetidos nas subclasses. Cada subclasse só acrescenta o que é seu: matrícula/curso para o aluno, matrícula funcional/disciplinas para o professor.

O destrutor virtual em `Person` garante que, ao deletar um ponteiro `Person*` que aponta para um `Student` ou `Teacher`, o destrutor correto da subclasse seja chamado — sem isso, haveria vazamento de memória.

```
Person  (abstrata)
├── Student   → matrícula, curso
└── Teacher   → matrícula funcional, disciplinas
```

---

## Encapsulamento

Todos os atributos de `Person`, `Student` e `Teacher` são `private`. O acesso externo só acontece via:

- **Getters `const`** — leem o valor sem modificar o objeto (`string getName() const`).
- **Setters com `const string&`** — recebem a string por referência constante (evita cópia e impede modificação acidental do argumento).

Isso protege os dados: ninguém fora da classe pode alterar diretamente o CPF de um aluno, por exemplo.

---

## Polimorfismo

`Person` declara `virtual void exibirInfo() const = 0`. Isso é polimorfismo em ação:

- Um vetor de `Person*` pode guardar tanto alunos quanto professores.
- Ao chamar `p->exibirInfo()`, o C++ decide em tempo de execução qual versão usar — a de `Student` ou a de `Teacher` — sem que o código chamador precise saber o tipo concreto.

Exemplo prático em `PersonFactory::criar`: o retorno é `Person*`, mas o objeto criado é `Student*` ou `Teacher*`. Quem recebe o ponteiro pode chamar `exibirInfo()` sem precisar checar o tipo.

```cpp
Person* p = PersonFactory::criar("aluno", "Ana", "2000-01-01", "123.456.789-00", "20240001", "CC");
p->exibirInfo(); // chama Student::exibirInfo() — polimorfismo
delete p;
```

O mesmo padrão já usado por `Enrollment`/`FinalExamEnrollment` com `calculateStatus()` se repete aqui com `exibirInfo()`.

---

## Para os outros integrantes

- **Integrante 2:** `Student.h` e `Teacher.h` estão em `include/` — os `#include` que você já tinha continuam funcionando.
- **Integrante 3:** use `PersonCRUD` para guardar alunos e professores. Os métodos `getAlunos()` e `getProfessores()` retornam `vector<Student*>&` e `vector<Teacher*>&` para passar para `ClassGroup::enroll` e `Discipline::setTeacher`. **Não copie os objetos** — a matrícula (`Enrollment`) guarda o endereço do aluno.
- **Integrante 4:** para listar alunos/professores no menu, chame `exibirInfo()` via ponteiro — polimorfismo cuida do resto.
