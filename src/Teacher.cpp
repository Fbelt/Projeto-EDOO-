#include <iostream>
#include "Teacher.h"

using namespace std;

Teacher::Teacher(const string& n, const string& b, const string& c, const string& mat)
    : Person(n, b, c) {
    matriculaFuncional = mat;
}

string Teacher::getMatriculaFuncional() const { return matriculaFuncional; }
vector<string> Teacher::getDisciplinas() const { return disciplinas; }

void Teacher::setMatriculaFuncional(const string& mat) { matriculaFuncional = mat; }

// Adiciona disciplina à lista, evitando duplicatas
void Teacher::addDisciplina(const string& d) {
    for (const string& disc : disciplinas) {
        if (disc == d) return;
    }
    disciplinas.push_back(d);
}

// Remove disciplina da lista pelo nome/código
void Teacher::removeDisciplina(const string& d) {
    for (int i = 0; i < disciplinas.size(); i++) {
        if (disciplinas[i] == d) {
            disciplinas.erase(disciplinas.begin() + i);
            return;
        }
    }
}

// Mostra nome, CPF, contato, matrícula funcional e disciplinas do professor
void Teacher::exibirInfo() const {
    cout << "Professor: " << getName() << endl;
    cout << "CPF: " << getCpf() << endl;
    cout << "Contato: " << getContato() << endl;
    cout << "Matricula funcional: " << matriculaFuncional << endl;
    cout << "Disciplinas: ";
    if (disciplinas.empty()) {
        cout << "nenhuma" << endl;
    } else {
        for (int i = 0; i < disciplinas.size(); i++) {
            if (i > 0) cout << ", ";
            cout << disciplinas[i];
        }
        cout << endl;
    }
}
