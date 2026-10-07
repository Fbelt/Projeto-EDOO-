#include <iostream>
#include "PersonCRUD.h"

using namespace std;

// Destrutor: apaga os objetos criados com new
PersonCRUD::~PersonCRUD() {
    for (Student* a : alunos) delete a;
    for (Teacher* p : professores) delete p;
}

// Cria e cadastra um novo aluno 
void PersonCRUD::adicionarAluno(const string& nome, const string& nascimento,
                                 const string& cpf, const string& matricula, const string& curso) {
    if (buscarAluno(matricula) != nullptr) {
        cout << "Aluno com matricula " << matricula << " ja existe" << endl;
        return;
    }
    alunos.push_back(new Student(nome, nascimento, cpf, matricula, curso));
}

// Busca aluno pela matrícula 
Student* PersonCRUD::buscarAluno(const string& matricula) {
    for (Student* a : alunos) {
        if (a->getMatricula() == matricula) return a;
    }
    return nullptr;
}

// Remove aluno pelo número de matrícula
bool PersonCRUD::removerAluno(const string& matricula) {
    for (int i = 0; i < alunos.size(); i++) {
        if (alunos[i]->getMatricula() == matricula) {
            delete alunos[i];
            alunos.erase(alunos.begin() + i);
            return true;
        }
    }
    cout << "Aluno nao encontrado" << endl;
    return false;
}

// Lista todos os alunos cadastrados
void PersonCRUD::listarAlunos() const {
    if (alunos.empty()) {
        cout << "Nenhum aluno cadastrado" << endl;
        return;
    }
    for (Student* a : alunos) {
        a->exibirInfo();
        cout << "---" << endl;
    }
}

vector<Student*>& PersonCRUD::getAlunos() { return alunos; }

// Cria e cadastra um novo professor 
void PersonCRUD::adicionarProfessor(const string& nome, const string& nascimento,
                                     const string& cpf, const string& matricula) {
    if (buscarProfessor(matricula) != nullptr) {
        cout << "Professor com matricula " << matricula << " ja existe" << endl;
        return;
    }
    professores.push_back(new Teacher(nome, nascimento, cpf, matricula));
}

// Busca professor pela matrícula funcional 
Teacher* PersonCRUD::buscarProfessor(const string& matricula) {
    for (Teacher* p : professores) {
        if (p->getMatriculaFuncional() == matricula) return p;
    }
    return nullptr;
}

// Remove professor pela matrícula funcional
bool PersonCRUD::removerProfessor(const string& matricula) {
    for (int i = 0; i < professores.size(); i++) {
        if (professores[i]->getMatriculaFuncional() == matricula) {
            delete professores[i];
            professores.erase(professores.begin() + i);
            return true;
        }
    }
    cout << "Professor nao encontrado" << endl;
    return false;
}

// Lista todos os professores cadastrados
void PersonCRUD::listarProfessores() const {
    if (professores.empty()) {
        cout << "Nenhum professor cadastrado" << endl;
        return;
    }
    for (Teacher* p : professores) {
        p->exibirInfo();
        cout << "---" << endl;
    }
}

vector<Teacher*>& PersonCRUD::getProfessores() { return professores; }
