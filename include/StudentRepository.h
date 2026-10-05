#ifndef STUDENTREPOSITORY_H
#define STUDENTREPOSITORY_H

#include <string>
#include <vector>
#include "Student.h"

using namespace std;

// Salva e busca alunos no banco (tabela pessoas, tipo = 'aluno')
class StudentRepository {
private:
    vector<Student*> search(string condition);

public:
    void insert(Student& s);
    void update(Student& s);
    void remove(string matricula);

    // As buscas criam os alunos com new: quem usar deve dar delete depois
    Student* findByMatricula(string matricula);
    vector<Student*> findByName(string name);  // name = "" traz todos
};

#endif
