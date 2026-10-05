#ifndef TEACHERREPOSITORY_H
#define TEACHERREPOSITORY_H

#include <string>
#include <vector>
#include "Teacher.h"

using namespace std;

// Salva e busca professores no banco (tabela pessoas, tipo = 'professor')
class TeacherRepository {
private:
    vector<Teacher*> search(string condition);

public:
    void insert(Teacher& t);
    void update(Teacher& t);
    void remove(string matricula);

    // As buscas criam os professores com new: quem usar deve dar delete depois
    Teacher* findByMatricula(string matricula);
    vector<Teacher*> findByName(string name);  // name = "" traz todos
};

#endif
