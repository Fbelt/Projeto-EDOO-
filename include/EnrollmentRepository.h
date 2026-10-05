#ifndef ENROLLMENTREPOSITORY_H
#define ENROLLMENTREPOSITORY_H

#include <vector>
#include "ClassGroup.h"
#include "Enrollment.h"
#include "Student.h"

using namespace std;

// Salva e carrega as matrículas: qual aluno está em qual turma,
// com as notas e a frequência (tabelas matriculas, notas e frequencia)
class EnrollmentRepository {
public:
    // Salva a matrícula do aluno na turma (se já existia, troca pelos dados novos)
    void save(ClassGroup& group, Enrollment& e);
    // Salva todas as matrículas da turma
    void saveAll(ClassGroup& group);
    // Apaga a matrícula do aluno na turma
    void remove(ClassGroup& group, Student& s);
    // Lê do banco os alunos da turma e matricula eles de novo em "group"
    void loadInto(ClassGroup& group, vector<Student*>& students);
};

#endif
