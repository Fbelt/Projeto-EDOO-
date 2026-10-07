#ifndef DISCIPLINEREPOSITORY_H
#define DISCIPLINEREPOSITORY_H

#include <string>
#include <vector>
#include "Discipline.h"
#include "Teacher.h"

using namespace std;

// Salva e busca disciplinas no banco 
class DisciplineRepository {
private:
    vector<Discipline*> search(string condition, vector<Teacher*>& teachers);

public:
    void insert(Discipline& d);
    void update(Discipline& d);
    void remove(string code);


    Discipline* findByCode(string code, vector<Teacher*>& teachers);
    vector<Discipline*> findByName(string name, vector<Teacher*>& teachers);  
};

#endif
