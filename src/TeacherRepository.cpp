#include "TeacherRepository.h"
#include "Database.h"

using namespace std;

// Cadastra um professor novo
void TeacherRepository::insert(Teacher& t) {
    Database::getInstance().execute(
        "INSERT INTO pessoas VALUES ('" + Database::escape(t.getMatriculaFuncional()) + "', 'professor', '" +
        Database::escape(t.getName()) + "', '" + Database::escape(t.getCpf()) + "', '" +
        Database::escape(t.getBirthday()) + "', '" + Database::escape(t.getContato()) + "', '');");
}

// Atualiza os dados do professor
void TeacherRepository::update(Teacher& t) {
    Database::getInstance().execute(
        "UPDATE pessoas SET nome = '" + Database::escape(t.getName()) + "', cpf = '" + Database::escape(t.getCpf()) +
        "', nascimento = '" + Database::escape(t.getBirthday()) + "', contato = '" + Database::escape(t.getContato()) +
        "' WHERE matricula = '" + Database::escape(t.getMatriculaFuncional()) + "';");
}

// Apaga o professor
void TeacherRepository::remove(string matricula) {
    Database::getInstance().execute("DELETE FROM pessoas WHERE matricula = '" + Database::escape(matricula) + "';");
}

// Busca o professor pela matrícula
Teacher* TeacherRepository::findByMatricula(string matricula) {
    vector<Teacher*> found = search("matricula = '" + Database::escape(matricula) + "'");
    if (found.size() == 0) {
        return nullptr;
    }
    return found[0];
}

// Busca professores cujo nome contém o texto
vector<Teacher*> TeacherRepository::findByName(string name) {
    return search("nome LIKE '%" + Database::escape(name) + "%'");
}

// Faz o SELECT com a condição recebida e cria um Teacher para cada linha
vector<Teacher*> TeacherRepository::search(string condition) {
    vector<vector<string>> rows = Database::getInstance().query(
        "SELECT matricula, nome, cpf, nascimento, contato FROM pessoas "
        "WHERE tipo = 'professor' AND " + condition + " ORDER BY nome;");

    vector<Teacher*> teachers;
    for (vector<string> row : rows) {
        Teacher* t = new Teacher(row[1], row[3], row[2], row[0]);
        t->setContato(row[4]);
        teachers.push_back(t);
    }
    return teachers;
}
