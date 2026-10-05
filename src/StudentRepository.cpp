#include "StudentRepository.h"
#include "Database.h"

using namespace std;

// Cadastra um aluno novo
void StudentRepository::insert(Student& s) {
    Database::getInstance().execute(
        "INSERT INTO pessoas VALUES ('" + s.getMatricula() + "', 'aluno', '" + s.getName() + "', '" +
        s.getCpf() + "', '" + s.getBirthday() + "', '" + s.getContato() + "', '" + s.getCurso() + "');");
}

// Atualiza os dados do aluno (procura pela matrícula)
void StudentRepository::update(Student& s) {
    Database::getInstance().execute(
        "UPDATE pessoas SET nome = '" + s.getName() + "', cpf = '" + s.getCpf() +
        "', nascimento = '" + s.getBirthday() + "', contato = '" + s.getContato() +
        "', curso = '" + s.getCurso() + "' WHERE matricula = '" + s.getMatricula() + "';");
}

// Apaga o aluno
void StudentRepository::remove(string matricula) {
    Database::getInstance().execute("DELETE FROM pessoas WHERE matricula = '" + matricula + "';");
}

// Busca o aluno pela matrícula (nullptr = não encontrou)
Student* StudentRepository::findByMatricula(string matricula) {
    vector<Student*> found = search("matricula = '" + matricula + "'");
    if (found.size() == 0) {
        return nullptr;
    }
    return found[0];
}

// Busca alunos cujo nome contém o texto (ex: "jo" acha "Joao").
// O % no LIKE significa "qualquer coisa". Com name = "" traz todos.
vector<Student*> StudentRepository::findByName(string name) {
    return search("nome LIKE '%" + name + "%'");
}

// Faz o SELECT com a condição recebida e cria um Student para cada linha
vector<Student*> StudentRepository::search(string condition) {
    vector<vector<string>> rows = Database::getInstance().query(
        "SELECT matricula, nome, cpf, nascimento, contato, curso FROM pessoas "
        "WHERE tipo = 'aluno' AND " + condition + " ORDER BY nome;");

    vector<Student*> students;
    for (vector<string> row : rows) {
        // row[0] = matricula, row[1] = nome, row[2] = cpf,
        // row[3] = nascimento, row[4] = contato, row[5] = curso
        Student* s = new Student(row[1], row[3], row[2], row[0], row[5]);
        s->setContato(row[4]);
        students.push_back(s);
    }
    return students;
}
