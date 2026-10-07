#include <iostream>
#include "Menus.h"
#include "Ui.h"
#include "Input.h"
#include "ClassGroupRepository.h"
#include "EnrollmentRepository.h"

using namespace std;


// Escolhe uma das turmas do professor
ClassGroup* chooseMyGroup(SchoolData& data, Teacher& teacher, string path, string title) {
    ui::screen(path);
    ui::title(title, "Escolha a turma");
    return chooseGroup(groupsOfTeacher(data, teacher));
}

// Prevenção de erro: turma encerrada não pode mais ter nota ou frequência alterada
bool checkOpen(ClassGroup& g) {
    if (g.isFinished()) {
        ui::error("A turma " + g.getCode() + " está encerrada.", "Notas e frequência não podem mais ser alteradas.");
        ui::pause();
        return false;
    }
    if (g.getEnrollments().size() == 0) {
        ui::info("A turma ainda não tem alunos.");
        ui::pause();
        return false;
    }
    return true;
}

// Diário da turma: alunos, médias, frequência, situação e estatísticas
void classDiary(SchoolData& data, Teacher& teacher) {
    ClassGroup* g = chooseMyGroup(data, teacher, "Professor › Diário", "Diário de classe");
    if (g == nullptr) return;
    ui::screen("Professor › Diário › " + g->getCode());
    showGroupReport(*g);
    ui::pause();
}

// Lança uma nota para cada aluno da turma (ENTER pula o aluno)
void launchGrades(SchoolData& data, Teacher& teacher) {
    ClassGroup* g = chooseMyGroup(data, teacher, "Professor › Lançar notas", "Lançar notas");
    if (g == nullptr || !checkOpen(*g)) return;

    ui::screen("Professor › Lançar notas › " + g->getCode());
    ui::title("Lançar notas · " + g->getDiscipline()->getName(), "Uma nota por aluno, de 0 a 10");

    EnrollmentRepository repo;
    int launched = 0;
    for (Enrollment* e : g->getEnrollments()) {
        string label = e->getStudent()->getName() + ui::muted(" · avaliação " +
                       to_string(e->getGrades().size() + 1));
        double grade = readGradeOrSkip(label);
        if (grade != -1) {
            e->addGrade(grade);
            repo.save(*g, *e);
            launched++;
        }
    }
    ui::success(to_string(launched) + " nota(s) lançada(s) e salva(s).");
    ui::pause();
}

// Corrige uma nota já lançada
void editGrade(SchoolData& data, Teacher& teacher) {
    ClassGroup* g = chooseMyGroup(data, teacher, "Professor › Editar nota", "Editar nota");
    if (g == nullptr || !checkOpen(*g)) return;

    ui::screen("Professor › Editar nota › " + g->getCode());
    ui::title("Editar nota", "Escolha o aluno");
    Enrollment* e = chooseEnrollment(*g);
    if (e == nullptr) return;

    vector<double> grades = e->getGrades();
    if (grades.size() == 0) {
        ui::info(e->getStudent()->getName() + " ainda não tem notas. Use \"Lançar notas\".");
        ui::pause();
        return;
    }
    ui::section("NOTAS DE " + ui::upper(e->getStudent()->getName()));
    for (int i = 0; i < grades.size(); i++) {
        ui::option(to_string(i + 1), "Avaliação " + to_string(i + 1), ui::number(grades[i]));
    }
    int which = readInt("Qual avaliação (0 para voltar)", 0, grades.size());
    if (which == 0) return;

    double newGrade = readGrade("Nova nota");
    e->setGrade(which - 1, newGrade);   // no vector a primeira nota é a posição 0
    EnrollmentRepository repo;
    repo.save(*g, *e);

    ui::success("Avaliação " + to_string(which) + ": " + ui::number(grades[which - 1]) + " → " +
                ui::number(newGrade) + ". Nova média: " + ui::number(e->calculateAverage()) + ".");
    ui::pause();
}

// Faz a chamada de uma aula: presente ou falta para cada aluno
void takeAttendance(SchoolData& data, Teacher& teacher) {
    ClassGroup* g = chooseMyGroup(data, teacher, "Professor › Chamada", "Fazer chamada");
    if (g == nullptr || !checkOpen(*g)) return;

    ui::screen("Professor › Chamada › " + g->getCode());
    ui::title("Chamada · " + g->getDiscipline()->getName(), "Registra uma aula para a turma toda");

    int present = 0, absent = 0;
    for (Enrollment* e : g->getEnrollments()) {
        bool isPresent = readPresence(e->getStudent()->getName());
        e->addAttendance(isPresent);
        if (isPresent) present++;
        else absent++;
    }
    EnrollmentRepository repo;
    repo.saveAll(*g);

    ui::success("Chamada salva: " + to_string(present) + " presente(s), " + to_string(absent) + " falta(s).");
    ui::pause();
}

// Lança a prova final de quem ficou com média entre 3 e 7
void launchFinalExam(SchoolData& data, Teacher& teacher) {
    ClassGroup* g = chooseMyGroup(data, teacher, "Professor › Prova final", "Prova final");
    if (g == nullptr || !checkOpen(*g)) return;

    if (!g->getDiscipline()->getHasFinalExam()) {
        ui::error(g->getDiscipline()->getName() + " não tem prova final.",
                  "Só disciplinas cadastradas com prova final usam essa regra.");
        ui::pause();
        return;
    }

    ui::screen("Professor › Prova final › " + g->getCode());
    ui::title("Prova final", "Só aparecem os alunos com média entre 3 e 7 e frequência ≥ 75%");
    EnrollmentRepository repo;
    int count = 0;
    for (Enrollment* e : g->getEnrollments()) {
        double average = e->calculateAverage();
        if (average >= 3 && average < 7 && e->calculateAttendance() >= 75) {
            string label = e->getStudent()->getName() + ui::muted(" · média " + ui::number(average));
            double grade = readGradeOrSkip(label);
            if (grade != -1) {
                e->setFinalGrade(grade);
                repo.save(*g, *e);
            }
            count++;
        }
    }
    if (count == 0) {
        ui::info("Nenhum aluno precisa de prova final nesta turma.");
    } else {
        ui::success("Notas da prova final salvas.");
    }
    ui::pause();
}

// Encerra a turma: a partir daí a situação final é calculada
void finishMyGroup(SchoolData& data, Teacher& teacher) {
    ClassGroup* g = chooseMyGroup(data, teacher, "Professor › Encerrar turma", "Encerrar turma");
    if (g == nullptr) return;
    if (g->isFinished()) {
        ui::info("A turma " + g->getCode() + " já está encerrada.");
        ui::pause();
        return;
    }
    if (!confirm("Encerrar " + g->getCode() + "? Depois disso notas e frequência ficam travadas.")) {
        ui::info("A turma continua aberta.");
        ui::pause();
        return;
    }
    g->finish();
    ClassGroupRepository repo;
    repo.update(*g);

    ui::screen("Professor › Encerrar turma");
    ui::success("Turma encerrada. Resultado final:");
    ui::blank();
    showGroupReport(*g);
    ui::pause();
}

void teacherMenu(SchoolData& data, Teacher& teacher) {
    ui::setTheme(ui::TEACHER, "Professor");
    while (true) {
        ui::screen("Professor");
        vector<ClassGroup*> mine = groupsOfTeacher(data, teacher);
        int students = 0;
        for (ClassGroup* g : mine) students += g->getEnrollments().size();

        ui::title("Olá, " + teacher.getName(), "Matrícula " + teacher.getMatriculaFuncional() + "  ·  " +
                  to_string(mine.size()) + " turma(s)  ·  " + to_string(students) + " aluno(s)");

        ui::section("SUAS TURMAS");
        ui::Table table({"Turma", "Disciplina", "Horário", "Alunos", "Status"});
        for (ClassGroup* g : mine) {
            table.add({g->getCode(), g->getDiscipline()->getName(), g->getSchedule(),
                       to_string(g->getEnrollments().size()),
                       g->isFinished() ? ui::muted("Encerrada") : ui::good("Aberta")});
        }
        table.print();

        ui::section("DIÁRIO");
        ui::option("1", "Ver turma", "alunos, médias e situação");
        ui::option("2", "Lançar notas", "turma toda de uma vez");
        ui::option("3", "Editar nota", "corrigir uma nota");
        ui::option("4", "Fazer chamada", "registrar frequência");
        ui::option("5", "Prova final", "alunos com média 3 a 7");
        ui::section("FECHAMENTO");
        ui::option("6", "Encerrar turma", "calcula a situação final");
        ui::option("?", "Ajuda", "regras e navegação");
        ui::backOption("Trocar de perfil");

        string op = readOption();
        if (op == "1") classDiary(data, teacher);
        else if (op == "2") launchGrades(data, teacher);
        else if (op == "3") editGrade(data, teacher);
        else if (op == "4") takeAttendance(data, teacher);
        else if (op == "5") launchFinalExam(data, teacher);
        else if (op == "6") finishMyGroup(data, teacher);
        else if (op == "?") { ui::screen("Professor › Ajuda"); showHelp(); }
        else if (op == "0") return;
        else { ui::error("Opção inválida.", "Digite um dos números da lista."); ui::pause(); }
    }
}
