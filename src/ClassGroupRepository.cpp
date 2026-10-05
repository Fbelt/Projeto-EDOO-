#include "ClassGroupRepository.h"
#include "EnrollmentRepository.h"
#include "Database.h"

using namespace std;

// Devolve a matrícula do professor da turma ("" se não tiver professor)
string teacherMatricula(ClassGroup& g) {
    if (g.getTeacher() == nullptr) {
        return "";
    }
    return g.getTeacher()->getMatriculaFuncional();
}

// Cadastra uma turma nova (os alunos dela são salvos pelo EnrollmentRepository)
void ClassGroupRepository::insert(ClassGroup& g) {
    Database::getInstance().execute(
        "INSERT INTO turmas VALUES ('" + g.getCode() + "', '" + g.getDiscipline()->getCode() + "', '" +
        teacherMatricula(g) + "', '" + g.getSemester() + "', '" + g.getSchedule() + "', " +
        to_string(g.getCapacity()) + ", " + to_string(g.isFinished()) + ");");
}

// Atualiza a turma (procura pelo código). Usar, por exemplo, depois de encerrar a turma
void ClassGroupRepository::update(ClassGroup& g) {
    Database::getInstance().execute(
        "UPDATE turmas SET professor = '" + teacherMatricula(g) + "', horario = '" + g.getSchedule() +
        "', vagas = " + to_string(g.getCapacity()) + ", encerrada = " + to_string(g.isFinished()) +
        " WHERE codigo = '" + g.getCode() + "';");
}

// Apaga a turma
void ClassGroupRepository::remove(string code) {
    Database::getInstance().execute("DELETE FROM turmas WHERE codigo = '" + code + "';");
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

        // Coloca os alunos de volta na turma. Isso tem que vir antes do finish(),
        // porque uma turma encerrada não aceita matrícula
        EnrollmentRepository enrollmentRepo;
        enrollmentRepo.loadInto(*g, students);

        if (row[6] == "1") {
            g->finish();
        }
        groups.push_back(g);
    }
    return groups;
}
