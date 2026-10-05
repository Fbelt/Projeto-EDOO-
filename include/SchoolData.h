#ifndef SCHOOLDATA_H
#define SCHOOLDATA_H

#include <string>
#include <vector>
#include "Student.h"
#include "Teacher.h"
#include "Discipline.h"
#include "ClassGroup.h"

using namespace std;

// Tudo o que o sistema tem, carregado do banco para a memória.
// Os menus mexem nestas listas e depois chamam os repositórios para salvar.
// Os objetos foram criados com new: quem libera a memória é freeData().
struct SchoolData {
    vector<Student*> students;
    vector<Teacher*> teachers;
    vector<Discipline*> disciplines;
    vector<ClassGroup*> groups;
};

// Carrega tudo do banco (ordem: alunos → professores → disciplinas → turmas)
void loadData(SchoolData& data);

// Libera a memória (turmas primeiro, porque elas apontam para os outros)
void freeData(SchoolData& data);

// Buscas na memória (nullptr = não encontrou)
Student* findStudent(SchoolData& data, string matricula);
Teacher* findTeacher(SchoolData& data, string matricula);
Discipline* findDiscipline(SchoolData& data, string code);
ClassGroup* findGroup(SchoolData& data, string code);

// Diz se "text" contém "piece", sem diferenciar maiúscula de minúscula
bool containsIgnoreCase(string text, string piece);

#endif
