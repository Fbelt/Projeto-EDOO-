#ifndef STUDENT_H
#define STUDENT_H

#include <string>
#include "Person.h"

using namespace std;

// Aluno: herda de Pessoa, guarda matrícula e curso
class Student : public Person {
private:
    string matricula;
    string curso;

public:
    Student(const string& n = "", const string& b = "", const string& c = "",
            const string& mat = "", const string& cur = "");

    string getMatricula() const;
    string getCurso() const;

    void setMatricula(const string& mat);
    void setCurso(const string& cur);

    // Exibe os dados do aluno (sobrescreve Person)
    void exibirInfo() const override;
};

#endif
