#include "StudentRepository.h"
#include "Database.h"

using namespace std;

// Cadastra um aluno novo
void StudentRepository::insert(Student& s) {
    Database::getInstance().execute(
        "INSERT INTO pessoas VALUES ('" + Database::escape(s.getMatricula()) + "', 'aluno', '" +
        Database::escape(s.getName()) + "', '" + Database::escape(s.getCpf()) + "', '" +
        Database::escape(s.getBirthday()) + "', '" + Database::escape(s.getContato()) + "', '" +
        Database::escape(s.getCurso()) + "');");
}

// Atualiza os dados do aluno
void StudentRepository::update(Student& s) {
    Database::getInstance().execute(
        "UPDATE pessoas SET nome = '" + Database::escape(s.getName()) + "', cpf = '" + Database::escape(s.getCpf()) +
        "', nascimento = '" + Database::escape(s.getBirthday()) + "', contato = '" + Database::escape(s.getContato()) +
        "', curso = '" + Database::escape(s.getCurso()) + "' WHERE matricula = '" + Database::escape(s.getMatricula()) + "';");
}

// Apaga o aluno
void StudentRepository::remove(string matricula) {
    Database::getInstance().execute("DELETE FROM pessoas WHERE matricula = '" + Database::escape(matricula) + "';");
}

// Busca o aluno pela matrícula
Student* StudentRepository::findByMatricula(string matricula) {
    vector<Student*> found = search("matricula = '" + Database::escape(matricula) + "'");
    if (found.size() == 0) {
        return nullptr;
    }
    return found[0];
}

// Busca alunos cujo nome contém o texto 
vector<Student*> StudentRepository::findByName(string name) {
    return search("nome LIKE '%" + Database::escape(name) + "%'");
}

// Faz o SELECT com a condição recebida e cria um Student para cada linha
vector<Student*> StudentRepository::search(string condition) {
    vector<vector<string>> rows = Database::getInstance().query(
        "SELECT matricula, nome, cpf, nascimento, contato, curso FROM pessoas "
        "WHERE tipo = 'aluno' AND " + condition + " ORDER BY nome;");

    vector<Student*> students;
    for (vector<string> row : rows) {
        Student* s = new Student(row[1], row[3], row[2], row[0], row[5]);
        s->setContato(row[4]);
        students.push_back(s);
    }
    return students;
}
