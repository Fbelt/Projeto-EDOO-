#ifndef DISCIPLINEREPOSITORY_H
#define DISCIPLINEREPOSITORY_H

#include <string>
#include <vector>
#include "Discipline.h"
#include "Teacher.h"

using namespace std;

// Salva e busca disciplinas no banco (tabela disciplinas)
class DisciplineRepository {
private:
    vector<Discipline*> search(string condition, vector<Teacher*>& teachers);

public:
    void insert(Discipline& d);
    void update(Discipline& d);
    void remove(string code);

    // O banco só guarda a matrícula do professor. Por isso as buscas recebem
    // a lista de professores, para achar o professor certo da disciplina.
    // As buscas criam as disciplinas com new: quem usar deve dar delete depois
    Discipline* findByCode(string code, vector<Teacher*>& teachers);
    vector<Discipline*> findByName(string name, vector<Teacher*>& teachers);  // name = "" traz todas
};

#endif
