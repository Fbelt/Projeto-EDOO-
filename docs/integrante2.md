# Integrante 2 — Disciplina, Turma e Matrícula

| Classe | Arquivos | Para que serve |
|---|---|---|
| `Discipline` | `include/Discipline.h`, `src/Discipline.cpp` | Dados da disciplina e se ela tem prova final |
| `ClassGroup` (Turma) | `include/ClassGroup.h`, `src/ClassGroup.cpp` | Vagas, matricular/desmatricular, relatório da turma e histórico do aluno |
| `Enrollment` (Matrícula) | `include/Enrollment.h`, `src/Enrollment.cpp` | Notas, frequência, média e situação (regra padrão) |
| `FinalExamEnrollment` | `include/FinalExamEnrollment.h`, `src/FinalExamEnrollment.cpp` | Herda de Enrollment e só troca a regra de situação (polimorfismo) |

## Regras

- Não matricula sem vaga, aluno repetido ou turma encerrada (lança exceção).
- Enquanto a turma não é encerrada (`finish()`), a situação é "Cursando".
- **Padrão:** frequência < 75% reprova por falta; média ≥ 7 aprova.
- **Com final:** média ≥ 7 aprova; < 3 reprova; entre 3 e 7 faz a final e passa se (média + final) / 2 ≥ 5.

## Para os outros integrantes

- **Integrante 1:** preciso de `getName() const` em Person.
- **Integrante 3:** guarde alunos e turmas em endereço fixo (ex: `vector<unique_ptr<Student>>`), porque a matrícula aponta para eles.
- **Integrante 4:** `turma.enroll(aluno)` dentro de `try/catch`; `matricula->addGrade()`, `addAttendance()`, `setFinalGrade()`; `turma.printReport()`; `printTranscript(aluno, turmas)`.
