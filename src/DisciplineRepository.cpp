#include "DisciplineRepository.h"
#include "Database.h"

using namespace std;

// Devolve a matrícula do professor da disciplina ("" se não tiver professor)
string teacherMatricula(Discipline& d) {
    if (d.getTeacher() == nullptr) {
        return "";
    }
    return d.getTeacher()->getMatriculaFuncional();
}

// Cadastra uma disciplina nova
void DisciplineRepository::insert(Discipline& d) {
    Database::getInstance().execute(
        "INSERT INTO disciplinas VALUES ('" + d.getCode() + "', '" + d.getName() + "', " +
        to_string(d.getWorkload()) + ", '" + d.getSyllabus() + "', " +
        to_string(d.getHasFinalExam()) + ", '" + teacherMatricula(d) + "');");
}

// Atualiza a disciplina (procura pelo código)
void DisciplineRepository::update(Discipline& d) {
    Database::getInstance().execute(
        "UPDATE disciplinas SET nome = '" + d.getName() + "', carga_horaria = " + to_string(d.getWorkload()) +
        ", ementa = '" + d.getSyllabus() + "', professor = '" + teacherMatricula(d) +
        "' WHERE codigo = '" + d.getCode() + "';");
}

// Apaga a disciplina
void DisciplineRepository::remove(string code) {
    Database::getInstance().execute("DELETE FROM disciplinas WHERE codigo = '" + code + "';");
}

// Busca a disciplina pelo código (nullptr = não encontrou)
Discipline* DisciplineRepository::findByCode(string code, vector<Teacher*>& teachers) {
    vector<Discipline*> found = search("codigo = '" + code + "'", teachers);
    if (found.size() == 0) {
        return nullptr;
    }
    return found[0];
}

// Busca disciplinas cujo nome contém o texto. Com name = "" traz todas.
vector<Discipline*> DisciplineRepository::findByName(string name, vector<Teacher*>& teachers) {
    return search("nome LIKE '%" + name + "%'", teachers);
}

// Faz o SELECT com a condição recebida e cria uma Discipline para cada linha
vector<Discipline*> DisciplineRepository::search(string condition, vector<Teacher*>& teachers) {
    vector<vector<string>> rows = Database::getInstance().query(
        "SELECT codigo, nome, carga_horaria, ementa, tem_final, professor FROM disciplinas "
        "WHERE " + condition + " ORDER BY nome;");

    vector<Discipline*> disciplines;
    for (vector<string> row : rows) {
        // stoi transforma texto em número ("60" vira 60)
        Discipline* d = new Discipline(row[0], row[1], stoi(row[2]), row[3], row[4] == "1");

        // Procura o professor na lista pela matrícula
        for (Teacher* t : teachers) {
            if (t->getMatriculaFuncional() == row[5]) {
                d->setTeacher(t);
            }
        }
        disciplines.push_back(d);
    }
    return disciplines;
}
