# Roteiro do vídeo (≈ 8 minutos)

Cada integrante grava a própria parte. Depois é só juntar na ordem abaixo.

Antes de gravar: apague `data/escola.db` para começar com os dados de exemplo e deixe o terminal em tela cheia (fonte grande).

| # | Tempo | Quem | O que mostrar | O que falar |
|---|---|---|---|---|
| 1 | 0:00–0:40 | Luis | Abertura do programa (logo animada) | Tema, equipe e o que o sistema faz em uma frase |
| 2 | 0:40–2:00 | Pedro | `Person.h`, `Student.h`, `Teacher.h`, `PersonFactory` | Herança, classe abstrata (`= 0`), encapsulamento, Factory |
| 3 | 2:00–3:30 | Felipe | `Enrollment` e `FinalExamEnrollment`, `ClassGroup::enroll` | Polimorfismo de `calculateStatus()`, regras de vaga, ponteiros em `vector<Enrollment*>` |
| 4 | 3:30–4:30 | Gabriel | `Database.cpp`, um repositório, as tabelas | Singleton, por que o SQL fica só nos repositórios |
| 5 | 4:30–7:30 | Luis | Demonstração no terminal (abaixo) | Cada funcionalidade e qual conceito de OOP ela usa |
| 6 | 7:30–8:00 | Luis | GitHub Pages | Onde achar código, UML e relatório |

## Demonstração (parte 5)

1. **Admin → Painel.** Mostrar os números do sistema.
2. **Admin → Alunos → Cadastrar.** Digitar um CPF errado de propósito → mostra a validação. Cadastrar direito.
3. **Admin → Alunos → Ver ficha.** Falar: "aqui é polimorfismo: o ponteiro é `Person*`, mas roda o `exibirInfo()` do aluno". Fazer o mesmo com um professor.
4. **Admin → Matrículas → Matricular** na turma EDOO (que está lotada, com 3 de 3) → mostra a regra de vagas.
5. **Admin → Relatório de turma → IP-2026.1** (encerrada): aprovado, reprovado por falta e reprovado por nota.
6. **Professor (Ana Souza) → Lançar notas** na EDOO. Depois **Fazer chamada**.
7. **Professor → Prova final**: lançar 6 para o João. **Encerrar turma**: o João passa pela regra da prova final. Falar: "mesmo método `calculateStatus()`, regra diferente, porque a matrícula é `FinalExamEnrollment`".
8. **Aluno (Joao Silva) → Horário semanal** e **Histórico escolar.**
9. Fechar e abrir o programa de novo → os dados continuam lá (SQLite).

## Publicar

1. Subir no YouTube (pode ser "Não listado").
2. Em `docs/index.html`, trocar `VIDEO_ID` pelo código do vídeo (o que vem depois de `watch?v=`).
3. Colocar o link no `README.md` e no relatório.
