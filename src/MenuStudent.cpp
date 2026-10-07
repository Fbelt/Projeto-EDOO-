#include <iostream>
#include "Menus.h"
#include "Ui.h"
#include "Input.h"

using namespace std;



// Disciplinas do semestre atual: professor e horário
void myDisciplines(SchoolData& data, Student& s) {
    ui::screen("Aluno › Minhas disciplinas");
    vector<ClassGroup*> list = groupsOfStudent(data, s, true);
    ui::title("Minhas disciplinas", to_string(list.size()) + " disciplina(s) neste semestre");
    ui::Table table({"Código", "Disciplina", "Professor", "Horário", "Carga"});
    table.alignRight(4);
    for (ClassGroup* g : list) {
        Discipline* d = g->getDiscipline();
        string teacher = g->getTeacher() != nullptr ? g->getTeacher()->getName() : ui::muted("—");
        table.add({d->getCode(), d->getName(), teacher, g->getSchedule(), to_string(d->getWorkload()) + "h"});
    }
    table.print();
    ui::pause();
}

// Notas de cada disciplina atual e a média
void myGrades(SchoolData& data, Student& s) {
    ui::screen("Aluno › Notas");
    ui::title("Notas e médias", "Semestre atual");
    ui::Table table({"Disciplina", "Notas", "Média", "Para aprovar"});
    table.alignRight(2);
    for (ClassGroup* g : groupsOfStudent(data, s, true)) {
        Enrollment* e = g->findEnrollment(s);
        double average = e->calculateAverage();
        string goal = average >= 7 ? ui::good("média ok") : ui::warn("faltam " + ui::number(7 - average) + " pts na média");
        table.add({g->getDiscipline()->getName(), gradesText(*e), ui::gradeText(average), goal});
    }
    table.print();
    ui::text(ui::muted("Média = soma das notas ÷ quantidade de notas. Para aprovar direto: média ≥ 7."));
    ui::pause();
}

// Frequência de cada disciplina atual
void myAttendance(SchoolData& data, Student& s) {
    ui::screen("Aluno › Frequência");
    ui::title("Frequência", "Mínimo de 75% para não reprovar por falta");
    ui::Table table({"Disciplina", "Presenças", "Faltas", "Frequência"});
    table.alignRight(1);
    table.alignRight(2);
    for (ClassGroup* g : groupsOfStudent(data, s, true)) {
        Enrollment* e = g->findEnrollment(s);
        table.add({g->getDiscipline()->getName(), to_string(e->getPresences()) + "/" + to_string(e->getClasses()),
                   to_string(e->getClasses() - e->getPresences()), ui::attendanceBar(e->calculateAttendance())});
    }
    table.print();
    ui::pause();
}

// Situação atual e a previsão (como ficaria se a turma encerrasse hoje)
void myStatus(SchoolData& data, Student& s) {
    ui::screen("Aluno › Situação");
    ui::title("Situação", "\"Cursando\" até o professor encerrar a turma");
    ui::Table table({"Disciplina", "Média", "Frequência", "Situação", "Previsão"});
    table.alignRight(1);
    for (ClassGroup* g : groupsOfStudent(data, s, true)) {
        Enrollment* e = g->findEnrollment(s);
        // calculateStatus() é polimórfico: com ou sem prova final
        table.add({g->getDiscipline()->getName(), ui::gradeText(e->calculateAverage()),
                   ui::attendanceBar(e->calculateAttendance()), ui::statusBadge(g->getStatus(e)),
                   ui::statusBadge(e->calculateStatus())});
    }
    table.print();
    ui::pause();
}

void myTimetable(SchoolData& data, Student& s) {
    ui::screen("Aluno › Horário");
    ui::title("Horário semanal", "Turmas do semestre atual");
    showTimetable(groupsOfStudent(data, s, true));
    ui::pause();
}

void myTranscript(SchoolData& data, Student& s) {
    ui::screen("Aluno › Histórico");
    ui::title("Histórico escolar");
    showTranscript(data, s);
    ui::pause();
}

void studentMenu(SchoolData& data, Student& student) {
    ui::setTheme(ui::STUDENT, "Aluno");
    while (true) {
        ui::screen("Aluno");
        ui::profileCard(student.getName(), {"Matrícula " + student.getMatricula() + "  ·  " + student.getCurso(),
                        to_string(groupsOfStudent(data, student, true).size()) + " disciplina(s) neste semestre"});

        ui::section("SEMESTRE ATUAL");
        ui::option("1", "Minhas disciplinas", "professor e horário");
        ui::option("2", "Notas", "notas e média");
        ui::option("3", "Frequência", "presenças e faltas");
        ui::option("4", "Situação", "aprovado, reprovado, cursando");
        ui::option("5", "Horário semanal", "grade da semana");
        ui::section("VIDA ACADÊMICA");
        ui::option("6", "Histórico escolar", "todos os semestres");
        ui::option("?", "Ajuda", "regras e navegação");
        ui::backOption("Trocar de perfil");

        string op = readOption();
        if (op == "1") myDisciplines(data, student);
        else if (op == "2") myGrades(data, student);
        else if (op == "3") myAttendance(data, student);
        else if (op == "4") myStatus(data, student);
        else if (op == "5") myTimetable(data, student);
        else if (op == "6") myTranscript(data, student);
        else if (op == "?") { ui::screen("Aluno › Ajuda"); showHelp(); }
        else if (op == "0") return;
        else { ui::error("Opção inválida.", "Digite um dos números da lista."); ui::pause(); }
    }
}
