#ifndef SCHOOLDATA_H
#define SCHOOLDATA_H

#include <string>
#include <vector>
#include "Student.h"
#include "Teacher.h"
#include "Discipline.h"
#include "ClassGroup.h"

using namespace std;

struct SchoolData {
    vector<Student*> students;
    vector<Teacher*> teachers;
    vector<Discipline*> disciplines;
    vector<ClassGroup*> groups;
};

// Carrega tudo do banco 
void loadData(SchoolData& data);

// Libera a memória 
void freeData(SchoolData& data);

// Buscas na memória 
Student* findStudent(SchoolData& data, string matricula);
Teacher* findTeacher(SchoolData& data, string matricula);
Discipline* findDiscipline(SchoolData& data, string code);
ClassGroup* findGroup(SchoolData& data, string code);

bool containsIgnoreCase(string text, string piece);

#endif
