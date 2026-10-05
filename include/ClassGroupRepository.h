#ifndef CLASSGROUPREPOSITORY_H
#define CLASSGROUPREPOSITORY_H

#include <string>
#include <vector>
#include "ClassGroup.h"
#include "Discipline.h"
#include "Teacher.h"
#include "Student.h"

using namespace std;

// Salva e busca turmas no banco (tabela turmas)
class ClassGroupRepository {
public:
    void insert(ClassGroup& group);
    void update(ClassGroup& group);
    void remove(string code);

    // Carrega todas as turmas, já com os alunos matriculados, notas e frequência.
    // Recebe as listas já carregadas para ligar cada turma à sua disciplina,
    // ao professor e aos alunos. As turmas são criadas com new: dar delete depois
    vector<ClassGroup*> findAll(vector<Discipline*>& disciplines,
                                vector<Teacher*>& teachers, vector<Student*>& students);
};

#endif
