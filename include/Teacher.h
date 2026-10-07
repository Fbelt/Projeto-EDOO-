#ifndef TEACHER_H
#define TEACHER_H

#include <string>
#include <vector>
#include "Person.h"

using namespace std;

// Professor: herda de Pessoa, guarda matrícula funcional e disciplinas que pode lecionar
class Teacher : public Person {
private:
    string matriculaFuncional;
    vector<string> disciplinas; // nomes/códigos das disciplinas que o professor pode lecionar

public:
    Teacher(const string& n = "", const string& b = "", const string& c = "",
            const string& mat = "");

    string getMatriculaFuncional() const;
    vector<string> getDisciplinas() const;

    void setMatriculaFuncional(const string& mat);

    // Adiciona uma disciplina que o professor pode lecionar
    void addDisciplina(const string& d);
    // Remove uma disciplina pelo nome/código
    void removeDisciplina(const string& d);

    // Exibe os dados do professor 
    void exibirInfo() const override;
};

#endif
