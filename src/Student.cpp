#include <iostream>
#include "Student.h"

using namespace std;

Student::Student(const string& n, const string& b, const string& c,
                 const string& mat, const string& cur)
    : Person(n, b, c) {
    matricula = mat;
    curso = cur;
}

string Student::getMatricula() const { return matricula; }
string Student::getCurso() const { return curso; }

void Student::setMatricula(const string& mat) { matricula = mat; }
void Student::setCurso(const string& cur) { curso = cur; }

// Mostra nome, CPF, contato, matrícula e curso do aluno
void Student::exibirInfo() const {
    cout << "Aluno: " << getName() << endl;
    cout << "CPF: " << getCpf() << endl;
    cout << "Contato: " << getContato() << endl;
    cout << "Matricula: " << matricula << endl;
    cout << "Curso: " << curso << endl;
}
