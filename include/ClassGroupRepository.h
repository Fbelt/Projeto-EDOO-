#ifndef CLASSGROUPREPOSITORY_H
#define CLASSGROUPREPOSITORY_H

#include <string>
#include <vector>
#include "ClassGroup.h"
#include "Discipline.h"
#include "Teacher.h"
#include "Student.h"

using namespace std;

// Salva e busca turmas no banco 
class ClassGroupRepository {
public:
    void insert(ClassGroup& group);
    void update(ClassGroup& group);
    void remove(string code);

    vector<ClassGroup*> findAll(vector<Discipline*>& disciplines,
                                vector<Teacher*>& teachers, vector<Student*>& students);
};

#endif
