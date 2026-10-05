#include <iostream>
#include "Menus.h"
#include "Ui.h"
#include "Input.h"

using namespace std;

// Menu principal: escolhe quem vai usar o sistema
void mainMenu(SchoolData& data) {
    while (true) {
        ui::setTheme(ui::NEUTRAL, "");
        ui::screen("");
        ui::title("Quem está usando o sistema?", "Escolha um perfil para entrar");

        ui::option("1", "Administrador", "secretaria: cadastros, turmas, relatórios");
        ui::option("2", "Professor", "notas, chamada e diário de classe");
        ui::option("3", "Aluno", "notas, frequência, horário e histórico");
        ui::blank();
        ui::option("?", "Ajuda", "regras e navegação");
        ui::backOption("Sair do sistema");

        ui::blank();
        ui::text(ui::muted("● Banco conectado: data/escola.db  ·  " + to_string(data.students.size()) + " alunos  ·  " +
                           to_string(data.teachers.size()) + " professores  ·  " + to_string(data.groups.size()) + " turmas"));

        string op = readOption();
        if (op == "1") {
            adminMenu(data);
        } else if (op == "2") {
            ui::setTheme(ui::TEACHER, "Professor");
            ui::screen("Professor › Entrar");
            ui::title("Entrar como professor", "Quem é você?");
            Teacher* t = chooseTeacher(data.teachers);
            if (t != nullptr) teacherMenu(data, *t);
        } else if (op == "3") {
            ui::setTheme(ui::STUDENT, "Aluno");
            ui::screen("Aluno › Entrar");
            ui::title("Entrar como aluno", "Quem é você?");
            Student* s = chooseStudent(data.students);
            if (s != nullptr) studentMenu(data, *s);
        } else if (op == "?") {
            ui::screen("Ajuda");
            showHelp();
        } else if (op == "0") {
            return;
        } else {
            ui::error("Opção inválida.", "Digite 1, 2, 3, ? ou 0.");
            ui::pause();
        }
    }
}
