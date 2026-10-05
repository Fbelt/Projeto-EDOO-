#include <iostream>
#include "PersonFactory.h"

using namespace std;

// Retorna new Student ou new Teacher conforme o tipo
Person* PersonFactory::criar(const string& tipo, const string& nome, const string& nascimento,
                              const string& cpf, const string& extra1, const string& extra2) {
    if (tipo == "aluno") {
        return new Student(nome, nascimento, cpf, extra1, extra2);
    }
    if (tipo == "professor") {
        return new Teacher(nome, nascimento, cpf, extra1);
    }
    cout << "Tipo invalido: use 'aluno' ou 'professor'" << endl;
    return nullptr;
}
