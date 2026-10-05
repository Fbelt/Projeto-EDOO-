#include <iostream>
#include "Menus.h"
#include "Ui.h"
#include "Input.h"

using namespace std;

// ═══════════════════════════════════════════════════════════════════
//  Telas usadas por mais de um perfil: listas para escolher,
//  relatório da turma, histórico e horário.
// ═══════════════════════════════════════════════════════════════════

// Mostra os alunos numerados e devolve o escolhido (nullptr = voltar)
Student* chooseStudent(vector<Student*>& list) {
    if (list.size() == 0) {
        ui::info("Nenhum aluno cadastrado.");
        return nullptr;
    }
    ui::Table table({"#", "Nome", "Matrícula", "Curso"});
    table.alignRight(0);
    for (int i = 0; i < list.size(); i++) {
        table.add({to_string(i + 1), list[i]->getName(), list[i]->getMatricula(), list[i]->getCurso()});
    }
    table.print();
    int choice = readInt("Número do aluno (0 para voltar)", 0, list.size());
    if (choice == 0) return nullptr;
    return list[choice - 1];
}

// Mostra os professores numerados e devolve o escolhido (nullptr = voltar)
Teacher* chooseTeacher(vector<Teacher*>& list) {
    if (list.size() == 0) {
        ui::info("Nenhum professor cadastrado.");
        return nullptr;
    }
    ui::Table table({"#", "Nome", "Matrícula", "Contato"});
    table.alignRight(0);
    for (int i = 0; i < list.size(); i++) {
        table.add({to_string(i + 1), list[i]->getName(), list[i]->getMatriculaFuncional(), list[i]->getContato()});
    }
    table.print();
    int choice = readInt("Número do professor (0 para voltar)", 0, list.size());
    if (choice == 0) return nullptr;
    return list[choice - 1];
}

// Mostra as disciplinas numeradas e devolve a escolhida (nullptr = voltar)
Discipline* chooseDiscipline(vector<Discipline*>& list) {
    if (list.size() == 0) {
        ui::info("Nenhuma disciplina cadastrada.");
        return nullptr;
    }
    ui::Table table({"#", "Código", "Nome", "Professor", "Prova final"});
    table.alignRight(0);
    for (int i = 0; i < list.size(); i++) {
        Discipline* d = list[i];
        string teacher = d->getTeacher() != nullptr ? d->getTeacher()->getName() : ui::muted("sem professor");
        table.add({to_string(i + 1), d->getCode(), d->getName(), teacher, d->getHasFinalExam() ? "Sim" : "Não"});
    }
    table.print();
    int choice = readInt("Número da disciplina (0 para voltar)", 0, list.size());
    if (choice == 0) return nullptr;
    return list[choice - 1];
}

// Mostra as turmas numeradas e devolve a escolhida (nullptr = voltar)
ClassGroup* chooseGroup(vector<ClassGroup*> list) {
    if (list.size() == 0) {
        ui::info("Nenhuma turma encontrada.");
        return nullptr;
    }
    ui::Table table({"#", "Turma", "Disciplina", "Semestre", "Horário", "Vagas", "Status"});
    table.alignRight(0);
    table.alignRight(5);
    for (int i = 0; i < list.size(); i++) {
        ClassGroup* g = list[i];
        string vagas = to_string(g->getEnrollments().size()) + "/" + to_string(g->getCapacity());
        string status = g->isFinished() ? ui::muted("Encerrada") : ui::good("Aberta");
        table.add({to_string(i + 1), g->getCode(), g->getDiscipline()->getName(), g->getSemester(),
                   g->getSchedule(), vagas, status});
    }
    table.print();
    int choice = readInt("Número da turma (0 para voltar)", 0, list.size());
    if (choice == 0) return nullptr;
    return list[choice - 1];
}

// Mostra os alunos de uma turma e devolve a matrícula escolhida
Enrollment* chooseEnrollment(ClassGroup& group) {
    vector<Enrollment*> list = group.getEnrollments();
    if (list.size() == 0) {
        ui::info("Esta turma ainda não tem alunos.");
        return nullptr;
    }
    ui::Table table({"#", "Aluno", "Matrícula", "Notas", "Média"});
    table.alignRight(0);
    table.alignRight(4);
    for (int i = 0; i < list.size(); i++) {
        Enrollment* e = list[i];
        table.add({to_string(i + 1), e->getStudent()->getName(), e->getStudent()->getMatricula(),
                   gradesText(*e), ui::gradeText(e->calculateAverage())});
    }
    table.print();
    int choice = readInt("Número do aluno (0 para voltar)", 0, list.size());
    if (choice == 0) return nullptr;
    return list[choice - 1];
}

// Turmas em que o aluno está matriculado
vector<ClassGroup*> groupsOfStudent(SchoolData& data, Student& s, bool onlyCurrent) {
    vector<ClassGroup*> result;
    for (ClassGroup* g : data.groups) {
        if (g->findEnrollment(s) != nullptr && (!onlyCurrent || !g->isFinished())) {
            result.push_back(g);
        }
    }
    return result;
}

// Turmas em que o professor dá aula
vector<ClassGroup*> groupsOfTeacher(SchoolData& data, Teacher& t) {
    vector<ClassGroup*> result;
    for (ClassGroup* g : data.groups) {
        if (g->getTeacher() == &t) {
            result.push_back(g);
        }
    }
    return result;
}

// Notas separadas por "·" e a prova final, se tiver
string gradesText(Enrollment& e) {
    vector<double> grades = e.getGrades();
    if (grades.size() == 0) return ui::muted("sem notas");
    string out = "";
    for (int i = 0; i < grades.size(); i++) {
        if (i > 0) out += ui::muted(" · ");
        out += ui::number(grades[i]);
    }
    if (e.getFinalGrade() != -1) {
        out += ui::muted(" · PF ") + ui::number(e.getFinalGrade());
    }
    return out;
}

// Relatório da turma: alunos, médias, frequência, situação e estatísticas.
// Com a turma aberta, a coluna "Previsão" mostra como ficaria se ela encerrasse hoje
void showGroupReport(ClassGroup& group) {
    Discipline* d = group.getDiscipline();
    string teacher = group.getTeacher() != nullptr ? group.getTeacher()->getName() : "sem professor";

    ui::title(d->getName(), group.getCode() + "  ·  " + group.getSemester() + "  ·  " +
              group.getSchedule() + "  ·  Prof. " + teacher);

    vector<Enrollment*> list = group.getEnrollments();
    bool open = !group.isFinished();

    vector<string> headers = {"Aluno", "Notas", "Média", "Frequência", "Situação"};
    if (open) headers.push_back("Previsão");
    ui::Table table(headers);
    table.alignRight(2);

    double sum = 0;
    int approved = 0;
    for (Enrollment* e : list) {
        // calculateStatus() é virtual: usa a regra normal ou a regra com prova final
        string status = group.getStatus(e);
        string forecast = e->calculateStatus();
        vector<string> row = {e->getStudent()->getName(), gradesText(*e), ui::gradeText(e->calculateAverage()),
                              ui::attendanceBar(e->calculateAttendance()), ui::statusBadge(status)};
        if (open) row.push_back(ui::statusBadge(forecast));
        table.add(row);

        sum += e->calculateAverage();
        if ((open ? forecast : status) == "Aprovado") approved++;
    }
    table.print();

    if (list.size() == 0) return;

    double average = sum / list.size();
    double rate = approved * 100.0 / list.size();
    ui::blank();
    ui::statCards({ui::number(average), to_string(approved) + " de " + to_string(list.size()),
                   ui::number(rate, 0) + "%", to_string(list.size()) + "/" + to_string(group.getCapacity())},
                  {"média da turma", open ? "aprovados (prev.)" : "aprovados",
                   open ? "aprovação (prev.)" : "taxa de aprovação", "vagas ocupadas"});

    ui::blank();
    if (d->getHasFinalExam()) {
        ui::text(ui::muted("Regra: média ≥ 7 aprova · < 3 reprova · entre 3 e 7 faz prova final (média+PF)/2 ≥ 5"));
    } else {
        ui::text(ui::muted("Regra: frequência ≥ 75% e média ≥ 7 para aprovar"));
    }
    if (open) {
        ui::text(ui::muted("Turma aberta: a situação oficial é \"Cursando\" até o professor encerrar."));
    }
}

// Histórico escolar: todas as turmas do aluno, encerradas e atuais
void showTranscript(SchoolData& data, Student& s) {
    ui::profileCard(s.getName(), {"Matrícula " + s.getMatricula() + "  ·  " + s.getCurso(),
                                  "CPF " + s.getCpf() + "  ·  " + s.getContato()});
    ui::blank();

    vector<ClassGroup*> list = groupsOfStudent(data, s, false);
    ui::Table table({"Semestre", "Código", "Disciplina", "Média", "Frequência", "Situação"});
    table.alignRight(3);

    double sum = 0;
    int finished = 0, approved = 0;
    for (ClassGroup* g : list) {
        Enrollment* e = g->findEnrollment(s);
        string status = g->getStatus(e);
        table.add({g->getSemester(), g->getDiscipline()->getCode(), g->getDiscipline()->getName(),
                   ui::gradeText(e->calculateAverage()), ui::attendanceBar(e->calculateAttendance()),
                   ui::statusBadge(status)});
        if (g->isFinished()) {
            finished++;
            sum += e->calculateAverage();
            if (status == "Aprovado") approved++;
        }
    }
    table.print();

    ui::blank();
    string average = finished > 0 ? ui::number(sum / finished) : "—";
    ui::statCards({average, to_string(approved) + " de " + to_string(finished), to_string(list.size() - finished)},
                  {"média geral", "aprovações", "em andamento"});
}

// Horário semanal: monta uma grade com os dias nas colunas.
// O horário da turma está no formato "TER 10h-12h" ou "SEG/QUA 8h-10h"
void showTimetable(vector<ClassGroup*> groups) {
    vector<string> days = {"SEG", "TER", "QUA", "QUI", "SEX", "SAB"};
    vector<string> times;                 // horários diferentes (linhas da grade)
    vector<vector<string>> cells;         // cells[linha][dia]

    for (ClassGroup* g : groups) {
        string schedule = g->getSchedule();
        int space = schedule.find(' ');
        string dayPart = schedule.substr(0, space);
        string time = schedule.substr(space + 1);

        // acha (ou cria) a linha desse horário
        int row = -1;
        for (int i = 0; i < times.size(); i++) {
            if (times[i] == time) row = i;
        }
        if (row == -1) {
            times.push_back(time);
            cells.push_back(vector<string>(days.size(), ""));
            row = times.size() - 1;
        }

        // marca a turma em cada dia (os dias são separados por "/")
        for (int d = 0; d < days.size(); d++) {
            if (dayPart.find(days[d]) != string::npos) {
                cells[row][d] = ui::accent(g->getDiscipline()->getCode());
            }
        }
    }

    vector<string> headers = {"Horário"};
    for (string d : days) headers.push_back(d);
    ui::Table table(headers);
    for (int i = 0; i < times.size(); i++) {
        vector<string> row = {times[i]};
        for (string c : cells[i]) row.push_back(c == "" ? ui::muted("  ·  ") : c);
        table.add(row);
    }
    table.print();

    // legenda: código → nome da disciplina
    ui::blank();
    for (ClassGroup* g : groups) {
        ui::text(ui::accent(g->getDiscipline()->getCode()) + "  " + g->getDiscipline()->getName() +
                 ui::muted("  ·  turma " + g->getCode()));
    }
}

// Tela de ajuda: como navegar e quais são as regras
void showHelp() {
    ui::title("Ajuda", "Como usar o sistema");

    ui::section("NAVEGAÇÃO");
    ui::text("Digite o número da opção e pressione ENTER.");
    ui::text("A opção " + ui::accent("0") + " sempre volta para a tela anterior.");
    ui::text("O caminho no topo (Início › …) mostra onde você está.");
    ui::text("Ações que apagam dados sempre pedem confirmação.");

    ui::section("REGRAS DE APROVAÇÃO");
    ui::text(ui::bold("Sem prova final") + ui::muted(": frequência < 75% reprova por falta; média ≥ 7 aprova."));
    ui::text(ui::bold("Com prova final") + ui::muted(": média ≥ 7 aprova; < 3 reprova; entre 3 e 7 faz a final"));
    ui::text(ui::muted("  e passa se (média + final) / 2 ≥ 5."));
    ui::text(ui::muted("Enquanto a turma não é encerrada, a situação é \"Cursando\"."));

    ui::section("REGRAS DE MATRÍCULA");
    ui::text(ui::muted("A turma tem limite de vagas · o mesmo aluno não entra duas vezes"));
    ui::text(ui::muted("na mesma turma · turma encerrada não aceita matrícula."));

    ui::section("LEGENDA");
    ui::text(ui::statusBadge("Aprovado") + "   " + ui::statusBadge("Reprovado por nota") + "   " +
             ui::statusBadge("Cursando") + "   " + ui::statusBadge("Em prova final"));
    ui::pause();
}
