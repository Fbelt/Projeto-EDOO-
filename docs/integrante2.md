# Integrante 2 — Disciplina, Turma e Matrícula

| Classe | Para que serve |
|---|---|
| `Discipline` | Dados da disciplina e se ela tem prova final |
| `ClassGroup` (Turma) | Vagas, matricular/desmatricular, relatório da turma e histórico do aluno |
| `Enrollment` (Matrícula) | Notas, frequência, média e situação (regra normal) |
| `FinalExamEnrollment` | Herda de Enrollment e só troca a regra de situação (polimorfismo) |

## Regras

- Não matricula sem vaga, aluno repetido ou turma encerrada (`enroll` retorna `false`).
- Enquanto a turma não é encerrada (`finish()`), a situação é "Cursando".
- **Normal:** frequência < 75% reprova por falta; média ≥ 7 aprova.
- **Com final:** média ≥ 7 aprova; < 3 reprova; entre 3 e 7 faz a final e passa se (média + final) / 2 ≥ 5.

## Para os outros integrantes

- **Integrante 1:** preciso de `getName()` em Person, e dos arquivos `Student.h` e `Teacher.h` em `include/`.
- **Integrante 3:** não copie turmas (a turma apaga as matrículas no destrutor). Guarde como ponteiro: `vector<ClassGroup*>`. Alunos também precisam ficar num lugar fixo, porque a matrícula guarda o endereço deles.
- **Integrante 4:**
  - Matricular: `turma->enroll(aluno)`.
  - Notas e frequência: `turma->findEnrollment(aluno)`, depois `addGrade()`, `addAttendance()` e `setFinalGrade()`.
  - Situação: `turma->getStatus(matricula)`.
  - Relatórios: `turma->printReport()` e `printTranscript(aluno, turmas)`.
