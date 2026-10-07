#include "ClassGroupRepository.h"
#include "EnrollmentRepository.h"
#include "Database.h"

using namespace std;

// Devolve a matrícula do professor da turma 
string teacherMatricula(ClassGroup& g) {
    if (g.getTeacher() == nullptr) {
        return "";
    }
    return g.getTeacher()->getMatriculaFuncional();
}

// Cadastra uma turma nova 
void ClassGroupRepository::insert(ClassGroup& g) {
    Database::getInstance().execute(
        "INSERT INTO turmas VALUES ('" + Database::escape(g.getCode()) + "', '" +
        Database::escape(g.getDiscipline()->getCode()) + "', '" + Database::escape(teacherMatricula(g)) + "', '" +
        Database::escape(g.getSemester()) + "', '" + Database::escape(g.getSchedule()) + "', " +
        to_string(g.getCapacity()) + ", " + to_string(g.isFinished()) + ");");
}

// Atualiza a turma
void ClassGroupRepository::update(ClassGroup& g) {
    Database::getInstance().execute(
        "UPDATE turmas SET professor = '" + Database::escape(teacherMatricula(g)) + "', horario = '" +
        Database::escape(g.getSchedule()) + "', vagas = " + to_string(g.getCapacity()) +
        ", encerrada = " + to_string(g.isFinished()) + " WHERE codigo = '" + Database::escape(g.getCode()) + "';");
}

// Apaga a turma
void ClassGroupRepository::remove(string code) {
    Database::getInstance().execute("DELETE FROM turmas WHERE codigo = '" + Database::escape(code) + "';");
}

// Carrega todas as turmas do banco
vector<ClassGroup*> ClassGroupRepository::findAll(vector<Discipline*>& disciplines,
                                                  vector<Teacher*>& teachers, vector<Student*>& students) {
    vector<vector<string>> rows = Database::getInstance().query(
        "SELECT codigo, disciplina, professor, semestre, horario, vagas, encerrada FROM turmas;");

    vector<ClassGroup*> groups;
    for (vector<string> row : rows) {
        // Procura a disciplina e o professor da turma nas listas
        Discipline* discipline = nullptr;
        for (Discipline* d : disciplines) {
            if (d->getCode() == row[1]) {
                discipline = d;
            }
        }
        Teacher* teacher = nullptr;
        for (Teacher* t : teachers) {
            if (t->getMatriculaFuncional() == row[2]) {
                teacher = t;
            }
        }

        ClassGroup* g = new ClassGroup(row[0], discipline, teacher, row[3], row[4], stoi(row[5]));

        EnrollmentRepository enrollmentRepo;
        enrollmentRepo.loadInto(*g, students);

        if (row[6] == "1") {
            g->finish();
        }
        groups.push_back(g);
    }
    return groups;
}
