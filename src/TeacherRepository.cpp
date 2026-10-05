#include "TeacherRepository.h"
#include "Database.h"

using namespace std;

// Cadastra um professor novo (professor não tem curso, então fica '')
void TeacherRepository::insert(Teacher& t) {
    Database::getInstance().execute(
        "INSERT INTO pessoas VALUES ('" + t.getMatriculaFuncional() + "', 'professor', '" + t.getName() + "', '" +
        t.getCpf() + "', '" + t.getBirthday() + "', '" + t.getContato() + "', '');");
}

// Atualiza os dados do professor (procura pela matrícula)
void TeacherRepository::update(Teacher& t) {
    Database::getInstance().execute(
        "UPDATE pessoas SET nome = '" + t.getName() + "', cpf = '" + t.getCpf() +
        "', nascimento = '" + t.getBirthday() + "', contato = '" + t.getContato() +
        "' WHERE matricula = '" + t.getMatriculaFuncional() + "';");
}

// Apaga o professor
void TeacherRepository::remove(string matricula) {
    Database::getInstance().execute("DELETE FROM pessoas WHERE matricula = '" + matricula + "';");
}

// Busca o professor pela matrícula (nullptr = não encontrou)
Teacher* TeacherRepository::findByMatricula(string matricula) {
    vector<Teacher*> found = search("matricula = '" + matricula + "'");
    if (found.size() == 0) {
        return nullptr;
    }
    return found[0];
}

// Busca professores cujo nome contém o texto. Com name = "" traz todos.
vector<Teacher*> TeacherRepository::findByName(string name) {
    return search("nome LIKE '%" + name + "%'");
}

// Faz o SELECT com a condição recebida e cria um Teacher para cada linha
vector<Teacher*> TeacherRepository::search(string condition) {
    vector<vector<string>> rows = Database::getInstance().query(
        "SELECT matricula, nome, cpf, nascimento, contato FROM pessoas "
        "WHERE tipo = 'professor' AND " + condition + " ORDER BY nome;");

    vector<Teacher*> teachers;
    for (vector<string> row : rows) {
        // row[0] = matricula, row[1] = nome, row[2] = cpf, row[3] = nascimento, row[4] = contato
        Teacher* t = new Teacher(row[1], row[3], row[2], row[0]);
        t->setContato(row[4]);
        teachers.push_back(t);
    }
    return teachers;
}
