#ifndef PERSONFACTORY_H
#define PERSONFACTORY_H

#include <string>
#include "Person.h"
#include "Student.h"
#include "Teacher.h"

using namespace std;

// Factory de Person: cria Aluno ou Professor a partir do tipo informado
class PersonFactory {
public:
    // tipo "aluno"     → new Student(nome, nascimento, cpf, extra1=matricula, extra2=curso)
    // tipo "professor" → new Teacher(nome, nascimento, cpf, extra1=matriculaFuncional)
    // Quem chamar é responsável por deletar o ponteiro retornado
    static Person* criar(const string& tipo, const string& nome, const string& nascimento,
                         const string& cpf, const string& extra1 = "", const string& extra2 = "");
};

#endif
